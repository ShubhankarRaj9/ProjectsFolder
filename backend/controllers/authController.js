const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateToken = (user) => {
  return jwt.sign(
    {
      user: {
        _id: user._id,
        role: user.role,
        email: user.instituteEmailId,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
};

exports.loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instituteEmailId, password } = req.body;

  const user = await User.findOne({ instituteEmailId });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Persist hashed refresh token (do not store raw token)
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(hashedRefresh);
  await user.save();

  // Set httpOnly refresh token cookie (raw token sent to client)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(200).json({
    token: accessToken,
    user: {
      _id: user._id,
      email: user.instituteEmailId,
      name: user.name,
      role: user.role,
    },
  });
});

// Refresh token endpoint - rotates refresh token and returns new access token
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Find which stored hashed token matches the presented token
    let matchedIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const stored = user.refreshTokens[i];
      // compare raw token to hashed stored token
      const match = await bcrypt.compare(token, stored);
      if (match) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const hashedNew = await bcrypt.hash(newRefreshToken, 10);

    // Rotate: remove the matched hashed token and push the new hashed token
    user.refreshTokens.splice(matchedIndex, 1);
    user.refreshTokens.push(hashedNew);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ token: accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout: remove refresh token from DB and clear cookie
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (user && user.refreshTokens && user.refreshTokens.length) {
      // remove the matching hashed token
      const newList = [];
      for (let i = 0; i < user.refreshTokens.length; i++) {
        const stored = user.refreshTokens[i];
        const match = await bcrypt.compare(token, stored);
        if (!match) newList.push(stored);
      }
      user.refreshTokens = newList;
      await user.save();
    }
  } catch (err) {
    // ignore errors on logout
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
});

exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instituteEmailId, password, name, role } = req.body;

  const existingUser = await User.findOne({ instituteEmailId });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    instituteEmailId,
    password: hashedPassword,
    name: name || '',
    role: role || 'student',
  });
  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Persist refresh token
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  // Set httpOnly refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({
    token: accessToken,
    user: {
      _id: user._id,
      email: user.instituteEmailId,
      name: user.name,
      role: user.role,
    },
  });
});

exports.createUserByAdmin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instituteEmailId, password, role } = req.body;

  if (!['faculty', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Role must be student or faculty' });
  }

  const existingUser = await User.findOne({ instituteEmailId });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    instituteEmailId,
    password: hashedPassword,
    role,
  });

  res.status(201).json({
    message: `${role} user created successfully`,
    user: {
      _id: user._id,
      email: user.instituteEmailId,
      role: user.role,
    },
  });
});
