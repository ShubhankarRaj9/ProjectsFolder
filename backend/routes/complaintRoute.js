const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Complaint routes
router.post('/submit', protect, upload.single('file'), complaintController.submitComplaint);
router.get('/my-complaints', protect, complaintController.getMyComplaints);
router.get('/admin/dashboard', protect, adminOnly, complaintController.getAdminDashboardData);
router.patch('/:id/resolve', protect, complaintController.resolveComplaint);
router.delete('/:id', protect, complaintController.deleteComplaint);

module.exports = router;
