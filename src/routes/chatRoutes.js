import express from 'express';
import { sendMessage, getStatus } from '../controllers/chatController.js';

const router = express.Router();

router.post('/message', sendMessage);
router.get('/status', getStatus);

export default router;
