import express from 'express';
import mongoose from 'mongoose';
import ObjectiveOuestionModel from '../Models/ObjectiveOuestionModel.js';
import SubjectiveOuestionModel from '../Models/SubjectiveOuestionModel.js';

const router = express.Router();

// Simple Submission Schema
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

const SubmissionModel = mongoose.model('Submission', SubmissionSchema);

// Simple similarity function for subjective answers
function areAnswersSimilar(studentAns, correctAns) {
  if (!studentAns || !correctAns) return false;
  
  const normalize = (str) => str.toLowerCase().trim();
  const student = normalize(studentAns);
  const correct = normalize(correctAns);
  
  // Simple exact match for now - you can improve this later
  if (student === correct) return true;
  
  // Check if student answer contains most words from correct answer
  const correctWords = correct.split(/\s+/).filter(word => word.length > 2);
  const studentWords = student.split(/\s+/);
  
  let matches = 0;
  correctWords.forEach(word => {
    if (studentWords.some(sw => sw.includes(word) || word.includes(sw))) {
      matches++;
    }
  });
  
  // Consider it correct if 70% of important words match
  return matches / correctWords.length >= 0.7;
}

// Submit exam endpoint
router.post('/submit', async (req, res) => {
  try {
    const { examTitle, examType, answers } = req.body;
    
    // Validate required fields
    if (!examTitle || !examType || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        message: 'Missing required fields: examTitle, examType, answers',
        received: { examTitle, examType, answersType: typeof answers }
      });
    }

    console.log('Received submission:', { examTitle, examType, answersLength: answers.length });

    let score = 0;
    let totalQuestions = answers.length;

    // Calculate score based on exam type
    if (examType === 'Objective') {
      try {
        const questions = await ObjectiveOuestionModel.find({ exam_name: examTitle });
        
        if (questions.length === 0) {
          return res.status(404).json({ message: 'Exam questions not found' });
        }

        totalQuestions = questions.length;
        
        questions.forEach((question, index) => {
          if (index < answers.length && answers[index] === question.correct_option) {
            score++;
          }
        });
        
      } catch (error) {
        console.error('Error fetching objective questions:', error);
        return res.status(500).json({ message: 'Error processing objective exam' });
      }
      
    } else if (examType === 'Subjective') {
      try {
        const questions = await SubjectiveOuestionModel.find({ exam_name: examTitle });
        
        if (questions.length === 0) {
          return res.status(404).json({ message: 'Exam questions not found' });
        }

        totalQuestions = questions.length;
        let totalMarks = 0;
        let earnedMarks = 0;
        
        questions.forEach((question, index) => {
          const questionMarks = question.marks || 10;
          totalMarks += questionMarks;
          
          if (index < answers.length) {
            const studentAnswer = answers[index];
            const correctAnswer = question.answer;
            
            if (areAnswersSimilar(studentAnswer, correctAnswer)) {
              earnedMarks += questionMarks;
              score++; // Count as correct for percentage calculation
            }
          }
        });
        
        // For subjective, we can also track marks-based score
        console.log(`Subjective exam: ${earnedMarks}/${totalMarks} marks, ${score}/${totalQuestions} questions`);
        
      } catch (error) {
        console.error('Error fetching subjective questions:', error);
        return res.status(500).json({ message: 'Error processing subjective exam' });
      }
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Save submission to database
    const submission = new SubmissionModel({
      examTitle,
      examType,
      answers,
      score,
      totalQuestions,
      percentage,
      // Add user info if available from token/session
      userEmail: req.user?.email || req.body.userEmail,
      userName: req.user?.name || req.body.userName
    });

    await submission.save();

    console.log(`Submission saved: ${score}/${totalQuestions} (${percentage}%)`);

    // Return success response
    res.status(200).json({
      message: 'Exam submitted successfully',
      submission: {
        id: submission._id,
        examTitle: submission.examTitle,
        examType: submission.examType,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        submissionTime: submission.submissionTime
      }
    });

  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ 
      message: 'Failed to submit exam', 
      error: error.message 
    });
  }
});

// Get submission result
router.get('/result/:submissionId', async (req, res) => {
  try {
    const submission = await SubmissionModel.findById(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({
      submission: {
        id: submission._id,
        examTitle: submission.examTitle,
        examType: submission.examType,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        submissionTime: submission.submissionTime
      }
    });
    
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
});

// Get all submissions (optional - for admin or user history)
router.get('/all', async (req, res) => {
  try {
    const submissions = await SubmissionModel
      .find()
      .sort({ submissionTime: -1 })
      .select('-answers') // Don't include full answers in list view
      .limit(100); // Limit results

    res.json({ submissions });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

export default router;