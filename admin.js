const API_URL = "/api";
let projectsList = [];
let authToken = sessionStorage.getItem("tux_admin_token") || "";
document.addEventListener("DOMContentLoaded", () => {
  if (authToken) {
    showDashboard();
  } else {
    showAuth();
  }
});
function getAuthHeaders(extraHeaders = {}) {
  const headers = {
    ...extraHeaders,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}
function showAuth() {
  document.getElementById("authPanel").style.display = "block";
  document.getElementById("dashboardPanel").classList.remove("show");
}
function showDashboard() {
  document.getElementById("authPanel").style.display = "none";
  document.getElementById("dashboardPanel").classList.add("show");
  loadConfig();
}
async function handleAuth(event) {
  event.preventDefault();
  const id = document.getElementById("adminId").value.trim();
  const pass = document.getElementById("adminPassword").value;
  const err = document.getElementById("authError");
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pass }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      err.style.display = "none";
      authToken = data.token;
      sessionStorage.setItem("tux_admin_token", authToken);
      showDashboard();
      showToast("Authenticated successfully", "shield-check", false);
    } else {
      err.textContent = data.error || "Authentication failed";
      err.style.display = "block";
      document.getElementById("adminPassword").value = "";
      document.getElementById("adminId").focus();
    }
  } catch (e) {
    err.textContent = "Unable to connect to authentication server";
    err.style.display = "block";
  }
}
async function logout() {
  if (authToken) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });
    } catch (e) {}
  }
  authToken = "";
  sessionStorage.removeItem("tux_admin_token");
  showAuth();
  document.getElementById("authForm").reset();
  document.getElementById("authError").style.display = "none";
  showToast("Logged out", "log-out", false);
}
async function loadConfig() {
  try {
    const res = await fetch(`${API_URL}/config?t=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to load config");
    const cfg = await res.json();
    document.getElementById("smtpHost").value = cfg.smtp.host || "";
    document.getElementById("smtpPort").value = cfg.smtp.port || "";
    document.getElementById("smtpSecure").checked = cfg.smtp.secure === true;
    document.getElementById("smtpUser").value = cfg.smtp.user || "";
    document.getElementById("smtpPass").value = cfg.smtp.pass || "";
    document.getElementById("smtpReceiver").value = cfg.smtp.receiver || "";
    document.getElementById("socialGithub").value = cfg.socials.github || "";
    document.getElementById("socialLinkedin").value =
      cfg.socials.linkedin || "";
    document.getElementById("socialInstagram").value =
      cfg.socials.instagram || "";
    document.getElementById("socialEmail").value = cfg.socials.email || "";
    const prof = cfg.profile || {};
    document.getElementById("profName").value = prof.name || "";
    document.getElementById("profTitle").value = prof.title || "";
    document.getElementById("profEmail").value = prof.email || "";
    document.getElementById("profLocation").value = prof.location || "";
    document.getElementById("profLanguages").value = prof.languages || "";
    document.getElementById("profCollege").value = prof.college || "";
    document.getElementById("profIde").value = prof.ide || "";
    projectsList = cfg.projects || [];
    renderProjectsAdmin();
  } catch (err) {
    showToast("Could not load config from server", "x-circle", true);
    console.error(err);
  }
}
function renderProjectsAdmin() {
  const container = document.getElementById("projectsListContainer");
  if (!container) return;
  if (projectsList.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:var(--text-dim); text-align:center; padding: 20px 0;">No projects added yet.</div>`;
    return;
  }
  container.innerHTML = projectsList
    .map(
      (p, idx) => `
    <div class="project-item">
      <div>
        <div class="project-item-title">${p.title}</div>
        <div class="project-item-category">${p.category}</div>
      </div>
      <button type="button" class="btn-delete-proj" onclick="deleteProjectFromList(${idx})">
        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
      </button>
    </div>
  `,
    )
    .join("");
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}
async function deleteProjectFromList(idx) {
  showToast("Deleting project...", "info", false);
  try {
    const res = await fetch(`${API_URL}/projects/${idx}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      projectsList = data.projects || [];
      renderProjectsAdmin();
      showToast("Project deleted successfully!", "check-circle", false);
    } else {
      if (res.status === 401) {
        logout();
      }
      throw new Error(data.error || "Delete failed");
    }
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, "x-circle", true);
    console.error("Delete project error:", err);
  }
}
async function addNewProjectToList() {
  const titleVal = document.getElementById("newProjTitle").value.trim();
  const catVal = document.getElementById("newProjCategory").value.trim();
  const descVal = document.getElementById("newProjDesc").value.trim();
  const techVal = document.getElementById("newProjTech").value.trim();
  const codeVal = document.getElementById("newProjCodeUrl").value.trim();
  const launchVal = document.getElementById("newProjLaunchUrl").value.trim();
  const fileInput = document.getElementById("newProjImageFile");
  if (!titleVal) {
    showToast("Project Title is required", "alert-circle", true);
    return;
  }
  let imageUrl = "";
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    showToast("Uploading image...", "info", false);
    try {
      const base64Data = await fileToBase64(file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ filename: file.name, base64Data }),
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.success) {
        imageUrl = uploadData.imageUrl;
      } else {
        if (uploadRes.status === 401) logout();
        throw new Error(uploadData.error || "Upload failed");
      }
    } catch (err) {
      showToast(`Image upload failed: ${err.message}`, "x-circle", true);
      return;
    }
  }
  const newProj = {
    title: titleVal,
    category: catVal || "WEB DEVELOPMENT",
    description: descVal,
    tech: techVal
      ? techVal
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    codeUrl: codeVal || "#",
    launchUrl: launchVal || "#",
    imageUrl: imageUrl,
  };
  showToast("Adding project...", "info", false);
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(newProj),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      projectsList = data.projects || [];
      renderProjectsAdmin();
      document.getElementById("newProjTitle").value = "";
      document.getElementById("newProjCategory").value = "";
      document.getElementById("newProjDesc").value = "";
      document.getElementById("newProjTech").value = "";
      document.getElementById("newProjCodeUrl").value = "";
      document.getElementById("newProjLaunchUrl").value = "";
      fileInput.value = "";
      const uploadTextEl = document.getElementById("file-upload-text");
      if (uploadTextEl) uploadTextEl.textContent = "Choose file or drag & drop";
      showToast("Project added successfully!", "check-circle", false);
    } else {
      if (res.status === 401) logout();
      throw new Error(data.error || "Add failed");
    }
  } catch (err) {
    showToast(`Failed to add project: ${err.message}`, "x-circle", true);
    console.error("Add project error:", err);
  }
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
function updateFileNameDisplay(input) {
  const textEl = document.getElementById("file-upload-text");
  if (textEl && input.files && input.files[0]) {
    textEl.textContent = `Selected: ${input.files[0].name}`;
  } else if (textEl) {
    textEl.textContent = "Choose file or drag & drop";
  }
}
async function saveConfiguration(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  const config = {
    smtp: {
      host: document.getElementById("smtpHost").value,
      port: parseInt(document.getElementById("smtpPort").value, 10),
      secure: document.getElementById("smtpSecure").checked,
      user: document.getElementById("smtpUser").value,
      pass: document.getElementById("smtpPass").value,
      receiver: document.getElementById("smtpReceiver").value,
    },
    socials: {
      github: document.getElementById("socialGithub").value,
      linkedin: document.getElementById("socialLinkedin").value,
      instagram: document.getElementById("socialInstagram").value,
      email: document.getElementById("socialEmail").value,
    },
    profile: {
      name: document.getElementById("profName").value,
      title: document.getElementById("profTitle").value,
      email: document.getElementById("profEmail").value,
      location: document.getElementById("profLocation").value,
      languages: document.getElementById("profLanguages").value,
      college: document.getElementById("profCollege").value,
      ide: document.getElementById("profIde").value,
    },
    projects: projectsList,
  };
  try {
    const res = await fetch(`${API_URL}/config`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(config),
    });
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }
    if (res.ok && data && data.success) {
      showToast("Configuration saved!", "check-circle", false);
      loadConfig();
    } else {
      if (res.status === 401) logout();
      const errMsg = data
        ? data.error || "Save failed"
        : `Server error (Status ${res.status})`;
      throw new Error(errMsg);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, "x-circle", true);
    console.error(err);
    throw err;
  }
}
function showToast(message, icon, isError) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMsg");
  const ic = document.getElementById("toastIcon");
  msg.textContent = message;
  ic.setAttribute("data-lucide", icon);
  lucide.createIcons();
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}
function updateResumeNameDisplay(input) {
  const textEl = document.getElementById("resume-upload-text");
  if (textEl && input.files && input.files[0]) {
    textEl.textContent = `Selected: ${input.files[0].name}`;
  } else if (textEl) {
    textEl.textContent = "Choose PDF Resume";
  }
}
async function uploadResumeToServer() {
  const fileInput = document.getElementById("resumeFile");
  if (!fileInput.files || !fileInput.files[0]) {
    showToast("Please select a PDF file first", "alert-circle", true);
    return;
  }
  const file = fileInput.files[0];
  showToast("Uploading resume...", "info", false);
  try {
    const base64Data = await fileToBase64(file);
    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ base64Data }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("Resume uploaded successfully!", "check-circle", false);
      fileInput.value = "";
      const textEl = document.getElementById("resume-upload-text");
      if (textEl) textEl.textContent = "Choose PDF Resume";
    } else {
      if (res.status === 401) logout();
      throw new Error(data.error || "Upload failed");
    }
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, "x-circle", true);
    console.error(err);
  }
}
window.deleteProjectFromList = deleteProjectFromList;
window.addNewProjectToList = addNewProjectToList;
window.saveConfiguration = saveConfiguration;
window.handleAuth = handleAuth;
window.logout = logout;
window.updateFileNameDisplay = updateFileNameDisplay;
window.uploadResumeToServer = uploadResumeToServer;
window.updateResumeNameDisplay = updateResumeNameDisplay;
