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
  return { paint };
})();
