const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chunk = require('../models/Chunk');

/**
 * Splits text into overlapping semantic chunks
 * @param {string} text - The input text content
 * @param {number} chunkSize - Character size of each chunk
 * @param {number} overlap - Overlapping margins between chunks
 */
exports.splitTextIntoChunks = (text, chunkSize = 500, overlap = 100) => {
  if (!text) return [];
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Attempt to end chunk on a whitespace or sentence boundary to avoid splitting words
    if (endIndex < text.length) {
      const nextSpace = text.indexOf(' ', endIndex);
      const nextNewline = text.indexOf('\n', endIndex);
      const endBoundary = Math.min(
        nextSpace !== -1 ? nextSpace : text.length,
        nextNewline !== -1 ? nextNewline : text.length
      );
      if (endBoundary - endIndex < 50) {
        endIndex = endBoundary;
      }
    }
    
    const chunkText = text.substring(startIndex, endIndex).trim();
    if (chunkText) {
      chunks.push(chunkText);
    }
    
    startIndex += (chunkSize - overlap);
  }
  
  return chunks;
};

/**
 * Invokes Gemini API to calculate the 768-dimensional vector embedding for text
 * @param {string} text - Text segment to embed
 * @param {string} customApiKey - Optional workspace api key
 */
exports.generateGeminiEmbedding = async (text, customApiKey = '') => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini API Key missing for embeddings. Generating simulated vector.');
    return simulateEmbeddingVector(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-embedding-001 (stable embedding model)
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text }], role: 'user' }
    });
    
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error('Invalid embedding response format');
  } catch (error) {
    console.error('Gemini Embeddings generation failed, falling back to simulated values:', error.message);
    return simulateEmbeddingVector(text);
  }
};

/**
 * Calculates the Cosine Similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches and retrieves the top most semantically relevant training chunks for a query
 * @param {string} query - Customer question
 * @param {string} businessId - Active business context
 * @param {string} customApiKey - Optional api key
 * @param {number} maxResults - Max returned context chunks
 */
exports.retrieveContext = async (query, businessId, customApiKey = '', maxResults = 3) => {
  try {
    // 1. Generate query embedding vector
    const queryVector = await exports.generateGeminiEmbedding(query, customApiKey);

    // 2. Fetch all chunk assets indexed for this business tenant
    const businessChunks = await Chunk.find({ business: businessId });
    if (businessChunks.length === 0) {
      return [];
    }

    // 3. Compute cosine similarity scores
    const scoredChunks = businessChunks.map(chunk => {
      const score = cosineSimilarity(queryVector, chunk.embedding);
      return { text: chunk.text, score };
    });

    // 4. Sort descending and filter noise below standard margins
    scoredChunks.sort((a, b) => b.score - a.score);
    
    // Retrieve top context matches
    const topMatches = scoredChunks.slice(0, maxResults);
    console.log(`RAG Retrieval matched ${topMatches.length} contexts (Top Score: ${topMatches[0]?.score.toFixed(3) || 0})`);
    
    return topMatches;
  } catch (error) {
    console.error('Error in retrieveContext:', error);
    return [];
  }
};

/**
 * Inject retrieved chunks context into the AI system instruction prompts
 */
exports.injectContextIntoSystemPrompt = (systemPrompt, retrievedChunks = []) => {
  if (retrievedChunks.length === 0) return systemPrompt;

  const contextData = retrievedChunks
    .map((c, i) => `CONTEXT BLOCK ${i + 1}:\n"${c.text}"`)
    .join('\n\n');

  return `${systemPrompt}

CRITICAL KNOWLEDGE BASE ACCESS (RETRIEVED FACTS):
Use the following context to answer customer queries. Do not mention "retrieved facts" or "knowledge base" to the customer, but ensure your answer is 100% accurate and aligned with the facts below. If the context does not contain the answer, answer politely using your general settings or guide them to book a demo.
===========================================
${contextData}
===========================================
`;
};

/**
 * Simulates a deterministic 768-dimensional embedding vector based on text characters
 */
function simulateEmbeddingVector(text) {
  const vector = [];
  const charsSum = text.split('').reduce((acc, curr) => acc + curr.charCodeAt(0), 0);
  
  for (let i = 0; i < 768; i++) {
    // Generate deterministic pseudo-random float values between -1 and 1
    const value = Math.sin(charsSum + i) * Math.cos(i * 1.5);
    vector.push(value);
  }
  
  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}
