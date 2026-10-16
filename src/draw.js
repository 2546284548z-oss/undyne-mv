// Pixel drawing primitives (world space = 960x540 view; the original 640x480
// battle layout sits 1:1 at +160,+30). Undyne is assembled from the sheet parts
// at 2x art scale, like the game; spears / souls at 1x.
(function () {
  const MV = window.MV, U = MV.U, G = window.MV_GLYPHS;
  const D = (MV.D = {});
  MV.VW = 960; MV.VH = 540;
  MV.PADX = 240; MV.PADY = 135; // world canvas margin around the default view
  [MV.SW, MV.SH] = [960, 540];
  MV.ART_SCALE = 2;

  const tmp = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = false;
    return [c, x];
  };
  D.tmp = tmp;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  D.bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const R = Math.round;

  // ---------------------------------------------------------------- text
  // SimSun 16 px bitmaps (8x16 latin, 16x16 CJK) — dialogue, labels
  const glyphCache = {};
  function glyph(ch, color) {
    const key = ch + color;
    if (glyphCache[key]) return glyphCache[key];
    const g = G[ch] || G['?'];
    const w = g[0], rows = g[1];
    const [c, x] = tmp(w, 16);
    x.fillStyle = color;
    for (let j = 0; j < 16; j++) for (let i = 0; i < w; i++) if ((rows[j] >> (w - 1 - i)) & 1) x.fillRect(i, j, 1, 1);
    return (glyphCache[key] = c);
  }
  D.glyph = glyph;
  D.textWidth = (s, o = {}) => {
    let w = 0;
    for (const ch of s) w += ((G[ch] || G['?'])[0] + (o.spacing || 0)) * (o.scale || 2);
    return w;
  };
  // o: color, scale (default 2), align, alpha, glow (emi ctx), shake, seed, wave, spacing, outline
  D.text = (ctx, s, x, y, o = {}) => {
    const sc = o.scale || 2, color = MV.hex6(o.color || '#ffffff');
    const w = D.textWidth(s, o);
    if (o.align === 'center') x -= w / 2;
    else if (o.align === 'right') x -= w;
    let cx = R(x), i = 0;
    y = R(y);
    for (const ch of s) {
      const g = glyph(ch, color);
      let jx = 0, jy = 0;
      if (o.shake) { jx = R(U.noise((o.seed || 0) + i * 3.1) * o.shake); jy = R(U.noise((o.seed || 0) + i * 5.7 + 9) * o.shake); }
      if (o.wave !== undefined) jy += R(Math.sin(o.wave + i * 0.8) * (o.waveAmp ?? 3));
      ctx.globalAlpha = o.alpha ?? 1;
      if (o.outline) {
        const ol = glyph(ch, o.outline);
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(ol, cx + jx + dx * sc, y + jy + dy * sc, g.width * sc, 16 * sc);
      }
      ctx.drawImage(g, cx + jx, y + jy, g.width * sc, 16 * sc);
      if (o.glow) { o.glow.globalAlpha = (o.glowA ?? 0.6) * (o.alpha ?? 1); o.glow.drawImage(g, cx + jx - 1, y + jy - 1, g.width * sc + 2, 16 * sc + 2); o.glow.globalAlpha = 1; }
      cx += (g.width + (o.spacing || 0)) * sc;
      i++;
    }
    ctx.globalAlpha = 1;
    return w;
  };
  // original HUD font (BattleFont, 5x5 glyphs in 6x6 cells) and the big damage font
  const bitmapText = (font) => (ctx, str, x, y, o = {}) => {
    const f = MV.FONTS[font], sc = o.scale || (font === 'battle' ? 2 : 1);
    const color = MV.hex6(o.color || '#ffffff');
    const adv = (f.cw + (o.spacing || 0)) * sc;
    const w = str.length * adv;
    if (o.align === 'center') x -= w / 2;
    else if (o.align === 'right') x -= w;
    let cx = R(x), i = 0;
    for (const ch of str) {
      if (ch !== ' ' && !(o.skip && o.skip(i))) {
        const g = MV.fontGlyph(font, ch, color);
        let jx = 0, jy = 0;
        if (o.shake) { jx = R(U.noise((o.seed || 0) + i * 3.1) * o.shake); jy = R(U.noise((o.seed || 0) + i * 5.7 + 9) * o.shake); }
        ctx.globalAlpha = o.alpha ?? 1;
        ctx.drawImage(g, cx + jx, R(y) + jy, f.cw * sc, f.ch * sc);
        if (o.glow) { o.glow.globalAlpha = (o.glowA ?? 0.6) * (o.alpha ?? 1); o.glow.drawImage(g, cx + jx - 1, R(y) + jy - 1, f.cw * sc + 2, f.ch * sc + 2); o.glow.globalAlpha = 1; }
      }
      cx += adv; i++;
    }
    ctx.globalAlpha = 1;
    return w;
  };
  D.hud = bitmapText('battle');
  D.dmg = bitmapText('damage');
  D.hudWidth = (s, sc = 2) => s.length * 6 * sc;

  // ---------------------------------------------------------------- shapes
  D.pixelRing = (ctx, x, y, r, w, color, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const n = Math.max(12, Math.ceil(r * 6.4));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU;
      ctx.fillRect(R(x + Math.cos(a) * r - w / 2), R(y + Math.sin(a) * r - w / 2), w, w);
    }
    ctx.globalAlpha = 1;
  };
  D.rect = (ctx, x, y, w, h, color, a = 1) => {
    if (!ctx) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.fillRect(R(x), R(y), R(w), R(h));
    ctx.globalAlpha = 1;
  };
  D.frame = (ctx, x, y, w, h, th, color, a = 1) => {
    D.rect(ctx, x, y, w, th, color, a); D.rect(ctx, x, y + h - th, w, th, color, a);
    D.rect(ctx, x, y, th, h, color, a); D.rect(ctx, x + w - th, y, th, h, color, a);
  };
  // warning zone flashing where an attack will land
  D.warn = (ctx, emi, x, y, w, h, t, color = '#ff2030') => {
    const on = Math.floor(t * 20) % 2 === 0;
    ctx.globalAlpha = on ? 1 : 0.4;
    ctx.fillStyle = color;
    ctx.fillRect(R(x), R(y), R(w), 2); ctx.fillRect(R(x), R(y + h) - 2, R(w), 2);
    ctx.fillRect(R(x), R(y), 2, R(h)); ctx.fillRect(R(x + w) - 2, R(y), 2, R(h));
    ctx.globalAlpha = on ? 0.22 : 0.08;
    ctx.fillRect(R(x), R(y), R(w), R(h));
    ctx.globalAlpha = 1;
    if (emi) { emi.globalAlpha = on ? 0.45 : 0.15; emi.fillStyle = color; emi.fillRect(R(x), R(y), R(w), R(h)); emi.globalAlpha = 1; }
  };
  D.clipRect = (ctx, x, y, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(R(x), R(y), R(w), R(h));
    ctx.clip();
  };

  // ---------------------------------------------------------------- battle box
  // b: {x,y,w,h, th, draw: 0..1 perimeter fraction, bulge: {side:[amt,u,width]}, alpha, color}
  D.box = (ctx, emi, b) => {
    const X = R(b.x), Y = R(b.y), W = R(b.w), H = R(b.h);
    const th = b.th || 4;
    const col = b.color || '#ffffff';
    const frac = b.draw ?? 1;
    if (frac <= 0 || W < 2 || H < 2) return;
    const bul = b.bulge || {};
    const off = (side, u) => {
      const q = bul[side];
      if (!q || !q[0]) return 0;
      const d = (u - q[1]) / (q[2] || 0.2);
      return q[0] * Math.exp(-d * d);
    };
    const per = 2 * (W + H), lim = frac * per;
    ctx.globalAlpha = b.alpha ?? 1;
    ctx.fillStyle = col;
    if (emi) { emi.globalAlpha = 0.12 * (b.alpha ?? 1) * (b.glow ?? 1); emi.fillStyle = col; }
    let acc = 0;
    const seg = (side, len, fn) => {
      for (let i = 0; i < len; i += 2, acc += 2) {
        if (acc > lim) return;
        const [px, py, pw, ph] = fn(i, off(side, i / len));
        ctx.fillRect(px, py, pw, ph);
        if (emi) emi.fillRect(px - 2, py - 2, pw + 4, ph + 4);
      }
    };
    seg('top', W, (i, o) => [X + i, Y - th - R(o), 2, th]);
    seg('right', H, (i, o) => [X + W + R(o), Y + i, th, 2]);
    seg('bottom', W, (i, o) => [X + W - 2 - i, Y + H + R(o), 2, th]);
    seg('left', H, (i, o) => [X - th - R(o), Y + H - 2 - i, th, 2]);
    if (frac >= 1) {
      ctx.fillRect(X - th, Y - th, th, th); ctx.fillRect(X + W, Y - th, th, th);
      ctx.fillRect(X - th, Y + H, th, th); ctx.fillRect(X + W, Y + H, th, th);
    }
    ctx.globalAlpha = 1;
    if (emi) emi.globalAlpha = 1;
  };

  // ---------------------------------------------------------------- soul
  // o: {col ('red' | 'green' | 'white'), rot, scale, alpha, aura, glow, sq}
  D.soul = (ctx, emi, x, y, o = {}) => {
    const col = o.col || 'red';
    const name = 'soul_' + col;
    const sc = o.scale || 1;
    const glowC = col === 'green' ? '#20ff40' : col === 'red' ? '#ff1020' : '#ffffff';
    if (o.aura) {
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * U.TAU + (o.t || 0) * 3;
        MV.spr(ctx, MV.sil(name, col === 'green' ? '#80ff90' : '#ff6070'), x + R(Math.cos(an) * 2), y + R(Math.sin(an) * 2), { rot: o.rot, scale: sc, alpha: 0.3 * o.aura });
      }
      if (emi) { emi.globalAlpha = 0.3 * o.aura; MV.spr(emi, MV.sil(name, glowC), x, y, { rot: o.rot, scale: sc * 1.7 }); emi.globalAlpha = 1; }
    }
    const sq = o.sq ?? 1, sx = 1 / Math.sqrt(sq), sy = sq;
    MV.spr(ctx, name, x, y, { rot: o.rot, scale: sc, alpha: o.alpha, sx, sy });
    if (emi) { emi.globalAlpha = (o.alpha ?? 1) * (o.glow ?? 0.7); MV.spr(emi, MV.sil(name, glowC), x, y, { rot: o.rot, scale: sc * 1.4, sx, sy }); emi.globalAlpha = 1; }
  };
  D.hpBar = (ctx, x, y, hp, max, a = 1) => {
    const w = R(max * 1.2), h = 21, fw = R(w * U.clamp(hp / max));
    D.rect(ctx, x, y, w, h, MV.COL.hpRed, a);
    D.rect(ctx, x, y, fw, h, MV.COL.hpYellow, a);
  };


  // ---------------------------------------------------------------- speech bubble
  // white rounded box, black text, a tail pointing at (tx, ty). lines: array of strings.
  D.bubble = (ctx, x, y, w, h, lines, o = {}) => {
    const a = o.alpha ?? 1, sc = o.scale || 1;
    const pop = o.pop ?? 1;
    const cx = x + w / 2, cy = y + h / 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(R(cx), R(cy)); ctx.scale(pop, pop); ctx.translate(-R(cx), -R(cy));
    ctx.fillStyle = o.fill || '#ffffff';
    if (o.jagged) {
      // phone-call bubble: a spiky outline like the original call-in bubbles, an ellipse round
      // (not inside) the text box so the corners of the text stay in it
      const n = Math.max(12, R((w + h) / 9));
      ctx.beginPath();
      for (let i = 0; i <= n * 2; i++) {
        const u = i / (n * 2), ang = u * U.TAU, r = i % 2 ? 1 : 1.16;
        const px = cx + Math.cos(ang) * (w / 2) * 1.18 * r, py = cy + Math.sin(ang) * (h / 2) * 1.45 * r;
        i ? ctx.lineTo(R(px), R(py)) : ctx.moveTo(R(px), R(py));
      }
      ctx.closePath();
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    } else {
      const r = 6;
      // a dark rim so the bubble still reads over white light / smoke
      ctx.fillStyle = '#000000';
      ctx.fillRect(R(x + r - 2), R(y - 2), R(w - 2 * r + 4), R(h + 4)); ctx.fillRect(R(x - 2), R(y + r - 2), R(w + 4), R(h - 2 * r + 4));
      ctx.fillStyle = o.fill || '#ffffff';
      ctx.fillRect(R(x + r), R(y), R(w - 2 * r), R(h)); ctx.fillRect(R(x), R(y + r), R(w), R(h - 2 * r));
      ctx.fillRect(R(x + 2), R(y + 2), R(w - 4), R(h - 4));
      if (o.tx !== undefined) {
        // tail: a stepped triangle toward (tx, ty) from the nearest side
        const side = o.tx < x ? -1 : 1, bx = side < 0 ? x : x + w, by = U.clamp(o.ty, y + 10, y + h - 10);
        for (let i = 0; i < 12; i++) { const k = i / 12; ctx.fillRect(R(bx + side * i * 1.2 - (side < 0 ? 2 : 0)), R(by - 6 * (1 - k)), 2, R(12 * (1 - k))); }
      }
    }
    const col = o.jagged ? '#ffffff' : o.color || '#000000';
    lines.forEach((ln, i) => D.text(ctx, ln, x + 10 * sc, y + 8 * sc + i * 18 * sc, { scale: sc, color: col }));
    ctx.restore();
  };

})();

// Undyne, spears, the green soul's shield, Waterfall backdrops, the FIGHT slash.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D;
  const R = Math.round;

  // ---------------------------------------------------------------- Undyne the Undying
  // Composed at 1x on a scratch canvas from the sheet parts on the rig offsets
  // (tools/import_assets.py fits them onto the composite), then scaled.
  // (x, y) = feet centre in world px. o: {
  //   head (0..14), arm (spear arm rotation, rad: + raises the spear), armL (rad), breathe (px),
  //   lean (rad), t (hair flicker clock), melt (0 rig | 1 | 2 sheet melt frames),
  //   sil (flat colour), alpha, scale, glow, show (part -> 0..1 visibility), flash (0..1 white),
  //   drip (0..1 liquid drips under the arms / chin), eye (0..1 eye glow) }
  const CW = 150, CH = 170, OX = 30, OY = 20; // scratch canvas, body origin inside it
  const FOOT = [54, 143]; // feet centre in body coordinates
  const PIV = { spearArm: [36, 6], armL: [9, 3] };
  const ORDER = ['hair', 'legs', 'cape', 'torso', 'armL', 'spearArm', 'head'];
  const EYE = [12, 13]; // her open eye, head coordinates
  let scratch = null;
  D.undyneParts = ORDER;
  D.undyne = (ctx, emi, x, y, o = {}) => {
    if (!scratch) scratch = D.tmp(CW, CH);
    const [c, s] = scratch;
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.clearRect(0, 0, CW, CH);
    const rig = MV.RIG_U, t = o.t || 0, show = o.show || {}, br = R(o.breathe || 0);
    if (o.melt) {
      const img = MV.part('und/melt' + (o.melt - 1));
      s.drawImage(img, OX + FOOT[0] - 52, OY + FOOT[1] - img.height);
    } else {
      for (const k of ORDER) {
        const vis = show[k] ?? 1;
        if (vis <= 0.001) continue;
        const name = k === 'head' ? 'head' + (o.head || 0) : k;
        const img = MV.part('und/' + name);
        const at = rig[k === 'head' ? 'head0' : k];
        const dy = k === 'legs' ? 0 : k === 'cape' ? R(br / 2) : br;
        s.globalAlpha = vis;
        if (k === 'spearArm' || k === 'armL') {
          const p = PIV[k], rot = k === 'spearArm' ? o.arm || 0 : o.armL || 0;
          s.save();
          s.translate(OX + at[0] + p[0], OY + at[1] + p[1] + dy);
          s.rotate(k === 'spearArm' ? rot : -rot);
          s.drawImage(img, -p[0], -p[1]);
          s.restore();
        } else if (k === 'hair') {
          // the flame ponytail flickers: 2 px columns ride a wave that grows toward the tip
          const w = img.width;
          for (let cx = 0; cx < w; cx += 2) {
            const tip = 1 - cx / w;
            const off = R(Math.sin(t * 13 + cx * 0.5) * 1.6 * tip + U.noise(t * 9 + cx) * tip);
            s.drawImage(img, cx, 0, 2, img.height, OX + at[0] + cx, OY + at[1] + dy + off, 2, img.height);
          }
        } else {
          const hx = k === 'head' ? R(Math.sin(t * 2.1) * 0.6) : 0;
          s.drawImage(img, OX + at[0] + hx, OY + at[1] + dy);
        }
      }
      s.globalAlpha = 1;
    }
    // drips: short white runs falling from the shoulders / chin (the melt starting)
    if (o.drip > 0.01 && !o.melt) {
      s.fillStyle = '#ffffff';
      for (let i = 0; i < 14; i++) {
        if (U.hash(i * 7.3) > o.drip) continue;
        const bx = R(U.lerp(20, 80, U.hash(i * 3.1))), by = R(U.lerp(50, 100, U.hash(i * 5.9)));
        const ph = (t * (0.6 + U.hash(i) * 0.8) + U.hash(i * 9.1)) % 1;
        const len = 2 + R(ph * 7);
        s.fillRect(OX + bx, OY + by + br, 1, len);
        if (ph > 0.75) s.fillRect(OX + bx, OY + by + br + len + R((ph - 0.75) * 40), 1, 1);
      }
    }
    // turning to dust: everything above the cut line is gone
    if (o.cut > 0.001) s.clearRect(0, 0, CW, OY + Math.round(143 * o.cut));
    if (o.flash > 0.001) {
      s.globalCompositeOperation = 'source-atop';
      s.globalAlpha = o.flash;
      s.fillStyle = '#ffffff';
      s.fillRect(0, 0, CW, CH);
      s.globalAlpha = 1;
      s.globalCompositeOperation = 'source-over';
    }
    const sc = o.scale || 2;
    if (o.vox > 0.01 && !o.sil) { D.voxelize(ctx, emi, c, x, y, sc, o.vox, o.vyaw || 0, o.alpha ?? 1); return; }
    const src = o.sil ? MV.tintNow(c, o.sil, 0) : c;
    const draw = (cx, img, a, scl = 1) => {
      cx.save();
      cx.globalAlpha *= a;
      cx.translate(R(x), R(y));
      if (o.lean) cx.rotate(o.lean);
      cx.scale(sc * scl * (o.flip ? -1 : 1), sc * scl);
      cx.drawImage(img, -(OX + FOOT[0]), -(OY + FOOT[1]));
      cx.restore();
    };
    draw(ctx, src, o.alpha ?? 1);
    if (emi && (o.glow ?? 0.12) > 0) draw(emi, MV.tintNow(c, o.glowCol || '#ffffff', 1), (o.alpha ?? 1) * (o.glow ?? 0.12));
    // the eye: a hot point that flares (the Undying's burning eye)
    if (o.eye > 0.01 && !o.melt) {
      const at = rig.head0, ex = x + (at[0] + EYE[0] - FOOT[0]) * sc, ey = y + (at[1] + EYE[1] + br - FOOT[1]) * sc;
      D.eyeGlow(ctx, emi, ex, ey, o.eye, t);
    }
  };
  // 2D -> 3D: the composed sprite extruded into voxels (each pixel a column `depth` deep), turned
  // by `yaw` about her vertical axis with a little perspective, painted back to front. Faces are
  // lit by how squarely they meet the camera; the black fill stays a dark navy so the form reads.
  let vox = null;
  D.voxelize = (ctx, emi, c, x, y, sc, depth, yaw, alpha) => {
    const g = c.getContext('2d').getImageData(0, 0, CW, CH).data;
    const T = Math.max(1, Math.round(depth));
    if (!vox) vox = { X: new Float32Array(120000), Y: new Float32Array(120000), Z: new Float32Array(120000), C: new Uint8Array(120000), I: new Uint32Array(120000) };
    const cy = Math.cos(yaw), sy = Math.sin(yaw), F = 520;
    const op = (px, py) => px >= 0 && py >= 0 && px < CW && py < CH && g[(py * CW + px) * 4 + 3] > 128;
    let n = 0;
    for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) {
      const i = (py * CW + px) * 4;
      if (g[i + 3] <= 128) continue;
      const white = g[i] + g[i + 1] + g[i + 2] > 300;
      const edge = !op(px - 1, py) || !op(px + 1, py);
      const X0 = px - (OX + FOOT[0]), Y0 = py - (OY + FOOT[1]);
      for (let k = -T; k <= T; k++) {
        const face = k === -T || k === T;
        if (!face && !edge) continue;
        if (n >= 120000) break;
        vox.X[n] = X0 * cy + k * sy; vox.Z[n] = -X0 * sy + k * cy; vox.Y[n] = Y0;
        // colour class: 0 white face, 1 white side, 2 dark face, 3 dark side
        vox.C[n] = (white ? 0 : 2) + (face ? 0 : 1);
        vox.I[n] = n; n++;
      }
    }
    const I = vox.I.subarray(0, n).sort((a, b) => vox.Z[b] - vox.Z[a]);
    const lf = 0.45 + 0.55 * Math.abs(cy), ls = 0.3 + 0.6 * Math.abs(sy);
    const shade = (v, l) => Math.round(v * l);
    const cols = [
      `rgb(${shade(255, lf)},${shade(255, lf)},${shade(255, Math.min(1, lf + 0.08))})`,
      `rgb(${shade(70, ls)},${shade(96, ls)},${shade(150, ls)})`,
      `rgb(${shade(22, lf + 0.3)},${shade(34, lf + 0.3)},${shade(70, lf + 0.3)})`,
      `rgb(${shade(14, ls + 0.3)},${shade(22, ls + 0.3)},${shade(48, ls + 0.3)})`,
    ];
    ctx.save(); ctx.globalAlpha = alpha;
    let last = -1;
    for (let j = 0; j < n; j++) {
      const v = I[j], s = F / (F + vox.Z[v] * sc), q = sc * s;
      if (vox.C[v] !== last) { last = vox.C[v]; ctx.fillStyle = cols[last]; }
      ctx.fillRect(Math.round(x + vox.X[v] * q), Math.round(y + vox.Y[v] * q), Math.ceil(q) + 1, Math.ceil(q) + 1);
    }
    ctx.restore();
    if (emi) {
      emi.globalAlpha = 0.07 * alpha; emi.fillStyle = '#bfe0ff';
      for (let j = 0; j < n; j += 3) { const v = I[j]; if (vox.C[v] > 1) continue; const s = F / (F + vox.Z[v] * sc), q = sc * s; emi.fillRect(Math.round(x + vox.X[v] * q) - 2, Math.round(y + vox.Y[v] * q) - 2, q + 4, q + 4); }
      emi.globalAlpha = 1;
    }
  };
  D.undyneEye = (x, y, o = {}) => {
    const rig = MV.RIG_U, sc = o.scale || 2, br = R(o.breathe || 0);
    return [x + (rig.head0[0] + EYE[0] - FOOT[0]) * sc, y + (rig.head0[1] + EYE[1] + br - FOOT[1]) * sc];
  };
  // point in world px of a body-local point (for spawning things from her hands etc.)
  D.undynePt = (x, y, bx, by, sc = 2) => [x + (bx - FOOT[0]) * sc, y + (by - FOOT[1]) * sc];
  D.eyeGlow = (ctx, emi, x, y, k, t, s = 1) => {
    const fl = 0.75 + 0.25 * Math.sin(t * 31) * U.noise(t * 7);
    D.rect(ctx, x - 2 * s, y - 2 * s, 4 * s, 4 * s, '#ffffff', Math.min(1, k));
    D.rect(ctx, x - 1 * s, y - 6 * k * s, 2 * s, 12 * k * s, '#ffe0e0', Math.min(1, k * 0.8 * fl));
    if (emi) {
      D.rect(emi, x - 6 * s, y - 6 * s, 12 * s, 12 * s, '#ff3040', Math.min(1, 0.9 * k * fl));
      D.rect(emi, x - 2 * s, y - 18 * k * s, 4 * s, 36 * k * s, '#ff6060', Math.min(1, 0.6 * k * fl));
    }
  };
  // the aura burning off her: blue flame pixels rising around the body, red embers
  D.rage = (ctx, emi, x, y, sc, t, v) => {
    const k = sc / 2, n = Math.round(70 * Math.min(1.5, v));
    for (let i = 0; i < n; i++) {
      const sp = 0.7 + U.hash(i * 3.3) * 0.9, ph = (t * sp + U.hash(i * 7.7)) % 1;
      const w = (U.hash(i * 1.9) - 0.5) * 2;
      const px = x + w * 95 * k * (1 - ph * 0.4) + Math.sin(t * 6 + i) * 4;
      const py = y - 10 * k - ph * 300 * k;
      const red = i % 7 === 0;
      const col = red ? '#ff3040' : i % 3 ? '#2a6bff' : '#9fe8ff';
      const s = red ? 2 : 2 + Math.round(U.hash(i * 4.1) * 3);
      const a = (1 - ph) * Math.min(1, v) * (red ? 1 : 0.7);
      D.rect(ctx, px, py, s, s * (red ? 1 : 3), col, a);
      if (emi) D.rect(emi, px - 3, py - 3, s + 6, s * 3 + 6, col, a * 0.6);
    }
  };

  // the normal Undyne (prologue): a whole sheet frame, feet centre at (x, y)
  D.boss = (ctx, emi, name, x, y, o = {}) => {
    const img = MV.part('boss/' + name), sc = o.scale || 2;
    MV.spr(ctx, o.sil ? MV.sil(img, o.sil) : img, x, y, { ax: 0.5, ay: 1, scale: sc, alpha: o.alpha });
    if (emi && (o.glow ?? 0.1) > 0) { emi.globalAlpha = (o.alpha ?? 1) * (o.glow ?? 0.1); MV.spr(emi, img, x, y, { ax: 0.5, ay: 1, scale: sc }); emi.globalAlpha = 1; }
  };

  // ---------------------------------------------------------------- spears
  // arrow-spear: kind 'blue' | 'red' | 'yel', dir = the way the POINT faces ('u','d','l','r'),
  // (x, y) = the spear tip
  const TIP = { d: [0.5, 1], u: [0.5, 0], r: [1, 0.5], l: [0, 0.5] };
  D.arrow = (ctx, emi, kind, dir, x, y, o = {}) => {
    const img = MV.part('spear/' + kind + '_' + dir), [ax, ay] = TIP[dir];
    const sc = o.scale || 1;
    MV.spr(ctx, o.color ? MV.sil(img, o.color) : img, x, y, { ax, ay, scale: sc, alpha: o.alpha });
    if (emi) {
      emi.globalAlpha = (o.alpha ?? 1) * (o.glow ?? 0.55);
      MV.spr(emi, MV.sil(img, kind === 'yel' ? '#ffd040' : kind === 'red' ? '#ff3030' : '#30b0ff'), x, y, { ax, ay, scale: sc * 1.25 });
      emi.globalAlpha = 1;
    }
  };
  // the long white spear of the red-soul attacks: (x, y) = tip, ang = pointing direction
  D.spear = (ctx, emi, x, y, ang, o = {}) => {
    const img = MV.part('spear/big_r'), len = o.len || img.width, sc = o.scale || 1;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.translate(R(x), R(y)); ctx.rotate(ang); ctx.scale(sc, sc);
    const src = o.color ? MV.sil(img, o.color) : img;
    // shaft is stretched to len, the head keeps its pixels (last 22 px of the sprite)
    const head = 22;
    ctx.drawImage(src, img.width - head, 0, head, img.height, -head, -img.height / 2, head, img.height);
    ctx.drawImage(src, 0, 0, img.width - head, img.height, -len, -img.height / 2, len - head, img.height);
    ctx.restore();
    if (emi) {
      emi.save(); emi.globalAlpha = (o.alpha ?? 1) * (o.glow ?? 0.35);
      emi.translate(R(x), R(y)); emi.rotate(ang); emi.scale(sc, sc);
      emi.fillStyle = o.glowCol || '#9fe8ff';
      emi.fillRect(-len, -5, len, 10);
      emi.restore();
    }
  };
  // red/white "!" warning stripe where a spear will come through
  D.spearWarn = (ctx, emi, x, y, w, h, t, a = 1) => {
    const on = Math.floor(t * 24) % 2 === 0;
    D.rect(ctx, x, y, w, h, '#ff2030', (on ? 0.35 : 0.15) * a);
    D.frame(ctx, x, y, w, h, 2, on ? '#ffffff' : '#ff4050', a);
    if (emi) D.rect(emi, x, y, w, h, '#ff2030', (on ? 0.4 : 0.15) * a);
  };

  // ---------------------------------------------------------------- green soul
  // dir: the angle the shield faces (0 = right, PI/2 = down ...), hit: 0..1 flash
  D.SHIELD_R = 24;
  D.shield = (ctx, emi, x, y, dir, o = {}) => {
    const a = o.alpha ?? 1, r = D.SHIELD_R;
    // the circle the soul is pinned in
    D.pixelRing(ctx, x, y, r + 8, 2, '#00c000', a * (o.ring ?? 1));
    if (emi) D.pixelRing(emi, x, y, r + 8, 4, '#00ff40', 0.35 * a * (o.ring ?? 1));
    // the shield: an arc of square pixels facing dir
    const hit = o.hit || 0;
    const col = hit > 0.5 ? '#ff3030' : hit > 0.01 ? '#ffffff' : '#2a6bff';
    ctx.globalAlpha = a; ctx.fillStyle = col;
    // a block dents the arc: the middle is pushed in, the arc spreads wider
    const n = 15, dent = o.dent || 0, spread = 0.72 * (1 + 0.22 * dent);
    const rr = (i) => r - dent * 6 * (1 - Math.abs(i / (n - 1) - 0.5) * 2);
    for (let i = 0; i < n; i++) {
      const an = dir + (i / (n - 1) - 0.5) * 2 * spread;
      for (let k = 0; k < 2; k++) ctx.fillRect(R(x + Math.cos(an) * (rr(i) + k * 2) - 2), R(y + Math.sin(an) * (rr(i) + k * 2) - 2), 4, 4);
    }
    ctx.globalAlpha = 1;
    if (emi) {
      emi.globalAlpha = a * (0.5 + hit * 0.5); emi.fillStyle = hit > 0.01 ? '#ffffff' : '#3080ff';
      for (let i = 0; i < n; i++) { const an = dir + (i / (n - 1) - 0.5) * 2 * spread; emi.fillRect(R(x + Math.cos(an) * (rr(i) + 1) - 4), R(y + Math.sin(an) * (rr(i) + 1) - 4), 8, 8); }
      emi.globalAlpha = 1;
    }
  };

  // ---------------------------------------------------------------- Waterfall
  // the cavern ceiling of glowing crystals (deterministic star field) + falling water
  D.cavern = (ctx, emi, t, o = {}) => {
    const a = o.a ?? 1;
    if (a <= 0.001) return;
    const W = MV.VW + MV.PADX * 2, H = MV.VH + MV.PADY * 2;
    const x0 = -MV.PADX, y0 = -MV.PADY;
    const drift = o.drift ?? 6;
    for (let i = 0; i < 260; i++) {
      const depth = 0.3 + U.hash(i * 1.7) * 0.7;
      const x = x0 + ((U.hash(i * 3.3) * W + t * drift * depth) % W);
      const y = y0 + U.hash(i * 5.1) * H * (o.ceiling ?? 0.75);
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + U.hash(i * 2.3) * 2.5) + i);
      const k = a * depth * (0.35 + 0.65 * tw) * (o.k ?? 1);
      const col = U.hash(i * 9.7) < 0.75 ? '#5fd8ff' : '#ffffff';
      const sz = U.hash(i * 4.4) < 0.12 ? 2 : 1;
      D.rect(ctx, x, y, sz * 2, sz * 2, col, k);
      if (emi && sz > 1) D.rect(emi, x - 2, y - 2, 8, 8, col, k * 0.5);
    }
    // falling water: thin vertical streaks
    if (o.rain > 0.001) {
      for (let i = 0; i < 60; i++) {
        const x = x0 + U.hash(i * 7.7) * W, sp = 380 + U.hash(i * 2.9) * 300;
        const y = y0 + ((U.hash(i * 1.3) * H + t * sp) % (H + 60)) - 60;
        D.rect(ctx, x, y, 2, 14 + U.hash(i) * 20, '#7fb8ff', o.rain * 0.35 * a);
      }
    }
  };
  // glowing echo flowers along the floor line (bridge scenes)
  D.flowers = (ctx, emi, y, t, a = 1, n = 9) => {
    if (a <= 0.001) return;
    for (let i = 0; i < n; i++) {
      const x = 80 + (i / (n - 1)) * 800 + U.hash(i * 3.7) * 40 - 20;
      const sway = R(Math.sin(t * 1.3 + i) * 2);
      const glow = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
      D.rect(ctx, x, y - 16, 2, 16, '#3a9a7a', a);
      for (const [dx, dy] of [[-4, -4], [4, -4], [0, -8], [0, 0]]) D.rect(ctx, x + sway + dx - 2, y - 22 + dy, 4, 4, '#a8e8ff', a * glow);
      D.rect(ctx, x + sway - 1, y - 23, 2, 2, '#ffffff', a);
      if (emi) D.rect(emi, x + sway - 10, y - 32, 20, 20, '#40c8ff', 0.5 * a * glow);
    }
  };

  // ---------------------------------------------------------------- FIGHT
  // the knife slash across (x, y): u = 0..1 progress
  D.slash = (ctx, emi, x, y, u, o = {}) => {
    const len = o.len || 120, ang = o.ang ?? -0.85, w = o.w || 10;
    const grow = U.eOutExpo(U.clamp(u / 0.35)), fade = 1 - U.clamp((u - 0.45) / 0.55);
    if (fade <= 0) return;
    ctx.save();
    ctx.translate(R(x), R(y)); ctx.rotate(ang);
    const l = len * grow, ww = w * fade;
    ctx.fillStyle = '#ff1818'; ctx.globalAlpha = fade;
    ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(-len / 2 + l / 2, -ww / 2); ctx.lineTo(-len / 2 + l, 0); ctx.lineTo(-len / 2 + l / 2, ww / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(R(-len / 2 + l * 0.2), -1, R(l * 0.6), 2);
    ctx.restore();
    if (emi) { emi.save(); emi.translate(R(x), R(y)); emi.rotate(ang); emi.globalAlpha = fade * 0.9; emi.fillStyle = '#ff3030'; emi.fillRect(-len / 2, -ww, l, ww * 2); emi.restore(); }
  };
  // the enemy HP bar under the damage number (grey track, green fill)
  D.enemyHp = (ctx, x, y, w, k, a = 1) => {
    D.rect(ctx, x - w / 2, y, w, 14, '#404040', a);
    D.rect(ctx, x - w / 2, y, w * U.clamp(k), 14, '#00ff00', a);
  };
})();
