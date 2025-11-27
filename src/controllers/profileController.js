const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require('../models/User');

// Validation helper
exports.validateProfileUpdate = (data) => {
  const errors = [];

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Format email invalide');
  }

  if (data.phoneNumber && !/^[0-9+\-() ]{8,}$/.test(data.phoneNumber)) {
    errors.push('Format téléphone invalide');
  }

  if (data.firstName && data.firstName.length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }

  if (data.lastName && data.lastName.length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  return errors;
};

// Fonction utilitaire
const getUserId = (req) => {
  const userId = req.user._id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('ID utilisateur invalide');
  }
  return userId;
};

// GET - Récupérer le profil
exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// PUT - Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      firstName,
      lastName,
      phoneNumber,
      department,
      preferences
    } = req.body;

    const validationErrors = exports.validateProfileUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (department !== undefined) updateData.department = department;
    if (preferences !== undefined) {
      updateData.preferences = { 
        ...req.user.preferences, 
        ...preferences 
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// PATCH - Mettre à jour l'email
exports.updateEmail = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const user = await User.findById(userId).select('+password');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    user.email = newEmail;
    await user.save();

    res.json({
      success: true,
      message: 'Email mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'email',
      error: error.message
    });
  }
};

// PATCH - Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findById(userId).select('+password');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// DELETE - Désactiver le compte
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis pour désactiver le compte'
      });
    }

    const user = await User.findById(userId).select('+password');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Compte désactivé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du compte',
      error: error.message
    });
  }
};