//routes/profile.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const {
  getProfile,
  updateProfile,
  updateEmail,
  changePassword,
  deactivateAccount
} = require('../controllers/profileController');

const router = express.Router();

// 🔐 Auth middleware
router.use(protect);

// 👤 Profile
router.get('/', getProfile);
router.put('/', updateProfile);

// 📧 Email
router.patch('/email', updateEmail);

// 🔑 Password
router.patch('/password', changePassword);

// 🚫 Deactivate
router.delete('/', deactivateAccount);

module.exports = router;
