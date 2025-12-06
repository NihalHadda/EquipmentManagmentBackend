

const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

// ---------------------- PROTECT (auth middleware) ----------------------
exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Accès refusé : token manquant" });

  try {
    // Vérifier le token
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Charger l'utilisateur depuis la DB + role
    const user = await User.findById(decoded.id).populate("role");
    if (!user)
      return res.status(401).json({ message: "Utilisateur introuvable" });

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// ---------------------- AUTHORIZE ROLE ----------------------
exports.authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Case : role object (populate) → use role.name
    const roleName = typeof req.user.role === "string"
      ? req.user.role
      : req.user.role.name;

    if (roleName !== requiredRole) {
      return res.status(403).json({ message: "Permission refusée" });
    }

    next();
  };
};
