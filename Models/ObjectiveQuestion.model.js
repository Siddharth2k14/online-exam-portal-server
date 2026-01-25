import mongoose from "mongoose";

const ObjectiveQuestionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
    },

    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },

    exam_name: {
        type: String,
        required: true,
        unique: false,
    },

    question_title: {
        type: String,
        required: true,
        unique: false,
    },

    options: {
        type: [String],
        required: true,
        unique: false,
    },

    correct_option: {
        type: Number,
        required: true,
        unique: false,
    },
});

const ObjectiveQuestionModel = mongoose.model("Question", ObjectiveQuestionSchema);
export default ObjectiveQuestionModel;