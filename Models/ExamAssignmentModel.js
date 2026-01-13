import mongoose from "mongoose";

const ExamAssignmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
    },

    exam_name: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ["assigned", "started", "completed"],
        default: "assigned",
    },

    assignedAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate assignment
ExamAssignmentSchema.index(
    { studentId: 1, exam_name: 1 },
    { unique: true }
);

export default mongoose.model("ExamAssignment", ExamAssignmentSchema);