// api/index.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectQuesDB from '../DB/QuestionDB.js'
import AuthRoute from '../Routes/AuthRoute.js'
import connectAuthDB from '../DB/AuthDB.js'
import serverless from 'serverless-http';
import questionRoute from '../Routes/QuestionRoute.js'

const PORT = 3000

const app = express();

// Connect to MongoDB
connectQuesDB();
connectAuthDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/questions', questionRoute);
app.use('/api/auth', AuthRoute);

// ❌ Remove app.listen()
// ✅ Instead, export a handler
// export const handler = serverless(app);
app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`)
})