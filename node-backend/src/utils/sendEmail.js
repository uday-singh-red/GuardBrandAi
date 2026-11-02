const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message }) => {
  // Gmail ya SMTP Transporter Configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // e.g. "yourbrand@gmail.com"
      pass: process.env.EMAIL_PASS  // Gmail App Password
    }
  });

  const mailOptions = {
    from: `"GuardBrand AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: message
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;