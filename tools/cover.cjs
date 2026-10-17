// Bilibili covers (16:9 and 4:3), composed with the MV's own sprites and drawing code:
//   node tools/cover.cjs [outDir] [--tag="..."]  ->  cover_16x9.png (1920x1080), cover_4x3.png (1440x1080)
// --tag: a small badge under the title (e.g. a remake credit; glyphs it may use: 重置 复刻 制作)
// One idea: she towers over the frame from below, a red glow burning round her outline and her
// eye the brightest point; her spear points at the small green soul, shield raised. Laid out for
// the feed thumbnail: big title only, nothing in the bottom strip (play count / duration overlays).
const { chromium, pageUrl, SWIFT } = require('./pw.cjs');
const fs = require('fs'), path = require('path');
(async () => {
  const args = process.argv.slice(2), tag = (args.find((a) => a.startsWith('--tag=')) || '').slice(6);
  const out = path.resolve(args.find((a) => !a.startsWith('--')) || 'dist');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: SWIFT });
  const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(pageUrl('?render=1&w=320&h=180'));
  await page.waitForFunction(() => window.MV && window.MV.ready, null, { timeout: 60000 });
  const layouts = {
    '16x9': { W: 960, H: 540, ux: 705, uy: 668, usc: 4.6, sx: 232, sy: 338, tx: 34, ty: 58, ts: 5, sub: 2 },
    '4x3': { W: 720, H: 540, ux: 578, uy: 662, usc: 4.3, sx: 150, sy: 334, tx: 26, ty: 52, ts: 4, sub: 2 },
  };
  for (const [name, L] of Object.entries(layouts)) {
    L.tag = tag;
    const url = await page.evaluate((L) => {
      const MV = window.MV, D = MV.D, U = MV.U, K = 2; // logical px -> output px
      const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
      const [wc, w] = mk(L.W * K, L.H * K), [ec, e] = mk(L.W * K, L.H * K);
      for (const c of [w, e]) c.setTransform(K, 0, 0, K, 0, 0);
      const t = 3.37; // the moment the aura and the eye flicker are sampled at
      // the night of Waterfall: deep navy, a faint red bloom high behind her head
      const g = w.createLinearGradient(0, 0, 0, L.H);
      g.addColorStop(0, '#02040c'); g.addColorStop(1, '#071230');
      w.fillStyle = g; w.fillRect(0, 0, L.W, L.H);
      const hy = L.uy - 110 * L.usc; // around her head
      const rg = w.createRadialGradient(L.ux, hy, 10, L.ux, hy, 460);
      rg.addColorStop(0, 'rgba(170,24,44,0.62)'); rg.addColorStop(1, 'rgba(170,24,44,0)');
      w.fillStyle = rg; w.fillRect(0, 0, L.W, L.H);
      D.cavern(w, e, t, { a: 0.5, rain: 0.25, drift: 0, ceiling: 1, k: 0.7 });
      const pose = { head: 0, arm: 0.95, lean: -0.035, breathe: 0, t, glow: 0.18, eye: 1.4 };
      // a few embers rising (kept sparse)
      for (let i = 0; i < 46; i++) {
        const x = U.hash(i * 3.1) * L.W, y = U.hash(i * 5.3) * L.H, s = U.hash(i) < 0.25 ? 3 : 2, c = U.hash(i * 7.7) < 0.7 ? '#ff3a20' : '#ffc040';
        D.rect(w, x, y, s, s, c, 0.35 + 0.5 * U.hash(i * 9.1)); D.rect(e, x - 3, y - 3, s + 6, s + 6, c, 0.35);
      }
      // her inside is solid black (the battle sprite is only lines; in the game the black is the
      // background): flood the outside from the edges, everything not reached is her
      const [mc, m] = mk(L.W, L.H);
      D.undyne(m, null, L.ux, L.uy, Object.assign({}, pose, { scale: L.usc, sil: '#ffffff' }));
      const id = m.getImageData(0, 0, L.W, L.H), A = id.data, out = new Uint8Array(L.W * L.H), q = [];
      // close the gaps in the line art first (dilate by r), flood, then give the r px back
      const r = 6, N = L.W * L.H, dil = (src, val) => {
        const tmp = new Uint8Array(N), dst = new Uint8Array(N);
        for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const xx = x + k; if (xx >= 0 && xx < L.W && src[y * L.W + xx] === val) v = 1; } tmp[y * L.W + x] = v; }
        for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const yy = y + k; if (yy >= 0 && yy < L.H && tmp[yy * L.W + x]) v = 1; } dst[y * L.W + x] = v; }
        return dst;
      };
      const solid = new Uint8Array(N); for (let i = 0; i < N; i++) solid[i] = A[i * 4 + 3] > 10 ? 1 : 0;
      const closed = dil(solid, 1);
      const push = (i) => { if (!out[i] && !closed[i]) { out[i] = 1; q.push(i); } };
      for (let x = 0; x < L.W; x++) { push(x); push((L.H - 1) * L.W + x); }
      for (let y = 0; y < L.H; y++) { push(y * L.W); push(y * L.W + L.W - 1); }
      while (q.length) { const i = q.pop(), x = i % L.W; if (x > 0) push(i - 1); if (x < L.W - 1) push(i + 1); if (i >= L.W) push(i - L.W); if (i < L.W * (L.H - 1)) push(i + L.W); }
      const outside = dil(out, 1);
      for (let i = 0; i < N; i++) { A[i * 4] = A[i * 4 + 1] = A[i * 4 + 2] = 0; A[i * 4 + 3] = outside[i] && !solid[i] ? 0 : 255; }
      m.putImageData(id, 0, 0);
      // a red glow burning round her outline (in place of the blocky giant shadow: it reads at
      // thumbnail size), then the aura, then her solid black body
      const [rc, rx] = mk(L.W, L.H);
      rx.drawImage(mc, 0, 0); rx.globalCompositeOperation = 'source-in'; rx.fillStyle = '#ff2438'; rx.fillRect(0, 0, L.W, L.H);
      w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.imageSmoothingEnabled = true;
      w.filter = 'blur(40px)'; w.globalAlpha = 0.45; w.drawImage(rc, 0, 0, L.W * K, L.H * K);
      w.filter = 'blur(12px)'; w.globalAlpha = 0.75; w.drawImage(rc, 0, 0, L.W * K, L.H * K);
      w.filter = 'none'; w.globalAlpha = 1; w.imageSmoothingEnabled = false; w.restore();
      D.rage(w, e, L.ux, L.uy, L.usc, t, 1.1);
      w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.drawImage(mc, 0, 0, L.W * K, L.H * K); w.restore();
      D.undyne(w, e, L.ux, L.uy, Object.assign({}, pose, { scale: L.usc }));
      const [ex, ey] = D.undyneEye(L.ux, L.uy, { scale: L.usc });
      // the eye: the brightest point of the picture
      D.eyeGlow(w, e, ex, ey, 1.35, t, L.usc / 1.8);
      D.rect(e, ex - 14, ey - 14, 28, 28, '#ff2030', 0.9);
      // the soul, alone in front of her, shield raised toward the spear that points at it
      for (const c of [w, e]) { c.save(); c.translate(L.sx, L.sy); c.scale(1.5, 1.5); }
      D.shield(w, e, 0, 0, 0, { alpha: 1, hit: 0.3, ring: 1 });
      D.soul(w, e, 0, 0, { col: 'green', scale: 1.6 });
      for (const c of [w, e]) c.restore();
      // composite: the world, then the bloom of the emissive layer
      const [fc, f] = mk(L.W * K, L.H * K);
      f.drawImage(wc, 0, 0);
      f.globalCompositeOperation = 'lighter';
      f.filter = 'blur(10px)'; f.globalAlpha = 0.9; f.drawImage(ec, 0, 0);
      f.filter = 'blur(28px)'; f.globalAlpha = 0.55; f.drawImage(ec, 0, 0);
      f.filter = 'none'; f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
      // vignette: the edges fall into the dark, the eye stays the brightest thing
      const vg = f.createRadialGradient(L.W * K * 0.55, L.H * K * 0.42, L.H * K * 0.3, L.W * K * 0.5, L.H * K * 0.5, L.W * K * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.72)');
      f.fillStyle = vg; f.fillRect(0, 0, L.W * K, L.H * K);
      // the title, top left (the duration badge sits bottom right on the site)
      f.setTransform(K, 0, 0, K, 0, 0); f.imageSmoothingEnabled = false;
      D.text(f, '不死的安黛因', L.tx, L.ty, { scale: L.ts, color: '#ffffff', outline: '#c00018' });
      if (L.tag) { // a small badge: white on a dark plate, a thin red frame
        const x = L.tx + 4, y = L.ty + 16 * L.ts + 18, tw = D.textWidth(L.tag, { scale: L.sub });
        D.rect(f, x - 2, y - 6, tw + 20, 16 * L.sub + 10, '#000000', 0.7);
        D.frame(f, x - 2, y - 6, tw + 20, 16 * L.sub + 10, 2, '#ff3a3a', 1);
        D.text(f, L.tag, x + 8, y - 1, { scale: L.sub, color: '#ffffff' });
      }
      return fc.toDataURL('image/png');
    }, L);
    const file = path.join(out, `cover_${name}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', file);
  }
  await browser.close();
})();
