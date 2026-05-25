const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required'],
      trim: true,
    },
    embedding: {
      type: [Number], // Storing the 768-dimension semantic vector
      required: [true, 'Embedding vector is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Chunk', ChunkSchema);
