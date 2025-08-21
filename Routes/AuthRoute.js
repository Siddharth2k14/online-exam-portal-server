import dotenv from 'dotenv';
dotenv.config();

// Other imports should come after dotenv configuration
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../Models/AuthModel.js';
import express from 'express';
import process from 'process';
import authMiddleware from '../Middleware/authMiddleware.js';

const router = express.Router();

const validatePassword = (password) => {
  if (password.length < 6) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
}

// Signup route - remains the same
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    console.log(req.body);

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

    // Determine role from email domain
    const emailDomain = email.split('@')[1];
    const role = emailDomain === 'exam-portal.com' ? 'admin' : 'student';
    console.log(`Signup - Email: ${email}, Domain: ${emailDomain}, Role: ${role}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save().catch(err => {
      console.error('Error in saving the user:', err);
      throw new Error('Failed to create user');
    });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      user: { name: newUser.name, email: newUser.email },
      token,
      role: newUser.role // Make sure to return the role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// FIXED: Single login route without role parameter
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are compulsory' });
    }

    const user = await User.findOne({ email });
    console.log(`Login attempt - Email: ${email}`);
    console.log(`Found user: ${user ? 'Yes' : 'No'}`);
    console.log(`User role in DB: ${user?.role}`);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Determine expected role from email domain
    const emailDomain = email.split('@')[1];
    const expectedRole = emailDomain === 'exam-portal.com' ? 'admin' : 'student';
    console.log(`Expected role from email domain: ${expectedRole}`);
    console.log(`Stored role in database: ${user.role}`);

    // Verify that stored role matches expected role
    if (user.role !== expectedRole) {
      console.log(`Role mismatch - Expected: ${expectedRole}, Found: ${user.role}`);
      return res.status(403).json({ 
        message: `Invalid role. Expected ${expectedRole} but found ${user.role}` 
      });
    }

    // Compare password securely
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Login successful - User: ${user.name}, Role: ${user.role}`);

    return res.status(200).json({
      user: { name: user.name, email: user.email },
      token,
      role: user.role
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Keep the old route for backward compatibility (optional)
// router.post('/login', async (req, res) => {
//   console.log('Warning: Using deprecated /login route. Please use /login instead.');
//   // Redirect to the new login route
//   req.url = '/login';
//   return router.handle(req, res);
// });

// Fixed change-password route
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be same as current password' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Validate new password format
    try {
      validatePassword(newPassword);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ 
      message: 'Password updated successfully',
      success: true 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;