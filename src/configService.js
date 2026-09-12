const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");
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
      PortfolioModel =
        mongoose.models.PortfolioConfig ||
        mongoose.model("PortfolioConfig", PortfolioConfigSchema);
      console.log("☁️ Connected to Cloud MongoDB Atlas successfully");
    })
    .catch((err) => {
      console.warn("⚠️ MongoDB connection notice (using local/fallback store):", err.message);
    });
}

let memoryConfig = null;

const fallbackConfig = {
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
    CONFIG_PATH,
    path.join(process.cwd(), "config.json"),
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

  memoryConfig = fallbackConfig;
  return fallbackConfig;
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

module.exports = {
  loadConfig,
  saveConfig,
};
