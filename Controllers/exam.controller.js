import ExamAssignmentModel from "../Models/ExamAssignmentModel";

export const startExam = async (req, res) => {
    const { examId } = req.params;

    const assignment = await ExamAssignmentModel.findOne({
        studentId: req.user.id,
        examId
    });

    if (!assignment) {
        return res.status(403).json({ message: "Exam not assigned" });
    }
}