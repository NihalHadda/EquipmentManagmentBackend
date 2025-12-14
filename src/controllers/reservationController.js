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
      equipment.statut = "Occupé";
      await equipment.save();
    }

    await reservation.save();

    // 📧 ENVOYER L'EMAIL DE CONFIRMATION
    try {
      const user = req.user;
      const statusMessage = reservation.status === "approved" ? "approuvée ✅" : "refusée ❌";
      const statusColor = reservation.status === "approved" ? "#4CAF50" : "#f44336";
      
      await sendEmail({
        to: user.email,
        subject: `Réservation ${reservation.status === "approved" ? "approuvée" : "refusée"} - ${equipment.nom}`,
        text: `Bonjour ${user.username || 'Utilisateur'},\n\nVotre réservation pour ${equipment.nom} a été ${statusMessage}.\n\nDétails:\n- Date début: ${startDate}\n- Date fin: ${endDate}\n- Quantité: ${quantity}\n- Statut: ${reservation.status}\n\nMerci d'utiliser notre service!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: ${statusColor}; text-align: center;">
              Réservation ${statusMessage}
            </h2>
            <p>Bonjour <strong>${user.username || 'Utilisateur'}</strong>,</p>
            <p>Votre réservation pour <strong>${equipment.nom}</strong> a été <strong style="color: ${statusColor};">${statusMessage}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h3 style="margin-top: 0; color: #333;">📋 Détails de la réservation</h3>
              <table style="width: 100%; line-height: 2;">
                <tr>
                  <td style="padding: 5px 0;"><strong>Équipement:</strong></td>
                  <td style="padding: 5px 0;">${equipment.nom}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Date de début:</strong></td>
                  <td style="padding: 5px 0;">${new Date(startDate).toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Date de fin:</strong></td>
                  <td style="padding: 5px 0;">${new Date(endDate).toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Quantité:</strong></td>
                  <td style="padding: 5px 0;">${quantity} ${equipment.capacite.unite}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Statut:</strong></td>
                  <td style="padding: 5px 0; color: ${statusColor}; font-weight: bold;">${reservation.status.toUpperCase()}</td>
                </tr>
                ${description ? `
                <tr>
                  <td style="padding: 5px 0;"><strong>Description:</strong></td>
                  <td style="padding: 5px 0;">${description}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${reservation.status === "rejected" ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                <strong>⚠️ Raison du refus:</strong>
                <p style="margin: 5px 0 0 0;">
                  ${equipment.statut !== "Disponible" 
                    ? "L'équipement n'est pas disponible actuellement." 
                    : "Il y a un conflit avec une autre réservation pour ces dates."}
                </p>
              </div>
            ` : `
              <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <strong>✅ Réservation confirmée!</strong>
                <p style="margin: 5px 0 0 0;">Vous pouvez récupérer l'équipement à partir du ${new Date(startDate).toLocaleDateString('fr-FR')}.</p>
              </div>
            `}
            
            <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
              Merci d'utiliser notre service de gestion d'équipements! 🎉
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        `
      });
      
      console.log('✅ Email de confirmation envoyé à:', user.email);
      
    } catch (emailError) {
      console.error('⚠️ Erreur lors de l\'envoi de l\'email:', emailError.message);
      // On continue même si l'email échoue, la réservation est déjà créée
    }

    return res.status(201).json({
      message: `Réservation ${reservation.status === "approved" ? "approuvée" : "refusée"} automatiquement.`,
      reservation,
      emailSent: true
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

// ---------------------- PROCESS RESERVATION ----------------------
exports.processReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.findById(reservationId).populate("equipment user");
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    const equipment = reservation.equipment;
    let mailMessage = "";
    let statusColor = "";

    // Vérifier la disponibilité
    if (equipment.statut !== "Disponible") {
      reservation.status = "rejected";
      statusColor = "#f44336";
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
        statusColor = "#f44336";
        mailMessage = `Bonjour ${reservation.user.username}, votre réservation pour ${equipment.nom} a été refusée à cause d'un conflit de créneau.`;
      } else {
        reservation.status = "approved";
        statusColor = "#4CAF50";
        equipment.statut = "Occupé";
        await equipment.save();
        mailMessage = `Bonjour ${reservation.user.username}, votre réservation pour ${equipment.nom} a été approuvée.`;
      }
    }

    await reservation.save();

    // 📧 Envoyer le mail avec HTML
    try {
      await sendEmail({
        to: reservation.user.email,
        subject: `Statut de votre réservation pour ${equipment.nom}`,
        text: mailMessage,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${statusColor};">Statut de votre réservation</h2>
            <p>${mailMessage}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Détails:</strong>
              <ul>
                <li>Équipement: ${equipment.nom}</li>
                <li>Date début: ${new Date(reservation.startDate).toLocaleDateString('fr-FR')}</li>
                <li>Date fin: ${new Date(reservation.endDate).toLocaleDateString('fr-FR')}</li>
                <li>Statut: <span style="color: ${statusColor}; font-weight: bold;">${reservation.status.toUpperCase()}</span></li>
              </ul>
            </div>
          </div>
        `
      });
      console.log('✅ Email envoyé à:', reservation.user.email);
    } catch (emailError) {
      console.error('⚠️ Erreur email:', emailError.message);
    }

    return res.status(200).json({ 
      message: "Réservation traitée et mail envoyé.", 
      reservation 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
/src/controllers/reservationController.js
// Ajoute cette fonction à ton controller

exports.deleteReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;

    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    await Reservation.findByIdAndDelete(reservationId);

    return res.json({
      message: "Réservation supprimée avec succès."
    });

  } catch (error) {
    console.error("Erreur deleteReservation :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};