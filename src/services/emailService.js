transporter = require('../config/emailConfig');

const sendReservationEmail = async (userEmail, reservationDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '✅ Confirmation de réservation - Equipment Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Confirmation de votre réservation</h2>
        <p>Bonjour,</p>
        <p>Votre réservation a été <strong>confirmée avec succès</strong>! 🎉</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📋 Détails de la réservation:</h3>
          <ul style="line-height: 1.8;">
            <li><strong>Équipement:</strong> ${reservationDetails.equipmentName}</li>
            <li><strong>Date de début:</strong> ${reservationDetails.startDate}</li>
            <li><strong>Date de fin:</strong> ${reservationDetails.endDate}</li>
            <li><strong>Statut:</strong> <span style="color: #4CAF50;">${reservationDetails.status}</span></li>
          </ul>
        </div>
        
        <p>Merci d'avoir utilisé notre service!</p>
        <p style="color: #666; font-size: 12px;">
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
      </div>
    `
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
    return { 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message 
    };
  }
};

module.exports = { sendReservationEmail };