// src/services/geminiRagService.js
const { GoogleGenAI } = require('@google/genai');
const GuidelineChunk = require('../models/GuidelineChunk');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateEmbedding = async (text,userKey) => {
    const api = new GoogleGenAI({apiKey:userKey || process.env.GEMINI_API_KEY  });
    try {
        const response = await api.models.embedContent({
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
const auditWithGeminiLLM = async (prompt,userApiKey) => {

    try {

        const Api = new GoogleGenAI({apiKey:userApiKey})

        const response = await Api.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json" 
            }
        });

        console.log("response a gaya")
        let rawText = response.text.trim();

        console.log(rawText);

        rawText = response.text || response.candidates[0].content.parts[0].text;

        // 1. Agar markdown code blocks hain toh unhe hatao
        if (rawText.includes('```json')) {
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (rawText.includes('```')) {
            rawText = rawText.replace(/```/g, '').trim();
        }

        // 2. Fallback: Agar phir bhi extra text/headings aa rahi hain, toh sirf pehle '{' aur akhri '}' ke beech ka hissa uthao
        const firstOpenBrace = rawText.indexOf('{');
        const lastCloseBrace = rawText.lastIndexOf('}');
        
        if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
            rawText = rawText.substring(firstOpenBrace, lastCloseBrace + 1);
        }

        return JSON.parse(rawText);
    } catch (error) {
        console.error('❌ LLM Audit Error:', error.message);
        throw new Error('Failed to generate audit report.');
    }
};

module.exports = { generateEmbedding, findRelevantGuidelines, auditWithGeminiLLM };