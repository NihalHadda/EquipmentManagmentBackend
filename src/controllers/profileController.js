import bcrypt from 'bcryptjs';
import User from '../models/user.js';

// Validation helper
const validateProfileUpdate = (data) => {
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

// GET - Récupérer le profil de l'utilisateur connecté
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
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
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      department,
      preferences
    } = req.body;

    // Validation
    const validationErrors = validateProfileUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    // Construire l'objet de mise à jour
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

    // Mise à jour
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
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
export const updateEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Vérifier le mot de passe actuel
    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Vérifier si l'email existe déjà
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Mettre à jour l'email
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
export const changePassword = async (req, res) => {
  try {
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

    // Vérifier le mot de passe actuel
    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hash et sauvegarder le nouveau mot de passe
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
export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis pour désactiver le compte'
      });
    }

    // Vérifier le mot de passe
    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Désactiver le compte
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