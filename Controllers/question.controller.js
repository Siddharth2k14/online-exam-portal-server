// Importing required modules
import mongoose from "mongoose";

// Importing models
import ObjectiveQuestionModel from "../Models/ObjectiveQuestion.model.js";
import SubjectiveQuestionModel from "../Models/SubjectiveQuestion.model.js";

// Controller for creating objective questions
export const createObjectiveQuestion = async (req, res) => {
    try {
        const { examTitle, question, options, correct } = req.body;

        if (!examTitle || !question || !options || correct === undefined || correct === null) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newQuestion = new ObjectiveQuestionModel({
            id: Date.now(),
            exam_id: new mongoose.Types.ObjectId(),
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
}

// Controller for creating subjective questions
export const createSubjectiveQuestion = async (req, res) => {
    try {
        const { exam_title, question, answer, marks, timer } = req.body;

        if (!exam_title || !question || !answer || marks === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (timer != null && isNaN(timer)) {
            return res.status(400).json({ message: "Invalid timer value" });
        }

        const newQuestion = new SubjectiveQuestionModel({
            exam_id: new mongoose.Types.ObjectId(),
            exam_name: exam_title,
            question: question,
            answer: answer,
            marks: marks,
            timer: timer ?? null
        });

        await newQuestion.save();

        res.status(201).json({ question: newQuestion });
    } catch (error) {
        console.error('Error creating subjective question:', error);
        res.status(500).json({ message: 'Failed to create question' });
    }
}

// Controller for getting all exams
export const getAllExams = async (req, res) => {
    try {
        // Use MongoDB aggregation pipeline for better performance
        const [objectiveResults, subjectiveResults] = await Promise.all([
            ObjectiveQuestionModel.aggregate([
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
            SubjectiveQuestionModel.aggregate([
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
}

// Controller for getting specific exam
export const getExam = async (req, res) => {
    try {
        const { examTitle } = req.params;

        // Use Promise.all for parallel queries
        const [objectiveQuestions, subjectiveQuestions] = await Promise.all([
            ObjectiveQuestionModel.find({ exam_name: examTitle }).lean(),
            SubjectiveQuestionModel.find({ exam_name: examTitle }).lean()
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
                    id: q.id,
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
                    id: q.id,
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
}

// Controller for getting objective questions
export const getObjectiveExam = async (req, res) => {
    try {
        const { examTitle } = req.params;

        // Use lean() for better performance
        const filteredQuestions = await ObjectiveQuestionModel
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
}

// Controller for getting subjective questions
export const getSubjectiveExam = async (req, res) => {
    try {
        const { examTitle } = req.params;

        console.log('Looking for exam_name:', examTitle);

        // Use lean() for better performance and exact match instead of regex
        const filteredQuestions = await SubjectiveQuestionModel
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
}

// Controller for deleting objective exam
export const deleteObjectiveExam = async (req, res) => {
    try {
        const examTitle = req.params.exam_title;
        await ObjectiveQuestionModel.deleteMany({ exam_name: examTitle });

        res.status(200).json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting objective exam:', error);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
}

// Controller for deleting subjective exam
export const deleteSubjectiveExam = async (req, res) => {
    try {
        const examTitle = req.params.exam_title;
        await SubjectiveQuestionModel.deleteMany({ exam_name: examTitle });

        res.status(200).json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting subjective exam:', error);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
}