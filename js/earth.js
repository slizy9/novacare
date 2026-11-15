/* NOVACARE — the Earth behind the Home cards.
   The planet is drawn here (no image to download, so it works offline): continents and oceans from
   3D noise on a sphere, ice caps, clouds, sunlight with a night side and city lights, and a thin
   blue atmosphere, over a starfield. It is drawn once per device and kept.
   Every ".space" card on the page shows its own part of the same picture, so together the cards
   complete the planet. */

const Earth = (() => {
  const KEY = 'novacare.earth.v1';
  const SIZE = 1000;
  let url = null; try { url = localStorage.getItem(KEY); } catch (e) { /* no storage */ }
  let drawing = false;

  /* value noise on a 3D lattice */
  function hash(x, y, z) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const fade = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
    const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
    return mix(mix(mix(c(0, 0, 0), c(1, 0, 0), u), mix(c(0, 1, 0), c(1, 1, 0), u), v),
      mix(mix(c(0, 0, 1), c(1, 0, 1), u), mix(c(0, 1, 1), c(1, 1, 1), u), v), w);
  }
  function fbm(x, y, z, oct) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * noise(x * f, y * f, z * f); n += a; f *= 2.02; a *= 0.5; } return s / n; }
  const smooth = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };

  /* Draw the scene row by row, yielding to the page between chunks so nothing stutters. */
  function draw() {
    return new Promise((resolve) => {
      const W = SIZE, H = SIZE; const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      // deep space and stars
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#050a18'); bg.addColorStop(1, '#0a1530');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 700; i++) { const r = hash(i, 7, 3), s = hash(i, 11, 5); g.fillStyle = `rgba(255,255,255,${0.25 + 0.75 * hash(i, 2, 9)})`; g.fillRect(r * W, s * H, s > 0.97 ? 2 : 1, s > 0.97 ? 2 : 1); }
      const cx = W * 0.5, cy = H * 0.53, R = W * 0.37;
      const img = g.getImageData(0, 0, W, H); const px = img.data;
      const L = (() => { const v = [-0.55, 0.42, 0.72]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
      const tilt = 0.4, spin = 2.1, ct = Math.cos(tilt), st = Math.sin(tilt), cs = Math.cos(spin), ss = Math.sin(spin);
      const y0 = Math.floor(cy - R), y1 = Math.ceil(cy + R); let y = y0;
      const step = () => {
        const until = Math.min(y1, y + 40);
        for (; y < until; y++) {
          for (let x = Math.floor(cx - R); x <= cx + R; x++) {
            const dx = (x - cx) / R, dy = (y - cy) / R, d2 = dx * dx + dy * dy; if (d2 > 1) continue;
            const nz = Math.sqrt(1 - d2), nx = dx, ny = -dy;
            // turn the globe a little so the view is interesting
            const ay = ny * ct - nz * st, az = ny * st + nz * ct;
            const px3 = nx * cs + az * ss, pz3 = -nx * ss + az * cs, py3 = ay;
            const e = fbm(px3 * 1.7 + 11, py3 * 1.7 + 3, pz3 * 1.7 + 7, 6);
            const lat = Math.abs(py3); const land = e > 0.53;
            let r, gg, b;
            if (land) {
              const h = smooth(0.53, 0.72, e); const dry = fbm(px3 * 3 + 40, py3 * 3, pz3 * 3, 3);
              r = mix(mix(46, 128, dry > 0.55 ? 1 : 0.15), 150, h * 0.6); gg = mix(mix(92, 112, dry > 0.55 ? 1 : 0.1), 140, h * 0.5); b = mix(mix(44, 70, dry), 110, h * 0.5);
            } else { const sh = smooth(0.4, 0.53, e); r = mix(6, 24, sh); gg = mix(32, 92, sh); b = mix(78, 150, sh); }
            const ice = smooth(0.82, 0.9, lat + (fbm(px3 * 4, py3 * 4, pz3 * 4, 3) - 0.5) * 0.12);
            r = mix(r, 236, ice); gg = mix(gg, 242, ice); b = mix(b, 248, ice);
            const cl = smooth(0.5, 0.72, fbm(px3 * 2.6 + 90, py3 * 3.2 + 20, pz3 * 2.6 + 50, 5)) * 0.92;
            r = mix(r, 245, cl); gg = mix(gg, 248, cl); b = mix(b, 252, cl);
            // sunlight, night side and city lights
            const lam = nx * L[0] + ny * L[1] + nz * L[2]; const day = smooth(-0.12, 0.4, lam); const lit = 0.07 + 0.98 * Math.max(0, lam) ** 0.8;
            r *= mix(0.06, lit, day); gg *= mix(0.06, lit, day); b *= mix(0.09, lit, day);
            if (land && day < 0.5 && cl < 0.3) { const city = noise(px3 * 90, py3 * 90, pz3 * 90); if (city > 0.78) { const k = (city - 0.78) * 4 * (1 - day * 2); r += 255 * k; gg += 190 * k; b += 90 * k; } }
            // atmosphere toward the edge
            const rim = (1 - nz) ** 2.5 * (0.35 + 0.65 * day);
            r = mix(r, 110, rim * 0.55); gg = mix(gg, 170, rim * 0.6); b = mix(b, 255, rim * 0.7);
            const i = (y * W + x) * 4; px[i] = r; px[i + 1] = gg; px[i + 2] = b; px[i + 3] = 255;
          }
        }
        if (y < y1) { setTimeout(step, 0); return; }
        g.putImageData(img, 0, 0);
        // a soft blue glow around the planet
        g.globalCompositeOperation = 'lighter';
        const glow = g.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.13);
        glow.addColorStop(0, 'rgba(90,160,255,0.45)'); glow.addColorStop(0.4, 'rgba(70,130,255,0.14)'); glow.addColorStop(1, 'rgba(60,110,255,0)');
        g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, R * 1.13, 0, Math.PI * 2); g.fill();
        g.globalCompositeOperation = 'source-over';
        resolve(c.toDataURL('image/jpeg', 0.86));
      };
      step();
    });
  }

  /* Each .space card shows the part of the picture that sits behind it. */
  function paint(root = document) {
    const cards = [...root.querySelectorAll('.space')]; if (!cards.length) return;
    if (!url) { if (!drawing) { drawing = true; draw().then((u) => { url = u; drawing = false; try { localStorage.setItem(KEY, u); } catch (e) { /* too big for storage: drawn again next time */ } paint(); }); } return; }
    const rs = cards.map((el) => el.getBoundingClientRect());
    const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
    const w = Math.max(...rs.map((r) => r.right)) - left, h = Math.max(...rs.map((r) => r.bottom)) - top;
    const s = Math.max(w, h); // keep the planet round: one square picture behind all the cards
    const ox = left - (s - w) / 2, oy = top - (s - h) / 2;
    cards.forEach((el, i) => {
      el.style.backgroundImage = `linear-gradient(rgba(6,12,30,0.58), rgba(6,12,30,0.66)), url(${url})`;
      el.style.backgroundSize = `auto, ${s}px ${s}px`;
      el.style.backgroundPosition = `0 0, ${Math.round(ox - rs[i].left)}px ${Math.round(oy - rs[i].top)}px`;
      el.style.backgroundRepeat = 'no-repeat';
    });
  }
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => paint(), 120); });

  /* ---------- the spinning Earth on the sign-in screen ----------
     The same planet, built once as a flat map (land, ice, clouds, city lights) from the same noise,
     then wrapped onto a ball every frame. The sun stays still while the planet turns underneath it,
     and the clouds drift a little faster than the ground. Nothing to download: it works offline. */
  const TW = 1024, TH = 512, S = 480; // map size, ball size in pixels
  let tex = null, texBusy = false, ball = null, raf = 0, last = 0;
  const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildMap() {
    return new Promise((resolve) => {
      const day = new Uint8ClampedArray(TW * TH * 3), cloud = new Uint8ClampedArray(TW * TH), city = new Uint8ClampedArray(TW * TH);
      let y = 0;
      const step = () => {
        const until = Math.min(TH, y + 24);
        for (; y < until; y++) {
          const lat = Math.PI / 2 - ((y + 0.5) / TH) * Math.PI; const cl0 = Math.cos(lat), py3 = Math.sin(lat);
          for (let x = 0; x < TW; x++) {
            const lon = ((x + 0.5) / TW) * Math.PI * 2; const px3 = cl0 * Math.cos(lon), pz3 = cl0 * Math.sin(lon);
            const e = fbm(px3 * 1.7 + 11, py3 * 1.7 + 3, pz3 * 1.7 + 7, 6); const land = e > 0.53; let r, g, b;
            if (land) {
              const h = smooth(0.53, 0.72, e); const dry = fbm(px3 * 3 + 40, py3 * 3, pz3 * 3, 3);
              r = mix(mix(46, 128, dry > 0.55 ? 1 : 0.15), 150, h * 0.6); g = mix(mix(92, 112, dry > 0.55 ? 1 : 0.1), 140, h * 0.5); b = mix(mix(44, 70, dry), 110, h * 0.5);
            } else { const sh = smooth(0.4, 0.53, e); r = mix(6, 24, sh); g = mix(32, 92, sh); b = mix(78, 150, sh); }
            const ice = smooth(0.82, 0.9, Math.abs(py3) + (fbm(px3 * 4, py3 * 4, pz3 * 4, 3) - 0.5) * 0.12);
            const i = y * TW + x;
            day[i * 3] = mix(r, 236, ice); day[i * 3 + 1] = mix(g, 242, ice); day[i * 3 + 2] = mix(b, 248, ice);
            const cl = smooth(0.5, 0.72, fbm(px3 * 2.6 + 90, py3 * 3.2 + 20, pz3 * 2.6 + 50, 5)) * 0.92;
            cloud[i] = cl * 255;
            if (land && !ice) { const c = noise(px3 * 90, py3 * 90, pz3 * 90); if (c > 0.78) city[i] = Math.min(255, (c - 0.78) * 4 * 255); }
          }
        }
        if (y < TH) { setTimeout(step, 0); return; }
        resolve({ day, cloud, city });
      };
      step();
    });
  }

  /* For each pixel of the ball: where it looks on the map (before turning) and how the sun lights it. */
  function buildBall() {
    const R = S / 2 - 1, cx = S / 2, cy = S / 2;
    const L = (() => { const v = [-0.62, 0.38, 0.69]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
    const tilt = 0.32, roll = -0.41, ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
    const pix = [], u = [], v = [], light = [], night = [], rim = [], alpha = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R, d = Math.sqrt(dx * dx + dy * dy); if (d > 1 + 1.2 / R) continue;
      const k = Math.min(1, d); const nx = k === d ? dx : dx / d * k, ny0 = k === d ? dy : dy / d * k;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny0 * ny0)), ny = -ny0;
      // the planet's axis leans toward us (tilt) and sideways (roll), like the real 23° axial tilt
      const rx = nx * cr - ny * sr, ry = nx * sr + ny * cr;
      const ay = ry * ct - nz * st, az = ry * st + nz * ct;
      const lat = Math.asin(Math.max(-1, Math.min(1, ay))), lon = Math.atan2(az, rx);
      const lam = nx * L[0] + ny * L[1] + nz * L[2]; const dayk = smooth(-0.12, 0.4, lam); const lit = 0.07 + 0.98 * Math.max(0, lam) ** 0.8;
      pix.push((y * S + x) * 4); u.push(((lon / (Math.PI * 2)) + 1) % 1 * TW); v.push(Math.min(TH - 1, Math.floor((0.5 - lat / Math.PI) * TH)));
      light.push(mix(0.06, lit, dayk)); night.push(dayk < 0.5 ? 1 - dayk * 2 : 0); rim.push((1 - nz) ** 2.5 * (0.35 + 0.65 * dayk));
      alpha.push(Math.max(0, Math.min(1, (1 - d) * R + 0.5)) * 255);
    }
    return { pix: Int32Array.from(pix), u: Float32Array.from(u), v: Int32Array.from(v), light: Float32Array.from(light), night: Float32Array.from(night), rim: Float32Array.from(rim), alpha: Uint8ClampedArray.from(alpha) };
  }

  function frame(img, turn) {
    const px = img.data, { pix, u, v, light, night, rim, alpha } = ball, { day, cloud, city } = tex;
    const g0 = turn * TW, c0 = turn * TW * 1.12; // the clouds drift a little faster
    for (let j = 0; j < pix.length; j++) {
      const row = v[j] * TW;
      const ti = row + (((u[j] + g0) | 0) % TW), ci = row + (((u[j] + c0) | 0) % TW);
      const cl = cloud[ci] / 255;
      let r = day[ti * 3] + (245 - day[ti * 3]) * cl, g = day[ti * 3 + 1] + (248 - day[ti * 3 + 1]) * cl, b = day[ti * 3 + 2] + (252 - day[ti * 3 + 2]) * cl;
      const li = light[j]; r *= li; g *= li; b *= li * (li < 0.1 ? 1.4 : 1);
      if (night[j] && city[ti] && cl < 0.3) { const k = (city[ti] / 255) * night[j]; r += 255 * k; g += 190 * k; b += 90 * k; }
      const m = rim[j]; r += (110 - r) * m * 0.55; g += (170 - g) * m * 0.6; b += (255 - b) * m * 0.7;
      const o = pix[j]; px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = alpha[j];
    }
  }

  let stars = null;
  function starfield() {
    if (stars) return stars;
    const c = document.createElement('canvas'); c.width = c.height = 360; const g = c.getContext('2d');
    for (let i = 0; i < 140; i++) { const r = hash(i, 5, 1), s = hash(i, 9, 4); g.fillStyle = `rgba(255,255,255,${0.2 + 0.8 * hash(i, 3, 8)})`; const z = s > 0.96 ? 2 : 1; g.fillRect(Math.floor(r * 360), Math.floor(s * 360), z, z); }
    return (stars = c.toDataURL('image/png'));
  }

  /** Start (or keep) the spinning Earth on every ".earth-spin" canvas in the page. */
  function spin(root = document) {
    const canvases = [...root.querySelectorAll('canvas.earth-spin')]; if (!canvases.length) return;
    canvases.forEach((c) => { const box = c.closest('.auth-earth'); if (box && !box.dataset.stars) { box.dataset.stars = '1'; box.style.setProperty('--stars', `url(${starfield()})`); } });
    if (!tex) {
      if (!texBusy) { texBusy = true; buildMap().then((m) => { tex = m; ball = ball || buildBall(); texBusy = false; spin(); }); }
      return;
    }
    const t0 = performance.now();
    const draw = (now) => {
      const live = [...document.querySelectorAll('canvas.earth-spin')];
      if (!live.length) { raf = 0; return; } // the sign-in screen is gone: stop
      if (now - last >= 33 || !last) { // about 30 frames a second is smooth enough and saves battery
        last = now; const turn = ((now / 90000) % 1); // one full turn every 90 seconds
        live.forEach((c) => {
          if (c.width !== S) { c.width = S; c.height = S; }
          const g = c.getContext('2d'); if (!c._img) c._img = g.createImageData(S, S);
          frame(c._img, turn); g.putImageData(c._img, 0, 0); c.classList.add('on');
        });
      }
      if (!still() && !document.hidden) raf = requestAnimationFrame(draw); else raf = 0;
    };
    if (!raf) { last = 0; draw(t0); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) spin(); });
  return { paint, spin };
})();
