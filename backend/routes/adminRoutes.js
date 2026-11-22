import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { uploadResumeFile, uploadMediaFile } from '../middleware/upload.js';
import {
  getAssets,
  uploadAsset,
  replaceAsset,
  deleteAsset,
  getResume,
  uploadResume,
  deleteResume,
} from '../controllers/assetController.js';
import { getOverview } from '../controllers/overviewController.js';

const router = Router();
router.use(protect);

// Uploads are authenticated and capped independently of page requests.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads. Please try again later.' },
});

router.get('/overview', getOverview);

router.get('/assets', getAssets);
router.post('/assets', uploadLimiter, uploadMediaFile, uploadAsset);
router.put('/assets/key/:key', uploadLimiter, uploadMediaFile, replaceAsset);
router.delete('/assets/key/:key', deleteAsset);

router.get('/resume', getResume);
router.post('/resume', uploadLimiter, uploadResumeFile, uploadResume);
router.delete('/resume', deleteResume);

export default router;
