import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../Models/AuthModel.js';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/signup', async (req, res) => {
  console.log(req.body);
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are compulsory' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const emailDomain = email.split('@')[1];
    const role = emailDomain === 'exam-portal.com' ? 'admin' : 'student';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      user: { name: newUser.name, email: newUser.email, role: newUser.role },
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/:role/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { role } = req.params;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are compulsory' });
    }

    // 🔐 Validate role
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🛡 Verify role
    if (user.role !== role) {
      return res.status(403).json({ message: `Unauthorized for role: ${role}` });
    }

    // 🔑 Compare password securely
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      user: { name: user.name, email: user.email },
      token,
      role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be same as current password' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
})

export default router;