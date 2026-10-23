// src/services/searchService.js
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding } = require('./geminiService');

/**
 * User text ka embedding banakar MongoDB Atlas se top relevant guidelines dhoondhta hai.
 */
async function findRelevantGuidelines(userText) {
    try {
        console.log('🔍 Generating embedding for user input...');
        const queryEmbedding = await generateEmbedding(userText);

        console.log('🔎 Running MongoDB Atlas Vector Search...');
        // MongoDB Atlas Vector Search Aggregation Pipeline
        const relevantChunks = await GuidelineChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Wahi index name jo Atlas mein banaya hai
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 50,
                    limit: 3 // Top 3 sabse match hone wale rules nikal lo
                }
            },
            {
                $project: {
                    _id: 0,
                    documentTitle: 1,
                    chunkText: 1,
                    score: { $meta: "vectorSearchScore" } // Relevance score
                }
            }
        ]);

        return relevantChunks;
    } catch (error) {
        console.error('❌ Vector Search Error:', error);
        throw error;
    }
}

module.exports = { findRelevantGuidelines };