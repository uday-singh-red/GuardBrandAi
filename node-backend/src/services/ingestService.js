// src/services/ingestService.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding } = require('./geminiService');
const { createChunks } = require('../utils/chunker');

/**
 * PDF file ko process karke chunks banata hai aur MongoDB mein save karta hai.
 * @param {string} filePath - Server par upload hui PDF file ka path
 * @param {string} documentTitle - Document ka naam (e.g., "Brand Guidelines 2026")
 */
async function processAndIngestPDF(filePath, documentTitle) {
    try {
        console.log(`📄 Reading PDF file: ${filePath}...`);
        
        // 1. PDF file ko read karo
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text could be extracted from the PDF.");
        }

        console.log(`✅ Text extracted successfully. Total characters: ${extractedText.length}`);

        // 2. Chunks aur Overlap banao (e.g., Chunk size: 500 chars, Overlap: 100 chars)
        const textChunks = createChunks(extractedText, 500, 100);
        console.log(`✂️ Generated ${textChunks.length} chunks with overlap.`);

        let savedCount = 0;

        // 3. Har chunk ke liye embedding banao aur DB mein save karo
        for (const [index, chunkText] of textChunks.entries()) {
            console.log(`🔄 Processing chunk ${index + 1} of ${textChunks.length}...`);
            
            const embedding = await generateEmbedding(chunkText);

            await GuidelineChunk.create({
                documentTitle: documentTitle,
                chunkText: chunkText,
                embedding: embedding
            });

            savedCount++;
        }

        // 4. Cleanup: Uploaded local temporary file ko delete kar do
        fs.unlinkSync(filePath);

        console.log(` Successfully ingested ${savedCount} chunks into MongoDB!`);
        return { success: true, totalChunks: savedCount };

    } catch (error) {
        console.error('Ingestion Error:', error.message);
        // Agar file exist karti hai toh error aane par bhi delete kar do taaki space na bhare
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw error;
    }
}

module.exports = { processAndIngestPDF };