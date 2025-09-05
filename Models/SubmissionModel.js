import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    },

    exam_id: {
        type: String,
        required: true
    },

    exam_title: {
        type: String,
        required: true
    },

    exam_type: {
        type: String,
        enum: ['Objective', 'Subjective', 'Mixed'],
        required: true
    },

    answers: [{
        question_index: {
            type: Number,
            required: true
        },

        answer: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        question_text: {
            type: String,
            required: true
        },

        is_correct: {
            type: Boolean,
            default: null
        }
    }],

    score: {
        objective_score: {
            type: Number,
            default: 0
        },

        subjective_score: {
            type: Number,
            default: 0
        },

        total_score: {
            type: Number,
            default: 0
        }
    },

    total_questions: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['Completed', 'Pending Review'],
        default: 'Completed'
    },

    submitted_at: {
        type: Date,
        default: Date.now
    },

    reviewed_at: {
        type: Date,
        default: null
    },

    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        default: null
    }
});

SubmissionSchema.index({
    student_id: 1,
    exam_title: 1
});

SubmissionSchema.index({
    exam_title: 1
});

SubmissionSchema.index({
    submitted_at: -1
});

const SubmissionModel = mongoose.model("Submission", SubmissionSchema);
export default SubmissionModel;