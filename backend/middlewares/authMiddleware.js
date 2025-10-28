const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Debug] Token decoded successfully:', { userId: decoded.user._id, role: decoded.user.role });
    
    const user = await User.findById(decoded.user._id).select('-password');

    if (!user) {
      console.error('[Auth Error] User not found in database for ID:', decoded.user._id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('[Auth Debug] User found:', { id: user._id, email: user.instituteEmailId, role: user.role });
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Error] Token validation failed:', {
      error: err.message,
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing'
    });
    res.status(401).json({ message: 'Token is not valid' });
  }
};
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.facultyOnly = (req, res, next) => {
  if (req.user?.role !== 'faculty') {
    return res.status(403).json({ message: 'Faculty access required' });
  }
  next();
};

exports.studentOnly = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};
