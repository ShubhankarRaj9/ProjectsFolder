const express = require('express');
const router = express.Router();


const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/login', authController.loginUser);
router.get('/login',(req,res)=>{
    res.send('get Logged in');
})
router.post('/register', authController.registerUser);
router.get('/register',(req,res)=>{
    res.send('registered successfully');
})
router.post('/admin/create-user', protect, adminOnly, authController.createUserByAdmin);
router.get('/admin/create-user',(req,res)=>{
    res.send('admin/create-user');
})
module.exports = router;
