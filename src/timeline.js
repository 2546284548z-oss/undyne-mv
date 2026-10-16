// Choreography toolkit. Every attack / camera move is scheduled on the music
// grid (T.at(bar, beat, sixteenth)); times before T.pre are the silent
// prologue, after T.dur the silent epilogue. Sections live in src/tl_*.js.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, T = MV.T, TL = MV.TL;
  const { Track, Steps } = MV;
  const R = Math.round;

  // ---------------------------------------------------------------- layout
  // The original 640x480 battle layout, placed 1:1 in the 960x540 world (+160, +30).
  const L = (MV.LAYOUT = {
    und: [480, 268], // Undyne: feet centre
    soul: [480, 352], // the green soul's post
    boxGreen: { x: 437, y: 309, w: 86, h: 86 },
    boxMenu: { x: 192, y: 280, w: 576, h: 140 },
    boxRed: { x: 250, y: 285, w: 460, h: 140 },
    hudY: 432,
    name: 190, lv: 291, hpLabel: 404, hpBar: { x: 435, y: 430 },
    btnY: 462, btnH: 42, btnW: 110, btnX: [192, 345, 505, 660],
  });

  // ---------------------------------------------------------------- tracks
  TL.cam = new Track({ x: 480, y: 270, zoom: 1, roll: 0, pitch: 0, yaw: 0 });
  TL.box = new Track(Object.assign({ draw: 0, alpha: 1, fill: 1, th: 5, glow: 1 }, L.boxMenu));
  TL.soul = new Track({ x: L.soul[0], y: L.soul[1], rot: 0, sc: 1, sq: 1, a: 0 });
  TL.soulCol = new Steps('red');
  TL.aura = new Track({ v: 0 });
  TL.shield = new Track({ a: 0, dir: -Math.PI / 2, ring: 1 });
  TL.und = new Track({ x: L.und[0], y: L.und[1], a: 0, sc: 2, arm: 0, armL: 0, lean: 0, breathe: 1, glow: 0.12, flash: 0, drip: 0, eye: 0, shake: 0, sil: 0, ghost: 0, cut: 0, vox: 0, vyaw: 0 });
  TL.uShow = new Track({ hair: 1, legs: 1, cape: 1, torso: 1, armL: 1, spearArm: 1, head: 1 });
  TL.head = new Steps(0);
  TL.melt = new Steps(0);
  TL.hud = new Track({ a: 0, hp: 64, jit: 0 });
  TL.btn = [0, 1, 2, 3].map(() => new Track({ a: 0, sel: 0, dx: 0, dy: 0 }));
  TL.bg = new Track({ cav: 0, rain: 0, drift: 6, ceiling: 0.75, flowers: 0, k: 1, grid: 0 });
  TL.post = new Track({ bloom: 1, vig: 0.35, desat: 0, tint: 0, tintAmt: 0, grid: 0, scan: 0.04, letter: 0, bg: 0, bgHue: 0.6, ca: 0.5, glitch: 0 });
  TL.boxHits = [];
  TL.shieldHits = [];
  // boss pressure: a constant camera rumble (px), her giant shadow behind the arena,
  // the aura burning off her
  TL.rumble = new Track({ v: 0 });
  TL.shadow = new Track({ a: 0, x: 480, y: 760, sc: 7, eye: 1 });
  TL.rage = new Track({ v: 0 });
  // the cinematic frame: letterbox bands (screen px) holding the HUD; `safe` weights the
  // camera's auto-framing that keeps her head and the arena inside the picture between them
  MV.SAFE = { top: 52, bot: 62 };
  TL.frame = new Track({ top: 0, bot: 0 });
  TL.safe = new Track({ v: 0 });

  // sections register builders; they run after the assets are loaded
  MV.sections = [];
  MV.late = [];
  MV.buildTimeline = () => { MV.sections.forEach((f) => f()); H.buildShield(); H.buildPosture(); };

  // ---------------------------------------------------------------- sound effects
  // {t, name, vol}: played live through WebAudio and mixed into the export
  TL.sfx = [];
  const sfxLast = {};
  const H = (MV.H = {});
  // the bottom band (the player's HUD) only rises for the player's own moments - the opening,
  // each FIGHT turn, the last blow - and drops away while she attacks
  H.band = (t, show, dur = 0.28) => TL.frame.to(t, t + dur, { bot: show ? MV.SAFE.bot : 0 }, show ? 'outBack' : 'in');
  // rate: playback speed (pitch); returns the cue so a later pass can retune it
  H.sfx = (t, name, vol = 1, rate) => {
    // limiter: one trigger of the same sound per 40 ms
    const k = name + Math.round(t / 0.04);
    if (sfxLast[k]) { sfxLast[k].vol = Math.max(sfxLast[k].vol, vol); return sfxLast[k]; }
    const e = { t: +t.toFixed(4), name, vol };
    if (rate && rate !== 1) e.rate = rate;
    TL.sfx.push((sfxLast[k] = e));
    return e;
  };
  H.swell = (tHit, vol = 0.5, name = 'Swell') => H.sfx(tHit - (window.MV_SYNTH ? window.MV_SYNTH.len(name) : 1), name, vol);
  const at = (H.at = T.at);
  H.S16 = T.s16; H.BEAT = T.beat; H.BAR = T.bar;
  // music analysis lookups (slot = 16th index from bar 0)
  H.slot = (b, k = 0, s = 0) => Math.round(b * 16 + k * 4 + s);
  H.acc = (b, k, s, band = 'full') => T.acc(H.slot(b, k, s), band);
  H.lead = (b, k = 0, s = 0) => T.A.lead[H.slot(b, k, s)] ?? -1;
  // 16th positions in bar b where `band` hits above th
  H.hits = (b, band = 'tone', th = 0.5) => { const o = []; for (let s = 0; s < 16; s++) if (H.acc(b, 0, s, band) > th) o.push(s); return o; };

  // ---------------------------------------------------------------- camera helpers
  H.cam = (t0, t1, v, ease = 'inOut') => TL.cam.to(t0, t1, v, ease);
  H.cut = (t, v) => TL.cam.set(t, v);
  H.punch = (t, k = 1, o = {}) => TL.impact(t, Object.assign({ amp: 3 * k, zoom: 0.03 * k, ca: 1.4 * k, dur: 0.25 }, o));
  H.hit = (t, k = 1, o = {}) => TL.impact(t, Object.assign({ amp: 9 * k, zoom: 0.06 * k, ca: 5 * k, flash: 0.22 * k, dur: 0.45 }, o));
  H.bigHit = (t, o = {}) => TL.impact(t, Object.assign({ amp: 18, zoom: 0.12, ca: 14, flash: 0.9, inv: 0.05, bw: 0.034, rot: 0.03, dur: 0.7 }, o));
  H.box = (t0, t1, v, ease = 'outBack') => TL.box.to(t0, t1, v, ease);
  H.boxHit = (t, side, u, amt = 6) => TL.boxHits.push({ t, side, u, amt });
  H.soulTo = (t0, t1, x, y, ease = 'outExpo', extra = {}) => TL.soul.to(t0, t1, Object.assign({ x, y }, extra), ease);

  // ---------------------------------------------------------------- Undyne
  H.und = (t0, t1, v, ease = 'inOut') => TL.und.to(t0, t1, v, ease);
  // a throw: wind the spear arm up, snap it down on tHit
  H.throwArm = (tHit, k = 1) => {
    TL.und.to(tHit - T.beat * 0.75, tHit - 0.03, { arm: 0.9 * k, lean: -0.03 * k }, 'out');
    TL.und.to(tHit - 0.03, tHit + 0.06, { arm: -0.35 * k, lean: 0.04 * k }, 'outExpo');
    TL.und.to(tHit + 0.06, tHit + T.beat * 1.2, { arm: 0, lean: 0 }, 'inOut');
  };
  H.face = (t, i) => TL.head.set(t, i);

  // ---------------------------------------------------------------- green soul: arrow-spears
  // A spear comes FROM side ('u','d','l','r') and meets the shield at tHit.
  // o: {kind ('blue' | 'yel'), travel (s), dist (start distance px), turn (yellow: the side it
  //     swings round to; it arrives from there), vol}
  const SIDE = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  const POINT = { u: 'd', d: 'u', l: 'r', r: 'l' }; // a spear from above points down
  const OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };
  H.SIDE_ANG = { u: -Math.PI / 2, d: Math.PI / 2, l: Math.PI, r: 0 };
  TL.greens = [];
  H.ARROW = 1.9; // arrow-spear size (the game's 1x reads too small in the MV's framing)
  H.green = (tHit, side, o = {}) => {
    // spears from below start nearer: the picture ends a little under the box
    const kind = o.kind || 'blue', travel = o.travel || 0.48, dist = o.dist || ((kind === 'yel' ? (o.turn || OPP[side]) : side) === 'd' || side === 'd' ? 190 : 400);
    const stop = D.SHIELD_R + 3; // tip distance from the soul at the block
    const final = kind === 'yel' ? o.turn || OPP[side] : side;
    const t0 = tHit - travel;
    const tTurn = tHit - travel * 0.32, swing = 0.14; // yellow: swings round here
    const dTurn = stop + (dist - stop) * 0.32;
    const sp = { t0, t1: tHit, side, final, kind };
    TL.greens.push(sp);
    // position of the tip and the side it currently comes from
    const pose = (t, sx, sy) => {
      if (kind !== 'yel' || t >= tTurn + swing) {
        const u = U.clamp((t - t0) / travel);
        let d = U.lerp(dist, stop, u);
        let s = final;
        if (kind === 'yel') d = U.lerp(dTurn, stop, U.clamp((t - tTurn - swing) / (tHit - tTurn - swing)));
        const v = SIDE[s];
        return { x: sx + v[0] * d, y: sy + v[1] * d, dir: POINT[s], rot: 0 };
      }
      if (t < tTurn) {
        const d = U.lerp(dist, dTurn, U.clamp((t - t0) / (tTurn - t0)));
        const v = SIDE[side];
        return { x: sx + v[0] * d, y: sy + v[1] * d, dir: POINT[side], rot: 0 };
      }
      // the swing: orbit 180 degrees round the soul at dTurn (always clockwise)
      const u = U.eInOut((t - tTurn) / swing);
      const a0 = Math.atan2(SIDE[side][1], SIDE[side][0]);
      const a = a0 + Math.PI * u;
      return { x: sx + Math.cos(a) * dTurn, y: sy + Math.sin(a) * dTurn, ang: a + Math.PI, dir: POINT[side], rot: Math.PI * u };
    };
    if (kind === 'yel') H.sfx(tTurn, 'UndArrow', 0.35);
    H.sfx(t0, 'UndSpearAppear', o.vol ?? 0.12);
    const heavy = o.heavy || kind === 'yel';
    // hitVol 0: a silent block (the extra density layers stay out of the music's way)
    const hv = o.hitVol ?? 0.5;
    const hit = { t: tHit, side: final, heavy, fill: !!o.fill, block: hv > 0 ? H.sfx(tHit, 'Block', hv) : null };
    TL.shieldHits.push(hit);
    if (o.deflect) H.deflect(hit, kind);
    if (o.stop) H.freeze(tHit, o.stop, { zoom: 0.025 }); // a micro hit-stop on the heaviest blocks
    // the block: sparks thrown back along the spear's line, the camera kicked away from it
    const bx = () => TL.soul.at(tHit).x + SIDE[final][0] * stop, by = () => TL.soul.at(tHit).y + SIDE[final][1] * stop;
    const back = Math.atan2(SIDE[final][1], SIDE[final][0]);
    TL.burst(tHit, { x: bx, y: by, n: heavy ? 22 : 14, speed: [90, heavy ? 320 : 230], ang: [back - 0.9, back + 0.9], life: [0.12, 0.32], colors: kind === 'yel' ? ['#ffff40', '#ffffff', '#ffb000'] : ['#5fd8ff', '#ffffff', '#2a6bff'], size: [2, 3], z: 36 });
    TL.ring(tHit, bx, by, { r0: 4, r1: heavy ? 46 : 30, w: heavy ? 4 : 3, dur: 0.22, color: kind === 'yel' ? '#ffff80' : '#bff0ff', z: 37 });
    TL.impact(tHit, { amp: heavy ? 4.5 : 2.4, dx: -SIDE[final][0] * 1.6, dy: -SIDE[final][1] * 1.6, zoom: heavy ? 0.03 : 0.012, ca: heavy ? 2.4 : 1, flash: heavy ? 0.08 : 0, dur: 0.2 });
    if (heavy) H.sfx(tHit, 'Clang', 0.32);
    return TL.add({
      t0, t1: tHit, z: -150, kind: 'green', sp,
      draw(ctx, emi, t, S) {
        const p = pose(t, S.soul.x, S.soul.y);
        const fade = U.clamp((t - t0) / 0.08);
        if (p.ang !== undefined) {
          // mid-swing: draw it rotated round its own tip
          const img = MV.part('spear/yel_' + POINT[side]);
          ctx.save(); ctx.globalAlpha = fade; ctx.translate(R(p.x), R(p.y)); ctx.rotate(p.rot); ctx.scale(H.ARROW, H.ARROW);
          const [ax, ay] = { d: [0.5, 1], u: [0.5, 0], r: [1, 0.5], l: [0, 0.5] }[POINT[side]];
          ctx.drawImage(img, -R(img.width * ax), -R(img.height * ay));
          ctx.restore();
          return;
        }
        // a motion streak behind the shaft
        const v = SIDE[kind === 'yel' && t < tTurn ? side : final];
        const tail = 25 * H.ARROW, col = kind === 'yel' ? '#ffe040' : '#5fd8ff';
        for (let k = 0; k < 5; k++) {
          const d0 = tail + k * 16, w = Math.max(2, 6 - k);
          const cx = p.x + v[0] * (d0 + 8), cy = p.y + v[1] * (d0 + 8);
          D.rect(ctx, cx - (v[0] ? 8 : w / 2), cy - (v[1] ? 8 : w / 2), v[0] ? 16 : w, v[1] ? 16 : w, col, fade * (0.45 - k * 0.08));
        }
        D.arrow(ctx, emi, kind, p.dir, p.x, p.y, { alpha: fade, scale: H.ARROW });
        // a volley: flanking spears converge on the same point and hit with it
        if (o.volley) {
          const u = U.clamp((t - t0) / travel), off = 34 * (1 - U.eIn(u)) + 6, back = 18 * (1 - u);
          for (const sg of [-1, 1]) D.arrow(ctx, emi, kind, p.dir, p.x - v[1] * off * sg + v[0] * back, p.y + v[0] * off * sg + v[1] * back, { alpha: fade * 0.9, scale: H.ARROW * 0.85 });
        }
      },
    });
  };
  H.SIDE = SIDE; H.OPP = OPP;
  // the parry (B1): the blocked spear glances off the shield and flies straight back into her -
  // sparks off her armour, she staggers, and her posture jumps (H.buildPosture)
  TL.deflects = [];
  H.deflect = (h, kind = 'blue') => {
    const fly = 0.24, tA = h.t + fly, v = SIDE[h.side], stop = D.SHIELD_R + 3;
    h.deflect = true; h.tA = tA;
    TL.deflects.push(h);
    H.sfx(h.t, 'Clang', 0.42); H.sfx(h.t + 0.005, 'Ping', 0.4);
    H.sfx(tA, 'Hit', 0.55); H.sfx(tA, 'Impact', 0.32);
    const col = kind === 'yel' ? '#ffe040' : '#9fe8ff';
    // a quadratic arc from the shield, out along the spear's side and up into her chest
    const path = (t, S) => {
      const s0 = TL.soul.at(h.t), u = U.eOut(U.clamp((t - h.t) / fly));
      const x0 = s0.x + v[0] * stop, y0 = s0.y + v[1] * stop;
      // the arc swings wide (sideways for spears from above / below) so the flight reads
      const sw = TL.deflects.indexOf(h) % 2 ? 1 : -1, px = -v[1] * 150 * sw, py = v[0] * 60 * sw;
      const cx = x0 + v[0] * 90 + px, cy = y0 + v[1] * 50 - 120 + py;
      const [x2, y2] = D.undynePt(S.und.x, S.und.y, 52, 64, S.und.sc);
      const p = (a, b, c) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
      const d = (a, b, c) => 2 * (1 - u) * (b - a) + 2 * u * (c - b);
      return { x: p(x0, cx, x2), y: p(y0, cy, y2), ang: Math.atan2(d(y0, cy, y2), d(x0, cx, x2)) };
    };
    TL.add({
      t0: h.t, t1: tA, z: 47,
      draw(ctx, emi, t, S) {
        for (let k = 7; k >= 0; k--) {
          const tt = Math.max(h.t, t - k * 0.014), p = path(tt, S);
          if (k) { D.rect(ctx, p.x - 4, p.y - 4, 8, 8, k % 2 ? '#ffffff' : col, 0.75 - k * 0.09); if (emi) D.rect(emi, p.x - 8, p.y - 8, 16, 16, col, 0.5 - k * 0.05); continue; }
          D.spear(ctx, emi, p.x, p.y, p.ang, { len: 64, scale: 1.4, color: col, glow: 1, glowCol: col });
        }
      },
    });
    const at2 = (S) => D.undynePt(S.und.x, S.und.y, 52, 64, S.und.sc);
    TL.burst(tA, { x: () => at2({ und: TL.und.at(tA) })[0], y: () => at2({ und: TL.und.at(tA) })[1], n: 26, speed: [120, 360], life: [0.15, 0.4], colors: ['#ffffff', '#ffe060', col], size: [2, 4], z: 48 });
    TL.ring(tA, () => at2({ und: TL.und.at(tA) })[0], () => at2({ und: TL.und.at(tA) })[1], { r0: 6, r1: 60, w: 5, dur: 0.25, color: '#ffffff', z: 48 });
    H.punch(tA, 0.9, { flash: 0.06 });
    TL.und.to(tA, tA + 0.02, { flash: 0.85, shake: 5, lean: -0.07 }, 'lin').to(tA + 0.02, tA + 0.3, { flash: 0, shake: 0, lean: 0 }, 'out');
  };
  // she flinches: the hurt face for a moment (after every section is built, so it restores the right face)
  MV.late.push(() => {
    for (const h of TL.deflects) { const f = TL.head.at(h.tA - 0.001); if (f !== 14) { TL.head.set(h.tA, 14); if (TL.head.at(h.tA + 0.24) === 14) TL.head.set(h.tA + 0.24, f); } }
  });
  // after all spears are placed: turn the shield to meet each one just before it lands
  H.buildShield = () => {
    const hits = TL.shieldHits.sort((a, b) => a.t - b.t);
    let cur = -Math.PI / 2, last = -1e9;
    for (const h of hits) {
      let target = H.SIDE_ANG[h.side];
      while (target - cur > Math.PI) target -= U.TAU;
      while (target - cur < -Math.PI) target += U.TAU;
      if (Math.abs(target - cur) > 1e-3) {
        const t1 = h.t - 0.025, t0 = Math.max(last + 0.02, h.t - 0.11);
        TL.shield.to(Math.min(t0, t1 - 0.012), t1, { dir: target }, 'outExpo');
      }
      cur = target; last = h.t;
    }
  };
  // validator: the shield faces every spear the moment it lands
  MV.checkShield = () => {
    const out = [];
    for (const h of TL.shieldHits) {
      const d = TL.shield.at(h.t).dir, want = H.SIDE_ANG[h.side];
      const err = Math.abs(Math.atan2(Math.sin(d - want), Math.cos(d - want)));
      if (err > 0.2 || TL.shield.at(h.t).a < 0.5) out.push({ t: +h.t.toFixed(3), bar: +T.barOf(h.t).toFixed(2), side: h.side, err: +err.toFixed(2) });
    }
    const ts = TL.shieldHits.map((h) => h.t).sort((a, b) => a - b);
    for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] < 0.06 && ts[i] !== ts[i - 1]) out.push({ t: +ts[i].toFixed(3), what: 'two blocks closer than 60 ms' });
    return out;
  };

  // ---------------------------------------------------------------- red soul: hazards
  // Every hazard has hit(t, x, y) for tools/check.cjs. The soul's path is keyframed
  // first; hazards are placed around it.
  const SOUL_R = 7;
  // a spear thrusting out of a box wall: warn from tw, out at tHit, back at tHit + hold.
  // side: 'b' (up from the floor) | 't' (down from the ceiling) | 'l' | 'r'; pos: x (or y) in world
  H.wallSpear = (tw, tHit, side, pos, o = {}) => {
    const hold = o.hold ?? 0.32, len = o.len || 90, warnW = 18, back = o.retract ?? 0.12;
    const t1 = tHit + hold + back;
    if (o.sfx !== false) { H.sfx(tw, 'UndSpearAppear', 0.18); H.sfx(tHit, 'UndSpearRise', o.vol ?? 0.4); }
    const geo = (t, S) => {
      const b = S ? S.box : TL.box.at(t);
      const out = t < tHit ? 0 : t < tHit + 0.05 ? U.eOut((t - tHit) / 0.05) : t < tHit + hold ? 1 : 1 - U.clamp((t - tHit - hold) / back);
      const L2 = len * out;
      if (side === 'b') return { b, out, x: pos, y: b.y + b.h - L2, ang: -Math.PI / 2, rect: [pos - 6, b.y + b.h - L2, 12, L2] };
      if (side === 't') return { b, out, x: pos, y: b.y + L2, ang: Math.PI / 2, rect: [pos - 6, b.y, 12, L2] };
      if (side === 'l') return { b, out, x: b.x + L2, y: pos, ang: 0, rect: [b.x, pos - 6, L2, 12] };
      return { b, out, x: b.x + b.w - L2, y: pos, ang: Math.PI, rect: [b.x + b.w - L2, pos - 6, L2, 12] };
    };
    return TL.add({
      t0: tw, t1, z: 5, clip: 'box', kind: 'white',
      hit(t, x, y) { if (t < tHit) return false; const g = geo(t); const [rx, ry, rw, rh] = g.rect; return x + SOUL_R > rx && x - SOUL_R < rx + rw && y + SOUL_R > ry && y - SOUL_R < ry + rh; },
      draw(ctx, emi, t, S) {
        const g = geo(t, S);
        if (t < tHit) {
          const b = g.b, k = U.clamp((t - tw) / 0.08);
          if (side === 'b' || side === 't') D.spearWarn(ctx, emi, pos - warnW / 2, side === 'b' ? b.y + b.h - len : b.y, warnW, len, t, k);
          else D.spearWarn(ctx, emi, side === 'l' ? b.x : b.x + b.w - len, pos - warnW / 2, len, warnW, t, k);
          return;
        }
        D.spear(ctx, emi, g.x, g.y, g.ang, { len: len + 40 });
      },
    });
  };
  // a long spear flying in a straight line: from (x0,y0) at t0 to (x1,y1) at t1 (tip positions)
  H.flyer = (t0, t1, x0, y0, x1, y1, o = {}) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), len = o.len || 70;
    if (o.sfx !== false) H.sfx(t0, 'UndSpearAppear', o.vol ?? 0.12);
    const warn = o.warn || 0;
    const pos = (t) => { const u = U.clamp((t - t0) / (t1 - t0)); return [U.lerp(x0, x1, u), U.lerp(y0, y1, u)]; };
    return TL.add({
      t0: t0 - warn, t1, z: o.clip ? 6 : o.z ?? 30, clip: o.clip ? 'box' : undefined, kind: 'white',
      hit(t, x, y) {
        if (t < t0) return false;
        const [px, py] = pos(t), cx = Math.cos(ang), sy = Math.sin(ang);
        // distance from the soul to the shaft segment (tip back len px)
        const dx = x - px, dy = y - py, along = -(dx * cx + dy * sy);
        if (along < -4 || along > len) return false;
        const perp = Math.abs(dx * sy - dy * cx);
        return perp < SOUL_R + (o.width ?? 3);
      },
      draw(ctx, emi, t) {
        if (t < t0) { // a faint line along the flight path
          const k = U.clamp((t - t0 + warn) / warn);
          ctx.globalAlpha = (o.warnA ?? 0.25) * k; ctx.strokeStyle = '#ff4050'; ctx.lineWidth = o.warnW ?? 2;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.globalAlpha = 1;
          return;
        }
        const [px, py] = pos(t);
        D.spear(ctx, emi, px, py, ang, { len, color: o.color, scale: o.scale });
      },
    });
  };
  // a ring of n spears round (cx, cy) at radius r appearing at t0, closing in on tHit
  H.ring = (t0, tHit, cx, cy, n = 8, r = 90, o = {}) => {
    const a0 = o.a0 || 0;
    H.sfx(t0, 'UndSpearAppear', 0.3);
    H.sfx(tHit, 'Slam', 0.45);
    TL.burst(tHit, { x: cx, y: cy, n: 24, speed: [80, 220], life: [0.2, 0.5], colors: ['#ffffff', '#9fe8ff'], size: 2, z: 36 });
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * U.TAU;
      const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
      const tFly = tHit - (o.fly ?? 0.14);
      TL.add({
        t0, t1: tHit + 0.02, z: 30, kind: 'white',
        hit(t, x, y) { if (t < tFly) return false; const u = U.clamp((t - tFly) / (tHit - tFly)); const px = U.lerp(sx, cx, u), py = U.lerp(sy, cy, u); return Math.hypot(x - px, y - py) < SOUL_R + 6; },
        draw(ctx, emi, t) {
          const u = t < tFly ? 0 : U.eIn(U.clamp((t - tFly) / (tHit - tFly)));
          const appear = U.eOutBack(U.clamp((t - t0) / 0.18));
          const rr = U.lerp(r, 6, u) + (1 - appear) * 30;
          const wob = t < tFly ? Math.sin((t - t0) * 30 + i) * 1.5 : 0;
          D.spear(ctx, emi, cx + Math.cos(a) * (rr + wob), cy + Math.sin(a) * (rr + wob), a + Math.PI, { len: 56, alpha: U.clamp((t - t0) / 0.1) });
        },
      });
    }
  };
  // the eye beam: a horizontal (or angled) beam through (x, y) after a warning
  H.beam = (tw, tFire, tEnd, y, o = {}) => {
    H.sfx(tw, 'EyeFlash', 0.35);
    H.sfx(tFire, 'Laz', 0.6);
    const h = o.h || 16;
    return TL.add({
      t0: tw, t1: tEnd + 0.15, z: 8, clip: 'box', kind: 'white',
      hit(t, x, yy) { return t >= tFire && t < tEnd && Math.abs(yy - y) < h / 2 + SOUL_R; },
      draw(ctx, emi, t, S) {
        const b = S.box;
        if (t < tFire) { D.spearWarn(ctx, emi, b.x, y - h / 2, b.w, h, t, U.clamp((t - tw) / 0.1)); return; }
        const k = t < tEnd ? 1 : 1 - (t - tEnd) / 0.15, hh = h * (t < tFire + 0.05 ? (t - tFire) / 0.05 : 1) * k;
        D.rect(ctx, b.x, y - hh / 2, b.w, hh, '#ffffff', 1);
        D.rect(ctx, b.x, y - hh / 2 - 3, b.w, 3, '#ff3040', k);
        D.rect(ctx, b.x, y + hh / 2, b.w, 3, '#ff3040', k);
        if (emi) D.rect(emi, b.x, y - hh, b.w, hh * 2, '#ff6070', 0.8 * k);
      },
    });
  };
  // validator: no white hazard touches the red soul
  MV.checkHits = (t0 = 0, t1 = T.end, step = 1 / 240) => {
    const out = [];
    let last = null;
    for (let t = t0; t < t1; t += step) {
      const s = TL.soul.at(t);
      if (s.a < 0.5 || TL.soulCol.at(t) !== 'red') continue;
      for (const e of TL.active(t)) {
        if (!e.hit || e.harmless) continue;
        if (e.hit(t, s.x, s.y)) {
          const key = e.kind + e.t0;
          if (last && last.key === key && t - last.t1 < 0.05) last.t1 = t;
          else out.push((last = { key, kind: e.kind, t0: +t.toFixed(3), t1: t, bar: +T.barOf(t).toFixed(2), x: Math.round(s.x), y: Math.round(s.y) }));
        }
      }
    }
    return out.map((o) => Object.assign(o, { t1: +o.t1.toFixed(3) }));
  };

  // ---------------------------------------------------------------- text
  // Undyne speaks: a bubble right of her head, typed out with her voice blip
  H.say = (t0, t1, lines, o = {}) => {
    const cps = o.cps || 18, n = lines.join('').length;
    const tType = n / cps;
    for (let i = 0; i < n; i += 2) H.sfx(t0 + i / cps, 'Blip', o.vol ?? 0.18);
    const sc = o.scale || 1;
    const w = o.w || Math.max(...lines.map((l) => D.textWidth(l, { scale: sc }))) + 20 * sc, h = lines.length * 18 * sc + 14 * sc;
    return TL.add({
      t0, t1, z: 60,
      draw(ctx, emi, t, S) {
        const u = U.clamp((t - t0) / Math.max(tType, 0.01));
        let left = Math.floor(u * n);
        const shown = lines.map((l) => { const s = [...l].slice(0, Math.max(0, left)).join(''); left -= [...l].length; return s; });
        const out = t > t1 - 0.12 ? (t1 - t) / 0.12 : 1;
        const [ex, ey] = o.at ? o.at(t, S) : D.undyneEye(S.und.x, S.und.y + 0, { breathe: S.und.breathe });
        let x = ex + (o.dx ?? 70), y = ey + (o.dy ?? -30);
        // keep the bubble inside the picture (between the letterbox bands)
        const c = S.cam, z = c.zoom || 1;
        x = U.clamp(x, c.x - 468 / z, c.x + 468 / z - w);
        y = U.clamp(y, c.y + (S.frame.top + 8 - 270) / z, c.y + (540 - S.frame.bot - 8 - 270) / z - h);
        D.bubble(ctx, x, y, w, h, shown, { tx: ex + 30, ty: ey + 10, alpha: out, scale: sc, pop: 0.85 + 0.15 * U.eOutBack(U.clamp((t - t0) / 0.15)) });
      },
    });
  };
  // narration in the box ("* ..."), typed with a soft tick
  H.narrate = (t0, t1, lines, o = {}) => {
    const cps = o.cps || 22, n = lines.join('').length;
    for (let i = 0; i < n; i += 2) H.sfx(t0 + i / cps, 'Tick', o.vol ?? 0.22);
    return TL.add({
      t0, t1, z: o.z ?? 12, screen: !!o.screen,
      draw(ctx, emi, t, S) {
        const b = o.box ? o.box : S.box;
        let left = Math.floor((t - t0) * cps);
        const out = t > t1 - 0.15 ? (t1 - t) / 0.15 : 1;
        lines.forEach((l, i) => {
          const s = [...l].slice(0, Math.max(0, left)).join('');
          left -= [...l].length;
          D.text(ctx, s, (o.x ?? b.x + 28), (o.y ?? b.y + 22) + i * 36, { scale: 2, alpha: out, color: o.color || '#ffffff' });
        });
      },
    });
  };
  // centred caption (title cards): fades in / out
  H.caption = (t0, t1, str, x, y, o = {}) =>
    TL.add({
      t0, t1, z: o.z ?? 70, screen: !!o.screen,
      draw(ctx, emi, t) {
        const k = Math.min(U.clamp((t - t0) / (o.fadeIn ?? 0.25)), U.clamp((t1 - t) / (o.fadeOut ?? 0.3)));
        const sh = o.shake ? U.clamp(1 - (t - t0) / 0.4) * o.shake : 0;
        D.text(ctx, str, x, y, { scale: o.scale || 2, align: 'center', alpha: k, color: o.color || '#ffffff', glow: emi, glowA: o.glowA ?? 0.5, shake: sh, seed: t * 50, spacing: o.spacing });
      },
    });

  // ---------------------------------------------------------------- FIGHT
  // one attack turn: FIGHT lights up on tSel, the slash lands on tHit, the number on tHit + 1/8 bar
  H.turn = (tSel, tHit, dmg, hp0, hp1, o = {}) => {
    H.sfx(tSel, 'MenuSelect', 0.5);
    TL.btn[0].set(tSel, { sel: 1 }).set(tHit + 0.1, { sel: 0 });
    H.sfx(tHit, 'Swipe', 0.55);
    const tNum = tHit + (o.delay ?? 0.32);
    H.sfx(tNum, o.big ? 'HeavyDamage' : 'Damage', 0.7);
    TL.und.to(tNum, tNum + 0.02, { flash: 1, shake: 6 }, 'lin').to(tNum + 0.02, tNum + 0.3, { flash: 0, shake: 0 }, 'out');
    H.face(tNum, 14);
    H.face(tNum + (o.hurt ?? 0.55), o.after ?? 1);
    H.hit(tNum, o.big ? 1.6 : 1);
    const showT = o.show ?? 1.1;
    TL.add({
      t0: tHit, t1: tHit + 0.5, z: 55,
      draw(ctx, emi, t, S) { D.slash(ctx, emi, S.und.x + 4, S.und.y - 150, (t - tHit) / 0.5, { len: 150 }); },
    });
    TL.add({
      t0: tNum, t1: tNum + showT, z: 56,
      draw(ctx, emi, t, S) {
        const u = t - tNum, out = U.clamp((tNum + showT - t) / 0.2);
        const bounce = u < 0.35 ? -Math.abs(Math.sin(u / 0.35 * Math.PI)) * 18 : 0;
        const x = S.und.x, y = S.und.y - 175;
        D.dmg(ctx, String(dmg), x, y + bounce, { align: 'center', color: '#ff2020', alpha: out, glow: emi, glowA: 0.3 });
        const k = U.lerp(hp0, hp1, U.eOut(U.clamp(u / 0.6)));
        D.enemyHp(ctx, x, y + 42, 200, k, out);
      },
    });
  };

  // ---------------------------------------------------------------- misc helpers
  H.flashScreen = (t, k = 1, col) => TL.impact(t, { amp: 0, flash: k, flashCol: col, dur: 0.4 });
  H.shards = (t, x, y, col = '#00c000') => {
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.7;
      TL.add({
        t0: t, t1: t + 1.2, z: 45,
        draw(ctx, emi, tt) {
          const u = tt - t;
          MV.spr(ctx, MV.sil('shard' + i, col), x + Math.cos(a) * 90 * u, y + Math.sin(a) * 90 * u + 220 * u * u, { alpha: 1 - u / 1.2 });
        },
      });
    }
  };

  // ---------------------------------------------------------------- boss pressure
  // radial speed lines (screen space) toward (cx, cy); o: {k, cx, cy, n, col, dir: 'h' for horizontal}
  H.speed = (t0, t1, o = {}) =>
    TL.add({
      t0, t1, z: 75, screen: true,
      draw(ctx, emi, t) {
        const k = (o.k ?? 1) * Math.min(U.clamp((t - t0) / 0.08), U.clamp((t1 - t) / 0.15));
        const cx = o.cx ?? 480, cy = o.cy ?? 270, n = o.n || 56;
        ctx.fillStyle = o.col || '#ffffff';
        for (let i = 0; i < n; i++) {
          const ph = (t * (2.2 + U.hash(i * 3.3) * 2) + U.hash(i * 7.1)) % 1;
          if (o.dir === 'h') {
            const y = U.hash(i * 5.7) * 540, x = (o.flip ? 1 - ph : ph) * 1400 - 220, len = 80 + U.hash(i) * 160;
            ctx.globalAlpha = k * (0.25 + U.hash(i * 2.1) * 0.35);
            ctx.fillRect(Math.round(x), Math.round(y), Math.round(len), 2);
            continue;
          }
          const a = U.hash(i * 1.37) * U.TAU, r = 260 + ph * 420, len = 60 + U.hash(i * 9.3) * 140;
          ctx.save();
          ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.rotate(a);
          ctx.globalAlpha = k * (0.3 + 0.4 * (1 - ph));
          ctx.fillRect(0, -1, Math.round(len), 2 + (i % 3 === 0 ? 1 : 0));
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
    });
  // a big shouted line (screen space): slams in oversized, shakes, red outline
  let shoutSide = 1;
  H.shout = (t0, t1, str, o = {}) => {
    shoutSide = -shoutSide;
    const side = o.side ?? shoutSide;
    if (o.x === undefined) o = Object.assign({}, o, { x: side < 0 ? 196 : 764, y: o.y ?? 150, scale: o.scale ?? 3 });
    H.sfx(t0, 'Slam', o.vol ?? 0.45);
    if (o.hit !== false) H.hit(t0, o.k ?? 0.8);
    return TL.add({
      t0, t1, z: 82, screen: true,
      draw(ctx, emi, t) {
        const u = t - t0, out = U.clamp((t1 - t) / 0.18);
        const sc = (o.scale || 4) + (u < 0.06 ? 3 : u < 0.12 ? 1 : 0);
        const sh = (o.shake ?? 3) * (u < 0.3 ? 2 : 1);
        D.text(ctx, str, o.x ?? 480, (o.y ?? 92) - (sc - (o.scale || 4)) * 8, { scale: sc, align: 'center', alpha: out, color: o.color || '#ffffff', outline: o.outline || '#c00018', shake: sh, seed: Math.floor(t * 30) });
      },
    });
  };
  // the boss cut-in: a slanted band slams across the screen with her face and a line
  H.cutin = (t0, dur, o = {}) => {
    const t1 = t0 + dur;
    H.sfx(t0, 'Slam', 0.55);
    H.sfx(t0 + 0.05, 'EyeFlash', 0.4);
    H.sfx(t0, 'Whoosh', 0.5);
    H.hit(t0, 1.1, { flash: 0.35 });
    return TL.add({
      t0, t1, z: 90, screen: true,
      draw(ctx, emi, t) {
        const inU = U.eOutExpo(U.clamp((t - t0) / 0.14)), outU = U.eInExpo(U.clamp((t - (t1 - 0.14)) / 0.14));
        const off = (1 - inU) * 1100 - outU * 1100;
        const cy = o.y ?? 270, h = o.h || 176, skew = 70;
        ctx.save();
        ctx.translate(Math.round(off), 0);
        // band
        const band = () => { ctx.beginPath(); ctx.moveTo(-200, cy - h / 2 + skew); ctx.lineTo(1160, cy - h / 2 - skew); ctx.lineTo(1160, cy + h / 2 - skew); ctx.lineTo(-200, cy + h / 2 + skew); ctx.closePath(); };
        ctx.fillStyle = '#000000'; band(); ctx.fill();
        ctx.save(); band(); ctx.clip();
        // speed lines inside the band
        ctx.fillStyle = '#1e3a8a';
        for (let i = 0; i < 40; i++) {
          const y = cy - h / 2 - skew + U.hash(i * 3.1) * (h + skew * 2), ph = (t * 3.5 + U.hash(i * 5.3)) % 1;
          ctx.fillRect(Math.round(1200 - ph * 1600), Math.round(y), 120 + Math.round(U.hash(i) * 200), 3);
        }
        // her face, huge
        const head = MV.part('und/head' + (o.head ?? 12)), hs = o.headScale || 6;
        const hx = o.faceX ?? 250, hy = cy - (head.height * hs) / 2 + 20;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(head, hx - (head.width * hs) / 2, hy, head.width * hs, head.height * hs);
        // the burning eye
        const ex = hx - (head.width * hs) / 2 + 12 * hs, ey = hy + 13 * hs, fl = 0.7 + 0.3 * Math.sin(t * 40);
        ctx.fillStyle = '#ff2030'; ctx.globalAlpha = fl; ctx.fillRect(Math.round(ex - 10), Math.round(ey - 10), 20, 20);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(ex - 4), Math.round(ey - 4), 8, 8); ctx.globalAlpha = 1;
        ctx.restore();
        // edges
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; band(); ctx.stroke();
        ctx.strokeStyle = '#ff2030'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-200, cy - h / 2 + skew + 9); ctx.lineTo(1160, cy - h / 2 - skew + 9); ctx.moveTo(-200, cy + h / 2 + skew - 9); ctx.lineTo(1160, cy + h / 2 - skew - 9); ctx.stroke();
        if (o.text) {
          const u = t - t0, sh = u < 0.35 ? 4 : 2;
          D.text(ctx, o.text, o.textX ?? 660, cy - 30 - (o.textX ? 0 : 0), { scale: o.textScale || 4, align: 'center', color: '#ffffff', outline: '#c00018', shake: sh, seed: Math.floor(t * 30) });
        }
        ctx.restore();
      },
    });
  };
  // huge spears tearing across the screen behind the arena (harmless; pure menace)
  H.barrage = (t, n = 3, o = {}) => {
    H.sfx(t, 'Whoosh', o.vol ?? 0.35);
    for (let i = 0; i < n; i++) {
      const seed = t * 13.7 + i * 7.3;
      const ang = (o.ang ?? (U.hash(seed) < 0.5 ? 0.35 : Math.PI - 0.35)) + (U.hash(seed + 1) - 0.5) * 0.5;
      const cx = 480 + (U.hash(seed + 2) - 0.5) * 700, cy = 250 + (U.hash(seed + 3) - 0.5) * 380;
      const L2 = 1500, t0 = t + i * (o.gap ?? 0.05), dur = o.dur ?? 0.32;
      const x0 = cx - Math.cos(ang) * L2 / 2, y0 = cy - Math.sin(ang) * L2 / 2, x1 = cx + Math.cos(ang) * L2 / 2, y1 = cy + Math.sin(ang) * L2 / 2;
      TL.add({
        t0, t1: t0 + dur, z: o.z ?? -200,
        draw(ctx, emi, tt) {
          const u = (tt - t0) / dur, x = U.lerp(x0, x1, u), y = U.lerp(y0, y1, u);
          ctx.save(); ctx.globalAlpha = 0.28; ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 420, y - Math.sin(ang) * 420); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
          D.spear(ctx, emi, x, y, ang, { len: 150, scale: o.scale ?? 2.4, glow: 0.6 });
        },
      });
    }
  };
  // shockwave: two pixel rings + a dust spray
  H.shock = (t, x, y, o = {}) => {
    TL.ring(t, x, y, { r0: 10, r1: o.r || 300, w: 7, dur: 0.5, color: o.color || '#ffffff', z: o.z ?? 44 });
    TL.ring(t + 0.06, x, y, { r0: 6, r1: (o.r || 300) * 0.6, w: 4, dur: 0.45, color: o.color2 || '#5fd8ff', z: o.z ?? 44 });
    if (o.dust !== false) TL.burst(t, { x, y, n: 34, speed: [120, 380], ang: o.ang || [Math.PI, U.TAU], life: [0.25, 0.6], g: 300, colors: ['#ffffff', '#9fe8ff', '#5f7fa8'], size: [2, 4], z: 45 });
  };
  // Undyne moves
  const base = (t) => TL.und.at(t);
  H.lunge = (t, k = 1) => {
    const p = base(t - 0.06);
    TL.und.to(t - 0.06, t + 0.05, { sc: 2 + 0.4 * k, y: p.y + 58 * k, lean: 0.06 * k }, 'outExpo');
    TL.und.to(t + 0.05, t + 0.55, { sc: 2, y: p.y, lean: 0 }, 'inOut');
    H.sfx(t, 'Whoosh', 0.3);
  };
  H.slam = (t, x, o = {}) => {
    H.bigHit(t, { flash: 0.4, dur: 0.55, amp: 14, ...o.fx });
    H.sfx(t, 'Slam', 0.6); H.sfx(t, 'Boom', 0.45);
    H.shock(t, x, MV.LAYOUT.und[1], { r: 340, ang: [Math.PI * 1.05, Math.PI * 1.95] });
    H.boxHit(t + 0.02, 'top', 0.5, 9);
    TL.rumble.to(t, t + 0.02, { v: 9 }, 'lin').to(t + 0.02, t + 0.6, { v: o.rest ?? 0 }, 'out');
  };
  H.leap = (t0, t1, x, h = 220, o = {}) => {
    H.sfx(t0, 'Whoosh', 0.4);
    TL.und.hop(t0, t1, { x }, h, 'y', 'inOut');
    TL.und.to(t0, t0 + 0.1, { ghost: 0.7 }, 'out').to(t1 - 0.05, t1 + 0.3, { ghost: o.ghost ?? 0 }, 'out');
    if (o.slam !== false) H.slam(t1, x, o);
  };
  H.dash = (t0, t1, x) => {
    H.sfx(t0, 'Whoosh', 0.35);
    TL.und.to(t0, t1, { x }, 'outExpo');
    const g = base(t0).ghost;
    TL.und.to(t0, t0 + 0.04, { ghost: 0.9 }, 'out').to(t1, t1 + 0.3, { ghost: g }, 'out');
  };
  // the plunge (B2): she comes for the soul herself. A column of the red box flashes, she
  // springs up out of the picture and drives down through it spear-first, trailing
  // afterimages, and buries the spear in the box floor; then she is gone and drops back home.
  // The column (her body and the spear) is a hazard while she is in it.
  H.plunge = (tHit, x, o = {}) => {
    const home = TL.und.at(tHit - 0.6), hx = o.home ?? home.x, hy = L.und[1];
    const tw = tHit - (o.warn ?? 0.5), tUp = tHit - 0.3, tFall = tHit - 0.12, tGone = tHit + 0.24, sc = o.sc ?? 1.3;
    const HW = 34; // half width of the column she fills
    H.sfx(tw, 'Warning', 0.3); H.sfx(tUp, 'Whoosh', 0.45); H.sfx(tFall, 'SwipeShort', 0.5);
    H.sfx(tHit, 'Slam', 0.6); H.sfx(tHit, 'Boom', 0.35); H.sfx(tHit, 'UndSpearRise', 0.45);
    // at home: the crouch, the spring out of the top of the picture; back after the strike
    TL.und.to(tw, tUp, { lean: -0.06, arm: 1.1 }, 'out');
    TL.und.to(tUp, tFall, { y: hy - 520, ghost: 0.8 }, 'inExpo');
    TL.und.set(tGone, { x: hx, y: hy - 420, arm: 0, lean: 0 }).to(tGone, tGone + 0.2, { y: hy, ghost: o.ghost ?? 0 }, 'outExpo');
    H.punch(tGone + 0.2, 0.5);
    const bodyY = (t, b) => { // her feet: from far above to the floor of the box (the spear tip below)
      const floor = b.y + b.h - 64;
      if (t >= tHit) return floor;
      return U.lerp(-260, floor, U.eIn(U.clamp((t - tFall) / (tHit - tFall))));
    };
    const tipY = (t, b) => Math.min(bodyY(t, b) + 64, b.y + b.h);
    TL.add({
      t0: tw, t1: tGone + 0.05, z: 38, kind: 'white',
      hit(t, sx, sy) { if (t < tFall || t > tGone) return false; const b = TL.box.at(t); return Math.abs(sx - x) < HW + SOUL_R && sy < tipY(t, b) + SOUL_R && sy > b.y - 400; },
      draw(ctx, emi, t, S) {
        const b = S.box;
        if (t < tFall) { // the warning column
          const k = U.clamp((t - tw) / 0.08);
          D.spearWarn(ctx, emi, x - HW, b.y, HW * 2, b.h, t, k * 0.9);
          return;
        }
        const fy = bodyY(t, b), out = t > tGone - 0.06 ? U.clamp((tGone - t) / 0.06) : 1;
        const pose = { head: 12, arm: -0.55, lean: 0, t, scale: sc, glow: 0.4, eye: 1.4 };
        // afterimages up the column
        if (t < tHit + 0.1) for (let k = 4; k >= 1; k--) {
          const yy = bodyY(t - k * 0.022, b);
          D.undyne(ctx, null, x, yy, Object.assign({}, pose, { sil: k % 2 ? '#2a6bff' : '#5fd8ff', alpha: (0.55 - k * 0.1) * out }));
        }
        D.spear(ctx, emi, x + 2, tipY(t, b), Math.PI / 2, { len: 120, scale: 1.3, alpha: out, glow: 0.8 });
        D.undyne(ctx, emi, x, fy, Object.assign({}, pose, { alpha: out, flash: t >= tHit && t < tHit + 0.05 ? 1 : 0 }));
      },
    });
    // the strike: the floor of the box buckles, a shockwave rolls out along it
    const b = TL.box.at(tHit), fl = b.y + b.h;
    H.hit(tHit, 1.2, { dy: 1, flash: 0.25 });
    H.boxHit(tHit, 'bottom', U.clamp((x - b.x) / b.w), 12);
    TL.burst(tHit, { x, y: fl - 4, n: 40, speed: [120, 420], ang: [Math.PI * 1.05, Math.PI * 1.95], life: [0.2, 0.55], g: 500, colors: ['#ffffff', '#9fe8ff', '#5f7fa8'], size: [2, 4], z: 45 });
    TL.ring(tHit, x, fl - 6, { r0: 8, r1: 120, w: 5, dur: 0.3, color: '#ffffff', z: 44 });
    TL.rumble.to(tHit, tHit + 0.02, { v: 6 }, 'lin').to(tHit + 0.02, tHit + 0.5, { v: o.rest ?? 1.6 }, 'out');
  };
  H.roar = (t, str, o = {}) => {
    H.face(t, o.head ?? 12);
    H.face(t + (o.len ?? 1.2), o.after ?? 0);
    const u = TL.und.at(t);
    const [ex, ey] = D.undyneEye(u.x, u.y);
    H.shock(t, ex, ey, { r: 420, dust: false, z: -90 });
    TL.rumble.to(t, t + 0.03, { v: 7 }, 'lin').to(t + 0.03, t + (o.len ?? 1.2), { v: o.rest ?? 1 }, 'out');
    TL.und.to(t, t + 0.03, { eye: 2 }, 'lin').to(t + 0.03, t + 0.6, { eye: o.eye ?? 0.8 }, 'out');
    H.speed(t, t + (o.len ?? 1.2) * 0.8, { k: 0.8, cy: 200 });
    if (str) H.shout(t, t + (o.len ?? 1.2), str, { y: o.y, scale: o.scale, k: 1.2 });
  };
  // a burst of spears down one side in quick succession (the shield holds, sparks pile up)
  H.flurry = (t0, side, n = 4, step = T.s16, o = {}) => { for (let i = 0; i < n; i++) H.green(t0 + i * step, side, Object.assign({ travel: 0.4, hitVol: 0.42 }, o)); };
  // the rush (A2): up to eight spears down one side, accelerating from 8ths into 16ths, each one
  // faster than the last; the last comes heavy from the other side - and is parried back at her
  H.RUSH = [6, 8, 10, 11, 12, 13, 14, 15];
  H.rush = (b, side, o = {}) => {
    const n = o.n ?? 8, slots = H.RUSH.slice(8 - n);
    H.sfx(at(b, 0, slots[0]) - 0.48, 'Warning', 0.22);
    slots.forEach((s, i) => {
      const last = i === slots.length - 1, u = i / (slots.length - 1);
      H.green(at(b, 0, s), last ? OPP[side] : side, {
        travel: U.lerp(o.travel ?? 0.46, 0.32, u), hitVol: last ? 0.62 : i === 0 ? 0.4 : 0, vol: i % 2 ? 0.04 : 0.09,
        heavy: last, deflect: last && o.deflect !== false, stop: last ? 0.05 : 0,
      });
    });
    H.throwArm(at(b, 0, slots[0]) - 0.1, 0.9);
    H.throwArm(at(b, 0, 15) - 0.05, 1.1);
  };
  // red soul: a fence of spears from one wall with one gap at gapX
  H.fence = (tw, tHit, side, gapX, o = {}) => {
    const b = MV.LAYOUT.boxRed, gap = o.gap ?? 40;
    H.sfx(tw, 'UndSpearAppear', 0.3); H.sfx(tHit, 'UndSpearRise', 0.55);
    H.punch(tHit, 0.8, { dy: side === 'b' ? -1 : 1 });
    H.boxHit(tHit, side === 'b' ? 'bottom' : 'top', U.clamp((gapX - b.x) / b.w), 5);
    for (let x = b.x + 18; x <= b.x + b.w - 18; x += o.step || 30) {
      if (Math.abs(x - gapX) < gap) continue;
      H.wallSpear(tw, tHit, side, x, { len: o.len ?? 112, hold: o.hold ?? 0.16, retract: 0.1, sfx: false });
    }
  };
  // red soul: jaws - spears from floor and ceiling at once, the soul threads the middle lane
  H.jaws = (tw, tHit, xs, o = {}) => {
    H.sfx(tw, 'UndSpearAppear', 0.3); H.sfx(tHit, 'UndSpearRise', 0.55); H.sfx(tHit, 'Clang', 0.3);
    H.punch(tHit, 1);
    for (const x of xs) {
      H.wallSpear(tw, tHit, 'b', x, { len: 58, hold: o.hold ?? 0.22, retract: 0.1, sfx: false });
      H.wallSpear(tw, tHit, 't', x, { len: 58, hold: o.hold ?? 0.22, retract: 0.1, sfx: false });
    }
  };
})();
