// src/controllers/ragController.js
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding, findRelevantGuidelines, auditWithGeminiLLM } = require('../services/geminiService');

// 1. Admin Ingestion: Upload & Chunk Guidelines
exports.uploadGuideline = async (req, res) => {
    try {
        const { title, content } = req.body; // content can be text or parsed PDF text

        if (!title || !content) {
            return res.status(400).json({ success: false, error: 'Title and content are required.' });
        }

        console.log(`📚 Processing guideline ingestion: "${title}"`);

        // Simple sentence/paragraph chunking (splitting by newlines or full stops)
        const chunks = content.split('\n').filter(chunk => chunk.trim().length > 10);

        for (const chunk of chunks) {
            // Generate embedding for each chunk
            const embedding = await generateEmbedding(chunk);

            // Save chunk + vector to MongoDB
            await GuidelineChunk.create({
                documentTitle: title,
                chunkText: chunk,
                embedding: embedding
            });
        }

        return res.status(200).json({
            success: true,
            message: `Successfully indexed guideline into Vector DB with ${chunks.length} chunks.`
        });

    } catch (error) {
        console.error('❌ Ingestion Controller Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error during guideline ingestion.' });
    }
};

// 2. User Audit: Retrieve via Vector Search & Check via LLM
exports.auditUserPost = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text content is required for audit.' });
        }

        console.log(`🔍 Running RAG Vector Search for user text...`);

        // Step 1: Vector Search (Retrieve relevant rules from MongoDB)
        const relevantRules = await findRelevantGuidelines(text);

        if (relevantRules.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No matching company guidelines found in database. Default pass.',
                data: { status: 'PASSED', complianceScore: '100/100', violations: [] }
            });
        }

        console.log(`🎯 Retrieved ${relevantRules.length} relevant rules. Passing to LLM...`);

        // Step 2: LLM Audit Generation
        const auditReport = await auditWithGeminiLLM(text, relevantRules);

        return res.status(200).json({
            success: true,
            message: 'RAG Audit completed successfully',
            data: {
                retrievedRulesCount: relevantRules.length,
                ...auditReport
            }
        });

    } catch (error) {
        console.error('❌ User Audit Controller Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error during RAG audit.' });
    }
};