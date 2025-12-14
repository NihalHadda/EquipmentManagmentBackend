const Equipment = require('../models/Equipment');

// Créer un nouvel équipement
exports.createEquipment = async (req, res) => {
  try {
    const {
      nom,
      photo,
      description,
      capacite,
      type,
      localisation,
      horairesDisponibles,
      conditionsAcces,
      statut
    } = req.body;

    // Validation des données requises
    if (!nom || !description || !capacite || !type || !localisation || !conditionsAcces) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation de la capacité
    if (!capacite.valeur || !capacite.unite) {
      return res.status(400).json({
        success: false,
        message: 'La capacité doit contenir une valeur et une unité'
      });
    }

    // Créer le nouvel équipement
    const equipment = new Equipment({
      nom,
      photo,
      description,
      capacite,
      type,
      localisation,
      horairesDisponibles: horairesDisponibles || {},
      conditionsAcces,
      statut: statut || 'Disponible'
    });

    await equipment.save();

    res.status(201).json({
      success: true,
      message: 'Équipement créé avec succès',
      data: equipment
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'équipement:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'équipement'
    });
  }
};
// Récupérer tous les équipements, avec filtres
// Obtenir tous les équipements (avec filtres)
exports.getAllEquipments = async (req, res) => {
  try {
    const { statut, localisation, type, category } = req.query;

    const filter = {};
    if (statut) filter.statut = statut;
    if (localisation) filter.localisation = localisation;
    if (type) filter.type = type;
    if (category) filter.category = category;

    const equipments = await Equipment.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: equipments.length,
      data: equipments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des équipements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des équipements'
    });
  }
};


// Obtenir un équipement par ID
exports.getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'équipement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de l\'équipement'
    });
  }
};

// Modifier un équipement
exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si l'équipement existe
    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé'
      });
    }

    // Mettre à jour l'équipement
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validations du schéma
      }
    );

    res.status(200).json({
      success: true,
      message: 'Équipement mis à jour avec succès',
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'équipement:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de l\'équipement'
    });
  }
};

// Supprimer un équipement
exports.deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé'
      });
    }

    await Equipment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Équipement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'équipement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'équipement'
    });
  }
};

// Obtenir les statistiques des équipements
exports.getEquipmentStats = async (req, res) => {
  try {
    const stats = await Equipment.aggregate([
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEquipments = await Equipment.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        total: totalEquipments,
        parStatut: stats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};