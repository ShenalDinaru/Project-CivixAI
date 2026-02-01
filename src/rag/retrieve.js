import { generateEmbedding } from './embed.js';
import vectorStore from './vectorStore.js';

/**
 * Retrieve relevant tax knowledge for a user's question
 * This is the "R" in RAG (Retrieval-Augmented Generation)
 * 
 * @param {string} query - User's question
 * @param {number} topK - Number of chunks to retrieve
 * @returns {Promise<Array<Object>>} Relevant chunks with sources
 */
export const retrieveRelevantChunks = async (query, topK = 5) => {
  try {
    // Step 1: Convert question to embedding (semantic fingerprint)
    console.log('Embedding user query...');
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search vector store for similar chunks
    console.log('Searching for relevant tax knowledge...');
    const relevantChunks = await vectorStore.search(queryEmbedding, topK, 0.7);

    return relevantChunks;
  } catch (error) {
    console.error('Retrieval error:', error);
    throw new Error(`Failed to retrieve relevant knowledge: ${error.message}`);
  }
};

/**
 * Format retrieved chunks for inclusion in the prompt
 * 
 * @param {Array<Object>} chunks - Retrieved chunks
 * @returns {string} Formatted sources text
 */
export const formatChunksForPrompt = (chunks) => {
  if (chunks.length === 0) {
    return 'No relevant Sri Lankan tax information found in the knowledge base.';
  }

  let formatted = 'RELEVANT SRI LANKAN TAX INFORMATION:\n\n';

  chunks.forEach((chunk, index) => {
    formatted += `[SOURCE ${index + 1}] (Relevance: ${(chunk.score * 100).toFixed(1)}%)\n`;
    formatted += `Title: ${chunk.title || 'N/A'}\n`;
    formatted += `Section: ${chunk.section || 'N/A'}\n`;
    formatted += `Year: ${chunk.year || 'N/A'}\n`;
    formatted += `Content:\n${chunk.text}\n\n`;
    formatted += '---\n\n';
  });

  return formatted;
};
