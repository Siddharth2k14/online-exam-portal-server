// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectQuesDB from '../server/DB/QuestionDB.js'
import authRoute from '../server/Routes/AuthRoute.js'
import connectAuthDB from '../server/DB/AuthDB.js'
import serverless from 'serverless-http';
import questionRoute from '../server/Routes/QuestionRoute.js'

dotenv.config();

const app = express();

// Connect to MongoDB
connectQuesDB();
connectAuthDB();

app.use(cors());
app.use(express.json());
app.use('/api/questions', questionRoute);
app.use('/api/auth', authRoute);

// ❌ Remove app.listen()
// ✅ Instead, export a handler
export const handler = serverless(app);