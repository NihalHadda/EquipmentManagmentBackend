// const User = require('../models/user');
// const bcrypt = require("bcryptjs");

// exports.listUsers = async (req, res, next) => {
  
// };

// exports.createUser = async (req, res, next) => {
//   const {email, firstname, lastname, password, role} = req.body;
//   const user = await User.findOne({ email });
//   if (user) {
//     return res.status(400).json({ message : "Utilisateur existe avec ce email"});
//   } else {
//     const passwordHash = await bcrypt.hash(password, 12);
//     const newUser = {
//       email, firstname, lastname, password : passwordHash, role 
//     };
//     await User.create(newUser)
//     return res.status(200).json({message : "Utilisateur crée avec succés "});

//   }
// };

// exports.deleteUser = async (req, res) => {
//   const user = await User.findByIdAndDelete(req.params.id);
//   if (!user) return res.status(404).json({ message: "User not found" });
//   res.json({ message: "User deleted successfully" });
// };


// exports.updateUser = async (req, res) => {
//   const data = req.body;

//   if (data.password) {
//     data.password = await bcrypt.hash(data.password, 12);
//   }

//   const user = await User.findByIdAndUpdate(req.params.id, data, { new: true })
//     .select("-password");

//   if (!user) return res.status(404).json({ message: "User not found" });

//   res.json(user);
// };


// exports.getUsers = async (req, res) => {
//   const users = await User.find().select("-password");
//   res.status(200).json(users);
// };

const User = require('../models/user');
const Role = require('../models/role'); // ✅ Ajouter cette ligne
const bcrypt = require("bcryptjs");

// GET ALL USERS (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(200).json({ message: "Aucun utilisateur" });
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET SINGLE USER
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const data = req.body;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
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