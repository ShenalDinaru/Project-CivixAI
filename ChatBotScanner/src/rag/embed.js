import axios from 'axios';

const EMBEDDINGS_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

const requestEmbeddings = async (input) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      EMBEDDINGS_API_URL,
      {
        model: EMBEDDING_MODEL,
        input
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CivixAI RAG System'
        }
      }
    );

    return response.data.data.map((item) => item.embedding);
  } catch (error) {
    console.error('Embedding error:', error.response?.data || error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for text using OpenAI's embedding model
 * Embeddings = semantic fingerprints that allow meaning-based search
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - Vector embedding (array of numbers)
 */
export const generateEmbedding = async (text) => {
  const [embedding] = await requestEmbeddings([text]);
  return embedding;
};

/**
 * Generate embeddings for multiple chunks in batch
 * 
 * @param {Array<Object>} chunks - Array of chunk objects with text property
 * @returns {Promise<Array<Object>>} - Chunks with embeddings added
 */
export const generateBatchEmbeddings = async (chunks) => {
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  
  const chunksWithEmbeddings = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 50;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    try {
      const embeddings = await requestEmbeddings(batch.map((chunk) => chunk.text));
      embeddings.forEach((embedding, index) => {
        chunksWithEmbeddings.push({
          ...batch[index],
          embedding
        });
      });
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed, falling back to single-item retries:`, error.message);

      const promises = batch.map(async (chunk) => {
        try {
          const embedding = await generateEmbedding(chunk.text);
          return {
            ...chunk,
            embedding
          };
        } catch (itemError) {
          console.error(`Failed to embed chunk ${chunk.id || chunk.chunk_id || 'unknown'}:`, itemError.message);
          return null;
        }
      });

      const results = await Promise.all(promises);
      chunksWithEmbeddings.push(...results.filter(r => r !== null));
    }

    console.log(`Processed ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return chunksWithEmbeddings;
};
