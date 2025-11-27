//authMiddleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

/**
 * Middleware pour vérifier l'authentification
 */
exports.protect = async (req, res, next) => { 
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 Authorization Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Accès refusé, token manquant' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('✅ Token décodé:', decoded);

    // ✅ جيب المستخدم الكامل من الـ database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // ✅ حط المستخدم الكامل في req.user
    req.user = user;

    next();

  } catch (err) {
    console.error('❌ Erreur de vérification du token:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expiré, veuillez vous reconnecter' 
      });
    }

    return res.status(401).json({ 
      success: false,
      message: 'Erreur d\'authentification' 
    });
  }
};