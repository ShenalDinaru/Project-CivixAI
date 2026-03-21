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
   * @param {Object} options - Search options
   * @returns {Array<Object>} Most relevant chunks with similarity scores
   */
  async search(queryEmbedding, topK = 5, minScore = 0.7, options = {}) {
    const { preferLatest = true } = options;

    if (this.chunks.length === 0) {
      console.warn('Vector store is empty');
      return [];
    }

    console.log(`Searching ${this.chunks.length} chunks with minScore ${minScore}`);
    console.log(`Query embedding length: ${queryEmbedding.length}`);
    console.log(`Sample chunk embedding length: ${this.chunks[0].embedding?.length || 'N/A'}`);

    // Calculate similarity for each chunk
    const results = this.chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    console.log(`Sample scores from first 5 chunks: ${results.slice(0, 5).map(r => r.score.toFixed(3)).join(', ')}`);

    // Sort by similarity (highest first) and filter by minimum score.
    // For current queries, use a wider tie-break window to favor newer guidance.
    const recencyTieBreakWindow = preferLatest ? 0.12 : 0.05;

    const topResults = results
      .filter(r => r.score >= minScore)
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        
        if (Math.abs(scoreDiff) < recencyTieBreakWindow) {
          const yearA = this.extractYear(a.year);
          const yearB = this.extractYear(b.year);
          
          if (preferLatest && yearA && yearB) {
            return yearB - yearA; // Latest year first
          }
        }
        
        return scoreDiff; // Otherwise sort by score
      })
      .slice(0, topK);

    console.log(`Found ${topResults.length} relevant chunks (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

    return topResults;
  }

  /**
   * Extract year from various year formats (e.g., "2024", "2024/25", "2024-25")
   */
  extractYear(yearString) {
    if (!yearString) return null;
    
    const match = String(yearString).match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
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
   * Check if user-uploaded documents are in the store
   */
  hasUserDocuments() {
    return this.chunks.some(chunk => chunk.source === 'User Uploaded Document');
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
