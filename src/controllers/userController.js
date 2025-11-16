import User from '../models/user.js';
import bcrypt from 'bcryptjs';

// 🔹 Enregistrer un nouvel utilisateur (Admin uniquement)
export const registerUser = async (req, res, next) => {
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
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Modifier un utilisateur
export const updateUser = async (req, res, next) => {
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
export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};