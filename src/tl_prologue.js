// Act one (0 - 25 s, no music). Two parts:
//   0 - 14.6   the cutscene, in the game's own overworld sprites, on the long bridge in Waterfall
//              (the Genocide route): the monsters have fled; Monster Kid stands in the way; the
//              human smiles and swings - and Undyne leaps in and takes the blow meant for the kid.
//              She falls; the kid runs; the screen cuts to black and the battle begins.
//   14.6 - 25  the battle close-up: the wound, "you'll have to try harder than that", the melt,
//              she refuses to fall - and the white of her determination swallows the screen just
//              as the music starts.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H;
  const { Track, Steps } = MV;
  const R = Math.round;

  MV.sections.push(() => {
    // ================================================================ part one: the bridge
    const GY = 424, SC = 4; // the bridge top (as in the chase), the overworld sprites at 3x
    const ow = (ctx, name, x, y, o = {}) => {
      const img = typeof name === 'string' ? MV.IMG['ow/' + name] : name, op = Object.assign({ ax: 0.5, ay: 1, scale: SC }, o);
      // a pale rim (one native pixel) so the dark sprites - the shadowed human, the armour - read at night
      if (!o.noRim) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) MV.spr(ctx, MV.sil(img, '#6a7ab8'), x + dx * SC, y + dy * SC, Object.assign({}, op, { alpha: (op.alpha ?? 1) * 0.8 }));
      MV.spr(ctx, img, x, y, op);
    };
    const P = new Track({ bridge: 0, fx: 90, fa: 1, mx: 640, ma: 1, mshake: 0, ux: 1010, uy: GY, ua: 0, uflash: 0, ushake: 0, black: 0 });
    const fSpr = new Steps('frisk_r'), mSpr = new Steps('mk_stand'), uSpr = new Steps('und_jump');
    const tCut = 14.6; // the battle starts

    TL.bg.set(0, { cav: 0, rain: 0, drift: 3 });
    TL.post.set(0, { bloom: 0.9, vig: 0.55, scan: 0.05, ca: 0.4 });
    TL.frame.set(0, { top: 0, bot: 0 }).to(0, 0.9, { top: MV.SAFE.top, bot: MV.SAFE.bot }, 'out');
    P.to(0.2, 1.6, { bridge: 1 }, 'inOut');
    TL.cam.set(0, { x: 470, y: 330, zoom: 1.22 }).to(0, 7.0, { x: 500, zoom: 1.3 }, 'inOut');
    for (const t of [0.7, 2.6, 4.4, 6.1, 9.6, 11.8]) H.sfx(t, 'Drip', 0.3);
    H.narrate(0.4, 3.4, ['* 瀑布。怪物们都已经逃走了。'], { box: { x: 0, y: 0 }, x: 250, y: 494, cps: 14, screen: true, z: 99 });

    // the human walks in from the left, unhurried
    P.to(0.8, 4.4, { fx: 360 }, 'lin');
    // Monster Kid stands in the way, shaking
    P.to(3.2, 3.6, { mshake: 1 }, 'lin');
    H.say(3.6, 6.7, ['哟……我知道我只是个小孩……', '但我不会让你伤害任何人！'], { at: () => [620, 330], dx: -190, dy: -80, cps: 15, vol: 0.14, rate: 1.45 });

    // the smile (an insert: the face of the one who has killed everyone)
    const tSmile = 6.8;
    H.sfx(tSmile, 'Glitch', 0.35); H.sfx(tSmile, 'Rumble', 0.35);
    TL.add({
      t0: tSmile, t1: tSmile + 0.75, z: 97, screen: true,
      draw(c, emi, t) {
        const u = t - tSmile, k = Math.min(U.clamp(u / 0.04), U.clamp((tSmile + 0.75 - t) / 0.08));
        c.globalAlpha = k; c.fillStyle = '#000000'; c.fillRect(0, 0, 960, 540);
        const img = MV.IMG[u < 0.35 ? 'ow/chara_weird' : 'ow/chara_laugh'], s = 11 + u * 2;
        c.imageSmoothingEnabled = false;
        c.drawImage(img, R(480 - (img.width * s) / 2 + U.noise(t * 60) * 3), R(270 - (img.height * s) / 2), R(img.width * s), R(img.height * s));
        c.globalAlpha = k * 0.35; c.fillStyle = '#ff0000'; c.fillRect(0, 0, 960, 540);
        for (let y = 0; y < 540; y += 4) { c.globalAlpha = k * 0.25; c.fillStyle = '#000000'; c.fillRect(0, y, 960, 2); }
        c.globalAlpha = 1;
      },
    });
    TL.cam.to(tSmile + 0.75, tSmile + 0.95, { x: 500, y: 330, zoom: 1.42 }, 'outExpo');

    // the human closes in; the kid cries out; Undyne leaps in from above and lands between them
    const tSwing = 8.15, tLand = 8.0;
    P.to(7.6, 8.0, { fx: 420 }, 'outExpo');
    TL.add({ t0: 7.6, t1: 8.3, z: 60, draw(ctx, emi, t) { D.text(ctx, '!', 640, GY - 116 - (t < 7.66 ? 6 : 0), { scale: 3, align: 'center', color: '#ffffff', outline: '#000000' }); } });
    H.sfx(7.6, 'Noise', 0.35);
    H.sfx(7.55, 'Whoosh', 0.55);
    P.set(7.5, { ua: 1, ux: 1010, uy: GY }).hop(7.5, tLand, { ux: 575, uy: GY }, 470, 'uy', 'lin');
    uSpr.set(7.5, 'und_jump').set(tLand, 'und_shield');
    mSpr.set(tLand, null); // the shielding sprite holds them both
    H.sfx(tLand, 'Slam', 0.5);
    TL.burst(tLand, { x: 575, y: GY, n: 20, speed: [80, 240], ang: [Math.PI * 1.05, Math.PI * 1.95], life: [0.2, 0.5], g: 500, colors: ['#8a6038', '#ffffff'], size: [2, 3], z: 40 });
    // the blow: it was meant for the kid
    H.sfx(tSwing - 0.05, 'Swipe', 0.6);
    TL.add({ t0: tSwing - 0.05, t1: tSwing + 0.4, z: 62, draw(ctx, emi, t) { D.slash(ctx, emi, 560, GY - 120, (t - tSwing + 0.05) / 0.45, { len: 130, w: 12 }); } });
    H.sfx(tSwing + 0.12, 'HeavyDamage', 0.75);
    H.hit(tSwing + 0.12, 1.4, { flash: 0.5 });
    P.to(tSwing + 0.12, tSwing + 0.14, { uflash: 1, ushake: 5 }, 'lin').to(tSwing + 0.14, tSwing + 0.7, { uflash: 0, ushake: 0 }, 'out');
    H.freeze(tSwing + 0.16, 0.35, { zoom: 0.1 });
    // she falls; the kid scrambles out from behind her
    const tFall = 9.3;
    uSpr.set(tFall, 'und_fall');
    mSpr.set(tFall, 'mk_stand');
    P.set(tFall, { mx: 690, mshake: 2 }).set(tFall, { ux: 540 });
    H.sfx(tFall, 'Hurt', 0.4); H.punch(tFall, 0.8);
    TL.cam.to(tFall, tFall + 1.5, { x: 560, y: 345, zoom: 1.5 }, 'inOut');
    H.say(tFall + 0.35, 10.9, ['安……安黛因！'], { at: () => [690, 340], dx: 10, dy: -70, cps: 12, vol: 0.14, rate: 1.45 });
    H.say(10.6, 12.9, ['……快……跑……', '孩子……'], { at: () => [560, 380], dx: -150, dy: -110, cps: 9, vol: 0.12 });
    // the kid runs (it trips over its own feet, the way it always does)
    for (let i = 0; i < 8; i++) mSpr.set(11.7 + i * 0.12, 'mk_trip' + (i % 4));
    mSpr.set(12.66, 'mk_down').set(12.86, 'mk_trip2');
    P.to(11.7, 12.66, { mx: 820, mshake: 0 }, 'in').to(12.86, 13.5, { mx: 1120 }, 'in');
    H.sfx(12.66, 'Squeak', 0.3);
    // alone on the bridge: a heartbeat; the encounter - black, the soul blinks, the battle
    TL.cam.to(12.4, 13.8, { x: 520, y: 360, zoom: 1.75 }, 'inOut');
    H.sfx(13.2, 'Heartbeat', 0.6);
    P.to(13.2, 13.22, { uflash: 0.6 }, 'lin').to(13.22, 13.6, { uflash: 0 }, 'out');
    P.set(13.85, { black: 1 });
    H.sfx(13.85, 'Noise', 0.5);
    TL.add({
      t0: 13.85, t1: tCut + 0.05, z: 98, screen: true,
      draw(c, emi, t) {
        c.fillStyle = '#000000'; c.fillRect(0, 0, 960, 540);
        const u = t - 13.85, on = u < 0.45 ? Math.floor(u / 0.075) % 2 === 0 : true;
        const y = u < 0.45 ? 330 : U.lerp(330, 250, U.eIn(U.clamp((u - 0.45) / 0.3)));
        if (on && u < 0.75) MV.spr(c, 'soul_red', 480, y, { scale: 2 });
      },
    });
    for (const k of [0, 1, 2]) H.sfx(13.85 + k * 0.15, 'Tick', 0.4);
    H.sfx(14.3, 'BattleText', 0.4);

    TL.add({
      t0: 0, t1: tCut, z: -60,
      draw(ctx, emi, t, S) {
        const p = P.at(t);
        if (p.black > 0.5) return;
        if (p.bridge > 0.001) D.chase(ctx, emi, t, p.bridge, 0);
        // the human: a little bob while walking
        const walking = t > 0.8 && t < 4.4;
        const fb = walking ? (Math.floor((t - 0.8) / 0.2) % 2) * 3 : 0;
        ow(ctx, fSpr.at(t), p.fx, GY + 2 - fb, { alpha: p.fa });
        // Monster Kid
        const m = mSpr.at(t);
        if (m) ow(ctx, m, p.mx + (p.mshake ? R(U.noise(t * 40) * p.mshake) : 0), GY + 2, { alpha: p.ma });
        // Undyne
        if (p.ua > 0.001) {
          const name = uSpr.at(t), jx = p.ushake ? R(U.noise(t * 47) * p.ushake) : 0;
          ow(ctx, name, p.ux + jx, p.uy + 2, { alpha: p.ua });
          if (p.uflash > 0.01) ow(ctx, MV.sil(MV.IMG['ow/' + name], '#ffffff'), p.ux + jx, p.uy + 2, { alpha: p.ua * p.uflash, noRim: true });
          if (emi && name === 'und_jump') ow(emi, name, p.ux, p.uy + 2, { alpha: 0.25, noRim: true });
        }
      },
    });

    // ================================================================ part two: the battle close-up
    const X = 480, Y = 380, O = 16; // O: the old 9 s prologue's beats, moved to end as the music starts
    const boss = new Track({ a: 0, flash: 0, shake: 0, sil: 0, white: 0 });
    const frame = new Steps('fatal0');
    TL.bg.set(tCut, { cav: 0.55, rain: 0.6, drift: 3 });
    TL.cam.set(tCut, { x: 480, y: 280, zoom: 1.12, roll: 0 }).to(tCut, 6.2 + O, { zoom: 1.32, y: 260 }, 'inOut');
    boss.to(tCut, tCut + 0.35, { a: 1 }, 'out');
    // the wound opens across her
    H.sfx(tCut + 0.4, 'Damage', 0.5);
    boss.to(tCut + 0.4, tCut + 0.42, { flash: 0.8, shake: 4 }, 'lin').to(tCut + 0.42, tCut + 0.9, { flash: 0, shake: 0 }, 'out');
    for (let i = 0; i < 10; i++) frame.set(tCut + 0.4 + i * 0.13, 'fatal' + i);
    H.say(16.3, 19.6, ['……呃啊……', '想打倒我……', '你还得再加把劲才行！'], { at: () => [X + 20, Y - 210], cps: 11, vol: 0.16 });
    for (const t of [16.0, 18.4]) H.sfx(t, 'Drip', 0.3);
    // the melt
    for (let i = 0; i < 4; i++) { frame.set(4.3 + O + i * 0.42, 'melt' + i); H.sfx(4.3 + O + i * 0.42, 'Drip', 0.3); }
    H.say(4.45 + O, 6.0 + O, ['……嗯？', '身体……在融化……'], { at: () => [X + 20, Y - 210], cps: 10, vol: 0.14 });

    // she refuses: heartbeats, the screen drains, white pushes through her
    TL.bg.to(5.6 + O, 7.4 + O, { cav: 0.15, rain: 0 }, 'inOut');
    TL.post.to(5.6 + O, 7.6 + O, { vig: 0.75, desat: 0.4 }, 'inOut');
    const beats = [6.05, 6.85, 7.45, 7.9, 8.25, 8.5];
    beats.forEach((t0, i) => {
      const t = t0 + O;
      H.sfx(t, 'Heartbeat', 0.55 + i * 0.06);
      boss.to(t, t + 0.02, { white: 0.35 + i * 0.12, shake: 1 + i }, 'lin').to(t + 0.02, t + 0.3, { white: 0.1 * i, shake: 0.5 * i }, 'out');
      H.punch(t, 0.5 + i * 0.15);
    });
    H.say(6.1 + O, 7.7 + O, ['不……', '我还不能倒下！'], { at: () => [X + 20, Y - 210], cps: 12, vol: 0.2 });
    H.sfx(6.4 + O, 'Rumble', 0.6);
    H.sfx(7.2 + O, 'Shimmer', 0.45);
    TL.cam.to(6.2 + O, 8.6 + O, { zoom: 1.6, y: 300 }, 'in');
    boss.to(8.25 + O, 8.75 + O, { white: 1 }, 'in');
    H.swell(8.75 + O, 0.5);
    H.flashScreen(8.75 + O, 1);
    H.sfx(8.75 + O, 'Flash', 0.6);
    boss.set(8.8 + O, { a: 0 });
    TL.bg.set(8.8 + O, { cav: 0 });
    TL.post.to(8.75 + O, 9.0 + O, { vig: 0.35, desat: 0 }, 'out');

    TL.add({
      t0: tCut, t1: 8.8 + O, z: -50,
      draw(ctx, emi, t) {
        const b = boss.at(t);
        if (b.a <= 0.001) return;
        const jx = b.shake ? Math.round(U.noise(t * 47) * b.shake) : 0;
        D.boss(ctx, emi, frame.at(t), X + jx, Y, { alpha: b.a, glow: 0.08 + b.white * 0.5 });
        if (b.flash > 0.01 || b.white > 0.01) D.boss(ctx, null, frame.at(t), X + jx, Y, { alpha: b.a * Math.max(b.flash, b.white), sil: '#ffffff', glow: 0 });
        if (b.white > 0.3 && emi) D.boss(emi, null, frame.at(t), X + jx, Y, { alpha: b.white, sil: '#ffffff', glow: 0, scale: 2 });
        // her heart showing through, pulsing with the beats
        if (t > 5.9 + O) {
          const k = U.clamp((t - 5.9 - O) / 0.6) * (0.5 + 0.5 * b.white);
          MV.spr(ctx, 'soul_white', X, Y - 150, { alpha: k, scale: 1 + b.white * 0.6 });
          if (emi) { emi.globalAlpha = k; MV.spr(emi, 'soul_white', X, Y - 150, { scale: 2.4 + b.white * 2 }); emi.globalAlpha = 1; }
        }
      },
    });
  });
})();
