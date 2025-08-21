import jwt from 'jsonwebtoken';
import User from '../Models/AuthModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check if it starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header does not start with Bearer');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Extracted token:', token.substring(0, 20) + '...');

    if (!token) {
      console.log('No token found after Bearer');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Find user in database
    console.log('Looking for user with ID:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found in database with ID:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found:', { id: user._id, email: user.email, role: user.role });
    
    // Add user to request object
    req.user = user;
    req.userId = user._id; // Add this for backward compatibility
    
    console.log('Auth middleware completed successfully');
    console.log('=== END AUTH MIDDLEWARE DEBUG ===');
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;