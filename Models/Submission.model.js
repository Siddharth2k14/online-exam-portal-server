import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
    examTitle: { type: String, required: true },
    examType: { type: String, required: true },
    answers: { type: Array, required: true },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    submissionTime: { type: Date, default: Date.now },
    // Optional user tracking - remove if you don't have user auth
    userEmail: { type: String },
    userName: { type: String }
});

const SubmissionModel = mongoose.model("Submission", SubmissionSchema);

export default SubmissionModel;