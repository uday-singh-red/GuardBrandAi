const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding, auditWithGeminiLLM } = require('./geminiService'); // Maankar chal rahe hain ki geminiService mein callGeminiAPI hai

async function auditContentWithGemini(userText,userApiKey) {
    try {
        console.log('🔍 Generating embedding for user input/blog...');
        const userEmbedding = await generateEmbedding(userText);

        console.log('🔎 Searching relevant guideline chunks in MongoDB Atlas Vector Search...');
        // MongoDB Atlas Vector Search aggregation pipeline
        const vectorSearchResults = await GuidelineChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Atlas par jo index banaya hai uska naam
                    path: "embedding",
                    queryVector: userEmbedding,
                    numCandidates: 50,
                    limit: 5 // Top 5 most relevant chunks uthao
                }
            },
            {
                $project: {
                    documentTitle: 1,
                    chunkText: 1,
                    score: { $meta: "vectorSearchScore" } // Similarity score
                }
            }
        ]);

        if (!vectorSearchResults || vectorSearchResults.length === 0) {
            throw new Error("No relevant compliance guidelines found in the database.");
        }

        // Chunks ko ek context string mein combine karo
        const contextText = vectorSearchResults
            .map((chunk, index) => `[Source ${index + 1} - Score: ${chunk.score.toFixed(2)}]:\n${chunk.chunkText}`)
            .join('\n\n');

        console.log(`✅ Found ${vectorSearchResults.length} relevant guideline chunks.`);

        // Gemini ke liye prompt taiyar karo
        const prompt = `
            You are an expert AI Compliance Auditor. Your job is to audit the given user content/blog against the official guidelines provided below.

            ### Official Guidelines Context:
            ${contextText}

            ### User Content to Audit:
            ${userText}

            ### Instructions:
            1. Carefully compare the user content against the official guidelines.
            2. Identify any policy violations, discrepancies, or unsafe claims.
            3. You MUST return your response STRICTLY as a valid JSON object matching the exact keys specified below. Do not include any extra text or conversational markdown outside the JSON structure.

            ### Required JSON Output Structure:
            {
            "audit_summary": "Write a clear, concise summary paragraph detailing the overall assessment of the content.",
            "compliance_status": "Non-Compliant" (or "Compliant" if no violations),
            "compliance_score": 0 to 100 (as a number),
            "violations": [
                {
                "claim": "The exact sentence or claim extracted from user content that violates the guidelines",
                "guideline_reference": "The source document or rule reference name",
                "explanation": "Clear explanation of why this claim violates the guidelines",
                "correction": "The specific corrected text or safe alternative adhering to guidelines"
                }
            ],
            "recommendations": [
                "Actionable step 1 to improve compliance",
                "Actionable step 2 to improve compliance"
            ],
            "unverified_or_out_of_scope_claims": [
                {
                "claim": "Claim that could not be verified from guidelines",
                "note": "Reason why it needs additional review"
                }
            ]
            }
            `;

        console.log('🤖 Sending prompt to Gemini API for audit report...');
        const auditResponse = await auditWithGeminiLLM(prompt,userApiKey);

        return{
            success: true,
            auditReport: auditResponse,
            relevantChunks: vectorSearchResults
        };

    } catch (error) {
        console.error('Audit Service Error:', error);
        throw error;
    }
}

module.exports = { auditContentWithGemini };