const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/', protect, adminOnly, userController.getAllUsers);
router.get('/:id', protect, adminOnly, userController.getUserById);
router.delete('/:id', protect, adminOnly, userController.deleteUser);
router.patch('/:id/role', protect, adminOnly, userController.updateUserRole);

module.exports = router;
