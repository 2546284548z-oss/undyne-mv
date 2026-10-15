// Bars 12 - 27, the band kicks in: the green soul's shield game. Spears land on
// the off-beat claps and the riff's accents; their side follows the melody
// (rising notes come from above, falling from below, level ones alternate left
// and right); the strongest accents send yellow spears that swing round and
// land from behind. 20 - 27 tighten in: denser, closer camera, a slow roll.
// Bar 27 is the first turn: FIGHT, the slash, and she laughs it off.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;

  // ------------------------------------------------------------ the spear generator
  // o: {snare, tone, kick (thresholds; 0 = off), gap (min 16ths between spears),
  //     yel (chance of a yellow on a strong accent), travel, skip(s) -> true to leave a slot out,
  //     from, to (16th range in the bar), throws (arm on the bar's first spear)}
  let prev = { side: 'u', pitch: 75, t: -1 };
  H.greenBar = (b, o = {}) => {
    const th = { snare: o.snare ?? 0.5, tone: o.tone ?? 0.8, kick: o.kick ?? 0 };
    const out = [];
    let last = -99;
    for (let s = o.from ?? 0; s < (o.to ?? 16); s++) {
      if (o.skip && o.skip(s)) continue;
      const v = Math.max(th.snare ? (H.acc(b, 0, s, 'snare') > th.snare ? 1 : 0) : 0,
        th.tone ? (H.acc(b, 0, s, 'tone') > th.tone ? 1 : 0) : 0,
        th.kick ? (H.acc(b, 0, s, 'kick') > th.kick ? 1 : 0) : 0, o.add && o.add.includes(s) ? 1 : 0);
      if (!v || s - last < (o.gap ?? 2)) continue;
      last = s;
      const t = at(b, 0, s), p = H.lead(b, 0, s);
      let side;
      if (p > 0 && p - prev.pitch >= 3) side = prev.side === 'u' ? 'r' : 'u';
      else if (p > 0 && prev.pitch - p >= 3) side = prev.side === 'd' ? 'l' : 'd';
      else side = prev.side === 'l' ? 'r' : prev.side === 'r' ? 'l' : U.hash(b * 16 + s) < 0.5 ? 'l' : 'r';
      const strong = H.acc(b, 0, s, 'tone') > 0.8 || H.acc(b, 0, s, 'snare') > 0.85;
      const yel = o.yel && strong && U.hash(b * 31.7 + s * 3.1) < o.yel && s - prev.s16 > 2;
      H.green(t, side, { kind: yel ? 'yel' : 'blue', travel: o.travel || 0.62, dist: o.dist, hitVol: o.vol });
      out.push({ t, side });
      prev = { side: yel ? { u: 'd', d: 'u', l: 'r', r: 'l' }[side] : side, pitch: p > 0 ? p : prev.pitch, t, s16: s };
      if (o.squash !== false) TL.soul.to(t, t + 0.02, { sq: 0.8 }, 'lin').to(t + 0.02, t + 0.15, { sq: 1 }, 'out');
    }
    if (o.throws !== false && out.length) H.throwArm(out[0].t - 0.55, 0.8);
    return out;
  };
  H.resetGreen = (side = 'u') => { prev = { side, pitch: 75, t: -1, s16: -9 }; };

  MV.sections.push(() => {
    H.resetGreen('l');
    // ------------------------------------------------------------ 12 - 19
    H.punch(at(12), 1.2);
    H.cam(at(12), at(12, 2), { x: 480, y: 238, zoom: 1.25, roll: 0 }, 'outExpo');
    TL.post.to(at(12), at(12, 1), { bloom: 1.1, ca: 0.7 }, 'out');
    TL.bg.to(at(12), at(13), { cav: 0.85, drift: 14 }, 'inOut');
    for (let b = 12; b < 20; b++) {
      H.greenBar(b, { tone: 0.8, snare: 0.5, gap: 2, yel: b >= 14 ? 0.35 : 0, travel: 0.64 });
      H.cam(at(b), at(b + 1), { roll: (b % 2 ? -1 : 1) * 0.022 }, 'inOut');
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.3);
    }
    H.say(at(13), at(15), ['就这点本事吗？'], { cps: 12 });
    H.face(at(13), 9); H.face(at(15), 0);
    H.face(at(17), 1); H.face(at(17, 2), 0);

    // ------------------------------------------------------------ 20 - 26: closer, denser
    H.cam(at(19, 3), at(20, 1), { x: 480, y: 232, zoom: 1.45 }, 'inOut');
    TL.post.to(at(20), at(20, 2), { bloom: 1.2, vig: 0.42 }, 'out');
    TL.und.to(at(20), at(21), { ghost: 0.5 }, 'inOut');
    for (let b = 20; b < 27; b++) {
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.85, gap: 2, yel: 0.45, travel: 0.56 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.4);
    }
    H.cam(at(20), at(22), { roll: 0.07 }, 'inOut');
    H.cam(at(22), at(24), { roll: -0.07 }, 'inOut');
    H.cam(at(24), at(26), { roll: 0.05, zoom: 1.52 }, 'inOut');
    H.cam(at(26), at(26, 3), { roll: 0, zoom: 1.45 }, 'inOut');
    H.say(at(21), at(23, 2), ['这一击……', '是为了大家！'], { cps: 12 });
    H.face(at(21), 6); H.face(at(23, 2), 0);
    H.face(at(25), 2); H.face(at(25, 2), 0);

    // ------------------------------------------------------------ 27: the first turn
    TL.shield.to(at(27), at(27, 0, 2), { a: 0 }, 'out');
    TL.und.to(at(26, 3), at(27), { ghost: 0 }, 'inOut');
    H.cam(at(27), at(27, 1), { x: 480, y: 262, zoom: 1.1, roll: 0 }, 'inOut');
    H.turn(at(27), at(27, 1), 2475, 1, 0.86, { after: 1, hurt: 0.4 });
    H.say(at(27, 2), at(28, 2), ['哈哈哈！', '就这样？'], { cps: 14 });
    H.face(at(28, 2), 0);
    H.swell(at(28), 0.45);
  });
})();
