const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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
const AUTH_SECRET = process.env.AUTH_SECRET || ADMIN_PASS || "tux_admin_secret_key_2026";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- Security: Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per 15 minutes per IP
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8, // Max 8 emails per hour per IP
  message: { error: "Message limit reached. Please wait a while before sending another email." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateAuthToken(user) {
  const payload = Buffer.from(JSON.stringify({ user, ts: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  if (!safeCompare(sig, expectedSig)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data && safeCompare(data.user, ADMIN_USER)) {
      // Check token expiration
      if (data.ts && Date.now() - data.ts < TOKEN_EXPIRY_MS) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible CDN embeds (fonts, mixkit audio)
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use("/api/", apiLimiter);
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
// --- Cloud Database Integration (MongoDB Atlas / Managed DB) ---
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || "";
let isMongoConnected = false;

const PortfolioConfigSchema = new mongoose.Schema({
  key: { type: String, default: "main_config", unique: true },
  smtp: Object,
  socials: Object,
  profile: Object,
  projects: Array,
  updatedAt: { type: Date, default: Date.now },
});

let PortfolioModel = null;

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      isMongoConnected = true;
      PortfolioModel = mongoose.models.PortfolioConfig || mongoose.model("PortfolioConfig", PortfolioConfigSchema);
      console.log("☁️ Connected to Cloud MongoDB Atlas successfully");
    })
    .catch((err) => {
      console.warn("⚠️ MongoDB connection notice (using local/fallback store):", err.message);
    });
}

let memoryConfig = null;

async function loadConfig() {
  // 1. Try Cloud Database if connected
  if (isMongoConnected && PortfolioModel) {
    try {
      const doc = await PortfolioModel.findOne({ key: "main_config" });
      if (doc && doc.projects && doc.projects.length > 0) {
        memoryConfig = doc.toObject();
        return memoryConfig;
      }
    } catch (e) {
      console.warn("Cloud DB fetch fallback:", e.message);
    }
  }

  // 2. In-memory cache
  if (memoryConfig && memoryConfig.projects && memoryConfig.projects.length > 0) {
    return memoryConfig;
  }

  // 3. Filesystem discovery
  const possiblePaths = [
    path.join("/tmp", "config.json"),
    path.join(__dirname, "config.json"),
    path.join(process.cwd(), "config.json"),
    path.join(__dirname, "..", "config.json"),
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const rawData = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(rawData);
        if (parsed && parsed.projects) {
          memoryConfig = parsed;
          return parsed;
        }
      }
    } catch (err) {
      // Continue to next path
    }
  }
  const fallback = {
    smtp: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      user: process.env.SMTP_USER || "omkumar4138@gmail.com",
      pass: process.env.SMTP_PASS || "",
      receiver: process.env.SMTP_RECEIVER || "omkumar4138@gmail.com",
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
    projects: [
      {
        title: "Cricket Tournament Manager",
        category: "NEXT.JS // MONGODB",
        description:
          "A full-featured cricket tournament management platform with team registrations, live score updates, and bracket management.",
        tech: ["Next.js", "MongoDB", "Node.js", "Express"],
        codeUrl: "https://github.com/Omkumar32",
        launchUrl: "#",
      },
      {
        title: "School ERP System",
        category: "REACT // NODE.JS",
        description:
          "Comprehensive school management system handling student records, attendance, fee management, and teacher-student communication.",
        tech: ["React", "Node.js", "MongoDB", "Express"],
        codeUrl: "https://github.com/Omkumar32",
        launchUrl: "#",
      },
      {
        title: "PDF Tools Suite",
        category: "NEXT.JS // EXPRESS",
        description:
          "A web-based PDF utility toolkit supporting merging, splitting, compression, and format conversion with a clean drag-and-drop UI.",
        tech: ["Next.js", "Express", "Node.js", "MongoDB"],
        codeUrl: "https://github.com/Omkumar32",
        launchUrl: "#",
      },
    ],
  };
  memoryConfig = fallback;
  return fallback;
}

async function saveConfig(config) {
  memoryConfig = config;

  // 1. Sync to Cloud MongoDB Atlas if connected
  if (isMongoConnected && PortfolioModel) {
    try {
      await PortfolioModel.findOneAndUpdate(
        { key: "main_config" },
        { ...config, key: "main_config", updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn("MongoDB cloud save warning:", e.message);
    }
  }

  // 2. Persist to disk as local mirror
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch (err) {
    try {
      const tmpPath = path.join("/tmp", "config.json");
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), "utf8");
      return true;
    } catch (tmpErr) {
      return true;
    }
  }
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "").trim() || req.headers["x-auth-token"];
  if (!token || !verifyAuthToken(token)) {
    return res
      .status(401)
      .json({
        error: "Unauthorized access. Please log in to perform this action.",
      });
  }
  next();
}
app.post("/api/login", authLimiter, (req, res) => {
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

app.post("/api/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/config", async (req, res) => {
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

app.post("/api/send-email", emailLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  const config = await loadConfig();
  const { host, port, secure, user, pass, receiver } = config.smtp || {};
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

app.post("/api/config", requireAuth, async (req, res) => {
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

app.delete("/api/projects/:index", requireAuth, async (req, res) => {
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

app.post("/api/projects", requireAuth, async (req, res) => {
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
app.post("/api/upload", requireAuth, (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const uploadsDir = path.join(__dirname, "uploads");
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
app.post("/api/upload-resume", requireAuth, (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Missing file data" });
  }
  try {
    const filePath = path.join(__dirname, "resume.pdf");
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "dist")));
const allowedPublicFiles = [
  "index.html",
  "admin.html",
  "admin.js",
  "app.js",
  "style.css",
  "lucide.min.js",
  "gsap.min.js",
  "ScrollTrigger.min.js",
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
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
module.exports = app;
