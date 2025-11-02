const User = require('../models/user');
const bcrypt = require("bcryptjs");


// 🔹 Enregistrer un nouvel utilisateur (Admin uniquement)
exports.registerUser = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, role });

    res.status(201).json({ message: "Utilisateur créé", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Liste des utilisateurs (Admin)
exports.getUsers = async (req, res, next) => {

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Modifier un utilisateur
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
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
