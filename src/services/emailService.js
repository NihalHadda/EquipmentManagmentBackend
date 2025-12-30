const transporter = require('../config/emailConfig');

// ✅ Fonction générique pour envoyer des emails
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès:', info.messageId);
    return { 
      success: true, 
      message: 'Email envoyé avec succès',
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

// ✅ Email pour nouvelle réservation (en attente)
const sendPendingReservationEmail = async (userEmail, userName, reservationDetails) => {
  return await sendEmail({
    to: userEmail,
    subject: `⏳ Réservation en attente - ${reservationDetails.equipmentName}`,
    text: `Bonjour ${userName},\n\nVotre demande de réservation pour ${reservationDetails.equipmentName} a bien été reçue et est en attente de validation.\n\nVous recevrez un email dès qu'elle sera traitée.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #FF9800; text-align: center;">⏳ Réservation en attente</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Votre demande de réservation pour <strong>${reservationDetails.equipmentName}</strong> a bien été reçue.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <h3 style="margin-top: 0; color: #333;">📋 Détails de la demande</h3>
          <table style="width: 100%; line-height: 2;">
            <tr>
              <td><strong>Équipement:</strong></td>
              <td>${reservationDetails.equipmentName}</td>
            </tr>
            <tr>
              <td><strong>Date de début:</strong></td>
              <td>${reservationDetails.startDate}</td>
            </tr>
            <tr>
              <td><strong>Date de fin:</strong></td>
              <td>${reservationDetails.endDate}</td>
            </tr>
            <tr>
              <td><strong>Quantité:</strong></td>
              <td>${reservationDetails.quantity}</td>
            </tr>
            ${reservationDetails.description ? `
            <tr>
              <td><strong>Description:</strong></td>
              <td>${reservationDetails.description}</td>
            </tr>` : ''}
          </table>
        </div>
        
        <p style="color: #FF9800; font-weight: bold;">🔔 Votre réservation est en attente de validation par un administrateur.</p>
        <p style="color: #666;">Vous recevrez un email dès qu'elle sera approuvée ou refusée.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
          Merci d'utiliser notre service! 🎉
        </p>
      </div>
    `
  });
};

// ✅ Email pour réservation approuvée
const sendApprovedReservationEmail = async (userEmail, userName, reservationDetails) => {
  return await sendEmail({
    to: userEmail,
    subject: `✅ Réservation approuvée - ${reservationDetails.equipmentName}`,
    text: `Bonjour ${userName},\n\nBonne nouvelle! Votre réservation pour ${reservationDetails.equipmentName} a été approuvée.\n\nVous pouvez récupérer l'équipement à partir du ${reservationDetails.startDate}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">✅ Réservation approuvée!</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Bonne nouvelle! Votre réservation pour <strong>${reservationDetails.equipmentName}</strong> a été <strong style="color: #4CAF50;">approuvée</strong>! 🎉</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #333;">📋 Détails de la réservation</h3>
          <table style="width: 100%; line-height: 2;">
            <tr>
              <td><strong>Équipement:</strong></td>
              <td>${reservationDetails.equipmentName}</td>
            </tr>
            <tr>
              <td><strong>Date de début:</strong></td>
              <td>${reservationDetails.startDate}</td>
            </tr>
            <tr>
              <td><strong>Date de fin:</strong></td>
              <td>${reservationDetails.endDate}</td>
            </tr>
            <tr>
              <td><strong>Quantité:</strong></td>
              <td>${reservationDetails.quantity}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
          <strong>✅ Réservation confirmée!</strong>
          <p style="margin: 5px 0 0 0;">Vous pouvez récupérer l'équipement à partir du <strong>${reservationDetails.startDate}</strong>.</p>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
          Merci d'utiliser notre service! 🎉
        </p>
      </div>
    `
  });
};

// ✅ Email pour réservation refusée
const sendRejectedReservationEmail = async (userEmail, userName, reservationDetails, rejectionReason) => {
  return await sendEmail({
    to: userEmail,
    subject: `❌ Réservation refusée - ${reservationDetails.equipmentName}`,
    text: `Bonjour ${userName},\n\nVotre réservation pour ${reservationDetails.equipmentName} a été refusée.\n\nRaison: ${rejectionReason || 'Non spécifiée'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #f44336; text-align: center;">❌ Réservation refusée</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Nous sommes désolés, mais votre réservation pour <strong>${reservationDetails.equipmentName}</strong> a été <strong style="color: #f44336;">refusée</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h3 style="margin-top: 0; color: #333;">📋 Détails de la demande</h3>
          <table style="width: 100%; line-height: 2;">
            <tr>
              <td><strong>Équipement:</strong></td>
              <td>${reservationDetails.equipmentName}</td>
            </tr>
            <tr>
              <td><strong>Date de début:</strong></td>
              <td>${reservationDetails.startDate}</td>
            </tr>
            <tr>
              <td><strong>Date de fin:</strong></td>
              <td>${reservationDetails.endDate}</td>
            </tr>
            <tr>
              <td><strong>Quantité:</strong></td>
              <td>${reservationDetails.quantity}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Raison du refus:</strong>
          <p style="margin: 5px 0 0 0;">${rejectionReason || 'Non spécifiée'}</p>
        </div>
        
        <p style="margin-top: 20px; color: #666;">Vous pouvez faire une nouvelle demande avec d'autres dates si nécessaire.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
          Merci de votre compréhension!
        </p>
      </div>
    `
  });
};

module.exports = { 
  sendEmail,
  sendPendingReservationEmail,
  sendApprovedReservationEmail,
  sendRejectedReservationEmail
};