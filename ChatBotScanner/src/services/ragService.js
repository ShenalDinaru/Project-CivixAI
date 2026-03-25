import { retrieveRelevantChunks } from '../rag/retrieve.js';
import { buildRAGPrompt, needsRAG } from '../rag/prompt.js';
import { generateResponse } from './openRouterService.js';
import vectorStore from '../rag/vectorStore.js';
import { analyzeQueryIntent, OFFICIAL_TAX_SOURCE_DOMAINS } from '../utils/queryIntent.js';

const getCurrentDateLabel = () => new Date().toISOString().slice(0, 10);
const PRIMARY_TAX_CHART_DOCUMENT_ID = 'ird_tax_chart_2025_2026';
const MAX_UPLOADED_DOCUMENTS = 3;
const MAX_UPLOADED_DOCUMENT_CHARS = 12000;
const MAX_TOTAL_UPLOADED_DOCUMENT_CHARS = 24000;
let ragInitializationPromise = null;

const buildKnowledgeBaseSources = (relevantChunks = []) => relevantChunks.map((chunk) => ({
  title: chunk.title,
  section: chunk.section,
  year: chunk.year,
  source: chunk.source,
  url: chunk.source_url || null,
  relevance: (chunk.score * 100).toFixed(1) + '%'
}));

const sanitizeUploadedDocuments = (uploadedDocuments = []) => {
  let remainingChars = MAX_TOTAL_UPLOADED_DOCUMENT_CHARS;

  return uploadedDocuments
    .filter((document) =>
      document &&
      typeof document.filename === 'string' &&
      typeof document.text === 'string'
    )
    .slice(0, MAX_UPLOADED_DOCUMENTS)
    .map((document) => {
      if (remainingChars <= 0) {
        return null;
      }

      const normalizedText = document.text.trim();

      if (!normalizedText) {
        return null;
      }

      const charBudget = Math.min(MAX_UPLOADED_DOCUMENT_CHARS, remainingChars);
      const excerpt = normalizedText.slice(0, charBudget);
      remainingChars -= excerpt.length;

      return {
        filename: document.filename.trim() || 'Uploaded document',
        processedAt: document.processedAt || null,
        metadata: document.metadata || {},
        text: excerpt,
        truncated: excerpt.length < normalizedText.length
      };
    })
    .filter(Boolean);
};

const buildUploadedDocumentSources = (uploadedDocuments = []) => uploadedDocuments.map((document) => ({
  title: document.filename,
  section: document.metadata?.fileType || 'Uploaded document',
  year: document.processedAt ? new Date(document.processedAt).getFullYear().toString() : null,
  source: 'User Uploaded Document',
  url: null,
  relevance: 'Direct uploaded context'
}));

const buildWebSearchPrompt = (requestsHistoricalInfo) => `A web search was conducted to verify the answer with official Sri Lankan tax sources.
Today's date is ${getCurrentDateLabel()}.
${requestsHistoricalInfo
  ? 'The user explicitly asked for historical information. Prefer official sources that match the requested period.'
  : 'Unless the user explicitly asked for old information, prefer the newest currently applicable official guidance and ignore superseded older guidance.'}
Cite web-derived claims using short markdown links.`;

const buildUploadedDocumentsSection = (uploadedDocuments = []) => {
  if (uploadedDocuments.length === 0) {
    return '';
  }

  let section = '\n========== USER UPLOADED DOCUMENTS ==========\n\n';

  uploadedDocuments.forEach((document, index) => {
    section += `[DOCUMENT ${index + 1}]\n`;
    section += `Filename: ${document.filename}\n`;
    section += `Processed At: ${document.processedAt || 'N/A'}\n`;
    section += `Type: ${document.metadata?.fileType || 'N/A'}\n`;
    section += `\nContent:\n${document.text}\n`;

    if (document.truncated) {
      section += '\n[This uploaded document was truncated for prompt length limits.]\n';
    }

    section += '\n---\n\n';
  });

  section += '========== END USER UPLOADED DOCUMENTS ==========\n\n';
  return section;
};

const buildUploadedDocumentsPrompt = (uploadedDocuments = [], options = {}) => {
  const { requestsHistoricalInfo = false, liveSearchEnabled = false } = options;

  return `You are CivixAI, a Sri Lankan tax assistant.
Today's date is ${getCurrentDateLabel()}.

CRITICAL RULES (NEVER BREAK THESE):
1. Use the USER UPLOADED DOCUMENTS section below as your primary source when the user asks about their uploaded or scanned document.
2. Do not invent information that is not present in the uploaded document text.
3. If the uploaded documents do not contain enough information, say so clearly.
4. ${requestsHistoricalInfo
    ? 'If the user asks for a historical period, keep the answer tied to that requested period.'
    : 'Use the latest/current interpretation only when it is supported by the uploaded document or the user asks a broader tax question.'}
5. ${liveSearchEnabled
    ? 'If live official tax results are also available, use them only to supplement the uploaded document and clearly separate document-derived points from official current guidance.'
    : 'Do not substitute unrelated general guidance for the uploaded document contents.'}
6. Keep answers clear, practical, and grounded in the uploaded material.

FORMATTING REQUIREMENTS:
- Use **bold** for key findings and important amounts or dates
- Use numbered lists (1., 2., 3.) for steps
- Use short paragraphs and direct language
- State clearly when something is missing or unclear in the uploaded document

${buildUploadedDocumentsSection(uploadedDocuments)}`;
};

const mergePromptWithUploadedDocuments = (basePrompt, uploadedDocuments = []) => {
  if (uploadedDocuments.length === 0) {
    return basePrompt;
  }

  const additionalRules = `
ADDITIONAL RULES FOR USER DOCUMENTS:
1. When the user refers to "this document", "my upload", "my scan", or similar, treat the USER UPLOADED DOCUMENTS section as the primary evidence.
2. If the uploaded documents conflict with general guidance, point that out clearly instead of guessing.
3. If the uploaded documents do not answer the question, say so clearly before providing broader tax guidance.

${buildUploadedDocumentsSection(uploadedDocuments)}`;

  return `${basePrompt}\n${additionalRules}`;
};

const buildResponsePayload = (response, relevantChunks = [], intent = {}, uploadedDocuments = []) => {
  const knowledgeBaseSources = buildKnowledgeBaseSources(relevantChunks);
  const uploadedDocumentSources = buildUploadedDocumentSources(uploadedDocuments);
  const liveSources = response.webSearch?.sources || [];
  const nonLiveSources = uploadedDocumentSources.length > 0
    ? [...uploadedDocumentSources, ...knowledgeBaseSources]
    : knowledgeBaseSources;

  return {
    ...response,
    sources: liveSources.length > 0 ? liveSources : nonLiveSources,
    rag: {
      used: relevantChunks.length > 0,
      chunks: relevantChunks.length,
      sources: knowledgeBaseSources
    },
    uploadedDocuments: {
      used: uploadedDocumentSources.length > 0,
      count: uploadedDocumentSources.length,
      sources: uploadedDocumentSources
    },
    live: response.webSearch || { used: false, sources: [] },
    intent: {
      historical: intent.requestsHistoricalInfo || false,
      latestByDefault: !intent.requestsHistoricalInfo
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

export const ensureRAGInitialized = async () => {
  if (vectorStore.getStats().totalChunks > 0) {
    return true;
  }

  if (!ragInitializationPromise) {
    ragInitializationPromise = initializeRAG().finally(() => {
      if (vectorStore.getStats().totalChunks === 0) {
        ragInitializationPromise = null;
      }
    });
  }

  return ragInitializationPromise;
};

/**
 * Generate a response using RAG (Retrieval-Augmented Generation)
 *
 * Flow:
 * 1. User question -> Embed question
 * 2. Search vector DB -> Get relevant chunks
 * 3. Build strict prompt with sources
 * 4. Call LLM with context
 * 5. Return answer with citations
 *
 * @param {string} userMessage - User's question
 * @param {Array} conversationHistory - Previous messages
 * @param {Array} uploadedDocuments - User-uploaded document context
 * @returns {Promise<Object>} Response with answer and metadata
 */
export const generateRAGResponse = async (userMessage, conversationHistory = [], uploadedDocuments = []) => {
  await ensureRAGInitialized();

  const normalizedUploadedDocuments = sanitizeUploadedDocuments(uploadedDocuments);
  const hasUploadedDocuments = normalizedUploadedDocuments.length > 0;
  const stats = vectorStore.getStats();
  const hasKnowledgeBase = stats.totalChunks > 0;
  const hasUserDocuments = vectorStore.hasUserDocuments();
  const taxQuestion = needsRAG(userMessage, conversationHistory);
  const intent = analyzeQueryIntent(userMessage, conversationHistory);
  const shouldUseKnowledgeBase = hasKnowledgeBase && (hasUserDocuments || taxQuestion);
  const shouldUseLiveSearch = taxQuestion && !intent.requestsHistoricalInfo;
  const shouldPreferTaxChartFirst = taxQuestion && !intent.referencesUploadedDocuments;

  try {
    if (!shouldUseKnowledgeBase && !shouldUseLiveSearch && !hasUploadedDocuments) {
      console.log('Question does not require tax knowledge, using standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    if (!hasKnowledgeBase && shouldUseLiveSearch) {
      console.log('Knowledge base unavailable, using live official web search');
    } else if (!hasKnowledgeBase && !hasUploadedDocuments) {
      console.log('RAG not available, falling back to standard response');
      return await generateResponse(userMessage, conversationHistory);
    }

    console.log('\n=== RAG Pipeline ===');
    console.log('User question:', userMessage.substring(0, 100) + '...');
    console.log('Historical query:', intent.requestsHistoricalInfo);
    console.log('Latest-by-default:', !intent.requestsHistoricalInfo);
    console.log('Live search enabled:', shouldUseLiveSearch);
    console.log('Tax chart prioritized:', shouldPreferTaxChartFirst);
    console.log('Uploaded documents available:', hasUploadedDocuments);

    let relevantChunks = [];

    if (shouldUseKnowledgeBase) {
      relevantChunks = await retrieveRelevantChunks(userMessage, 5, {
        preferLatest: intent.wantsLatestInfo,
        primaryDocumentId: shouldPreferTaxChartFirst ? PRIMARY_TAX_CHART_DOCUMENT_ID : null
      });
      console.log(`Retrieved ${relevantChunks.length} relevant chunks`);
    }

    let systemPrompt = shouldUseKnowledgeBase || shouldUseLiveSearch
      ? buildRAGPrompt(userMessage, relevantChunks, {
          liveSearchEnabled: shouldUseLiveSearch,
          requestsHistoricalInfo: intent.requestsHistoricalInfo
        })
      : null;

    if (hasUploadedDocuments) {
      systemPrompt = systemPrompt
        ? mergePromptWithUploadedDocuments(systemPrompt, normalizedUploadedDocuments)
        : buildUploadedDocumentsPrompt(normalizedUploadedDocuments, {
            liveSearchEnabled: shouldUseLiveSearch,
            requestsHistoricalInfo: intent.requestsHistoricalInfo
          });
    }

    const response = await generateResponse(userMessage, conversationHistory, systemPrompt, {
      enableWebSearch: shouldUseLiveSearch,
      webSearchDomains: OFFICIAL_TAX_SOURCE_DOMAINS,
      webSearchEngine: 'exa',
      webSearchMaxResults: 5,
      webSearchPrompt: buildWebSearchPrompt(intent.requestsHistoricalInfo),
      temperature: 0.1
    });

    return buildResponsePayload(response, relevantChunks, intent, normalizedUploadedDocuments);
  } catch (error) {
    console.error('RAG/live error:', error.message);

    if (hasUploadedDocuments) {
      try {
        console.log('Falling back to uploaded documents only');

        const uploadedDocumentResponse = await generateResponse(
          userMessage,
          conversationHistory,
          buildUploadedDocumentsPrompt(normalizedUploadedDocuments, {
            liveSearchEnabled: false,
            requestsHistoricalInfo: intent.requestsHistoricalInfo
          }),
          { temperature: 0.1 }
        );

        return buildResponsePayload(uploadedDocumentResponse, [], intent, normalizedUploadedDocuments);
      } catch (uploadedDocumentError) {
        console.error('Uploaded document fallback failed:', uploadedDocumentError.message);
      }
    }

    if (shouldUseKnowledgeBase) {
      try {
        console.log('Falling back to knowledge base only');

        const fallbackChunks = await retrieveRelevantChunks(userMessage, 5, {
          preferLatest: intent.wantsLatestInfo,
          primaryDocumentId: shouldPreferTaxChartFirst ? PRIMARY_TAX_CHART_DOCUMENT_ID : null
        });

        const fallbackPrompt = buildRAGPrompt(userMessage, fallbackChunks, {
          liveSearchEnabled: false,
          requestsHistoricalInfo: intent.requestsHistoricalInfo
        });
        const mergedFallbackPrompt = hasUploadedDocuments
          ? mergePromptWithUploadedDocuments(fallbackPrompt, normalizedUploadedDocuments)
          : fallbackPrompt;

        const fallbackResponse = await generateResponse(
          userMessage,
          conversationHistory,
          mergedFallbackPrompt,
          { temperature: 0.1 }
        );

        return buildResponsePayload(fallbackResponse, fallbackChunks, intent, normalizedUploadedDocuments);
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
