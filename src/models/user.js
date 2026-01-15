const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  nom: { type: String, trim: true },
  prenom: { type: String, trim: true },
  email: { type: String, required: true, unique: true , trim : true},
  username: { type: String, required: true, trim : true },
  password: { type: String, required: true , trim : true},
  telephone: { type: String, trim: true },
  statut: { type: String, enum: ["actif", "inactif"], default: "actif" },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  resetPasswordToken: {
      type: String,
      default: undefined
    },
    
    resetPasswordExpires: {
      type: Date,
      default: undefined
    },
}, { timestamps: true });

module.exports = mongoose.model("Users", userSchema);