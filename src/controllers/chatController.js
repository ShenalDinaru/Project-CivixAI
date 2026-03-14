import { generateRAGResponse, getRAGStatus } from '../services/ragService.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use RAG service (automatically decides whether to use RAG or not)
    const response = await generateRAGResponse(message, conversationHistory);

    res.json({
      success: true,
      response: response.content,
      model: response.model,
      usage: response.usage,
      rag: response.rag || { used: false }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get RAG system status endpoint
 */
export const getStatus = async (req, res, next) => {
  try {
    const status = getRAGStatus();
    res.json({
      success: true,
      rag: status
    });
  } catch (error) {
    next(error);
  }
};
