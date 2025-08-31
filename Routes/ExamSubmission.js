import express from "express"
import ExamSubmissionModel from "../Models/ExamSubmission"
import ObjectiveOuestionModel from "../Models/ObjectiveOuestionModel"
import SubjectiveQuestionModel from "../Models/SubjectiveQuestionModel"

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        const { studentId, exam, answers } = req.body;

        let totalScore = 0;
        const processedAnswers = [];

        for (let ans of answers) {
            if (ans.type === 'Objective') {
                const q = await ObjectiveOuestionModel.findById(ans.questionId);
                const isCorrect = q.correct_option === ans.selectedOption;
                const marksAwarded = isCorrect ? 1 : 0;

                totalScore += marksAwarded;

                processedAnswers.push({
                    questionId: ans.questionId,
                    selectedOption: ans.selectedOption,
                    isCorrect,
                    marksAwarded
                });
            }
            else {
                processedAnswers.push({
                    questionId: ans.questionId,
                    answer: ans.answer,
                    marksAwarded: 0 // teacher/admin will update later
                });
            }
        }

        const submission = new ExamSubmission({
            student: studentId,
            exam,
            answers: processedAnswers,
            score: totalScore
        });

        await submission.save();

        res.json({ message: 'Exam submitted successfully', submission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
})

router.get('/student/:id', async (req, res) => {
    try {
        const submissions = await ExamSubmission.find({ student: req.params.id }).populate('student');
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student submissions' });
    }
});


router.get('/exam/:examName', async (req, res) => {
    try {
        const submissions = await ExamSubmission.find({ exam: req.params.examName }).populate('student');
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam submissions' });
    }
});

// Get all subjective answers for review
router.get('/review/:examName', async (req, res) => {
  try {
    const submissions = await ExamSubmission.find({ exam: req.params.examName });
    
    // Filter only subjective answers
    const subjectiveAnswers = submissions.flatMap(sub =>
      sub.answers
        .filter(a => !a.isCorrect && a.answer) // no auto correctness
        .map(a => ({
          submissionId: sub._id,
          student: sub.student,
          questionId: a.questionId,
          answer: a.answer,
          marksAwarded: a.marksAwarded
        }))
    );

    res.json(subjectiveAnswers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch answers for review' });
  }
});

// Update marks for one answer
router.put('/review/:submissionId/:questionId', async (req, res) => {
  try {
    const { marksAwarded } = req.body;

    const submission = await ExamSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // Find the question
    const answer = submission.answers.find(a => a.questionId === req.params.questionId);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    // Update marks
    answer.marksAwarded = marksAwarded;

    // Recalculate total score
    submission.score = submission.answers.reduce((sum, ans) => sum + (ans.marksAwarded || 0), 0);

    await submission.save();

    res.json({ message: 'Marks updated', submission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update marks' });
  }
});

router.get('/result/student/:id', async (req, res) => {
  try {
    const results = await ExamSubmission.find({ student: req.params.id }).populate('student');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.get('/result/exam/:examName', async (req, res) => {
  try {
    const results = await ExamSubmission.find({ exam: req.params.examName }).populate('student');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

export default router;