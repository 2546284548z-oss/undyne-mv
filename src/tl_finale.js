// Bars 72 - 97, the last section: three 8-bar phrases, everything she has.
//   72       phase two: the cut-in, the emptied boss bar refills under a new name
//   72 - 79  green: the densest shield storm yet, posture again, two more 危; she dashes every bar
//   80 - 87  red: four spell cards with new danmaku - a snaking corridor, a lattice, spear
//            flowers, the last spell; a ring of 24 spears no one could dodge, broken by full TP
//   88 - 93  the box shatters: the whole screen is the arena (walls, flowers, giant spears)
//   93 - 95  the box rebuilds; her spears ring the soul; 95's drum fill sends them in one per
//            16th, the shield spinning round
//   96       the last hit lands on the last chord: the freeze frame; the bar empties for good.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;
  const B = L.boxRed, TOP = B.y, BOT = B.y + B.h, MID = B.y + B.h / 2;

  MV.sections.push(() => {
    // ------------------------------------------------------------ 72: she is whole again
    H.bigHit(at(72), { flash: 1, inv: 0.06 });
    H.sfx(at(72), 'Boom', 0.7);
    TL.melt.set(at(72), 0);
    TL.und.set(at(72), { sc: 2, y: L.und[1], x: 480 });
    TL.und.to(at(72), at(72) + 0.02, { flash: 1 }, 'lin').to(at(72) + 0.02, at(72) + 0.22, { flash: 0, shake: 0 }, 'out');
    TL.und.set(at(72), { ghost: 0 }).to(at(72), at(73), { drip: 0.45, breathe: 1, eye: 1.2 }, 'inOut').to(at(73), at(73, 1), { ghost: 0.6 }, 'inOut');
    TL.hud.to(at(72), at(72, 2), { a: 1 }, 'out');
    TL.btn.forEach((b) => b.to(at(72), at(72, 2), { a: 1, dy: 0 }, 'out'));
    TL.shield.to(at(72), at(72, 1), { ring: 1 }, 'out');
    TL.bg.to(at(72), at(72, 2), { cav: 0.9, rain: 0.25, flowers: 0, drift: 50, ceiling: 0.8 }, 'out');
    TL.post.to(at(72), at(72, 2), { bloom: 1.35, vig: 0.45, ca: 1.2, desat: 0 }, 'out');
    TL.shadow.set(at(72), { a: 0.95, sc: 7.5, y: 800, eye: 2 });
    TL.rage.set(at(72), { v: 1.5 });
    TL.rumble.set(at(72), { v: 6 }).to(at(72), at(72, 2), { v: 2.6 }, 'out');
    H.cut(at(72), { x: 480, y: 236, zoom: 1.34, roll: 0, pitch: 0, yaw: 0 });
    // 2D -> 3D -> 2D: her sprite grows depth into voxels, she turns one full circle as the
    // bar refills, and flattens back into the pixel art on the next downbeat
    TL.und.set(at(72), { vox: 0, vyaw: 0 }).to(at(72), at(72) + 0.3, { vox: 6 }, 'outExpo');
    // a calmer exposure while she turns, so the voxel form reads; the aura flares back at 73
    TL.rage.to(at(72) + 0.05, at(72) + 0.3, { v: 0.35 }, 'out').to(at(72, 3), at(73), { v: 1.5 }, 'in');
    TL.post.to(at(72) + 0.05, at(72) + 0.3, { bloom: 0.75, ca: 0.5 }, 'out').to(at(72, 3), at(73), { bloom: 1.35, ca: 1.2 }, 'in');
    TL.und.to(at(72), at(73), { vyaw: Math.PI * 2 }, 'inOut');
    TL.und.to(at(72, 3), at(73), { vox: 0 }, 'in');
    TL.und.set(at(73) + 0.001, { vyaw: 0 });
    H.sfx(at(72), 'Shimmer', 0.5); H.sfx(at(72, 2), 'Rotate', 0.45);
    H.speed(at(72), at(73), { k: 0.6, cy: 200 });
    H.shout(at(73), at(74), '来吧！！！', { side: 1, y: 130, scale: 4 });
    H.shock(at(72), 480, 150, { r: 520, dust: false });
    H.barrage(at(73), 5);

    // phase two (Elden Ring): the emptied bar refills, the name changes, the last life burns
    TL.bossName.set(at(72), '真正的英雄 安黛因');
    TL.boss.set(at(72), { a: 1, phase2: 1 });
    H.bossHp(at(72, 0, 2), 1, { dur: 1.1, ease: 'inOut', lagDelay: 0 });
    H.sfx(at(72, 0, 2), 'Power', 0.5);

    // ------------------------------------------------------------ 72 - 79: storm, she never stops moving
    // posture is back (she can be broken again - but there is no time); two more 危
    TL.boss.to(at(72, 2), at(73), { pa: 1, posture: 0 }, 'out');
    H.postureWindow(at(73), at(79, 3), 0, 0.82);
    const peril72 = { 75: 1, 77: -1 };
    H.resetGreen('u');
    const xs72 = [480, 370, 590, 400, 560, 360, 600, 480];
    const flur72 = { 73: 'l', 79: 'u' };
    for (let b = 72; b < 80; b++) {
      const f = flur72[b];
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.8, gap: 2, yel: 0.5, travel: 0.42, from: b === 72 ? 8 : 0, to: peril72[b] ? 9 : f ? 12 : 16 });
      if (f) H.flurry(at(b, 3), f, 4, T.s16, { travel: 0.36 });
      if (peril72[b]) H.peril(at(b, 3), { dir: peril72[b] });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.6);
      if (b > 72) { H.dash(at(b) - 0.1, at(b) + 0.08, xs72[b - 72]); H.snap(at(b), { zoom: b % 2 ? 1.48 : 1.36, x: 480 + (xs72[b - 72] - 480) * 0.3, roll: (b % 2 ? -1 : 1) * 0.1 }); }
      if (b % 2 === 0 && b > 72) { H.swing(at(b), b % 4 ? 'red' : 'green', b % 4 === 2); H.barrage(at(b, 2), 3, { vol: 0.22 }); }
    }
    H.speed(at(72, 2), at(80), { k: 0.35 });
    H.cam(at(76), at(78), { pitch: 0.24 }, 'inOut');
    H.cam(at(78), at(79, 3), { pitch: 0 }, 'inOut');
    H.say(at(76), at(78), ['你从我身上……', '什么也得不到！'], { cps: 14 });
    H.face(at(76), 6); H.face(at(78), 0);

    // ------------------------------------------------------------ 80 - 87: four spell cards (Touhou, in full)
    H.cube(at(80) - 0.22, 0.48);
    H.toRed(at(80), { camY: 246, zoom: 1.12 });
    H.bigHit(at(80), { flash: 0.35, flashCol: [1, 0.2, 0.2], inv: 0, bw: 0 });
    TL.boss.to(at(80), at(80, 1), { pa: 0, tpa: 1 }, 'out');
    H.tpWindow(at(80), at(87, 1), 0.6, 1);
    H.dash(at(80) - 0.1, at(80) + 0.06, 480);
    for (let b = 80; b < 88; b++) { for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.4); H.throwArm(at(b, 1), 0.8); H.throwArm(at(b, 3), 0.8); }

    // 80 - 81 枪符「千本之矛」: two curtains of falling spears on every 16th, a corridor
    // snaking between them; the soul rides the corridor
    H.spell(at(80), at(81, 3, 3), '枪符「千本之矛」');
    const cxAt = (s) => 480 + 150 * Math.sin((s / 32) * U.TAU), yC = MID + 18;
    H.soulTo(at(80) - 0.12, at(80) - 0.02, cxAt(0), yC, 'outExpo');
    for (let s = 1; s <= 29; s++) TL.soul.to(at(80, 0, s - 1), at(80, 0, s), { x: cxAt(s), y: yC }, 'lin');
    for (let s = 2; s <= 28; s++) {
      const tc = at(80, 0, s), yA = TOP - 70, yB = BOT + 80, f = (yC - yA) / (yB - yA), dur = 0.36;
      for (const side of [-1, 1]) { const x = cxAt(s) + side * 54; H.flyer(tc - dur * f, tc - dur * f + dur, x, yA, x, yB, { len: 70, clip: true, sfx: s % 4 === 0 && side < 0, vol: 0.12 }); }
    }
    // 82 - 83 水符「瀑布之雨・极」: a lattice - columns fall on every beat, rows sweep across;
    // the columns shift half a cell each beat and the soul steps into the new cell
    H.spell(at(82), at(83, 3, 3), '水符「瀑布之雨·极」');
    const cells = [434, 480, 526, 572, 526, 480, 434, 388];
    H.soulTo(at(82) - 0.18, at(82) - 0.08, cells[0], MID, 'outExpo');
    for (let k = 0; k < 8; k++) {
      const b = 82 + (k >> 2), kk = k % 4, tc = at(b, kk), even = k % 2 === 0;
      const yA = TOP - 70, yB = BOT + 80, f = (MID - yA) / (yB - yA), dur = 0.36;
      for (let x = even ? 296 : 342; x <= 690; x += 92) H.flyer(tc - dur * f, tc - dur * f + dur, x, yA, x, yB, { len: 80, clip: true, sfx: false });
      H.sfx(tc, 'UndSpearRise', 0.35); H.punch(tc, 0.5);
      H.sweep(tc, MID - 44, k % 2 ? 1 : -1, { warn: 0.15, dur: 0.45 });
      H.sweep(tc + T.s16 * 2, MID + 44, k % 2 ? -1 : 1, { warn: 0.15, dur: 0.45 });
      if (k < 7) H.soulTo(tc + 0.13, tc + 0.21, cells[k + 1], MID, 'outExpo');
    }
    // 84 - 85 矛符「绽放」: spear flowers burst from the box's edges, two a stop; the soul
    // always sits in a gap between the petals, and moves on between bursts
    H.spell(at(84), at(85, 3, 3), '矛符「绽放」');
    const spots = [[400, 362], [566, 346], [470, 398], [356, 332]];
    const centres = [[262, 296], [698, 414], [698, 296], [262, 414], [480, 292], [262, 300], [698, 300], [480, 420]];
    spots.forEach(([x, y], i) => {
      const t = at(84 + (i >> 1), (i % 2) * 2);
      H.soulTo(t - 0.3, t - 0.18, x, y, 'outExpo');
      H.bloom(t, ...centres[i * 2], 12, { clip: true, v: 950 });
      H.bloom(t, ...centres[i * 2 + 1], 12, { clip: true, v: 950 });
      H.punch(t + T.beat, 0.6); H.pulse(t + T.beat, 0.4, '#5fd8ff');
    });
    // 86 - 87 决心「不死之身」: the last spell - eye beams on every beat with a flower from her
    // hand on top; then 24 spears close in from everywhere. The TP is full: the soul breaks them.
    H.spell(at(86), at(87, 1, 2) + 0.2, '决心「不死之身」', { r: 180 });
    H.beams(86, [0, 1, 2, 3], { x: 480 });
    for (const k of [0, 2]) H.bloom(at(86, k), 480, 238, 12, { v: 900 });
    const tRing = at(87), tBurst = at(87, 1, 2);
    H.soulTo(at(86, 3) + 0.24, at(86, 3) + 0.34, 480, MID, 'outExpo');
    H.sfx(tRing, 'UndSpearAppear', 0.5); H.sfx(tRing, 'Warning', 0.35);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * U.TAU;
      TL.add({
        t0: tRing, t1: tBurst, z: 30,
        draw(ctx, emi, t, S) {
          const u = U.clamp((t - tRing) / (tBurst - tRing)), r = U.lerp(150, 46, U.eIn(u)) + Math.sin(t * 30 + i) * 2;
          D.spear(ctx, emi, S.soul.x + Math.cos(a) * r, S.soul.y + Math.sin(a) * r, a + Math.PI, { len: 60, alpha: U.clamp((t - tRing) / 0.12) });
        },
      });
    }
    // TP burst (Deltarune): the bar empties into a green wave; every spear shatters
    H.sfx(tBurst, 'Heal', 0.6); H.sfx(tBurst, 'Shock', 0.55); H.sfx(tBurst, 'UndBreak1', 0.5);
    H.bigHit(tBurst, { flash: 0.6, flashCol: [0.5, 1, 0.6] });
    TL.boss.to(tBurst, tBurst + 0.4, { tp: 0 }, 'inOut');
    H.shock(tBurst, 480, MID, { r: 300, color: '#80ff90', color2: '#00c000', dust: false });
    TL.burst(tBurst, { x: 480, y: MID, n: 80, speed: [140, 420], life: [0.25, 0.6], colors: ['#ffffff', '#9fe8ff', '#80ff90'], size: [2, 3], z: 45 });
    H.caption(tBurst, tBurst + 0.9, 'TP 100% · 决心', 480, 300, { scale: 2, color: '#80ff90', fadeIn: 0.05 });

    // ------------------------------------------------------------ 88 - 93: the box shatters (JSAB)
    // her spear splits the cracked box; the whole screen is the arena now. Walls of spears,
    // spear flowers from the screen's edges, giant spears across it - the soul has room to run.
    const tS = at(88);
    TL.boss.to(at(87, 3), tS, { crack: 1 }, 'in');
    H.shatter(tS);
    H.glass(tS, { cy: 330 }); // the whole screen breaks like glass and falls toward you
    H.cutin(at(87, 2, 2), 0.55, { text: '给我碎！！', head: 12 });
    TL.hud.to(tS, tS + 0.3, { a: 0 }, 'out');
    TL.btn.forEach((b) => b.to(tS, tS + 0.3, { a: 0 }, 'out'));
    TL.boss.to(tS, tS + 0.3, { tpa: 0 }, 'out');
    H.cam(tS - 0.05, tS + 0.25, { x: 480, y: 270, zoom: 1, roll: 0, pitch: 0, yaw: 0 }, 'outExpo');
    TL.post.to(tS, tS + 0.4, { bloom: 1.4, ca: 1.3, vig: 0.3 }, 'out');
    TL.rumble.to(tS, tS + 0.3, { v: 2.2 }, 'out');
    TL.und.to(tS, tS + 0.4, { ghost: 0.5 }, 'out');
    for (let b = 88; b < 94; b++) for (const s of H.hits(b, 'kick', 0.8)) { H.pulse(at(b, 0, s), 0.8); H.punch(at(b, 0, s), 0.4); }
    // 88 - 89: walls on every beat, gaps follow the melody
    const gapY = [330, 470, 360, 446, 318, 488, 400];
    let prevY = 352;
    gapY.forEach((gy, i) => {
      const k = i + 1, tc = at(88 + (k >> 2), k % 4);
      const tm = i === 0 ? tS + 0.1 : at(88 + ((k - 1) >> 2), (k - 1) % 4) + 0.06;
      H.soulTo(tm, tm + 0.1, 480, gy, 'outExpo');
      H.wall(tc, i % 2 ? -1 : 1, gy);
      H.throwArm(tc - 0.1, 0.8);
      prevY = gy;
    });
    // 90 - 91: flowers from the screen edges, the soul in the gaps
    const spots2 = [[380, 420], [586, 400], [480, 476], [350, 360]];
    const centres2 = [[60, 300], [900, 520], [900, 300], [80, 520], [480, 230], [60, 470], [900, 300], [480, 230]];
    spots2.forEach(([x, y], i) => {
      const t = at(90 + (i >> 1), (i % 2) * 2);
      H.soulTo(t - 0.3, t - 0.18, x, y, 'outExpo');
      H.bloom(t, ...centres2[i * 2], 14, { v: 1100, len: 70 });
      H.bloom(t, ...centres2[i * 2 + 1], 14, { v: 1100, len: 70 });
    });
    // 92 - 93: giant spears across the screen on the beats, the soul circling
    const orbit = (t) => { const u = (t - at(92)) / (T.bar * 2) * U.TAU; return [480 + Math.cos(u) * 110, 410 + Math.sin(u) * 60]; };
    H.soulTo(at(92) - 0.3, at(92) - 0.1, ...orbit(at(92)), 'outExpo');
    for (let s = 1; s <= 27; s++) { const t = at(92, 0, s); TL.soul.to(t - T.s16, t, Object.fromEntries([['x', orbit(t)[0]], ['y', orbit(t)[1]]]), 'lin'); }
    for (let k = 0; k < 7; k++) {
      const tc = at(92 + (k >> 2), k % 4), [sx, sy] = orbit(tc), ang = [0.45, -0.45, 1.2, -1.2, 0.2, -0.7, 0.9][k];
      const nx = -Math.sin(ang), ny = Math.cos(ang), side = k % 2 ? 1 : -1;
      const px = sx + nx * 104 * side, py = sy + ny * 104 * side, Lh = 900, v = 2000;
      H.flyer(tc - Lh / v, tc + Lh / v, px - Math.cos(ang) * Lh, py - Math.sin(ang) * Lh, px + Math.cos(ang) * Lh, py + Math.sin(ang) * Lh, { len: 300, scale: 2.2, width: 16, warn: 0.45, warnW: 18, warnA: 0.22, vol: 0.35, z: 32 });
      H.punch(tc, 0.9);
    }
    H.barrage(at(92), 3, { vol: 0.2 }); H.barrage(at(93), 3, { vol: 0.2 });
    H.say(at(89), at(90, 2), ['我不会……', '输给你的！'], { cps: 14 });
    H.face(at(89), 2); H.face(at(90, 2), 6);
    // 93: the box pulls itself back together round the soul
    H.soulTo(at(93, 3) - 0.1, at(93, 3) + 0.1, L.soul[0], L.soul[1], 'outExpo');
    TL.box.set(at(93, 3), Object.assign({ draw: 0, fill: 0 }, L.boxGreen)).to(at(93, 3), at(93, 3, 2), { draw: 1 }, 'outExpo');
    H.sfx(at(93, 3), 'UndSelect', 0.5);
    TL.hud.to(at(93, 3), at(94), { a: 1 }, 'out');
    TL.btn.forEach((b) => b.to(at(93, 3), at(94), { a: 1 }, 'out'));
    TL.soulCol.set(at(94) - 0.02, 'green');
    H.sfx(at(94), 'Ding', 0.5);
    TL.shield.to(at(94) - 0.02, at(94) + 0.1, { a: 1 }, 'out');
    // 94 - 95 in first person: the camera dives into the soul, the view becomes its own
    TL.safe.to(at(93, 3, 1), at(93, 3, 2), { v: 0 }, 'inOut').to(at(95, 3, 2), at(96) - 0.05, { v: 1 }, 'inOut');
    H.cam(at(93, 3, 2), at(94) + 0.06, { x: 480, y: 352, zoom: 5.5, roll: 0 }, 'in');
    H.cam(at(95, 3, 2), at(96) - 0.03, { x: 480, y: 262, zoom: 1.3 }, 'outExpo');
    TL.post.to(at(92), at(95), { bloom: 1.5, ca: 1.6 }, 'inOut');
    TL.rumble.to(at(93), at(95, 3), { v: 4.5 }, 'in');

    // ------------------------------------------------------------ 94 - 95: the ring, then the fill
    // twelve spears gather round the soul through bar 94 (they hover, drawn here), then on
    // 95's fill each one is thrown in as a normal spear from its side
    const fill = [0, 2, 3, 4, 6, 8, 10, 11, 12, 13, 14, 15];
    const order = ['u', 'r', 'd', 'l'];
    H.sfx(at(94), 'UndSpearAppear', 0.4);
    for (let i = 0; i < 12; i++) {
      const side = order[i % 4], tIn = at(94, 0, i), tHit = at(95, 0, fill[i]), travel = 0.36, tGo = tHit - travel;
      const ang = H.SIDE_ANG[side] + (Math.floor(i / 4) - 1) * 0.22;
      TL.add({
        t0: tIn, t1: tGo, z: -150,
        draw(ctx, emi, t, S) {
          const k = U.eOutBack(U.clamp((t - tIn) / 0.25)), r = 140 + (1 - k) * 80 + Math.sin(t * 9 + i) * 3;
          const x = S.soul.x + Math.cos(ang) * r, y = S.soul.y + Math.sin(ang) * r;
          D.arrow(ctx, emi, 'blue', { u: 'd', d: 'u', l: 'r', r: 'l' }[side], x, y, { alpha: U.clamp((t - tIn) / 0.1), scale: H.ARROW });
        },
      });
      H.sfx(tIn, 'Hit', 0.2);
      H.green(tHit, side, { travel, dist: 140, vol: 0, hitVol: 0.55 });
    }
    const ringFP = [];
    for (let i = 0; i < 12; i++) { const side = order[i % 4]; ringFP.push({ side, tIn: at(94, 0, i), tGo: at(95, 0, fill[i]) - 0.36, ang: H.SIDE_ANG[side] + (Math.floor(i / 4) - 1) * 0.22 }); }
    H.firstPerson(at(94) + 0.04, at(95, 3, 2), { ring: ringFP });
    TL.und.to(at(94), at(95), { arm: 1.2, lean: -0.06 }, 'inOut');
    TL.und.to(at(95), at(95, 0, 2), { arm: -0.3, lean: 0.05 }, 'outExpo');
    TL.und.to(at(95, 0, 2), at(95, 3), { arm: 0, lean: 0 }, 'inOut');
    TL.soul.to(at(95), at(96), { sc: 1.3 }, 'in');

    // ------------------------------------------------------------ 96: the last hit
    const tEnd = at(96);
    TL.shield.to(tEnd, tEnd + 0.1, { a: 0 }, 'out');
    TL.soul.to(tEnd, tEnd + 0.3, { sc: 1 }, 'out');
    H.band(at(95, 3), true); // the last FIGHT; the band stays for the ring-out and the epilogue
    TL.btn[0].set(at(95, 3, 2), { sel: 1 }).set(tEnd + 0.2, { sel: 0 });
    H.sfx(tEnd - 0.04, 'Swipe', 0.6);
    TL.add({ t0: tEnd - 0.05, t1: tEnd + 0.6, z: 55, draw(ctx, emi, t, S) { D.slash(ctx, emi, S.und.x + 4, S.und.y - 150, (t - tEnd + 0.05) / 0.6, { len: 220, w: 16 }); } });
    H.bigHit(tEnd + 0.1, { flash: 1, inv: 0.07, bw: 0.05, amp: 22 });
    // the final blow (Smash): the frame holds on a blue-white burst; the bar empties for good
    H.freeze(tEnd + 0.26, 0.7, { smash: true, zoom: 0.2, cy: 230 });
    H.bossHp(tEnd + 0.15, 0, { dur: 0.5, ease: 'inOut', lagDelay: 0.9 });
    TL.boss.to(tEnd + 1.0, tEnd + 1.3, { lives: 0, posture: 0, pa: 0 }, 'inOut').to(tEnd + 2.2, tEnd + 3.0, { a: 0 }, 'inOut');
    H.shock(tEnd + 0.1, 480, 150, { r: 600, dust: false });
    H.speed(tEnd + 0.1, tEnd + 0.9, { k: 1, cy: 200 });
    TL.rumble.set(tEnd + 0.1, { v: 8 }).to(tEnd + 0.1, tEnd + 2.5, { v: 0 }, 'out');
    TL.shadow.to(tEnd + 0.1, tEnd + 2.2, { a: 0, eye: 0 }, 'inOut');
    TL.rage.to(tEnd + 0.1, tEnd + 1.6, { v: 0 }, 'inOut');
    H.sfx(tEnd + 0.1, 'HeavyDamage', 0.8);
    H.sfx(tEnd + 0.1, 'Boom', 0.7);
    TL.und.to(tEnd + 0.1, tEnd + 0.12, { flash: 1, shake: 9, ghost: 0 }, 'lin').to(tEnd + 0.12, tEnd + 1.2, { flash: 0, shake: 0 }, 'out');
    H.face(tEnd + 0.1, 14);
    TL.add({
      t0: tEnd + 0.1, t1: T.dur, z: 56,
      draw(ctx, emi, t, S) {
        const u = t - tEnd - 0.1, out = U.clamp((T.dur - t) / 0.5);
        const bounce = u < 0.35 ? -Math.abs(Math.sin((u / 0.35) * Math.PI)) * 18 : 0;
        const x = S.und.x, y = S.und.y - 175;
        D.dmg(ctx, '11960', x, y + bounce, { align: 'center', color: '#ff2020', alpha: out, glow: emi, glowA: 0.3 });
        D.enemyHp(ctx, x, y + 42, 200, U.lerp(0.52, 0, U.eOut(U.clamp(u / 1.2))), out);
      },
    });
    // the ring-out: the melt takes her; the camera eases in
    TL.melt.set(tEnd + 0.9, 2);
    TL.safe.to(tEnd + 0.3, tEnd + 1.2, { v: 0 }, 'inOut');
    TL.und.to(tEnd + 0.88, tEnd + 0.9, { flash: 0.8 }, 'lin').to(tEnd + 0.9, tEnd + 1.6, { flash: 0 }, 'out');
    H.sfx(tEnd + 0.9, 'Drip', 0.5);
    H.cut(tEnd, { x: 480, y: 250, zoom: 1.2, roll: 0, pitch: 0, yaw: 0 });
    H.cam(tEnd + 0.4, T.dur + 2, { y: 160, zoom: 1.7 }, 'inOut');
    TL.hud.to(tEnd + 0.6, tEnd + 1.6, { a: 0 }, 'inOut');
    TL.btn.forEach((b) => b.to(tEnd + 0.6, tEnd + 1.6, { a: 0 }, 'inOut'));
    TL.box.to(tEnd + 0.6, tEnd + 1.4, { draw: 0 }, 'inOut');
    TL.soul.to(tEnd + 0.6, tEnd + 1.4, { a: 0 }, 'inOut');
    TL.bg.to(tEnd, tEnd + 2, { cav: 0.5, rain: 0.35, drift: 3 }, 'inOut');
    TL.post.to(tEnd, tEnd + 2.5, { bloom: 1, ca: 0.4, desat: 0.35, vig: 0.6 }, 'inOut');
  });
})();
