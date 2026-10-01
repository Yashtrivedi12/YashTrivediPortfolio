/* ============================================================
   SIGNATURE LAYER — "Widget Canvas"
   1. Boot intro: a `flutter run` terminal that hot-reloads into the hero
   2. Showpiece: a live grid of widget tiles behind the hero
      (pointer lifts tiles, click sends a hot-reload ripple, scroll tilts the grid)
   3. Giant section numerals, double kinetic marquee, experience step-through,
      cursor labels and nav-link scramble
   ============================================================ */
(function () {
    'use strict';
    const root = document.documentElement;
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const FINE = matchMedia('(pointer: fine)').matches;
    const css = name => getComputedStyle(root).getPropertyValue(name).trim();

    /* ---------------- 1. Boot intro ---------------- */
    function boot() {
        if (REDUCED) { root.classList.remove('tm-booting'); return; }
        let repeat = false;
        try { repeat = sessionStorage.getItem('tm-booted') === '1'; sessionStorage.setItem('tm-booted', '1'); } catch (e) { }
        const lines = repeat
            ? [['$ flutter run', ''], ['⚡ Hot reload · 182ms', 'ok']]
            : [['$ flutter run --release', ''],
               ['Launching lib/main.dart on Portfolio…', 'dim'],
               ['✓ Built yash_trivedi.app', 'ok'],
               ['⚡ Hot reload · 182ms', 'ok']];
        const el = document.createElement('div');
        el.className = 'tm-boot';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = '<pre></pre><span class="skip">click / any key to skip</span>';
        const flash = document.createElement('div'); flash.className = 'tm-flash';
        document.body.append(el, flash);
        const pre = el.querySelector('pre');

        let done = false, timers = [];
        const finish = () => {
            if (done) return; done = true;
            timers.forEach(clearTimeout);
            removeEventListener('keydown', finish); el.removeEventListener('click', finish);
            let handed = false;
            const hand = () => {
                if (handed) return; handed = true;
                el.remove(); flash.remove();
                root.classList.remove('tm-booting');
                // replay the hero headline so it plays after the intro, not under it
                document.body.classList.remove('hero-played');
                void document.body.offsetWidth;
                requestAnimationFrame(() => document.body.classList.add('hero-played'));
            };
            setTimeout(hand, 1400); // in case the ticker is throttled (background tab)
            if (window.gsap && !document.hidden) {
                gsap.timeline({ onComplete: hand })
                    .to(flash, { scaleY: 1, transformOrigin: 'bottom', duration: .45, ease: 'expo.inOut' })
                    .set(el, { autoAlpha: 0 })
                    .to(flash, { scaleY: 0, transformOrigin: 'top', duration: .55, ease: 'expo.inOut' });
            } else hand();
        };
        addEventListener('keydown', finish); el.addEventListener('click', finish);

        let t = 150;
        const speed = repeat ? 12 : 18;
        lines.forEach(([text, cls], li) => {
            const row = document.createElement('div');
            if (cls) row.className = cls;
            timers.push(setTimeout(() => {
                pre.querySelector('.caret')?.remove();
                pre.appendChild(row);
                [...text].forEach((ch, i) => timers.push(setTimeout(() => {
                    row.textContent += ch;
                    if (i === text.length - 1 && li === lines.length - 1) row.insertAdjacentHTML('beforeend', ' <span class="caret"></span>');
                }, i * (li === 0 ? speed : 6))));
            }, t));
            t += (li === 0 ? text.length * speed : text.length * 6) + (repeat ? 100 : 170);
        });
        timers.push(setTimeout(finish, t + (repeat ? 120 : 280)));
        setTimeout(finish, 4000); // hard cap
    }

    /* ---------------- 2. Widget-grid showpiece ---------------- */
    function widgetGrid() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        const cv = document.createElement('canvas');
        cv.className = 'tm-widgets';
        cv.setAttribute('aria-hidden', 'true');
        hero.prepend(cv);
        const tip = document.createElement('div');
        tip.className = 'tm-reload-tip';
        tip.setAttribute('aria-hidden', 'true');
        tip.innerHTML = 'click anywhere · <b>hot reload</b>';
        hero.appendChild(tip);

        const ctx = cv.getContext('2d');
        const DPR = Math.min(devicePixelRatio || 1, 2);
        let W, H, cols, rows, cell, tiles = [], colors = {};
        let px = -9999, py = -9999, visible = true, running = false;
        const waves = [];

        const readColors = () => {
            colors = { acid: css('--acid'), ink: css('--text-hi'), violet: css('--violet-soft') };
        };
        const size = () => {
            const r = hero.getBoundingClientRect();
            W = r.width; H = r.height;
            cv.width = W * DPR; cv.height = H * DPR;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            cell = W < 700 ? 38 : 52;
            cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
            tiles = [];
            for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
                tiles.push({ x: x * cell, y: y * cell, lift: 0, glow: 0, seed: Math.random() * 6.28, kind: Math.random() });
            }
        };
        readColors(); size();
        new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        addEventListener('resize', () => { size(); });

        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top;
        });
        hero.addEventListener('pointerleave', () => { px = py = -9999; });
        hero.addEventListener('click', e => {
            if (e.target.closest('a, button')) return;
            const r = hero.getBoundingClientRect();
            waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
        });
        // one automatic reload ripple when the intro hands off
        setTimeout(() => waves.push({ x: W * .62, y: H * .45, t: 0 }), 1600);

        const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

        let last = performance.now();
        function frame(now) {
            if (!visible) { running = false; return; }
            const dt = Math.min(50, now - last) / 16.67; last = now;
            ctx.clearRect(0, 0, W, H);
            const scroll = Math.min(1, scrollY / H);
            const tiltY = scroll * 60;
            waves.forEach(w => w.t += 14 * dt);
            for (let i = waves.length - 1; i >= 0; i--) if (waves[i].t > Math.hypot(W, H)) waves.splice(i, 1);

            for (const t of tiles) {
                const cx = t.x + cell / 2, cy = t.y + cell / 2 - tiltY * (t.y / H);
                const d = Math.hypot(cx - px, cy - py);
                let target = Math.max(0, 1 - d / 190);
                for (const w of waves) {
                    const wd = Math.abs(Math.hypot(cx - w.x, cy - w.y) - w.t);
                    if (wd < 40) { target = Math.max(target, 1 - wd / 40); t.glow = Math.max(t.glow, 1 - wd / 40); }
                }
                t.lift += (target - t.lift) * 0.12 * dt;
                t.glow *= Math.pow(0.95, dt);
                const idle = 0.5 + 0.5 * Math.sin(now / 1400 + t.seed);
                const s = cell * (0.62 + t.lift * 0.22);
                const x = cx - s / 2, y = cy - s / 2 - t.lift * 6;
                ctx.globalAlpha = 0.05 + idle * 0.04 + t.lift * 0.35;
                ctx.strokeStyle = t.glow > .1 || t.lift > .5 ? colors.acid : colors.ink;
                ctx.lineWidth = 1;
                rr(x, y, s, s, s * 0.22); ctx.stroke();
                if (t.glow > .05) {
                    ctx.globalAlpha = t.glow * 0.28;
                    ctx.fillStyle = colors.acid;
                    rr(x, y, s, s, s * 0.22); ctx.fill();
                }
                // tiny "widget" glyphs on lifted tiles: a text line, a button, a toggle
                if (t.lift > 0.35) {
                    ctx.globalAlpha = t.lift * 0.8;
                    ctx.fillStyle = t.kind < .5 ? colors.acid : colors.violet;
                    if (t.kind < .33) ctx.fillRect(x + s * .2, y + s * .45, s * .6, 2);
                    else if (t.kind < .66) { rr(x + s * .22, y + s * .38, s * .56, s * .24, s * .12); ctx.fill(); }
                    else { ctx.beginPath(); ctx.arc(x + s * .5, y + s * .5, s * .14, 0, 6.28); ctx.fill(); }
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(frame);
        }
        const start = () => { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
        new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; start(); }).observe(hero);
        document.addEventListener('visibilitychange', () => { visible = !document.hidden; start(); });
        start();
    }

    /* ---------------- 3. Section numerals ---------------- */
    function numerals() {
        document.querySelectorAll('.section-head').forEach(head => {
            const tag = head.querySelector('.section-tag');
            const m = tag && tag.textContent.match(/\d{2}/);
            if (!m) return;
            const n = document.createElement('span');
            n.className = 'tm-num'; n.setAttribute('aria-hidden', 'true'); n.textContent = m[0];
            head.prepend(n);
            if (window.gsap && !REDUCED) gsap.fromTo(n, { yPercent: 30 }, {
                yPercent: -30, ease: 'none',
                scrollTrigger: { trigger: head, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    }

    /* ---------------- 4. Second marquee row, opposite direction ---------------- */
    function marqueeRow2() {
        const m = document.querySelector('.marquee');
        if (!m) return;
        const c = m.cloneNode(true);
        c.classList.add('tm-row2');
        m.after(c);
        if (REDUCED || !window.gsap) return;
        const track = c.querySelector('.marquee-track');
        track.style.animation = 'none';
        let x = null, lastY = scrollY, vel = 0;
        gsap.ticker.add(() => {
            const w = track.scrollWidth / 2;
            if (x === null) x = -w;
            vel += ((scrollY - lastY) - vel) * 0.1; lastY = scrollY;
            x += 0.6 + Math.abs(vel) * 0.35;
            if (x >= 0) x -= w;
            track.style.transform = `translate3d(${x}px,0,0)`;
        });
    }

    /* ---------------- 5. Experience step-through ---------------- */
    function experienceSteps() {
        if (REDUCED || !window.gsap || !window.ScrollTrigger) return;
        const row = document.querySelector('.exp-row');
        const items = row ? [...row.querySelectorAll('.exp-list li')] : [];
        if (!items.length) return;
        const meta = row.querySelector('.exp-meta');
        const card = row.querySelector('.exp-card');
        const count = document.createElement('span');
        count.className = 'tm-stepcount'; count.setAttribute('aria-hidden', 'true');
        meta && meta.appendChild(count);
        const rail = document.createElement('span');
        rail.className = 'tm-rail'; rail.innerHTML = '<i></i>'; rail.setAttribute('aria-hidden', 'true');
        card && card.appendChild(rail);
        const total = String(items.length).padStart(2, '0');
        const set = p => {
            const n = Math.min(items.length, Math.max(1, Math.ceil(p * items.length + .001)));
            items.forEach((li, i) => li.classList.toggle('on', i < n));
            count.innerHTML = `${String(n).padStart(2, '0')}<small>/ ${total}</small>`;
            gsap.set(rail.firstChild, { scaleY: p });
        };
        set(0);
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1025px)', () => {
            row.classList.add('tm-steps');
            const st = ScrollTrigger.create({
                trigger: row, start: 'center center', end: '+=' + items.length * 220,
                pin: true, scrub: true, refreshPriority: 1, onUpdate: s => set(s.progress)
            });
            ScrollTrigger.sort(); ScrollTrigger.refresh();
            return () => { st.kill(); row.classList.remove('tm-steps'); items.forEach(li => li.classList.add('on')); };
        });
        mm.add('(max-width: 1024px)', () => {
            row.classList.add('tm-steps');
            const st = ScrollTrigger.create({
                trigger: card, start: 'top 75%', end: 'bottom 45%', scrub: true, onUpdate: s => set(s.progress)
            });
            return () => { st.kill(); row.classList.remove('tm-steps'); };
        });
    }

    /* ---------------- 6. Cursor labels + nav scramble ---------------- */
    function micro() {
        if (!FINE || REDUCED) return;
        const ring = document.getElementById('cursorRing');
        const labels = [['.project-media', 'View'], ['.marquee', '⇆']];
        document.addEventListener('mouseover', e => {
            let label = null;
            for (const [sel, l] of labels) if (e.target.closest(sel) && !e.target.closest('button, a')) { label = l; break; }
            if (ring) ring.dataset.label = label || '';
            document.body.classList.toggle('tm-cursor-label', !!label);
        }, { passive: true });

        const glyphs = '<>/{}[]=+*01_#';
        document.querySelectorAll('.nav-link').forEach(a => {
            const orig = a.textContent;
            let raf;
            a.addEventListener('mouseenter', () => {
                cancelAnimationFrame(raf);
                let f = 0;
                const tick = () => {
                    a.textContent = [...orig].map((c, i) => i < f / 2 ? c : glyphs[(Math.random() * glyphs.length) | 0]).join('');
                    if (++f / 2 <= orig.length) raf = requestAnimationFrame(tick); else a.textContent = orig;
                };
                tick();
            });
        });
    }


    /* ---------------- 7. Finale: the name assembled from widget tiles ----------------
       Echoes the hero grid and the boot terminal: tiles fly in and snap into
       "YASH TRIVEDI" as you reach the end, scatter from the pointer, and a click
       hot-reloads them (explode → rebuild). */
    function finaleTiles() {
        const fin = document.querySelector('.tm-finale');
        if (!fin || REDUCED) return;
        fin.classList.add('tm-finale-canvas');
        const cv = document.createElement('canvas');
        fin.appendChild(cv);
        const term = document.createElement('div');
        term.className = 'tm-exit';
        term.innerHTML = '<span>$</span> build complete · <b>exit 0</b> · hover to scatter, click to hot reload';
        fin.after(term);

        const ctx = cv.getContext('2d');
        const DPR = Math.min(devicePixelRatio || 1, 2);
        let W, H, tiles = [], cell, colors, progress = 0, px = -9999, py = -9999, visible = false, running = false, burst = 0;
        const readColors = () => { colors = { acid: css('--acid'), ink: css('--text-hi'), violet: css('--violet-soft'), cyan: css('--cyan') }; };
        readColors();
        new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

        function build() {
            W = fin.clientWidth; H = Math.max(180, Math.min(420, W * 0.26));
            cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            cell = W < 700 ? 6 : 9;
            const off = document.createElement('canvas');
            off.width = W; off.height = H;
            const o = off.getContext('2d');
            let fs = H * 0.78;
            o.font = `800 ${fs}px ${getComputedStyle(root).getPropertyValue('--font-display')}`;
            const tw = o.measureText('YASH TRIVEDI').width;
            if (tw > W * 0.94) { fs *= (W * 0.94) / tw; o.font = `800 ${fs}px ${getComputedStyle(root).getPropertyValue('--font-display')}`; }
            o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
            o.fillText('YASH TRIVEDI', W / 2, H / 2);
            const data = o.getImageData(0, 0, W, H).data;
            tiles = [];
            for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
                if (data[((y + (cell >> 1)) * W + x + (cell >> 1)) * 4 + 3] > 128) {
                    const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 500;
                    tiles.push({ hx: x, hy: y, sx: x + Math.cos(a) * r, sy: y + Math.sin(a) * r - 200,
                        x: 0, y: 0, ox: 0, oy: 0, d: Math.random() * 0.35, hue: x / W });
                }
            }
        }
        build();
        addEventListener('resize', build);
        document.fonts && document.fonts.ready.then(build);

        if (window.ScrollTrigger) ScrollTrigger.create({
            trigger: fin, start: 'top 95%', end: 'center 60%', scrub: 0.6,
            onUpdate: s => { progress = s.progress; }
        });
        else progress = 1;

        fin.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
        fin.addEventListener('pointerleave', () => { px = py = -9999; });
        fin.addEventListener('click', () => { burst = 1; });

        const ease = t => 1 - Math.pow(1 - t, 4);
        function frame(now) {
            if (!visible) { running = false; return; }
            ctx.clearRect(0, 0, W, H);
            burst *= 0.94;
            const s = cell - 1.5;
            for (const t of tiles) {
                const p = ease(Math.min(1, Math.max(0, (progress - t.d) / (1 - t.d))));
                let tx = t.sx + (t.hx - t.sx) * p, ty = t.sy + (t.hy - t.sy) * p;
                const dx = tx - px, dy = ty - py, dist = Math.hypot(dx, dy);
                if (dist < 90) { const f = (1 - dist / 90) * 28; t.ox += dx / dist * f * 0.2; t.oy += dy / dist * f * 0.2; }
                if (burst > 0.02) { t.ox += (Math.random() - .5) * burst * 30; t.oy += (Math.random() - .5) * burst * 30; }
                t.ox *= 0.88; t.oy *= 0.88;
                const x = tx + t.ox, y = ty + t.oy;
                const wave = 0.5 + 0.5 * Math.sin(now / 600 - t.hue * 10);
                const disturbed = Math.min(1, Math.hypot(t.ox, t.oy) / 10);
                ctx.globalAlpha = (0.25 + 0.75 * p) * (0.55 + 0.45 * wave);
                ctx.fillStyle = disturbed > 0.3 ? colors.acid : (t.hue < 0.5 ? (wave > 0.85 ? colors.acid : colors.ink) : (wave > 0.85 ? colors.cyan : colors.ink));
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x, y, s, s, s * 0.3) : ctx.rect(x, y, s, s);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(frame);
        }
        new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible && !running) { running = true; requestAnimationFrame(frame); }
        }).observe(fin);
    }

    /* ---------------- 8. Stack tiles: deal in like cards, then idle float ---------------- */
    function stackTiles() {
        if (REDUCED || !window.gsap) return;
        const tiles = gsap.utils.toArray('.stack-tile');
        if (!tiles.length) return;
        gsap.from(tiles, {
            rotateX: -80, y: 60, opacity: 0, transformOrigin: '50% 100%',
            duration: 1.1, ease: 'expo.out', stagger: { each: 0.05, grid: 'auto', from: 'start' },
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: '.stack-grid', start: 'top 85%' }
        });
    }

    boot();
    const init = () => { widgetGrid(); numerals(); marqueeRow2(); experienceSteps(); micro(); finaleTiles(); stackTiles(); if (window.ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh()); } };
    if (document.readyState === 'complete') init(); else addEventListener('load', init);
})();
