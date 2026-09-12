const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const fs = require("fs");
const path = require("path");

// --- Load Environment Variables ---
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

const apiRoutes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- High Performance HTTP Gzip Compression ---
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);

// --- Security Headers with Helmet ---
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// --- API General Rate Limiter ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// --- Path Traversal Guard Middleware ---
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
      (p) => reqPath.endsWith(p) || reqPath.includes("/.git")
    )
  ) {
    return res.status(403).json({ error: "Access forbidden" });
  }
  next();
});

// --- Mount Modular API Router ---
app.use("/api", apiRoutes);

// --- Static Asset Serving & High-Performance Caching ---
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
  "om-portrait.webp",
  "om-portrait.jpg",
  "welcome-portrait.jpg",
  "resume.pdf",
  "robots.txt",
  "sitemap.xml",
];

allowedPublicFiles.forEach((file) => {
  app.get(`/${file}`, (req, res) => {
    let filePath = path.join(__dirname, "public", file);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, file);
    }
    if (fs.existsSync(filePath)) {
      if (
        file.endsWith(".webp") ||
        file.endsWith(".png") ||
        file.endsWith(".jpg") ||
        file.endsWith(".svg") ||
        file.endsWith(".pdf")
      ) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      } else if (file.endsWith(".min.js") || file.endsWith(".css")) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=604800, stale-while-revalidate=86400"
        );
      }
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
