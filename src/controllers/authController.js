// controllers/authController.js
// ============================================
// Contrôleur pour l'authentification des utilisateurs
// ============================================

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Connexion d'un utilisateur
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation des données d'entrée
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email et mot de passe requis' 
      });
    }

    // 2️⃣ Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // 3️⃣ Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // 4️⃣ Générer un token JWT
    const SECRETKEY = process.env.ACCESS_TOKEN_SECRET;
    
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role
      }, 
      SECRETKEY, 
      { expiresIn: '1h' }
    );

    // 5️⃣ Retourner la réponse
    return res.status(200).json({ 
      message: 'Connexion réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: token 
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion' 
    });
  }
};