const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
// Route pour se connecter (POST)
router.post("/login", ctrl.login);


// Route pour se déconnecter (POST)
router.post("/logout", ctrl.logout);

module.exports = router;
