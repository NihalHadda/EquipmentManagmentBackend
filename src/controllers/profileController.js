const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require('../models/user');

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

// Fonction utilitaire pour récupérer l'ID utilisateur valide
const getUserId = (req) => {
  const userId = req.user._id || req.user.id;
  if (!userId) {
    throw new Error('ID utilisateur manquant');
  }
  const userIdStr = userId.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
    throw new Error('ID utilisateur invalide');
  }
  return userIdStr;
};

// 🔄 Fonction pour convertir DB (français) -> Frontend (anglais)
const formatUserForFrontend = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  
  return {
    _id: userObj._id,
    email: userObj.email || "",
    firstName: userObj.prenom || userObj.firstName || "",
    lastName: userObj.nom || userObj.lastName || "",
    phoneNumber: userObj.telephone || userObj.phoneNumber || "",
    bio: userObj.bio || "",
    department: userObj.department || "",
    preferences: userObj.preferences || {},
    role: userObj.role?.name || userObj.role || null,
    isActive: userObj.statut === "actif" || userObj.isActive || true,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
};

// 🔄 Fonction pour convertir Frontend (anglais) -> DB (français)
const formatUserForDB = (data) => {
  const dbData = {};
  
  if (data.firstName !== undefined) dbData.prenom = data.firstName.trim();
  if (data.lastName !== undefined) dbData.nom = data.lastName.trim();
  if (data.phoneNumber !== undefined) dbData.telephone = data.phoneNumber.trim();
  if (data.bio !== undefined) dbData.bio = data.bio.trim();
  if (data.department !== undefined) dbData.department = data.department.trim();
  if (data.preferences !== undefined) dbData.preferences = data.preferences;
  
  return dbData;
};

// GET - Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('🔍 Récupération du profil pour:', userId);
    
    const user = await User.findById(userId)
      .populate('role', 'name')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Profil DB récupéré:', {
      id: user._id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email
    });

    // Convertir pour le frontend
    const formattedUser = formatUserForFrontend(user);

    console.log('📤 Profil envoyé au frontend:', {
      firstName: formattedUser.firstName,
      lastName: formattedUser.lastName,
      email: formattedUser.email
    });

    res.json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
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

    console.log('📝 Données reçues du frontend:', req.body);

    // Validation
    const validationErrors = exports.validateProfileUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    // Convertir les données frontend vers format DB
    const updateData = formatUserForDB(req.body);

    // Gérer les préférences
    if (req.body.preferences !== undefined) {
      const currentUser = await User.findById(userId).select('preferences');
      updateData.preferences = { 
        ...(currentUser?.preferences || {}), 
        ...req.body.preferences 
      };
    }

    console.log('🔄 Données pour la DB:', updateData);

    // Mise à jour
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    )
    .populate('role', 'name')
    .select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Profil mis à jour dans DB:', {
      id: updatedUser._id,
      prenom: updatedUser.prenom,
      nom: updatedUser.nom
    });

    // Convertir pour le frontend
    const formattedUser = formatUserForFrontend(updatedUser);

    console.log('📤 Profil retourné au frontend:', {
      firstName: formattedUser.firstName,
      lastName: formattedUser.lastName
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: formattedUser
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Format email invalide'
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    const emailExists = await User.findOne({ 
      email: newEmail.toLowerCase().trim(),
      _id: { $ne: userId }
    });
    
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    user.email = newEmail.toLowerCase().trim();
    await user.save();

    console.log('✅ Email mis à jour:', newEmail);

    res.json({
      success: true,
      message: 'Email mis à jour avec succès',
      data: { email: user.email }
    });
  } catch (error) {
    console.error('❌ Erreur updateEmail:', error);
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
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log('✅ Mot de passe changé pour:', userId);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changePassword:', error);
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
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    user.statut = "inactif";
    await user.save();

    console.log('✅ Compte désactivé:', userId);

    res.json({
      success: true,
      message: 'Compte désactivé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur deactivateAccount:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du compte',
      error: error.message
    });
  }
};