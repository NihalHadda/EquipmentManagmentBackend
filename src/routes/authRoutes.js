const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
// Route pour se connecter (POST)
router.post("/login", ctrl.login);

module.exports = router;
