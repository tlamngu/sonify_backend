import Genre from '../models/genre.model.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

export const createGenre = async (req, res, next) => {
    const { name } = req.body;

    try {
        const normalizedName = name.trim();
        const existingGenre = await Genre.findOne({
            name: { $regex: `^${normalizedName}$`, $options: 'i' }
        });

        if (existingGenre) {
            return sendSuccess(res, 200, existingGenre, 'Genre already exists.');
        }

        const newGenre = new Genre({ name: normalizedName });
        await newGenre.save();

        sendSuccess(res, 201, newGenre, 'Genre created successfully.');
    } catch (error) {
        if (error.code === 11000) {
            return sendError(res, 409, 'Genre name already exists (concurrent creation).');
        }
        next(error);
    }
};