/* ============================================================
   YASH TRIVEDI — PREMIUM PORTFOLIO
   Interaction engine: vanilla JS, transform/opacity only,
   single rAF loop, IntersectionObserver reveals.
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   0. Bootstrap & environment flags
   ------------------------------------------------------------ */
document.documentElement.classList.add('js');

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ------------------------------------------------------------
   1. Split-text — wrap every word for staggered line reveals
   ------------------------------------------------------------ */
function splitText() {
    document.querySelectorAll('[data-split]').forEach((line, lineIdx) => {
        // WebKit bug: background-clip:text on a PARENT mis-paints children
        // that have transforms (words pile up at the line origin in Safari).
        // The gradient must live on each animated word itself, so we move
        // the class from the line onto every .word-inner below.
        const hasGradient = line.classList.contains('gradient-text');
        if (hasGradient) line.classList.remove('gradient-text');

        const words = line.textContent.trim().split(/\s+/);
        line.textContent = '';
        words.forEach((word, wordIdx) => {
            const outer = document.createElement('span');
            outer.className = 'word';
            const inner = document.createElement('span');
            inner.className = hasGradient ? 'word-inner gradient-text' : 'word-inner';
            inner.textContent = word;
            inner.style.setProperty('--wd', `${lineIdx * 0.14 + wordIdx * 0.05}s`);
            outer.appendChild(inner);
            line.appendChild(outer);
            if (wordIdx < words.length - 1) line.appendChild(document.createTextNode(' '));
        });
    });
}
splitText();

/* ------------------------------------------------------------
   2. Animated counters (declared before the load sequence that
      may call runCounters immediately — avoids a TDZ crash)
   ------------------------------------------------------------ */
let countersDone = false;

function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        if (REDUCED) { el.textContent = target; return; }
        const dur = 1400;
        const t0 = performance.now();
        (function tick(now) {
            const p = clamp((now - t0) / dur, 0, 1);
            const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        })(t0);
    });
}

/* ------------------------------------------------------------
   3. Preloader → cinematic page-load sequence
   ------------------------------------------------------------ */
const preloader = document.getElementById('preloader');

function startPage() {
    if (preloader) preloader.classList.add('done');
    document.body.classList.add('loaded');
    // Hero headline words rise once the layout has settled
    setTimeout(() => {
        document.body.classList.add('hero-played');
        runCounters();
    }, REDUCED ? 0 : 350);
}

if (REDUCED) {
    document.body.classList.add('loaded', 'hero-played');
    runCounters();
} else {
    // Wait for full load, but never hold the curtain longer than 2.5s.
    // Also fire when a background/frozen tab becomes visible (timers may
    // have been throttled there, so the fallbacks alone aren't enough).
    let started = false;
    const begin = () => { if (!started) { started = true; startPage(); } };
    window.addEventListener('load', () => setTimeout(begin, 500));
    setTimeout(begin, 2500);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') setTimeout(begin, 300);
    });
}

/* ------------------------------------------------------------
   4. Scroll-reveal system — every section animates differently
   ------------------------------------------------------------ */
// Stagger children inside reveal groups
document.querySelectorAll('[data-reveal-group]').forEach(group => {
    group.querySelectorAll('[data-reveal]').forEach((el, i) => {
        el.style.setProperty('--d', `${i * 0.09}s`);
    });
});

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

// 'clip' reveals hide the element with its OWN clip-path — Chromium then
// reports an empty intersection for it, so observing it directly would
// deadlock (never intersects → never reveals). Observe an unclipped
// ancestor as a proxy and reveal the clipped children from there.
const clipProxies = new Map(); // proxy ancestor → its clip-reveal children

document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.dataset.reveal === 'clip') {
        const proxy = el.parentElement;
        if (!clipProxies.has(proxy)) clipProxies.set(proxy, []);
        clipProxies.get(proxy).push(el);
    } else {
        revealObserver.observe(el);
    }
});

if (clipProxies.size) {
    const clipObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                clipProxies.get(entry.target).forEach((el, i) => {
                    el.style.setProperty('--d', `${i * 0.14}s`);
                    el.classList.add('in-view');
                });
                clipObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });
    clipProxies.forEach((_, proxy) => clipObserver.observe(proxy));
}

/* ------------------------------------------------------------
   5. Navigation — glass state, mobile menu, active section
   ------------------------------------------------------------ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Stagger the mobile menu links
navLinks.forEach((link, i) => link.style.setProperty('--md', `${0.05 + i * 0.05}s`));

hamburger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    hamburger.setAttribute('aria-expanded', String(open));
});

navMenu.addEventListener('click', e => {
    if (e.target.closest('.nav-link')) {
        document.body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
    }
});

// Highlight the section currently in the middle of the viewport
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// Navbar scrolled state (cheap, change-guarded)
let lastScrolled = false;
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 40;
    if (scrolled !== lastScrolled) {
        lastScrolled = scrolled;
        navbar.classList.toggle('scrolled', scrolled);
    }
}, { passive: true });

/* ------------------------------------------------------------
   6. Ripple click effect (delegated)
   ------------------------------------------------------------ */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn || REDUCED) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

/* ------------------------------------------------------------
   7. Magnetic elements — buttons gravitate toward the cursor
   ------------------------------------------------------------ */
if (FINE_POINTER && !REDUCED) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        const strength = 0.32;
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

/* ------------------------------------------------------------
   8. 3D tilt cards with liquid glare
   ------------------------------------------------------------ */
if (FINE_POINTER && !REDUCED) {
    const MAX_TILT = 7; // degrees
    document.querySelectorAll('.tilt').forEach(card => {
        card.addEventListener('mouseenter', () => card.classList.add('tilting'));
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;   // 0 → 1
            const py = (e.clientY - rect.top) / rect.height;   // 0 → 1
            card.style.setProperty('--ry', `${(px - 0.5) * MAX_TILT * 2}deg`);
            card.style.setProperty('--rx', `${(0.5 - py) * MAX_TILT * 2}deg`);
            card.style.setProperty('--gx', `${px * 100}%`);
            card.style.setProperty('--gy', `${py * 100}%`);
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
}

/* ------------------------------------------------------------
   9. Master rAF loop — cursor, spotlight, parallax, progress,
      aurora morph. One loop; reads batched before writes;
      scroll-linked writes are change-guarded.
   ------------------------------------------------------------ */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const spotlight = document.getElementById('spotlight');
const progressBar = document.getElementById('scrollProgress');
const parallaxEls = [...document.querySelectorAll('[data-parallax]')];

let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
let dotX = mouseX, dotY = mouseY;
let ringX = mouseX, ringY = mouseY;
let spotX = mouseX, spotY = mouseY;
let rafActive = true;
let masterScheduled = false;
let lastPct = -1;

if (FINE_POINTER && !REDUCED) {
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.body.classList.add('cursor-active');
    }, { passive: true });

    // Grow the cursor ring over interactive targets
    document.addEventListener('mouseover', e => {
        const interactive = e.target.closest('a, button, .tilt, input, textarea');
        document.body.classList.toggle('cursor-hover', !!interactive);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-active');
    });
}

function masterLoop() {
    if (!rafActive) {
        masterScheduled = false;
        return;
    }

    /* ---- READ phase ---- */
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - innerHeight;
    const pct = docH > 0 ? scrollY / docH : 0;

    let parallaxWrites = null;
    if (!REDUCED && parallaxEls.length) {
        parallaxWrites = parallaxEls.map(el => {
            const speed = parseFloat(el.dataset.parallax) || 0;
            const rect = el.getBoundingClientRect();
            return [el, (rect.top + rect.height / 2 - innerHeight / 2) * speed];
        });
    }

    /* ---- WRITE phase ---- */
    if (FINE_POINTER && !REDUCED) {
        dotX = lerp(dotX, mouseX, 0.4);
        dotY = lerp(dotY, mouseY, 0.4);
        ringX = lerp(ringX, mouseX, 0.16);
        ringY = lerp(ringY, mouseY, 0.16);
        spotX = lerp(spotX, mouseX, 0.06);
        spotY = lerp(spotY, mouseY, 0.06);
        cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        spotlight.style.transform = `translate3d(${spotX}px, ${spotY}px, 0)`;
    }

    // Scroll-linked writes only when progress actually changed
    if (Math.abs(pct - lastPct) > 0.0005) {
        lastPct = pct;
        progressBar.style.transform = `scaleX(${pct})`;
        // Background morph — aurora slowly re-tints as you travel the page
        document.documentElement.style.setProperty('--aurora-hue', `${(pct * 45).toFixed(1)}deg`);
    }

    // Smooth parallax (writes `translate`, never fights reveal transforms)
    if (parallaxWrites) {
        parallaxWrites.forEach(([el, offset]) => {
            el.style.translate = `0 ${offset.toFixed(2)}px`;
        });
    }

    requestAnimationFrame(masterLoop);
}

masterScheduled = true;
requestAnimationFrame(masterLoop);

/* ------------------------------------------------------------
   10. Particle field — tiny glowing dust on canvas
   ------------------------------------------------------------ */
const canvas = document.getElementById('particlesCanvas');
let resumeParticles = () => { }; // reassigned once the field is built

if (canvas && !REDUCED) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['167,139,250', '34,211,238', '232,121,249', '244,243,255'];
    let particles = [];
    let W = 0, H = 0;
    let particlesScheduled = false;

    function sizeCanvas() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildParticles() {
        const count = Math.min(Math.floor((W * H) / 16000), 90);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 0.6 + Math.random() * 1.4,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.1 - 0.03,
            alpha: 0.15 + Math.random() * 0.4,
            twinkle: 0.4 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    }

    function drawParticles(t) {
        if (!rafActive) {
            particlesScheduled = false;
            return;
        }
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            // Wrap around the edges — infinite floating field
            if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
            if (p.y < -4) p.y = H + 4; else if (p.y > H + 4) p.y = -4;
            const twinkle = 0.55 + 0.45 * Math.sin(t / 1000 * p.twinkle + p.phase);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},${(p.alpha * twinkle).toFixed(3)})`;
            ctx.fill();
        }
        requestAnimationFrame(drawParticles);
    }

    sizeCanvas();
    buildParticles();
    particlesScheduled = true;
    requestAnimationFrame(drawParticles);

    // Restart only if the loop actually stopped — never double-schedule
    resumeParticles = () => {
        if (!particlesScheduled) {
            particlesScheduled = true;
            requestAnimationFrame(drawParticles);
        }
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { sizeCanvas(); buildParticles(); }, 200);
    }, { passive: true });
}

// Pause all rAF work when the tab is hidden — free the compositor.
// Guards prevent loops from multiplying across rapid hide/show cycles.
document.addEventListener('visibilitychange', () => {
    rafActive = document.visibilityState === 'visible';
    if (rafActive) {
        if (!masterScheduled) {
            masterScheduled = true;
            requestAnimationFrame(masterLoop);
        }
        resumeParticles();
    }
});

/* ------------------------------------------------------------
   11. Project modals — spring glass sheets
   ------------------------------------------------------------ */
function initModals() {
    const openers = document.querySelectorAll('.view-project-btn');
    const modals = document.querySelectorAll('.modal');

    function openModal(modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.focus();
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openers.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById(btn.dataset.modal);
            if (modal) openModal(modal);
        });
    });

    modals.forEach(modal => {
        modal.querySelector('.close-modal').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const open = document.querySelector('.modal.show');
            if (open) closeModal(open);
        }
    });
}
initModals();

/* ------------------------------------------------------------
   12. Contact form — EmailJS with graceful button states
   ------------------------------------------------------------ */
const contactForm = document.getElementById('contactForm');
let emailjsReady = false;

function ensureEmailJs() {
    if (!emailjsReady && typeof emailjs !== 'undefined') {
        emailjs.init('4KiOy1BEpD-goxZEn');
        emailjsReady = true;
    }
    return emailjsReady;
}

window.addEventListener('load', ensureEmailJs);

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const label = submitBtn.querySelector('.btn-label');
    const original = label.textContent;

    submitBtn.disabled = true;
    label.textContent = 'Sending…';

    if (!ensureEmailJs()) {
        label.textContent = 'Email service unavailable';
        setTimeout(() => { label.textContent = original; submitBtn.disabled = false; }, 3000);
        return;
    }

    emailjs.sendForm('service_v2mk28l', 'template_a90fofe', this)
        .then(() => {
            label.textContent = 'Message Sent ✓';
            contactForm.reset();
        })
        .catch(err => {
            console.error('EmailJS error:', err);
            label.textContent = 'Failed — try again';
        })
        .finally(() => {
            setTimeout(() => {
                label.textContent = original;
                submitBtn.disabled = false;
            }, 3000);
        });
});

/* ------------------------------------------------------------
   13. Footer year
   ------------------------------------------------------------ */
document.getElementById('year').textContent = new Date().getFullYear();
