import SubjectiveOuestionModel from "../Models/SubjectiveOuestionModel.js";
import checkExamAccess from "../Middleware/checkExamAccess.js";
import ObjectiveOuestionModel from "../Models/ObjectiveOuestionModel.js";
import express from "express";
import verifyToken from "../Middleware/authMiddleware.js";
import checkExamAccess from "../Middleware/checkExamAccess.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get(
    "/exam/:examId/objective-questions",
    verifyToken,
    checkExamAccess,
    async (req, res) => {
        const questions = await ObjectiveOuestionModel.find({
            examId: req.params.examId
        });

        res.json(questions);
    }
);

router.get(
    "/exam/:examId/subjective-questions",
    verifyToken,
    checkExamAccess,
    async (req, res) => {
        const questions = await SubjectiveOuestionModel.find({
            examId: req.params.examId
        });

        res.json(questions);
    }
);

router.post(
    "/exam/:examId/start",
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