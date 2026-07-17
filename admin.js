const API_URL = '/api';

// ─── Credentials ───────────────────────────────────────
const ADMIN_ID   = "Admintux09";
const ADMIN_PASS = "tux@#1234";

// ─── Init ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Always show auth on every page load for security
  showAuth();
});

function showAuth() {
  document.getElementById("authPanel").style.display     = "block";
  document.getElementById("dashboardPanel").classList.remove("show");
}

function showDashboard() {
  document.getElementById("authPanel").style.display = "none";
  document.getElementById("dashboardPanel").classList.add("show");
  loadConfig();
}

// ─── Auth ──────────────────────────────────────────────
function handleAuth(event) {
  event.preventDefault();
  const id   = document.getElementById("adminId").value.trim();
  const pass = document.getElementById("adminPassword").value;
  const err  = document.getElementById("authError");

  if (id === ADMIN_ID && pass === ADMIN_PASS) {
    err.style.display = "none";
    showDashboard();
    showToast("Authenticated successfully", "shield-check", false);
  } else {
    err.style.display = "block";
    document.getElementById("adminPassword").value = "";
    document.getElementById("adminId").focus();
  }
}

function logout() {
  showAuth();
  document.getElementById("authForm").reset();
  document.getElementById("authError").style.display = "none";
  showToast("Logged out", "log-out", false);
}

// ─── Load Config ───────────────────────────────────────
async function loadConfig() {
  try {
    const res = await fetch(`${API_URL}/config`);
    if (!res.ok) throw new Error("Failed to load config");
    const cfg = await res.json();

    // SMTP
    document.getElementById("smtpHost").value     = cfg.smtp.host     || "";
    document.getElementById("smtpPort").value     = cfg.smtp.port     || "";
    document.getElementById("smtpSecure").checked = cfg.smtp.secure   === true;
    document.getElementById("smtpUser").value     = cfg.smtp.user     || "";
    document.getElementById("smtpPass").value     = cfg.smtp.pass     || "";
    document.getElementById("smtpReceiver").value = cfg.smtp.receiver || "";

    // Socials
    document.getElementById("socialGithub").value   = cfg.socials.github    || "";
    document.getElementById("socialLinkedin").value = cfg.socials.linkedin  || "";
    document.getElementById("socialInstagram").value= cfg.socials.instagram || "";
    document.getElementById("socialEmail").value    = cfg.socials.email     || "";
  } catch (err) {
    showToast("Could not load config from server", "x-circle", true);
    console.error(err);
  }
}

// ─── Save Config ───────────────────────────────────────
async function saveConfiguration(event) {
  event.preventDefault();

  const config = {
    smtp: {
      host:     document.getElementById("smtpHost").value,
      port:     parseInt(document.getElementById("smtpPort").value, 10),
      secure:   document.getElementById("smtpSecure").checked,
      user:     document.getElementById("smtpUser").value,
      pass:     document.getElementById("smtpPass").value,
      receiver: document.getElementById("smtpReceiver").value
    },
    socials: {
      github:    document.getElementById("socialGithub").value,
      linkedin:  document.getElementById("socialLinkedin").value,
      instagram: document.getElementById("socialInstagram").value,
      email:     document.getElementById("socialEmail").value
    }
  };

  try {
    const res = await fetch(`${API_URL}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast("Configuration saved!", "check-circle", false);
      loadConfig(); // reload to apply password masking
    } else {
      throw new Error(data.error || "Save failed");
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, "x-circle", true);
    console.error(err);
  }
}

// ─── Toast ─────────────────────────────────────────────
function showToast(message, icon, isError) {
  const toast = document.getElementById("toast");
  const msg   = document.getElementById("toastMsg");
  const ic    = document.getElementById("toastIcon");

  msg.textContent = message;
  ic.setAttribute("data-lucide", icon);
  lucide.createIcons();

  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}
