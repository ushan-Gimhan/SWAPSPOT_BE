import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middlewares';
import { accessChat, fetchMyChats, sendMessage, allMessages } from '../controllers/chat.controller';

const router = Router();

// Create or access a chat
router.post('/', authenticate, accessChat);

// Get all chats for sidebar
router.get('/getMyChat', authenticate, fetchMyChats);

// Send a message
router.post('/message', authenticate, sendMessage);

router.get('/user-chats', authenticate, fetchMyChats);

// Get messages for a specific chat ID
router.get('/:chatId', authenticate, allMessages);

export default router;