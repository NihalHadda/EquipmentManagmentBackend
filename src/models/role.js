const mongoose = require("mongoose");

const AVAILABLE_PERMISSIONS = [
  "manage_users",
  "manage_roles",
  "manage_reservations",
  "view_dashboard",
  "manage_system",
  "view_own_reservations",
  "edit_own_profile"
];

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: {
    type: [String],
    //lezm takhatar ken l f liste
    enum: AVAILABLE_PERMISSIONS,
    default: []
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Role", roleSchema);
module.exports.AVAILABLE_PERMISSIONS = AVAILABLE_PERMISSIONS;
