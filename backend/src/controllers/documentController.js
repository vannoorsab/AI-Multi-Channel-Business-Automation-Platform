const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Business = require('../models/Business');
const { splitTextIntoChunks, generateGeminiEmbedding } = require('../services/ragService');

// @desc    Get all trained documents for a business
// @route   GET /api/documents?businessId=... OR ?workspaceId=...
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const documents = await Document.find({ business: businessId }).sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload, chunk, and index a document semantically (Train AI)
// @route   POST /api/documents
// @access  Private (Owners/Admins only)
exports.uploadDocument = async (req, res) => {
  try {
    const { fileName, text } = req.body;
    // Accept both businessId and workspaceId
    const businessId = req.body.businessId || req.body.workspaceId;

    if (!fileName || !text || !businessId) {
      return res.status(400).json({ success: false, error: 'fileName, text content, and businessId are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business tenant not found' });
    }

    // 1. Create Document metadata record
    const documentObj = await Document.create({
      fileName,
      fileType: fileName.endsWith('.pdf') ? 'pdf' : 'txt',
      characterCount: text.length,
      business: businessId,
    });

    // 2. Divide text into semantic chunks
    const textChunks = splitTextIntoChunks(text);
    const customApiKey = business.settings?.geminiApiKey || '';

    // 3. For each chunk, generate vector embedding and save chunk
    const chunkPromises = textChunks.map(async (chunkText) => {
      const vector = await generateGeminiEmbedding(chunkText, customApiKey);
      return Chunk.create({
        document: documentObj._id,
        business: businessId,
        text: chunkText,
        embedding: vector,
      });
    });

    await Promise.all(chunkPromises);

    // Update document statistics
    documentObj.chunkCount = textChunks.length;
    await documentObj.save();

    res.status(201).json({
      success: true,
      message: 'Document successfully parsed, chunked, and indexed into chatbot knowledge base.',
      document: documentObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete document and wipe semantic chunks (De-train AI)
// @route   DELETE /api/documents/:id
// @access  Private (Owners/Admins only)
exports.deleteDocument = async (req, res) => {
  try {
    const documentObj = await Document.findById(req.params.id);

    if (!documentObj) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Wipe all vector chunks associated with the document
    await Chunk.deleteMany({ document: documentObj._id });
    
    // Delete Document record
    await documentObj.deleteOne();

    res.json({ success: true, message: 'Document and semantic vector indexes successfully purged from training memory.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
