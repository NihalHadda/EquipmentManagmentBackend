// const User = require('../models/user');
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// exports.login = async(req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: "Email et mot de passe requis" });
//   }
//   const user = await User.findOne({ email });
//   if(!user) {
//     return res.status(404).json({message : "Email ou mot de passe incorrect"});
//   }
//   const isMatch = await bcrypt.compare(password, user.password);
 
//   if (!isMatch) {
//     return res.status(400).json({message : " Email ou mot de passe incorrect"});
//   }
//   const SECRETKEY = process.env.ACCESS_TOKEN_SECRET;
//   const token = jwt.sign({id : user.id}, SECRETKEY, { expiresIn: "1h" });
  

//   return res.status(200).json({ message: "Connexion réussie", email, token: token});
// }


const User = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Email ou mot de passe incorrect" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Email ou mot de passe incorrect" });
  }

  const SECRETKEY = process.env.ACCESS_TOKEN_SECRET;
  const token = jwt.sign({ id: user.id }, SECRETKEY, { expiresIn: "1h" });

  return res.status(200).json({ message: "Connexion réussie", email, token });
};

// Route logout
exports.logout = (req, res) => {
  // Pour JWT stateless, on ne peut pas "supprimer" le token côté serveur
  // On conseille simplement au client de supprimer le token localement
  return res.status(200).json({ message: "Déconnexion réussie, supprimez le token côté client" });
};
