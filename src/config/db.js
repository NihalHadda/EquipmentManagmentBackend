// config/db.js
// ============================================
// Configuration de la connexion à MongoDB
// ============================================

const mongoose = require('mongoose');

/**
 * Fonction pour établir la connexion à MongoDB
 * @param {string} mongoUri - URI de connexion MongoDB
 * @returns {Promise<void>}
 */
async function connectDB(mongoUri) {
  try {
    // Connexion à MongoDB avec les options recommandées
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connecté avec succès');
  } catch (err) {
    // En cas d'erreur de connexion
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1); // Code 1 = erreur
  }
}

module.exports = connectDB;