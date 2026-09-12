const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const {
  ADMIN_USER,
  ADMIN_PASS,
  safeCompare,
  generateAuthToken,
  requireAuth,
} = require("./auth");

const { loadConfig, saveConfig } = require("./configService");
const { sendContactEmail } = require("./emailService");

const router = express.Router();

// --- Security: Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { error: "Message limit reached. Please wait a while before sending another email." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Auth Endpoints ---
router.post("/login", authLimiter, (req, res) => {
  const { id, pass } = req.body || {};
  if (id && pass && safeCompare(id, ADMIN_USER) && safeCompare(pass, ADMIN_PASS)) {
    const token = generateAuthToken(id);
    return res.json({
      success: true,
      token,
      message: "Authenticated successfully",
    });
  }
  res.status(401).json({ error: "Invalid Admin ID or Password" });
});

router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// --- Config Endpoints ---
router.get("/config", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  const config = await loadConfig();
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.smtp) {
    safeConfig.smtp.pass = safeConfig.smtp.pass ? "********" : "";
  }
  res.json(safeConfig);
});

router.post("/config", requireAuth, async (req, res) => {
  const newConfig = req.body;
  const currentConfig = await loadConfig();
  if (!newConfig.smtp || !newConfig.socials) {
    return res.status(400).json({ error: "Invalid configuration structure" });
  }
  if (newConfig.smtp.pass === "********") {
    newConfig.smtp.pass = currentConfig.smtp.pass;
  }
  if (await saveConfig(newConfig)) {
    res.json({ success: true, message: "Configuration saved successfully" });
  } else {
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// --- Email Endpoint ---
router.post("/send-email", emailLimiter, async (req, res) => {
  try {
    await sendContactEmail(req.body || {});
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    const status = err.status || 500;
    if (status === 400) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Mail error:", err);
    res.status(500).json({ error: "Failed to send email via SMTP", details: err.message });
  }
});

// --- Projects Endpoints ---
router.post("/projects", requireAuth, async (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.title) {
    return res.status(400).json({ error: "Project title is required" });
  }
  const config = await loadConfig();
  if (!config.projects) config.projects = [];
  config.projects.push(newProject);
  if (await saveConfig(config)) {
    res.json({
      success: true,
      message: "Project added successfully",
      projects: config.projects,
    });
  } else {
    res.status(500).json({ error: "Failed to add project" });
  }
});

router.delete("/projects/:index", requireAuth, async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const config = await loadConfig();
  if (isNaN(index) || index < 0 || index >= (config.projects || []).length) {
    return res.status(400).json({ error: "Invalid project index" });
  }
  config.projects.splice(index, 1);
  if (await saveConfig(config)) {
    res.json({
      success: true,
      message: "Project deleted successfully",
      projects: config.projects,
    });
  } else {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// --- File Upload Endpoints ---
router.post("/upload", requireAuth, (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (e) {
        return res.json({ success: true, imageUrl: base64Data });
      }
    }
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    const ext = path.extname(filename) || ".png";
    const uniqueName = `project_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    try {
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, imageUrl: `/uploads/${uniqueName}` });
    } catch (writeErr) {
      res.json({ success: true, imageUrl: base64Data });
    }
  } catch (err) {
    res.json({ success: true, imageUrl: base64Data });
  }
});

router.post("/upload-resume", requireAuth, (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const filePath = path.join(__dirname, "..", "resume.pdf");
    const base64Pdf = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Pdf, "base64");
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      try {
        fs.writeFileSync(path.join("/tmp", "resume.pdf"), buffer);
      } catch (tmpE) {}
    }
    res.json({ success: true, message: "Resume uploaded successfully!" });
  } catch (err) {
    res.json({ success: true, message: "Resume updated!" });
  }
});

module.exports = router;
