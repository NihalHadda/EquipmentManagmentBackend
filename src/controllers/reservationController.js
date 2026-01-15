const Equipment = require("../models/Equipment");
const Reservation = require("../models/Reservation");
const mongoose = require("mongoose");
const {
  sendPendingReservationEmail,
  sendApprovedReservationEmail,
  sendRejectedReservationEmail
} = require("../services/emailService");

exports.checkEquipmentAvailability = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "Les dates de début et de fin sont requises" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Si un équipement spécifique est demandé
    if (equipmentId && equipmentId !== 'all') {
      const equipment = await Equipment.findById(equipmentId);
      
      if (!equipment) {
        return res.status(404).json({ message: "Équipement non trouvé" });
      }

      // Vérifier le statut de base
      if (equipment.statut !== 'Disponible' && equipment.statut !== 'Occupé') {
        return res.json({
          available: false,
          reason: `Équipement ${equipment.statut.toLowerCase()}`,
          equipment,
          capacityUsed: 0,
          capacityTotal: equipment.capacite.valeur
        });
      }

      // CORRECTION: Meilleure logique de chevauchement
      // Deux périodes se chevauchent si:
      // La réservation commence avant la fin de la période demandée
      // ET la réservation se termine après le début de la période demandée
      const overlappingReservations = await Reservation.find({
        equipment: equipmentId,
        status: { $in: ['pending', 'approved'] },
        // Condition corrigée pour capturer tous les chevauchements
        startDate: { $lt: end },      // La réservation commence avant la fin demandée
        endDate: { $gt: start }        // La réservation se termine après le début demandé
      }).populate('equipment user');

      console.log('Période demandée:', { start, end });
      console.log('Réservations trouvées:', overlappingReservations.length);
      overlappingReservations.forEach(r => {
        console.log('- Réservation:', {
          id: r._id,
          start: r.startDate,
          end: r.endDate,
          quantity: r.quantity
        });
      });

      // Calculer la capacité utilisée
      const capacityUsed = overlappingReservations.reduce((total, reservation) => {
        return total + (reservation.quantity || 0);
      }, 0);

      const capacityAvailable = equipment.capacite.valeur - capacityUsed;
      const isAvailable = capacityAvailable > 0;

      return res.json({
        available: isAvailable,
        reason: isAvailable 
          ? `${capacityAvailable} ${equipment.capacite.unite} disponible(s)` 
          : "Capacité complètement réservée",
        equipment,
        capacityUsed,
        capacityTotal: equipment.capacite.valeur,
        capacityAvailable,
        overlappingReservations: overlappingReservations.length,
        reservationDetails: overlappingReservations.map(r => ({
          id: r._id,
          startDate: r.startDate,
          endDate: r.endDate,
          quantity: r.quantity,
          status: r.status
        }))
      });
    }

    // Si aucun équipement spécifique, retourner tous les équipements avec leur disponibilité
    const allEquipments = await Equipment.find();
    const availabilityResults = [];

    for (const equipment of allEquipments) {
      // Vérifier le statut de base
      if (equipment.statut !== 'Disponible' && equipment.statut !== 'Occupé') {
        availabilityResults.push({
          equipment,
          available: false,
          reason: `Équipement ${equipment.statut.toLowerCase()}`,
          capacityUsed: 0,
          capacityTotal: equipment.capacite.valeur,
          capacityAvailable: 0
        });
        continue;
      }

      // CORRECTION: Même logique corrigée
      const overlappingReservations = await Reservation.find({
        equipment: equipment._id,
        status: { $in: ['pending', 'approved'] },
        startDate: { $lt: end },
        endDate: { $gt: start }
      });

      const capacityUsed = overlappingReservations.reduce((total, reservation) => {
        return total + (reservation.quantity || 0);
      }, 0);

      const capacityAvailable = equipment.capacite.valeur - capacityUsed;
      const isAvailable = capacityAvailable > 0;

      availabilityResults.push({
        equipment,
        available: isAvailable,
        reason: isAvailable 
          ? `${capacityAvailable} ${equipment.capacite.unite} disponible(s)` 
          : "Capacité complètement réservée",
        capacityUsed,
        capacityTotal: equipment.capacite.valeur,
        capacityAvailable,
        overlappingReservations: overlappingReservations.length
      });
    }

    return res.json({
      results: availabilityResults,
      period: { startDate, endDate }
    });

  } catch (error) {
    console.error("Erreur checkEquipmentAvailability :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};


// =====================================================
// CREATE RESERVATION (USER)
// =====================================================
exports.createReservation = async (req, res) => {
  try {
    console.log("createReservation body:", req.user);
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
      user: req.user._id || req.user.id,
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

    // Set status and record validator + time
    reservation.status = status;
    reservation.validatedBy = req.user ? req.user._id : null;
    reservation.validatedAt = new Date();
    await reservation.save();

    // Populate validatedBy for response and emails
    await reservation.populate('validatedBy', 'username email');

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
  try {
    const { equipmentId, startDate, endDate, createdStart, createdEnd, availableOnly } = req.query;

    console.debug("getAllReservations query:", req.query);
    
    let filter = {};
    
    // Filtre par équipement - validation
    if (equipmentId && equipmentId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
        return res.status(400).json({ message: "equipmentId invalide." });
      }
      filter.equipment = equipmentId;
    }
    
    // Filtre par période - validation (période de réservation)
    let start = null;
    let end = null;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "startDate invalide." });
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: "endDate invalide." });
      }
    }

    if (start && end) {
      // Condition corrigée pour capturer tous les chevauchements
      filter.startDate = { $lt: end };
      filter.endDate = { $gt: start };
    } else if (start) {
      filter.startDate = { $gte: start };
    } else if (end) {
      filter.endDate = { $lte: end };
    }

    // Filtre par date de création de la réservation (createdAt)
    let createdStartDate = null;
    let createdEndDate = null;

    if (createdStart) {
      createdStartDate = new Date(createdStart);
      if (isNaN(createdStartDate.getTime())) {
        return res.status(400).json({ message: "createdStart invalide." });
      }
    }

    if (createdEnd) {
      createdEndDate = new Date(createdEnd);
      if (isNaN(createdEndDate.getTime())) {
        return res.status(400).json({ message: "createdEnd invalide." });
      }
    }

    if (createdStartDate && createdEndDate) {
      // make createdStart at 00:00:00 and createdEnd at 23:59:59.999 for inclusive day filtering
      createdStartDate.setHours(0, 0, 0, 0);
      createdEndDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: createdStartDate, $lte: createdEndDate };
    } else if (createdStartDate) {
      createdStartDate.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: createdStartDate };
    } else if (createdEndDate) {
      createdEndDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $lte: createdEndDate };
    }

    const reservations = await Reservation.find(filter)
      .populate("equipment user validatedBy", "nom username email")
      .sort({ createdAt: -1 });

    // Si filtre de disponibilité activé
    if (availableOnly === 'true' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const filteredReservations = [];
      
      for (const reservation of reservations) {
        const equipment = reservation.equipment;
        
        if (!equipment || (equipment.statut !== 'Disponible' && equipment.statut !== 'Occupé')) {
          continue;
        }

        // CORRECTION: Même logique corrigée
        const overlapping = await Reservation.find({
          equipment: equipment._id,
          _id: { $ne: reservation._id },
          status: { $in: ['pending', 'approved'] },
          startDate: { $lt: end },
          endDate: { $gt: start }
        });

        const capacityUsed = overlapping.reduce((total, r) => {
          return total + (r.quantity || 0);
        }, 0);

        const capacityAvailable = equipment.capacite.valeur - capacityUsed;
        
        if (capacityAvailable > 0) {
          filteredReservations.push(reservation);
        }
      }

      return res.json({ 
        reservations: filteredReservations,
        count: filteredReservations.length,
        filters: { equipmentId, startDate, endDate, availableOnly }
      });
    }
    
    return res.json({ 
      reservations,
      count: reservations.length,
      filters: { equipmentId, startDate, endDate, createdStart, createdEnd }
    });
  } catch (error) {
    console.error("Erreur getAllReservations :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getApprovedReservations = async (req, res) => {
  const reservations = await Reservation.find({ status: "approved" })
    .populate("equipment user validatedBy", "nom username email")
    .sort({ createdAt: -1 });

  res.json({ count: reservations.length, reservations });
};

exports.getRejectedReservations = async (req, res) => {
  const reservations = await Reservation.find({ status: "rejected" })
    .populate("equipment user validatedBy", "nom username email")
    .sort({ createdAt: -1 });

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
