// src/routes/profile.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getProfile, 
  updateProfile, 
  updateEmail, 
  changePassword, 
  deactivateAccount 
} from '../controllers/profileController.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(protect);

// GET - Récupérer le profil
router.get('/', getProfile);

// PUT - Mettre à jour le profil
router.put('/', updateProfile);

// PATCH - Mettre à jour l'email
router.patch('/email', updateEmail);

// PATCH - Changer le mot de passe
router.patch('/password', changePassword);

// DELETE - Désactiver le compte
router.delete('/', deactivateAccount);

export default router;