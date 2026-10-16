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

  // windows that need a snapshot of a whole frame (main.js renders them first)
  TL.snaps = [];
  TL.cubes = [];
  // the cube turn (see post.js): the frame at t0 rotates away, the live picture turns in
  H.cube = (t0, dur = 0.5) => {
    TL.cubes.push({ t0, t1: t0 + dur });
    H.sfx(t0, 'Whoosh', 0.55); H.sfx(t0 + dur * 0.5, 'Rotate', 0.4);
  };
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
      const x = 200, y = 32, w = 560, h = 10, a = b.a;
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

  // Sekiro's posture, drawn in the world right above the battle box (where the eye already is):
  // fills from the centre outward, yellow -> red, flashes when full
  D.posture = (ctx, emi, box, b, t) => {
    if (b.pa <= 0.001 || (box.draw ?? 1) < 0.5) return;
    const cx = box.x + box.w / 2, y = box.y - 22, hw = Math.max(70, box.w / 2 + 10), p = U.clamp(b.posture), a = b.pa;
    D.rect(ctx, cx - hw - 2, y - 2, hw * 2 + 4, 9, '#000000', 0.8 * a);
    D.rect(ctx, cx - hw, y, hw * 2, 5, '#201408', a);
    const col = p >= 0.995 ? (Math.floor(t * 16) % 2 ? '#ffffff' : '#ff2020') : p > 0.8 ? '#ff3020' : p > 0.55 ? '#ff8a10' : '#ffc030';
    D.rect(ctx, cx - hw * p, y, hw * 2 * p, 5, col, a);
    D.rect(ctx, cx - 2, y - 3, 4, 11, '#ffffff', a * 0.9);
    if (emi && p > 0.8) D.rect(emi, cx - hw * p, y - 3, hw * 2 * p, 11, col, a * 0.5 * (p - 0.8) * 5);
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
    // a parried spear lands when it strikes her (h.tA) and weighs four blocks
    for (const w of TL.postureWins) {
      const hits = TL.shieldHits.filter((h) => h.t >= w.t0 && h.t < w.t1).map((h) => ({ t: h.deflect ? h.tA : h.t, w: h.deflect ? 4 : 1, d: h.deflect })).sort((a, b) => a.t - b.t);
      const W = hits.reduce((a, h) => a + h.w, 0);
      let acc = 0;
      for (const h of hits) {
        acc += h.w;
        const base = U.lerp(w.from, w.to, acc / W);
        TL.boss.to(h.t, h.t + 0.05, { posture: Math.min(w.to, base + (h.d ? 0.1 : 0.05)) }, 'outExpo').to(h.t + 0.05, h.t + (h.d ? 0.45 : 0.3), { posture: base }, 'out');
      }
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
      t0: t - 0.55, t1: t + 0.12, z: 86, screen: !!o.screen,
      draw(ctx, emi, tt, S) {
        const u = tt - (t - 0.55), k = Math.min(U.clamp(u / 0.05), U.clamp((t + 0.12 - tt) / 0.12));
        const sc = (o.screen ? 6 : 4) + (u < 0.07 ? 2 : 0);
        const x = o.screen ? 270 : S.soul.x, y = (o.screen ? 190 : S.soul.y - 96) - (sc - 4) * 8;
        D.text(ctx, '危', x, y, { scale: sc, align: 'center', color: '#ff1828', outline: '#000000', alpha: k, glow: emi, glowA: 0.9, shake: u < 0.18 ? 2 : 0, seed: R(tt * 40) });
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
        D.text(c, '忍杀', 480, 318 - sc * 8, { scale: sc, align: 'center', color: '#e8101c', outline: '#000000', alpha: k, shake: u < 0.2 ? 3 : 0, seed: R(tt * 30) });
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
  // ================================================================ 3D: the screen shatters like glass
  // The frame just before t is cut into shards (radial cracks x rings round the box); they hang
  // a moment as cracks, then tumble toward the camera in perspective and fall away, showing the
  // live picture behind. Each shard is the snapshot mapped onto its moving triangle.
  H.glass = (t, o = {}) => {
    const ts = t - 1 / 60, dur = o.dur ?? 1.35, cx = o.cx ?? 480, cy = o.cy ?? 330;
    TL.snaps.push({ t0: t, t1: t + dur, ts });
    H.sfx(t, 'Shock', 0.5);
    const rnd = U.rng(77), rays = 15, rings = [0, 70, 160, 290, 460, 900];
    const A = [];
    for (let i = 0; i < rays; i++) A.push((i / rays) * U.TAU + (rnd() - 0.5) * 0.25);
    const P = rings.map((r, j) => A.map((a) => { const rr = j ? r * (0.85 + rnd() * 0.3) : 0; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }));
    const tris = [];
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < rays; i++) {
      const i2 = (i + 1) % rays, a = P[j][i], b = P[j][i2], c = P[j + 1][i2], d = P[j + 1][i];
      if (j === 0) tris.push([a, c, d]); else { tris.push([a, b, c]); tris.push([a, c, d]); }
    }
    const shards = tris.map((tr, k) => {
      const g = [(tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3];
      const dx = g[0] - cx, dy = g[1] - cy, dl = Math.hypot(dx, dy) + 1e-3;
      return { tr, g, d: [dx / dl, dy / dl], v: 120 + rnd() * 260, vz: 500 + rnd() * 700, spin: (rnd() - 0.5) * 9, tumble: 3 + rnd() * 7, psi: rnd() * U.TAU, delay: 0.06 + (dl / 900) * 0.18 };
    });
    TL.add({
      t0: t, t1: t + dur, z: 86, screen: true,
      draw(c, emi, tt) {
        const img = MV.snapCached(ts);
        if (!img) return;
        const u0 = tt - t, f = 640;
        const order = shards.slice().sort((p, q) => q.delay - p.delay);
        for (const s of order) {
          const u = Math.max(0, u0 - s.delay);
          const z = -s.vz * u, k = f / Math.max(80, f + z);
          const pos = [s.g[0] + s.d[0] * s.v * u, s.g[1] + s.d[1] * s.v * u + 380 * u * u];
          const th = s.spin * u, ph = s.tumble * u, ca = Math.cos(th), sa = Math.sin(th), cp = Math.cos(ph);
          const cps = Math.cos(s.psi), sps = Math.sin(s.psi);
          const q = s.tr.map(([x, y]) => {
            let lx = x - s.g[0], ly = y - s.g[1];
            // tumble: squash along a fixed axis (a turn about it), then spin in the screen plane
            const ax = lx * cps + ly * sps, ay = -lx * sps + ly * cps;
            const bx = ax * cp, by = ay;
            lx = bx * cps - by * sps; ly = bx * sps + by * cps;
            const rx = lx * ca - ly * sa, ry = lx * sa + ly * ca;
            return [480 + (pos[0] + rx - 480) * k, 270 + (pos[1] + ry - 270) * k];
          });
          const alpha = U.clamp(1 - (u0 - 0.75) / 0.6);
          if (alpha <= 0) continue;
          // affine map source triangle -> destination triangle
          const [p0, p1, p2] = s.tr, [q0, q1, q2] = q;
          const den = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
          if (Math.abs(den) < 1e-6) continue;
          const ma = ((q1[0] - q0[0]) * (p2[1] - p0[1]) - (q2[0] - q0[0]) * (p1[1] - p0[1])) / den;
          const mc = ((q2[0] - q0[0]) * (p1[0] - p0[0]) - (q1[0] - q0[0]) * (p2[0] - p0[0])) / den;
          const mb = ((q1[1] - q0[1]) * (p2[1] - p0[1]) - (q2[1] - q0[1]) * (p1[1] - p0[1])) / den;
          const md = ((q2[1] - q0[1]) * (p1[0] - p0[0]) - (q1[1] - q0[1]) * (p2[0] - p0[0])) / den;
          const me = q0[0] - ma * p0[0] - mc * p0[1], mf = q0[1] - mb * p0[0] - md * p0[1];
          c.save();
          c.globalAlpha = alpha;
          c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); c.closePath(); c.clip();
          c.setTransform(ma, mb, mc, md, me, mf);
          c.drawImage(img, 0, 0, img.width, img.height, 0, 0, 960, 540);
          c.setTransform(1, 0, 0, 1, 0, 0);
          // light catching the tilted glass
          const lit = (1 - Math.abs(cp)) * 0.6 + (u0 < 0.08 ? 0.15 : 0);
          if (lit > 0.01) { c.fillStyle = cp > 0 ? '#ffffff' : '#000000'; c.globalAlpha = alpha * lit * (cp > 0 ? 0.7 : 0.5); c.fill(); }
          c.restore();
          c.save(); c.globalAlpha = alpha * (u0 < 0.1 ? 1 : 0.7); c.strokeStyle = '#e8f4ff'; c.lineWidth = u0 < 0.1 ? 2 : 1;
          c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); c.closePath(); c.stroke(); c.restore();
        }
      },
    });
  };

  // ================================================================ 3D: first person behind the shield
  // The camera dives into the soul: the screen becomes its point of view. Her face hangs at the
  // vanishing point, her eye burning; every spear of the window comes straight at the lens out of
  // the dark and meets the shield arc at the edge of the view. An iris opens from the soul at t0
  // and closes back into it at t1, where the flat 2D picture takes over again.
  H.firstPerson = (t0, t1, o = {}) => {
    const R0 = 160, f = 300, far = 2400, top = MV.SAFE.top;
    const SIDE = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
    H.sfx(t0, 'Whoosh', 0.6); H.sfx(t0, 'Shimmer', 0.4);
    TL.impact(t0, { amp: 0, flash: 0.8, dur: 0.35 });
    TL.add({
      t0, t1: t1 + 0.2, z: 87, screen: true,
      draw(c, emi, t, S) {
        const fx = S.fx, sx = fx.sx * 1.5, sy = fx.sy * 1.5, bot = 540 - S.frame.bot;
        const cx = 480 + sx, cy = 266 + sy;
        const rIn = 1000 * U.eOutExpo(U.clamp((t - t0) / 0.28)), rOut = t > t1 ? 1000 * (1 - U.eIn(U.clamp((t - t1) / 0.18))) : 1000;
        const ir = Math.min(rIn, rOut);
        if (ir < 1) return;
        c.save();
        c.beginPath(); c.rect(0, top, 960, bot - top); c.clip();
        c.beginPath(); c.arc(480, 266, ir, 0, U.TAU); c.clip();
        c.fillStyle = '#02040e'; c.fillRect(0, top, 960, bot - top);
        // the tunnel: stars streaming past
        for (let i = 0; i < 160; i++) {
          const a = U.hash(i * 1.7) * U.TAU, ph = (t * (0.7 + U.hash(i * 3.1) * 0.6) + U.hash(i * 5.3)) % 1;
          const zz = far * (1 - ph) + 60, r = 260 * f / zz, r2 = 260 * f / (zz + 160);
          c.strokeStyle = U.hash(i) < 0.7 ? '#5fd8ff' : '#ffffff'; c.globalAlpha = Math.min(1, ph * 1.6) * 0.7; c.lineWidth = 1 + ph * 2;
          c.beginPath(); c.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke();
        }
        c.globalAlpha = 1;
        // four lanes the spears come down
        for (const k of ['u', 'r', 'd', 'l']) {
          const v = SIDE[k]; c.strokeStyle = '#1e3a8a'; c.globalAlpha = 0.5; c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx + v[0] * 20, cy + v[1] * 20); c.lineTo(cx + v[0] * 700, cy + v[1] * 700); c.stroke();
        }
        c.globalAlpha = 1;
        // her face at the vanishing point, the eye burning
        const head = MV.part('und/head' + (S.head || 0)), hs = 4.2;
        c.imageSmoothingEnabled = false;
        c.globalAlpha = 0.85; c.drawImage(MV.tintNow(head, '#24407a', 0), cx - head.width * hs / 2, cy - head.height * hs / 2 - 10, head.width * hs, head.height * hs);
        c.globalAlpha = 1;
        const ex = cx - head.width * hs / 2 + 12 * hs, ey = cy - head.height * hs / 2 - 10 + 13 * hs, fl = 0.7 + 0.3 * Math.sin(t * 37);
        D.rect(c, ex - 7, ey - 7, 14, 14, '#ff2030', fl); D.rect(c, ex - 3, ey - 3, 6, 6, '#ffffff', 1);
        // spears in flight (the same spears the 2D shield is blocking), far ones first
        const live = TL.greens.filter((sp) => t >= sp.t0 && t < sp.t1 && sp.t1 > t0 - 0.1 && sp.t0 < t1 + 0.4).map((sp) => ({ sp, z: U.lerp(far, f, (t - sp.t0) / (sp.t1 - sp.t0)) })).sort((a, b) => b.z - a.z);
        // the hovering ring of spears gathering in the first bar
        if (o.ring) for (const h of o.ring) {
          if (t < h.tIn || t >= h.tGo) continue;
          const k = U.eOutBack(U.clamp((t - h.tIn) / 0.25)), a = h.ang + Math.sin(t * 3) * 0.05, zz = far, rr = R0 * f / zz * 1.6 * k;
          const px = cx + Math.cos(a) * rr * 2.2, py = cy + Math.sin(a) * rr * 2.2;
          MV.spr(c, MV.part('spear/blue_' + h.side), px, py, { scale: 0.9 * k, alpha: k, rot: 0 });
        }
        for (const { sp, z } of live) {
          const v = SIDE[sp.final], k = f / z, px = cx + v[0] * R0 * k, py = cy + v[1] * R0 * k;
          // streak back toward the vanishing point
          c.strokeStyle = sp.kind === 'yel' ? '#ffe040' : '#5fd8ff'; c.globalAlpha = 0.5; c.lineWidth = Math.max(1, 6 * k);
          c.beginPath(); c.moveTo(px - v[0] * 120 * k, py - v[1] * 120 * k); c.lineTo(px, py); c.stroke(); c.globalAlpha = 1;
          MV.spr(c, MV.part('spear/' + (sp.kind === 'yel' ? 'yel_' : 'blue_') + sp.final), px, py, { scale: 4.2 * k, ax: 0.5, ay: 0.5 });
        }
        // the green ring and the shield arc
        D.pixelRing(c, cx, cy, R0 + 34, 3, '#00c000', 0.8);
        const sh = S.shield, hit = sh.hit || 0, dir = sh.dir;
        c.lineCap = 'butt';
        c.strokeStyle = hit > 0.5 ? '#ff3030' : hit > 0.01 ? '#ffffff' : '#2a6bff'; c.lineWidth = 18;
        c.beginPath(); c.arc(cx, cy, R0 + 14, dir - 0.55, dir + 0.55); c.stroke();
        c.strokeStyle = '#bfe0ff'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R0 + 14, dir - 0.5, dir + 0.5); c.stroke();
        // sparks where a spear just broke on the shield
        for (const h of TL.shieldHits) {
          const d = t - h.t; if (d < 0 || d > 0.25 || h.t < t0) continue;
          const v = SIDE[h.side], bx = cx + v[0] * (R0 + 14), by = cy + v[1] * (R0 + 14);
          for (let i = 0; i < 14; i++) { const a = Math.atan2(v[1], v[0]) + (U.hash(h.t * 7 + i) - 0.5) * 2.2, r = d * (300 + U.hash(i * 3.3 + h.t) * 400); D.rect(c, bx + Math.cos(a) * r, by + Math.sin(a) * r, 4, 4, i % 3 ? '#9fe8ff' : '#ffffff', 1 - d / 0.25); }
          D.pixelRing(c, bx, by, 10 + d * 220, 3, '#ffffff', 1 - d / 0.25);
        }
        c.restore();
        // the iris rim
        if (ir < 990) { c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.globalAlpha = 0.9; c.beginPath(); c.arc(480, 266, ir, 0, U.TAU); c.stroke(); c.restore(); }
      },
    });
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
  // ================================================================ phase two: the overwhelming
  // a fracture across the whole picture (screen space): jagged cracks race out from (cx, cy),
  // a few shards break off and fall, a short flash; it fades within `life`
  H.fracture = (t, cx = 480, cy = 270, o = {}) => {
    const n = o.n ?? 9, life = o.life ?? 0.75, rnd = U.rng(Math.floor(t * 977) + 13);
    const cracks = [];
    for (let i = 0; i < n; i++) {
      let a = (i / n) * U.TAU + (rnd() - 0.5) * 0.5, x = cx, y = cy;
      const pts = [[x, y]], L2 = 180 + rnd() * 360;
      for (let d = 0; d < L2; ) { const st = 22 + rnd() * 40; a += (rnd() - 0.5) * 0.7; x += Math.cos(a) * st; y += Math.sin(a) * st; d += st; pts.push([x, y]); }
      cracks.push(pts);
      if (rnd() < 0.6) { // a branch
        const j = 1 + Math.floor(rnd() * (pts.length - 2)), [bx, by] = pts[j], b = a + (rnd() < 0.5 ? 1 : -1) * (0.6 + rnd() * 0.5);
        cracks.push([[bx, by], [bx + Math.cos(b) * 50, by + Math.sin(b) * 50], [bx + Math.cos(b + 0.3) * 100, by + Math.sin(b + 0.3) * 100]]);
      }
    }
    const shards = [];
    for (let i = 0; i < (o.shards ?? 10); i++) {
      const a = rnd() * U.TAU, r = 20 + rnd() * 120, s = 8 + rnd() * 18;
      shards.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: Math.cos(a) * (60 + rnd() * 160), vy: Math.sin(a) * 80 - 120 * rnd(), s, rot: rnd() * 6, vr: (rnd() - 0.5) * 14 });
    }
    H.sfx(t, 'UndBreak1', o.vol ?? 0.3);
    TL.impact(t, { amp: o.amp ?? 12, zoom: 0.05, ca: 8, flash: o.flash ?? 0.3, flashCol: o.flashCol, rot: 0.02, dur: 0.45 });
    TL.add({
      t0: t, t1: t + life, z: 88, screen: true,
      draw(c, emi, tt) {
        const u = (tt - t) / life, grow = U.eOutExpo(U.clamp((tt - t) / 0.08)), k = 1 - u * u;
        c.save(); c.lineJoin = 'miter';
        for (const pts of cracks) {
          const m = Math.max(2, Math.ceil(pts.length * grow));
          for (const [w, col, al] of [[7, '#000000', 0.7], [3, '#ffffff', 1]]) {
            c.globalAlpha = k * al; c.strokeStyle = col; c.lineWidth = w;
            c.beginPath(); c.moveTo(R(pts[0][0]), R(pts[0][1]));
            for (let i = 1; i < m && i < pts.length; i++) c.lineTo(R(pts[i][0]), R(pts[i][1]));
            c.stroke();
          }
        }
        const dt = tt - t;
        for (const p of shards) {
          const x = p.x + p.vx * dt, y = p.y + p.vy * dt + 700 * dt * dt, r = p.rot + p.vr * dt;
          c.globalAlpha = k; c.fillStyle = '#e8f4ff'; c.strokeStyle = '#000000'; c.lineWidth = 2;
          c.beginPath();
          for (let j = 0; j < 3; j++) { const a = r + (j * U.TAU) / 3 + (j === 1 ? 0.5 : 0); c.lineTo(R(x + Math.cos(a) * p.s), R(y + Math.sin(a) * p.s * 0.7)); }
          c.closePath(); c.fill(); c.stroke();
        }
        c.restore();
      },
    });
  };
  // embers: red and gold sparks rising through the whole picture behind her (world, backdrop)
  H.embers = (t0, t1, o = {}) =>
    TL.add({
      t0, t1, z: -400,
      draw(ctx, emi, t) {
        const k = Math.min(U.clamp((t - t0) / 0.5), U.clamp((t1 - t) / 0.5)) * (o.k ?? 1);
        for (let i = 0; i < (o.n ?? 70); i++) {
          const sp = 60 + U.hash(i * 2.3) * 140, ph = U.hash(i * 7.9) * 900;
          const y = 640 - ((ph + t * sp) % 820), x = -200 + U.hash(i * 3.1) * 1360 + Math.sin(t * 2 + i) * 14;
          const col = U.hash(i * 5.5) < 0.7 ? '#ff3a20' : '#ffc040', sz = U.hash(i) < 0.2 ? 4 : 2;
          D.rect(ctx, x, y, sz, sz, col, k * (0.5 + 0.5 * Math.sin(t * 9 + i)));
          if (emi && sz > 2) D.rect(emi, x - 4, y - 4, 12, 12, col, k * 0.5);
        }
      },
    });
  // ================================================================ rhythm game: judgement + combo
  // every block is called (GOOD, PERFECT on the accents, PARRY on a deflect) over a combo
  // counter (silent: the calls are visual only, the song carries the rhythm) at the right edge that burns brighter the longer the chain runs; a chain ends when
  // the spears stop for more than two seconds
  TL.chains = [];
  const JUDGE = { good: ['GOOD', '#a8ffb0'], perfect: ['PERFECT', '#5fd8ff'], parry: ['PARRY!', '#ffe040'] };
  const comboCol = (n) => (n >= 100 ? '#ff9a30' : n >= 50 ? '#ffe040' : n >= 25 ? '#5fd8ff' : n >= 10 ? '#bff0ff' : '#ffffff');
  MV.late.push(() => {
    let cur = null;
    for (const h of TL.shieldHits.slice().sort((a, b) => a.t - b.t)) {
      if (!cur || h.t - cur.ts[cur.ts.length - 1] > 2.2) TL.chains.push((cur = { ts: [], hs: [], ms: [] }));
      cur.ts.push(h.t); cur.hs.push(h);
    }
    for (const c of TL.chains) {
      if (c.ts.length < 20) continue; // not the few in the bridge's calm
      for (const m of [25, 50, 100, 150]) if (c.ts.length >= m) { c.ms.push({ t: c.ts[m - 1], n: m }); }
      const t0 = c.ts[0], t1 = c.ts[c.ts.length - 1] + 1.1, X = 862;
      TL.add({
        t0, t1, z: 84, screen: true,
        draw(ctx, emi, t) {
          let lo = 0, hi = c.ts.length;
          while (lo < hi) { const m = (lo + hi) >> 1; if (c.ts[m] <= t) lo = m + 1; else hi = m; }
          const n = lo;
          if (!n) return;
          const h = c.hs[n - 1], dt = t - c.ts[n - 1];
          const k = Math.min(U.clamp((t - t0) / 0.15), U.clamp((t1 - t) / 0.4));
          // the call for the latest block
          if (dt < 0.4) {
            const [str, col] = JUDGE[h.deflect ? 'parry' : h.heavy ? 'perfect' : 'good'];
            const pop = dt < 0.05 ? 0.6 : 0;
            D.text(ctx, str, X, 214 - dt * 26 - pop * 8, { scale: 2 + pop, align: 'center', color: col, outline: '#000000', alpha: k * U.clamp((0.4 - dt) / 0.15) });
          }
          // the count: pumps on every block
          const col = comboCol(n), pump = Math.exp(-dt * 16);
          const sc = 4 + R(pump * 1.6);
          // a soft glow behind the count once the chain is long (the screen layer has no bloom)
          if (n >= 25) for (let i = 0; i < 3; i++) { ctx.globalAlpha = k * (0.07 + 0.06 * pump); ctx.fillStyle = col; ctx.fillRect(X - 40 - i * 14, 262 - i * 10, 80 + i * 28, 64 + i * 20); }
          ctx.globalAlpha = 1;
          D.text(ctx, String(n), X, 294 - sc * 8, { scale: sc, align: 'center', color: pump > 0.7 ? '#ffffff' : col, outline: '#000000', alpha: k, shake: n >= 50 && pump > 0.4 ? 2 : 0, seed: R(t * 30) });
          D.text(ctx, 'COMBO', X, 342, { scale: 2, align: 'center', color: col, outline: '#000000', alpha: k * 0.9 });
          for (const m of c.ms) {
            const u = (t - m.t) / 0.6;
            if (u < 0 || u > 1) continue;
            const w = 80 + u * 120, hh = 50 + u * 60;
            ctx.globalAlpha = k * (1 - u); ctx.strokeStyle = col; ctx.lineWidth = 4;
            ctx.strokeRect(R(X - w), R(292 - hh), R(w * 2), R(hh * 2)); ctx.globalAlpha = 1;
            D.text(ctx, m.n + ' COMBO!', X, 168 - u * 10, { scale: 2, align: 'center', color: '#ffffff', outline: col, alpha: k * (1 - u * u) });
          }
        },
      });
    }
  });
})();
