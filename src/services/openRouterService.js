import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Generate response from OpenRouter API
 * Can be used with or without RAG context
 * 
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages
 * @param {string} customSystemPrompt - Custom system prompt (for RAG)
 * @returns {Promise<Object>} Response from AI
 */
export const generateResponse = async (userMessage, conversationHistory = [], customSystemPrompt = null) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Use custom system prompt (for RAG) or default
  const systemContent = customSystemPrompt || `You are CivixAI, a helpful and knowledgeable personal tax assistant catering to Sri Lankan citizens. Your role is to:

- Provide clear, accurate information about tax laws, deductions, and credits
- Help users understand their tax obligations and opportunities
- Explain complex tax concepts in simple, easy-to-understand language
- Guide users through tax planning and preparation
- Offer tips for maximizing deductions and minimizing tax liability
- Stay current with tax regulations and changes

IMPORTANT GUIDELINES:
- Always remind users that while you provide helpful information, you are not a substitute for a licensed tax professional or CPA
- Recommend consulting with a tax professional for complex situations or before making major financial decisions
- Be honest when you don't have enough information to provide specific advice
- Ask clarifying questions when needed to provide accurate guidance
- Never guarantee specific outcomes or make promises about tax results
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
    const temperature = customSystemPrompt ? 0.1 : 0.7;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: messages,
        temperature: temperature
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
    
    return {
      content: completion.content,
      model: response.data.model,
      usage: response.data.usage
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenRouter API Error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw new Error(`Failed to generate response: ${error.message}`);
  }
};