const express = require('express');
const router = express.Router();


const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

router.post(
    '/login',
    [
        body('instituteEmailId').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    authController.loginUser
);
router.get('/login', (req, res) => {
    res.send('get Logged in');
})
router.post(
    '/register',
    [
        body('instituteEmailId').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['student', 'faculty', 'admin']).withMessage('Invalid role'),
    ],
    authController.registerUser
);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/register', (req, res) => {
    res.send('registered successfully');
})
router.post(
    '/admin/create-user',
    protect,
    adminOnly,
    [
        body('instituteEmailId').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty'),
    ],
    authController.createUserByAdmin
);
router.get('/admin/create-user', (req, res) => {
    res.send('admin/create-user');
})
module.exports = router;
