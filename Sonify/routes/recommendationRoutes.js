// In: ../routes/recommendationRoutes.js
import express from 'express';
import { getMusicRecommendations } from '../controllers/recommendationController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect } from '../middlewares/authMiddleware.js';
import { query } from 'express-validator';

const router = express.Router();

// GET /api/v1/recommendations/music - Get music recommendations for the user
router.get(
    '/music',
    protect,
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt(), // Max 20 recommendations per page
    validateRequest,
    getMusicRecommendations
);

export default router;