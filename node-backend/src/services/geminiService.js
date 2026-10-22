// src/services/geminiRagService.js
const { GoogleGenAI } = require('@google/genai');
const GuidelineChunk = require('../models/GuidelineChunk');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateEmbedding = async (text) => {
    try {
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-2', // Official current embedding model
            contents: text,
        });

        // Response se embedding values nikalna
        if (response && response.embeddings && response.embeddings.length > 0) {
            return response.embeddings[0].values;
        } else {
            throw new Error('No embeddings returned from Gemini API.');
        }
    } catch (error) {
        console.error('❌ Embedding Generation Error:', error.message);
        throw error; // Error throw karna zaroori hai taaki pata chale agar fail ho
    }
};

// 2. Function to perform Vector Search in MongoDB
const findRelevantGuidelines = async (userQueryText) => {
    try {
        // Step A: Convert user query into vector embedding
        const queryVector = await generateEmbedding(userQueryText);

        // Step B: MongoDB Atlas Vector Search Aggregation Pipeline
        const vectorSearchResults = await GuidelineChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Ye index MongoDB Atlas UI par banana padega
                    path: "embedding",
                    queryVector: queryVector,
                    numCandidates: 50,
                    limit: 3 // Top 3 most relevant rules nikal kar dega
                }
            },
            {
                $project: {
                    documentTitle: 1,
                    chunkText: 1,
                    score: { $meta: "vectorSearchScore" } // Relevance score
                }
            }
        ]);

        return vectorSearchResults;
    } catch (error) {
        console.error(' Vector Search Error:', error.message);
        throw new Error('Failed to retrieve guidelines from vector database.');
    }
};

// 3. Function to Audit User Text using Retrieved Guidelines + Gemini LLM
const auditWithGeminiLLM = async (userText, retrievedRules) => {
    try {
        // Format retrieved rules into a context string
        const contextText = retrievedRules.map(r => `- ${r.chunkText}`).join('\n');

        const prompt = `
        You are GuardBrand AI, an enterprise brand compliance officer.
        Analyze the following user text against the official company guidelines provided below.

        OFFICIAL GUIDELINES (Retrieved via RAG):
        ${contextText}

        USER TEXT TO AUDIT:
        "${userText}"

        Task: Check if the user text violates any of the official guidelines. 
        Respond strictly in JSON format with the following keys:
        - status: "PASSED" or "FLAGGED"
        - complianceScore: a score out of 100 (e.g. "90/100")
        - violations: array of strings describing violations (empty if passed)
        - recommendation: short feedback for the user
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Clean and parse JSON response from LLM
        let rawText = response.text.trim();
        if (rawText.startsWith('```json')) {
            rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
        }

        return JSON.parse(rawText);
    } catch (error) {
        console.error('❌ LLM Audit Error:', error.message);
        throw new Error('Failed to generate audit report.');
    }
};

module.exports = { generateEmbedding, findRelevantGuidelines, auditWithGeminiLLM };