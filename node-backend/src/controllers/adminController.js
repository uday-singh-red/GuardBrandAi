const fs = require('fs');
const GuidelineChunk = require('../models/GuidelineChunk');
const { generateEmbedding } = require('../services/geminiService');

exports.uploadAndEmbedFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const title = req.body.title || req.file.originalname;
        const filePath = req.file.path;

        console.log(`📂 Reading uploaded file: ${req.file.originalname}`);

        // File ka text read karo
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Chunks mein todo
        const chunks = fileContent.split('\n').filter(chunk => chunk.trim().length > 10);
        let savedCount = 0;

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            await GuidelineChunk.create({
                documentTitle: title,
                chunkText: chunk,
                embedding: embedding
            });
            savedCount++;
        }

        // Temp file delete karo
        fs.unlinkSync(filePath);

        return res.status(200).json({
            success: true,
            message: `File processed! Saved ${savedCount} vector chunks to MongoDB.`
        });

    } catch (error) {
        console.error('❌ File Upload Error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to process file embeddings.' });
    }
};