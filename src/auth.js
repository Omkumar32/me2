const crypto = require("crypto");

const ADMIN_USER = process.env.ADMIN_USER || "Admintux09";
const ADMIN_PASS = process.env.ADMIN_PASS || "tux@#1234";
const AUTH_SECRET = process.env.AUTH_SECRET || ADMIN_PASS || "tux_admin_secret_key_2026";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
      if (data.ts && Date.now() - data.ts < TOKEN_EXPIRY_MS) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "").trim() || req.headers["x-auth-token"];
  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({
      error: "Unauthorized access. Please log in to perform this action.",
    });
  }
  next();
}

module.exports = {
  ADMIN_USER,
  ADMIN_PASS,
  safeCompare,
  generateAuthToken,
  verifyAuthToken,
  requireAuth,
};
