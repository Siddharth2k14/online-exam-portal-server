// Importing required modules
import express from 'express';
import mongoose from 'mongoose';

// Importing models
import ObjectiveQuestionModel from '../Models/ObjectiveQuestion.model.js';
import SubjectiveQuestionModel from '../Models/SubjectiveQuestion.model.js';

// Importing controllers
import { createObjectiveQuestion, createSubjectiveQuestion, deleteObjectiveExam, deleteSubjectiveExam, getAllExams, getExam, getObjectiveExam, getSubjectiveExam } from '../Controllers/question.controller.js';

// Initializing router
const router = express.Router();

// Creating database indexes for better performance
const ensureIndexes = async () => {
  try {
    await ObjectiveQuestionModel.collection.createIndex({ exam_name: 1 });
    await SubjectiveQuestionModel.collection.createIndex({ exam_name: 1 });
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Call this when server starts
ensureIndexes();

// Route for creating objective questions
router.post('/objective', createObjectiveQuestion);

// Route for creating subjective questions
router.post('/subjective', createSubjectiveQuestion);

// Route for getting all exams
router.get('/all', getAllExams);

// Route for getting specific exam
router.get('/exam/:examTitle', getExam);

// Route for getting objective questions
router.get('/objective/:examTitle', getObjectiveExam);

// Route for getting subjective questions
router.get('/subjective/:examTitle', getSubjectiveExam);

// Route for deleting objective exam
router.delete('/objective/:exam_title', deleteObjectiveExam);

// Route for deleting subjective exam
router.delete('/subjective/:exam_title', deleteSubjectiveExam);

// Exporting the router
export default router;