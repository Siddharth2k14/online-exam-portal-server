import SubjectiveOuestionModel from "../Models/SubjectiveOuestionModel.js";
import checkExamAccess from "../Middleware/checkExamAccess.js";
import ObjectiveOuestionModel from "../Models/ObjectiveOuestionModel.js";
import express from "express";
import verifyToken from "../Middleware/authMiddleware.js";
import dotenv from "dotenv";
import { assignExam } from "../Controllers/assignExamController.js";
import ExamAssignmentModel from "../Models/ExamAssignmentModel.js";
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

router.get("/assigned", verifyToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const assignments = await ExamAssignmentModel.find({
            studentId
        }).lean();

        const exams = assignments.map(a => ({
            exam_name: a.exam_name,
            status: a.status,
            assignedAt: a.assignedAt
        }));

        res.json({
            exams
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch assigned exams" });
    }
});

router.post("/assign", verifyToken, async (req, res) => {
    try {
        const { exam_name, studentId } = req.body;

        if (!exam_name || !studentId) {
            return res.status(400).json({ message: "Missing exam name or student ID" });
        }

        const assignment = new ExamAssignmentModel({
            exam_name,
            studentId,
            assignedAt: new Date(),
            status: "assigned"
        });

        await assignment.save();

        res.json({ message: "Exam assigned successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to assign exam" });
    }
})

export default router;