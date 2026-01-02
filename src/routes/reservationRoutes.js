const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

/* ======================================================
   ROUTES ADMIN (TOUJOURS AVANT LES ROUTES AVEC :id)
   ====================================================== */
router.get('/test/availability', reservationController.checkEquipmentAvailability);

// 📊 Statistiques (cards en haut)
router.get(
  '/stats',
  protect,
  authorizeRole('admin'),
  reservationController.getReservationStats
);

// 📋 Toutes les réservations
router.get(
  '/',
  protect,
  //authorizeRole('admin'),
  reservationController.getAllReservations
);

// ⏳ Réservations en attente
router.get(
  '/pending',
  protect,
  authorizeRole('admin'),
  reservationController.getPendingReservations
);

// ✅ Réservations approuvées
router.get(
  '/approved',
  protect,
  authorizeRole('admin'),
  reservationController.getApprovedReservations
);

// ❌ Réservations refusées
router.get(
  '/rejected',
  protect,
  authorizeRole('admin'),
  reservationController.getRejectedReservations
);

// 🔁 Approuver / Refuser
router.patch(
  '/:id/status',
  protect,
  authorizeRole('admin'),
  reservationController.updateReservationStatus
);


/* ======================================================
   ROUTES UTILISATEUR
   ====================================================== */

router.post('/', protect, reservationController.createReservation);
router.put('/:id', protect, reservationController.updateReservation);
router.get('/:id', protect, reservationController.getReservationById);
router.delete('/:id', protect, reservationController.deleteReservation);

module.exports = router;
