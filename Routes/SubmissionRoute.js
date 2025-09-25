import express from 'express';
import mongoose from 'mongoose';
import ObjectiveOuestionModel from '../Models/ObjectiveOuestionModel.js';
import SubjectiveOuestionModel from '../Models/SubjectiveOuestionModel.js';

const router = express.Router();

// Submission Schema
const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  examTitle: { type: String, required: true },
  examType: { type: String, enum: ['Objective', 'Subjective'], required: true },
  answers: { type: mongoose.Schema.Types.Mixed, required: true },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  submissionTime: { type: Date, default: Date.now },
  gradedAt: { type: Date }
});

// Add indexes for better performance
SubmissionSchema.index({ userId: 1, examTitle: 1 });
SubmissionSchema.index({ submissionTime: -1 });

const SubmissionModel = mongoose.model('Submission', SubmissionSchema);

// Function to calculate similarity for subjective answers
function areAnswersSimilar(studentAns, correctAns) {
  if (!studentAns || !correctAns) return false;
  
  const clean = (str) =>
    str
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\\-_`~()]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const studentWords = new Set(clean(studentAns));
  const correctWords = new Set(clean(correctAns));

  let matchCount = 0;
  correctWords.forEach((word) => {
    if (studentWords.has(word)) matchCount++;
  });

  return matchCount / correctWords.size >= 0.7;
}

// OPTIMIZED: Fast submission endpoint
router.post('/submit', async (req, res) => {
  try {
    const { examTitle, examType, answers, questionCount } = req.body;
    const userId = req.user?.id; // Assumes auth middleware sets req.user

    if (!examTitle || !examType || !answers || !userId) {
      return res.status(400).json({ 
        message: 'Missing required fields: examTitle, examType, answers' 
      });
    }

    // Create submission record immediately
    const submission = new SubmissionModel({
      userId,
      examTitle,
      examType,
      answers,
      totalQuestions: questionCount || answers.length,
      status: 'submitted'
    });

    await submission.save();

    // Send immediate response to client
    res.status(200).json({
      message: 'Exam submitted successfully',
      submission: {
        id: submission._id,
        status: 'submitted',
        submissionTime: submission.submissionTime
      }
    });

    // Calculate score in background (non-blocking)
    setImmediate(async () => {
      try {
        await calculateAndUpdateScore(submission._id, examTitle, examType, answers);
      } catch (error) {
        console.error('Error calculating score in background:', error);
      }
    });

  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Failed to submit exam' });
  }
});

// Background function to calculate score
async function calculateAndUpdateScore(submissionId, examTitle, examType, answers) {
  try {
    let score = 0;
    let totalPossibleScore = 0;

    if (examType === 'Objective') {
      // Get correct answers efficiently
      const questions = await ObjectiveOuestionModel
        .find({ exam_name: examTitle })
        .select('correct_option')
        .lean();

      totalPossibleScore = questions.length;

      questions.forEach((q, idx) => {
        if (idx < answers.length && answers[idx] === q.correct_option) {
          score++;
        }
      });

    } else if (examType === 'Subjective') {
      // Get correct answers and marks
      const questions = await SubjectiveOuestionModel
        .find({ exam_name: examTitle })
        .select('answer marks')
        .lean();

      questions.forEach((q, idx) => {
        totalPossibleScore += q.marks || 10;
        if (idx < answers.length) {
          const userAnswer = answers[idx]?.trim();
          const correctAnswer = q.answer?.trim();
          
          if (areAnswersSimilar(userAnswer, correctAnswer)) {
            score += q.marks || 10;
          }
        }
      });
    }

    // Calculate percentage
    const percentage = totalPossibleScore > 0 
      ? Math.round((score / totalPossibleScore) * 100) 
      : 0;

    // Update submission with calculated score
    await SubmissionModel.findByIdAndUpdate(submissionId, {
      score,
      percentage,
      status: 'graded',
      gradedAt: new Date()
    });

    console.log(`Score calculated for submission ${submissionId}: ${score}/${totalPossibleScore} (${percentage}%)`);

  } catch (error) {
    console.error('Error in background score calculation:', error);
  }
}

// Get submission results
router.get('/result/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id;

    const submission = await SubmissionModel
      .findOne({ _id: submissionId, userId })
      .lean();

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // If still being graded, return current status
    if (submission.status === 'submitted') {
      return res.json({
        status: 'processing',
        message: 'Your exam is being graded. Please check back in a moment.',
        submission: {
          id: submission._id,
          examTitle: submission.examTitle,
          submissionTime: submission.submissionTime,
          status: submission.status
        }
      });
    }

    // Return full results
    res.json({
      status: 'completed',
      submission: {
        id: submission._id,
        examTitle: submission.examTitle,
        examType: submission.examType,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        submissionTime: submission.submissionTime,
        gradedAt: submission.gradedAt
      }
    });

  } catch (error) {
    console.error('Error fetching submission result:', error);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
});

// Get all submissions for a user
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await SubmissionModel
      .find({ userId })
      .sort({ submissionTime: -1 })
      .skip(skip)
      .limit(limit)
      .select('-answers') // Don't send answers in history
      .lean();

    const total = await SubmissionModel.countDocuments({ userId });

    res.json({
      submissions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSubmissions: total,
        hasNext: skip + submissions.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching submission history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

export default router;