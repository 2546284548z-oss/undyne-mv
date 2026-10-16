// Bars 12 - 27, the band kicks in: the green soul's shield game. Spears land on
// the off-beat claps and the riff's accents; their side follows the melody
// (rising notes come from above, falling from below, level ones alternate left
// and right); the strongest accents hit heavy or send yellow spears that swing
// round and land from behind. The camera snaps on the downbeats, she lunges at
// the soul, spear flurries close the phrases, giant spears tear across the
// background. 20 - 26: she dashes from side to side as she throws. Bar 27 is the
// first turn: FIGHT, the slash - and she roars it off.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL, H = MV.H, L = MV.LAYOUT;
  const at = T.at;

  // ------------------------------------------------------------ the spear generator
  // o: {snare, tone, kick (thresholds; 0 = off), gap (min 16ths between spears),
  //     yel (chance of a yellow on a strong accent), travel, skip(s) -> true to leave a slot out,
  //     from, to (16th range in the bar), throws (arm on the bar's first spear),
  //     fill (0..1: chance of a lighter spear on each hi-hat 8th the accents leave free),
  //     burst ([s0, s1): every 16th in the range, the shield wheeling round clockwise),
  //     parry (the bar's first strong accent is parried back at her)}
  // Three layers: the accents (claps, the riff) carry the heavy blocks, the hi-hat 8ths fill
  // in between as the phrases build, 16th bursts crown the climaxes.
  let prev = { side: 'u', pitch: 75, t: -1 };
  const CW = { u: 'r', r: 'd', d: 'l', l: 'u' };
  H.greenBar = (b, o = {}) => {
    const th = { snare: o.snare ?? 0.5, tone: o.tone ?? 0.8, kick: o.kick ?? 0 };
    const out = [];
    let last = -99, parried = !o.parry;
    for (let s = o.from ?? 0; s < (o.to ?? 16); s++) {
      if (o.skip && o.skip(s)) continue;
      const v = Math.max(th.snare ? (H.acc(b, 0, s, 'snare') > th.snare ? 1 : 0) : 0,
        th.tone ? (H.acc(b, 0, s, 'tone') > th.tone ? 1 : 0) : 0,
        th.kick ? (H.acc(b, 0, s, 'kick') > th.kick ? 1 : 0) : 0, o.add && o.add.includes(s) ? 1 : 0);
      const burst = o.burst && s >= o.burst[0] && s < o.burst[1];
      const fill = !v && !burst && o.fill && s % 2 === 0 && H.acc(b, 0, s, 'hat') > 0.2 && U.hash(b * 16.13 + s * 1.7 + 0.37) < o.fill;
      if (!v && !burst && !fill) continue;
      if (s - last < (burst ? 1 : o.gap ?? 2)) continue;
      last = s;
      const t = at(b, 0, s), p = H.lead(b, 0, s);
      let side;
      if (burst && s > o.burst[0]) side = CW[prev.side];
      else if (p > 0 && p - prev.pitch >= 3) side = prev.side === 'u' ? 'r' : 'u';
      else if (p > 0 && prev.pitch - p >= 3) side = prev.side === 'd' ? 'l' : 'd';
      else side = prev.side === 'l' ? 'r' : prev.side === 'r' ? 'l' : U.hash(b * 16 + s) < 0.5 ? 'l' : 'r';
      const strong = v && (H.acc(b, 0, s, 'tone') > 0.8 || H.acc(b, 0, s, 'snare') > 0.85);
      const yel = o.yel && strong && U.hash(b * 31.7 + s * 3.1) < o.yel && s - prev.s16 > 2;
      const parry = !parried && strong && !yel && s - prev.s16 >= 2;
      if (parry) parried = true;
      H.green(t, side, {
        kind: yel ? 'yel' : 'blue', travel: o.travel, dist: o.dist, heavy: strong && o.heavy !== false, deflect: parry,
        hitVol: fill ? 0.3 : burst ? 0.38 : o.vol, vol: fill || burst ? 0.05 : undefined, fill,
      });
      out.push({ t, side });
      prev = { side: yel ? { u: 'd', d: 'u', l: 'r', r: 'l' }[side] : side, pitch: p > 0 ? p : prev.pitch, t, s16: s };
      if (o.squash !== false) TL.soul.to(t, t + 0.02, { sq: fill ? 0.88 : 0.8 }, 'lin').to(t + 0.02, t + 0.15, { sq: 1 }, 'out');
    }
    if (o.throws !== false && out.length) H.throwArm(out[0].t - 0.55, 0.8);
    return out;
  };
  H.resetGreen = (side = 'u') => { prev = { side, pitch: 75, t: -1, s16: -9 }; };

  H.snap = (t, v) => H.cam(t - 0.02, t + 0.12, v, 'outExpo');

  MV.sections.push(() => {
    H.resetGreen('l');
    // ------------------------------------------------------------ 12: she lands
    H.barrage(at(12), 4);
    H.speed(at(12), at(12, 2), { k: 0.9 });
    H.snap(at(12), { x: 480, y: 236, zoom: 1.34, roll: 0 });
    TL.shadow.to(at(12), at(12, 2), { a: 0.72 }, 'out');
    TL.rage.to(at(12), at(12, 1), { v: 0.9 }, 'out');
    TL.rumble.to(at(12, 1), at(13), { v: 1.4 }, 'out');
    TL.post.to(at(12), at(12, 1), { bloom: 1.15, ca: 0.9, vig: 0.45 }, 'out');
    TL.bg.to(at(12), at(13), { cav: 0.85, drift: 24 }, 'inOut');

    // ------------------------------------------------------------ 12 - 19
    // Sekiro, introduced: the posture bar under her name climbs with every block (never to
    // the top yet), and twice a 危 thrust must be sidestepped instead of blocked
    TL.boss.to(at(12), at(12, 2), { pa: 1 }, 'out');
    H.postureWindow(at(12), at(27), 0, 0.62);
    const peril12 = { 19: 1, 25: -1 };
    // the rushes grow: six spears at 15, eight at 17; the hi-hat 8ths creep in phrase by phrase
    const flur12 = { 15: ['l', 6], 17: ['r', 8] };
    for (let b = 12; b < 20; b++) {
      const f = flur12[b];
      H.greenBar(b, { tone: 0.8, snare: 0.5, gap: 2, yel: b >= 14 ? 0.35 : 0, fill: b < 14 ? 0.15 : b < 16 ? 0.3 : 0.45, parry: b === 13 || b === 19, to: peril12[b] ? 9 : f ? (f[1] === 8 ? 5 : 9) : 16 });
      if (f) H.rush(b, f[0], { n: f[1] });
      if (peril12[b]) H.peril(at(b, 3), { dir: peril12[b] });
      if (b % 2 === 0 && b > 12) {
        H.snap(at(b), { zoom: b % 4 ? 1.46 : 1.32, x: b % 4 ? 492 : 468, roll: b % 4 ? -0.05 : 0.045 });
        H.lunge(at(b), 0.55);
      }
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.45);
      if (b % 4 === 0) H.barrage(at(b, 2), 2, { vol: 0.25 });
    }
    H.say(at(13), at(15), ['就这点本事吗？'], { cps: 14 });
    H.face(at(13), 9); H.face(at(15), 0);
    H.face(at(17), 1); H.face(at(17, 2), 0);

    // ------------------------------------------------------------ 20 - 26: she dashes as she throws
    TL.shadow.to(at(20), at(21), { a: 0.85 }, 'inOut');
    TL.rage.to(at(20), at(21), { v: 1.15 }, 'inOut');
    TL.rumble.to(at(20), at(21), { v: 2.2 }, 'inOut');
    TL.post.to(at(20), at(20, 2), { bloom: 1.25, vig: 0.48, ca: 1.1 }, 'out');
    TL.bg.to(at(20), at(21), { drift: 40 }, 'inOut');
    TL.und.to(at(20), at(20, 1), { ghost: 0.5 }, 'inOut');
    H.speed(at(20), at(27), { k: 0.3 });
    const xs = { 20: 372, 21: 590, 22: 400, 23: 566, 24: 360, 25: 600, 26: 480 };
    const flur20 = { 22: 'd', 24: 'l', 26: 'r' };
    for (let b = 20; b < 27; b++) {
      const f = flur20[b];
      H.greenBar(b, { tone: 0.5, snare: 0.5, kick: 0.85, gap: 2, yel: 0.45, fill: b < 24 ? 0.6 : 0.8, parry: b === 21 || b === 23, burst: b === 23 ? [12, 16] : null, to: peril12[b] ? 9 : f ? 5 : 16 });
      if (f) H.rush(b, f, { deflect: b !== 26 });
      if (peril12[b]) H.peril(at(b, 3), { dir: peril12[b] });
      H.dash(at(b) - 0.12, at(b) + 0.08, xs[b]);
      H.snap(at(b), { zoom: b % 2 ? 1.5 : 1.4, x: 480 + (xs[b] - 480) * 0.25, roll: (b % 2 ? -1 : 1) * 0.09 });
      for (const s of H.hits(b, 'kick', 0.8)) H.punch(at(b, 0, s), 0.55);
      if (b % 2 === 0) H.barrage(at(b, 1, 2), 2, { vol: 0.22 });
    }
    H.say(at(21), at(23, 2), ['这一击……', '是为了大家！'], { cps: 14 });
    H.face(at(21), 6); H.face(at(23, 2), 0);
    H.face(at(25), 2); H.face(at(25, 2), 0);

    // ------------------------------------------------------------ 27: the first turn
    H.band(at(26, 3, 2), true); H.band(at(27, 3, 2), false); // the FIGHT turn
    TL.shield.to(at(27), at(27, 0, 2), { a: 0 }, 'out');
    TL.und.to(at(26, 3), at(27), { ghost: 0 }, 'inOut');
    TL.rumble.to(at(27), at(27, 1), { v: 0.5 }, 'out');
    H.cam(at(27), at(27, 1), { x: 480, y: 258, zoom: 1.12, roll: 0 }, 'inOut');
    H.turn(at(27), at(27, 1), 2475, 1, 0.86, { after: 14, hurt: 0.1, show: 0.48 });
    // the hit-stop (Smash) on the cut; the boss bar takes it (Souls); she shakes the posture off
    H.freeze(at(27, 1) + 0.35, 0.14, { zoom: 0.08 });
    H.bossHp(at(27, 1) + 0.32, 0.86);
    TL.boss.to(at(27, 3), at(28), { posture: 0.12 }, 'out').to(at(28), at(28, 2), { pa: 0 }, 'inOut');
    H.roar(at(27, 3), '就这样？！', { len: 1.0, head: 12, after: 0, rest: 1.4 });
    H.swell(at(28), 0.45);
  });
})();
