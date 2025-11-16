const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/userController');

// Middleware
const { protect } = require('../middleware/authMiddleware');
const { authorize, isOwnerOrAdmin } = require('../middleware/roleMiddleware');

// Routes CRUD
router.post('/register', protect, ctrl.registerUser);
router.get('/', protect, ctrl.getUsers);
router.put('/:id', protect, ctrl.updateUser);
router.delete('/:id', protect, ctrl.deleteUser);
router.get('/:id',protect,ctrl.getUserById)
// Routes de réinitialisation
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);

module.exports = router;
