// In: ../routes/genreRoutes.js
import express from 'express';
import { createGenre } from '../controllers/genreController.js';
import { createGenreValidation } from '../validators/genreValidators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/v1/genres - Create a new genre
router.post(
    '/',
    protect,
    authorize('admin', 'artist'),
    createGenreValidation,
    validateRequest,
    createGenre
);

// Future: GET /api/v1/genres - List all genres (public or protected)
// router.get('/', listGenres);

export default router;