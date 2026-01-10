import mongoose from "mongoose";
import { ref } from "process";

const ExamAssignmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true
    },

    status: {
        type: String,
        enum: ["assigned", "completed", "started"],
        default: "assigned"
    },

    assignedAt: {
        type: Date,
        default: Date.now
    },

    attemptCount: {
        type: Number,
        default: 0
    }
});

ExamAssignmentSchema.index({
    studentId: 1,
    examId: 1
}, {
    unique: true
});

const ExamAssignmentModel = mongoose.model("ExamAssignment", ExamAssignmentSchema);

export default ExamAssignmentModel;