const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',protect, reservationController.createReservation);
router.put('/:id',protect, reservationController.updateReservation);
router.get('/:id',protect, reservationController.getReservationById);
module.exports = router;