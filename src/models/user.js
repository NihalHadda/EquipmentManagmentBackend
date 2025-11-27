//src/models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  preferences: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Users", userSchema);