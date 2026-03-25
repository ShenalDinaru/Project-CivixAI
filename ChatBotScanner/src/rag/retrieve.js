import { generateEmbedding } from './embed.js';
import vectorStore from './vectorStore.js';

const DEFAULT_MIN_SCORE = 0.25;
const PRIMARY_TAX_CHART_MIN_SCORE = 0.35;

/**
 * Retrieve relevant civic knowledge for a user's question
 * This is the "R" in RAG (Retrieval-Augmented Generation)
 * 
 * @param {string} query - User's question
 * @param {number} topK - Number of chunks to retrieve
 * @param {Object} options - Retrieval options
 * @returns {Promise<Array<Object>>} Relevant chunks with sources
 */
export const retrieveRelevantChunks = async (query, topK = 5, options = {}) => {
  try {
    const {
      minScore = DEFAULT_MIN_SCORE,
      primaryDocumentId = null,
      primaryDocumentMinScore = PRIMARY_TAX_CHART_MIN_SCORE,
      ...searchOptions
    } = options;

    // Step 1: Convert question to embedding (semantic fingerprint)
    console.log('Embedding user query...');
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search vector store for similar chunks
    console.log('Searching for relevant civic knowledge...');
    if (!primaryDocumentId) {
      return await vectorStore.search(queryEmbedding, topK, minScore, searchOptions);
    }

    const primaryChunks = await vectorStore.search(
      queryEmbedding,
      topK,
      Math.max(minScore, primaryDocumentMinScore),
      {
        ...searchOptions,
        documentIds: [primaryDocumentId]
      }
    );

    if (primaryChunks.length >= topK) {
      return primaryChunks;
    }

    const fallbackChunks = await vectorStore.search(
      queryEmbedding,
      topK * 2,
      minScore,
      {
        ...searchOptions,
        excludeDocumentIds: [primaryDocumentId]
      }
    );

    const seenChunkIds = new Set(primaryChunks.map((chunk) => chunk.chunk_id || chunk.id));
    const combinedChunks = [
      ...primaryChunks,
      ...fallbackChunks.filter((chunk) => !seenChunkIds.has(chunk.chunk_id || chunk.id))
    ].slice(0, topK);

    return combinedChunks;
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
    return 'No relevant Sri Lankan civic information found in the knowledge base.';
  }

  let formatted = 'RELEVANT SRI LANKAN CIVIC INFORMATION:\n\n';

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
