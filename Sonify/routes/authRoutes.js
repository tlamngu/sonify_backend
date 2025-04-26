import express from 'express';
import {
    signup,
    login,
    requestVerification,
    verifyEmail,
    logout,
    getMe
} from '../controllers/authController.js';
import {
    signupValidation,
    loginValidation,
    requestVerificationValidation,
} from '../validators/authValidators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signupValidation, validateRequest, signup);
router.post('/login', loginValidation, validateRequest, login);
router.post(
    '/request-verification',
    requestVerificationValidation,
    validateRequest,
    requestVerification
);
router.get('/verify/t/:token', verifyEmail);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;