// api/index.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectQuesDB from '../DB/QuestionDB.js'
import AuthRoute from '../Routes/AuthRoute.js'
import connectAuthDB from '../DB/AuthDB.js'
import serverless from 'serverless-http';
import questionRoute from '../Routes/QuestionRoute.js';
import submissionRoute from '../Routes/SubmissionRoute.js';
import AiRoute from '../Routes/AIRoute.js';

dotenv.config();

const PORT = 3000

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
    catch(error){
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};


app.get('/', (req, res) => {
    res.status(200).send("Server is alive and working!")
})

startServer();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/questions', questionRoute);
app.use('/api/auth', AuthRoute);
app.use('/api/submissions', submissionRoute);
app.use('/api/ai', AiRoute);

// ❌ Remove app.listen()
// ✅ Instead, export a handler
// export const handler = serverless(app);
// app.listen(PORT, () => {
//     console.log(`Server is listening at ${PORT}`)
// })