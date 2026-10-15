// Bars 60 - 71, the quiet bridge. The drums fall away and so does the battle
// UI: Waterfall's crystal ceiling, falling water, the echo flowers. She is
// melting; a few slow spears still come, gently blocked. She names the people
// she is standing up for, one per phrase. Bar 71: four heartbeats, she pulls
// herself back together - and the finale hits.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;

  MV.sections.push(() => {
    // the stage empties: HUD and buttons out, the cavern in
    TL.hud.to(at(60), at(60, 2), { a: 0 }, 'inOut');
    TL.btn.forEach((b, i) => b.to(at(60, 0, i), at(60, 1, i), { a: 0, dy: 16 }, 'in'));
    TL.shield.to(at(60), at(60, 1), { a: 1 }, 'out');
    TL.shield.to(at(60), at(60, 2), { ring: 0.6 }, 'inOut');
    TL.bg.to(at(60), at(62), { cav: 1, rain: 0.45, drift: 2.5, ceiling: 0.95, flowers: 1 }, 'inOut');
    TL.post.to(at(60), at(62), { desat: 0.3, vig: 0.55, bloom: 1.1, ca: 0.4 }, 'inOut');
    H.cam(at(60), at(61), { x: 480, y: 255, zoom: 1.12, roll: 0, pitch: 0, yaw: 0 }, 'inOut');
    H.cam(at(61), at(70), { y: 226, zoom: 1.3 }, 'inOut');
    TL.und.to(at(60), at(62), { breathe: 0.5, eye: 0.35 }, 'inOut');
    // still menacing: the shadow towers over the stage, its eye burning; the rumble never stops;
    // she walks forward a step at a time (one step a phrase, each a thud)
    TL.shadow.to(at(60), at(64), { a: 0.75, sc: 8, y: 860, eye: 1.6 }, 'inOut');
    TL.rage.to(at(60), at(61), { v: 0.35 }, 'inOut');
    TL.rumble.to(at(60), at(61), { v: 0.6 }, 'inOut');
    [[61, 2.1, 300], [64, 2.2, 316], [67, 2.3, 332], [70, 2.4, 348]].forEach(([b, sc, y]) => {
      TL.und.to(at(b) - 0.1, at(b) + 0.1, { sc, y }, 'outExpo');
      H.sfx(at(b), 'Boom', 0.3); H.punch(at(b), 0.8, { dy: 1 });
    });
    for (const t of [at(60, 1), at(61, 3), at(63, 2), at(65, 1), at(67, 3), at(69, 2)]) H.sfx(t, 'Drip', 0.3);

    // slow spears on the bridge's few accents
    const slow = [[61, 0, 0, 'l'], [62, 2, 0, 'r'], [64, 2, 2, 'u'], [65, 1, 0, 'l'], [66, 0, 0, 'r'], [66, 3, 0, 'u'], [67, 2, 0, 'l'], [68, 1, 0, 'r'], [68, 2, 2, 'u'], [69, 2, 0, 'l'], [70, 1, 0, 'r']];
    for (const [b, k, s, side] of slow) H.green(at(b, k, s), side, { travel: 1.35, vol: 0.06, hitVol: 0.25 });

    // her words
    H.say(at(60, 2), at(62), ['……哈……哈……'], { cps: 7, vol: 0.12 });
    H.face(at(60, 2), 3);
    TL.melt.set(at(62), 1);
    TL.und.to(at(62) - 0.02, at(62), { flash: 0.8 }, 'lin').to(at(62), at(62, 2), { flash: 0 }, 'out');
    H.sfx(at(62), 'Drip', 0.45);
    H.say(at(62, 2), at(64), ['艾斯戈尔……'], { cps: 7, vol: 0.12 });
    H.say(at(64), at(65, 2), ['艾菲斯……'], { cps: 7, vol: 0.12 });
    H.say(at(65, 2), at(67), ['帕派瑞斯……'], { cps: 7, vol: 0.12 });
    H.say(at(67, 2), at(69, 2), ['大家……', '都在指望着我。'], { cps: 8, vol: 0.14 });
    H.say(at(69, 2), at(71, 2), ['所以……', '我绝对不会倒下！！'], { cps: 9, vol: 0.2 });
    // echo flowers repeat the names quietly (Waterfall's flowers echo what they hear)
    const echo = (t, str, x, y) => H.caption(t, t + 1.6, str, x, y, { scale: 1, color: '#7fd8ff', fadeIn: 0.4, fadeOut: 0.8, glowA: 0.4 });
    echo(at(63, 2), '艾斯戈尔……', 300, 372);
    echo(at(65), '艾菲斯……', 660, 372);
    echo(at(66, 2), '帕派瑞斯……', 320, 396);

    // 71: four heartbeats, the white pushes back
    TL.bg.to(at(70), at(71, 3), { cav: 0.35, rain: 0, flowers: 0.3 }, 'inOut');
    TL.post.to(at(70), at(71, 3), { desat: 0, vig: 0.7 }, 'inOut');
    for (let k = 0; k < 4; k++) {
      const t = at(71, k);
      H.sfx(t, 'Heartbeat', 0.55 + k * 0.1);
      TL.und.to(t, t + 0.02, { flash: 0.45 + k * 0.15, shake: 1 + k }, 'lin').to(t + 0.02, t + 0.3, { flash: 0.1 * k, shake: k * 0.6 }, 'out');
      H.punch(t, 0.5 + k * 0.2);
    }
    H.sfx(at(71, 1), 'Rumble', 0.55);
    H.sfx(at(71, 2), 'Shimmer', 0.4);
    H.swell(at(72), 0.55);
    H.cam(at(71), at(72), { y: 230, zoom: 1.7 }, 'in');
    TL.rumble.to(at(71), at(72), { v: 4 }, 'in');
    TL.rage.to(at(71), at(72), { v: 1.2 }, 'in');
    H.speed(at(71, 2), at(72), { k: 0.8, cy: 220 });
  });
})();
