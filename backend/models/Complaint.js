const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      'Academic Issues',
      'Infrasturcture Problems',
      'Administration Complaints',
      'Technical Difficulties',
      'Other Issues',
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['unresolved', 'resolved'],
    default: 'unresolved',
  },
  filePath: {
    type: String,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionNotes: {
    type: String,
  },
}, { timestamps: true });

complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
