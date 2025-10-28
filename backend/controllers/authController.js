const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

exports.loginUser = asyncHandler(async (req, res) => {
  const { instituteEmailId, password } = req.body;

  const user = await User.findOne({ instituteEmailId });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.status(200).json({
    token: generateToken(user),
    user: {
      _id: user._id,
      email: user.instituteEmailId,
      name: user.name,
      role: user.role,
    },
  });
});

exports.registerUser = asyncHandler(async (req, res) => {
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
  res.status(201).json({
    token: generateToken(user),
    user: {
      _id: user._id,
      email: user.instituteEmailId,
      name: user.name,
      role: user.role,
    },
  });
});

exports.createUserByAdmin = asyncHandler(async (req, res) => {
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
