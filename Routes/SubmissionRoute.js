import express from "express";
import SubmissionModel from "../Models/SubmissionModel.js";
import User from "../Models/AuthModel.js";
import ObjectiveQuestionModel from "../Models/ObjectiveOuestionModel.js";
import SubjectiveQuestionModel from "../Models/SubjectiveOuestionModel.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

function areAnswerSimilar(studentAns, correctAns) {
    if (!studentAns || !correctAns) {
        return false;
    }

    const clean = (str) => {
        return str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\\-_`~()]/g, "").split(/\s+/).filter(Boolean)
    }

    const studentWords = new Set(clean(studentAns));
    const correctWords = new Set(clean(correctAns));

    let matchCount = 0;
    correctWords.forEach((word) => {
        if (studentWords.has(word)) {
            matchCount++;
        }
    });

    return matchCount / correctWords.size >= 0.7;
}

// Submit exam
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { examTitle, examType, answers, questions } = req.body;
        const studentId = req.user._id || req.user.id;

        console.log('=== EXAM SUBMISSION DEBUG ===');
        console.log('Student ID:', studentId);
        console.log('Exam Title:', examTitle);
        console.log('Exam Type:', examType);
        console.log('Answers received:', answers);

        // Validation
        if (!examTitle || !examType || !answers || !questions) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const existingSubmission = await SubmissionModel.findOne({
            student_id: studentId,
            exam_title: examTitle
        });

        if (existingSubmission) {
            return res.status(400).json({
                message: 'You have already submitted this exam'
            });
        }

        let objectiveScore = 0;
        let subjectiveScore = 0;
        let totalScore = 0;
        let status = 'Completed';
        let processedAnswer = [];

        // Process answers based on the type of exam
        if (examType === 'Objective') {
            questions.forEach((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = (
                    (typeof question.correct_option === "number" && userAnswer === question.correct_option) || (typeof question.correct_option === "string" && question.options[userAnswer] === question.correct_option)
                );

                if (isCorrect) {
                    objectiveScore++;
                }

                processedAnswer.push({
                    question_index: index,
                    answer: userAnswer,
                    question_text: question.question_text,
                    is_correct: isCorrect
                });
            });

            totalScore = objectiveScore;
        }

        else if (examType === 'Subjective') {
            questions.forEach((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = areAnswerSimilar(userAnswer, question.answer);

                if (isCorrect) subjectiveScore++;

                processedAnswer.push({
                    question_index: index,
                    answer: userAnswer,
                    question_text: question.question_text,
                    is_correct: null // or isCorrect if auto-grading is desired
                });
            });

            status = 'Pending Review';
            totalScore = 0;
        }


        else if (examType === 'Mixed') {
            // Handle mixed exams - process both objective and subjective questions
            questions.forEach((question, index) => {
                const userAnswer = answers[index];

                if (question.options) {
                    // Objective question
                    const isCorrect = (
                        (typeof question.correct_option === "number" && userAnswer === question.correct_option) ||
                        (typeof question.correct_option === "string" && question.options[userAnswer] === question.correct_option)
                    );

                    if (isCorrect) {
                        objectiveScore++;
                    }

                    processedAnswer.push({
                        question_index: index,
                        answer: userAnswer,
                        question_text: question.question_text,
                        is_correct: isCorrect
                    });
                } else {
                    // Subjective question
                    processedAnswer.push({
                        question_index: index,
                        answer: userAnswer,
                        question_text: question.question_text,
                        is_correct: null
                    });
                }
            });

            status = 'Pending Review';
            totalScore = objectiveScore; // Only count objective for now, subjective needs manual review


            // Create submission record
            const submission = new SubmissionModel({
                student_id: studentId,
                exam_id: examTitle,
                exam_title: examTitle,
                exam_type: examType,
                answers: processedAnswer,
                score: {
                    objective_score: objectiveScore,
                    subjective_score: subjectiveScore,
                    total_score: totalScore
                },
                total_questions: questions.length,
                status
            });


            await submission.save();

            console.log('Submission saved successfully:', submission._id);
            console.log('=== END EXAM SUBMISSION DEBUG ===');

            res.status(201).json({
                message: 'Exam submitted successfully',
                submission: {
                    id: submission._id,
                    exam_title: examTitle,
                    score: {
                        objective_score: objectiveScore,
                        subjective_score: subjectiveScore,
                        total_score: totalScore
                    },
                    total_questions: questions.length,
                    status: status,
                    submitted_at: submission.submitted_at
                }
            });
        }
    }

    catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({
            message: 'Failed to submit exam',
            error: error.message
        });
    }
});

router.get('/student/:studentId', authMiddleware, async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== studentId) {
            return res.status(403).json({
                message: 'Access Denied'
            });
        }

        const submission = await SubmissionModel.find({ student_id: studentId }).populate('student_id', 'name email').sort({ submitted_at: -1 });

        res.json(submission);
    }
    catch (error) {
        console.error('Error fetching student submission', error);
        res.status(500).json({
            message: 'Failed to fetch submissions'
        });
    };
});

router.get('/student/:studentId/history', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await User.findById(studentId).select('name email phoneNumber role');
        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        const submissions = await SubmissionModel.find({ student_id: studentId }).sort({ submitted_at: -1 });

        const examHistory = submissions.map(submission => ({
            _id: submission._id,
            examName: submission.exam_title,
            exam: submission.exam_title,
            attemptedAt: submission.submitted_at,
            status: submission.status,
            totalScore: submission.score.total_score,
            score: submission.score.total_score,
            objectiveScore: submission.score.objective_score,
            subjectiveScore: submission.score.subjective_score,
            totalObjectiveMarks: submission.answers.filter(a => a.is_correct !== null).length,
            totalSubjectiveMarks: submission.answers.filter(a => a.is_correct === null).length,
            hasObjective: submission.score.objective_score > 0 || submission.exam_type === 'Objective',
            hasSubjective: submission.score.subjective_score > 0 || submission.exam_type === 'Subjective',
            totalQuestions: submission.total_questions
        }));

        res.json({
            student,
            examHistory,
            totalExamAttempted: submissions.length
        });
    } catch (error) {
        console.error('Error fetching student exam history:', error);
        res.status(500).json({ message: 'Failed to fetch exam history' });
    }
});

router.get('/exam/:examTitle', authMiddleware, async (req, res) => {
    try {
        const { examTitle } = req.params;

        // Only admins can view all submissions for an exam
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const submissions = await SubmissionModel.find({ exam_title: examTitle })
            .populate('student_id', 'name email')
            .sort({ submitted_at: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching exam submissions:', error);
        res.status(500).json({ message: 'Failed to fetch submissions' });
    }
});

router.get('/all', authMiddleware, async (req, res) => {
    try {
        // Only admins can view all submissions
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const submissions = await SubmissionModel.find()
            .populate('student_id', 'name email')
            .sort({ submitted_at: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching all submissions:', error);
        res.status(500).json({ message: 'Failed to fetch submissions' });
    }
});

router.put('/review/:submissionId', authMiddleware, async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { subjectiveScore, reviewedAnswers } = req.body;

        // Only admins can review submissions
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const submission = await SubmissionModel.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Update subjective answers if provided
        if (reviewedAnswers) {
            reviewedAnswers.forEach(review => {
                const answerIndex = submission.answers.findIndex(
                    a => a.question_index === review.question_index
                );
                if (answerIndex !== -1) {
                    submission.answers[answerIndex].is_correct = review.is_correct;
                }
            });
        }

        // Update scores
        if (subjectiveScore !== undefined) {
            submission.score.subjective_score = subjectiveScore;
            submission.score.total_score = submission.score.objective_score + subjectiveScore;
        }

        // Update status and review info
        submission.status = 'Completed';
        submission.reviewed_at = new Date();
        submission.reviewed_by = req.user._id;

        await submission.save();

        res.json({
            message: 'Submission reviewed successfully',
            submission
        });
    } catch (error) {
        console.error('Error reviewing submission:', error);
        res.status(500).json({ message: 'Failed to review submission' });
    }
});

export default router;