const User = require('../models/user');
const Role = require('../models/role');
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * =========================
 * 🔹 Enregistrer un utilisateur
 * =========================
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, roleName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const role = await Role.findOne({ name: roleName || "user" });
    if (!role) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role._id
    });

    const userWithRole = await User.findById(user._id)
      .select("-password")
      .populate("role", "name");

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: userWithRole
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * 🔹 Liste des utilisateurs (Admin)
 * =========================
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("role", "name");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * 🔹 Récupérer un utilisateur par ID
 * =========================
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
};

/**
 * =========================
 * 🔹 Modifier un utilisateur
 * =========================
 */
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;

    // Changement du rôle
    if (updates.roleName) {
      const role = await Role.findOne({ name: updates.roleName });
      if (!role) {
        return res.status(400).json({ message: "Rôle invalide" });
      }
      updates.role = role._id;
      delete updates.roleName;
    }

    // Changement du mot de passe
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
      .select("-password")
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

/**
 * =========================
 * 🔹 Supprimer un utilisateur
 * =========================
 */
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * 🔐 Mot de passe oublié
 * =========================
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1h
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Réinitialisation du mot de passe',
      html: `
        <h2>Réinitialisation du mot de passe</h2>
        <p>Cliquez sur le lien ci-dessous :</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>⏱️ Lien valide 1 heure</p>
      `
    });

    res.json({ message: "Email de réinitialisation envoyé" });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
  }
};

/**
 * =========================
 * 🔐 Réinitialiser le mot de passe
 * =========================
 */
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Mot de passe trop court" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès" });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
