const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Complaint = require('../models/Complaint');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');


const mapComplaintResponse = (complaint) => ({
  _id: complaint._id,
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  status: complaint.status,
  filePath: complaint.filePath,
  createdAt: complaint.createdAt,
  resolvedBy: complaint.resolvedBy ? complaint.resolvedBy._id : null,
  resolutionNotes: complaint.resolutionNotes,
  student: complaint.student && complaint.student._id ? {
    _id: complaint.student._id,
    name: complaint.student.name,
    instituteEmailId: complaint.student.instituteEmailId,
  } : null,
});

const allowedCategories = [
  'Academic Issues',
  'Hostel Complaints',
  'Mess Issues',
  'Library Concerns',
  'Other Issues',
  'IT Support',
];

exports.submitComplaint = asyncHandler(async (req, res) => {
  let { title, description, category } = req.body;
  const filePath = req.file ? req.file.path : null;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'Title, description, and category are required.' });
  }

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category.' });
  }

  title = title.trim();
  description = description.trim();

  if (req.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(req.file.mimetype) || req.file.size > maxSize) {

      fs.unlink(path.resolve(filePath), (err) => {
        if (err) logger && logger.error && logger.error('Error removing invalid upload', err);
      });
      return res.status(400).json({ message: 'Invalid file type or file too large.' });
    }
  }

  const newComplaint = new Complaint({
    student: req.user._id,
    title,
    description,
    category,
    filePath,
  });

  await newComplaint.save();
  res.status(201).json({
    message: 'Complaint submitted successfully',
    complaint: newComplaint,
  });
});

exports.getAdminDashboardData = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const totalComplaints = await Complaint.countDocuments();
  const solvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
  const unresolvedComplaints = await Complaint.countDocuments({ status: 'unresolved' });
  logger && logger.info && logger.info('[Admin Dashboard] Complaint counts', {
    total: totalComplaints,
    solved: solvedComplaints,
    unresolved: unresolvedComplaints
  });

  const recentUnresolvedComplaints = (await Complaint.find({ status: 'unresolved' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('student', 'name instituteEmailId')
    .select('title description createdAt category student status')
    .lean()).map(complaint => mapComplaintResponse(complaint));

  const recentResolvedComplaints = (await Complaint.find({ status: 'resolved' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('student', 'name instituteEmailId')
    .populate('resolvedBy', 'name instituteEmailId')
    .select('title description createdAt category student resolvedBy resolutionNotes status')
    .lean()).map(complaint => mapComplaintResponse(complaint));

  logger && logger.info && logger.info('[Admin Dashboard] Unresolved complaints found', { count: recentUnresolvedComplaints.length });
  logger && logger.info && logger.info('[Admin Dashboard] Resolved complaints found', { count: recentResolvedComplaints.length });

  res.json({
    counts: {
      total: totalComplaints,
      solved: solvedComplaints,
      unresolved: unresolvedComplaints,
    },
    recentUnresolvedComplaints,
    recentResolvedComplaints,
  });
});

exports.resolveComplaint = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const complaintId = req.params.id;

  if (!['admin', 'faculty'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!mongoose.isValidObjectId(complaintId)) {
    return res.status(400).json({ message: 'Invalid complaint ID' });
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (complaint.status === 'resolved') {
    return res.status(400).json({ message: 'Complaint is already resolved' });
  }

  complaint.status = 'resolved';
  complaint.resolvedBy = req.user._id;
  complaint.resolutionNotes = resolutionNotes || '';
  await complaint.save();

  res.json({
    message: 'Complaint resolved successfully',
    complaint: mapComplaintResponse(complaint),
  });
});

exports.getMyComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { student: req.user._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Complaint.countDocuments(filter);

  res.json({
    complaints,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaintId = req.params.id;

  if (!mongoose.isValidObjectId(complaintId)) {
    return res.status(400).json({ message: 'Invalid complaint ID' });
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Check if user is admin or the owner of the complaint
  if (req.user.role !== 'admin' && complaint.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Delete associated file if exists
  if (complaint.filePath) {
    fs.unlink(path.resolve(complaint.filePath), (err) => {
      if (err) logger && logger.error && logger.error('Error deleting file:', err);
    });
  }

  await Complaint.findByIdAndDelete(complaintId);

  res.json({
    message: 'Complaint deleted successfully'
  });
});
