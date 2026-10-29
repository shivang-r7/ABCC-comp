/* ==========================================================================
   SHIVANG'S PORTFOLIO - BLACK HOLE 3D ENGINE & INTERACTION SCRIPT
   Interstellar Singularity Canvas, 3D Screen Gyroscope/Tilt, Audio & Terminal
   ========================================================================== */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Native Web Audio API) ---
  let audioCtx = null;
  let audioEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.05) {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  function playSuccessChime() {
    if (!audioEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.15, 0.06), idx * 80);
    });
  }

  function playBlip() {
    playTone(880, 'sine', 0.03, 0.025);
  }

  function playClick() {
    playTone(440, 'triangle', 0.05, 0.04);
  }

  // --- AUDIO TOGGLE BUTTON ---
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      initAudio();
      audioToggleBtn.classList.toggle('sound-muted', !audioEnabled);
      showToast(audioEnabled ? 'Sound Effects Enabled 🔊' : 'Sound Effects Muted 🔇');
      if (audioEnabled) playTone(660, 'sine', 0.1);
    });
  }

  // Attach subtle click sounds to interactive items
  document.querySelectorAll('a, button, .skill-chip, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => playBlip());
    el.addEventListener('click', () => playClick());
  });

  // ==========================================================================
  // 3D SCREEN MOVEMENT & PARALLAX ENGINE
  // Tilts the entire viewport and layers in true 3D space on mouse move
  // ==========================================================================
  const sceneStage = document.getElementById('scene-stage');
  const motionToggleBtn = document.getElementById('motion-toggle-btn');
  let motion3DEnabled = true;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetRotX = 0;
  let targetRotY = 0;
  let targetPanX = 0;
  let targetPanY = 0;

  let currentRotX = 0;
  let currentRotY = 0;
  let currentPanX = 0;
  let currentPanY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!motion3DEnabled) return;

    const normX = (mouseX / window.innerWidth - 0.5) * 2; // -1 to 1
    const normY = (mouseY / window.innerHeight - 0.5) * 2; // -1 to 1

    // Balanced cinematic 3D tilt angles (degrees) and pan (pixels)
    targetRotY = normX * 4.2;
    targetRotX = -normY * 3.5;
    targetPanX = -normX * 14;
    targetPanY = -normY * 14;
  });

  // Smoothly center perspective when cursor exits browser window
  window.addEventListener('mouseleave', () => {
    targetRotX = 0;
    targetRotY = 0;
    targetPanX = 0;
    targetPanY = 0;
  });

  // Touch device tilt fallback
  if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
    window.addEventListener('deviceorientation', (e) => {
      if (!motion3DEnabled || e.gamma === null) return;
      targetRotY = Math.max(-10, Math.min(10, e.gamma * 0.4));
      targetRotX = Math.max(-10, Math.min(10, (e.beta - 45) * 0.4));
    });
  }

  function update3DScreen() {
    if (sceneStage && motion3DEnabled) {
      // Smooth linear interpolation for cinema-grade fluid damping
      currentRotX += (targetRotX - currentRotX) * 0.07;
      currentRotY += (targetRotY - currentRotY) * 0.07;
      currentPanX += (targetPanX - currentPanX) * 0.07;
      currentPanY += (targetPanY - currentPanY) * 0.07;

      sceneStage.style.setProperty('--tilt-x', `${currentRotX.toFixed(3)}deg`);
      sceneStage.style.setProperty('--tilt-y', `${currentRotY.toFixed(3)}deg`);
      sceneStage.style.setProperty('--pan-x', `${currentPanX.toFixed(2)}px`);
      sceneStage.style.setProperty('--pan-y', `${currentPanY.toFixed(2)}px`);
    }
    requestAnimationFrame(update3DScreen);
  }
  requestAnimationFrame(update3DScreen);

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener('click', () => {
      motion3DEnabled = !motion3DEnabled;
      document.body.classList.toggle('motion-disabled', !motion3DEnabled);
      motionToggleBtn.classList.toggle('motion-pill-active', motion3DEnabled);
      showToast(motion3DEnabled ? '3D Screen Motion Active 🌀' : '3D Motion Locked ⏹️', '🪐');
      playTone(580, 'sine', 0.08);
    });
  }

  // ==========================================================================
  // INTERACTIVE 3D CARD TILT (INDIVIDUAL ELEVATION)
  // ==========================================================================
  document.querySelectorAll('.glass-card, .terminal-window').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      if (!motion3DEnabled) return;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transition = 'transform 0.12s ease-out';
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(24px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.transform = '';
    });
  });

  // ==========================================================================
  // BLACK HOLE CANVAS ENGINE (Gargantua Singularity & Relativistic Swarm)
  // ==========================================================================
  const canvas = document.getElementById('blackhole-canvas') || document.getElementById('stars-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars.forEach(s => {
        if (s.x > width) s.x = Math.random() * width;
        if (s.y > height) s.y = Math.random() * height;
      });
    });

    // Singularity center with slight parallax offset
    let bhX = width * 0.5;
    let bhY = height * 0.42;

    // Accretion disk matter particles
    const particleCount = 420;
    const particles = [];

    // Distant background stars
    const starCount = 180;
    const stars = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        color: Math.random() > 0.3 ? '#f8fafc' : '#fdba74'
      });
    }

    class AccretionParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        // Logarithmic orbital distance from event horizon
        this.distance = init ? Math.random() * 320 + 85 : Math.random() * 200 + 220;
        this.angle = Math.random() * Math.PI * 2;
        // Keplerian orbit: particles closer to singularity orbit faster
        this.speed = (0.012 + (300 - Math.min(300, this.distance)) * 0.00015) * (Math.random() * 0.4 + 0.8);
        this.size = Math.random() * 2.2 + 0.8;
        this.hue = Math.random() > 0.4 ? 25 + Math.random() * 25 : 270 + Math.random() * 30; // fire orange / cosmic violet
        this.alpha = Math.random() * 0.7 + 0.3;
        this.decay = Math.random() * 0.3 + 0.15; // spiral inwards toward singularity
      }

      update() {
        this.angle += this.speed;
        this.distance -= this.decay;

        // Gravitational pull toward mouse cursor
        if (mouseX !== null) {
          const dx = mouseX - (bhX + Math.cos(this.angle) * this.distance);
          const dy = mouseY - (bhY + Math.sin(this.angle) * this.distance * 0.38);
          const distMouse = Math.sqrt(dx * dx + dy * dy);
          if (distMouse < 180) {
            this.distance += (distMouse / 180 - 0.5) * 1.5;
          }
        }

        // Swallowed by event horizon
        if (this.distance < 72) {
          this.reset(false);
        }
      }

      draw() {
        // Perspective squish for accretion disk tilt
        const diskTilt = -0.32;
        const xRaw = Math.cos(this.angle) * this.distance;
        const yRaw = Math.sin(this.angle) * this.distance * 0.36;

        // Rotate by disk tilt angle
        const rx = xRaw * Math.cos(diskTilt) - yRaw * Math.sin(diskTilt);
        const ry = xRaw * Math.sin(diskTilt) + yRaw * Math.cos(diskTilt);

        const screenX = bhX + rx;
        const screenY = bhY + ry;

        // Relativistic Doppler beaming: approaching side (left) is brighter and shifted cyan/white
        const doppler = Math.sin(this.angle);
        const finalAlpha = Math.max(0.1, Math.min(1, this.alpha + doppler * 0.35));

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);

        if (doppler > 0.3) {
          ctx.fillStyle = `rgba(217, 249, 157, ${finalAlpha})`; // blue-shifted hot gold/cyan
        } else if (doppler < -0.3) {
          ctx.fillStyle = `rgba(244, 63, 94, ${finalAlpha * 0.85})`; // red-shifted deep fire
        } else {
          ctx.fillStyle = `rgba(251, 146, 60, ${finalAlpha})`;
        }

        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new AccretionParticle());
    }

    // Gravitational Shockwave Ripple on Click
    let shockwaves = [];
    window.addEventListener('click', (e) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 260,
        alpha: 0.6
      });
      playTone(320, 'triangle', 0.12, 0.05);
    });

    function drawBlackHole() {
      // Responsive center based on mouse parallax
      const targetBhX = width * 0.5 + (mouseX / width - 0.5) * 55;
      const targetBhY = height * 0.44 + (mouseY / height - 0.5) * 45;
      bhX += (targetBhX - bhX) * 0.05;
      bhY += (targetBhY - bhY) * 0.05;

      const horizonRadius = Math.min(width, height) * 0.11;

      // 1. Deep space background clearing with subtle motion blur
      ctx.fillStyle = 'rgba(2, 3, 8, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // 2. Distant stars with gravitational warping
      stars.forEach(star => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 0.9 || star.alpha < 0.2) star.twinkleSpeed *= -1;

        // Gravitational deflection of light rays around black hole
        const dx = star.x - bhX;
        const dy = star.y - bhY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let drawX = star.x;
        let drawY = star.y;

        if (dist > horizonRadius && dist < 450) {
          const deflection = (450 - dist) * 0.04;
          drawX += (dx / dist) * deflection;
          drawY += (dy / dist) * deflection;
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, star.alpha);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 3. Gravitational Lensing Outer Halo (Einstein Ring)
      const outerGlow = ctx.createRadialGradient(bhX, bhY, horizonRadius * 0.9, bhX, bhY, horizonRadius * 3.4);
      outerGlow.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      outerGlow.addColorStop(0.25, 'rgba(168, 85, 247, 0.22)');
      outerGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.08)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(bhX, bhY, horizonRadius * 3.4, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // 4. Upper Lensing Arch (The bent top disk of Gargantua)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(bhX, bhY - horizonRadius * 0.45, horizonRadius * 1.85, horizonRadius * 0.85, -0.15, Math.PI, 0, false);
      ctx.lineWidth = horizonRadius * 0.42;
      const topArcGrad = ctx.createLinearGradient(bhX - horizonRadius * 2, bhY, bhX + horizonRadius * 2, bhY);
      topArcGrad.addColorStop(0, 'rgba(251, 191, 36, 0.85)');
      topArcGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.7)');
      topArcGrad.addColorStop(1, 'rgba(236, 72, 153, 0.4)');
      ctx.strokeStyle = topArcGrad;
      ctx.shadowBlur = 35;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
      ctx.stroke();
      ctx.restore();

      // 5. Draw Accretion Disk Matter Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // 6. Lower Lensing Arch (The bent bottom reflection)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(bhX, bhY + horizonRadius * 0.42, horizonRadius * 1.6, horizonRadius * 0.65, -0.15, 0, Math.PI, false);
      ctx.lineWidth = horizonRadius * 0.28;
      const bottomArcGrad = ctx.createLinearGradient(bhX - horizonRadius * 2, bhY, bhX + horizonRadius * 2, bhY);
      bottomArcGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
      bottomArcGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)');
      bottomArcGrad.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
      ctx.strokeStyle = bottomArcGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.6)';
      ctx.stroke();
      ctx.restore();

      // 7. Photon Ring (Hyper-luminous boundary at innermost stable circular orbit)
      ctx.save();
      ctx.beginPath();
      ctx.arc(bhX, bhY, horizonRadius + 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#fbbf24';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bhX, bhY, horizonRadius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 5;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ea580c';
      ctx.stroke();
      ctx.restore();

      // 8. Event Horizon (Absolute Pitch-Black Singularity Void)
      ctx.beginPath();
      ctx.arc(bhX, bhY, horizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // 9. Shockwave Ripple Renderer
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${sw.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f97316';
        ctx.stroke();
        ctx.restore();

        sw.radius += 5.5;
        sw.alpha -= 0.015;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
        }
      }

      requestAnimationFrame(drawBlackHole);
    }
    requestAnimationFrame(drawBlackHole);
  }

  // --- TYPEWRITER EFFECT IN HERO ---
  const typewriterElement = document.getElementById('typewriter-text');
  if (typewriterElement) {
    const phrases = [
      'BCA Graduate & Polyglot Engineer',
      'Warping Complex CS Theory into High-Speed Code',
      'Polyglot: Rust, TypeScript, Python & Go',
      'Architecting Blazingly Fast Web & Systems',
      'Obsessed with Micro-Interactions & Clean Design'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 70;

    function type() {
      const currentPhrase = phrases[phraseIndex];
      if (isDeleting) {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 35;
      } else {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 70;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 400;
      }

      setTimeout(type, typeSpeed);
    }
    type();
  }

  // --- TOAST NOTIFICATION UTILITY ---
  const toastContainer = document.getElementById('toast-container');
  function showToast(message, icon = '✨') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="text-xl">${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
  window.showToast = showToast;

  // --- COPY EMAIL BUTTON ---
  const copyEmailBtns = document.querySelectorAll('.copy-email-trigger');
  copyEmailBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const email = 'shivang.codes@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied ${email} to clipboard! 📋`, '🚀');
        playSuccessChime();
      }).catch(() => {
        showToast('Email: shivang.codes@gmail.com', '📧');
      });
    });
  });

  // --- INTERACTIVE TERMINAL EMULATOR ---
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');

  const terminalCommands = {
    help: () => `
<div class="text-orange-400 font-semibold mb-1">Available Singularity Commands:</div>
<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
  <span><strong class="text-amber-400">bio</strong>       - About Shivang & origin</span>
  <span><strong class="text-amber-400">education</strong> - BCA degree & academic stats</span>
  <span><strong class="text-amber-400">skills</strong>    - Polyglot languages & tech</span>
  <span><strong class="text-amber-400">projects</strong>  - Top engineering builds</span>
  <span><strong class="text-amber-400">why-hire</strong>  - Why Shivang stands out</span>
  <span><strong class="text-amber-400">contact</strong>   - Reach out directly</span>
  <span><strong class="text-amber-400">gravity</strong>   - Boost gravitational pull</span>
  <span><strong class="text-amber-400">matrix</strong>    - Toggle cyber matrix rain</span>
  <span><strong class="text-amber-400">clear</strong>     - Clear the terminal</span>
</div>
<div class="mt-2 text-xs text-slate-400">Tip: Click any quick chip below or type a command!</div>
`,
    bio: () => `
<div class="text-amber-400 font-semibold mb-1">⚡ Who is Shivang?</div>
<p class="text-slate-300">I am a passionate BCA graduate who refused to stop at textbook memorization. While mastering Operating Systems, Relational DBMS, and Data Structures in college, I spent my nights dissecting distributed systems, writing multithreaded Rust microservices, building modern web applications with Next.js & TypeScript, and experimenting with AI agents.</p>
<p class="mt-2 text-cyan-300 font-medium">"I care about how software feels to humans and how it scales under heavy load."</p>
`,
    education: () => `
<div class="text-orange-400 font-semibold mb-1">🎓 Academic Foundation:</div>
<p><strong class="text-white">Degree:</strong> Bachelor of Computer Applications (BCA)</p>
<p><strong class="text-white">Core Focus:</strong> Data Structures & Algorithms, Object-Oriented Architecture, RDBMS, Computer Networks, Software Engineering.</p>
<p><strong class="text-white">Superpower:</strong> Translating foundational CS concepts into modern, performant frameworks with zero friction.</p>
<p class="text-xs text-emerald-400 mt-1">Status: Graduated with Distinction & High Distinction in Practical Labs.</p>
`,
    skills: () => `
<div class="text-purple-400 font-semibold mb-1">🛠️ Polyglot Arsenal:</div>
<div class="space-y-1 text-slate-300">
  <div><span class="text-amber-400 font-mono">Languages:</span> TypeScript, JavaScript (ES6+), Python, Rust, Go, C/C++, SQL</div>
  <div><span class="text-amber-400 font-mono">Frontend:</span> React, Next.js 14, Tailwind CSS, WebSockets, HTML5 Canvas, 3D CSS</div>
  <div><span class="text-amber-400 font-mono">Backend:</span> Node.js, Express, FastAPI, Tokio (Rust), Gin (Go)</div>
  <div><span class="text-amber-400 font-mono">Data & Infra:</span> PostgreSQL, MongoDB, Redis, Docker, Git, Linux, Vercel, pgvector</div>
</div>
`,
    projects: () => `
<div class="text-amber-400 font-semibold mb-1">🚀 Highlighted Projects:</div>
<ul class="space-y-1 text-slate-300">
  <li><strong class="text-white">1. AetherFlow</strong> - Real-Time Collaborative Canvas (Next.js 14, WebSockets, Rust backend)</li>
  <li><strong class="text-white">2. NeuroQuery</strong> - AI Semantic Document Engine (Python, FastAPI, pgvector, LangChain)</li>
  <li><strong class="text-white">3. VeloCache</strong> - Ultra-Fast In-Memory Key-Value Store (Rust, TCP, Async)</li>
  <li><strong class="text-white">4. DevPulse</strong> - GitHub Developer Activity & Commit Velocity Tracker (Go, React, Tailwind)</li>
</ul>
<div class="text-xs text-orange-300 mt-2">Scroll down to the 'Projects' section to inspect architecture and source code!</div>
`,
    'why-hire': () => `
<div class="text-rose-400 font-semibold mb-1">💡 Why Bring Shivang onto Your Team?</div>
<ul class="list-disc list-inside text-slate-300 space-y-1">
  <li><strong class="text-white">Rapid Ramp-Up:</strong> Learns new paradigms in days, not months. Polyglot mindset means no tech stack intimidation.</li>
  <li><strong class="text-white">End-to-End Ownership:</strong> From database migrations to high-polish 3D UI transitions, I build whole products.</li>
  <li><strong class="text-white">Grit & Passion:</strong> Fresh graduate energy combined with serious builder discipline.</li>
  <li><strong class="text-white">Clear Communicator:</strong> Documented code, active git discipline, and collaborative mindset.</li>
</ul>
`,
    gravity: () => {
      showToast('Gravitational singularity pulse initiated! 🌌', '🪐');
      playTone(220, 'sine', 0.25, 0.08);
      return '<span class="text-orange-400">Gravitational field expanded! Notice the particle acceleration around the singularity.</span>';
    },
    contact: () => `
<div class="text-cyan-400 font-semibold mb-1">📬 Let's Connect:</div>
<div class="text-slate-300 space-y-1">
  <div>📧 Email: <a href="mailto:shivang.codes@gmail.com" class="text-orange-400 underline hover:text-orange-300">shivang.codes@gmail.com</a></div>
  <div>💻 GitHub: <a href="https://github.com" target="_blank" class="text-orange-400 underline hover:text-orange-300">github.com/shivang-dev</a></div>
  <div>💼 LinkedIn: <a href="https://linkedin.com" target="_blank" class="text-orange-400 underline hover:text-orange-300">linkedin.com/in/shivang-developer</a></div>
  <div>📍 Location: Open to Remote worldwide & Onsite opportunities</div>
</div>
`,
    clear: () => {
      if (terminalOutput) terminalOutput.innerHTML = '';
      return null;
    },
    matrix: () => {
      toggleMatrixEffect();
      return '<span class="text-emerald-400">Cyber matrix rain mode triggered! Check the background.</span>';
    }
  };

  function executeTerminalCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    const userLine = document.createElement('div');
    userLine.className = 'text-slate-400 mb-1';
    userLine.innerHTML = `<span class="text-orange-400 font-bold">visitor@blackhole-cli:~$</span> <span class="text-cyan-300">${escapeHtml(cmdRaw)}</span>`;
    terminalOutput.appendChild(userLine);

    if (cmd in terminalCommands) {
      const output = terminalCommands[cmd]();
      if (output) {
        const resDiv = document.createElement('div');
        resDiv.className = 'mb-3 leading-relaxed';
        resDiv.innerHTML = output;
        terminalOutput.appendChild(resDiv);
      }
    } else {
      const errDiv = document.createElement('div');
      errDiv.className = 'text-rose-400 mb-2';
      errDiv.innerHTML = `Command not recognized: '<span class="font-bold">${escapeHtml(cmd)}</span>'. Type <span class="text-amber-400 font-bold">help</span> to view all commands.`;
      terminalOutput.appendChild(errDiv);
    }

    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    playTone(550, 'sine', 0.06);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeTerminalCommand(terminalInput.value);
        terminalInput.value = '';
      }
    });
  }

  document.querySelectorAll('.terminal-quick-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const command = chip.getAttribute('data-cmd');
      if (command) executeTerminalCommand(command);
    });
  });

  // --- MATRIX RAIN EASTER EGG ---
  let matrixActive = false;
  let matrixInterval = null;

  function toggleMatrixEffect() {
    matrixActive = !matrixActive;
    let mCanvas = document.getElementById('matrix-canvas');

    if (!matrixActive) {
      if (mCanvas) mCanvas.remove();
      clearInterval(matrixInterval);
      showToast('Matrix effect disabled');
      return;
    }

    showToast('Entering Matrix Terminal mode... 🕶️', '⚡');
    mCanvas = document.createElement('canvas');
    mCanvas.id = 'matrix-canvas';
    mCanvas.style.position = 'fixed';
    mCanvas.style.top = '0';
    mCanvas.style.left = '0';
    mCanvas.style.width = '100vw';
    mCanvas.style.height = '100vh';
    mCanvas.style.zIndex = '2';
    mCanvas.style.pointerEvents = 'none';
    mCanvas.style.opacity = '0.35';
    document.body.appendChild(mCanvas);

    const mCtx = mCanvas.getContext('2d');
    mCanvas.width = window.innerWidth;
    mCanvas.height = window.innerHeight;

    const characters = '01SHIVANG_BCA_RUST_PYTHON_TYPESCRIPT_REACT_DOCKER_CODE_1010101';
    const fontSize = 14;
    const columns = Math.floor(mCanvas.width / fontSize);
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    matrixInterval = setInterval(() => {
      mCtx.fillStyle = 'rgba(2, 3, 8, 0.08)';
      mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      mCtx.fillStyle = '#f97316';
      mCtx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        mCtx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > mCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 45);
  }

  // --- SKILL TABS & SEARCH ---
  const skillSearchInput = document.getElementById('skill-search');
  const skillChips = document.querySelectorAll('.skill-badge-item');
  const skillTabBtns = document.querySelectorAll('.skill-tab-btn');

  function filterSkills() {
    const query = skillSearchInput ? skillSearchInput.value.toLowerCase().trim() : '';
    const activeTab = document.querySelector('.skill-tab-btn.active')?.getAttribute('data-tab') || 'all';

    skillChips.forEach((chip) => {
      const skillName = chip.getAttribute('data-skill')?.toLowerCase() || '';
      const category = chip.getAttribute('data-category') || '';

      const matchesSearch = !query || skillName.includes(query);
      const matchesTab = activeTab === 'all' || category === activeTab;

      if (matchesSearch && matchesTab) {
        chip.style.display = 'inline-flex';
        chip.style.opacity = '1';
        chip.style.transform = 'scale(1)';
      } else {
        chip.style.display = 'none';
        chip.style.opacity = '0';
        chip.style.transform = 'scale(0.9)';
      }
    });
  }

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', filterSkills);
  }

  skillTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      skillTabBtns.forEach((b) => {
        b.classList.remove('active', 'bg-orange-600', 'text-white');
        b.classList.add('text-slate-400', 'hover:text-white', 'bg-slate-800/40');
      });
      btn.classList.add('active', 'bg-orange-600', 'text-white');
      btn.classList.remove('text-slate-400', 'hover:text-white', 'bg-slate-800/40');
      filterSkills();
    });
  });

  // --- PROJECT FILTERING ---
  const projectCards = document.querySelectorAll('.project-card-item');
  const projectFilterBtns = document.querySelectorAll('.project-filter-btn');

  projectFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      projectFilterBtns.forEach((b) => {
        b.classList.remove('active', 'border-orange-500', 'text-orange-400', 'bg-orange-950/40');
        b.classList.add('border-slate-800', 'text-slate-400');
      });
      btn.classList.add('active', 'border-orange-500', 'text-orange-400', 'bg-orange-950/40');
      btn.classList.remove('border-slate-800', 'text-slate-400');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // --- PROJECT DETAIL MODAL ---
  const projectDetails = {
    aetherflow: {
      title: 'AetherFlow — Real-Time Collaborative Canvas',
      tagline: 'Infinite whiteboard with sub-50ms vector sync and audio haptics',
      languages: ['TypeScript', 'Rust', 'Next.js 14', 'WebSockets', 'Redis', 'Docker'],
      metrics: ['< 45ms latency across 50 simultaneous users', '99.9% uptime with Redis pub/sub'],
      description: `Built to solve remote team diagramming friction. Combines an ultra-reactive HTML5 Canvas frontend powered by Next.js & React with an asynchronous Rust WebSocket server handling multi-room CRDT state reconciliation.`,
      architecture: [
        'Client-side optimistic updates using custom spatial indexing (R-Tree)',
        'Rust Actix-Web WebSocket microservice with memory-efficient token pooling',
        'Redis Pub/Sub instance to scale message fan-out across multiple clusters'
      ],
      demoUrl: '#',
      githubUrl: 'https://github.com'
    },
    neuroquery: {
      title: 'NeuroQuery — AI Document Intelligence & Search',
      tagline: 'Semantic vector search over dense PDFs with retrieval-augmented citations',
      languages: ['Python', 'FastAPI', 'LangChain', 'pgvector', 'PostgreSQL', 'Tailwind'],
      metrics: ['4x faster retrieval compared to standard keyword search', 'Supports 100+ page technical manuals'],
      description: `An end-to-end RAG (Retrieval-Augmented Generation) application allowing users to chat with enterprise documentation. Employs recursive chunking, cosine distance queries in pgvector, and contextual reranking.`,
      architecture: [
        'Document parsing pipeline in Python with multi-threaded OCR fallbacks',
        'PostgreSQL with pgvector for efficient high-dimensional embedding storage',
        'Streaming SSE (Server-Sent Events) API via FastAPI for real-time response tokens'
      ],
      demoUrl: '#',
      githubUrl: 'https://github.com'
    },
    velocache: {
      title: 'VeloCache — In-Memory Key-Value Storage Engine',
      tagline: 'Lightweight Redis alternative written in Rust with custom binary protocol',
      languages: ['Rust', 'Tokio', 'TCP Sockets', 'BTreeMap / DashMap'],
      metrics: ['Handles 180,000+ RPS on benchmark', 'Memory footprint under 14MB idle'],
      description: `Engineered from scratch to master lower-level memory management, concurrency models, and network protocols. Implements custom RESP-compatible serialization, LRU cache eviction, and snapshot persistence to disk.`,
      architecture: [
        'Lock-free concurrent hashing using segmented sharded memory pools',
        'Async Tokio non-blocking TCP socket listener with connection limits',
        'Append-Only File (AOF) logger for durability across crashes'
      ],
      demoUrl: '#',
      githubUrl: 'https://github.com'
    },
    devpulse: {
      title: 'DevPulse — Developer Velocity & Git Analytics',
      tagline: 'Actionable engineering telemetry, PR turnaround metrics, and code churn insights',
      languages: ['Go (Golang)', 'React', 'Tailwind CSS', 'GraphQL', 'Docker'],
      metrics: ['Processed 20,000+ commits across 50 repositories in under 3 seconds'],
      description: `Created to give engineering leads and solo developers a bird's eye view of coding momentum, identifying bottlenecks and PR review stalls with zero telemetry bloat.`,
      architecture: [
        'High-concurrency Go worker pool querying GitHub GraphQL API with rate-limit backoff',
        'SQLite with WAL mode for super-fast local metrics caching',
        'Interactive SVG heatmaps and velocity charts rendered in modern React'
      ],
      demoUrl: '#',
      githubUrl: 'https://github.com'
    }
  };

  const modalBackdrop = document.getElementById('project-modal');
  const modalContent = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openProjectModal(key) {
    const data = projectDetails[key];
    if (!data || !modalContent || !modalBackdrop) return;

    modalContent.innerHTML = `
      <div class="space-y-5">
        <div>
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full badge-fire mb-2">Detailed Architecture Breakdown</span>
          <h3 class="text-2xl md:text-3xl font-extrabold text-white">${data.title}</h3>
          <p class="text-slate-400 text-sm md:text-base mt-1">${data.tagline}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          ${data.languages.map(l => `<span class="px-2.5 py-1 text-xs font-mono rounded-md bg-slate-800 text-amber-300 border border-slate-700">${l}</span>`).join('')}
        </div>

        <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div class="text-xs uppercase tracking-wider text-orange-400 font-semibold mb-2">Key Benchmark Highlights</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200">
            ${data.metrics.map(m => `<div class="flex items-center gap-2"><span class="text-amber-400">✓</span><span>${m}</span></div>`).join('')}
          </div>
        </div>

        <div>
          <h4 class="text-base font-semibold text-white mb-2">Project Overview</h4>
          <p class="text-slate-300 text-sm leading-relaxed">${data.description}</p>
        </div>

        <div>
          <h4 class="text-base font-semibold text-white mb-2">Engineering & Architectural Decisions</h4>
          <ul class="space-y-2 text-sm text-slate-300">
            ${data.architecture.map(a => `<li class="flex items-start gap-2.5"><span class="text-amber-400 mt-1">▸</span><span>${a}</span></li>`).join('')}
          </ul>
        </div>

        <div class="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
          <a href="${data.githubUrl}" target="_blank" class="px-5 py-2.5 rounded-lg btn-primary text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Inspect Source Code
          </a>
          <button onclick="document.getElementById('project-modal').classList.add('hidden')" class="px-5 py-2.5 rounded-lg btn-secondary text-sm">
            Close Preview
          </button>
        </div>
      </div>
    `;

    modalBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    playTone(600, 'sine', 0.08);
  }

  document.querySelectorAll('.open-modal-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const proj = btn.getAttribute('data-project');
      if (proj) openProjectModal(proj);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (modalBackdrop) modalBackdrop.classList.add('hidden');
      document.body.style.overflow = '';
      playClick();
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }

  // --- STATS COUNTER ON SCROLL ---
  const statsElements = document.querySelectorAll('.stat-number');
  let statsCounted = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !statsCounted) {
        statsCounted = true;
        statsElements.forEach((stat) => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          const suffix = stat.getAttribute('data-suffix') || '';
          let count = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const interval = setInterval(() => {
            count += step;
            if (count >= target) {
              stat.textContent = target + suffix;
              clearInterval(interval);
            } else {
              stat.textContent = count + suffix;
            }
          }, 35);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats-section');
  if (statsSection) observer.observe(statsSection);

  // --- CONFETTI GENERATOR (Self-Contained) ---
  function launchConfetti() {
    const confettiCount = 80;
    const colors = ['#f97316', '#fbbf24', '#06b6d4', '#a855f7', '#f43f5e'];
    const container = document.body;

    for (let i = 0; i < confettiCount; i++) {
      const piece = document.createElement('div');
      piece.style.position = 'fixed';
      piece.style.width = `${Math.random() * 8 + 6}px`;
      piece.style.height = `${Math.random() * 6 + 6}px`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.top = '70%';
      piece.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
      piece.style.zIndex = '99999';
      piece.style.pointerEvents = 'none';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(piece);

      const vx = (Math.random() - 0.5) * 16;
      const vy = -(Math.random() * 14 + 10);
      let posX = parseFloat(piece.style.left);
      let posY = parseFloat(piece.style.top);
      let opacity = 1;
      let rotation = Math.random() * 360;

      let frame = 0;
      function updatePiece() {
        frame++;
        posX += vx * 0.1;
        posY += (vy + frame * 0.45) * 0.12;
        rotation += 5;
        opacity -= 0.012;

        piece.style.left = `${posX}%`;
        piece.style.top = `${posY}%`;
        piece.style.transform = `rotate(${rotation}deg)`;
        piece.style.opacity = `${opacity}`;

        if (opacity > 0) {
          requestAnimationFrame(updatePiece);
        } else {
          piece.remove();
        }
      }
      requestAnimationFrame(updatePiece);
    }
  }

  // --- CONTACT FORM HANDLER ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const msg = document.getElementById('contact-message')?.value.trim();

      if (!name || !email || !msg) {
        showToast('Please fill in all fields before sending! ✍️', '⚠️');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Transmitting through event horizon...
      `;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        contactForm.reset();
        launchConfetti();
        playSuccessChime();
        showToast(`Transmission received, ${name}! Shivang will respond within 24 hours 🚀`, '🎉');
      }, 900);
    });
  }

  // --- MOBILE MENU TOGGLE ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.toggle('hidden');
      playClick();
    });

    mobileMenuDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenuDrawer.classList.add('hidden');
      });
    });
  }

  // --- RESUME MODAL PREVIEW ---
  const resumeModal = document.getElementById('resume-modal');
  const openResumeBtns = document.querySelectorAll('.open-resume-btn');
  const closeResumeBtn = document.getElementById('resume-close-btn');

  openResumeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (resumeModal) {
        resumeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        playTone(650, 'sine', 0.08);
      }
    });
  });

  if (closeResumeBtn && resumeModal) {
    closeResumeBtn.addEventListener('click', () => {
      resumeModal.classList.add('hidden');
      document.body.style.overflow = '';
      playClick();
    });

    resumeModal.addEventListener('click', (e) => {
      if (e.target === resumeModal) {
        resumeModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }

})();
