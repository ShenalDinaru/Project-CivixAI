import { retrieveRelevantChunks } from '../rag/retrieve.js';
import { buildRAGPrompt, needsRAG } from '../rag/prompt.js';
import { generateResponse } from './openRouterService.js';
import vectorStore from '../rag/vectorStore.js';
import { analyzeQueryIntent, OFFICIAL_TAX_SOURCE_DOMAINS } from '../utils/queryIntent.js';

const buildKnowledgeBaseSources = (relevantChunks = []) => relevantChunks.map((chunk) => ({
  title: chunk.title,
  section: chunk.section,
  year: chunk.year,
  source: chunk.source,
  url: chunk.source_url || null,
  relevance: (chunk.score * 100).toFixed(1) + '%'
}));

const buildWebSearchPrompt = (requestsHistoricalInfo) => `A web search was conducted to verify the answer with official Sri Lankan tax sources.
${requestsHistoricalInfo
  ? 'The user explicitly asked for historical information. Prefer official sources that match the requested period.'
  : 'Unless the user explicitly asked for old information, prefer the newest currently applicable official guidance.'}
Cite web-derived claims using short markdown links.`;

const buildResponsePayload = (response, relevantChunks = [], intent = {}) => {
  const knowledgeBaseSources = buildKnowledgeBaseSources(relevantChunks);
  const liveSources = response.webSearch?.sources || [];

  return {
    ...response,
    sources: liveSources.length > 0 ? liveSources : knowledgeBaseSources,
    rag: {
      used: relevantChunks.length > 0,
      chunks: relevantChunks.length,
      sources: knowledgeBaseSources
    },
    live: response.webSearch || { used: false, sources: [] },
    intent: {
      historical: intent.requestsHistoricalInfo || false,
      latestByDefault: intent.wantsLatestInfo || false
    }
  };
};

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
  const stats = vectorStore.getStats();
  const hasKnowledgeBase = stats.totalChunks > 0;
  const hasUserDocuments = vectorStore.hasUserDocuments();
  const taxQuestion = needsRAG(userMessage);
  const intent = analyzeQueryIntent(userMessage);
  const shouldUseKnowledgeBase = hasKnowledgeBase && (hasUserDocuments || taxQuestion);
  const shouldUseLiveSearch = taxQuestion && intent.wantsLatestInfo;

  try {
    if (!shouldUseKnowledgeBase && !shouldUseLiveSearch) {
      console.log('Question does not require tax knowledge, using standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    if (!hasKnowledgeBase && shouldUseLiveSearch) {
      console.log('Knowledge base unavailable, using live official web search');
    } else if (!hasKnowledgeBase) {
      console.log('RAG not available, falling back to standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    console.log('\n=== RAG Pipeline ===');
    console.log('User question:', userMessage.substring(0, 100) + '...');
    console.log('Historical query:', intent.requestsHistoricalInfo);
    console.log('Live search enabled:', shouldUseLiveSearch);

    let relevantChunks = [];

    if (shouldUseKnowledgeBase) {
      relevantChunks = await retrieveRelevantChunks(userMessage, 5, {
        preferLatest: intent.wantsLatestInfo
      });
      console.log(`Retrieved ${relevantChunks.length} relevant chunks`);
    }

    const ragSystemPrompt = buildRAGPrompt(userMessage, relevantChunks, {
      liveSearchEnabled: shouldUseLiveSearch,
      requestsHistoricalInfo: intent.requestsHistoricalInfo
    });

    const response = await generateResponse(userMessage, conversationHistory, ragSystemPrompt, {
      enableWebSearch: shouldUseLiveSearch,
      webSearchDomains: OFFICIAL_TAX_SOURCE_DOMAINS,
      webSearchEngine: 'exa',
      webSearchMaxResults: 5,
      webSearchPrompt: buildWebSearchPrompt(intent.requestsHistoricalInfo),
      temperature: 0.1
    });

    return buildResponsePayload(response, relevantChunks, intent);

  } catch (error) {
    console.error('RAG/live error:', error.message);

    if (shouldUseKnowledgeBase) {
      try {
        console.log('Falling back to knowledge base only');

        const fallbackChunks = await retrieveRelevantChunks(userMessage, 5, {
          preferLatest: intent.wantsLatestInfo
        });

        const fallbackPrompt = buildRAGPrompt(userMessage, fallbackChunks, {
          liveSearchEnabled: false,
          requestsHistoricalInfo: intent.requestsHistoricalInfo
        });

        const fallbackResponse = await generateResponse(
          userMessage,
          conversationHistory,
          fallbackPrompt,
          { temperature: 0.1 }
        );

        return buildResponsePayload(fallbackResponse, fallbackChunks, intent);
      } catch (fallbackError) {
        console.error('Knowledge base fallback failed:', fallbackError.message);
      }
    }

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
