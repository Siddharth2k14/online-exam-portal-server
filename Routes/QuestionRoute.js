import express from 'express';
import ObjectiveOuestionModel from '../Models/ObjectiveOuestionModel.js';
import SubjectiveOuestionModel from '../Models/SubjectiveOuestionModel.js';

const router = express.Router();

// Simple in-memory cache (consider Redis for production)
// const cache = {
//   data: null,
//   timestamp: 0,
//   TTL: 5 * 60 * 1000, // 5 minutes
  
//   isValid() {
//     return this.data && (Date.now() - this.timestamp) < this.TTL;
//   },
  
//   set(data) {
//     this.data = data;
//     this.timestamp = Date.now();
//   },
  
//   get() {
//     return this.isValid() ? this.data : null;
//   },
  
//   clear() {
//     this.data = null;
//     this.timestamp = 0;
//   }
// };

// // OPTIMIZED: Create database indexes for better performance
// const ensureIndexes = async () => {
//   try {
//     await ObjectiveOuestionModel.collection.createIndex({ exam_name: 1 });
//     await SubjectiveOuestionModel.collection.createIndex({ exam_name: 1 });
//     console.log('Database indexes created successfully');
//   } catch (error) {
//     console.error('Error creating indexes:', error);
//   }
// };

// // Call this when server starts
// ensureIndexes();


router.post('/objective', async (req, res) => {
  try {
    const { examTitle, question, options, correct } = req.body;
    
    if (!examTitle || !question || !options || correct === undefined || correct === null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newQuestion = new ObjectiveOuestionModel({
      id: Date.now(),
      exam_name: examTitle,
      question_title: question,
      options: options,
      correct_option: correct,
    });

    await newQuestion.save();
    
    res.status(201).json({ question: newQuestion });
  } catch (error) {
    console.error('Error creating objective question:', error);
    res.status(500).json({ message: 'Failed to create question' });
  }
});

router.post('/subjective', async (req, res) => {
  try {
    const { exam_title, question, answer, marks, timer } = req.body;
    
    if (!exam_title || !question || !answer || marks === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (timer != null && isNan(timer)) {
      return res.status(400).json({ message: "Invalid timer value" });
    }

    const newQuestion = new SubjectiveOuestionModel({
      exam_name: exam_title,
      question: question,
      answer: answer,
      marks: marks,
      timer: timer != null ? Number(timer) : null
    });

    await newQuestion.save();
    
    // // Clear cache when new question is added
    // cache.clear();
    
    res.status(201).json({ question: newQuestion });
  } catch (error) {
    console.error('Error creating subjective question:', error);
    res.status(500).json({ message: 'Failed to create question' });
  }
});

// OPTIMIZED: Much more efficient /all endpoint
router.get('/all', async (req, res) => {
  try {
    // Check cache first
    // const cachedData = cache.get();
    // if (cachedData) {
    //   return res.json(cachedData);
    // }

    // Use MongoDB aggregation pipeline for better performance
    const [objectiveResults, subjectiveResults] = await Promise.all([
      ObjectiveOuestionModel.aggregate([
        {
          $group: {
            _id: "$exam_name",
            exam_title: { $first: "$exam_name" },
            type: { $first: "Objective" },
            questions: {
              $push: {
                id: "$id",
                question_title: "$question_title",
                question: "$question_title", // For consistency
                options: "$options",
                correct_option: "$correct_option"
              }
            }
          }
        }
      ]),
      SubjectiveOuestionModel.aggregate([
        {
          $group: {
            _id: "$exam_name",
            exam_title: { $first: "$exam_name" },
            type: { $first: "Subjective" },
            questions: {
              $push: {
                question: "$question",
                answer: "$answer",
                marks: "$marks",
                timer: "$timer"
              }
            }
          }
        }
      ])
    ]);

    // Merge results efficiently
    const examsMap = new Map();

    // Process objective results
    objectiveResults.forEach(result => {
      examsMap.set(result._id, {
        exam_title: result.exam_title,
        type: result.type,
        subject: result.exam_title, // For compatibility
        questions: result.questions
      });
    });

    // Process subjective results
    subjectiveResults.forEach(result => {
      if (examsMap.has(result._id)) {
        // If exam already exists, merge questions
        const existing = examsMap.get(result._id);
        existing.questions = [...existing.questions, ...result.questions];
        // Update type to show mixed if needed
        existing.type = 'Mixed';
      } else {
        examsMap.set(result._id, {
          exam_title: result.exam_title,
          type: result.type,
          subject: result.exam_title,
          questions: result.questions
        });
      }
    });

    const examsArray = Array.from(examsMap.values());
    
    // Cache the result
    const responseData = { exams: examsArray };
    // cache.set(responseData);

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching all exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// OPTIMIZED: Get specific exam (used by StartExam)
router.get('/exam/:examTitle', async (req, res) => {
  try {
    const { examTitle } = req.params;
    
    // Use Promise.all for parallel queries
    const [objectiveQuestions, subjectiveQuestions] = await Promise.all([
      ObjectiveOuestionModel.find({ exam_name: examTitle }).lean(),
      SubjectiveOuestionModel.find({ exam_name: examTitle }).lean()
    ]);

    if (objectiveQuestions.length === 0 && subjectiveQuestions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this exam' });
    }

    let examData = null;

    if (objectiveQuestions.length > 0) {
      examData = {
        exam_title: examTitle,
        type: 'Objective',
        questions: objectiveQuestions.map(q => ({
          question_text: q.question_title,
          options: q.options,
          correct_option: q.correct_option
        }))
      };
    } else if (subjectiveQuestions.length > 0) {
      examData = {
        exam_title: examTitle,
        type: 'Subjective',
        questions: subjectiveQuestions.map(q => ({
          question_text: q.question,
          answer: q.answer,
          marks: q.marks,
          timer: q.timer
        }))
      };
    }

    res.json(examData);

  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

router.get('/objective/:examTitle', async (req, res) => {
  try {
    const { examTitle } = req.params;
    
    // Use lean() for better performance
    const filteredQuestions = await ObjectiveOuestionModel
      .find({ exam_name: examTitle })
      .lean();
      
    if (filteredQuestions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this exam' });
    }
    
    res.json({ questions: filteredQuestions });
  } catch (error) {
    console.error('Error fetching objective questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.get('/subjective/:examTitle', async (req, res) => {
  try {
    const { examTitle } = req.params;
    
    console.log('Looking for exam_name:', examTitle);
    
    // Use lean() for better performance and exact match instead of regex
    const filteredQuestions = await SubjectiveOuestionModel
      .find({ exam_name: examTitle })
      .lean();
      
    console.log('Found:', filteredQuestions);

    if (filteredQuestions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this exam' });
    }
    
    res.json({ questions: filteredQuestions });
  } catch (error) {
    console.error('Error fetching subjective questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.delete('/objective/:exam_title', async (req, res) => {
  try {
    const examTitle = req.params.exam_title;
    await ObjectiveOuestionModel.deleteMany({ exam_name: examTitle });
    
    // Clear cache when data is deleted
    // cache.clear();
    
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting objective exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

router.delete('/subjective/:exam_title', async (req, res) => {
  try {
    const examTitle = req.params.exam_title;
    await SubjectiveOuestionModel.deleteMany({ exam_name: examTitle });
    
    // Clear cache when data is deleted
    // cache.clear();
    
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting subjective exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

export default router;