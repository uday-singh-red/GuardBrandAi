// src/controllers/auditController.js
const fs = require('fs');

exports.processAuditFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded for audit.' });
        }

        console.log(`📦 File received in controller: ${req.file.originalname}`);
        const filePath = req.file.path;

        // TODO: Yahan baad mein hum Gemini API ya processing logic call karenge

        const mockAuditResult = {
            fileName: req.file.originalname,
            status: "Success",
            complianceScore: "96/100",
            checks: {
                textCompliance: "Passed - No banned words found.",
                colorConsistency: "Passed - Matches brand palette."
            }
        };

        // Clean up temp file after processing
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Temp file cleaned: ${req.file.originalname}`);
            }
        }, 1500);

        return res.status(200).json({
            success: true,
            message: "Audit processed successfully by controller",
            data: mockAuditResult
        });

    } catch (error) {
        console.error('❌ Controller Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error in audit controller' });
    }
};