// Importing express
import express from 'express';

// Importing controllers
import { getAllSubmissions, submitExam, submitResult } from '../Controllers/submission.controller.js';

// Initializing the router
const router = express.Router();

// Route to submit the exam
router.post('/submit', submitExam);

// Get submission result
router.get('/result/:submissionId', submitResult);

// Get all submissions
router.get('/all', getAllSubmissions);

export default router;