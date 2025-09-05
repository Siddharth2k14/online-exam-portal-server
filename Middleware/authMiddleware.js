// Middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../Models/AuthModel.js';

const authMiddleware = async (req, res, next) => {
    try {
        console.log('=== AUTH MIDDLEWARE DEBUG ===');
        
        // Get token from header
        const authHeader = req.header('Authorization');
        console.log('Authorization header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No valid authorization header found');
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('Extracted token:', token.substring(0, 20) + '...');

        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', { userId: decoded.userId, role: decoded.role });

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        console.log('User found in database:', !!user);
        
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ message: 'Token is not valid' });
        }

        console.log('User authenticated:', { id: user._id, email: user.email, role: user.role });
        
        // Attach user to request
        req.user = user;
        req.userId = user._id; // For backward compatibility
        
        console.log('=== END AUTH MIDDLEWARE DEBUG ===');
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        res.status(500).json({ message: 'Server error in authentication' });
    }
};

export default authMiddleware;