// src/models/GuidelineChunk.js
const mongoose = require('mongoose');

const guidelineChunkSchema = new mongoose.Schema({
    documentTitle: { type: String, required: true },
    chunkText: { type: String, required: true },
    // Vector embedding array (Gemini standard embedding size is 768 dimensions)
    embedding: { type: [Number], required: true }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuidelineChunk', guidelineChunkSchema);