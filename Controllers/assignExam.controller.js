// Importing models
import ExamAssignmentModel from "../Models/ExamAssignment.model.js";
import ObjectiveQuestionModel from "../Models/ObjectiveQuestion.model.js";
import SubjectiveQuestionModel from "../Models/SubjectiveQuestion.model.js";

// Assigning an exam to a student
const assignExam = async (req, res) => {
    try {
        const { exam_name, studentId, exam_type } = req.body;

        if (!exam_name || !studentId || !exam_type) {
            return res.status(400).json({ message: "Missing exam name or student ID" });
        }

        const assignment = new ExamAssignmentModel({
            studentId,
            exam_name,
            exam_type,
            status: "assigned",
            assignedAt: new Date()
        });

        await assignment.save();

        res.json({ message: "Exam assigned successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to assign exam" });
    }
};

// Fetching objective questions
const objectiveExam = async (req, res) => {
    try {
        const questions = await ObjectiveQuestionModel.find({
            exam_name: req.params.examTitle
        });

        res.json(questions);
    } catch (error) {
        console.error("Objective Exam Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Fetching subjective questions
const subjectiveExam = async (req, res) => {
    try {
        const questions = await SubjectiveQuestionModel.find({
            exam_name: req.params.examTitle
        });

        res.json(questions);
    } catch (error) {
        console.error("Subjective Exam Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Starting the exam
const startExam = async (req, res) => {
    try {
        const assignment = req.assignment;

        if (assignment.attemptCount >= 1) {
            return res.status(403).json({
                message: "Attempt limit exceeded"
            });
        }

        assignment.status = "started";
        assignment.attemptCount += 1;
        await assignment.save();

        res.json({
            message: "Exam started successfully"
        });
    } catch (error) {
        console.error("Start Exam Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Fetching assigned exams to a student
const assignedExam = async (req, res) => {
    try {
        const studentId = req.user.id;
        const assignments = await ExamAssignmentModel.find({
            studentId
        }).lean();

        const exams = assignments.map(a => ({
            exam_name: a.exam_name,
            status: a.status,
            assignedAt: a.assignedAt,
            exam_type: a.exam_type,
            question_count: a.question_count
        }));

        res.json({
            exams
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch assigned exams" });
    }
}

export default {
    assignExam,
    objectiveExam,
    subjectiveExam,
    startExam,
    assignedExam
};