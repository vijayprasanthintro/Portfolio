import { Router } from 'express';
import {
  getPublicContent,
  getAsset,
  getSection,
  saveSection,
  resetSection,
} from '../controllers/contentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getPublicContent);
// Must be registered before '/:section' so it isn't treated as a section name.
router.get('/asset/*', getAsset);

// Admin (protected)
router.get('/:section', protect, getSection);
router.put('/:section', protect, saveSection);
router.delete('/:section', protect, resetSection);

export default router;
