// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectQuesDB from '../DB/QuestionDB.js'
import authRoute from '../Routes/AuthRoute.js'
import connectAuthDB from '../DB/AuthDB.js'
import serverless from 'serverless-http';
import questionRoute from '../Routes/QuestionRoute.js'

dotenv.config();

const app = express();

// Connect to MongoDB
connectQuesDB();
connectAuthDB();

// Allow only your deployed frontend origin
app.use(cors({
    origin: "https://online-exam-portal-client-bvtz.vercel.app",
    credentials: true
}));

app.use(express.json());
app.use('/api/questions', questionRoute);
app.use('/api/auth', authRoute);

// ❌ Remove app.listen()
// ✅ Instead, export a handler
export const handler = serverless(app);