// Importing express
import express from "express";

// Importing middleware
import checkExamAccess from "../Middleware/checkExamAccess.middleware.js";
import verifyToken from "../Middleware/auth.middleware.js";
import dotenv from "dotenv";

// Importing controllers
import examController from "../Controllers/assignExam.controller.js";

// Configuring dotenv
dotenv.config();

// Initializing the router
const router = express.Router();

// Route for getting objective questions of an exam
router.get("/exam/:examTitle/objective-questions", verifyToken, checkExamAccess, examController.objectiveExam);

// Route for getting subjective questions of an exam
router.get("/exam/:examTitle/subjective-questions", verifyToken, checkExamAccess, examController.subjectiveExam);

// Route for starting an exam
router.post("/exam/:examTitle/start", verifyToken, checkExamAccess, examController.startExam);

// Route for getting assigned exams of a student
router.get("/assigned", verifyToken, examController.assignedExam);

// Route for assigning an exam to a student
router.post("/assign", examController.assignExam);

// Exporting the router
export default router;