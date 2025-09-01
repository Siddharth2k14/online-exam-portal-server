import express from "express";
import ExamSubmissionModel from "../Models/ExamSubmissionModel.js";
import ObjectiveQuestionModel from "../Models/ObjectiveOuestionModel.js";
import SubjectiveQuestionModel from "../Models/SubjectiveOuestionModel.js";

const router = express.Router();

// Submit exam
router.post("/submit", async (req, res) => {
  try {
    const { studentId, exam, answers } = req.body;

    let totalScore = 0;
    const processedAnswers = [];

    for (let ans of answers) {
      if (ans.type === "Objective") {
        const q = await ObjectiveQuestionModel.findById(ans.questionId);
        const isCorrect = q.correct_option === ans.selectedOption;
        const marksAwarded = isCorrect ? 1 : 0;

        totalScore += marksAwarded;

        processedAnswers.push({
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isCorrect,
          marksAwarded,
        });
      } else {
        processedAnswers.push({
          questionId: ans.questionId,
          answer: ans.answer,
          marksAwarded: 0, // teacher/admin updates later
        });
      }
    }

    const submission = new ExamSubmissionModel({
      student: studentId,
      exam, // this is just a string (exam name)
      answers: processedAnswers,
      score: totalScore,
    });

    await submission.save();

    res.json({ message: "Exam submitted successfully", submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit exam" });
  }
});

// Get submissions by student
router.get("/student/:id", async (req, res) => {
  try {
    const submissions = await ExamSubmissionModel.find({
      student: req.params.id,
    }).populate("student").sort({ attemptedAt: -1 }); // Sort by most recent first

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student submissions" });
  }
});

// Get detailed exam history for a student
router.get("/student/:id/history", async (req, res) => {
  try {
    const submissions = await ExamSubmissionModel.find({
      student: req.params.id,
    }).populate("student", "name email").sort({ attemptedAt: -1 });

    // Transform the data for better display
    const examHistory = submissions.map(submission => {
      const objectiveAnswers = submission.answers.filter(ans => ans.isCorrect !== undefined);
      const subjectiveAnswers = submission.answers.filter(ans => ans.answer && ans.isCorrect === undefined);
      
      const totalObjectiveMarks = objectiveAnswers.length;
      const objectiveScore = objectiveAnswers.filter(ans => ans.isCorrect).length;
      const subjectiveScore = subjectiveAnswers.reduce((sum, ans) => sum + (ans.marksAwarded || 0), 0);
      const totalSubjectiveMarks = subjectiveAnswers.length * 5; // Assuming 5 marks per subjective question
      
      const isPending = subjectiveAnswers.some(ans => ans.marksAwarded === 0 || ans.marksAwarded === undefined);
      
      return {
        _id: submission._id,
        examName: submission.exam,
        totalScore: submission.score,
        objectiveScore,
        totalObjectiveMarks,
        subjectiveScore,
        totalSubjectiveMarks,
        totalQuestions: submission.answers.length,
        attemptedAt: submission.attemptedAt,
        status: isPending && subjectiveAnswers.length > 0 ? 'Pending Review' : 'Completed',
        hasSubjective: subjectiveAnswers.length > 0,
        hasObjective: objectiveAnswers.length > 0
      };
    });

    res.json({
      student: submissions[0]?.student || null,
      totalExamsAttempted: examHistory.length,
      examHistory
    });
  } catch (error) {
    console.error('Error fetching student exam history:', error);
    res.status(500).json({ error: "Failed to fetch student exam history" });
  }
});

// Get submissions by exam name
router.get("/exam/:examName", async (req, res) => {
  try {
    const submissions = await ExamSubmissionModel.find({
      exam: req.params.examName,
    }).populate("student");

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam submissions" });
  }
});

// Review subjective answers
router.get("/review/:examName", async (req, res) => {
  try {
    const submissions = await ExamSubmissionModel.find({
      exam: req.params.examName,
    });

    const subjectiveAnswers = submissions.flatMap((sub) =>
      sub.answers
        .filter((a) => !a.isCorrect && a.answer) // only subjective
        .map((a) => ({
          submissionId: sub._id,
          student: sub.student,
          questionId: a.questionId,
          answer: a.answer,
          marksAwarded: a.marksAwarded,
        }))
    );

    res.json(subjectiveAnswers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch answers for review" });
  }
});

// Update marks for subjective answer
router.put("/review/:submissionId/:questionId", async (req, res) => {
  try {
    const { marksAwarded } = req.body;

    const submission = await ExamSubmissionModel.findById(
      req.params.submissionId
    );
    if (!submission)
      return res.status(404).json({ error: "Submission not found" });

    const answer = submission.answers.find(
      (a) => a.questionId === req.params.questionId
    );
    if (!answer) return res.status(404).json({ error: "Answer not found" });

    answer.marksAwarded = marksAwarded;
    submission.score = submission.answers.reduce(
      (sum, ans) => sum + (ans.marksAwarded || 0),
      0
    );

    await submission.save();

    res.json({ message: "Marks updated", submission });
  } catch (error) {
    res.status(500).json({ error: "Failed to update marks" });
  }
});

// Results by student
router.get("/result/student/:id", async (req, res) => {
  try {
    const results = await ExamSubmissionModel.find({
      student: req.params.id,
    }).populate("student");

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Results by exam
router.get("/result/exam/:examName", async (req, res) => {
  try {
    const results = await ExamSubmissionModel.find({
      exam: req.params.examName,
    }).populate("student");

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam results" });
  }
});

// Get all unique exams attempted
router.get("/exams/list", async (req, res) => {
  try {
    const exams = await ExamSubmissionModel.distinct("exam");
    
    // Get submission count for each exam
    const examDetails = await Promise.all(
      exams.map(async (examName) => {
        const submissionCount = await ExamSubmissionModel.countDocuments({ exam: examName });
        const avgScore = await ExamSubmissionModel.aggregate([
          { $match: { exam: examName } },
          { $group: { _id: null, avgScore: { $avg: "$score" } } }
        ]);
        
        return {
          examName,
          totalAttempts: submissionCount,
          averageScore: avgScore[0]?.avgScore || 0
        };
      })
    );
    
    res.json(examDetails);
  } catch (error) {
    console.error('Error fetching exam list:', error);
    res.status(500).json({ error: "Failed to fetch exam list" });
  }
});

// Get exam analytics
router.get("/analytics/exam/:examName", async (req, res) => {
  try {
    const examName = req.params.examName;
    const submissions = await ExamSubmissionModel.find({ exam: examName })
      .populate("student", "name email")
      .sort({ attemptedAt: -1 });
    
    if (submissions.length === 0) {
      return res.json({
        examName,
        totalAttempts: 0,
        students: [],
        analytics: {
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          completionRate: 0
        }
      });
    }
    
    const scores = submissions.map(sub => sub.score);
    const studentsWhoAttempted = submissions.map(sub => ({
      studentId: sub.student._id,
      studentName: sub.student.name,
      studentEmail: sub.student.email,
      score: sub.score,
      attemptedAt: sub.attemptedAt,
      totalQuestions: sub.answers.length
    }));
    
    res.json({
      examName,
      totalAttempts: submissions.length,
      students: studentsWhoAttempted,
      analytics: {
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        completionRate: 100 // All submissions are considered complete attempts
      }
    });
  } catch (error) {
    console.error('Error fetching exam analytics:', error);
    res.status(500).json({ error: "Failed to fetch exam analytics" });
  }
});

export default router;
