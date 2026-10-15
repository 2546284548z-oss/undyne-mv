// Act three (after the music, 12 s, no music): Waterfall's falling water. Her
// last words, she turns to dust from the top down, the dust drifts up into the
// crystal ceiling, and one line of narration closes the film on black.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H;

  MV.sections.push(() => {
    const t0 = T.dur;
    const at = (s) => t0 + s;
    const pos = () => [500, 98];
    for (const s of [0.6, 3.4, 6.2]) H.sfx(at(s), 'Drip', 0.45);
    H.say(at(0.4), at(3.0), ['……哈……哈……'], { cps: 6, vol: 0.24, at: pos });
    H.say(at(3.2), at(6.2), ['就算我……', '在这里倒下……'], { cps: 6, vol: 0.24, at: pos });
    H.say(at(6.4), at(9.2), ['这个世界……', '也会……活下去……'], { cps: 6, vol: 0.24, at: pos });
    TL.und.to(at(0), at(6), { shake: 0.6 }, 'inOut');

    // dust: the figure is cut away from the top while dust lifts off the cut
    const d0 = at(8.6), d1 = at(10.4);
    TL.und.set(d0, { cut: 0 }).to(d0, d1, { cut: 1 }, 'in2');
    TL.und.to(d0, d0 + 0.02, { flash: 1 }, 'lin').to(d0 + 0.02, d0 + 0.4, { flash: 0.3 }, 'out');
    H.sfx(d0, 'Rumble', 0.5);
    H.sfx(d0, 'Shimmer', 0.35);
    for (let k = 0; k < 24; k++) {
      const t = U.lerp(d0, d1, k / 24);
      TL.burst(t, {
        x: 480, y: () => { const c = U.clamp((t - d0) / (d1 - d0)); return 268 - 286 * (1 - c * c); },
        n: 26, spread: 150, spreadY: 6, speed: [10, 50], ang: [-Math.PI * 0.85, -Math.PI * 0.15], life: [0.6, 1.4], g: -40, drag: 1.2,
        colors: ['#ffffff', '#c8c8c8', '#9fe8ff'], size: [1, 2], z: 20, seed: k * 13 + 7, glow: 0.5,
      });
    }
    TL.und.set(d1 + 0.02, { a: 0 });
    TL.bg.to(at(8.6), at(11.2), { cav: 0.9, rain: 0, drift: 1.5 }, 'inOut');
    H.narrate(at(10.0), at(11.7), ['* 她坚持到了最后一刻。'], { box: { x: 0, y: 0 }, x: 300, y: 452, cps: 12, vol: 0.18, screen: true });
    TL.bg.to(at(11.0), at(11.8), { cav: 0 }, 'inOut');
    TL.post.to(at(11.0), at(11.8), { vig: 1 }, 'inOut');
  });
})();
