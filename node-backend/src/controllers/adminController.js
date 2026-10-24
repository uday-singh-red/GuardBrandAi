
// src/controllers/adminController.js
const { processAndIngestPDF } = require('../services/ingestService');

exports.uploadGuidelinePDF = async (req, res) => {
    try {

        const customApiKey = req.headers['x-api-key'] || '';
        // Check karo ki file aayi hai ya nahi
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF file uploaded. Please attach a PDF under the "pdf" field.' 
            });
        }

        const filePath = req.file.path; // Multer ne jahan file save ki hai
        const documentTitle = req.body.title || req.file.originalname;

        console.log(` Processing upload request for: ${documentTitle}`);

        // Ingestion service ko call karo jo text nikal kar chunks aur embeddings banayegi
        const result = await processAndIngestPDF(filePath, documentTitle,customApiKey);

        return res.status(200).json({
            success: true,
            message: 'PDF successfully processed, chunked, and stored in vector database!',
            data: result
        });

    } catch (error) {
        console.error(' Admin Upload Controller Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error during PDF ingestion.' 
        });
    }
};