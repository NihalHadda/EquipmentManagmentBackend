const User = require('../models/user');
const bcrypt = require("bcryptjs");

exports.listUsers = async (req, res, next) => {
  
};

exports.createUser = async (req, res, next) => {
  const {email, firstname, lastname, password, role} = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message : "Utilisateur existe avec ce email"});
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      email, firstname, lastname, password : passwordHash, role 
    };
    await User.create(newUser)
    return res.status(200).json({message : "Utilisateur crée avec succés "});

  }
};
exports.getUserById = async (req, res, next) => {
 
};

exports.deleteUser = async (req, res, next) => {
 
};

exports.updateUser = async (req, res, next) => {
 
};
