// Bars 0 - 11. The riff alone (0 - 3): in the dark only her burning eye, then
// her body lights up piece by piece on the riff's 3-3-3-3-4 accents while the
// camera pulls back to the whole figure and the title. The bass enters (4): the
// battle box draws itself, the HUD and buttons drop in, the soul turns green and
// the first spears arrive on the beat (7 - 10). Bar 11's drum fill spins the
// shield all the way round.
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
    H.sfx(at(3), 'Slam', 0.5);
    H.hit(at(3), 0.8);
    H.caption(at(3), at(4, 1), '不死的安黛因', UX, UY + 16, { scale: 3, shake: 4, fadeIn: 0.05, glowA: 0.7 });
    H.caption(at(3, 1), at(4, 1), 'UNDYNE THE UNDYING', UX, UY + 70, { scale: 1, color: '#9fe8ff', fadeIn: 0.2, spacing: 2 });
    H.face(at(3), 1);
    H.face(at(3, 2), 0);

    // ------------------------------------------------------------ 4 - 6: the battle forms
    H.cam(at(4), at(5), { x: 480, y: 270, zoom: 1, roll: 0 }, 'inOut');
    TL.post.to(at(4), at(5), { vig: 0.38, bloom: 1 }, 'inOut');
    TL.box.set(at(4), Object.assign({ draw: 0 }, L.boxMenu));
    TL.box.to(at(4, 1), at(4, 3), { draw: 1 }, 'inOut');
    H.sfx(at(4, 1), 'UndSelect', 0.3);
    TL.hud.to(at(4, 3), at(5), { a: 1 }, 'out');
    for (let i = 0; i < 4; i++) {
      const t = at(5, i);
      TL.btn[i].set(t - 0.001, { a: 0, dy: -26 }).to(t, t + 0.25, { a: 1, dy: 0 }, 'outBack');
      H.sfx(t, 'MenuCursor', 0.3);
    }
    H.narrate(at(5), at(6, 2), ['* 安黛因挡在了你的面前。'], { cps: 14 });
    H.say(at(6), at(7, 3), ['只要你还是绿色的，', '就别想逃！'], { cps: 14 });
    H.face(at(6), 9);
    H.face(at(7, 3), 0);
    // the box closes round the soul; the soul appears red and turns green
    H.box(at(6, 2), at(6, 3, 2), Object.assign({ fill: 0 }, L.boxGreen), 'inOut');
    TL.soul.set(at(6, 3) - 0.001, { a: 0, x: L.soul[0], y: L.soul[1] }).to(at(6, 3), at(6, 3, 2), { a: 1 }, 'out');
    H.sfx(at(6, 3), 'UndSelect', 0.4);
    TL.soulCol.set(at(7), 'green');
    H.sfx(at(7), 'Ding', 0.55);
    TL.shield.to(at(7), at(7, 0, 2), { a: 1, ring: 1 }, 'out');
    TL.soul.to(at(7), at(7) + 0.02, { sc: 1.6 }, 'lin').to(at(7) + 0.02, at(7, 0, 3), { sc: 1 }, 'out');
    TL.burst(at(7), { x: L.soul[0], y: L.soul[1], n: 18, speed: [60, 160], life: [0.2, 0.5], colors: ['#00ff40', '#ffffff'], size: 2, z: 36 });
    H.cam(at(6, 2), at(7, 2), { x: 480, y: 240, zoom: 1.22 }, 'inOut');

    // ------------------------------------------------------------ 7 - 10: first spears, on the beat
    const plan = [
      [7, 1, 0, 'u'], [7, 2, 0, 'l'], [7, 3, 0, 'r'],
      [8, 0, 0, 'u'], [8, 1, 0, 'd'], [8, 2, 0, 'l'], [8, 3, 0, 'r'], [8, 3, 2, 'u'],
      [9, 0, 0, 'l'], [9, 1, 0, 'u'], [9, 1, 2, 'r'], [9, 2, 0, 'd'], [9, 3, 0, 'u'], [9, 3, 2, 'l'],
      [10, 0, 0, 'r'], [10, 0, 2, 'u'], [10, 1, 2, 'l'], [10, 2, 0, 'd'], [10, 3, 0, 'u', 'yel'],
    ];
    for (const [b, k, s, side, kind] of plan) {
      const t = at(b, k, s);
      H.green(t, side, { kind: kind || 'blue', travel: b < 9 ? 0.8 : 0.66 });
    }
    for (const b of [7, 8, 9, 10]) H.throwArm(at(b) - 0.6, 0.7);
    H.say(at(9, 2), at(10, 3, 2), ['看你挡得住几下！'], { cps: 14 });
    H.face(at(9, 2), 1); H.face(at(10, 3), 0);
    TL.bg.to(at(7), at(11), { drift: 9 }, 'inOut');

    // ------------------------------------------------------------ 11: the fill
    // four spears on the hats' 16ths from four sides: the shield spins round
    ['u', 'r', 'd', 'l'].forEach((side, i) => H.green(at(11, 1, 1 + i), side, { travel: 0.5, hitVol: 0.45 }));
    H.green(at(11, 2, 1), 'u', { kind: 'yel', travel: 0.6 });
    H.throwArm(at(11, 0, 2), 1.2);
    TL.und.to(at(11, 2), at(11, 3, 3), { arm: 1.1, lean: -0.05 }, 'inOut');
    TL.und.to(at(11, 3, 3), at(12), { arm: -0.3, lean: 0.05 }, 'outExpo');
    TL.und.to(at(12), at(12, 1), { arm: 0, lean: 0 }, 'inOut');
    H.cam(at(11), at(11, 3, 2), { zoom: 1.08, y: 250, roll: -0.02 }, 'inOut');
    H.swell(at(12), 0.5);
  });
})();
