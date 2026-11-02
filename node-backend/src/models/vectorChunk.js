const mongoose = require('mongoose');

const vectorChunkSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true, 
    index: true 
  },
  textChunk: { 
    type: String, 
    required: true 
  },
  embedding: { 
    type: [Number], 
    required: true // 768 dimensions array from Google GenAI
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound Index: Fast filtering ke liye
vectorChunkSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('VectorChunk', vectorChunkSchema);