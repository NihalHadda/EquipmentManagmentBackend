// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

// Route de connexion
router.post("/login", ctrl.login);

module.exports = router;