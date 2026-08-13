document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});
window.addEventListener("load", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const state = {
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    isMobile: window.innerWidth <= 768,
  };
  window.addEventListener("resize", () => {
    state.windowSize.width = window.innerWidth;
    state.windowSize.height = window.innerHeight;
    state.isMobile = window.innerWidth <= 768;
    resizeCanvas(particlesCanvas, particlesCtx);
    resizeCanvas(circuitsCanvas, circuitsCtx);
  });
  const cursorGlow = document.getElementById("cursorGlow");
  let cursorX = 0,
    cursorY = 0;
  document.addEventListener("mousemove", (e) => {
    state.mouse.targetX = e.clientX;
    state.mouse.targetY = e.clientY;
  });
  function updateCursor() {
    cursorX += (state.mouse.targetX - cursorX) * 0.1;
    cursorY += (state.mouse.targetY - cursorY) * 0.1;
    if (cursorGlow) {
      cursorGlow.style.left = `${cursorX}px`;
      cursorGlow.style.top = `${cursorY}px`;
    }
    requestAnimationFrame(updateCursor);
  }
  updateCursor();
  const interactives = document.querySelectorAll(
    "a, button, .btn, .glass-panel, .calendar-day",
  );
  interactives.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (cursorGlow) {
        cursorGlow.style.width = "800px";
        cursorGlow.style.height = "800px";
        cursorGlow.style.background =
          "radial-gradient(circle, rgba(200, 255, 61, 0.08) 0%, rgba(45, 27, 105, 0.05) 50%, rgba(0,0,0,0) 70%)";
      }
    });
    el.addEventListener("mouseleave", () => {
      if (cursorGlow) {
        cursorGlow.style.width = "600px";
        cursorGlow.style.height = "600px";
        cursorGlow.style.background =
          "radial-gradient(circle, rgba(200, 255, 61, 0.05) 0%, rgba(45, 27, 105, 0.03) 50%, rgba(0,0,0,0) 70%)";
      }
    });
  });
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const sidebarIndicator = document.getElementById("sidebarIndicator");
  const sections = document.querySelectorAll("header, section");
  window.addEventListener("scroll", highlightNav);
  function highlightNav() {
    let scrollPos = window.scrollY + 120;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute("id");
      if (scrollPos >= top && scrollPos < top + height) {
        sidebarLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("data-sec") === id) {
            link.classList.add("active");
            positionSidebarIndicator(link);
          }
        });
        mobileNavItems.forEach((item) => {
          item.classList.remove("active");
          if (item.getAttribute("data-sec") === id) {
            item.classList.add("active");
          }
        });
      }
    });
  }
  function positionSidebarIndicator(activeLink) {
    if (!sidebarIndicator) return;
    const parentRect = activeLink.parentElement.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    sidebarIndicator.style.height = `${linkRect.height}px`;
    sidebarIndicator.style.top = `${linkRect.top - parentRect.top}px`;
  }
  setTimeout(() => {
    const activeLink = document.querySelector(".sidebar-link.active");
    if (activeLink) positionSidebarIndicator(activeLink);
  }, 500);
  const menuHamburger = document.getElementById("menuHamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuLinks = document.querySelectorAll(".mobile-link");
  if (menuHamburger && mobileMenu) {
    menuHamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      menuHamburger.classList.toggle("active");
    });
    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        menuHamburger.classList.remove("active");
      });
    });
  }
  const soundControl = document.getElementById("soundControl");
  const ambientAudio = document.getElementById("ambientAudio");
  let audioPlaying = false;
  if (soundControl && ambientAudio) {
    ambientAudio.volume = 0.15;
    soundControl.addEventListener("click", () => {
      audioPlaying = !audioPlaying;
      if (audioPlaying) {
        ambientAudio
          .play()
          .catch((err) => console.log("Audio play blocked by browser policy"));
        soundControl.querySelector(".sound-btn").classList.add("playing");
      } else {
        ambientAudio.pause();
        soundControl.querySelector(".sound-btn").classList.remove("playing");
      }
    });
  }
  const particlesCanvas = document.getElementById("particlesCanvas");
  const particlesCtx = particlesCanvas.getContext("2d");
  let particlesArray = [];
  function resizeCanvas(canvas, ctx) {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  resizeCanvas(particlesCanvas, particlesCtx);
  class Particle {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.reset();
    }
    reset() {
      this.x = Math.random() * this.w;
      this.y = this.h + Math.random() * 100;
      this.size = Math.random() * 2 + 0.5;
      this.speedY = -(Math.random() * 0.8 + 0.2);
      this.speedX = Math.random() * 0.4 - 0.2;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.fadeSpeed = Math.random() * 0.003 + 0.001;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      const dx =
        state.mouse.targetX -
        (particlesCanvas.getBoundingClientRect().left + this.x);
      const dy =
        state.mouse.targetY -
        (particlesCanvas.getBoundingClientRect().top + this.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x -= (dx / dist) * force * 2;
        this.y -= (dy / dist) * force * 2;
      }
      if (this.y < 0 || this.x < 0 || this.x > this.w) {
        this.reset();
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 255, 61, ${this.alpha})`;
      ctx.shadowColor = "#c8ff3d";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  }
  function initParticles() {
    particlesArray = [];
    const count = state.isMobile ? 30 : 80;
    for (let i = 0; i < count; i++) {
      particlesArray.push(
        new Particle(particlesCanvas.width, particlesCanvas.height),
      );
    }
  }
  initParticles();
  function animateParticles() {
    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    particlesArray.forEach((p) => {
      p.update();
      p.draw(particlesCtx);
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
  const circuitsCanvas = document.getElementById("circuitsCanvas");
  const circuitsCtx = circuitsCanvas.getContext("2d");
  let circuitsArray = [];
  resizeCanvas(circuitsCanvas, circuitsCtx);
  class CircuitPath {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.reset();
    }
    reset() {
      this.x = Math.random() * this.w;
      this.y = Math.random() * this.h;
      this.points = [{ x: this.x, y: this.y }];
      this.segments = Math.floor(Math.random() * 3) + 2;
      this.currentSegment = 0;
      this.progress = 0;
      this.speed = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.width = Math.random() * 1 + 0.5;
      for (let i = 0; i < this.segments; i++) {
        const prev = this.points[i];
        const angle = [0, 45, 90, 135, 180, 225, 270, 315][
          Math.floor(Math.random() * 8)
        ];
        const length = Math.random() * 80 + 40;
        const rad = (angle * Math.PI) / 180;
        const nextX = prev.x + Math.cos(rad) * length;
        const nextY = prev.y + Math.sin(rad) * length;
        this.points.push({
          x: Math.max(10, Math.min(this.w - 10, nextX)),
          y: Math.max(10, Math.min(this.h - 10, nextY)),
        });
      }
      this.maxTime = 200;
      this.age = 0;
    }
    update() {
      this.age++;
      if (this.currentSegment < this.segments) {
        this.progress += this.speed;
        const start = this.points[this.currentSegment];
        const end = this.points[this.currentSegment + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (this.progress >= dist) {
          this.currentSegment++;
          this.progress = 0;
        }
      }
      if (this.age > this.maxTime) {
        this.reset();
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(200, 255, 61, ${this.alpha})`;
      ctx.lineWidth = this.width;
      ctx.shadowColor = "#c8ff3d";
      ctx.shadowBlur = 4;
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 0; i < this.currentSegment; i++) {
        ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
      }
      if (this.currentSegment < this.segments) {
        const start = this.points[this.currentSegment];
        const end = this.points[this.currentSegment + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = this.progress / dist;
        ctx.lineTo(start.x + dx * ratio, start.y + dy * ratio);
      }
      ctx.stroke();
      ctx.fillStyle = "#c8ff3d";
      ctx.shadowBlur = 8;
      for (let i = 0; i <= this.currentSegment; i++) {
        if (i < this.points.length) {
          ctx.beginPath();
          ctx.arc(this.points[i].x, this.points[i].y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  function initCircuits() {
    circuitsArray = [];
    const count = state.isMobile ? 4 : 10;
    for (let i = 0; i < count; i++) {
      circuitsArray.push(
        new CircuitPath(circuitsCanvas.width, circuitsCanvas.height),
      );
    }
  }
  initCircuits();
  function animateCircuits() {
    circuitsCtx.clearRect(0, 0, circuitsCanvas.width, circuitsCanvas.height);
    circuitsArray.forEach((c) => {
      c.update();
      c.draw(circuitsCtx);
    });
    requestAnimationFrame(animateCircuits);
  }
  animateCircuits();
  const heroBgImage = document.getElementById("heroBgImage");
  const floatingElements = document.querySelectorAll(".floating-element");
  let bgX = 0,
    bgY = 0;
  function applyParallax() {
    const halfWidth = state.windowSize.width / 2;
    const halfHeight = state.windowSize.height / 2;
    const normX = (state.mouse.targetX - halfWidth) / halfWidth;
    const normY = (state.mouse.targetY - halfHeight) / halfHeight;
    bgX += (normX * -20 - bgX) * 0.05;
    bgY += (normY * -20 - bgY) * 0.05;
    if (heroBgImage) {
      const time = Date.now() * 0.0001;
      const zoom = 1.05 + Math.sin(time) * 0.03;
      if (!state.isMobile) {
        heroBgImage.style.transform = `translate(${bgX}px, ${bgY}px) scale(${zoom})`;
      } else {
        heroBgImage.style.transform = `scale(${zoom})`;
      }
    }
    floatingElements.forEach((el) => {
      if (state.isMobile) {
        el.style.transform = "none";
        return;
      }
      const speed = parseFloat(el.getAttribute("data-speed")) || 1.0;
      const px = normX * -20 * speed;
      const py = normY * -20 * speed;
      el.style.transform = `translate(${px}px, ${py}px)`;
    });
    requestAnimationFrame(applyParallax);
  }
  applyParallax();
  const tiltElements = document.querySelectorAll(".tilt-element");
  tiltElements.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      const rotateX = -10 * ((y - height / 2) / (height / 2));
      const rotateY = 10 * ((x - width / 2) / (width / 2));
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      const pctX = (x / width) * 100;
      const pctY = (y / height) * 100;
      card.style.setProperty("--mouse-x", `${pctX}%`);
      card.style.setProperty("--mouse-y", `${pctY}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
  const magneticButtons = document.querySelectorAll(".btn-magnetic");
  magneticButtons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
      const span = btn.querySelector("span");
      if (span) {
        span.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      }
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0px, 0px)";
      const span = btn.querySelector("span");
      if (span) {
        span.style.transform = "translate(0px, 0px)";
      }
    });
  });
  const tabButtons = document.querySelectorAll(".tab-btn");
  const skillPanes = document.querySelectorAll(".skills-pane");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      skillPanes.forEach((pane) => {
        pane.classList.remove("active");
        if (pane.getAttribute("id") === targetTab) {
          setTimeout(() => {
            pane.classList.add("active");
          }, 50);
        }
      });
    });
  });
  const githubGrid = document.getElementById("githubGrid");
  if (githubGrid) {
    const totalCells = state.isMobile ? 119 : 371;
    githubGrid.innerHTML = "";
    for (let i = 0; i < totalCells; i++) {
      const day = document.createElement("div");
      day.classList.add("calendar-day");
      const randVal = Math.random();
      let lvl = 0;
      if (randVal > 0.88) lvl = 4;
      else if (randVal > 0.75) lvl = 3;
      else if (randVal > 0.5) lvl = 2;
      else if (randVal > 0.25) lvl = 1;
      day.classList.add(`lvl-${lvl}`);
      let commits = 0;
      if (lvl === 1) commits = Math.floor(Math.random() * 2) + 1;
      else if (lvl === 2) commits = Math.floor(Math.random() * 3) + 3;
      else if (lvl === 3) commits = Math.floor(Math.random() * 4) + 6;
      else if (lvl === 4) commits = Math.floor(Math.random() * 8) + 10;
      const dateText = new Date();
      dateText.setDate(dateText.getDate() - (totalCells - i));
      const formattedDate = dateText.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      day.setAttribute(
        "title",
        `${commits === 0 ? "No" : commits} contributions on ${formattedDate}`,
      );
      githubGrid.appendChild(day);
    }
  }
  const timelineProgress = document.getElementById("timelineProgress");
  const timelineItems = document.querySelectorAll(".timeline-item");
  const timelineSection = document.getElementById("experience");
  window.addEventListener("scroll", () => {
    if (!timelineProgress || !timelineSection) return;
    const rect = timelineSection.getBoundingClientRect();
    const sectionHeight = timelineSection.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollInSec = windowHeight / 2 - rect.top;
    let pct = (scrollInSec / (sectionHeight - 200)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    timelineProgress.style.height = `${pct}%`;
    timelineItems.forEach((item) => {
      const itemTop = item.getBoundingClientRect().top;
      if (itemTop < windowHeight / 2 + 100) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  });
  if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline();
    tl.to(".init-fade", {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.15,
      ease: "power3.out",
    });
    tl.to(
      ".navbar",
      {
        top: "24px",
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.8",
    );
    tl.to(
      ".floating-element",
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: "back.out(1.2)",
      },
      "-=0.6",
    );
    const reveals = document.querySelectorAll(".scroll-reveal");
    reveals.forEach((el) => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    });
    const counters = document.querySelectorAll(".counter-number");
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute("data-target"), 10);
      gsap.to(counter, {
        scrollTrigger: {
          trigger: counter,
          start: "top 90%",
        },
        innerText: target,
        duration: 2.0,
        snap: { innerText: 1 },
        ease: "power2.out",
      });
    });
  } else {
    document
      .querySelectorAll(".init-fade, .floating-element, .scroll-reveal")
      .forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    const counters = document.querySelectorAll(".counter-number");
    counters.forEach((counter) => {
      counter.innerText = counter.getAttribute("data-target");
    });
  }
  let lastScrollY = window.scrollY;
  const topConnectHeader = document.querySelector(".top-connect-header");
  window.addEventListener("scroll", () => {
    if (!topConnectHeader) return;
    const currentScrollY = window.scrollY;
    if (window.innerWidth <= 768) {
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        topConnectHeader.classList.add("scroll-hide");
      } else {
        topConnectHeader.classList.remove("scroll-hide");
      }
    } else {
      topConnectHeader.classList.remove("scroll-hide");
    }
    lastScrollY = currentScrollY;
  });
  async function loadConfigSocials() {
    try {
      const res = await fetch(`/api/config?t=${Date.now()}`);
      if (!res.ok) throw new Error("Config load failed");
      const config = await res.json();
      const { github, linkedin, instagram, email } = config.socials;
      const topGH = document.querySelector(
        ".top-connect-header a[aria-label='GitHub']",
      );
      if (topGH) topGH.href = github;
      const topLI = document.querySelector(
        ".top-connect-header a[aria-label='LinkedIn']",
      );
      if (topLI) topLI.href = linkedin;
      const topIG = document.querySelector(
        ".top-connect-header a[aria-label='Instagram']",
      );
      if (topIG) topIG.href = instagram;
      const topMail = document.querySelector(
        ".top-connect-header a[aria-label='Email']",
      );
      if (topMail) topMail.href = `mailto:${email}`;
      const contactMail = document.querySelector(
        ".contact-methods a[href^='mailto:']",
      );
      if (contactMail) {
        contactMail.href = `mailto:${email}`;
        contactMail.textContent = email;
      }
      const contactLI = document.querySelector(
        ".contact-methods a[href*='linkedin.com']",
      );
      if (contactLI) {
        contactLI.href = linkedin;
        try {
          const username = linkedin.replace(/\/$/, "").split("/").pop();
          contactLI.textContent = username;
        } catch (e) {
          contactLI.textContent = "LinkedIn Profile";
        }
      }
      const footerGH = document.querySelector(
        ".footer-socials a[aria-label='GitHub']",
      );
      if (footerGH) footerGH.href = github;
      const footerLI = document.querySelector(
        ".footer-socials a[aria-label='LinkedIn']",
      );
      if (footerLI) footerLI.href = linkedin;
      const footerIG = document.querySelector(
        ".footer-socials a[aria-label='Instagram']",
      );
      if (footerIG) footerIG.href = instagram;
      const footerMail = document.querySelector(
        ".footer-socials a[aria-label='Email']",
      );
      if (footerMail) footerMail.href = `mailto:${email}`;
      if (config.profile) {
        const {
          name,
          title,
          email: profEmail,
          location,
          languages,
          college,
          ide,
        } = config.profile;
        const profNameEl = document.querySelector(".profile-name");
        if (profNameEl) profNameEl.textContent = name;
        const profTitleEl = document.querySelector(".profile-title");
        if (profTitleEl) profTitleEl.textContent = title;
        const detailItems = document.querySelectorAll(".profile-details li");
        detailItems.forEach((li) => {
          const lbl = li.querySelector(".lbl");
          const val = li.querySelector(".val");
          if (lbl && val) {
            const labelText = lbl.textContent.trim().toUpperCase();
            if (labelText === "EMAIL:") {
              val.textContent = profEmail;
            } else if (labelText === "LOC:") {
              val.textContent = location;
            } else if (labelText === "LANGUAGE:") {
              val.textContent = languages;
            } else if (labelText === "COLLEGE:") {
              val.textContent = college;
            } else if (labelText === "IDE:") {
              val.textContent = ide;
            }
          }
        });
      }
      const projects = config.projects || [];
      const featuredRow = document.querySelector(".featured-projects-row");
      if (featuredRow && projects.length > 0) {
        featuredRow.innerHTML = projects
          .map((p) => {
            let iconName = "folder-git-2";
            let iconClass = "generic";
            const titleLower = p.title.toLowerCase();
            if (titleLower.includes("cricket")) {
              iconName = "target";
              iconClass = "cricket";
            } else if (
              titleLower.includes("school") ||
              titleLower.includes("erp")
            ) {
              iconName = "graduation-cap";
              iconClass = "school";
            } else if (titleLower.includes("pdf")) {
              iconName = "file-text";
              iconClass = "pdf";
            } else if (
              titleLower.includes("medication") ||
              titleLower.includes("tracker") ||
              titleLower.includes("health")
            ) {
              iconName = "pill";
              iconClass = "med";
            }
            const tagsHtml = (p.tech || [])
              .slice(0, 2)
              .map((tag) => `<span>${tag}</span>`)
              .join("");
            return `
            <div class="mini-project-card glass-panel tilt-element">
              <div class="mini-card-glow"></div>
              <div class="mini-card-icon ${iconClass}">
                <i data-lucide="${iconName}"></i>
              </div>
              <div class="mini-card-info">
                <h4 class="mini-card-title">${p.title}</h4>
                <div class="mini-card-tags">
                  ${tagsHtml}
                </div>
              </div>
            </div>
          `;
          })
          .join("");
      }
      const projectsGrid = document.querySelector(".projects-grid");
      if (projectsGrid && projects.length > 0) {
        projectsGrid.innerHTML = projects
          .map((p, idx) => {
            const category = p.category || "WEB DEVELOPMENT";
            const techHtml = (p.tech || [])
              .map((tag) => `<span>${tag}</span>`)
              .join("");
            const imageHtml = p.imageUrl
              ? `<img src="${p.imageUrl}" alt="${p.title}" class="project-image">`
              : `
                <div class="project-visual-sim p-sim-${(idx % 3) + 1}">
                  <div class="grid-overlay"></div>
                  <div class="animated-nodes"></div>
                </div>
              `;
            return `
            <div class="project-card glass-panel tilt-element scroll-reveal" style="opacity: 1; transform: none;">
              <div class="project-glow"></div>
              <div class="project-image-wrap">
                ${imageHtml}
                <div class="project-category font-mono">${category}</div>
              </div>
              <div class="project-info">
                <h3 class="project-card-title">${p.title}</h3>
                <p class="project-card-desc">${p.description || ""}</p>
                <div class="project-tech font-mono">
                  ${techHtml}
                </div>
                <div class="project-actions">
                  <a href="${p.codeUrl || "#"}" target="_blank" rel="noopener" class="btn btn-icon-link" aria-label="Github Repo">
                    <i data-lucide="github"></i><span>CODE</span>
                  </a>
                  <a href="${p.launchUrl || "#"}" target="_blank" rel="noopener" class="btn btn-project-cta" aria-label="Live Site">
                    <span>LAUNCH SITE</span><i data-lucide="arrow-up-right"></i>
                  </a>
                </div>
              </div>
            </div>
          `;
          })
          .join("");
      }
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
      const newTilts = document.querySelectorAll(".tilt-element");
      newTilts.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const width = rect.width;
          const height = rect.height;
          const rotateX = -10 * ((y - height / 2) / (height / 2));
          const rotateY = 10 * ((x - width / 2) / (width / 2));
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          const pctX = (x / width) * 100;
          const pctY = (y / height) * 100;
          card.style.setProperty("--mouse-x", `${pctX}%`);
          card.style.setProperty("--mouse-y", `${pctY}%`);
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform =
            "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        });
      });
      const newInteractives = document.querySelectorAll(
        ".mini-project-card, .project-card, .btn",
      );
      const cursorGlowEl = document.getElementById("cursorGlow");
      newInteractives.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          if (cursorGlowEl) {
            cursorGlowEl.style.width = "800px";
            cursorGlowEl.style.height = "800px";
            cursorGlowEl.style.background =
              "radial-gradient(circle, rgba(200, 255, 61, 0.08) 0%, rgba(45, 27, 105, 0.05) 50%, rgba(0,0,0,0) 70%)";
          }
        });
        el.addEventListener("mouseleave", () => {
          if (cursorGlowEl) {
            cursorGlowEl.style.width = "600px";
            cursorGlowEl.style.height = "600px";
            cursorGlowEl.style.background =
              "radial-gradient(circle, rgba(200, 255, 61, 0.05) 0%, rgba(45, 27, 105, 0.03) 50%, rgba(0,0,0,0) 70%)";
          }
        });
      });
    } catch (err) {
      console.warn(
        "Could not load dynamic configuration, using static fallback values:",
        err,
      );
    }
  }
  loadConfigSocials();
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector("button[type='submit']");
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span><i class="animate-spin" data-lucide="loader"></i>`;
      if (window.lucide) window.lucide.createIcons();
      const name = document.getElementById("formName").value;
      const email = document.getElementById("formEmail").value;
      const subject = document.getElementById("formSubject").value;
      const message = document.getElementById("formMessage").value;
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, subject, message }),
        });
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        }
        if (res.ok && data && data.success) {
          alert("Transmission sent successfully via SMTP!");
          contactForm.reset();
        } else {
          const errMsg = data
            ? data.error || data.details
            : `Server error (Status ${res.status})`;
          throw new Error(errMsg);
        }
      } catch (err) {
        console.error(err);
        alert(`Failed to send message: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  function navigateTo(path) {
    window.history.pushState(null, "", path);
    handleRouting();
  }
  function handleRouting() {
    const path = window.location.pathname;
    let sectionId = "home";
    if (path === "/" || path === "/home") {
      sectionId = "home";
    } else {
      sectionId = path.substring(1);
    }
    if (sectionId === "github") {
      sectionId = "github-stats";
    }
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  }
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.href) {
      const url = new URL(link.href);
      if (url.origin === window.location.origin) {
        const path = url.pathname;
        if (
          path === "/admin" ||
          path.startsWith("/api") ||
          path.endsWith(".pdf") ||
          path.startsWith("/uploads")
        ) {
          return;
        }
        const sectionsList = [
          "/about",
          "/skills",
          "/projects",
          "/experience",
          "/github",
          "/contact",
          "/home",
          "/github-stats",
        ];
        if (sectionsList.includes(path) || path === "/") {
          e.preventDefault();
          navigateTo(path);
        }
      }
    }
  });
  window.addEventListener("popstate", handleRouting);
  setTimeout(handleRouting, 600);
  const floatContainer = document.getElementById("floatingTechContainer");
  if (floatContainer) {
    const techBubblesData = [
      {
        name: "JavaScript",
        class: "js-bubble",
        svg: `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="#f7df1e" rx="4" /><text x="78" y="76" font-family="'Inter', sans-serif" font-weight="900" font-size="36" fill="#000000" text-anchor="end">JS</text></svg>`,
      },
      {
        name: "React",
        class: "react-bubble",
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="8" fill="#00d8ff" /><ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#00d8ff" stroke-width="3" transform="rotate(0 50 50)" /><ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#00d8ff" stroke-width="3" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#00d8ff" stroke-width="3" transform="rotate(120 50 50)" /></svg>`,
      },
      {
        name: "Next.js",
        class: "next-bubble",
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="black" stroke="#ffffff" stroke-width="1" /><path d="M35 30 L65 70 M65 30 L65 70" stroke="#ffffff" stroke-width="5" stroke-linecap="round" /><path d="M35 30 L35 70" stroke="#ffffff" stroke-width="5" stroke-linecap="round" /></svg>`,
      },
      {
        name: "TypeScript",
        class: "ts-bubble",
        svg: `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="6" fill="#3178c6" /><text x="80" y="78" font-family="'Inter', sans-serif" font-weight="bold" font-size="34" fill="#ffffff" text-anchor="end">TS</text></svg>`,
      },
      {
        name: "Node.js",
        class: "node-bubble",
        svg: `<svg viewBox="0 0 100 100"><path d="M50 15 L80 32 L80 68 L50 85 L20 68 L20 32 Z" fill="none" stroke="#68a063" stroke-width="4" /><text x="50" y="58" font-family="'Inter', sans-serif" font-weight="bold" font-size="28" fill="#68a063" text-anchor="middle">JS</text></svg>`,
      },
      {
        name: "Express.js",
        class: "express-bubble",
        svg: `<span class="tech-text-logo">ex</span>`,
      },
      {
        name: "MongoDB",
        class: "mongodb-bubble",
        svg: `<svg viewBox="0 0 100 100"><path d="M50 10 C50 10 30 35 30 55 C30 70 40 85 50 90 C60 85 70 70 70 55 C70 35 50 10 50 10 Z" fill="none" stroke="#47a248" stroke-width="4" /><path d="M50 10 L50 90" stroke="#47a248" stroke-width="2" /></svg>`,
      },
      {
        name: "Git",
        class: "git-bubble",
        svg: `<svg viewBox="0 0 100 100"><path d="M85 43 L57 15 C54 12 50 12 47 15 L43 19 L52 28 C55 27 58 29 59 32 C61 35 60 39 57 41 L66 50 C69 49 72 50 73 53 C76 56 75 61 71 63 C68 66 63 65 61 61 C59 59 58 56 59 54 L50 45 L41 54 C42 56 42 59 41 61 C39 65 34 66 31 63 C28 60 28 55 31 52 C33 50 36 49 39 50 L47 42 L39 34 L15 57 C12 60 12 64 15 67 L43 95 C46 98 50 98 53 95 L85 63 C88 60 88 56 85 53 Z" fill="none" stroke="#f05032" stroke-width="4" /></svg>`,
      },
    ];
    const bubbles = [];
    const bubbleSize = 60;
    const bubbleRadius = bubbleSize / 2;
    techBubblesData.forEach((data, index) => {
      const bubbleEl = document.createElement("div");
      bubbleEl.className = `floating-tech-bubble ${data.class}`;
      bubbleEl.innerHTML = `
        ${data.svg}
        <span class="floating-tech-tooltip">${data.name}</span>
      `;
      floatContainer.appendChild(bubbleEl);
      const containerW = floatContainer.offsetWidth || window.innerWidth;
      const containerH = floatContainer.offsetHeight || window.innerHeight;
      const x = Math.random() * (containerW - bubbleSize) + bubbleRadius;
      const y = Math.random() * (containerH - bubbleSize) + bubbleRadius;
      const vx = (Math.random() - 0.5) * 0.8;
      const vy = (Math.random() - 0.5) * 0.8;
      bubbles.push({
        el: bubbleEl,
        x,
        y,
        vx,
        vy,
        radius: bubbleRadius,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        lastX: x,
        lastY: y,
        dragVx: 0,
        dragVy: 0,
      });
    });
    let mouseX = -1000;
    let mouseY = -1000;
    window.addEventListener("mousemove", (e) => {
      const rect = floatContainer.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    window.addEventListener("mouseleave", () => {
      mouseX = -1000;
      mouseY = -1000;
    });
    bubbles.forEach((b) => {
      const startDrag = (clientX, clientY) => {
        b.isDragging = true;
        const rect = floatContainer.getBoundingClientRect();
        b.dragStartX = clientX - rect.left - b.x;
        b.dragStartY = clientY - rect.top - b.y;
        b.vx = 0;
        b.vy = 0;
        b.dragVx = 0;
        b.dragVy = 0;
        b.lastX = b.x;
        b.lastY = b.y;
      };
      const moveDrag = (clientX, clientY) => {
        if (!b.isDragging) return;
        const rect = floatContainer.getBoundingClientRect();
        const containerW = floatContainer.offsetWidth;
        const containerH = floatContainer.offsetHeight;
        let targetX = clientX - rect.left - b.dragStartX;
        let targetY = clientY - rect.top - b.dragStartY;
        targetX = Math.max(b.radius, Math.min(containerW - b.radius, targetX));
        targetY = Math.max(b.radius, Math.min(containerH - b.radius, targetY));
        b.dragVx = targetX - b.x;
        b.dragVy = targetY - b.y;
        b.x = targetX;
        b.y = targetY;
      };
      const endDrag = () => {
        if (!b.isDragging) return;
        b.isDragging = false;
        b.vx = Math.max(-5, Math.min(5, b.dragVx * 0.7));
        b.vy = Math.max(-5, Math.min(5, b.dragVy * 0.7));
      };
      b.el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      });
      window.addEventListener("mousemove", (e) => {
        if (b.isDragging) moveDrag(e.clientX, e.clientY);
      });
      window.addEventListener("mouseup", endDrag);
      b.el.addEventListener("touchstart", (e) => {
        if (e.touches.length > 0) {
          startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      });
      window.addEventListener("touchmove", (e) => {
        if (b.isDragging && e.touches.length > 0) {
          moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      });
      window.addEventListener("touchend", endDrag);
    });
    function updatePhysics() {
      const containerW = floatContainer.offsetWidth || window.innerWidth;
      const containerH = floatContainer.offsetHeight || window.innerHeight;
      bubbles.forEach((b) => {
        if (b.isDragging) {
          b.el.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px)`;
          return;
        }
        b.vx *= 0.98;
        b.vy *= 0.98;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.15) {
          const angle = Math.random() * Math.PI * 2;
          b.vx += Math.cos(angle) * 0.08;
          b.vy += Math.sin(angle) * 0.08;
        }
        const dx = b.x - mouseX;
        const dy = b.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 140;
        if (distance < repelRadius) {
          const force = (repelRadius - distance) / repelRadius;
          const pushX = (dx / (distance || 1)) * force * 0.8;
          const pushY = (dy / (distance || 1)) * force * 0.8;
          b.vx += pushX;
          b.vy += pushY;
        }
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.radius < 0) {
          b.x = b.radius;
          b.vx = -b.vx * 0.8;
        } else if (b.x + b.radius > containerW) {
          b.x = containerW - b.radius;
          b.vx = -b.vx * 0.8;
        }
        if (b.y - b.radius < 0) {
          b.y = b.radius;
          b.vy = -b.vy * 0.8;
        } else if (b.y + b.radius > containerH) {
          b.y = containerH - b.radius;
          b.vy = -b.vy * 0.8;
        }
        b.el.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px)`;
      });
      requestAnimationFrame(updatePhysics);
    }
    requestAnimationFrame(updatePhysics);
  }
});
