const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  photo: {
    type: String, // base64 encoded image
    default: null
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  capacite: {
    valeur: {
      type: Number,
      required: [true, 'La valeur de capacité est requise'],
      min: [0, 'La capacité ne peut pas être négative']
    },
    unite: {
      type: String,
      required: [true, 'L\'unité de capacité est requise'],
      trim: true,
      enum: ['kg', 'litres', 'personnes', 'unités', 'watts', 'autres']
    }
  },
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    enum: [
      'Équipement informatique',
      'Équipement bureautique',
      'Machine industrielle',
      'Outil électrique',
      'Matériel de laboratoire',
      'Autre'
    ]
  },
  localisation: {
    type: String,
    required: [true, 'La localisation est requise'],
    enum: [
      'Salle 1',
      'Salle 2',
      'Atelier Principal',
      'Salle A',
      'Salle B',
      'Entrepôt'
    ]
  },
  horairesDisponibles: {
    lundi: { type: String, default: 'Fermé' },
    mardi: { type: String, default: 'Fermé' },
    mercredi: { type: String, default: 'Fermé' },
    jeudi: { type: String, default: 'Fermé' },
    vendredi: { type: String, default: 'Fermé' },
    samedi: { type: String, default: 'Fermé' },
    dimanche: { type: String, default: 'Fermé' }
  },
  conditionsAcces: {
    type: String,
    required: [true, 'Les conditions d\'accès sont requises'],
    trim: true
  },
  statut: {
    type: String,
    required: true,
    enum: ['Disponible', 'Hors service', 'Maintenance'],
    default: 'Disponible'
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances de recherche
equipmentSchema.index({ nom: 1 });
equipmentSchema.index({ statut: 1 });
equipmentSchema.index({ localisation: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);