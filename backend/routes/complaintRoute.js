const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage: storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// Complaint routes
router.post('/submit', protect, upload.single('file'), complaintController.submitComplaint);
router.get('/my-complaints', protect, complaintController.getMyComplaints);
router.get('/admin/dashboard', protect, adminOnly, complaintController.getAdminDashboardData);
router.patch('/:id/resolve', protect, complaintController.resolveComplaint);
router.delete('/:id', protect, complaintController.deleteComplaint);

module.exports = router;
