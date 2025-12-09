// middlewares/authMiddleware.js
// ============================================
// Middleware pour protéger les routes
// ============================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware pour vérifier l'authentification
 */
exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Accès refusé, token manquant' 
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();

  } catch (err) {
    console.error('Erreur de vérification du token:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré, veuillez vous reconnecter' 
      });
    }

    return res.status(401).json({ 
      message: 'Erreur d\'authentification' 
    });
  }
};
