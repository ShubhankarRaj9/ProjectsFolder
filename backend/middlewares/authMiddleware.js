const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

exports.protect = async (req, res, next) => {
  // Support Authorization: Bearer <token>, x-auth-token header, or cookie-based access token
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  token = token || req.header('x-auth-token') || req.cookies?.accessToken || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger && logger.info && logger.info('[Auth] Token decoded', { user: decoded.user });

    const userId = decoded?.user?._id || decoded?.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      logger && logger.error && logger.error('[Auth] User not found', { userId });
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger && logger.error && logger.error('[Auth Error] Token validation failed', { message: err.message });
    res.status(401).json({ message: 'Token is not valid' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.facultyOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Faculty access required' });
  }
  next();
};

exports.studentOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};
