// middlewares/roleMiddleware.js
// ============================================
// Middleware pour vérifier les autorisations
// ============================================

/**
 * Autoriser l'accès selon le rôle
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Utilisateur non authentifié' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Accès refusé : rôle insuffisant. Rôle requis: ${roles.join(' ou ')}` 
      });
    }

    next();
  };
};

/**
 * Vérifier que l'utilisateur modifie ses propres données ou qu'il est admin
 */
exports.isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Utilisateur non authentifié' 
    });
  }

  const userId = req.params.id;

  if (req.user.role === 'admin' || req.user.id === userId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Vous ne pouvez modifier que vos propres informations' 
  });
};