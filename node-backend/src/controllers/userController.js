// src/controllers/userController.js
const { parseUserInput } = require('../utils/inputParser');
const { findRelevantGuidelines } = require('../services/searchService');

exports.auditUserContent = async (req, res) => {
    try {
        // Step 1: Parse input (Text, .txt file, or PDF)
        const userText = await parseUserInput(req);

        // Step 2: Vector search se relevant guidelines dhoondho
        const matchedGuidelines = await findRelevantGuidelines(userText);

        if (matchedGuidelines.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No matching company guidelines found in the database.',
                matchedGuidelines: [],
                verdict: 'APPROVED (No rules found to compare)'
            });
        }

        // TODO: Step 3 mein yahan Gemini LLM call karenge jo matchedGuidelines aur userText ko compare karega

        return res.status(200).json({
            success: true,
            userTextPreview: userText.slice(0, 150) + '...', // Preview ke liye
            matchedGuidelines: matchedGuidelines
        });

    } catch (error) {
        console.error('❌ Audit Controller Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};