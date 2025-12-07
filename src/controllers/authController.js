// Importation du modèle User pour interagir avec la collection users dans MongoDB
const User = require('../models/User');

// Importation de bcryptjs pour comparer les mots de passe hashés
const bcrypt = require("bcryptjs");

// Importation de jsonwebtoken pour créer et signer des tokens JWT
const jwt = require("jsonwebtoken");

/**
 * Fonction de connexion (login)
 * Authentifie un utilisateur et génère un token JWT
 */
exports.login = async (req, res) => {
  // Extraction de l'email et du mot de passe depuis le corps de la requête
  const { email, password } = req.body;

  // Vérification si l'email et le mot de passe sont fournis
  if (!email || !password) {
    // Si l'un des deux est manquant, retourner une erreur 400 (Bad Request)
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  // Recherche de l'utilisateur dans la base de données par son email
  // findOne() retourne le premier document correspondant ou null si aucun n'est trouvé
  const user = await User.findOne({ email });
  
  // Si aucun utilisateur n'est trouvé avec cet email
  if (!user) {
    // Retourner une erreur 404 (Not Found) avec un message volontairement vague
    // (pour des raisons de sécurité, on ne précise pas si c'est l'email ou le mot de passe qui est incorrect)
    return res.status(404).json({ message: "Email ou mot de passe incorrect" });
  }

  // Comparaison du mot de passe fourni avec le mot de passe hashé stocké en base
  // bcrypt.compare() déchiffre et compare de manière sécurisée
  const isMatch = await bcrypt.compare(password, user.password);
  
  // Si les mots de passe ne correspondent pas
  if (!isMatch) {
    // Retourner une erreur 400 (Bad Request) avec le même message vague
    return res.status(400).json({ message: "Email ou mot de passe incorrect" });
  }

  // Récupération de la clé secrète depuis les variables d'environnement
  // Cette clé sert à signer le token JWT
  const SECRETKEY = process.env.ACCESS_TOKEN_SECRET;
  
  // Création d'un token JWT contenant l'ID de l'utilisateur
  // jwt.sign() prend 3 paramètres:
  // 1. Payload (données à encoder): { id: user.id }
  // 2. Clé secrète: SECRETKEY
  // 3. Options: { expiresIn: "1h" } - le token expire après 1 heure
  const token = jwt.sign({ id: user.id }, SECRETKEY, { expiresIn: "1h" });

  // Retour d'une réponse 200 (OK) avec un message de succès, l'email et le token
  // Le client devra stocker ce token (localStorage, sessionStorage, cookie)
  // et l'envoyer dans les requêtes futures pour s'authentifier
  return res.status(200).json({ message: "Connexion réussie", email, token });
};

/**
 * Fonction de déconnexion (logout)
 * Note: Avec JWT, la déconnexion est gérée côté client
 */
exports.logout = (req, res) => {
  // Les JWT sont stateless (sans état), donc le serveur ne stocke pas les tokens
  // Il n'y a donc rien à supprimer côté serveur lors de la déconnexion
  
  // On informe simplement le client qu'il doit supprimer le token de son côté
  // (par exemple, en le retirant du localStorage ou sessionStorage)
  return res.status(200).json({ 
    message: "Déconnexion réussie, supprimez le token côté client" 
  });
};