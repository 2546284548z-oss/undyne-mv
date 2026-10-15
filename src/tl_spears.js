// Bars 28 - 59, the main theme twice.
// 28 - 43, the soul turns red and the box opens wide: now it has to move.
//   28 - 31  spears stab out of the floor and the ceiling on the melody; the soul
//            hops between the top and bottom bands, one band a bar
//   32 - 35  spear rain: the soul sweeps the box, the spears fall beside it
//   36 - 39  rings: eight spears close round the soul, it slips out through a gap
//   40 - 43  her eye beams alternate rows on the beat, then everything at once
// 44 - 59, green again for the repeat: the camera tilts the arena into 3D, her
//   spear swings flare behind her on the downbeats, 52 - 55 the world turns a
//   quarter each bar. Bar 59 is the second turn: the slash connects, she cracks.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;
  const B = L.boxRed, TOP = B.y, BOT = B.y + B.h, MID = B.y + B.h / 2;
  const pitchX = (p) => U.clamp(280 + ((p - 65) / 19) * 400, 275, 685);
  H.pitchX = pitchX;

  // melody slots of a bar (tone or snare, at least `gap` 16ths apart, up to `last`)
  const melody = (b, gap = 2, last = 15, th = 0.5) => {
    const o = [];
    let prev = -9;
    for (let s = 0; s <= last; s++) {
      if (H.acc(b, 0, s, 'tone') > th || H.acc(b, 0, s, 'snare') > th) { if (s - prev >= gap) { o.push(s); prev = s; } }
    }
    return o;
  };
  H.melody = melody;

  // ------------------------------------------------------------ red-soul phrases (shared with the finale)
  // floor / ceiling: one band a bar; bands = ['top' | 'bot', ...] starting at bar b0
  H.bands = (b0, bands, o = {}) => {
    const yOf = { top: TOP + 20, bot: BOT - 20 };
    bands.forEach((band, i) => {
      const b = b0 + i, y = yOf[band];
      // move into the band just before the bar (crossing at the box centre column)
      const tm = at(b) - 0.24;
      const sx = i === 0 ? (o.x0 ?? 480) : TL.soul.at(tm).x;
      H.soulTo(tm, tm + 0.18, sx, y, 'outExpo');
      // a little weave across the band on beats 2 and 4
      const wx = [sx, U.clamp(sx + (i % 2 ? -90 : 90), 300, 660)];
      H.soulTo(at(b, 1, 2), at(b, 2), wx[1], y, 'inOut');
      H.soulTo(at(b, 3), at(b, 3, 2), wx[0], y, 'inOut');
      for (const s of melody(b, 2, 9)) {
        const tHit = at(b, 0, s), side = band === 'top' ? 'b' : 't';
        let x = pitchX(H.lead(b, 0, s) > 0 ? H.lead(b, 0, s) : 75);
        H.wallSpear(tHit - 0.3, tHit, side, x, { len: 90, vol: 0.32 });
      }
      H.throwArm(at(b) - 0.2, 0.8);
    });
  };
  // rain: the soul sweeps x0 -> x1 (bars b..b+1) along the bottom; spears fall beside it
  H.rain = (b, x0, x1, o = {}) => {
    const y = o.y ?? BOT - 40;
    H.soulTo(at(b) - 0.2, at(b), x0, y, 'outExpo');
    H.soulTo(at(b), at(b + 2) - 0.1, x1, y, 'inOut');
    const offs = [-120, 130, -150, 110, -105, 160, -135, 125];
    let k = 0;
    for (const bb of [b, b + 1]) {
      for (const s of melody(bb, 2, 15)) {
        const tHit = at(bb, 0, s);
        const sx = TL.soul.at(tHit).x;
        let x = sx + offs[k++ % offs.length];
        if (x < 270 || x > 690) x = sx - Math.sign(x - sx) * Math.abs(offs[k % offs.length]);
        x = U.clamp(x, 270, 690);
        const yA = TOP - 70, yB = BOT + 80, f = (y - yA) / (yB - yA), dur = 0.42;
        H.flyer(tHit - dur * f, tHit - dur * f + dur, x, yA, x, yB, { len: 70, clip: true, sfx: s % 4 === 0, vol: 0.1 });
      }
    }
  };
  // a ring round the soul at bar b; it slips out horizontally (dir +1 right / -1 left)
  H.ringAt = (b, dir, o = {}) => {
    const p = TL.soul.at(at(b) - 0.01);
    const t0 = at(b, o.k0 ?? 0), tHit = at(b, o.k1 ?? 2);
    H.ring(t0, tHit, p.x, p.y, 8, o.r ?? 62, { a0: Math.PI / 8 });
    H.soulTo(tHit - 0.3, tHit - 0.16, p.x + dir * 90, p.y, 'outExpo');
    H.throwArm(t0 - 0.05, 1);
    return [p.x + dir * 90, p.y];
  };
  // a long spear across the box at row y, from the left (dir 1) or right (-1)
  H.sweep = (tHit, y, dir, o = {}) => {
    const xa = dir > 0 ? B.x - 40 : B.x + B.w + 40, xb = dir > 0 ? B.x + B.w + 120 : B.x - 120;
    const dur = o.dur ?? 0.5;
    H.flyer(tHit - dur / 2, tHit + dur / 2, xa, y, xb, y, { len: 80, clip: true, warn: o.warn ?? 0.25, vol: 0.2 });
  };
  // eye beams on the beats of bar b, rows alternating; the soul takes the other row
  H.beams = (b, beats = [0, 1, 2, 3], o = {}) => {
    const rows = [TOP + 34, BOT - 34];
    beats.forEach((k, i) => {
      const tF = at(b, k), row = rows[(i + (o.flip ? 1 : 0)) % 2], safe = rows[(i + 1 + (o.flip ? 1 : 0)) % 2];
      const x = o.x ?? TL.soul.at(tF - 0.4).x;
      H.soulTo(tF - 0.17, tF - 0.07, x, safe, 'outExpo');
      H.beam(tF - 0.3, tF, tF + 0.2, row);
      TL.und.to(tF - 0.3, tF - 0.28, { eye: 1.8 }, 'lin').to(tF, tF + 0.25, { eye: 0.6 }, 'out');
      H.punch(tF, 0.6);
    });
  };
  // switch the arena: green post -> red box, and back
  H.toRed = (t, o = {}) => {
    TL.soulCol.set(t, 'red');
    H.sfx(t, 'Ding', 0.5);
    TL.shield.to(t - 0.1, t, { a: 0 }, 'out');
    H.box(t - 0.25, t + 0.15, Object.assign({ fill: 1 }, B), 'outBack');
    H.boxHit(t + 0.15, 'top', 0.5, 6);
    TL.burst(t, { x: () => TL.soul.at(t).x, y: () => TL.soul.at(t).y, n: 16, speed: [60, 150], life: [0.2, 0.45], colors: ['#ff2030', '#ffffff'], size: 2, z: 36 });
    H.cam(t - 0.3, t + 0.3, { x: 480, y: o.camY ?? 250, zoom: o.zoom ?? 1.08, roll: 0, pitch: 0, yaw: 0 }, 'inOut');
  };
  H.toGreen = (t, o = {}) => {
    H.soulTo(t - 0.3, t - 0.05, L.soul[0], L.soul[1], 'outExpo');
    TL.soulCol.set(t, 'green');
    H.sfx(t, 'Ding', 0.5);
    H.box(t - 0.2, t + 0.1, Object.assign({ fill: 0 }, L.boxGreen), 'inOut');
    TL.shield.to(t - 0.12, t - 0.02, { a: 1 }, 'out');
    TL.burst(t, { x: L.soul[0], y: L.soul[1], n: 16, speed: [60, 150], life: [0.2, 0.45], colors: ['#00ff40', '#ffffff'], size: 2, z: 36 });
  };
  // her spear swing flaring behind her (the boss's swing arcs)
  H.swing = (t, col = 'green', flip = false) => {
    H.sfx(t, 'SwipeShort', 0.35);
    TL.add({
      t0: t, t1: t + 0.32, z: -120,
      draw(ctx, emi, tt, S) {
        const u = (tt - t) / 0.32, img = MV.part('swing/' + col);
        const x = S.und.x + (flip ? 70 : -70), y = S.und.y - 120;
        MV.spr(ctx, img, x, y, { scale: 0.8 + u * 0.15, alpha: (1 - u) * 0.35, flip, rot: (flip ? -1 : 1) * (u - 0.5) * 0.5 });
        if (emi) { emi.globalAlpha = (1 - u) * 0.25; MV.spr(emi, img, x, y, { scale: 0.85, flip }); emi.globalAlpha = 1; }
      },
    });
  };

  MV.sections.push(() => {
    // ------------------------------------------------------------ 28 - 31: floor and ceiling
    H.toRed(at(28));
    TL.post.to(at(28), at(28, 1), { bloom: 1.05, vig: 0.4 }, 'out');
    H.bands(28, ['top', 'bot', 'top', 'bot']);
    H.say(at(29, 2), at(31), ['给我动起来！'], { cps: 12 });
    H.face(at(29, 2), 9); H.face(at(31), 0);
    for (let b = 28; b < 32; b++) for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.3);

    // ------------------------------------------------------------ 32 - 35: rain
    H.rain(32, 300, 660);
    H.rain(34, 660, 300);
    for (const b of [32, 33, 34, 35]) H.throwArm(at(b) - 0.25, 0.6);
    H.cam(at(32), at(34), { roll: 0.03 }, 'inOut');
    H.cam(at(34), at(36), { roll: -0.03 }, 'inOut');

    // ------------------------------------------------------------ 36 - 39: rings + sweeps
    H.soulTo(at(36) - 0.3, at(36) - 0.1, 480, MID, 'outExpo');
    H.cam(at(35, 3), at(36), { roll: 0, zoom: 1.12, y: 262 }, 'inOut');
    const dirs = [1, -1, -1, 1];
    for (let i = 0; i < 4; i++) {
      const b = 36 + i;
      const [x, y] = H.ringAt(b, dirs[i]);
      // after the ring: two sweeps on the rows either side of the soul
      H.sweep(at(b, 3), y - 46, i % 2 ? 1 : -1);
      H.sweep(at(b, 3, 2), y + 46, i % 2 ? -1 : 1);
      H.punch(at(b, 2), 0.9);
    }
    H.say(at(37, 3), at(39, 2), ['再快一点！'], { cps: 12 });
    H.face(at(37, 3), 1); H.face(at(39, 2), 0);

    // ------------------------------------------------------------ 40 - 43: eye beams, then everything
    TL.und.to(at(39, 3), at(40), { eye: 0.9 }, 'inOut');
    H.beams(40, [1, 2, 3], { x: 480 });
    H.beams(41, [0, 1, 2, 3], { x: 480 });
    for (const x of [300, 660]) for (const k of [0, 2]) H.wallSpear(at(41, k) - 0.3, at(41, k), k ? 't' : 'b', x, { len: 80, vol: 0.25 });
    H.cam(at(40), at(42), { zoom: 1.16, y: 252 }, 'inOut');
    // 42: a ring, then rain to the right; 43: sweeps both rows round the centre
    H.soulTo(at(42) - 0.3, at(42) - 0.15, 480, MID, 'outExpo');
    H.ringAt(42, -1, { k0: 0, k1: 1 });
    H.soulTo(at(42, 1, 2), at(43, 2), 600, BOT - 40, 'inOut');
    for (const s of [6, 8, 10, 12, 14]) { const t = at(42, 0, s), sx = TL.soul.at(t).x; H.flyer(t - 0.3, t + 0.12, sx - 130, TOP - 70, sx - 130, BOT + 80, { len: 70, clip: true, sfx: false }); H.flyer(t - 0.3, t + 0.12, U.clamp(sx + 140, 270, 690), TOP - 70, U.clamp(sx + 140, 270, 690), BOT + 80, { len: 70, clip: true, sfx: false }); }
    for (const k of [0, 1]) { H.sweep(at(43, k), TOP + 26, k ? 1 : -1, { warn: 0.2 }); H.sweep(at(43, k, 2), MID - 6, k ? -1 : 1, { warn: 0.2 }); }
    TL.und.to(at(43, 2), at(44), { eye: 0.4 }, 'inOut');
    H.swell(at(44), 0.5);
    H.say(at(42, 2), at(44), ['不会让你过去的！'], { cps: 14 });
    H.face(at(42, 2), 2); H.face(at(44), 0);

    // ------------------------------------------------------------ 44 - 58: green, in 3D
    H.toGreen(at(44));
    H.resetGreen('u');
    H.hit(at(44), 1);
    H.cam(at(44) - 0.3, at(44, 2), { x: 480, y: 250, zoom: 1.32, pitch: 0.32, yaw: 0, roll: 0 }, 'inOut');
    TL.post.to(at(44), at(44, 2), { bloom: 1.2, ca: 0.8, bg: 0.25 }, 'inOut');
    TL.und.to(at(44), at(45), { ghost: 0.45 }, 'inOut');
    for (let b = 44; b < 59; b++) {
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: b >= 52 ? 0.85 : 0, gap: 2, yel: 0.4, travel: b >= 52 ? 0.52 : 0.58 });
      if (b % 2 === 0) H.swing(at(b), b % 4 ? 'red' : 'green', b % 4 === 2);
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.35);
    }
    // the arena sways on the 2-bar phrases
    for (let b = 44; b < 52; b += 2) H.cam(at(b), at(b + 2), { yaw: (b / 2) % 2 ? -0.16 : 0.16 }, 'inOut');
    // 52 - 55: the world turns a quarter each bar
    for (let i = 0; i < 4; i++) H.cam(at(52 + i) - 0.12, at(52 + i) + 0.18, { roll: (i + 1) * Math.PI / 2, yaw: 0, pitch: 0.2 }, 'outExpo');
    H.cut(at(56) - 0.001, { roll: 0 });
    for (let i = 0; i < 4; i++) H.punch(at(52 + i), 1);
    H.say(at(48), at(50), ['大家的希望……', '都在我身上！'], { cps: 12 });
    H.face(at(48), 6); H.face(at(50), 0);
    // 56 - 58: the peak - closer, hotter
    H.cam(at(56), at(56, 2), { zoom: 1.5, pitch: 0.18, y: 240 }, 'inOut');
    TL.post.to(at(56), at(58), { bloom: 1.35, ca: 1.1 }, 'inOut');
    H.face(at(56), 2); H.face(at(56, 2), 0); H.face(at(58), 1); H.face(at(58, 2), 0);

    // ------------------------------------------------------------ 59: the second turn
    TL.shield.to(at(59), at(59, 0, 2), { a: 0 }, 'out');
    TL.und.to(at(58, 3), at(59), { ghost: 0 }, 'inOut');
    H.cam(at(59), at(59, 1), { x: 480, y: 262, zoom: 1.12, pitch: 0, yaw: 0, roll: 0 }, 'inOut');
    TL.post.to(at(59), at(59, 1), { bloom: 1, ca: 0.6, bg: 0 }, 'inOut');
    H.turn(at(59), at(59, 1), 3864, 0.86, 0.52, { big: true, after: 6, hurt: 0.6 });
    TL.und.to(at(59, 2), at(60), { drip: 0.7 }, 'inOut');
    H.swell(at(60), 0.4, 'SwellShort');
  });
})();
