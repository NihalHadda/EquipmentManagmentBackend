import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({ message: "Email ou mot de passe incorrect" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Email ou mot de passe incorrect" });
  }

  const SECRETKEY = process.env.ACCESS_TOKEN_SECRET;
  const token = jwt.sign({ _id: user._id }, SECRETKEY, { expiresIn: "1h" });

  res.status(200).json({
    success: true,
    message: "Connexion réussie",
    token
  });
};