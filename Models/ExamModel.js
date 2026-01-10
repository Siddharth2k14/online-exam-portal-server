import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    examType: {
        type: String,
        enum: ["objective", "subjective"],
        required: true
    },

    duration: {
        type: Number,
        required: true
    },

    startTime: Date,
    endTime: Date,

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

const ExamModel = mongoose.model("Exam", ExamSchema);

export default ExamModel;