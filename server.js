const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  });
}
const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");
const ADMIN_USER = process.env.ADMIN_USER || "Admintux09";
const ADMIN_PASS = process.env.ADMIN_PASS || "tux@#1234";
const activeTokens = new Map();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use((req, res, next) => {
  const forbiddenPatterns = [
    "/config.json",
    "/.env",
    "/server.js",
    "/package.json",
    "/package-lock.json",
    "/.gitignore",
    "/.git",
  ];
  const reqPath = req.path.toLowerCase();
  if (
    forbiddenPatterns.some(
      (p) => reqPath.endsWith(p) || reqPath.includes("/.git"),
    )
  ) {
    return res.status(403).json({ error: "Access forbidden" });
  }
  next();
});
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const rawData = fs.readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error("Error loading config:", err);
  }
  return {
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: "",
      pass: "",
      receiver: "omkumar4138@gmail.com",
    },
    socials: {
      github: "https://github.com/Omkumar32",
      linkedin: "https://www.linkedin.com/in/om-kumar-07441728a/",
      instagram: "https://instagram.com",
      email: "omkumar4138@gmail.com",
    },
    profile: {
      name: "Om Kumar",
      title: "Full Stack Web Developer",
      email: "omkumar4138@gmail.com",
      location: "Ranchi, Jharkhand, India",
      languages: "JS, C, C++, Java (Basic)",
      college: "K.D. Rungta, Raipur",
      ide: "VS Code",
    },
    projects: [],
  };
}
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error saving config:", err);
    return false;
  }
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "").trim() || req.headers["x-auth-token"];
  if (!token || !activeTokens.has(token)) {
    return res
      .status(401)
      .json({
        error: "Unauthorized access. Please log in to perform this action.",
      });
  }
  next();
}
app.post("/api/login", (req, res) => {
  const { id, pass } = req.body;
  if (id === ADMIN_USER && pass === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString("hex");
    activeTokens.set(token, Date.now());
    return res.json({
      success: true,
      token,
      message: "Authenticated successfully",
    });
  }
  res.status(401).json({ error: "Invalid Admin ID or Password" });
});
app.post("/api/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "").trim() || req.headers["x-auth-token"];
  if (token) {
    activeTokens.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});
app.get("/api/config", (req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  const config = loadConfig();
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.smtp) {
    safeConfig.smtp.pass = safeConfig.smtp.pass ? "********" : "";
  }
  res.json(safeConfig);
});
app.post("/api/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const config = loadConfig();
  const { host, port, secure, user, pass, receiver } = config.smtp;
  if (!host || !user || !pass || !receiver) {
    return res.status(400).json({
      error:
        "SMTP server is not fully configured. Please configure it in the admin dashboard.",
    });
  }
  try {
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
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Mail error:", err);
    res
      .status(500)
      .json({ error: "Failed to send email via SMTP", details: err.message });
  }
});
app.post("/api/config", requireAuth, (req, res) => {
  const newConfig = req.body;
  const currentConfig = loadConfig();
  if (!newConfig.smtp || !newConfig.socials) {
    return res.status(400).json({ error: "Invalid configuration structure" });
  }
  if (newConfig.smtp.pass === "********") {
    newConfig.smtp.pass = currentConfig.smtp.pass;
  }
  if (saveConfig(newConfig)) {
    res.json({ success: true, message: "Configuration saved successfully" });
  } else {
    res.status(500).json({ error: "Failed to save configuration" });
  }
});
app.delete("/api/projects/:index", requireAuth, (req, res) => {
  const index = parseInt(req.params.index, 10);
  const config = loadConfig();
  if (isNaN(index) || index < 0 || index >= (config.projects || []).length) {
    return res.status(400).json({ error: "Invalid project index" });
  }
  config.projects.splice(index, 1);
  if (saveConfig(config)) {
    res.json({
      success: true,
      message: "Project deleted successfully",
      projects: config.projects,
    });
  } else {
    res.status(500).json({ error: "Failed to delete project" });
  }
});
app.post("/api/projects", requireAuth, (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.title) {
    return res.status(400).json({ error: "Project title is required" });
  }
  const config = loadConfig();
  if (!config.projects) config.projects = [];
  config.projects.push(newProject);
  if (saveConfig(config)) {
    res.json({
      success: true,
      message: "Project added successfully",
      projects: config.projects,
    });
  } else {
    res.status(500).json({ error: "Failed to add project" });
  }
});
app.post("/api/upload", requireAuth, (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    const ext = path.extname(filename) || ".png";
    const uniqueName = `project_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    res.json({ success: true, imageUrl: `/uploads/${uniqueName}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});
app.post("/api/upload-resume", requireAuth, (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const base64Pdf = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Pdf, "base64");
    const filePath = path.join(__dirname, "resume.pdf");
    fs.writeFileSync(filePath, buffer);
    res.json({ success: true, message: "Resume uploaded successfully!" });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: "Failed to save resume.pdf" });
  }
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "dist")));
const allowedPublicFiles = [
  "index.html",
  "admin.html",
  "admin.js",
  "app.js",
  "style.css",
  "tux-artwork.jpg",
  "tux-artwork.png",
  "tux-logo.png",
  "resume.pdf",
];
allowedPublicFiles.forEach((file) => {
  app.get(`/${file}`, (req, res) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("Not found");
    }
  });
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
module.exports = app;
