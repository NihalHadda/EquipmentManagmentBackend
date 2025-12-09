const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Créer un nouvel équipement
router.post('/', equipmentController.createEquipment);

// Obtenir tous les équipements
router.get('/', equipmentController.getAllEquipments);

// Obtenir un équipement par ID
router.get('/:id', equipmentController.getEquipmentById);

// Mettre à jour un équipement
router.put('/:id', equipmentController.updateEquipment);

// Supprimer un équipement
router.delete('/:id', equipmentController.deleteEquipment);

// Statistiques
router.get('/stats/all', equipmentController.getEquipmentStats);

module.exports = router;
