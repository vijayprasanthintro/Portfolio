import { Router } from 'express';
import { streamAsset } from '../controllers/assetController.js';

const router = Router();

// Stable key URLs are registered first so they are not parsed as ObjectIds.
router.get('/k/:key', streamAsset);
router.get('/:id', streamAsset);

export default router;
