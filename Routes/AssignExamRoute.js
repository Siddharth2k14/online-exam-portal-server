import SubjectiveOuestionModel from "../Models/SubjectiveOuestionModel.js";
import checkExamAccess from "../Middleware/checkExamAccess.js";
import ObjectiveOuestionModel from "../Models/ObjectiveOuestionModel.js";
import express from "express";
import verifyToken from "../Middleware/authMiddleware.js";
import dotenv from "dotenv";
import { assignExam } from "../Controllers/assignExamController.js";
dotenv.config();

const router = express.Router();

router.post("/", verifyToken, assignExam);

router.get(
    "/exam/:examTitle/objective-questions",
    verifyToken,
    checkExamAccess,
    async (req, res) => {
        const questions = await ObjectiveOuestionModel.find({
            exam_name: req.params.examTitle
        });

        res.json(questions);
    }
);

router.get(
    "/exam/:examTitle/subjective-questions",
    verifyToken,
    checkExamAccess,
    async (req, res) => {
        const questions = await SubjectiveOuestionModel.find({
            exam_name: req.params.examTitle
        });

        res.json(questions);
    }
);

router.post(
    "/exam/:examTitle/start",
    verifyToken,
    checkExamAccess,
    async (req, res) => {
        const assignment = req.assignment;

        if (assignment.attemptCount >= 1) {
            return res.status(403).json({
                message: "Attempt limit exceeded"
            });
        }

        assignment.status = "started";
        assignment.attemptCount += 1;
        await assignment.save();

        res.json({ message: "Exam started successfully" });
    }
);

export default router;