require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');
const Role = require('./models/role');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Please configure your .env');
  process.exit(1);
}

const initDefaultRoles = async () => {
  try {
    console.log("🔄 Initialisation des rôles par défaut...");
    const roles = ['admin', 'user', 'superviseur'];
    for (const roleName of roles) {
      const existing = await Role.findOne({ name: roleName });
      if (!existing) {
        await Role.create({ name: roleName });
        console.log(`✅ Rôle "${roleName}" créé`);
      } else {
        console.log(`ℹ️ Rôle "${roleName}" existe déjà`);
      }
    }
    console.log("✅ Rôles initialisés avec succès");
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des rôles:', error.message);
  }
};

const app = createApp();

connectDB(MONGO_URI).then(async () => {
  console.log("✅ Base de données connectée");
  await initDefaultRoles();
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Erreur de connexion DB:", err.message);
  process.exit(1);
});
