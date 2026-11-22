import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import {
  createContactMessage,
  getContactMessages,
  toggleContactRead,
  deleteContactMessage,
} from '../controllers/contactController.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later.' },
});

router.post('/', contactLimiter, createContactMessage);
router.get('/', protect, getContactMessages);
router.patch('/:id/read', protect, toggleContactRead);
router.delete('/:id', protect, deleteContactMessage);

export default router;
