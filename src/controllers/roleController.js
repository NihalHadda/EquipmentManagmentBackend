const Role = require('../models/role');

// 🔹 Créer un rôle (Admin uniquement)
exports.createRole = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Ce rôle existe déjà" });
    }

    const role = await Role.create({ name, permissions });
    res.status(201).json({ message: "Rôle créé avec succès", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Liste tous les rôles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Récupérer un rôle par ID
exports.getRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Mettre à jour un rôle
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const role = await Role.findByIdAndUpdate(id, updates, { new: true });
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }
    res.json({ message: "Rôle mis à jour", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Supprimer un rôle
exports.deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }
    res.json({ message: "Rôle supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};