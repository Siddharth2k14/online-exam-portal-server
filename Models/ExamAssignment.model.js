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
    exam_type: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["assigned", "started", "completed", "failed"],
        default: "assigned",
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
});

const ExamAssignmentModel = mongoose.model("ExamAssignment", ExamAssignmentSchema);
export default ExamAssignmentModel;