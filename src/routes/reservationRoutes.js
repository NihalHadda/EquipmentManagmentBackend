const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

// Routes utilisateur 
router.post('/', protect, reservationController.createReservation);
router.put('/:id', protect, reservationController.updateReservation);
router.get('/:id', protect, reservationController.getReservationById);
router.delete('/:id', protect, reservationController.deleteReservation);
module.exports = router;
