const Equipment = require("../models/Equipment");
const Reservation = require("../models/Reservation");
const {
  sendPendingReservationEmail,
  sendApprovedReservationEmail,
  sendRejectedReservationEmail
} = require("../services/emailService");


// =====================================================
// CREATE RESERVATION (USER)
// =====================================================
exports.createReservation = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, description, quantity } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé." });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "La quantité doit être supérieure à 0." });
    }

    if (quantity > equipment.capacite.valeur) {
      return res.status(400).json({
        message: `La quantité demandée dépasse la capacité maximale (${equipment.capacite.valeur} ${equipment.capacite.unite}).`
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    // Vérifier conflits avec réservations approuvées
    const conflict = await Reservation.findOne({
      equipment: equipmentId,
      status: "approved",
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) }
    });

    if (conflict) {
      return res.status(400).json({
        message: "Il existe déjà une réservation approuvée pour ces dates."
      });
    }

    const reservation = await Reservation.create({
      equipment: equipmentId,
      user: req.user.id,
      startDate,
      endDate,
      description,
      quantity,
      status: "pending"
    });

    // Email pending
    try {
      await sendPendingReservationEmail(
        req.user.email,
        req.user.username,
        {
          equipmentName: equipment.nom,
          startDate: new Date(startDate).toLocaleDateString("fr-FR"),
          endDate: new Date(endDate).toLocaleDateString("fr-FR"),
          quantity: `${quantity} ${equipment.capacite.unite}`,
          description: description || ""
        }
      );
    } catch (err) {
      console.error("Email pending error:", err.message);
    }

    res.status(201).json({
      message: "Réservation créée (en attente de validation).",
      reservation
    });

  } catch (error) {
    console.error("createReservation error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// UPDATE RESERVATION (USER)
// =====================================================
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipmentId, startDate, endDate, description, quantity } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    if (reservation.status !== "pending") {
      return res.status(400).json({ message: "Impossible de modifier une réservation traitée." });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Équipement introuvable." });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "Dates invalides." });
    }

    if (quantity <= 0 || quantity > equipment.capacite.valeur) {
      return res.status(400).json({ message: "Quantité invalide." });
    }

    const conflict = await Reservation.findOne({
      equipment: equipmentId,
      _id: { $ne: id },
      status: "approved",
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) }
    });

    if (conflict) {
      return res.status(400).json({ message: "Conflit avec une réservation approuvée." });
    }

    reservation.equipment = equipmentId;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    reservation.description = description;
    reservation.quantity = quantity;

    await reservation.save();

    res.json({ message: "Réservation mise à jour.", reservation });

  } catch (error) {
    console.error("updateReservation error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// GET RESERVATION BY ID
// =====================================================
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("equipment")
      .populate("user", "username email");

    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    res.json({ reservation });

  } catch (error) {
    console.error("getReservationById error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// DELETE RESERVATION
// =====================================================
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    await reservation.deleteOne();
    res.json({ message: "Réservation supprimée." });

  } catch (error) {
    console.error("deleteReservation error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// ADMIN - GET PENDING RESERVATIONS
// =====================================================
exports.getPendingReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ status: "pending" })
      .populate("equipment")
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.json({ count: reservations.length, reservations });

  } catch (error) {
    console.error("getPendingReservations error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// ADMIN - UPDATE STATUS (APPROVE / REJECT)
// =====================================================
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const reservation = await Reservation.findById(id)
      .populate("equipment")
      .populate("user", "username email");

    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    if (reservation.status !== "pending") {
      return res.status(400).json({ message: "Réservation déjà traitée." });
    }

    if (status === "approved") {
      const conflict = await Reservation.findOne({
        equipment: reservation.equipment._id,
        status: "approved",
        startDate: { $lt: reservation.endDate },
        endDate: { $gt: reservation.startDate }
      });

      if (conflict) {
        return res.status(400).json({ message: "Conflit de réservation." });
      }

      reservation.equipment.statut = "Occupé";
      await reservation.equipment.save();
    }

    reservation.status = status;
    await reservation.save();

    try {
      const emailData = {
        equipmentName: reservation.equipment.nom,
        startDate: reservation.startDate.toLocaleDateString("fr-FR"),
        endDate: reservation.endDate.toLocaleDateString("fr-FR"),
        quantity: `${reservation.quantity} ${reservation.equipment.capacite.unite}`
      };

      if (status === "approved") {
        await sendApprovedReservationEmail(
          reservation.user.email,
          reservation.user.username,
          emailData
        );
      } else {
        await sendRejectedReservationEmail(
          reservation.user.email,
          reservation.user.username,
          emailData,
          rejectionReason
        );
      }
    } catch (err) {
      console.error("Email error:", err.message);
    }

    res.json({ message: "Statut mis à jour.", reservation });

  } catch (error) {
    console.error("updateReservationStatus error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// ADMIN - EXTRA ROUTES (NECESSARY)
// =====================================================
exports.getAllReservations = async (req, res) => {
  const reservations = await Reservation.find()
    .populate("equipment")
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  res.json({ count: reservations.length, reservations });
};

exports.getApprovedReservations = async (req, res) => {
  const reservations = await Reservation.find({ status: "approved" })
    .populate("equipment")
    .populate("user", "username email");

  res.json({ count: reservations.length, reservations });
};

exports.getRejectedReservations = async (req, res) => {
  const reservations = await Reservation.find({ status: "rejected" })
    .populate("equipment")
    .populate("user", "username email");

  res.json({ count: reservations.length, reservations });
};

exports.getReservationStats = async (req, res) => {
  res.json({
    total: await Reservation.countDocuments(),
    pending: await Reservation.countDocuments({ status: "pending" }),
    approved: await Reservation.countDocuments({ status: "approved" }),
    rejected: await Reservation.countDocuments({ status: "rejected" })
  });
};
