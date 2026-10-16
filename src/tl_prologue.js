// Act one (0 - 9 s, no music): the bridge in Waterfall. Undyne takes the blow
// meant for the kid, starts to melt, refuses to - and the white of her
// determination swallows the screen just as the music starts.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H;
  const { Track, Steps } = MV;

  MV.sections.push(() => {
    const X = 480, Y = 380;
    const boss = new Track({ a: 0, flash: 0, shake: 0, sil: 0, white: 0 });
    const frame = new Steps('fatal0');

    // Waterfall: the crystal ceiling and the falling water, dim
    TL.bg.set(0, { cav: 0, rain: 0, drift: 3 });
    TL.bg.to(0.2, 2.0, { cav: 0.55, rain: 0.6 }, 'inOut');
    TL.post.set(0, { bloom: 0.9, vig: 0.55, scan: 0.05, ca: 0.4 });
    TL.cam.set(0, { x: 480, y: 280, zoom: 1.12 });
    TL.cam.to(0, 6.2, { zoom: 1.32, y: 260 }, 'inOut');
    for (const t of [0.6, 2.2, 3.7, 5.3]) H.sfx(t, 'Drip', 0.35);

    // the cinematic frame closes in from the first second; the narration sits in the bottom band
    TL.frame.set(0, { top: 0, bot: 0 }).to(0, 0.9, { top: MV.SAFE.top, bot: MV.SAFE.bot }, 'out');
    H.narrate(0.35, 2.35, ['* 她替那个孩子挡下了这一击。'], { box: { x: 0, y: 0 }, x: 270, y: 494, cps: 16, screen: true, z: 99 });

    // the blow
    boss.to(1.0, 1.6, { a: 1 }, 'inOut');
    H.sfx(2.45, 'Swipe', 0.6);
    TL.add({ t0: 2.45, t1: 2.95, z: 55, draw(ctx, emi, t) { D.slash(ctx, emi, X, Y - 120, (t - 2.45) / 0.5, { len: 190, w: 14 }); } });
    H.sfx(2.8, 'HeavyDamage', 0.7);
    H.hit(2.8, 1.3);
    boss.to(2.8, 2.82, { flash: 1, shake: 7 }, 'lin').to(2.82, 3.3, { flash: 0, shake: 0 }, 'out');
    // the fatal frames carry the cut across her body
    for (let i = 0; i < 10; i++) frame.set(2.8 + i * 0.13, 'fatal' + i);
    // the melt
    for (let i = 0; i < 4; i++) { frame.set(4.3 + i * 0.42, 'melt' + i); H.sfx(4.3 + i * 0.42, 'Drip', 0.3); }
    H.say(4.45, 6.0, ['……可恶……', '身体……在融化……'], { at: () => [X + 20, Y - 210], cps: 10, vol: 0.14 });

    // she refuses: heartbeats, the screen drains, white pushes through her
    TL.bg.to(5.6, 7.4, { cav: 0.15, rain: 0 }, 'inOut');
    TL.post.to(5.6, 7.6, { vig: 0.75, desat: 0.4 }, 'inOut');
    const beats = [6.05, 6.85, 7.45, 7.9, 8.25, 8.5];
    beats.forEach((t, i) => {
      H.sfx(t, 'Heartbeat', 0.55 + i * 0.06);
      boss.to(t, t + 0.02, { white: 0.35 + i * 0.12, shake: 1 + i }, 'lin').to(t + 0.02, t + 0.3, { white: 0.1 * i, shake: 0.5 * i }, 'out');
      H.punch(t, 0.5 + i * 0.15);
    });
    H.say(6.1, 7.7, ['不……', '我还不能倒下！'], { at: () => [X + 20, Y - 210], cps: 12, vol: 0.2 });
    H.sfx(6.4, 'Rumble', 0.6);
    H.sfx(7.2, 'Shimmer', 0.45);
    TL.cam.to(6.2, 8.6, { zoom: 1.6, y: 300 }, 'in');
    boss.to(8.25, 8.75, { white: 1 }, 'in');
    H.swell(8.75, 0.5);
    H.flashScreen(8.75, 1);
    H.sfx(8.75, 'Flash', 0.6);
    boss.set(8.8, { a: 0 });
    TL.bg.set(8.8, { cav: 0 });
    TL.post.to(8.75, 9.0, { vig: 0.35, desat: 0 }, 'out');

    TL.add({
      t0: 0, t1: 8.8, z: -50,
      draw(ctx, emi, t) {
        const b = boss.at(t);
        if (b.a <= 0.001) return;
        const jx = b.shake ? Math.round(U.noise(t * 47) * b.shake) : 0;
        D.boss(ctx, emi, frame.at(t), X + jx, Y, { alpha: b.a, glow: 0.08 + b.white * 0.5 });
        if (b.flash > 0.01 || b.white > 0.01) D.boss(ctx, null, frame.at(t), X + jx, Y, { alpha: b.a * Math.max(b.flash, b.white), sil: '#ffffff', glow: 0 });
        if (b.white > 0.3 && emi) D.boss(emi, null, frame.at(t), X + jx, Y, { alpha: b.white, sil: '#ffffff', glow: 0, scale: 2 });
        // her heart showing through, pulsing with the beats
        if (t > 5.9) {
          const k = U.clamp((t - 5.9) / 0.6) * (0.5 + 0.5 * b.white);
          MV.spr(ctx, 'soul_white', X, Y - 150, { alpha: k, scale: 1 + b.white * 0.6 });
          if (emi) { emi.globalAlpha = k; MV.spr(emi, 'soul_white', X, Y - 150, { scale: 2.4 + b.white * 2 }); emi.globalAlpha = 1; }
        }
      },
    });
  });
})();
