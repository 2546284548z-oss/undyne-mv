// Bars 90 - 93: the chase over the falls. After the walls of spears the picture whips sideways
// onto the wooden bridge in Waterfall, seen from the side (her chase through Waterfall, the
// part of the story every player remembers). The soul runs, she runs it down: spears burst up
// through the planks (the soul jumps them), she hurls spears low (jump) and high (stay down);
// once she overtakes it in one leap, drives her spear into the bridge ahead and leaps back over
// it. The soul is red: tools/check.cjs checks every hazard, her body included.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at, R = Math.round;
  const SX = 600; // the soul's column
  const GY = 424; // the top of the bridge
  const SY = GY - 12; // the soul's centre while it runs
  const V = 500; // the bridge scrolls by this (px/s): one beat = 200 px
  const UY = GY + 6, USC = 1.5; // her feet, her scale on the bridge
  const SOUL_R = 7;
  TL.chase = new MV.Track({ k: 0 });

  // ------------------------------------------------------------ the backdrop
  const T0 = at(90), scroll = (t) => (t - T0) * V;
  const wrap = (x, w) => ((x % w) + w) % w;
  // sc: a fixed scroll position (the prologue's still bridge); default: running with the chase
  D.chase = (ctx, emi, t, k, sc) => {
    const s = sc ?? scroll(t), X0 = -MV.PADX, W = MV.VW + MV.PADX * 2, Y0 = -MV.PADY, Hh = MV.VH + MV.PADY * 2;
    D.rect(ctx, X0, Y0, W, Hh, '#040918', k);
    // the far cavern wall: stepped silhouettes (slow), crystals in it
    for (let i = 0; i < 14; i++) {
      const w = 140 + U.hash(i * 2.1) * 180, h = 120 + U.hash(i * 3.7) * 220;
      const x = X0 + wrap(i * 118 - s * 0.15, W + 260) - 130;
      D.rect(ctx, x, GY - 70 - h, w, h + 70, '#0a1430', k);
      D.rect(ctx, x + 12, GY - 70 - h - 18, w * 0.5, 18, '#0a1430', k);
    }
    for (let i = 0; i < 90; i++) {
      const x = X0 + wrap(U.hash(i * 3.3) * W - s * 0.25, W), y = Y0 + U.hash(i * 5.1) * (GY - 80 - Y0);
      const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + U.hash(i) * 2) + i), c = U.hash(i * 9.7) < 0.8 ? '#5fd8ff' : '#ffffff';
      D.rect(ctx, x, y, 2, 2, c, k * (0.35 + 0.6 * tw));
      if (emi && i % 6 === 0) D.rect(emi, x - 3, y - 3, 8, 8, c, k * 0.4 * tw);
    }
    // the falls behind the bridge: pale columns with water streaking down them
    for (let i = 0; i < 5; i++) {
      const w = 46 + U.hash(i * 7.1) * 60, x = X0 + wrap(i * 290 + 60 - s * 0.4, W + 200) - 100;
      D.rect(ctx, x, Y0, w, GY - Y0, '#1a3a78', k * 0.3);
      D.rect(ctx, x + w * 0.2, Y0, w * 0.15, GY - Y0, '#3a6ab8', k * 0.18);
      if (emi) D.rect(emi, x, Y0, w, GY - Y0, '#2a6bff', k * 0.08);
      for (let j = 0; j < 9; j++) {
        const yy = Y0 + wrap(U.hash(i * 11 + j) * 700 + t * (520 + j * 30), GY - Y0 + 40) - 40;
        D.rect(ctx, x + U.hash(i * 5 + j * 1.3) * (w - 4), yy, 2, 26, '#9fd0ff', k * 0.5);
      }
    }
    // tall marsh grass between the falls and the bridge (faster)
    for (let i = 0; i < 26; i++) {
      const x = X0 + wrap(i * 52 + U.hash(i) * 30 - s * 0.7, W + 60) - 30, h = 26 + U.hash(i * 4.3) * 40;
      D.rect(ctx, x, GY - h, 4, h, '#0e2a3a', k);
      D.rect(ctx, x + 6, GY - h * 0.7, 3, h * 0.7, '#0e2a3a', k);
    }
    // the water below, running the other way
    D.rect(ctx, X0, GY + 16, W, Hh, '#06183a', k);
    for (let i = 0; i < 40; i++) {
      const y = GY + 26 + U.hash(i * 2.7) * 120, x = X0 + wrap(U.hash(i * 6.1) * W - s * 1.3, W);
      D.rect(ctx, x, y, 18 + U.hash(i) * 30, 2, '#2a6bff', k * 0.45);
    }
    // the bridge: planks at full speed, rails and posts
    D.rect(ctx, X0, GY, W, 16, '#5a3a20', k);
    D.rect(ctx, X0, GY, W, 3, '#8a6038', k);
    for (let x = X0 + wrap(-s, 28) - 28; x < X0 + W; x += 28) D.rect(ctx, x, GY, 2, 16, '#2a180a', k);
    for (let x = X0 + wrap(-s, 112) - 112; x < X0 + W; x += 112) { D.rect(ctx, x, GY - 30, 6, 30, '#3a2412', k); D.rect(ctx, x, GY - 32, 6, 3, '#8a6038', k); }
    D.rect(ctx, X0, GY - 26, W, 2, '#6a4a2a', k * 0.9);
  };

  // ------------------------------------------------------------ hazards
  // a spear bursting up through the planks; it rides the bridge past the soul at tPass
  const ground = (tPass, o = {}) => {
    const len = o.len ?? 62, tE = tPass - 0.22, tw = tE - 0.36;
    const xAt = (t) => SX + V * (tPass - t);
    const outAt = (t) => (t < tE ? 0 : U.eOut(U.clamp((t - tE) / 0.05)));
    H.sfx(tw, 'UndSpearAppear', 0.16); H.sfx(tE, 'UndSpearRise', 0.42);
    TL.add({
      t0: tw, t1: tPass + 1.6, z: 30, kind: 'white',
      hit(t, x, y) { const L2 = len * outAt(t); if (L2 <= 0) return false; const sx = xAt(t); return x + SOUL_R > sx - 6 && x - SOUL_R < sx + 6 && y + SOUL_R > GY - L2; },
      draw(ctx, emi, t) {
        const x = xAt(t), L2 = len * outAt(t);
        if (t < tE) { // a glint in the planks
          const on = Math.floor(t * 20) % 2;
          D.rect(ctx, x - 9, GY - 3, 18, 6, on ? '#ff2030' : '#ffffff', U.clamp((t - tw) / 0.08) * 0.9);
          if (emi) D.rect(emi, x - 12, GY - 8, 24, 14, '#ff2030', 0.5);
          return;
        }
        D.spear(ctx, emi, x, GY - L2, -Math.PI / 2, { len: L2 + 30 });
        if (t < tE + 0.1) D.rect(ctx, x - 14, GY - 4, 28, 4, '#ffffff', 1 - (t - tE) / 0.1);
      },
    });
    TL.burst(tE, { x: () => xAt(tE), y: GY, n: 10, speed: [60, 200], ang: [Math.PI * 1.15, Math.PI * 1.85], life: [0.15, 0.35], g: 500, colors: ['#8a6038', '#ffffff'], size: [2, 3], z: 31 });
  };
  // a spear she hurls straight along the bridge: low (the soul jumps it) or high (it stays down)
  const throwAt = (tPass, high) => {
    const y = high ? SY - 64 : SY, x0 = 250, x1 = 1180, v = 1300;
    const t0 = tPass - (SX + 35 - x0) / v;
    H.flyer(t0, t0 + (x1 - x0) / v, x0, y, x1, y, { len: 80, warn: 0.3, warnA: 0.3, vol: 0.3, z: 32 });
    H.sfx(t0, 'Whoosh', 0.3);
    H.throwArm(t0, 1);
  };
  // the soul's jump (centred on tPass)
  const jump = (tPass, h = 86, dur = 0.4) => {
    TL.soul.hop(tPass - dur / 2, tPass + dur / 2, { x: SX, y: SY }, h, 'y', 'lin');
    H.sfx(tPass - dur / 2, 'Whoosh', 0.12);
  };

  MV.sections.push(() => {
    const tIn = at(89, 3, 2), tOut = at(93, 2);
    // ------------------------------------------------------------ the whip in
    H.sfx(tIn, 'Whoosh', 0.6); H.sfx(at(90), 'Slam', 0.4);
    H.cam(tIn, at(89, 3, 3), { x: 780 }, 'in');
    H.cut(at(89, 3, 3), { x: 180, y: 270, zoom: 1, roll: 0, pitch: 0, yaw: 0 });
    H.cam(at(89, 3, 3), at(90) + 0.05, { x: 480 }, 'outExpo');
    TL.chase.to(at(89, 3, 3) - 0.02, at(89, 3, 3), { k: 1 }, 'lin').to(tOut + 0.18, tOut + 0.2, { k: 0 }, 'lin');
    TL.add({ t0: tIn, t1: at(93, 3) + 0.1, z: -950, draw(ctx, emi, t) { const k = TL.chase.at(t).k; if (k > 0.001) D.chase(ctx, emi, t, k); } });
    H.speed(tIn, at(90, 0, 3), { k: 1, dir: 'h' });
    H.speed(at(90), tOut, { k: 0.35, dir: 'h', flip: true });
    TL.safe.to(tIn, tIn + 0.05, { v: 0 }, 'lin').to(tOut + 0.2, at(93, 3), { v: 1 }, 'inOut');
    TL.shadow.to(tIn, tIn + 0.1, { a: 0 }, 'out').to(at(93, 3), at(94), { a: 0.95 }, 'inOut');
    TL.rumble.to(at(90), at(90, 1), { v: 1.2 }, 'out');
    // the soul takes its place on the bridge; she lands behind it
    H.soulTo(tIn + 0.02, at(90) - 0.04, SX, SY, 'outExpo');
    TL.und.set(at(89, 3, 3), { x: 170, y: UY, sc: USC, ghost: 0.35, lean: 0.04 });
    // she runs: a bounce on every beat, closing in and dropping back
    const runX = { 90: 190, 91: 230 };
    for (let b = 90; b < 94; b++) for (let k = 0; k < 4; k++) {
      const t = at(b, k);
      if (t >= at(91, 3) - 0.01 && t < at(92, 2)) continue; // the overtaking leap
      if (t >= tOut) continue;
      TL.und.to(t, t + 0.16, { y: UY - 10 }, 'out').to(t + 0.16, t + 0.4, { y: UY }, 'in');
    }
    TL.und.to(at(90), at(91), { x: runX[90] }, 'inOut').to(at(91), at(91, 3), { x: runX[91] }, 'inOut');
    // dust kicked up behind the running soul on every 8th it is on the ground
    TL.add({
      t0: at(90), t1: tOut, z: 34,
      draw(ctx, emi, t, S) {
        for (let i = 0; i < 8; i++) {
          const te = at(90, 0, Math.floor((t - at(90)) / T.s16 / 2) * 2 - i * 2), age = t - te;
          if (age < 0 || age > 0.5 || TL.soul.at(te).y < SY - 2) continue;
          D.rect(ctx, SX - 12 - age * V, GY - 4 - age * 30, 6 - age * 6, 6 - age * 6, '#c8b090', (1 - age / 0.5) * 0.7);
        }
      },
    });
    // her body is a hazard too (she leaps over the soul)
    TL.add({
      t0: at(90), t1: tOut, z: 0, kind: 'white', draw() {},
      hit(t, x, y) { const u = TL.und.at(t), hw = 22 * u.sc; return x + SOUL_R > u.x - hw && x - SOUL_R < u.x + hw && y + SOUL_R > u.y - 128 * u.sc && y - SOUL_R < u.y; },
    });

    // ------------------------------------------------------------ 90 - 91
    // doubled: the planks burst in pairs (one jump clears both), spears come low in pairs, and
    // every beat the soul stays on the ground a high spear skims over it
    const ground2 = (t) => { ground(t - 0.04); ground(t + 0.04); jump(t); };
    throwAt(at(90, 0, 2), true);
    ground2(at(90, 1));
    throwAt(at(90, 2), true);
    ground2(at(90, 3));
    throwAt(at(91, 0, 2) - 0.04, false); throwAt(at(91, 0, 2) + 0.04, false); jump(at(91, 0, 2));
    ground2(at(91, 1, 2));
    throwAt(at(91, 2, 2), true);
    throwAt(at(91, 3), true);
    H.say(at(90, 1), at(91, 3), ['我不会……', '输给你的！'], { cps: 14 });
    H.face(at(90), 12); H.face(at(90, 1), 2); H.face(at(91, 3), 12);

    // ------------------------------------------------------------ 91:3 - 92: she overtakes it
    // a leap over the soul, the spear driven into the planks ahead of it; she rides the bridge
    // back a moment and leaps back over; the soul jumps the spear she left standing
    const tLand = at(92);
    H.sfx(at(91, 3), 'Whoosh', 0.5);
    TL.und.hop(at(91, 3), tLand, { x: 770, y: UY }, 300, 'y', 'lin');
    TL.und.to(at(91, 3), at(91, 3, 3), { arm: 1.2, lean: -0.05 }, 'out').to(at(91, 3, 3), tLand, { arm: -0.5, lean: 0.06 }, 'outExpo').to(at(92, 1), at(92, 2), { arm: 0, lean: 0 }, 'inOut');
    TL.und.to(tLand, at(92, 0, 2), { x: 770 - V * T.s16 * 2 }, 'lin');
    TL.und.hop(at(92, 0, 2), at(92, 2), { x: 200, y: UY }, 320, 'y', 'lin');
    H.hit(tLand, 1.3, { dy: 1, flash: 0.3 }); H.sfx(tLand, 'Slam', 0.6); H.sfx(tLand, 'Boom', 0.4); H.sfx(tLand, 'UndSpearRise', 0.5);
    H.shock(tLand, 770, GY, { r: 260, ang: [Math.PI * 1.05, Math.PI * 1.95] });
    H.fracture(tLand, 770, GY - 30, { flash: 0.2, n: 8 });
    TL.rumble.to(tLand, tLand + 0.02, { v: 7 }, 'lin').to(tLand + 0.02, tLand + 0.6, { v: 1.2 }, 'out');
    H.face(tLand, 12);
    const stuckX = (t) => SX + V * (at(92, 1) - t), STUCK = 84;
    TL.add({
      t0: tLand, t1: tLand + 2, z: 31, kind: 'white',
      hit(t, x, y) { const sx = stuckX(t); return x + SOUL_R > sx - 6 && x - SOUL_R < sx + 6 && y + SOUL_R > GY - STUCK; },
      draw(ctx, emi, t) { const x = stuckX(t); D.spear(ctx, emi, x, GY + 10, Math.PI / 2, { len: STUCK + 40, scale: 1.2, glow: 0.6 }); },
    });
    jump(at(92, 1), 108, 0.44);
    throwAt(at(92, 2, 2) - 0.04, false); throwAt(at(92, 2, 2) + 0.04, false); jump(at(92, 2, 2));
    ground2(at(92, 3, 2));
    // ------------------------------------------------------------ 93: six at once, one long jump
    for (const tt of [at(93), at(93, 0, 2), at(93, 1)]) { ground(tt - 0.04); ground(tt + 0.04); }
    jump(at(93, 0, 2), 120, 0.76);
    H.sfx(at(93), 'Warning', 0.3);
    TL.und.to(at(92, 3), at(93), { x: 260 }, 'inOut');
    H.throwArm(at(93) - 0.2, 1.1);

    // ------------------------------------------------------------ the whip out: back to the arena
    H.sfx(tOut, 'Whoosh', 0.6);
    H.cam(tOut, tOut + 0.18, { x: 180 }, 'in');
    H.cut(tOut + 0.18, { x: 780, y: 270, zoom: 1, roll: 0 });
    H.cam(tOut + 0.18, at(93, 3), { x: 480 }, 'outExpo');
    H.speed(tOut, at(93, 3), { k: 1, dir: 'h', flip: true });
    TL.und.set(tOut + 0.18, { x: 480, y: L.und[1], sc: 2, ghost: 0.5, lean: 0, arm: 0 });
    H.soulTo(tOut + 0.18, at(93, 3) - 0.1, L.soul[0], L.soul[1] - 40, 'outExpo');
  });
})();
