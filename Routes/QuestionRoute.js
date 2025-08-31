import express from 'express';
import ObjectiveOuestionModel from '../Models/ObjectiveOuestionModel.js';
import SubjectiveOuestionModel from '../Models/SubjectiveOuestionModel.js';


const router = express.Router();

router.post('/objective', async (req, res) => {
    const { examTitle, question, options, correct } = req.body;
    if (!examTitle || !question || !options || correct === undefined || correct === null) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    // ...
    const newQuestion = new ObjectiveOuestionModel({
        id: Date.now(),
        exam_name: examTitle,
        question_title: question,
        options: options,
        correct_option: correct
    });
    await newQuestion.save();
    res.status(201).json({ question: newQuestion });
});

router.post('/subjective', async (req, res) => {
    const { exam_title, question, answer, marks } = req.body;
    if (!exam_title || !question || !answer || !marks) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const newQuestion = new SubjectiveOuestionModel({
        exam_name: exam_title, // <-- expects exam_title in request body
        question,
        answer,
        marks
    });
    await newQuestion.save();
    res.status(201).json({ question: newQuestion });
});

router.get('/all', async (req, res) => {
    try {
        const objectiveQuestions = await ObjectiveOuestionModel.find();
        const subjectiveQuestions = await SubjectiveOuestionModel.find();

        // Group by exam_name and type
        const examsMap = {};

        objectiveQuestions.forEach(q => {
            if (!examsMap[q.exam_name]) {
                examsMap[q.exam_name] = { exam_title: q.exam_name, questions: [], type: 'Objective' };
            }
            examsMap[q.exam_name].questions.push(q);
        });

        console.log("Exam name", exam_name);

        subjectiveQuestions.forEach(q => {
            if (!examsMap[q.exam_name]) {
                examsMap[q.exam_name] = { exam_title: q.exam_name, questions: [], type: 'Subjective' };
            }
            examsMap[q.exam_name].questions.push(q);
        });

        // Convert to array
        const examsArray = Object.values(examsMap);

        res.json({ exams: examsArray });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
});
router.get('/objective/:examTitle', async (req, res) => {
    const { examTitle } = req.params;
    const filteredQuestions = await ObjectiveOuestionModel.find({ exam_name: examTitle });
    if (filteredQuestions.length === 0) {
        return res.status(404).json({ message: 'No questions found for this exam' });
    }
    res.json({ questions: filteredQuestions });
});

router.get('/subjective/:examTitle', async (req, res) => {
    const { examTitle } = req.params;
    try {
        // const filteredQuestions = await SubjectiveOuestionModel.find({ exam_name: examTitle });

        console.log('Looking for exam_name:', examTitle);
        const filteredQuestions = await SubjectiveOuestionModel.find({ exam_name: { $regex: `^${examTitle}$`, $options: 'i' } });
        console.log('Found:', filteredQuestions);

        if (filteredQuestions.length === 0) {
            return res.status(404).json({ message: 'No questions found for this exam' });
        }
        res.json({ questions: filteredQuestions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
})

router.delete('/objective/:exam_title', async (req, res) => {
    try {
        const examTitle = req.params.exam_title;
        await ObjectiveOuestionModel.deleteMany({ exam_name: examTitle });
        res.status(200).json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});

router.delete('/subjective/:exam_title', async (req, res) => {
    try {
        const examTitle = req.params.exam_title;
        await SubjectiveOuestionModel.deleteMany({ exam_name: examTitle });
        res.status(200).json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});


export default router;