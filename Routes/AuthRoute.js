import express from 'express';
import AuthModel from '../Models/AuthModel.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    // Check if user already exists
    const existingUser = await AuthModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const user = new AuthModel({ name, email, password });
    await user.save();
    res.status(201).json({ user: { name, email }, token: 'mock-token' });
});

router.post('/:role/login', async (req, res) => {
    const { email, password } = req.body;
    const { role } = req.params;

    // Admin login check
    if (role === 'admin') {
        if (email !== 'admin@exam-portal.com' || password !== '123456') {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        return res.json({
            user: { email: 'admin@exam-portal.com', name: 'Admin' },
            token: 'admin-mock-token',
            role: 'admin'
        });
    }

    // Student login (MongoDB check)
    const user = await AuthModel.findOne({ email, password });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ user: { name: user.name || user.email, email: user.email }, token: 'mock-token', role });
});

export default router;