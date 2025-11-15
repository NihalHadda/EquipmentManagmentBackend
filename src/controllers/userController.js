const User = require('../models/user');
const Role = require('../models/role'); // ✅ Ajouter cette ligne
const bcrypt = require("bcryptjs");

// 🔹 Enregistrer un nouvel utilisateur
exports.registerUser = async (req, res, next) => {
  const { username, email, password, roleName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

    // ✅ Chercher le rôle par son nom (par défaut "user")
    const role = await Role.findOne({ name: roleName || "user" });
    if (!role) return res.status(400).json({ message: "Rôle invalide" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword, 
      role: role._id // ✅ Utiliser l'ID du rôle
    });

    // ✅ Retourner l'utilisateur avec le rôle populé
    const userWithRole = await User.findById(user._id).populate("role", "name");

    res.status(201).json({ 
      message: "Utilisateur créé", 
      user: {
        id: userWithRole._id,
        username: userWithRole.username,
        email: userWithRole.email,
        role: userWithRole.role.name // ✅ Affiche "admin" ou "user"
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Liste des utilisateurs (Admin) - ✅ Ajouter populate
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").populate("role", "name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Récupérer un utilisateur par ID - ✅ Ajouter populate
exports.getUserById = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id).select("-password").populate("role", "name");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Modifier un utilisateur
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // ✅ Si roleName est fourni, trouver l'ID du rôle
    if (updates.roleName) {
      const role = await Role.findOne({ name: updates.roleName });
      if (!role) return res.status(400).json({ message: "Rôle invalide" });
      updates.role = role._id;
      delete updates.roleName; // ✅ Supprimer roleName du body
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-password")
      .populate("role", "name");
      
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Supprimer un utilisateur
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};