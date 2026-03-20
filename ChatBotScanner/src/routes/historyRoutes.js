import express from 'express';
import {
  saveConversation,
  listConversations,
  getConversation,
  deleteConversation,
  clearHistory,
  updateConversationTitle
} from '../controllers/historyController.js';

const router = express.Router();

// Save a conversation
router.post('/save', saveConversation);

// List all conversations for a user
router.get('/list', listConversations);

// Get a specific conversation
router.get('/:userId/:conversationId', getConversation);

// Delete a specific conversation
router.delete('/:userId/:conversationId', deleteConversation);

// Update conversation title
router.put('/:userId/:conversationId/title', updateConversationTitle);

// Clear all history for a user
router.delete('/:userId/all', clearHistory);

export default router;
