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
const PORT = 3000;

// Connect to MongoDB once per function instance
connectQuesDB();
connectAuthDB();

// Allow only your deployed frontend origin
app.use(cors({
    origin: "https://online-exam-portal-client-6qvc.vercel.app/",
    credentials: true
}));

app.get('/start', (req, res) => {
    console.log('API is running...');
    res.send('API is running...');
});

app.use(express.json());
app.use('/api/questions', questionRoute);
app.use('/api/auth', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});