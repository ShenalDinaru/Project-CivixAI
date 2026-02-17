
/**
 * Build a STRICT RAG prompt that prevents hallucination
 * This is the most critical part - forces AI to ONLY use provided sources
 * 
 * @param {string} userQuestion - The user's question
 * @param {Array<Object>} retrievedChunks - Relevant chunks from vector store
 * @returns {string} Complete system prompt with sources
 */
export const buildRAGPrompt = (userQuestion, retrievedChunks) => {
  // Check if the question is about forms or form filling
  const isFormQuestion = /form|application|registration|fill|field|section|document|submit|apply/i.test(userQuestion);
  const hasFormDocuments = retrievedChunks.some(chunk => 
    /form|application|registration|document|field|section/i.test(chunk.text || '')
  );

  const systemPrompt = `You are CivixAI, a Sri Lankan tax and government services assistant.

CRITICAL RULES (NEVER BREAK THESE):
1. Use ONLY the information in the SOURCES section below
2. If the answer is not in the sources, say "I don't have that information in my knowledge base"
3. Never make assumptions or add information not in the sources
4. Always cite which source you used (e.g., "According to Source 1...")
5. If sources conflict, mention both versions
6. When making calculations, ask for missing information instead of assuming
7. ALWAYS prioritize the LATEST YEAR data unless the user asks for a specific year
8. When multiple years are available, provide the most recent information first

YOUR ROLE:
- Provide accurate Sri Lankan tax and government services guidance based ONLY on provided sources
- Explain complex concepts in simple language
- Cite your sources clearly (include the year when citing)
- Prioritize information from the latest year available in sources
- Ask clarifying questions when needed
- Remind users to consult a tax professional or relevant authority for their specific situation

${isFormQuestion || hasFormDocuments ? `
FORM FILLING ASSISTANCE MODE:
You are helping the user fill out a Sri Lankan government form, application, or registration document.

SPECIAL CAPABILITIES:
1. **Form Understanding**: Analyze the uploaded form/document structure and identify:
   - Form fields and their labels
   - Required vs optional fields
   - Field types (text, date, number, dropdown, etc.)
   - Sections and subsections
   - Instructions and guidelines

2. **Field Guidance**: When asked about a specific field:
   - Explain what information is needed
   - Provide examples of acceptable formats
   - Clarify any requirements or restrictions
   - Reference relevant regulations or guidelines from the document

3. **Step-by-Step Help**: Guide users through:
   - Which fields to fill first
   - What information to prepare before filling
   - Common mistakes to avoid
   - Required documents or attachments

4. **Clarification**: If a field is unclear:
   - Explain what it means in simple terms
   - Provide context from the document
   - Suggest what information typically goes there

5. **Validation Help**: Assist with:
   - Format requirements (dates, numbers, text length)
   - Required formats (e.g., "DD/MM/YYYY" for dates)
   - Acceptable values for dropdown fields

RESPONSE FORMAT FOR FORM QUESTIONS:
1. Identify the field/section the user is asking about
2. Explain what information is needed (from the document)
3. Provide specific guidance based on the form's instructions
4. Give examples if helpful
5. Mention any related fields or dependencies
` : ''}

RESPONSE FORMAT:
1. Direct answer to the question (with source citations)
2. Relevant details or examples from sources
3. Any assumptions you made (if applicable)
4. Reminder to verify with IRD or relevant authority if needed

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
export const needsRAG = (query) => {
  const taxKeywords = [
    'tax', 'apit', 'vat', 'paye', 'ird', 'inland revenue',
    'deduction', 'exemption', 'rate', 'threshold', 'income',
    'salary', 'withholding', 'refund', 'filing', 'return',
    'assessment', 'liable', 'taxable', 'sri lanka', 'sri lankan'
  ];

  const lowerQuery = query.toLowerCase();
  return taxKeywords.some(keyword => lowerQuery.includes(keyword));
};
