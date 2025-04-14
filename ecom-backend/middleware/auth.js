const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware: Received token', token.substring(0, 15) + '...');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware: Token verified for user ID:', decoded.id);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('Auth middleware: User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found, token invalid' });
      }
      
      req.user = user;
      console.log('Auth middleware: User attached to request', user._id);
      
      next();
    } catch (error) {
      console.error('Auth middleware: Token verification failed', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  } else {
    console.error('Auth middleware: No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
