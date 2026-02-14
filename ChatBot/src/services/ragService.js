import { retrieveRelevantChunks } from '../rag/retrieve.js';
import { buildRAGPrompt, needsRAG } from '../rag/prompt.js';
import { generateResponse } from './openRouterService.js';
import vectorStore from '../rag/vectorStore.js';

/**
 * Main RAG service that orchestrates the retrieval and generation
 * This is the "Path A" implementation
 */

/**
 * Initialize the RAG system (load vector store)
 */
export const initializeRAG = async () => {
  try {
    await vectorStore.initialize();
    const stats = vectorStore.getStats();
    
    if (stats.totalChunks === 0) {
      console.warn('⚠️  Vector store is empty. Run: node src/scripts/setupKnowledge.js');
      return false;
    }
    
    console.log(`✓ RAG initialized with ${stats.totalChunks} knowledge chunks`);
    return true;
  } catch (error) {
    console.error('Failed to initialize RAG:', error.message);
    return false;
  }
};

/**
 * Generate a response using RAG (Retrieval-Augmented Generation)
 * 
 * Flow:
 * 1. User question → Embed question
 * 2. Search vector DB → Get relevant chunks
 * 3. Build strict prompt with sources
 * 4. Call LLM with context
 * 5. Return answer with citations
 * 
 * @param {string} userMessage - User's question
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<Object>} Response with answer and metadata
 */
export const generateRAGResponse = async (userMessage, conversationHistory = []) => {
  try {
    const stats = vectorStore.getStats();
    
    // Check if RAG is available
    if (stats.totalChunks === 0) {
      console.log('RAG not available, falling back to standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    // Check if the question needs tax knowledge
    const requiresRAG = needsRAG(userMessage);
    
    if (!requiresRAG) {
      console.log('Question does not require tax knowledge, using standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    console.log('\n=== RAG Pipeline ===');
    console.log('User question:', userMessage.substring(0, 100) + '...');

    // Step 1 & 2: Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(userMessage, 5);
    
    console.log(`Retrieved ${relevantChunks.length} relevant chunks`);

    // Step 3: Build strict RAG prompt
    const ragSystemPrompt = buildRAGPrompt(userMessage, relevantChunks);

    // Step 4: Call LLM with sources
    const systemMessage = {
      role: 'system',
      content: ragSystemPrompt
    };

    // Build messages with RAG context
    const messages = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Call OpenRouter with low temperature for factual accuracy
    const response = await generateResponse(userMessage, conversationHistory, ragSystemPrompt);

    // Step 5: Return with metadata
    return {
      ...response,
      rag: {
        used: true,
        chunks: relevantChunks.length,
        sources: relevantChunks.map(c => ({
          title: c.title,
          section: c.section,
          year: c.year,
          relevance: (c.score * 100).toFixed(1) + '%'
        }))
      }
    };

  } catch (error) {
    console.error('RAG error:', error.message);
    console.log('Falling back to standard response');
    return await generateResponse(userMessage, conversationHistory);
  }
};

/**
 * Get RAG system status
 */
export const getRAGStatus = () => {
  const stats = vectorStore.getStats();
  return {
    available: stats.totalChunks > 0,
    totalChunks: stats.totalChunks,
    avgChunkSize: stats.avgTextLength,
    ready: stats.totalChunks > 0
  };
};
