import ExamAssignmentModel from "../Models/ExamAssignmentModel.js";

export const checkExamAccess = async (req, res, next) => {
    const examId = req.params.examId;

    const assignment = await ExamAssignmentModel.findOne({
        studentId: req.user.id,
        examId
    });

    if (!assignment) {
        return res.status(403).json({ message: "Exam not assigned" });
    }

    req.assignment = assignment;
    next();
};
