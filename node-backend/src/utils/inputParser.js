const fs = require('fs');
const PDFParser = require('pdf2json');

/**
 * Safe PDF text extraction helper for user input audits
 */
function parsePDFFile(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataError", (errData) => {
            reject(new Error(errData.parserError || "PDF parsing failed in inputParser"));
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
                console.log('📄 Parsing uploaded PDF file with pdf2json...');
                rawText = await parsePDFFile(filePath);
            } else if (mimeType === 'text/plain') {
                console.log('📝 Reading uploaded Text (.txt) file...');
                rawText = fs.readFileSync(filePath, 'utf8');
            } else {
                throw new Error('Unsupported file format. Please upload a PDF or TXT file.');
            }
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } 
    // 2. Agar user ne JSON body mein seedha text bheja hai (Fixed condition!)
    else if (req.body && (req.body.content || req.body.blogText)) {
        console.log('💬 Processing direct text input...');
        rawText = req.body.content || req.body.blogText; // Dono mein se jo bhi mil jaye
    }

    if (!rawText || rawText.trim().length === 0) {
        throw new Error('No content found to audit. Please provide text or upload a file.');
    }

    return rawText.trim();
}

module.exports = { parseUserInput };