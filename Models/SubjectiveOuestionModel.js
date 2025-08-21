import mongoose from "mongoose";

// Models/SubjectiveOuestionModel.js
const SubjectiveQuestionSchema = new mongoose.Schema({
    exam_name: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    marks: { type: Number, required: true }, // Add this
    createdAt: { type: Date, default: Date.now }
});

const SubjectiveOuestionModel = mongoose.model("SubjectiveQuestion", SubjectiveQuestionSchema);

export default SubjectiveOuestionModel;