import express from 'express';
import bcrypt from 'bcrypt';
import AuthModel from '../Models/AuthModel.js'; // Assuming this is your AuthModel
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
    const user = await AuthModel.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ 
        user: { name: user.name || user.email, email: user.email }, 
        token: 'mock-token', 
        role 
    });
});

// Change Password Route
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // Get from auth middleware

        // Find user
        const user = await AuthModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in change password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;