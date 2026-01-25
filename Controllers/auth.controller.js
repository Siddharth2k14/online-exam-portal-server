// Importing required modules
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Importing models
import User from "../Models/Auth.model";

// Function to validate password
const validatePassword = (password) => {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
    }
}

// Controller for Signup
export const userSignup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phoneNumber } = req.body;
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

        const newUser = new User({ name, email, password: hashedPassword, role, phoneNumber });
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
}

// Controller for Login
export const userLogin = async (req, res) => {
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
}


// Controller for Change Password
export const changePassword = async (req, res) => {
    try {
        console.log('=== CHANGE PASSWORD ROUTE DEBUG ===');
        console.log('Request body:', req.body);
        console.log('User from middleware:', req.user);

        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Get user ID from middleware (try both methods for compatibility)
        const userId = req.user._id || req.user.id || req.userId;
        console.log('Using user ID:', userId);

        if (!userId) {
            console.log('No user ID found in request');
            return res.status(400).json({ message: 'User ID not found in token' });
        }

        // Find user in database
        console.log('Searching for user with ID:', userId);
        const user = await User.findById(userId);
        console.log('User found in change-password route:', !!user);

        if (!user) {
            console.log('User not found in database during password change');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found user:', { id: user._id, email: user.email });

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            console.log('New password same as current');
            return res.status(400).json({ message: 'New password cannot be same as current password' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log('Current password match:', isMatch);

        if (!isMatch) {
            console.log('Current password is incorrect');
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password format
        try {
            validatePassword(newPassword);
            console.log('New password validation passed');
        } catch (validationError) {
            console.log('Password validation failed:', validationError.message);
            return res.status(400).json({ message: validationError.message });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        console.log('Password updated successfully');
        console.log('=== END CHANGE PASSWORD ROUTE DEBUG ===');

        res.status(200).json({
            message: 'Password updated successfully',
            success: true
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
}


// Controller for Fetching all the users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "No users found"
            });
        }

        console.log(`Found ${users.length}`);
        res.status(200).json({
            message: "Users fetched successfully",
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Error in fetching the data", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


// Controller for Fetching all the users based on the roles
export const getAllUsersRole = async (req, res) => {
    try {
        console.log("Fetching all the users based on the roles");

        const { role } = req.params;
        const validRoles = ['student', 'admin'];

        // Validate role parameter
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Must be 'student' or 'admin'"
            });
        }

        // Find ALL users with the specified role
        const users = await User.find({ role: role });

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: `No ${role}s found`
            });
        }

        console.log(`Found ${users.length} ${role}s`);
        console.log(users);

        // Create response with appropriate key
        const responseKey = role === 'admin' ? 'admins' : 'students';

        res.json({
            message: `Found ${users.length} ${role}s`,
            [responseKey]: users
        });

        console.log("Fetched all the users");

    } catch (error) {
        console.error(`Error fetching ${req.params.role}s:`, error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}