const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true , trim : true},
  username: { type: String, required: true, trim : true },
  password: { type: String, required: true , trim : true},
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  resetPasswordToken: {
      type: String,
      default: undefined
    },
    
    resetPasswordExpires: {
      type: Date,
      default: undefined
    },
});

module.exports = mongoose.model("Users", userSchema);
