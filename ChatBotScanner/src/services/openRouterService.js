import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getCurrentDateLabel = () => new Date().toISOString().slice(0, 10);

const DEFAULT_WEB_SEARCH_PROMPT = `A web search was conducted to verify the most current answer.
Today's date is ${getCurrentDateLabel()}.
Use the official search results to keep the response up to date.
Prefer the newest applicable official guidance when multiple versions exist.
Cite web-derived claims using short markdown links.`;

const extractWebSources = (annotations = []) => {
  const uniqueSources = new Map();

  annotations.forEach((annotation) => {
    if (annotation?.type !== 'url_citation' || !annotation.url_citation?.url) {
      return;
    }

    const { url, title, content } = annotation.url_citation;
    let hostname = url;

    try {
      hostname = new URL(url).hostname;
    } catch (error) {
      hostname = url;
    }

    if (!uniqueSources.has(url)) {
      uniqueSources.set(url, {
        title: title || hostname,
        source: hostname,
        url,
        snippet: content || null
      });
    }
  });

  return Array.from(uniqueSources.values());
};

/**
 * Generate response from OpenRouter API
 * Can be used with or without RAG context
 * 
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages
 * @param {string} customSystemPrompt - Custom system prompt (for RAG)
 * @param {Object} options - Additional request options
 * @returns {Promise<Object>} Response from AI
 */
export const generateResponse = async (
  userMessage,
  conversationHistory = [],
  customSystemPrompt = null,
  options = {}
) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseModel = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
  const {
    enableWebSearch = false,
    webSearchDomains = [],
    webSearchEngine = 'exa',
    webSearchMaxResults = 5,
    webSearchPrompt = DEFAULT_WEB_SEARCH_PROMPT,
    temperature: customTemperature
  } = options;

  const model = enableWebSearch
    ? (process.env.OPENROUTER_ONLINE_MODEL || baseModel)
    : baseModel;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Use custom system prompt (for RAG) or default
  const systemContent = customSystemPrompt || `You are Kandula, a helpful and knowledgeable Sri Lankan civic assistant for citizens and residents.
Today's date is ${getCurrentDateLabel()}.

Your role is to:

- Provide clear, accurate information about Sri Lankan government services, civic procedures, and official requirements
- Help users understand topics such as taxes, licences, registrations, documents, fees, and public-service processes
- Explain complex civic, tax, and procedural concepts in simple, easy-to-understand language
- Guide users through official processes step by step when reliable information is available
- Stay grounded in official guidance and the knowledge base when those sources are available

IMPORTANT GUIDELINES:
- Unless the user explicitly asks for older or historical information, answer using the latest/current information available to you
- If the user asks for historical information, clearly label the answer as historical and do not mix it with current guidance
- If multiple dates, rates, thresholds, or rules could apply, prefer the newest applicable one unless the user asked for a past period
- If a topic is outside the currently covered Sri Lankan departments or you do not have enough evidence, say so clearly instead of guessing
- For taxes, legal matters, or document-sensitive issues, remind users to verify with the relevant Sri Lankan department or a qualified professional when needed
- Be honest when you don't have enough information to provide specific advice
- Ask clarifying questions when needed to provide accurate guidance
- Never guarantee specific outcomes or make promises about approvals, tax results, or government decisions
- Respect user privacy and handle financial information with care

Be friendly, professional, and supportive in all interactions.`;

  const systemMessage = {
    role: 'system',
    content: systemContent
  };

  // Build messages array with system instruction
  const messages = [
    systemMessage,
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    // Use lower temperature for RAG (more factual)
    // Higher temperature for general chat (more creative)
    const temperature = customTemperature ?? (customSystemPrompt ? 0.1 : 0.7);
    const plugins = enableWebSearch
      ? [{
          id: 'web',
          engine: webSearchEngine,
          max_results: webSearchMaxResults,
          ...(webSearchDomains.length > 0 && { include_domains: webSearchDomains }),
          ...(webSearchPrompt && { search_prompt: webSearchPrompt })
        }]
      : undefined;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: messages,
        temperature: temperature,
        ...(plugins && { plugins })
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CivixAI Chatbot'
        }
      }
    );

    const completion = response.data.choices[0].message;
    const webSources = extractWebSources(completion.annotations || []);
    
    return {
      content: completion.content,
      model: response.data.model,
      usage: response.data.usage,
      webSearch: {
        used: enableWebSearch && webSources.length > 0,
        sources: webSources
      }
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenRouter API Error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw new Error(`Failed to generate response: ${error.message}`);
  }
};
