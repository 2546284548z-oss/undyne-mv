// Bars 72 - 97, the last section: three 8-bar phrases, everything she has.
//   72 - 79  green: the densest shield storm yet, the arena rolling slowly
//   80 - 87  red: floor and ceiling, rain, rings, beams, sweeps - all of it once more
//   88 - 95  green: the storm again; 92 - 93 the world turns; 94 her spears ring the
//            soul; 95's drum fill sends them in one per 16th, the shield spinning round
//   96       the last hit lands on the last chord. The HP bar empties; she does not fall.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;
  const B = L.boxRed, TOP = B.y, BOT = B.y + B.h, MID = B.y + B.h / 2;

  MV.sections.push(() => {
    // ------------------------------------------------------------ 72: she is whole again
    H.bigHit(at(72));
    H.sfx(at(72), 'Boom', 0.6);
    TL.melt.set(at(72), 0);
    H.face(at(72), 1); H.face(at(72, 2), 0);
    TL.und.to(at(72), at(72) + 0.02, { flash: 1 }, 'lin').to(at(72) + 0.02, at(72, 2), { flash: 0, shake: 0 }, 'out');
    TL.und.to(at(72), at(73), { ghost: 0.6, drip: 0.45, breathe: 1, eye: 1 }, 'inOut');
    TL.hud.to(at(72), at(72, 2), { a: 1 }, 'out');
    TL.btn.forEach((b) => b.to(at(72), at(72, 2), { a: 1, dy: 0 }, 'out'));
    TL.shield.to(at(72), at(72, 1), { ring: 1 }, 'out');
    TL.bg.to(at(72), at(72, 2), { cav: 0.9, rain: 0.25, flowers: 0, drift: 22, ceiling: 0.8 }, 'out');
    TL.post.to(at(72), at(72, 2), { bloom: 1.3, vig: 0.42, ca: 1, desat: 0 }, 'out');
    H.cut(at(72), { x: 480, y: 226, zoom: 1.34, roll: 0, pitch: 0, yaw: 0 });
    H.say(at(72, 1), at(73, 3), ['来吧！！'], { cps: 10, scale: 2 });

    // ------------------------------------------------------------ 72 - 79: storm
    H.resetGreen('u');
    for (let b = 72; b < 80; b++) {
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.8, gap: 2, yel: 0.5, travel: 0.5 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.45);
      if (b % 2 === 0) H.swing(at(b), b % 4 ? 'red' : 'green', b % 4 === 2);
    }
    for (let b = 72; b < 80; b += 2) H.cam(at(b), at(b + 2), { roll: ((b - 72) / 2) % 2 ? -0.09 : 0.09 }, 'inOut');
    H.cam(at(76), at(78), { pitch: 0.22 }, 'inOut');
    H.cam(at(78), at(79, 3), { pitch: 0, roll: 0 }, 'inOut');
    H.say(at(76), at(78), ['你从我身上……', '什么也得不到！'], { cps: 12 });
    H.face(at(76), 6); H.face(at(78), 0);

    // ------------------------------------------------------------ 80 - 87: the gauntlet
    H.toRed(at(80), { camY: 252, zoom: 1.1 });
    H.bands(80, ['top', 'bot']);
    H.rain(82, 300, 660);
    H.soulTo(at(84) - 0.32, at(84) - 0.12, 480, MID, 'outExpo');
    const [x1] = H.ringAt(84, -1);
    H.sweep(at(84, 3), MID - 46, 1); H.sweep(at(84, 3, 2), MID + 46, -1);
    H.ringAt(85, 1);
    H.sweep(at(85, 3), MID - 46, -1); H.sweep(at(85, 3, 2), MID + 46, 1);
    H.beams(86, [0, 1, 2, 3], { x: 480 });
    H.soulTo(at(86, 3) + 0.24, at(86, 3) + 0.34, 480, MID, 'outExpo');
    for (const x of [300, 660]) for (const k of [1, 3]) H.wallSpear(at(86, k) - 0.3, at(86, k), k === 1 ? 'b' : 't', x, { len: 80, vol: 0.25 });
    for (const k of [0, 1]) { H.sweep(at(87, k), TOP + 26, k ? 1 : -1, { warn: 0.2 }); H.sweep(at(87, k, 2), BOT - 26, k ? -1 : 1, { warn: 0.2 }); }
    TL.und.to(at(85, 3), at(86), { eye: 1.2 }, 'inOut');
    H.say(at(82), at(84), ['只要我还站着……'], { cps: 12 });
    H.face(at(82), 9); H.face(at(84), 0);
    for (let b = 80; b < 88; b++) for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.35);
    H.swell(at(88), 0.45);

    // ------------------------------------------------------------ 88 - 93: green, the last storm
    H.toGreen(at(88));
    H.resetGreen('l');
    H.cam(at(88) - 0.3, at(88, 2), { x: 480, y: 228, zoom: 1.38, roll: 0, pitch: 0.15 }, 'inOut');
    for (let b = 88; b < 94; b++) {
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.8, gap: 2, yel: 0.55, travel: 0.48 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.45);
      H.swing(at(b), b % 2 ? 'red' : 'green', b % 2 === 1);
    }
    for (let i = 0; i < 2; i++) H.cam(at(92 + i) - 0.12, at(92 + i) + 0.2, { roll: -(i + 1) * Math.PI / 2, pitch: 0.12 }, 'outExpo');
    H.cam(at(94) - 0.3, at(94) + 0.2, { roll: -Math.PI, pitch: 0 }, 'outExpo');
    H.cut(at(95) - 0.001, { roll: 0 });
    H.cam(at(94), at(95), { zoom: 1.55, y: 262 }, 'inOut');
    TL.post.to(at(92), at(95), { bloom: 1.45, ca: 1.3 }, 'inOut');
    H.say(at(89), at(91), ['我不会……', '输给你的！'], { cps: 12 });
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
    H.bigHit(tEnd + 0.1, { flash: 1 });
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
