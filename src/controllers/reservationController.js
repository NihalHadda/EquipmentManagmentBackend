const Equipment = require("../models/Equipment");
const Reservation = require("../models/Reservation");

exports.createReservation = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, description, quantity } = req.body;
    const equipment = await Equipment.findById(equipmentId);


  if (!equipment) {
    return res.status(404).json({ message: 'Équipement non trouvé' });
  }


   if (equipment.statut !== "Disponible") {
      return res.status(400).json({
        message: `L'équipement est actuellement "${equipment.statut}". Réservation impossible.`
      });
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
 
   const conflict = await Reservation.findOne({
      equipment: equipmentId,
      $or: [
        {
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) }
        }
      ]
    });


    if (conflict) {
      return res.status(400).json({
        message: "Ce créneau est déjà réservé. Merci de choisir un autre horaire."
      });
    }
  

    const reservation = await Reservation.create({
      equipment: equipmentId,
      user: req.user.id,
      startDate,
      endDate,
      description,
      quantity
    });


    return res.status(201).json({
      message: "Réservation créée avec succès.",
      reservation
    });


 
  } catch (error) {
    console.error("Erreur lors de la création de la réservation :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
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

    if (equipment.statut !== "Disponible") {
      return res.status(400).json({
        message: `Impossible de modifier : l'équipement est "${equipment.statut}".`,
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "La date de fin doit être après la date de début.",
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({ message: "La quantité doit être supérieure à 0." });
      }
      if (quantity > equipment.capacite.valeur) {
        return res.status(400).json({
          message: `La quantité demandée (${quantity}) dépasse la capacité maximale (${equipment.capacite.valeur} ${equipment.capacite.unite}).`
        });
      }
    }

    const conflict = await Reservation.findOne({
      equipment: equipmentId,
      _id: { $ne: reservationId },
      $or: [
        {
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        message: "Ce créneau est déjà réservé par une autre réservation.",
      });
    }
    reservation.equipment = equipmentId;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    if (description !== undefined) reservation.description = description;
    if (quantity !== undefined) reservation.quantity = quantity;

    const saved = await reservation.save();

    return res.json({
      message: "Réservation mise à jour avec succès.",
      reservation: saved,
    });
  } catch (error) {
    console.error("Erreur updateReservation :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
exports.getReservationById= async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.findById(reservationId)
      .populate("equipment");
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }
    return res.json({ reservation });
  } catch (error) {
    console.error("Erreur getReservationById :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}
