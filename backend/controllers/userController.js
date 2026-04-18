const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { mapUserResponse } = require('../utils/responseMapper');
const { logger } = require('../utils/logger');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json(mapUserResponse(user));
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { name, instituteEmailId, password } = req.body;

  if (name) user.name = name.trim();
  if (instituteEmailId) {
    const normalized = instituteEmailId.toLowerCase();
    if (normalized !== user.instituteEmailId) {
      const exists = await User.findOne({ instituteEmailId: normalized });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.instituteEmailId = normalized;
    }
  }
  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();
  res.status(200).json(mapUserResponse(updatedUser));
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean();
  res.status(200).json(users.map(mapUserResponse));
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json(mapUserResponse(user));
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Cannot delete admin user' });
  }

  await user.deleteOne();

  logger && logger.info && logger.info(`[Audit] Admin ${req.user.instituteEmailId} deleted user ${user.instituteEmailId}`);

  res.status(200).json({ message: 'User deleted successfully', id: user._id });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['student', 'faculty', 'admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`,
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.role = role;
  await user.save();

  logger && logger.info && logger.info(`[Audit] Admin ${req.user.instituteEmailId} updated role of ${user.instituteEmailId} to ${role}`);

  res.status(200).json({
    message: 'User role updated successfully',
    user: mapUserResponse(user),
  });
});
