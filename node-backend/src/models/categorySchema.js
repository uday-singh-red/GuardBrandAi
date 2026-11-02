const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  categoryName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound Index: Ek user ke andar duplicate category names na ho aur query fast ho
categorySchema.index({ userId: 1, categoryName: 1 });

module.exports = mongoose.model('Category', categorySchema);