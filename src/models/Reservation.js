const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  quantity: {
  type: Number,
  required: true,
  min: 1
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  description: { type: String },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  // Admin who validated/rejected the reservation
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null
  },
  validatedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);
