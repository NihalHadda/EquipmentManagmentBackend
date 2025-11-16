import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true, select: false },
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

export default mongoose.model("Users", userSchema);