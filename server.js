const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());

// Load config helper
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const rawData = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error("Error loading config:", err);
  }
  return {
    smtp: { host: "smtp.gmail.com", port: 587, secure: false, user: "", pass: "", receiver: "omkumar4138@email.com" },
    socials: { github: "https://github.com/Omkumar32", linkedin: "https://www.linkedin.com/in/om-kumar-07441728a/", instagram: "https://instagram.com", email: "omkumar4138@email.com" }
  };
}

// Save config helper
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error saving config:", err);
    return false;
  }
}

// 1. GET Config API
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  // Don't expose SMTP password for security
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.smtp) {
    safeConfig.smtp.pass = safeConfig.smtp.pass ? "********" : "";
  }
  res.json(safeConfig);
});

// 2. POST Config API
app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  const currentConfig = loadConfig();

  // Validate request structure
  if (!newConfig.smtp || !newConfig.socials) {
    return res.status(400).json({ error: "Invalid configuration structure" });
  }

  // Preserve password if sent as placeholder mask
  if (newConfig.smtp.pass === "********") {
    newConfig.smtp.pass = currentConfig.smtp.pass;
  }

  if (saveConfig(newConfig)) {
    res.json({ success: true, message: "Configuration saved successfully" });
  } else {
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// 3. POST Send Email API
app.post('/api/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const config = loadConfig();
  const { host, port, secure, user, pass, receiver } = config.smtp;

  if (!host || !user || !pass || !receiver) {
    return res.status(400).json({ 
      error: "SMTP server is not fully configured. Please configure it in the admin dashboard." 
    });
  }

  try {
    // Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: secure === true || secure === "true",
      auth: { user, pass }
    });

    // Email content
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
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Mail error:", err);
    res.status(500).json({ error: "Failed to send email via SMTP", details: err.message });
  }
});

// Serve static files from root and dist directories
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'dist')));

// Serve admin page directly if requested
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
