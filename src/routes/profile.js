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

// Protection
router.use(protect);

// Routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.patch('/email', updateEmail);
router.patch('/password', changePassword);
router.delete('/', deactivateAccount);

module.exports = router;