// src/controllers/userController.js (Temporary Debug Version - No Gemini)
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding } = require('../services/geminiService');

exports.auditUserBlog = async (req, res) => {
    try {
        const { blogText } = req.body;

        if (!blogText) {
            return res.status(400).json({ success: false, error: 'Blog text is required.' });
        }

        console.log(`🔍 Testing Vector Search for text: "${blogText}"`);

        // 1. User ke text ka embedding banao (Yeh Gemini ka embedding API hai, LLM generation nahi)
        const queryVector = await generateEmbedding(blogText);

        // 2. MongoDB Atlas Vector Search run karo
        const relevantRules = await GuidelineChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryVector,
                    numCandidates: 10,
                    limit: 3 // Top 3 matching rules
                }
            },
            {
                $project: {
                    documentTitle: 1,
                    chunkText: 1,
                    score: { $meta: "vectorSearchScore" } // Yeh similarity score batayega (0 se 1 ke beech)
                }
            }
        ]);

        // 3. Seedha retrieved rules return kar do bina Gemini ke
        return res.status(200).json({
            success: true,
            message: "Gemini bypassed. Showing raw vector search results:",
            matchedCount: relevantRules.length,
            retrievedRules: relevantRules
        });

    } catch (error) {
        console.error('❌ Vector Search Test Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};