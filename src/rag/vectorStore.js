import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple in-memory vector store
 * For production, use Pinecone, pgvector, or Qdrant
 * 
 * This stores chunks with their embeddings and allows similarity search
 */
class VectorStore {
  constructor() {
    this.chunks = [];
    this.storePath = path.join(__dirname, '../data/vector-store.json');
  }

  /**
   * Initialize the store - load existing data if available
   */
  async initialize() {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      this.chunks = JSON.parse(data);
      console.log(`Loaded ${this.chunks.length} chunks from vector store`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing vector store found, starting fresh');
        this.chunks = [];
      } else {
        throw error;
      }
    }
  }

  /**
   * Add chunks with embeddings to the store
   * 
   * @param {Array<Object>} chunks - Chunks with embeddings
   */
  async addChunks(chunks) {
    this.chunks.push(...chunks);
    await this.save();
    console.log(`Added ${chunks.length} chunks to vector store`);
  }

  /**
   * Save the store to disk
   */
  async save() {
    await fs.writeFile(this.storePath, JSON.stringify(this.chunks, null, 2));
  }

  /**
   * Calculate cosine similarity between two vectors
   * This measures how similar two embeddings are (0 = different, 1 = identical)
   * 
   * @param {number[]} vecA 
   * @param {number[]} vecB 
   * @returns {number} Similarity score between 0 and 1
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find the most relevant chunks for a query
   * This is the core of RAG - semantic search
   * 
   * @param {number[]} queryEmbedding - Embedding of the user's question
   * @param {number} topK - Number of results to return
   * @param {number} minScore - Minimum similarity score (0-1)
   * @returns {Array<Object>} Most relevant chunks with similarity scores
   */
  async search(queryEmbedding, topK = 5, minScore = 0.7) {
    if (this.chunks.length === 0) {
      console.warn('Vector store is empty');
      return [];
    }

    // Calculate similarity for each chunk
    const results = this.chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity (highest first) and filter by minimum score
    const topResults = results
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`Found ${topResults.length} relevant chunks (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

    return topResults;
  }

  /**
   * Get statistics about the store
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      avgTextLength: this.chunks.length > 0
        ? Math.round(this.chunks.reduce((sum, c) => sum + c.text.length, 0) / this.chunks.length)
        : 0
    };
  }

  /**
   * Clear all chunks from the store
   */
  async clear() {
    this.chunks = [];
    await this.save();
    console.log('Vector store cleared');
  }
}

// Export singleton instance
const vectorStore = new VectorStore();
export default vectorStore;
