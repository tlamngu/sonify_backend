import express from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { toggleLike } from '../controllers/userFeaturesController.js';
import { toggleLikeValidation } from '../validators/userFeaturesValidators.js';

const router = express.Router();

// POST /api/v1/features/favorite/toggle - Toggle like status for an item
router.post(
    "/favorite/toggle", 
    protect,
    toggleLikeValidation,
    validateRequest,
    toggleLike 
);


export default router;