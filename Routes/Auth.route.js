// Importing required modules
import dotenv from 'dotenv';
import express from 'express';

// Importing middleware
import authMiddleware from '../Middleware/auth.middleware.js';

// Importing controllers
import { userSignup, userLogin, changePassword, getAllUsersRole, getAllUsers } from '../Controllers/auth.controller.js';

// Configuring dotenv
dotenv.config();

// Initializing router
const router = express.Router();

// Route for Signup
router.post('/signup', userSignup);

// Route for Login
router.post('/login', userLogin);

// Route for Change Password
router.post('/change-password', authMiddleware, changePassword);

// Route for Fetching all the users based on the roles
router.get('/:role/all', getAllUsersRole);

// Route for Fetching all the users
router.get('/all', getAllUsers);

// Exporting router
export default router;