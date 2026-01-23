import ExamAssignment from "../Models/ExamAssignment.model.js";
import User from "../Models/Auth.model.js";

/*
Request Body:
{
  exam_name: "Maths Test",
  studentId: "64ab123..."
}
*/

export const assignExam = async (req, res) => {
    try {
        const { exam_name, studentId } = req.body;

        // ---------------- VALIDATION ----------------
        if (!exam_name || !studentId) {
            return res.status(400).json({
                message: "exam_name and studentId are required",
            });
        }

        // ---------------- CHECK STUDENT ----------------
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        if (student.role !== "student") {
            return res.status(400).json({
                message: "User is not a student",
            });
        }

        // ---------------- CHECK DUPLICATE ASSIGNMENT ----------------
        const existingAssignment = await ExamAssignment.findOne({
            studentId,
            exam_name,
        });

        if (existingAssignment) {
            return res.status(409).json({
                message: "Exam already assigned to this student",
            });
        }

        // ---------------- CREATE ASSIGNMENT ----------------
        const assignment = await ExamAssignment.create({
            studentId,
            exam_name,
            status: "assigned",
        });

        return res.status(201).json({
            message: "Exam assigned successfully",
            assignment,
        });

    } catch (error) {
        console.error("Assign Exam Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};