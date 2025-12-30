const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

/**
 * =========================
 * PROTECT – Middleware d'authentification
 * =========================
 */
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Accès refusé, token manquant" });
    }

    const token = authHeader.split(" ")[1];

    // Vérification du token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Récupérer l'utilisateur et son rôle
    const user = await User.findById(decoded.id)
      .populate("role", "name")
      .select("-password");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    // Normaliser rôle en string
    req.user = {
      ...user.toObject(),
      role: user.role ? user.role.name : null
    };

    next();
  } catch (err) {
    console.error("❌ Erreur auth:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré, reconnectez-vous" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide" });
    }

    res.status(401).json({ message: "Erreur d'authentification" });
  }
};

/**
 * =========================
 * AUTHORIZE ROLE – Middleware d'autorisation
 * =========================
 */
exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Accès refusé - Aucun rôle trouvé" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Permission refusée - Rôle requis: ${roles.join(", ")}` 
      });
    }

    next();
  };
};
