
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

// 🔐 Toutes les routes nécessitent l'authentification
router.use(protect);

// 👤 Récupérer le profil utilisateur
router.get('/', getProfile);

// ✏️ Mettre à jour le profil
router.put('/', updateProfile);

// 📧 Mettre à jour l'email
router.patch('/email', updateEmail);

// 🔑 Changer le mot de passe
router.patch('/password', changePassword);

// 🚫 Désactiver le compte
router.delete('/', deactivateAccount);

export default router;
