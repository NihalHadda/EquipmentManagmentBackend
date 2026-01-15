// const User = require("../models/user");
// const Role = require("../models/role");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // ---------------------- LOGIN ----------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password)
//       return res.status(400).json({ message: "Email et mot de passe requis" });

//     // Récupérer l'utilisateur + role
//     const user = await User.findOne({ email }).populate("role");
//     if (!user)
//       return res.status(400).json({ message: "Email ou mot de passe incorrect" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match)
//       return res.status(400).json({ message: "Email ou mot de passe incorrect" });

//     const token = jwt.sign(
//       { id: user._id },
//       process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.json({
//       message: "Connexion réussie",
//       token,
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         role: typeof user.role === "string" ? user.role : user.role.name
//       }
//     });

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };


// exports.register = async (req, res) => {
//   try {
//     console.log("📩 REQ BODY:", req.body);

//     const { username, email, password, roleName } = req.body;

//     // ضع هذا اللوق هنا
//     console.log("🔍 Recherche role:", roleName);

//     if (!username || !email || !password)
//       return res.status(400).json({ message: "Champs obligatoires manquants" });

//     const existing = await User.findOne({ email });
//     if (existing)
//       return res.status(400).json({ message: "Email déjà utilisé" });

// const role = await Role.findOne({ name: { $regex: `^${roleName}$`, $options: 'i' } });

//     // هذا اللوق بعد ما تبحث على role
//     console.log("📌 Role trouvé:", role);

//     if (!role)
//       return res.status(400).json({ message: "Role non trouvé" });

//     const hashed = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       username,
//       email,
//       password: hashed,
//       role: role._id
//     });

//     return res.status(201).json({ message: "Utilisateur créé" });

//   } catch (err) {
//     console.error("❌ ERROR REGISTER:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };



// // ---------------------- LOGOUT ----------------------
// exports.logout = async (req, res) => {
//   try {
//     return res.json({ message: "Déconnecté avec succès" });
//   } catch (error) {
//     return res.status(500).json({ message: "Erreur serveur" });
//   }
// };
const User = require("../models/user");
const Role = require("../models/role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Récupérer utilisateur + rôle
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: typeof user.role === "string" ? user.role : user.role.name
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  try {
    console.log("📩 REQ BODY:", JSON.stringify(req.body, null, 2));
    
    const { username, email, password, roleName, nom, prenom, telephone, statut } = req.body;

    // Validation des champs obligatoires
    if (!username) {
      console.log("❌ username manquant");
      return res.status(400).json({ message: "Username est obligatoire" });
    }
    if (!email) {
      console.log("❌ email manquant");
      return res.status(400).json({ message: "Email est obligatoire" });
    }
    if (!password) {
      console.log("❌ password manquant");
      return res.status(400).json({ message: "Password est obligatoire" });
    }
    if (!roleName) {
      console.log("❌ roleName manquant");
      return res.status(400).json({ message: "RoleName est obligatoire" });
    }

    // Vérifier email existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email déjà utilisé:", email);
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Rechercher le rôle
    console.log("🔍 Recherche rôle:", roleName);
    const role = await Role.findOne({
      name: { $regex: `^${roleName}$`, $options: "i" }
    });
    
    console.log("📌 Rôle trouvé:", role);
    if (!role) {
      console.log("❌ Rôle non trouvé. Rôles disponibles:");
      const allRoles = await Role.find();
      console.log(allRoles);
      return res.status(400).json({ message: `Rôle "${roleName}" non trouvé` });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await User.create({
      nom: nom || "",
      prenom: prenom || "",
      username,
      email,
      password: hashedPassword,
      telephone: telephone || "",
      statut: statut || "actif",
      role: role._id
    });

    console.log("✅ Utilisateur créé:", newUser._id);
    return res.status(201).json({ 
      message: "Utilisateur créé avec succès",
      user: newUser
    });

  } catch (error) {
    console.error("❌ ERREUR REGISTER:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ====================== LOGOUT ======================
exports.logout = (req, res) => {
  // JWT est stateless → suppression côté client
  return res.status(200).json({
    message: "Déconnexion réussie, veuillez supprimer le token côté client"
  });
};