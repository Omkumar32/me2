const nodemailer = require("nodemailer");
const { loadConfig } = require("./configService");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendContactEmail({ name, email, subject, message }) {
  if (!name || !email || !subject || !message) {
    const err = new Error("All fields are required");
    err.status = 400;
    throw err;
  }

  if (!emailRegex.test(email)) {
    const err = new Error("Invalid email format");
    err.status = 400;
    throw err;
  }

  const config = await loadConfig();
  const { host, port, secure, user, pass, receiver } = config.smtp || {};
  if (!host || !user || !pass || !receiver) {
    const err = new Error("SMTP server is not fully configured. Please configure it in the admin dashboard.");
    err.status = 400;
    throw err;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: secure === true || secure === "true",
    auth: { user, pass },
  });

  const mailOptions = {
    from: `"${name}" <${user}>`,
    to: receiver,
    replyTo: email,
    subject: `Portfolio Message: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd; max-width: 600px;">
        <h2 style="color: #2d1b69; border-bottom: 2px solid #c8ff3d; padding-bottom: 8px; margin-top: 0;">New Message from Portfolio</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #2d1b69; text-decoration: none;">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #fff; border-radius: 4px; border-left: 4px solid #c8ff3d; white-space: pre-wrap;">${message}</div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendContactEmail,
};
