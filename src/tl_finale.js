// Bars 72 - 97, the last section: three 8-bar phrases, everything she has.
//   72 - 79  green: the cut-in, then the densest shield storm yet; she dashes every bar
//   80 - 87  red: fences, rain, rings, beams, sweeps - all of it once more, leaping
//   88 - 95  green: the storm again; 92 - 93 the world turns; 94 her spears ring the
//            soul; 95's drum fill sends them in one per 16th, the shield spinning round
//   96       the last hit lands on the last chord. The HP bar empties; she does not fall.
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
    TL.und.to(at(72), at(72) + 0.02, { flash: 1 }, 'lin').to(at(72) + 0.02, at(72, 2), { flash: 0, shake: 0 }, 'out');
    TL.und.to(at(72), at(73), { ghost: 0.6, drip: 0.45, breathe: 1, eye: 1.2 }, 'inOut');
    TL.hud.to(at(72), at(72, 2), { a: 1 }, 'out');
    TL.btn.forEach((b) => b.to(at(72), at(72, 2), { a: 1, dy: 0 }, 'out'));
    TL.shield.to(at(72), at(72, 1), { ring: 1 }, 'out');
    TL.bg.to(at(72), at(72, 2), { cav: 0.9, rain: 0.25, flowers: 0, drift: 50, ceiling: 0.8 }, 'out');
    TL.post.to(at(72), at(72, 2), { bloom: 1.35, vig: 0.45, ca: 1.2, desat: 0 }, 'out');
    TL.shadow.set(at(72), { a: 0.95, sc: 7.5, y: 800, eye: 2 });
    TL.rage.set(at(72), { v: 1.5 });
    TL.rumble.set(at(72), { v: 6 }).to(at(72), at(72, 2), { v: 2.6 }, 'out');
    H.cut(at(72), { x: 480, y: 236, zoom: 1.34, roll: 0, pitch: 0, yaw: 0 });
    H.cutin(at(72), 0.7, { text: '来吧！！！', head: 12 });
    H.shock(at(72), 480, 150, { r: 520, dust: false });
    H.barrage(at(72, 1, 3), 5);

    // ------------------------------------------------------------ 72 - 79: storm, she never stops moving
    H.resetGreen('u');
    const xs72 = [480, 370, 590, 400, 560, 360, 600, 480];
    const flur72 = { 73: 'l', 75: 'r', 77: 'd', 79: 'u' };
    for (let b = 72; b < 80; b++) {
      const f = flur72[b];
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.8, gap: 2, yel: 0.5, travel: 0.42, from: b === 72 ? 8 : 0, to: f ? 12 : 16 });
      if (f) H.flurry(at(b, 3), f, 4, T.s16, { travel: 0.36 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.6);
      if (b > 72) { H.dash(at(b) - 0.1, at(b) + 0.08, xs72[b - 72]); H.snap(at(b), { zoom: b % 2 ? 1.48 : 1.36, x: 480 + (xs72[b - 72] - 480) * 0.3, roll: (b % 2 ? -1 : 1) * 0.1 }); }
      if (b % 2 === 0) { H.swing(at(b), b % 4 ? 'red' : 'green', b % 4 === 2); H.barrage(at(b, 2), 3, { vol: 0.22 }); }
    }
    H.speed(at(72, 2), at(80), { k: 0.35 });
    H.cam(at(76), at(78), { pitch: 0.24 }, 'inOut');
    H.cam(at(78), at(79, 3), { pitch: 0 }, 'inOut');
    H.say(at(76), at(78), ['你从我身上……', '什么也得不到！'], { cps: 14 });
    H.face(at(76), 6); H.face(at(78), 0);

    // ------------------------------------------------------------ 80 - 87: the gauntlet
    H.toRed(at(80), { camY: 246, zoom: 1.12 });
    H.bigHit(at(80), { flash: 0.35, flashCol: [1, 0.2, 0.2] });
    H.dash(at(80) - 0.1, at(80) + 0.06, 480);
    H.fenceBar(80, [1, 2, 3], H.gaps(80, [1, 2, 3]), 'b');
    H.fenceBar(81, [0, 1, 2, 3], H.gaps(81, [0, 1, 2, 3]), 't');
    H.leap(at(80, 2), at(81), 340, 200, { fx: { flash: 0.12, amp: 8 }, rest: 2 });
    H.leap(at(81, 2), at(82), 620, 200, { fx: { flash: 0.12, amp: 8 }, rest: 2 });
    H.rain(82, 300, 660);
    H.dash(at(83), at(83, 0, 2), 360);
    H.soulTo(at(84) - 0.32, at(84) - 0.12, 480, MID, 'outExpo');
    H.leap(at(83, 2), at(84), 480, 160, { fx: { flash: 0.15, amp: 9 }, rest: 2 });
    H.ringAt(84, -1);
    H.sweep(at(84, 3), MID - 46, 1); H.sweep(at(84, 3, 2), MID + 46, -1);
    H.ringAt(85, 1);
    H.sweep(at(85, 3), MID - 46, -1); H.sweep(at(85, 3, 2), MID + 46, 1);
    H.beams(86, [0, 1, 2, 3], { x: 480 });
    H.soulTo(at(86, 3) + 0.24, at(86, 3) + 0.34, 480, MID, 'outExpo');
    for (const x of [300, 660]) for (const k of [1, 3]) H.wallSpear(at(86, k) - 0.3, at(86, k), k === 1 ? 'b' : 't', x, { len: 80, vol: 0.25 });
    for (const k of [0, 1]) { H.sweep(at(87, k), TOP + 26, k ? 1 : -1, { warn: 0.2 }); H.sweep(at(87, k, 2), BOT - 26, k ? -1 : 1, { warn: 0.2 }); }
    TL.und.to(at(85, 3), at(86), { eye: 1.6 }, 'inOut');
    TL.shadow.to(at(86), at(86, 1), { eye: 2.4 }, 'inOut');
    H.say(at(82), at(84), ['只要我还站着……'], { cps: 14 });
    H.face(at(82), 9); H.face(at(84), 0);
    for (let b = 80; b < 88; b++) for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.45);
    H.barrage(at(82), 3, { vol: 0.22 }); H.barrage(at(84, 2), 3, { vol: 0.22 }); H.barrage(at(86), 3, { vol: 0.22 });
    H.swell(at(88), 0.5);

    // ------------------------------------------------------------ 88 - 93: green, the last storm
    H.toGreen(at(88));
    H.resetGreen('l');
    H.bigHit(at(88), { flash: 0.5 });
    H.shock(at(88), L.soul[0], L.soul[1], { r: 420, dust: false });
    H.cam(at(88) - 0.3, at(88, 2), { x: 480, y: 232, zoom: 1.4, roll: 0, pitch: 0.15 }, 'inOut');
    TL.rumble.to(at(88), at(88, 1), { v: 3 }, 'out');
    const flur88 = { 89: 'r', 91: 'l' };
    for (let b = 88; b < 94; b++) {
      const f = flur88[b];
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.8, gap: 2, yel: 0.55, travel: 0.4, from: b === 88 ? 2 : 0, to: f ? 12 : 16 });
      if (f) H.flurry(at(b, 3), f, 4, T.s16, { travel: 0.34 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.6);
      H.swing(at(b), b % 2 ? 'red' : 'green', b % 2 === 1);
      H.barrage(at(b, 2), 2, { vol: 0.2 });
      if (b < 92) H.dash(at(b) - 0.1, at(b) + 0.08, [400, 560, 380, 580][b - 88]);
    }
    for (let i = 0; i < 2; i++) H.cam(at(92 + i) - 0.12, at(92 + i) + 0.2, { roll: -(i + 1) * Math.PI / 2, pitch: 0.12 }, 'outExpo');
    H.cam(at(94) - 0.3, at(94) + 0.2, { roll: -Math.PI, pitch: 0 }, 'outExpo');
    H.cut(at(95) - 0.001, { roll: 0 });
    H.cam(at(94), at(95), { zoom: 1.55, y: 262 }, 'inOut');
    H.dash(at(92) - 0.1, at(92) + 0.08, 480);
    H.speed(at(92), at(96), { k: 0.55 });
    TL.post.to(at(92), at(95), { bloom: 1.5, ca: 1.6 }, 'inOut');
    TL.rumble.to(at(92), at(95, 3), { v: 4.5 }, 'in');
    H.say(at(89), at(91), ['我不会……', '输给你的！'], { cps: 14 });
    H.face(at(89), 2); H.face(at(91), 6);

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
    TL.und.to(at(94), at(95), { arm: 1.2, lean: -0.06 }, 'inOut');
    TL.und.to(at(95), at(95, 0, 2), { arm: -0.3, lean: 0.05 }, 'outExpo');
    TL.und.to(at(95, 0, 2), at(95, 3), { arm: 0, lean: 0 }, 'inOut');
    TL.soul.to(at(95), at(96), { sc: 1.3 }, 'in');

    // ------------------------------------------------------------ 96: the last hit
    const tEnd = at(96);
    TL.shield.to(tEnd, tEnd + 0.1, { a: 0 }, 'out');
    TL.soul.to(tEnd, tEnd + 0.3, { sc: 1 }, 'out');
    TL.btn[0].set(at(95, 3, 2), { sel: 1 }).set(tEnd + 0.2, { sel: 0 });
    H.sfx(tEnd - 0.04, 'Swipe', 0.6);
    TL.add({ t0: tEnd - 0.05, t1: tEnd + 0.6, z: 55, draw(ctx, emi, t, S) { D.slash(ctx, emi, S.und.x + 4, S.und.y - 150, (t - tEnd + 0.05) / 0.6, { len: 220, w: 16 }); } });
    H.bigHit(tEnd + 0.1, { flash: 1, inv: 0.07, bw: 0.05, amp: 22 });
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
