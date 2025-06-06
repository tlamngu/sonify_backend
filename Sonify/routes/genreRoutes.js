// In: ../routes/genreRoutes.js
import express from 'express';
import { createGenre, listGenre } from '../controllers/genreController.js';
import { createGenreValidation } from '../validators/genreValidators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
    '/',
    protect,
    authorize('admin', 'artist'),
    createGenreValidation,
    validateRequest,
    createGenre
);

router.get('/list', listGenre);

export default router;