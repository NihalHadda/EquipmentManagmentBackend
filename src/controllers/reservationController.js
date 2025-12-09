
const Equipment = require("../models/Equipment");
const Reservation = require("../models/Reservation");
const sendEmail = require("../utils/email");

// ---------------------- CREATE RESERVATION ----------------------
exports.createReservation = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, description, quantity } = req.body;
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "La quantité doit être supérieure à 0." });
    }

    if (quantity > equipment.capacite.valeur) {
      return res.status(400).json({
        message: `La quantité demandée (${quantity}) dépasse la capacité maximale (${equipment.capacite.valeur} ${equipment.capacite.unite}).`
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    // Vérifier les conflits
    const conflict = await Reservation.findOne({
      equipment: equipmentId,
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
      ]
    });

    // Créer la réservation avec un statut par défaut "pending"
    const reservation = new Reservation({
      equipment: equipmentId,
      user: req.user.id,
      startDate,
      endDate,
      description,
      quantity,
      status: "pending"
    });

    // Approuver ou refuser automatiquement
    if (equipment.statut !== "Disponible") {
      reservation.status = "rejected";
    } else if (conflict) {
      reservation.status = "rejected";
    } else {
      reservation.status = "approved";
    }
    // Si la réservation est approuvée, mettre l'équipement en "Occupé"
    if (reservation.status === "approved") {
      equipment.statut = "Occupé"; // ou "En cours"
      await equipment.save();
    }


    await reservation.save();

    return res.status(201).json({
      message: `Réservation ${reservation.status === "approved" ? "approuvée" : "refusée"} automatiquement.`,
      reservation
    });

  } catch (error) {
    console.error("Erreur lors de la création de la réservation :", error);
    return res.status(500).json({ 
        message: "Erreur serveur.",
        error: error.message
    });
}

};


// ---------------------- UPDATE RESERVATION ----------------------
exports.updateReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { equipmentId, startDate, endDate, description, quantity } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Équipement introuvable." });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    if (quantity !== undefined) {
      if (quantity <= 0 || quantity > equipment.capacite.valeur) {
        return res.status(400).json({ message: "Quantité invalide." });
      }
      reservation.quantity = quantity;
    }

    // Vérifier les conflits avec les autres réservations
    const conflict = await Reservation.findOne({
      equipment: equipmentId,
      _id: { $ne: reservationId },
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
      ]
    });

    // Mettre à jour les infos
    reservation.equipment = equipmentId;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    if (description !== undefined) reservation.description = description;

    // Mettre à jour le statut automatiquement
    if (equipment.statut !== "Disponible" || conflict) {
      reservation.status = "rejected";
    } else {
      reservation.status = "approved";
    }

    await reservation.save();

    return res.json({
      message: `Réservation ${reservation.status === "approved" ? "approuvée" : "refusée"} après mise à jour.`,
      reservation
    });

  } catch (error) {
    console.error("Erreur updateReservation :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};


// ---------------------- GET RESERVATION BY ID ----------------------
exports.getReservationById = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.findById(reservationId).populate("equipment user");
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }
    return res.json({ reservation });
  } catch (error) {
    console.error("Erreur getReservationById :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Traitement automatique d'une réservation

exports.processReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.findById(reservationId).populate("equipment user");
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    const equipment = reservation.equipment;

    let mailMessage = "";

    // Vérifier la disponibilité
    if (equipment.statut !== "Disponible") {
      reservation.status = "rejected";
      mailMessage = `Bonjour ${reservation.user.username}, votre réservation pour ${equipment.nom} a été refusée car l'équipement est indisponible.`;
    } else {
      const conflict = await Reservation.findOne({
        equipment: equipment._id,
        _id: { $ne: reservationId },
        $or: [
          { startDate: { $lt: reservation.endDate }, endDate: { $gt: reservation.startDate } }
        ]
      });

      if (conflict) {
        reservation.status = "rejected";
        mailMessage = `Bonjour ${reservation.user.username}, votre réservation pour ${equipment.nom} a été refusée à cause d'un conflit de créneau.`;
      } else {
        reservation.status = "approved";
        equipment.statut = "Occupé";
        await equipment.save();
        mailMessage = `Bonjour ${reservation.user.username}, votre réservation pour ${equipment.nom} a été approuvée.`;
      }
    }

    await reservation.save();

    // Envoyer le mail
    await sendEmail({
      to: reservation.user.email,
      subject: `Statut de votre réservation pour ${equipment.nom}`,
      text: mailMessage
    });

    return res.status(200).json({ message: "Réservation traitée et mail envoyé.", reservation });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

