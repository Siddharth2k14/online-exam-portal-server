import ExamAssignmentModel from "../Models/ExamAssignmentModel.js";

const checkExamAccess = async (req, res, next) => {
    try {
        const { examId } = req.params;

        const assignment = await ExamAssignmentModel.findOne({
            studentId: req.user.id,
            examId
        });

        if (!assignment) {
            return res.status(403).json({
                message: "Exam not assigned to this student"
            });
        }

        req.assignment = assignment; // optional, useful later
        next();
    } catch (error) {
        res.status(500).json({ message: "Access check failed" });
    }
};

export default checkExamAccess;
