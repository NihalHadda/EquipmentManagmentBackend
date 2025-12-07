// middlewares/authMiddleware.js
// ============================================
// Middleware pour protéger les routes
// ============================================

// Importation du module jsonwebtoken pour gérer les JWT (JSON Web Tokens)
const jwt = require('jsonwebtoken');

// Chargement des variables d'environnement depuis le fichier .env
require('dotenv').config();

/**
 * Middleware pour vérifier l'authentification
 * Ce middleware vérifie si l'utilisateur possède un token JWT valide
 */
exports.protect = (req, res, next) => {
  try {
    // Récupération de l'en-tête "Authorization" de la requête HTTP
    const authHeader = req.headers.authorization;
    
    // Affichage du contenu de l'en-tête dans la console (pour débogage)
    console.log(authHeader)

    // Vérification si l'en-tête Authorization existe et commence par "Bearer "
    // Format attendu: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Si l'en-tête est absent ou mal formaté, retourner une erreur 401 (Non autorisé)
      return res.status(401).json({ 
        message: 'Accès refusé, token manquant' 
      });
    }

    // Extraction du token JWT en supprimant le préfixe "Bearer "
    // split(' ')[1] récupère la partie après l'espace
    const token = authHeader.split(' ')[1];

    // Vérification et décodage du token avec la clé secrète stockée dans les variables d'environnement
    // Si le token est invalide ou expiré, une exception sera levée
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Ajout des informations de l'utilisateur décodées à l'objet req
    // Cela permet aux routes suivantes d'accéder aux données de l'utilisateur
    req.user = {
      id: decoded.id,       // ID de l'utilisateur extrait du token
      role: decoded.role    // Rôle de l'utilisateur (ex: admin, user)
    };

    // Appel de next() pour passer au middleware ou à la route suivante
    next();

  } catch (err) {
    // En cas d'erreur, afficher le message d'erreur dans la console
    console.error('Erreur de vérification du token:', err.message);
    
    // Vérification du type d'erreur: token mal formé ou signature invalide
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide' 
      });
    }
    
    // Vérification si le token a expiré
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré, veuillez vous reconnecter' 
      });
    }

    // Pour toute autre erreur d'authentification non spécifiée
    return res.status(401).json({ 
      message: 'Erreur d\'authentification' 
    });
  }
};