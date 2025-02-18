import express from 'express';
import { signup, login, logout, checkAuth, getCurrentUser, getUserById } from '../controllers/auth.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/user', protectedRoute, getCurrentUser);
router.get('/check', protectedRoute, checkAuth);
router.get('/:id', protectedRoute, getUserById); // Added getUserById route

export default router;
