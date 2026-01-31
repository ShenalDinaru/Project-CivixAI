import express from 'express';
import { sendMessage } from '../controllers/chatController.js';

const router = express.Router();

router.post('/message', sendMessage);

export default router;
