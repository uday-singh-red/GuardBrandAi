const { parseUserInput } = require('../utils/inputParser');
const { auditContentWithGemini } = require('../services/auditService');

async function handleAuditRequest(req, res) {
    try {
        
        console.log('📥 Incoming audit request received...');

        // 1. Frontend se header mein aayi hui custom key ya fallback to .env
    const userApiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;


    if (!userApiKey) {
      return res.status(400).json({
        success: false,
        message: 'Gemini API key is missing. Please enter your key in the top banner or configure GEMINI_API_KEY in .env'
      });
    }

        // 1. User input parse karo (chahe file ho ya text)
        const userText = await parseUserInput(req);

        // 2. Gemini audit service ko call karo
        const result = await auditContentWithGemini(userText,userApiKey);

        // 3. Response client ko bhej do
        return res.status(200).json({
            success: true,
            message: 'Audit completed successfully!',
            data: result
        });

    } catch (error) {
        console.error('Controller Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = { handleAuditRequest };