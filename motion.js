/* ============================================================
   THEME + MOTION LAYER
   - Light/dark toggle with a View Transition circle from the button
   - Lenis smooth scroll synced to GSAP ScrollTrigger
   - Hero that recedes on scroll, word-mask headings, image wipes,
     velocity-driven marquee, pinned horizontal project track,
     and a finale that echoes the "YT." preloader mark.
   Everything degrades: no GSAP → page works exactly as before.
   ============================================================ */
(function () {
    'use strict';

    const root = document.documentElement;
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = 'expo.out';

    /* ---------------- 1. Theme toggle ---------------- */
    const toggle = document.getElementById('themeToggle');
    const setLabel = () => {
        if (!toggle) return;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        toggle.setAttribute('aria-label', `Switch to ${next} theme`);
    };
    const applyTheme = t => {
        root.dataset.theme = t;
        try { localStorage.setItem('theme', t); } catch (e) { }
        setLabel();
    };
    setLabel();

    if (toggle) toggle.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        if (!document.startViewTransition || REDUCED) { applyTheme(next); return; }
        const r = toggle.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        document.startViewTransition(() => applyTheme(next)).ready.then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                { duration: 900, easing: 'cubic-bezier(.87,0,.13,1)', pseudoElement: '::view-transition-new(root)' }
            );
        });
    });

    // Follow the system setting until the visitor picks one
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        let saved = null;
        try { saved = localStorage.getItem('theme'); } catch (err) { }
        if (!saved) { root.dataset.theme = e.matches ? 'light' : 'dark'; setLabel(); }
    });

    /* ---------------- 2. Motion (needs GSAP) ---------------- */
    if (REDUCED || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('tm-gsap');
    gsap.defaults({ ease: EASE, duration: 1.2 });

    // Lenis smooth scroll
    let lenis = null;
    if (window.Lenis) {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);

        // Anchor links glide instead of jumping
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: a.getAttribute('href') === '#hero' ? 0 : -100, duration: 1.4 });
        });

        // Freeze while a modal or the mobile menu is open
        const syncLock = () => {
            const locked = document.body.classList.contains('menu-open') || !!document.querySelector('.modal.show');
            locked ? lenis.stop() : lenis.start();
        };
        new MutationObserver(syncLock).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    const mm = gsap.matchMedia();

    /* Hero recedes: copy lifts away, the whole stage sinks back */
    const hero = document.querySelector('.hero');
    if (hero) {
        const tl = gsap.timeline({
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
        });
        tl.to('.hero-copy', { yPercent: -18, opacity: 0.1, ease: 'none' }, 0)
          .to('.hero-grid', { scale: 0.9, ease: 'none' }, 0)
          .to('.morph-blob', { opacity: 0.2, ease: 'none' }, 0)
          .to('.scroll-cue', { opacity: 0, ease: 'none', duration: 0.2 }, 0);
    }

    /* Section headings: word masks rise in */
    document.querySelectorAll('.section-title').forEach(h => {
        const wrap = node => {
            [...node.childNodes].forEach(n => {
                if (n.nodeType === 3 && n.textContent.trim()) {
                    const frag = document.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        const w = document.createElement('span'); w.className = 'tm-word';
                        const i = document.createElement('span'); i.textContent = part;
                        w.appendChild(i); frag.appendChild(w);
                    });
                    n.replaceWith(frag);
                } else if (n.nodeType === 1 && n.classList.contains('gradient-text')) {
                    // keep gradient on the moving element itself (Safari)
                    const w = document.createElement('span'); w.className = 'tm-word';
                    n.replaceWith(w); w.appendChild(n); n.style.display = 'inline-block';
                }
            });
        };
        wrap(h);
        const inners = h.querySelectorAll('.tm-word > *');
        gsap.from(inners, {
            yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.07,
            scrollTrigger: { trigger: h, start: 'top 85%' }
        });
    });

    /* Section tags: a light sweep of letter-spacing */
    gsap.utils.toArray('.section-tag').forEach(t => {
        gsap.from(t, { letterSpacing: '0.6em', opacity: 0, duration: 1.4, scrollTrigger: { trigger: t, start: 'top 90%' } });
    });

    /* Images: clip wipe with counter-scale */
    gsap.utils.toArray('.project-media').forEach(m => {
        const img = m.querySelector('img');
        const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 85%' } });
        tl.fromTo(m, { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' });
        if (img) tl.from(img, { scale: 1.35, duration: 1.8, clearProps: 'transform' }, 0);
    });

    /* Marquee: base drift, speeds up and skews with scroll velocity */
    const track = document.querySelector('.marquee-track');
    if (track) {
        let x = 0, vel = 0;
        const groups = track.querySelectorAll('.marquee-group');
        const setSkew = gsap.quickSetter(groups, 'skewX', 'deg');
        gsap.ticker.add(() => {
            const v = lenis ? lenis.velocity : 0;
            vel += (v - vel) * 0.1;
            const w = track.scrollWidth / 2;
            x -= 0.6 + Math.abs(vel) * 0.35;
            if (x <= -w) x += w;
            track.style.transform = `translate3d(${x}px,0,0)`;
            setSkew(gsap.utils.clamp(-12, 12, -vel * 0.6));
        });
    }

    /* Pinned horizontal project track — desktop only */
    mm.add('(min-width: 1025px)', () => {
        const grid = document.querySelector('.projects-grid');
        if (!grid) return;
        const holder = document.createElement('div');
        holder.className = 'tm-hwrap';
        grid.parentNode.insertBefore(holder, grid);
        holder.appendChild(grid);
        const bar = document.createElement('div');
        bar.className = 'tm-hprogress';
        bar.innerHTML = '<span></span>';
        holder.appendChild(bar);
        grid.classList.add('tm-hscroll');

        const dist = () => Math.max(0, grid.scrollWidth - holder.clientWidth);
        const tween = gsap.to(grid, {
            x: () => -dist(), ease: 'none',
            scrollTrigger: {
                trigger: holder, start: 'center center', end: () => '+=' + dist(),
                pin: holder.closest('.section') ? holder : true, scrub: 0.8, invalidateOnRefresh: true,
                onUpdate: s => gsap.set(bar.firstChild, { scaleX: s.progress })
            }
        });
        return () => {
            tween.scrollTrigger && tween.scrollTrigger.kill();
            tween.kill();
            gsap.set(grid, { clearProps: 'all' });
            grid.classList.remove('tm-hscroll');
            holder.parentNode.insertBefore(grid, holder);
            holder.remove();
        };
    });

    /* ===== About: scroll-scrubbed reading, icon pops, pointer spotlight ===== */
    document.querySelectorAll('.about-text p').forEach(p => {
        p.classList.add('tm-read');
        const walk = node => [...node.childNodes].forEach(n => {
            if (n.nodeType === 3) {
                const frag = document.createDocumentFragment();
                n.textContent.split(/(\s+)/).forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                    const w = document.createElement('span'); w.className = 'tm-rw'; w.textContent = part;
                    frag.appendChild(w);
                });
                n.replaceWith(frag);
            } else if (n.nodeType === 1) walk(n);
        });
        walk(p);
        const words = p.querySelectorAll('.tm-rw');
        ScrollTrigger.create({
            trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true,
            onUpdate: s => {
                const lit = Math.round(s.progress * words.length);
                words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : ''; });
            }
        });
    });

    gsap.utils.toArray('.about-card').forEach((card, i) => {
        const icon = card.querySelector('.about-card-icon');
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%' }, delay: i * 0.12 });
        if (icon) tl.from(icon, { scale: 0, rotate: -120, duration: 1.1, ease: 'back.out(2)' });
        tl.from(card.querySelectorAll('h3, p'), { y: 24, opacity: 0, stagger: 0.08, duration: 1 }, '-=0.7');
    });

    const addSpot = card => {
        const s = document.createElement('span'); s.className = 'tm-spot'; s.setAttribute('aria-hidden', 'true');
        card.appendChild(s);
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    };
    if (matchMedia('(pointer: fine)').matches) document.querySelectorAll('.about-card, .skill-card').forEach(addSpot);

    /* ===== Skills: numbered build-lines, staggered content, column drift, pill cascade ===== */
    const skillCards = gsap.utils.toArray('.skill-card');
    skillCards.forEach((card, i) => {
        const idx = document.createElement('span'); idx.className = 'tm-idx'; idx.setAttribute('aria-hidden', 'true');
        idx.textContent = String(i + 1).padStart(2, '0');
        const line = document.createElement('span'); line.className = 'tm-line'; line.setAttribute('aria-hidden', 'true');
        card.append(idx, line);
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 88%' }, delay: (i % 3) * 0.1 });
        tl.to(line, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' })
          .to(line, { scaleX: 0, transformOrigin: 'right', duration: 0.7, ease: 'expo.inOut' })
          .from(idx, { y: -12, opacity: 0, duration: 0.8 }, 0)
          .from(card.querySelectorAll('h3, p'), { y: 20, opacity: 0, stagger: 0.08, duration: 1 }, 0.2);
    });

    mm.add('(min-width: 761px)', () => {
        const grid = document.querySelector('.skills-grid');
        if (!grid) return;
        const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 3;
        const speeds = [40, -30, 55];
        skillCards.forEach((card, i) => {
            gsap.fromTo(card, { '--py': speeds[i % cols % 3] + 'px' }, {
                '--py': -speeds[i % cols % 3] + 'px', ease: 'none',
                scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
            });
        });
    });

    gsap.from('.tools-pills .pill', {
        y: 30, opacity: 0, scale: 0.8, rotation: () => gsap.utils.random(-12, 12),
        stagger: { each: 0.05, from: 'random' }, duration: 0.9, ease: 'back.out(1.8)', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.tools-pills', start: 'top 90%' }
    });

    /* Finale: the "YT." mark returns, letters assembling as you arrive */
    const footer = document.querySelector('.footer');
    if (footer) {
        const fin = document.createElement('div');
        fin.className = 'tm-finale';
        fin.setAttribute('aria-hidden', 'true');
        fin.innerHTML = 'YASH TRIVEDI'.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
        footer.parentNode.insertBefore(fin, footer);
        gsap.from(fin.children, {
            yPercent: 100, opacity: 0, stagger: { each: 0.04, from: 'center' }, duration: 1.4,
            scrollTrigger: { trigger: fin, start: 'top 95%' }
        });
    }

    // Recalculate once images/fonts settle
    addEventListener('load', () => ScrollTrigger.refresh());
})();
