import express from 'express';
import { listMusicInAlbum } from '../controllers/albumController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { param } from 'express-validator'; 

const router = express.Router();

// GET /api/v1/albums/:albumId/music - List music in an album
router.get(
    '/:albumId/music',
    param('albumId').isMongoId().withMessage('Invalid Album ID format'),
    validateRequest, 
    listMusicInAlbum
);

export default router;