// src/utils/inputParser.js
const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * User input ko parse karta hai chahe wo direct text ho, .txt file ho, ya .pdf file ho.
 */
async function parseUserInput(req) {
    let rawText = '';

    // 1. Agar user ne multipart/form-data ke through file upload ki hai
    if (req.file) {
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        try {
            if (mimeType === 'application/pdf') {
                console.log('📄 Parsing uploaded PDF file...');
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                rawText = pdfData.text;
            } else if (mimeType === 'text/plain') {
                console.log('📝 Reading uploaded Text (.txt) file...');
                rawText = fs.readFileSync(filePath, 'utf8');
            } else {
                throw new Error('Unsupported file format. Please upload a PDF or TXT file.');
            }
        } finally {
            // Cleanup: File read karne ke baad server se delete kar do
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } 
    // 2. Agar user ne JSON body mein seedha text bheja hai
    else if (req.body && req.body.blogText) {
        console.log('💬 Processing direct text input...');
        rawText = req.body.blogText;
    }

    if (!rawText || rawText.trim().length === 0) {
        throw new Error('No content found to audit. Please provide text or upload a file.');
    }

    return rawText.trim();
}

module.exports = { parseUserInput };