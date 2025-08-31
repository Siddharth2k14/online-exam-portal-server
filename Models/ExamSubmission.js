import mongoose from 'mongoose';

const ExamSubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: String,
        required: true
    },
    answers: [
        {
            questionId: String, // reference to question
            answer: String, // for subjective
            selectedOption: Number, // for objective
            isCorrect: Boolean, // can be auto-evaluated for objective
            marksAwarded: Number // for subjective (after evaluation)
        }
    ],
    score: { type: Number, default: 0 },
    attemptedAt: { type: Date, default: Date.now }
});

const ExamSubmissionModel = mongoose.model('ExamSubmission', ExamSubmissionSchema);
export default ExamSubmissionModel;