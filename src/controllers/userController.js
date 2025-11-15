
const User = require('../models/User');
const Role = require('../models/role'); // ✅ Ajouter cette ligne
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 🔹 Enregistrer un nouvel utilisateur
exports.registerUser = async (req, res, next) => {
  const { username, email, password, roleName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

    // ✅ Chercher le rôle par son nom (par défaut "user")
    const role = await Role.findOne({ name: roleName || "user" });
    if (!role) return res.status(400).json({ message: "Rôle invalide" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword, 

      role: role._id // ✅ Utiliser l'ID du rôle
    });

    // ✅ Retourner l'utilisateur avec le rôle populé
    const userWithRole = await User.findById(user._id).populate("role", "name");

    res.status(201).json({ 
      message: "Utilisateur créé", 
      user: {
        id: userWithRole._id,
        username: userWithRole.username,
        email: userWithRole.email,
        role: userWithRole.role.name // ✅ Affiche "admin" ou "user"
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Liste des utilisateurs (Admin) - ✅ Ajouter populate
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").populate("role", "name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Récupérer un utilisateur par ID - ✅ Ajouter populate
exports.getUserById = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id).select("-password").populate("role", "name");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Modifier un utilisateur
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // ✅ Si roleName est fourni, trouver l'ID du rôle
    if (updates.roleName) {
      const role = await Role.findOne({ name: updates.roleName });
      if (!role) return res.status(400).json({ message: "Rôle invalide" });
      updates.role = role._id;
      delete updates.roleName; // ✅ Supprimer roleName du body
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-password")
      .populate("role", "name");
      
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Supprimer un utilisateur
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================
// 🔐 RÉINITIALISATION DU MOT DE PASSE
// ============================================

/**
 * Envoi d'email de réinitialisation
 * @route POST /api/users/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});


    transporter.verify((error, success) => {
      if (error) console.error('Erreur connexion SMTP:', error);
      else console.log('Connexion SMTP OK');
    });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/users/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Réinitialisation du mot de passe',
      html: `
        <h2>Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous :</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>Ce lien expire dans 1 heure.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email de réinitialisation envoyé avec succès' });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
};

/**
 * Réinitialiser le mot de passe
 * @route POST /api/users/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation' });
  }
};
