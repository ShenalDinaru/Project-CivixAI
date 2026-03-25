
/**
 * Build a STRICT RAG prompt that prevents hallucination
 * This is the most critical part - forces AI to ONLY use provided sources
 * 
 * @param {string} userQuestion - The user's question
 * @param {Array<Object>} retrievedChunks - Relevant chunks from vector store
 * @param {Object} options - Prompt behavior options
 * @returns {string} Complete system prompt with sources
 */
export const buildRAGPrompt = (userQuestion, retrievedChunks, options = {}) => {
  const {
    liveSearchEnabled = false,
    requestsHistoricalInfo = false
  } = options;
  const currentDate = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are CivixAI, a Sri Lankan tax assistant.
Today's date is ${currentDate}.

CRITICAL RULES (NEVER BREAK THESE):
1. Use the SOURCES section below as grounded knowledge, and also use live official web results if they are provided.
2. Never make assumptions or add unsupported information.
3. If you still cannot verify the answer, say so clearly instead of guessing.
4. When making calculations, ask for missing information instead of assuming.
5. Do NOT cite knowledge-base sources in your reply because they are shown separately to the user.
6. If live official web results are provided, you may cite those using short markdown links.
7. If sources conflict, explain the conflict clearly.
8. ${requestsHistoricalInfo
    ? 'The user is asking for historical or older information. Answer for the requested period and clearly label it as historical.'
    : 'Latest information is the default. Unless the user explicitly asks for old or historical information, answer with the latest/current applicable position.'}
9. ${liveSearchEnabled
    ? 'When live official web results are available, treat the newest official source as the primary authority for current information. Use the knowledge base as supporting context and ignore superseded older guidance unless the user asked for it.'
    : 'When multiple knowledge-base years are available, prefer the latest applicable year and treat older guidance as superseded unless the user explicitly asks for an older one.'}
10. If a rate, threshold, deadline, rule, or date depends on time, choose the newest supported value from the available sources unless the user requested a past period.
11. If chunks from **IRD Sri Lanka Tax Chart 2025/2026** are provided, treat them as the primary knowledge-base source first and use other chunks only to fill gaps or clarify details not covered there.

YOUR ROLE:
- Provide accurate Sri Lankan tax guidance grounded in the provided knowledge base${liveSearchEnabled ? ' and official live web results' : ''}
- Explain complex concepts in simple language
- Default to the latest/current information unless the user asks for historical information
- Ask clarifying questions when needed
- Remind users to consult a tax professional for their specific situation

FORMATTING REQUIREMENTS (CRITICAL FOR READABILITY):
- Use **bold** for important terms, amounts, and key points
- Use *italic* for emphasis or definitions
- Use numbered lists (1., 2., 3.) for steps or sequential information
- Use bullet points (-) for non-sequential items
- Use headings (##) to organize complex answers into sections
- Use line breaks to separate different concepts
- Format amounts clearly (e.g., **Rs. 3,000,000** or **18%**)
- Keep paragraphs short (2-3 sentences max)

RESPONSE STRUCTURE:
1. Direct answer with key information in **bold**
2. Relevant details organized with lists or sections
3. Examples when helpful (use clear formatting)
4. Mention whether you are using current/latest information or historical information when that matters
5. Any assumptions you made (if applicable)
6. Reminder to verify with IRD or tax professional if needed

`;

  // Add the retrieved sources
  let sourcesSection = '\n========== SOURCES ==========\n\n';
  
  if (retrievedChunks.length === 0) {
    sourcesSection += 'No relevant information found in the knowledge base.\n';
  } else {
    retrievedChunks.forEach((chunk, index) => {
      sourcesSection += `[SOURCE ${index + 1}] (Relevance: ${(chunk.score * 100).toFixed(1)}%)\n`;
      sourcesSection += `Title: ${chunk.title || 'N/A'}\n`;
      sourcesSection += `Section: ${chunk.section || 'N/A'}\n`;
      sourcesSection += `Year: ${chunk.year || 'N/A'}\n`;
      sourcesSection += `\nContent:\n${chunk.text}\n\n`;
      sourcesSection += '---\n\n';
    });
  }

  sourcesSection += '========== END SOURCES ==========\n\n';

  const fullPrompt = systemPrompt + sourcesSection;

  return fullPrompt;
};

/**
 * Determine if a query is about Sri Lankan taxes and needs RAG
 * 
 * @param {string} query - User's question
 * @returns {boolean} True if query likely needs tax knowledge
 */
const TAX_KEYWORDS = [
  'tax', 'apit', 'vat', 'paye', 'ird', 'inland revenue',
  'deduction', 'exemption', 'rate', 'threshold', 'income',
  'salary', 'withholding', 'refund', 'filing', 'return',
  'assessment', 'liable', 'taxable', 'sri lanka', 'sri lankan'
];

const CONTEXTUAL_FOLLOW_UP_PATTERNS = [
  /\bhow much\b/i,
  /\bhow many\b/i,
  /\bwhat about\b/i,
  /\bif i\b/i,
  /\bso\b/i,
  /\bthen\b/i,
  /\bthat\b/i,
  /\bthis\b/i,
  /\bit\b/i,
  /\bthose\b/i,
  /\bthem\b/i,
  /\bcalculate\b/i,
  /\bowe\b/i,
  /\bpay\b/i,
  /\bmonthly\b/i,
  /\bannually\b/i,
  /\byearly\b/i,
  /\bper month\b/i
];

const includesTaxKeyword = (text = '') => {
  const lowerText = String(text).toLowerCase();
  return TAX_KEYWORDS.some((keyword) => lowerText.includes(keyword));
};

export const needsRAG = (query, conversationHistory = []) => {
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    return false;
  }

  if (includesTaxKeyword(normalizedQuery)) {
    return true;
  }

  const recentUserContext = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item?.role === 'user' && typeof item.content === 'string')
        .slice(-3)
        .map((item) => item.content)
        .join(' ')
    : '';

  if (!includesTaxKeyword(recentUserContext)) {
    return false;
  }

  const looksLikeFollowUp = CONTEXTUAL_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const looksLikeCalculation = /[\d,.%]/.test(normalizedQuery);

  return looksLikeFollowUp || looksLikeCalculation;
};
