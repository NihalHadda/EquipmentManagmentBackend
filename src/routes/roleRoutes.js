const express = require("express");
const router = express.Router();
const { 
  createRole, 
  getRoles, 
  getRoleById, 
  updateRole, 
  deleteRole 
} = require("../controllers/roleController");

// ✅ Routes pour gérer les rôles
router.post("/", createRole);           // Créer un rôle
router.get("/", getRoles);              // Liste tous les rôles
router.get("/:id", getRoleById);        // Récupérer un rôle par ID
router.put("/:id", updateRole);         // Mettre à jour un rôle
router.delete("/:id", deleteRole);      // Supprimer un rôle

module.exports = router;