const mongoose = require("mongoose");
const Role = require("../models/role");

const initRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/yourdb");

    const roles = await Role.find();
    if (roles.length === 0) {
      await Role.create([
        { name: "admin", permissions: ["all"] },
        { name: "user", permissions: ["read", "write"] }
      ]);
      console.log("✅ Rôles créés : admin et user");
    } else {-
      console.log("ℹ️ Les rôles existent déjà");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des rôles:", error);
  }
};

initRoles();