// Game homages, each spoken in the fight's own language (spears, the shield, the
// two souls, Waterfall) and drawn in the same pixel style. The first half of the
// song introduces each one gently; the second half pays it off.
//   Dark Souls / Elden Ring  the boss bar with her name, phase two (72)
//   Sekiro                   two lives, posture, the 危 perilous thrust, the deathblow 忍杀 (59)
//   Smash Bros               hit-stop on the turns, the final-blow freeze (96)
//   Touhou                   spell-card declarations, the boss's magic circle, geometric danmaku
//   Deltarune                graze and TP; a full TP bar breaks an inescapable ring (87)
//   Just Shapes & Beats      the box cracks (43, 59), shatters (88): the whole screen is the arena
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const { Track, Steps } = MV;
  const R = Math.round;
  const at = T.at;

  TL.boss = new Track({ a: 0, hp: 1, lag: 1, lives: 2, posture: 0, pa: 0, tp: 0, tpa: 0, crack: 0, phase2: 0, mark: 0 });
  TL.bossName = new Steps('不死的安黛因');

  // ================================================================ Souls: the boss bar
  // hp drops at once; the yellow lag chunk follows (the Souls "damage trail")
  H.bossHp = (t, hp, o = {}) => {
    TL.boss.to(t, t + (o.dur ?? 0.06), { hp }, o.ease || 'out');
    TL.boss.to(t + (o.lagDelay ?? 0.6), t + (o.lagDelay ?? 0.6) + 0.6, { lag: hp }, 'inOut');
  };
  D.bossHud = (c, S, t) => {
    const b = S.boss;
    if (b.a > 0.001) {
      const x = 200, y = 30, w = 560, h = 10, a = b.a;
      D.text(c, S.bossName, x, y - 24, { scale: 1, alpha: a, color: b.phase2 > 0.5 ? '#ffd84a' : '#ffffff', outline: '#000000' });
      // Sekiro's lives: red beads after the name
      const nw = D.textWidth(S.bossName, { scale: 1 });
      for (let i = 0; i < 2; i++) {
        const on = b.lives > i + 0.5;
        D.rect(c, x + nw + 14 + i * 16, y - 18, 8, 8, on ? '#ff2030' : '#3a0a10', a);
        if (on) D.rect(c, x + nw + 16 + i * 16, y - 16, 2, 2, '#ffb0b0', a);
      }
      D.rect(c, x - 2, y - 2, w + 4, h + 4, '#000000', 0.75 * a);
      D.rect(c, x, y, w, h, '#24060c', a);
      D.rect(c, x, y, w * b.lag, h, '#ffd84a', a);
      const col = b.phase2 > 0.5 ? (Math.floor(t * 10) % 2 ? '#ff5a3a' : '#ff8a30') : '#c8102e';
      D.rect(c, x, y, w * b.hp, h, col, a);
      D.rect(c, x, y, w * b.hp, 2, '#ff98a0', a * 0.7);
    }
    // Sekiro's posture: fills from the centre outward, yellow -> red, flashes when full
    if (b.pa > 0.001) {
      const cx = 480, y = 50, hw = 150, p = U.clamp(b.posture), a = b.pa;
      D.rect(c, cx - hw - 2, y - 2, hw * 2 + 4, 10, '#000000', 0.75 * a);
      D.rect(c, cx - hw, y, hw * 2, 6, '#201408', a);
      const col = p >= 0.995 ? (Math.floor(t * 16) % 2 ? '#ffffff' : '#ff2020') : p > 0.8 ? '#ff3020' : p > 0.55 ? '#ff8a10' : '#ffc030';
      D.rect(c, cx - hw * p, y, hw * 2 * p, 6, col, a);
      D.rect(c, cx - 3, y - 4, 6, 14, '#ffffff', a * 0.9);
    }
    // Deltarune's TP: an orange bar down the left edge
    if (b.tpa > 0.001) {
      const x = 28, y = 170, w = 22, h = 210, p = U.clamp(b.tp), a = b.tpa;
      let gf = 0;
      for (const g of TL.grazes) { const d = t - g; if (d >= 0 && d < 0.12) gf = 1 - d / 0.12; }
      D.text(c, 'TP', x - 4, y - 40, { scale: 2, alpha: a, color: '#ff9c2a', outline: '#000000' });
      D.frame(c, x - 3, y - 3, w + 6, h + 6, 3, '#ffffff', a);
      D.rect(c, x, y, w, h, '#2a1400', a);
      D.rect(c, x, y + h * (1 - p), w, h * p, p >= 0.999 ? (Math.floor(t * 12) % 2 ? '#ffe040' : '#ff9c2a') : '#ff8a00', a);
      if (gf > 0) D.rect(c, x, y, w, h, '#ffffff', a * gf * 0.6);
      D.hud(c, p >= 0.999 ? 'MAX' : R(p * 100) + '%', x + w / 2, y + h + 12, { align: 'center', alpha: a, color: p >= 0.999 ? '#ffe040' : '#ffffff' });
    }
  };

  // ================================================================ Smash: hit-stop / freeze frame
  TL.freezes = [];
  H.freeze = (t, dur, o = {}) => {
    TL.remap(t, t + dur, () => t, false);
    TL.freezes.push({ t, dur, zoom: o.zoom ?? 0.12 });
    if (o.smash) {
      // the final-blow freeze: rays wheel round the hit, the frame burns blue-white
      TL.add({
        t0: t, t1: t + 0.0005, z: 96, screen: true,
        draw(c) {
          const u = U.clamp((MV.tReal - t) / dur), cx = o.cx ?? 480, cy = o.cy ?? 220;
          c.save();
          c.globalAlpha = 0.3 * (1 - u * 0.5); c.fillStyle = '#1040c0'; c.fillRect(0, 0, 960, 540);
          c.globalAlpha = 0.32 * (1 - u * 0.4); c.fillStyle = '#bfe0ff';
          for (let i = 0; i < 36; i++) {
            const a = (i / 36) * U.TAU + MV.tReal * 0.8, w = 0.035 + U.hash(i) * 0.04;
            c.beginPath(); c.moveTo(cx, cy);
            c.lineTo(cx + Math.cos(a - w) * 1400, cy + Math.sin(a - w) * 1400);
            c.lineTo(cx + Math.cos(a + w) * 1400, cy + Math.sin(a + w) * 1400);
            c.closePath(); if (i % 2) c.fill();
          }
          c.globalAlpha = 1; c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.strokeRect(5, 5, 950, 530);
          c.restore();
        },
      });
    }
  };
  MV.freezeZoom = (tr) => {
    for (const f of TL.freezes) if (tr >= f.t && tr < f.t + f.dur) return 1 + f.zoom * U.eOutExpo(U.clamp((tr - f.t) / 0.1));
    return 1;
  };

  // ================================================================ Sekiro: posture, 危, deathblow
  // posture climbs with every block inside a window, from `from` to `to` by the window's last block
  TL.postureWins = [];
  H.postureWindow = (t0, t1, from, to) => TL.postureWins.push({ t0, t1, from, to });
  H.buildPosture = () => {
    for (const w of TL.postureWins) {
      const hits = TL.shieldHits.filter((h) => h.t >= w.t0 && h.t < w.t1).sort((a, b) => a.t - b.t);
      hits.forEach((h, i) => {
        const base = U.lerp(w.from, w.to, (i + 1) / hits.length);
        TL.boss.to(h.t, h.t + 0.05, { posture: Math.min(w.to, base + 0.05) }, 'outExpo').to(h.t + 0.05, h.t + 0.3, { posture: base }, 'out');
      });
    }
  };
  // 危: a perilous thrust that cannot be blocked. The kanji flashes, the soul drops the
  // shield (red), the box stretches, the soul sidesteps, her spear drives straight down the
  // middle, and the soul comes back green. Needs the window [t - 0.4, t + 0.37] free of spears.
  H.peril = (t, o = {}) => {
    const dir = o.dir ?? 1, sx = L.soul[0], sy = L.soul[1], g = L.boxGreen;
    H.sfx(t - 0.55, 'Peril', 0.6);
    TL.impact(t - 0.55, { amp: 3, flash: 0.2, flashCol: [1, 0.1, 0.1], dur: 0.3 });
    TL.add({
      t0: t - 0.55, t1: t + 0.12, z: 86,
      draw(ctx, emi, tt, S) {
        const u = tt - (t - 0.55), k = Math.min(U.clamp(u / 0.05), U.clamp((t + 0.12 - tt) / 0.12));
        const sc = u < 0.07 ? 6 : 4;
        D.text(ctx, '危', S.soul.x, S.soul.y - 96 - (sc - 4) * 8, { scale: sc, align: 'center', color: '#ff1828', outline: '#000000', alpha: k, glow: emi, glowA: 0.9, shake: u < 0.18 ? 2 : 0, seed: R(tt * 40) });
      },
    });
    TL.shield.to(t - 0.38, t - 0.36, { a: 0 }, 'out');
    TL.soulCol.set(t - 0.36, 'red');
    H.box(t - 0.38, t - 0.3, { x: 372, w: 216 }, 'outExpo');
    H.soulTo(t - 0.32, t - 0.24, sx + 64 * dir, sy, 'outExpo');
    // the thrust
    const top = 160, tip = sy + 56, tF = t - 0.07, hold = t + 0.13, back = t + 0.25;
    H.sfx(t - 0.07, 'Whoosh', 0.45); H.sfx(t, 'Slam', 0.55); H.sfx(t, 'Clang', 0.35);
    H.hit(t, 1.1, { dy: 1 });
    H.lunge(t, 0.7);
    TL.add({
      t0: t - 0.32, t1: back, z: 33, kind: 'white',
      hit(tt, x, y) { if (tt < tF) return false; const yy = tipAt(tt); return Math.abs(x - sx) < 14 + 7 && y - 7 < yy && y + 7 > top; },
      draw(ctx, emi, tt) {
        if (tt < tF) { const k = U.clamp((tt - t + 0.32) / 0.1); D.spearWarn(ctx, emi, sx - 12, top, 24, tip - top, tt, k * 0.8); return; }
        D.spear(ctx, emi, sx, tipAt(tt), Math.PI / 2, { len: tipAt(tt) - top + 60, scale: 1.4, glowCol: '#ff4050', glow: 0.7 });
      },
    });
    function tipAt(tt) { return tt < t ? U.lerp(top, tip, U.eIn((tt - tF) / (t - tF))) : tt < hold ? tip : U.lerp(tip, top, U.clamp((tt - hold) / (back - hold))); }
    H.soulTo(back + 0.01, back + 0.08, sx, sy, 'outExpo');
    H.box(back + 0.01, back + 0.09, { x: g.x, w: g.w }, 'outExpo');
    TL.soulCol.set(back + 0.09, 'green');
    TL.shield.to(back + 0.09, back + 0.11, { a: 1 }, 'out');
  };
  // posture break: the bar floods, she staggers, the red deathblow mark opens on her chest
  H.postureBreak = (t) => {
    TL.boss.to(t, t + 0.04, { posture: 1 }, 'out');
    H.sfx(t, 'Clang', 0.6); H.sfx(t, 'Shock', 0.5);
    H.hit(t, 1.4, { flash: 0.4, flashCol: [1, 0.85, 0.3] });
    TL.und.to(t, t + 0.04, { lean: -0.12, shake: 6 }, 'lin').to(t + 0.04, t + 0.4, { lean: -0.05, shake: 2 }, 'out');
    TL.boss.to(t + 0.05, t + 0.2, { mark: 1 }, 'out');
    H.face(t, 14);
  };
  D.deathMark = (ctx, emi, x, y, k, t) => {
    if (k <= 0.01) return;
    const p = 1 + 0.25 * Math.sin(t * 18);
    D.rect(ctx, x - 7 * p, y - 7 * p, 14 * p, 14 * p, '#ff1020', k);
    D.rect(ctx, x - 3, y - 3, 6, 6, '#ffd0d0', k);
    if (emi) D.rect(emi, x - 20 * p, y - 20 * p, 40 * p, 40 * p, '#ff2030', 0.9 * k);
  };
  // the deathblow: big kanji, ink, the gong; the bar empties and a life goes out
  H.deathblow = (t, o = {}) => {
    H.sfx(t, 'Gong', 0.7);
    TL.boss.to(t, t + 0.05, { mark: 0, posture: 0 }, 'out').to(t, t + 0.3, { pa: 0 }, 'out');
    H.bossHp(t + 0.05, 0, { dur: 0.5, ease: 'inOut', lagDelay: 0.9 });
    TL.boss.to(t + 0.6, t + 0.9, { lives: o.lives ?? 1 }, 'inOut');
    TL.add({
      t0: t, t1: t + (o.dur ?? 1.1), z: 92, screen: true,
      draw(c, emi, tt) {
        const u = tt - t, k = U.clamp((t + (o.dur ?? 1.1) - tt) / 0.25);
        // ink splashes behind the characters
        c.save();
        for (let i = 0; i < 26; i++) {
          const a = U.hash(i * 3.7) * U.TAU, r = 60 + U.hash(i * 1.9) * 260 * U.eOutExpo(U.clamp(u / 0.18)), s = 6 + U.hash(i * 5.1) * 22;
          c.globalAlpha = k * 0.85; c.fillStyle = i % 4 ? '#000000' : '#a00010';
          c.fillRect(R(480 + Math.cos(a) * r - s / 2), R(250 + Math.sin(a) * r * 0.5 - s / 2), R(s), R(s));
        }
        c.restore();
        const sc = u < 0.05 ? 11 : 8;
        D.text(c, '忍杀', 480, 250 - sc * 8, { scale: sc, align: 'center', color: '#e8101c', outline: '#000000', alpha: k, shake: u < 0.2 ? 3 : 0, seed: R(tt * 30) });
      },
    });
  };

  // ================================================================ Touhou: spell cards
  // banner (top right), the magic circle wheeling behind her, the capture bonus at the end
  D.magicCircle = (ctx, emi, x, y, t, k, r = 150) => {
    if (k <= 0.001) return;
    const col = '#5fd8ff';
    D.pixelRing(ctx, x, y, r, 2, col, 0.75 * k);
    D.pixelRing(ctx, x, y, r * 0.82, 2, '#ffffff', 0.45 * k);
    D.pixelRing(ctx, x, y, r * 0.4, 2, col, 0.55 * k);
    ctx.save(); ctx.translate(R(x), R(y)); ctx.globalAlpha = 0.55 * k; ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (const off of [0, Math.PI]) {
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) { const a = t * 0.6 + off + (i * U.TAU) / 3; const px = Math.cos(a) * r * 0.82, py = Math.sin(a) * r * 0.82; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 8; i++) { const a = -t * 0.9 + (i * U.TAU) / 8; D.spear(ctx, null, x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), a, { len: 28, alpha: 0.85 * k }); }
    if (emi) D.pixelRing(emi, x, y, r, 6, col, 0.35 * k);
  };
  H.spell = (t0, t1, name, o = {}) => {
    H.sfx(t0, 'Spellcast', 0.6); H.sfx(t0, 'Whoosh', 0.3);
    TL.impact(t0, { amp: 4, flash: 0.25, flashCol: [0.45, 0.8, 1], ca: 2, dur: 0.35 });
    TL.add({
      t0, t1, z: 84, screen: true,
      draw(c, emi, t) {
        const inU = U.eOutExpo(U.clamp((t - t0) / 0.25)), outU = U.eIn(U.clamp((t - (t1 - 0.2)) / 0.2));
        const tw = D.textWidth(name, { scale: 2 }), w = tw + 56, y = 60;
        const x = 960 - w * inU + (w + 20) * outU;
        D.rect(c, x, y, w + 20, 40, '#000000', 0.85);
        D.rect(c, x, y, w + 20, 2, '#ffffff', 1); D.rect(c, x, y + 38, w + 20, 2, '#ffffff', 1);
        D.rect(c, x, y, 10, 40, '#e8101c', 1);
        D.text(c, name, x + 26, y + 4, { scale: 2, color: '#ffffff', outline: '#1a3a9a' });
      },
    });
    TL.add({
      t0, t1, z: -110,
      draw(ctx, emi, t, S) {
        const k = Math.min(U.clamp((t - t0) / 0.3), U.clamp((t1 - t) / 0.3));
        D.magicCircle(ctx, emi, S.und.x, S.und.y - 140, t - t0, k, o.r ?? 150);
      },
    });
    if (o.bonus !== false) {
      H.sfx(t1, 'Star', 0.5);
      H.caption(t1, t1 + 1.1, '符卡收取！', 800, 112, { scale: 2, color: '#ffd84a', screen: true, fadeIn: 0.05, glowA: 0 });
      H.caption(t1 + 0.08, t1 + 1.1, 'SPELL CARD BONUS', 800, 148, { scale: 1, color: '#ffffff', screen: true, fadeIn: 0.1, spacing: 2, glowA: 0 });
    }
  };

  // ================================================================ Deltarune: graze + TP
  // A graze is a near miss: the hazard would have hit the soul ~30 px over but did not. Detected
  // after the timeline is built (MV.late), inside the windows where TP is shown; the TP climbs
  // by each window's grazes from `from` to `to`.
  TL.grazes = [];
  TL.tpWins = [];
  H.tpWindow = (t0, t1, from, to) => TL.tpWins.push({ t0, t1, from, to });
  const NEAR = [[30, 0], [-30, 0], [0, 30], [0, -30], [21, 21], [-21, 21], [21, -21], [-21, -21]];
  MV.late.push(() => {
    for (const w of TL.tpWins) {
      const found = [];
      for (let t = w.t0; t < w.t1; t += 1 / 60) {
        const s = TL.soul.at(t);
        if (s.a < 0.5 || TL.soulCol.at(t) !== 'red') continue;
        for (const e of TL.active(t)) {
          if (!e.hit || e.harmless || e.grazed) continue;
          if (e.hit(t, s.x, s.y)) continue;
          if (NEAR.some(([dx, dy]) => e.hit(t, s.x + dx, s.y + dy))) {
            e.grazed = true;
            if (!found.length || t - found[found.length - 1] > 0.06) found.push(t);
          }
        }
      }
      found.forEach((t, i) => {
        TL.grazes.push(t);
        H.sfx(t, 'Graze', 0.32);
        TL.add({
          t0: t, t1: t + 0.16, z: 41,
          draw(ctx, emi, tt, S) {
            const u = (tt - t) / 0.16, r = 13 + u * 8;
            D.frame(ctx, S.soul.x - r, S.soul.y - r, r * 2, r * 2, 2, '#ffffff', 1 - u);
            if (emi) D.frame(emi, S.soul.x - r - 2, S.soul.y - r - 2, r * 2 + 4, r * 2 + 4, 4, '#ffffff', (1 - u) * 0.8);
          },
        });
        const v = U.lerp(w.from, w.to, (i + 1) / found.length);
        TL.boss.to(t, t + 0.08, { tp: v }, 'out');
      });
      TL.tpLog = (TL.tpLog || []).concat([{ t0: w.t0, grazes: found.length }]);
    }
  });

  // ================================================================ JSAB: cracks, shatter, the open screen
  // cracks on the box frame (k 0..1): zigzags from fixed points round the perimeter
  const CRACK = [0.07, 0.21, 0.36, 0.52, 0.66, 0.83, 0.94];
  D.cracks = (ctx, emi, b, k, t) => {
    if (k <= 0.01 || (b.draw ?? 1) < 0.99) return;
    const per = 2 * (b.w + b.h);
    CRACK.forEach((f, i) => {
      let d = f * per, x, y, nx, ny;
      if (d < b.w) { x = b.x + d; y = b.y - 2; nx = 0; ny = 1; }
      else if ((d -= b.w) < b.h) { x = b.x + b.w + 2; y = b.y + d; nx = -1; ny = 0; }
      else if ((d -= b.h) < b.w) { x = b.x + b.w - d; y = b.y + b.h + 2; nx = 0; ny = -1; }
      else { d -= b.w; x = b.x - 2; y = b.y + b.h - d; nx = 1; ny = 0; }
      D.rect(ctx, x - 3, y - 3, 6, 6, '#000000', Math.min(1, k * 1.5)); // a chip out of the frame
      let px = x, py = y;
      const segs = 2 + R(k * 3);
      for (let s = 0; s < segs; s++) {
        const side = (U.hash(i * 9 + s) - 0.5) * 2, len = 6 + 7 * k;
        const qx = px + nx * len + ny * side * 6, qy = py + ny * len + nx * side * 6;
        const n = R(Math.hypot(qx - px, qy - py) / 2);
        for (let j = 0; j <= n; j++) D.rect(ctx, U.lerp(px, qx, j / n) - 1, U.lerp(py, qy, j / n) - 1, 2, 2, '#ffffff', 0.9);
        px = qx; py = qy;
      }
    });
  };
  // the box breaks apart: frame pieces fly off spinning under gravity
  H.shatter = (t) => {
    const b = TL.box.at(t - 0.01);
    TL.box.set(t, { draw: 0 });
    TL.boss.set(t, { crack: 0 });
    H.sfx(t, 'UndBreak1', 0.7); H.sfx(t, 'UndBreak2', 0.6); H.sfx(t, 'Slam', 0.6);
    H.bigHit(t, { flash: 0.7, inv: 0.05 });
    const per = 2 * (b.w + b.h), n = 22, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (let i = 0; i < n; i++) {
      let d = ((i + 0.5) / n) * per, x, y, horiz;
      if (d < b.w) { x = b.x + d; y = b.y; horiz = 1; } else if ((d -= b.w) < b.h) { x = b.x + b.w; y = b.y + d; horiz = 0; } else if ((d -= b.h) < b.w) { x = b.x + b.w - d; y = b.y + b.h; horiz = 1; } else { d -= b.w; x = b.x; y = b.y + b.h - d; horiz = 0; }
      const ang = Math.atan2(y - cy, x - cx), v = 180 + U.hash(i * 3.1) * 260, spin = (U.hash(i * 7.7) - 0.5) * 16;
      const len = per / n;
      TL.add({
        t0: t, t1: t + 1.3, z: 42,
        draw(ctx, emi, tt) {
          const u = tt - t, px = x + Math.cos(ang) * v * u, py = y + Math.sin(ang) * v * u + 420 * u * u;
          ctx.save(); ctx.globalAlpha = 1 - u / 1.3; ctx.translate(R(px), R(py)); ctx.rotate(spin * u);
          ctx.fillStyle = '#ffffff';
          if (horiz) ctx.fillRect(-len / 2, -2.5, len, 5); else ctx.fillRect(-2.5, -len / 2, 5, len);
          ctx.restore();
        },
      });
    }
  };
  // a pulse of the screen border on a kick
  H.pulse = (t, k = 1, col = '#ffffff') =>
    TL.add({
      t0: t, t1: t + 0.3, z: 70, screen: true,
      draw(c, emi, tt) { const u = (tt - t) / 0.3; D.frame(c, 0, 0, 960, 540, R(14 * (1 - u)) + 1, col, 0.7 * k * (1 - u)); },
    });
  // a wall of spears sweeping across the screen, rows from y0 to y1, one gap round gapY;
  // tc = when the wall's front passes x = 480
  H.wall = (tc, dir, gapY, o = {}) => {
    const v = o.v ?? 1500, y0 = o.y0 ?? 300, y1 = o.y1 ?? 516, gap = o.gap ?? 40;
    const xa = dir > 0 ? -160 : 1120, xb = dir > 0 ? 1180 : -220;
    const tA = tc - Math.abs(480 - xa) / v, tB = tc + Math.abs(xb - 480) / v;
    H.sfx(tA, 'Whoosh', 0.35);
    // the telegraph: arrowheads along the entry edge
    TL.add({
      t0: tA - 0.4, t1: tA + 0.05, z: 71, screen: false,
      draw(ctx, emi, tt) {
        const k = U.clamp((tt - tA + 0.4) / 0.15), on = Math.floor(tt * 16) % 2;
        for (let y = y0; y <= y1; y += 24) {
          if (Math.abs(y - gapY) < gap) continue;
          const ex = dir > 0 ? 6 : 954;
          D.rect(ctx, ex - (dir > 0 ? 0 : 14), y - 5, 14, 10, on ? '#ff2030' : '#ffffff', k * 0.85);
        }
      },
    });
    for (let y = y0; y <= y1; y += 24) {
      if (Math.abs(y - gapY) < gap) continue;
      H.flyer(tA, tB, xa, y, xb, y, { len: 70, sfx: false });
    }
  };
  // a flower: n spears burst outward from (cx, cy); the soul (at time t) sits in a gap
  H.bloom = (t, cx, cy, n = 12, o = {}) => {
    const s = TL.soul.at(t + (o.look ?? 0.12));
    const phi = Math.atan2(s.y - cy, s.x - cx), a0 = phi + Math.PI / n, v = o.v ?? 900, far = 1300;
    H.sfx(t - (o.warn ?? 0.32), 'UndSpearAppear', 0.25);
    H.sfx(t, 'Slam', 0.35);
    TL.ring(t, cx, cy, { r0: 4, r1: 60, w: 4, dur: 0.3, color: '#ffffff' });
    for (let i = 0; i < n; i++) {
      const a = a0 + (i * U.TAU) / n;
      H.flyer(t, t + far / v, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, cx + Math.cos(a) * far, cy + Math.sin(a) * far, { len: o.len ?? 56, sfx: false, warn: o.warn ?? 0.32, warnA: 0.18, clip: o.clip });
    }
  };
})();
