const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true , trim : true},
  firstname: { type: String, required: true, trim : true },
  lastname: { type: String, required: true , trim : true},
  password: { type: String, required: true , trim : true},
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },});

module.exports = mongoose.model("Users", userSchema);
