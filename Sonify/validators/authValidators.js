import { check } from 'express-validator';
import { User } from '../models/models.js';

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~\\/-])(?=.*[a-zA-Z]).{6,}$/;

export const signupValidation = [
    check('username', 'Username is required').notEmpty().trim(),

    check('email', 'Please include a valid email')
        .isEmail()
        .normalizeEmail()
        .custom(async (value) => {
            const user = await User.findOne({ email: value, is_deleted: false });
            if (user) {
                return Promise.reject('An active account with this E-mail already exists');
            }
        }),

    check('password', 'Password is required').notEmpty(),
    check(
        'password',
        'Password must be at least 6 characters long and include at least one number and one special character.'
    ).matches(passwordRegex),

    check('passwordConfirmation', 'Password confirmation is required').notEmpty(),
    check('passwordConfirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),
];

export const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists().notEmpty(),
];

export const requestVerificationValidation = [
    check('email', 'Please include a valid email to request verification')
        .isEmail()
        .normalizeEmail(),
];