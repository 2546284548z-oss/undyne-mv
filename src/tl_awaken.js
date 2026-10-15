// Bars 0 - 11. The riff alone (0 - 3): in the dark only her burning eye, then
// her body lights up piece by piece on the riff's 3-3-3-3-4 accents while the
// camera pulls back to the whole figure and the title. The bass enters (4): she
// drives her spear into the ground, the shockwave throws up the battle box and
// her giant shadow rises behind it. 6 - 7: she hurls a spear straight into the
// soul and pins it green. 7 - 10: spears on the 8ths, every block kicking the
// camera. 11: the boss cut-in, she leaps - and lands on the downbeat of 12.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;

  MV.sections.push(() => {
    const [UX, UY] = L.und;
    const parts = D.undyneParts;
    // ------------------------------------------------------------ 0 - 3: the reveal
    const [ex, ey] = D.undyneEye(UX, UY, { breathe: 0 });
    TL.und.set(at(0), { a: 1, eye: 0, glow: 0.2, breathe: 0 });
    TL.uShow.set(at(0), Object.fromEntries(parts.map((p) => [p, 0])));
    H.cut(at(0), { x: ex, y: ey + 6, zoom: 5.5, roll: 0.06 });
    H.cam(at(0), at(1, 3), { zoom: 4.2, roll: -0.03 }, 'inOut');
    TL.post.set(at(0), { bloom: 1.25, vig: 0.6, ca: 0.6, scan: 0.04, desat: 0 });
    // the eye flares on every accent of the first bar
    for (const s of [0, 3, 6, 9, 12]) {
      const t = at(0, 0, s);
      TL.und.to(t, t + 0.02, { eye: 1.6 }, 'lin').to(t + 0.02, t + 0.28, { eye: 0.7 }, 'out');
      H.punch(t, 0.35);
    }
    H.sfx(at(0), 'EyeFlash', 0.45);
    // parts light up: a white flash that settles into the line art
    const reveal = [
      ['head', 1, 0], ['hair', 1, 6], ['torso', 1, 12],
      ['armL', 2, 0], ['spearArm', 2, 6], ['cape', 2, 12],
      ['legs', 3, 0],
    ];
    for (const [p, b, s] of reveal) {
      const t = at(b, 0, s);
      TL.uShow.to(t, t + 0.12, { [p]: 1 }, 'out');
      TL.und.to(t, t + 0.02, { flash: 0.85 }, 'lin').to(t + 0.02, t + 0.35, { flash: 0 }, 'out');
      H.sfx(t, p === 'spearArm' ? 'UndSpearAppear' : 'Hit', p === 'spearArm' ? 0.45 : 0.3);
      H.punch(t, 0.5);
    }
    // the camera falls back: eye -> face -> the whole figure
    H.cam(at(1, 3), at(2, 2), { x: UX, y: UY - 190, zoom: 2.4, roll: 0.02 }, 'inOut');
    H.cam(at(2, 2), at(3, 2), { x: UX, y: UY - 92, zoom: 1.3, roll: 0 }, 'inOut');
    TL.und.to(at(1), at(3), { eye: 0.55, breathe: 1 }, 'inOut');
    TL.bg.to(at(2), at(4), { cav: 0.7, drift: 5, ceiling: 0.9 }, 'inOut');
    // title
    H.sfx(at(3), 'Slam', 0.6);
    H.sfx(at(3), 'Boom', 0.4);
    H.bigHit(at(3), { flash: 0.5, inv: 0.04, bw: 0, amp: 12 });
    H.shock(at(3), UX, UY, { r: 380, ang: [Math.PI * 1.05, Math.PI * 1.95] });
    H.speed(at(3), at(4), { k: 0.7, cy: 230 });
    TL.rumble.set(at(2), { v: 0 }).to(at(2), at(3), { v: 2.5 }, 'in').to(at(3), at(3, 1), { v: 1 }, 'out');
    TL.rage.to(at(3), at(3, 1), { v: 0.6 }, 'out');
    H.caption(at(3), at(4, 1), '不死的安黛因', UX, UY + 16, { scale: 3, shake: 4, fadeIn: 0.05, glowA: 0.7 });
    H.caption(at(3, 1), at(4, 1), 'UNDYNE THE UNDYING', UX, UY + 70, { scale: 1, color: '#9fe8ff', fadeIn: 0.2, spacing: 2 });
    H.face(at(3), 1);
    H.face(at(3, 2), 0);

    // ------------------------------------------------------------ 4: the spear hits the ground
    TL.und.to(at(3, 3), at(4) - 0.03, { arm: 1.3, lean: -0.06 }, 'inOut');
    TL.und.to(at(4) - 0.03, at(4) + 0.05, { arm: -0.45, lean: 0.07 }, 'outExpo');
    TL.und.to(at(4, 1), at(4, 3), { arm: 0, lean: 0 }, 'inOut');
    H.cut(at(4), { x: 480, y: 262, zoom: 1.05, roll: 0.03 });
    H.cam(at(4) + 0.02, at(4, 2), { roll: 0, zoom: 1 }, 'outExpo');
    H.slam(at(4), UX, { rest: 1.2 });
    H.face(at(4), 12); H.face(at(4, 3), 0);
    TL.post.to(at(4), at(4, 1), { vig: 0.42, bloom: 1.1, ca: 0.7 }, 'out');
    TL.rage.to(at(4), at(4, 2), { v: 0.45 }, 'out');
    // her shadow rises behind everything
    TL.shadow.set(at(4), { a: 0, y: 900, sc: 7 }).to(at(4), at(6), { a: 0.6, y: 770 }, 'out');
    H.sfx(at(4), 'Rumble', 0.5);
    // the box is thrown up by the shockwave, the HUD and buttons slam in on 16ths
    TL.box.set(at(4), Object.assign({ draw: 0 }, L.boxMenu));
    TL.box.to(at(4), at(4, 0, 3), { draw: 1 }, 'outExpo');
    TL.hud.to(at(4, 2), at(4, 2, 1), { a: 1 }, 'out');
    for (let i = 0; i < 4; i++) {
      const t = at(4, 2, 2 + i);
      TL.btn[i].set(t - 0.001, { a: 0, dy: -40 }).to(t, t + 0.12, { a: 1, dy: 0 }, 'outBack');
      H.sfx(t, 'MenuCursor', 0.35);
      H.punch(t, 0.5, { dy: 1 });
    }
    for (const [b, k] of [[4, 3], [5, 1], [5, 3], [6, 1]]) H.barrage(at(b, k), 2, { vol: 0.25 });
    // the boss bar (Souls): her name and two lives (Sekiro) appear, the bar charges up
    TL.boss.set(at(4, 1), { a: 0, hp: 0, lag: 0 }).to(at(4, 1), at(4, 2), { a: 1 }, 'out');
    TL.boss.to(at(4, 2), at(5), { hp: 1, lag: 1 }, 'inOut');
    H.sfx(at(4, 2), 'Power', 0.45);
    H.narrate(at(5), at(6), ['* 安黛因挡住了去路。'], { cps: 22 });
    H.say(at(5, 1), at(6, 2), ['你以为……', '这样就能杀死我？'], { cps: 16 });
    H.face(at(5, 1), 9); H.face(at(6, 2), 0);
    // ------------------------------------------------------------ 6 - 7: pinned green
    H.box(at(6), at(6, 0, 2), Object.assign({ fill: 0 }, L.boxGreen), 'outBack');
    H.boxHit(at(6, 0, 2), 'top', 0.5, 6);
    TL.soul.set(at(6, 1) - 0.001, { a: 0, x: L.soul[0], y: L.soul[1] }).to(at(6, 1), at(6, 1, 1), { a: 1 }, 'out');
    H.sfx(at(6, 1), 'UndSelect', 0.4);
    H.cam(at(6), at(6, 3), { x: 480, y: 236, zoom: 1.3 }, 'inOut');
    // the wind-up, then the spear straight down into the soul
    TL.und.to(at(6, 2), at(6, 3, 3), { arm: 1.4, lean: -0.08 }, 'inOut');
    TL.und.to(at(6, 3, 3), at(7), { arm: -0.5, lean: 0.08 }, 'outExpo');
    TL.und.to(at(7, 0, 2), at(7, 2), { arm: 0, lean: 0 }, 'inOut');
    H.lunge(at(7), 0.6);
    const [hx, hy] = D.undynePt(UX, UY, 10, 120);
    H.flyer(at(6, 3, 3), at(7), hx, hy, L.soul[0], L.soul[1] - 6, { len: 90, z: 46, vol: 0.4 }).harmless = true; // it pins the soul green
    TL.soulCol.set(at(7), 'green');
    H.bigHit(at(7), { flash: 0.55, flashCol: [0.4, 1, 0.5], amp: 13 });
    H.sfx(at(7), 'Ding', 0.6); H.sfx(at(7), 'Clang', 0.5);
    H.shock(at(7), L.soul[0], L.soul[1], { r: 260, color: '#80ff90', color2: '#00c000', dust: false });
    TL.shield.to(at(7), at(7, 0, 2), { a: 1, ring: 1 }, 'out');
    TL.soul.to(at(7), at(7) + 0.02, { sc: 1.8 }, 'lin').to(at(7) + 0.02, at(7, 0, 3), { sc: 1 }, 'out');
    TL.burst(at(7), { x: L.soul[0], y: L.soul[1], n: 30, speed: [80, 300], life: [0.2, 0.5], colors: ['#00ff40', '#ffffff'], size: [2, 3], z: 36 });
    H.shout(at(7), at(7, 3), '别想逃！！', { y: 70 });
    TL.rumble.to(at(7), at(7, 1), { v: 1.5 }, 'out');

    // ------------------------------------------------------------ 7 - 10: spears on the 8ths
    const plan = [
      [7, 1, 0, 'u'], [7, 1, 2, 'l'], [7, 2, 0, 'r'], [7, 2, 2, 'u'], [7, 3, 0, 'd'], [7, 3, 2, 'l'],
      [8, 0, 0, 'u', 'heavy'], [8, 0, 2, 'r'], [8, 1, 0, 'l'], [8, 1, 2, 'd'], [8, 2, 0, 'u'], [8, 2, 2, 'r'], [8, 3, 0, 'l'], [8, 3, 2, 'u', 'yel'],
      [9, 0, 0, 'l', 'heavy'], [9, 0, 2, 'u'], [9, 1, 0, 'r'], [9, 1, 2, 'd', 'yel'], [9, 2, 0, 'l'], [9, 2, 2, 'u'], [9, 3, 0, 'r'], [9, 3, 2, 'd'],
      [10, 0, 0, 'u', 'heavy'], [10, 0, 2, 'l'], [10, 1, 0, 'r', 'yel'], [10, 1, 2, 'u'], [10, 2, 0, 'd'],
    ];
    for (const [b, k, s, side, kind] of plan) H.green(at(b, k, s), side, { kind: kind === 'yel' ? 'yel' : 'blue', heavy: kind === 'heavy' });
    H.flurry(at(10, 2, 2), 'r', 4, T.s16, { heavy: false });
    H.green(at(10, 3, 3), 'u', { heavy: true });
    // the camera snaps on every downbeat, she lunges with it
    const snaps = [{ zoom: 1.42, x: 470, roll: -0.05 }, { zoom: 1.3, x: 492, roll: 0.04 }, { zoom: 1.48, x: 480, roll: -0.03 }, { zoom: 1.34, x: 476, roll: 0.05 }];
    [7, 8, 9, 10].forEach((b, i) => {
      if (b > 7) H.cam(at(b) - 0.02, at(b) + 0.12, Object.assign({ y: 236 }, snaps[i]), 'outExpo');
      if (b > 7) H.lunge(at(b), 0.5);
      H.throwArm(at(b, 2) - 0.1, 0.8);
    });
    TL.rage.to(at(8), at(10), { v: 0.8 }, 'inOut');
    TL.rumble.to(at(8), at(10), { v: 2 }, 'inOut');
    H.say(at(9), at(10, 2), ['挡啊！', '继续挡啊！！'], { cps: 16 });
    H.face(at(9), 1); H.face(at(10, 2), 0);

    // ------------------------------------------------------------ 11: cut-in, the leap
    H.cam(at(11) - 0.02, at(11) + 0.1, { x: 480, y: 250, zoom: 1.15, roll: 0 }, 'outExpo');
    H.cutin(at(11), 0.78, { text: '来吧！人类！！', head: 12 });
    H.speed(at(11), at(11, 2), { k: 1 });
    ['u', 'r', 'd', 'l'].forEach((side, i) => H.green(at(11, 2, 1 + i), side, { travel: 0.42, hitVol: 0.45 }));
    H.green(at(11, 3, 2), 'u', { kind: 'yel', travel: 0.48 });
    H.leap(at(11, 2), at(12), UX, 300, { rest: 1.2 });
    TL.und.to(at(11, 2), at(11, 3, 2), { arm: 1.3 }, 'inOut').to(at(11, 3, 2), at(12), { arm: -0.4 }, 'outExpo').to(at(12), at(12, 1), { arm: 0 }, 'inOut');
    H.swell(at(12), 0.55);
  });
})();
