import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// bcrypt is intentionally expensive; cap attempts so it can't be used to
// saturate the event loop.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

router.post('/login', loginLimiter, login);
router.put('/password', protect, changePassword);

export default router;
