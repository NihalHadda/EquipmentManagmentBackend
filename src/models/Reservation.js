const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  }
});

module.exports = mongoose.model("Reservation", reservationSchema);
