const nodemailer = require("nodemailer");

// Configuration du transporteur SMTP (ex: Gmail)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "tonemail@gmail.com",
    pass: "tonmotdepasse" // ou mot de passe spécifique d'application
  }
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: '"Gestion Équipements" <tonemail@gmail.com>',
      to,
      subject,
      text
    });
    console.log("Email envoyé à", to);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
  }
};

module.exports = sendEmail;
