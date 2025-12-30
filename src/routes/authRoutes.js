const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");

// ================= AUTH ROUTES =================

// Inscription
router.post("/register", ctrl.register);

// Connexion
router.post("/login", ctrl.login);

// Déconnexion
router.post("/logout", ctrl.logout);

module.exports = router;