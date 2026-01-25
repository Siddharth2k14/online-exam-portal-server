// Imports for API
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

// Database Connection
import connectQuesDB from '../DB/Question.DB.js';
import connectAuthDB from '../DB/Auth.DB.js';

// Routes
import questionRoute from '../Routes/Question.route.js';
import AuthRoute from '../Routes/Auth.route.js';
import submissionRoute from '../Routes/Submission.route.js';
import assignExamRoute from '../Routes/AssignExam.route.js';

dotenv.config();

// Intializing the PORT number
const PORT = 3000

// Intializing the express app
const app = express();

// Connect to MongoDB
const startServer = async () => {
    try {
        await connectQuesDB();
        await connectAuthDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};

// Route for checking if the server is running or not
app.get('/', (req, res) => {
    res.status(200).send("Server is alive and working!")
})

// Calling the serverless function
startServer();

// Middleware for enabling CORS
app.use(cors());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes for different modules
app.use('/api/questions', questionRoute);
app.use('/api/auth', AuthRoute);
app.use('/api/submissions', submissionRoute);
app.use('/api/exams', assignExamRoute);