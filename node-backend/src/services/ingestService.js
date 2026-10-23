const fs = require('fs');
const PDFParser = require('pdf2json');
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding } = require('./geminiService');
const { createChunks } = require('../utils/chunker');

/**
 * Safe PDF text extraction using pdf2json with URI error protection
 */
function extractTextFromPDF(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text extraction mode

        pdfParser.on("pdfParser_dataError", (errData) => {
            reject(new Error(errData.parserError || "PDF parsing failed"));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            try {
                let extractedText = "";
                if (pdfData && pdfData.Pages) {
                    pdfData.Pages.forEach((page) => {
                        page.Texts.forEach((textObj) => {
                            if (textObj.R && textObj.R[0] && textObj.R[0].T) {
                                let rawText = textObj.R[0].T;
                                try {
                                    // Safe decode to prevent URI malformed crashes on special symbols/percentages
                                    extractedText += decodeURIComponent(rawText) + " ";
                                } catch (e) {
                                    extractedText += rawText + " ";
                                }
                            }
                        });
                    });
                }
                resolve(extractedText.trim());
            } catch (err) {
                reject(err);
            }
        });

        pdfParser.loadPDF(filePath);
    });
}

/**
 * PDF file ko process karke chunks banata hai aur MongoDB mein bulk save karta hai.
 */
async function processAndIngestPDF(filePath, documentTitle) {
    try {
        console.log(`📄 Reading PDF file with pdf2json: ${filePath}...`);
        
        const extractedText = await extractTextFromPDF(filePath);

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text could be extracted from the PDF.");
        }

        console.log(`✅ Text extracted successfully. Total characters: ${extractedText.length}`);

        // Chunks aur Overlap banao (Chunk size: 500 chars, Overlap: 100 chars)
        const textChunks = createChunks(extractedText, 500, 100);
        console.log(`✂️ Generated ${textChunks.length} chunks with overlap.`);

        let allChunkDocuments = [];
        const BATCH_SIZE = 5; // Parallel processing batch size

        // Batches mein parallel embeddings generate karo
        for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
            const batch = textChunks.slice(i, i + BATCH_SIZE);
            console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(textChunks.length / BATCH_SIZE)}...`);

            const embeddingPromises = batch.map(async (chunkText) => {
                const embedding = await generateEmbedding(chunkText);
                return {
                    documentTitle: documentTitle,
                    chunkText: chunkText,
                    embedding: embedding
                };
            });

            const batchResults = await Promise.all(embeddingPromises);
            allChunkDocuments.push(...batchResults);
        }

        // MongoDB mein bulk insert
        console.log(`💾 Saving ${allChunkDocuments.length} chunks to MongoDB Atlas...`);
        await GuidelineChunk.insertMany(allChunkDocuments);

        // Temporary local file cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.log(`🎉 Successfully ingested ${allChunkDocuments.length} chunks into MongoDB!`);
        return { success: true, totalChunks: allChunkDocuments.length };

    } catch (error) {
        console.error('Ingestion Error:', error.message);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
}

module.exports = { processAndIngestPDF };