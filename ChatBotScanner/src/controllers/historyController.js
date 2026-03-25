import { db } from '../config/firebase.js';

/**
 * Save a conversation to Firestore
 */
export const saveConversation = async (req, res, next) => {
  try {
    const { userId, title, conversation, uploadedDocuments = [], id } = req.body;

    if (!userId || !conversation || !Array.isArray(conversation)) {
      return res.status(400).json({ 
        error: 'userId and conversation array are required' 
      });
    }

    const conversationsRef = db.collection('chat_history').doc(userId).collection('conversations');
    const conversationRef = id ? conversationsRef.doc(id) : conversationsRef.doc();
    let createdAt = new Date();

    if (id) {
      const existingConversation = await conversationRef.get();
      if (existingConversation.exists) {
        const existingData = existingConversation.data() || {};
        createdAt = existingData.createdAt?.toDate?.() || existingData.createdAt || createdAt;
      }
    }

    await conversationRef.set({
      title: title || `Chat ${new Date().toLocaleString()}`,
      conversation: conversation,
      uploadedDocuments: Array.isArray(uploadedDocuments) ? uploadedDocuments : [],
      createdAt,
      updatedAt: new Date(),
      messageCount: conversation.length
    });

    res.json({
      success: true,
      id: conversationRef.id,
      message: 'Conversation saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for a user
 */
export const listConversations = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db
      .collection('chat_history')
      .doc(userId)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();

    const conversations = [];
    snapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      });
    });

    res.json({
      success: true,
      conversations: conversations,
      count: conversations.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific conversation
 */
export const getConversation = async (req, res, next) => {
  try {
    const { userId, conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'userId and conversationId are required' });
    }

    const doc = await db
      .collection('chat_history')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const data = doc.data();
    res.json({
      success: true,
      id: doc.id,
      title: data.title,
      conversation: data.conversation,
      uploadedDocuments: Array.isArray(data.uploadedDocuments) ? data.uploadedDocuments : [],
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      messageCount: data.messageCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific conversation
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const { userId, conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'userId and conversationId are required' });
    }

    await db
      .collection('chat_history')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .delete();

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all conversation history for a user
 */
export const clearHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db
      .collection('chat_history')
      .doc(userId)
      .collection('conversations')
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'All conversations deleted',
      count: snapshot.size
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update conversation title
 */
export const updateConversationTitle = async (req, res, next) => {
  try {
    const { userId, conversationId } = req.params;
    const { title } = req.body;

    if (!userId || !conversationId || !title) {
      return res.status(400).json({ error: 'userId, conversationId, and title are required' });
    }

    await db
      .collection('chat_history')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .update({
        title: title,
        updatedAt: new Date()
      });

    res.json({
      success: true,
      message: 'Conversation title updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
