/* ==========================================================================
   DEVELOPER PORTFOLIO - CORE LOGIC
   Futuristic Canvas Systems, 3D Tilt, Magnetic Effects, and GSAP Scroll
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // --- Global State ---
  const state = {
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    isMobile: window.innerWidth <= 768,
  };

  // Update sizes on resize
  window.addEventListener("resize", () => {
    state.windowSize.width = window.innerWidth;
    state.windowSize.height = window.innerHeight;
    state.isMobile = window.innerWidth <= 768;
    
    // Resize canvases
    resizeCanvas(particlesCanvas, particlesCtx);
    resizeCanvas(circuitsCanvas, circuitsCtx);
  });

  /* ==========================================================================
     1. CUSTOM CURSOR & SPOTLIGHT EFFECT
     ========================================================================== */
  const cursorGlow = document.getElementById("cursorGlow");
  let cursorX = 0, cursorY = 0;
  
  document.addEventListener("mousemove", (e) => {
    state.mouse.targetX = e.clientX;
    state.mouse.targetY = e.clientY;
  });

  // Smooth cursor follow (lerp)
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

  // Enlarge cursor glow on interactive hover
  const interactives = document.querySelectorAll("a, button, .btn, .glass-panel, .calendar-day");
  interactives.forEach(el => {
    el.addEventListener("mouseenter", () => {
      if (cursorGlow) {
        cursorGlow.style.width = "800px";
        cursorGlow.style.height = "800px";
        cursorGlow.style.background = "radial-gradient(circle, rgba(200, 255, 61, 0.08) 0%, rgba(45, 27, 105, 0.05) 50%, rgba(0,0,0,0) 70%)";
      }
    });
    el.addEventListener("mouseleave", () => {
      if (cursorGlow) {
        cursorGlow.style.width = "600px";
        cursorGlow.style.height = "600px";
        cursorGlow.style.background = "radial-gradient(circle, rgba(200, 255, 61, 0.05) 0%, rgba(45, 27, 105, 0.03) 50%, rgba(0,0,0,0) 70%)";
      }
    });
  });


  /* ==========================================================================
     2. NAVIGATION SCROLL INDICATOR
     ========================================================================== */
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const sidebarIndicator = document.getElementById("sidebarIndicator");
  const sections = document.querySelectorAll("header, section");

  // Track scroll for active nav section
  window.addEventListener("scroll", highlightNav);

  // Highlight nav link & move active indicator vertically
  function highlightNav() {
    let scrollPos = window.scrollY + 120;
    
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute("id");
      
      if (scrollPos >= top && scrollPos < top + height) {
        // Desktop sidebar links
        sidebarLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("data-sec") === id) {
            link.classList.add("active");
            positionSidebarIndicator(link);
          }
        });
        
        // Mobile bottom nav items
        mobileNavItems.forEach(item => {
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

  // Initial positioning
  setTimeout(() => {
    const activeLink = document.querySelector(".sidebar-link.active");
    if (activeLink) positionSidebarIndicator(activeLink);
  }, 500);

  // Mobile Menu toggle (Hamburger)
  const menuHamburger = document.getElementById("menuHamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuLinks = document.querySelectorAll(".mobile-link");

  if (menuHamburger && mobileMenu) {
    menuHamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      menuHamburger.classList.toggle("active");
    });

    mobileMenuLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        menuHamburger.classList.remove("active");
      });
    });
  }

  /* ==========================================================================
     3. AUDIO SYSTEM
     ========================================================================== */
  const soundControl = document.getElementById("soundControl");
  const ambientAudio = document.getElementById("ambientAudio");
  let audioPlaying = false;

  if (soundControl && ambientAudio) {
    // Set low ambient volume
    ambientAudio.volume = 0.15;

    soundControl.addEventListener("click", () => {
      audioPlaying = !audioPlaying;
      if (audioPlaying) {
        ambientAudio.play().catch(err => console.log("Audio play blocked by browser policy"));
        soundControl.querySelector(".sound-btn").classList.add("playing");
      } else {
        ambientAudio.pause();
        soundControl.querySelector(".sound-btn").classList.remove("playing");
      }
    });
  }

  /* ==========================================================================
     4. PARTICLES CANVAS SYSTEM
     ========================================================================== */
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
      this.speedX = (Math.random() * 0.4 - 0.2);
      this.alpha = Math.random() * 0.5 + 0.1;
      this.fadeSpeed = Math.random() * 0.003 + 0.001;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      
      // Repel from cursor slightly
      const dx = state.mouse.targetX - (particlesCanvas.getBoundingClientRect().left + this.x);
      const dy = state.mouse.targetY - (particlesCanvas.getBoundingClientRect().top + this.y);
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
      // Neon Lime green glow
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
      particlesArray.push(new Particle(particlesCanvas.width, particlesCanvas.height));
    }
  }
  initParticles();

  function animateParticles() {
    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    particlesArray.forEach(p => {
      p.update();
      p.draw(particlesCtx);
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  /* ==========================================================================
     5. CIRCUITS CANVAS SYSTEM
     ========================================================================== */
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
      // Pick random start inside boundary
      this.x = Math.random() * this.w;
      this.y = Math.random() * this.h;
      this.points = [{ x: this.x, y: this.y }];
      this.segments = Math.floor(Math.random() * 3) + 2; // 2 to 4 segments
      this.currentSegment = 0;
      this.progress = 0;
      this.speed = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.width = Math.random() * 1 + 0.5;
      
      // Compute next segment direction (right angle, 45 degree, or vertical/horizontal)
      for (let i = 0; i < this.segments; i++) {
        const prev = this.points[i];
        const angle = [0, 45, 90, 135, 180, 225, 270, 315][Math.floor(Math.random() * 8)];
        const length = Math.random() * 80 + 40;
        const rad = (angle * Math.PI) / 180;
        
        const nextX = prev.x + Math.cos(rad) * length;
        const nextY = prev.y + Math.sin(rad) * length;
        
        // Keep inside bounds
        this.points.push({
          x: Math.max(10, Math.min(this.w - 10, nextX)),
          y: Math.max(10, Math.min(this.h - 10, nextY))
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
      
      // Draw completed segments
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 0; i < this.currentSegment; i++) {
        ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
      }
      
      // Draw active animating segment
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
      
      // Draw tiny node dots at junctions
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
      circuitsArray.push(new CircuitPath(circuitsCanvas.width, circuitsCanvas.height));
    }
  }
  initCircuits();

  function animateCircuits() {
    circuitsCtx.clearRect(0, 0, circuitsCanvas.width, circuitsCanvas.height);
    circuitsArray.forEach(c => {
      c.update();
      c.draw(circuitsCtx);
    });
    requestAnimationFrame(animateCircuits);
  }
  animateCircuits();

  /* ==========================================================================
     6. MOUSE PARALLAX & CINEMATIC ZOOM
     ========================================================================== */
  const heroBgImage = document.getElementById("heroBgImage");
  const floatingElements = document.querySelectorAll(".floating-element");

  let bgX = 0, bgY = 0;
  
  function applyParallax() {
    const halfWidth = state.windowSize.width / 2;
    const halfHeight = state.windowSize.height / 2;
    
    // Normalize mouse coords (-1 to 1)
    const normX = (state.mouse.targetX - halfWidth) / halfWidth;
    const normY = (state.mouse.targetY - halfHeight) / halfHeight;

    // Smooth lerp for background image container
    bgX += (normX * -20 - bgX) * 0.05;
    bgY += (normY * -20 - bgY) * 0.05;
    
    if (heroBgImage) {
      // Slow pulse scale animation (cinematic zoom)
      const time = Date.now() * 0.0001;
      const zoom = 1.05 + Math.sin(time) * 0.03; // Scales slowly between 1.02 and 1.08
      
      if (!state.isMobile) {
        heroBgImage.style.transform = `translate(${bgX}px, ${bgY}px) scale(${zoom})`;
      } else {
        heroBgImage.style.transform = `scale(${zoom})`;
      }
    }

    // Apply parallax to floating panels
    floatingElements.forEach(el => {
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

  /* ==========================================================================
     7. 3D CARD TILT & MOUSE GLOW BORDER
     ========================================================================== */
  const tiltElements = document.querySelectorAll(".tilt-element");

  tiltElements.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position inside element
      const y = e.clientY - rect.top;  // y position inside element
      
      const width = rect.width;
      const height = rect.height;
      
      // Calculate rotation angles (-10deg to 10deg)
      const rotateX = -10 * ((y - height/2) / (height/2));
      const rotateY = 10 * ((x - width/2) / (width/2));
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // Update mouse values for card-specific hover spotlight CSS
      const pctX = (x / width) * 100;
      const pctY = (y / height) * 100;
      card.style.setProperty("--mouse-x", `${pctX}%`);
      card.style.setProperty("--mouse-y", `${pctY}%`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });

  /* ==========================================================================
     8. MAGNETIC BUTTONS EFFECT
     ========================================================================== */
  const magneticButtons = document.querySelectorAll(".btn-magnetic");
  
  magneticButtons.forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Translate elements
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

  /* ==========================================================================
     9. INTERACTIVE SKILLS CATEGORY TAB
     ========================================================================== */
  const tabButtons = document.querySelectorAll(".tab-btn");
  const skillPanes = document.querySelectorAll(".skills-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      // Toggle active states
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      skillPanes.forEach(pane => {
        pane.classList.remove("active");
        if (pane.getAttribute("id") === targetTab) {
          // Trigger transition reflow
          setTimeout(() => {
            pane.classList.add("active");
          }, 50);
        }
      });
    });
  });

  /* ==========================================================================
     10. DYNAMIC GITHUB COMMIT CALENDAR
     ========================================================================== */
  const githubGrid = document.getElementById("githubGrid");
  
  if (githubGrid) {
    const totalCells = state.isMobile ? 119 : 371; // Fit calendar screen sizes
    githubGrid.innerHTML = "";
    
    // Generate simulated commit intensity grid
    for (let i = 0; i < totalCells; i++) {
      const day = document.createElement("div");
      day.classList.add("calendar-day");
      
      // Weighted distribution of levels (mostly lvl 0-1, some lvl 2-3, very few lvl 4)
      const randVal = Math.random();
      let lvl = 0;
      if (randVal > 0.88) lvl = 4;
      else if (randVal > 0.75) lvl = 3;
      else if (randVal > 0.5) lvl = 2;
      else if (randVal > 0.25) lvl = 1;
      
      day.classList.add(`lvl-${lvl}`);
      
      // Calculate fake commits
      let commits = 0;
      if (lvl === 1) commits = Math.floor(Math.random() * 2) + 1;
      else if (lvl === 2) commits = Math.floor(Math.random() * 3) + 3;
      else if (lvl === 3) commits = Math.floor(Math.random() * 4) + 6;
      else if (lvl === 4) commits = Math.floor(Math.random() * 8) + 10;
      
      const dateText = new Date();
      dateText.setDate(dateText.getDate() - (totalCells - i));
      const formattedDate = dateText.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      
      day.setAttribute("title", `${commits === 0 ? "No" : commits} contributions on ${formattedDate}`);
      githubGrid.appendChild(day);
    }
  }

  /* ==========================================================================
     11. TIMELINE PROGRESS TRACKING
     ========================================================================== */
  const timelineProgress = document.getElementById("timelineProgress");
  const timelineItems = document.querySelectorAll(".timeline-item");
  const timelineSection = document.getElementById("experience");

  window.addEventListener("scroll", () => {
    if (!timelineProgress || !timelineSection) return;
    
    const rect = timelineSection.getBoundingClientRect();
    const sectionHeight = timelineSection.offsetHeight;
    const windowHeight = window.innerHeight;
    
    // Determine scroll percentage through timeline section
    const scrollInSec = windowHeight / 2 - rect.top;
    let pct = (scrollInSec / (sectionHeight - 200)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    
    timelineProgress.style.height = `${pct}%`;

    // Highlight items as they pass the viewport midpoint
    timelineItems.forEach(item => {
      const itemTop = item.getBoundingClientRect().top;
      if (itemTop < windowHeight / 2 + 100) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  });

  /* ==========================================================================
     12. GSAP LOADING & ENTRY SEQUENCE
     ========================================================================== */
  if (typeof gsap !== "undefined") {
    // Register ScrollTrigger Plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initial load animations
    const tl = gsap.timeline();
    
    tl.to(".init-fade", {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.15,
      ease: "power3.out"
    });

    tl.to(".navbar", {
      top: "24px",
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.8");

    tl.to(".floating-element", {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      stagger: 0.15,
      ease: "back.out(1.2)"
    }, "-=0.6");

    // Scroll Trigger revealing sections and cards
    const reveals = document.querySelectorAll(".scroll-reveal");
    reveals.forEach(el => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    // Animate achievements numbers when in view
    const counters = document.querySelectorAll(".counter-number");
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute("data-target"), 10);
      gsap.to(counter, {
        scrollTrigger: {
          trigger: counter,
          start: "top 90%",
        },
        innerText: target,
        duration: 2.0,
        snap: { innerText: 1 },
        ease: "power2.out"
      });
    });
  } else {
    // Fallback if GSAP fails to load
    document.querySelectorAll(".init-fade, .floating-element, .scroll-reveal").forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    
    const counters = document.querySelectorAll(".counter-number");
    counters.forEach(counter => {
      counter.innerText = counter.getAttribute("data-target");
    });
  }

  // Hide top connect social header on mobile when scrolling down, show when scrolling up
  let lastScrollY = window.scrollY;
  const topConnectHeader = document.querySelector(".top-connect-header");

  window.addEventListener("scroll", () => {
    if (!topConnectHeader) return;
    const currentScrollY = window.scrollY;

    if (window.innerWidth <= 768) {
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down: hide header
        topConnectHeader.classList.add("scroll-hide");
      } else {
        // Scrolling up or at very top: show header
        topConnectHeader.classList.remove("scroll-hide");
      }
    } else {
      // Desktop: always show
      topConnectHeader.classList.remove("scroll-hide");
    }

    lastScrollY = currentScrollY;
  });

  // ==========================================================================
  // 11. DYNAMIC CONFIGURATION LOADER
  // ==========================================================================
  async function loadConfigSocials() {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Config load failed");
      const config = await res.json();
      
      const { github, linkedin, instagram, email } = config.socials;

      // Update Top Header Connect Socials
      const topGH = document.querySelector(".top-connect-header a[aria-label='GitHub']");
      if (topGH) topGH.href = github;
      const topLI = document.querySelector(".top-connect-header a[aria-label='LinkedIn']");
      if (topLI) topLI.href = linkedin;
      const topIG = document.querySelector(".top-connect-header a[aria-label='Instagram']");
      if (topIG) topIG.href = instagram;
      const topMail = document.querySelector(".top-connect-header a[aria-label='Email']");
      if (topMail) topMail.href = `mailto:${email}`;

      // Update Contact Section Details
      const contactMail = document.querySelector(".contact-methods a[href^='mailto:']");
      if (contactMail) {
        contactMail.href = `mailto:${email}`;
        contactMail.textContent = email;
      }
      const contactLI = document.querySelector(".contact-methods a[href*='linkedin.com']");
      if (contactLI) {
        contactLI.href = linkedin;
        try {
          const username = linkedin.replace(/\/$/, "").split("/").pop();
          contactLI.textContent = username;
        } catch(e) {
          contactLI.textContent = "LinkedIn Profile";
        }
      }

      // Update Footer Socials
      const footerGH = document.querySelector(".footer-socials a[aria-label='GitHub']");
      if (footerGH) footerGH.href = github;
      const footerLI = document.querySelector(".footer-socials a[aria-label='LinkedIn']");
      if (footerLI) footerLI.href = linkedin;
      const footerIG = document.querySelector(".footer-socials a[aria-label='Instagram']");
      if (footerIG) footerIG.href = instagram;
      const footerMail = document.querySelector(".footer-socials a[aria-label='Email']");
      if (footerMail) footerMail.href = `mailto:${email}`;
      
    } catch (err) {
      console.warn("Could not load dynamic configuration, using static fallback values:", err);
    }
  }

  // Load configuration on init
  loadConfigSocials();

  // ==========================================================================
  // 12. DYNAMIC SMTP FORM SUBMISSION
  // ==========================================================================
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector("button[type='submit']");
      const originalBtnHtml = submitBtn.innerHTML;
      
      // Disable and show spinner state
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
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, subject, message })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Transmission sent successfully via SMTP!");
          contactForm.reset();
        } else {
          throw new Error(data.error || "Failed to send transmission");
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
});
