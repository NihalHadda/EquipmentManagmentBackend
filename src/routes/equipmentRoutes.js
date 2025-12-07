const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipementController');

// ------------------------
// Routes pour les équipements
// ------------------------

// Créer un nouvel équipement
router.post('/', equipmentController.createEquipment);

// Obtenir tous les équipements (avec filtres optionnels : statut, type, localisation)
router.get('/', equipmentController.getAllEquipments);

// Obtenir un équipement par ID
router.get('/:id', equipmentController.getEquipmentById);

// Mettre à jour un équipement par ID
router.put('/:id', equipmentController.updateEquipment);

// Supprimer un équipement par ID
router.delete('/:id', equipmentController.deleteEquipment);

// Obtenir les statistiques des équipements
router.get('/stats/all', equipmentController.getEquipmentStats);

module.exports = router;