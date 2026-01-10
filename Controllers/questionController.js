import ExamAssignmentModel from "../Models/ExamAssignmentModel.js";

export const getQuestions = async (req, res) => {
    const { examId } = req.params;

    const assignment = await ExamAssignmentModel.findOne({
        studentId: req.user.id,
        examId
    });

    if (!assignment) {
        return res.status(403).json({ message: "Exam not assigned" });
    }
};