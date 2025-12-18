import mongoose from "mongoose";

const ObjectiveQuestionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
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

    timer: {
        type: Number,
        required: true,
        unique: false,
        default: null,
    },

});

const ObjectiveOuestionModel = mongoose.model("Question", ObjectiveQuestionSchema);
export default ObjectiveOuestionModel;