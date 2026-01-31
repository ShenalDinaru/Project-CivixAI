import { generateResponse } from '../services/openRouterService.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call OpenRouter API
    const response = await generateResponse(message, conversationHistory);

    res.json({
      success: true,
      response: response.content,
      model: response.model,
      usage: response.usage
    });
  } catch (error) {
    next(error);
  }
};
