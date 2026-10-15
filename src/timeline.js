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
  TL.und = new Track({ x: L.und[0], y: L.und[1], a: 0, sc: 2, arm: 0, armL: 0, lean: 0, breathe: 1, glow: 0.12, flash: 0, drip: 0, eye: 0, shake: 0, sil: 0, ghost: 0, cut: 0 });
  TL.uShow = new Track({ hair: 1, legs: 1, cape: 1, torso: 1, armL: 1, spearArm: 1, head: 1 });
  TL.head = new Steps(0);
  TL.melt = new Steps(0);
  TL.hud = new Track({ a: 0, hp: 64, jit: 0 });
  TL.btn = [0, 1, 2, 3].map(() => new Track({ a: 0, sel: 0, dx: 0, dy: 0 }));
  TL.bg = new Track({ cav: 0, rain: 0, drift: 6, ceiling: 0.75, flowers: 0, k: 1 });
  TL.post = new Track({ bloom: 1, vig: 0.35, desat: 0, tint: 0, tintAmt: 0, grid: 0, scan: 0.04, letter: 0, bg: 0, bgHue: 0.6, ca: 0.5, glitch: 0 });
  TL.boxHits = [];
  TL.shieldHits = [];

  // sections register builders; they run after the assets are loaded
  MV.sections = [];
  MV.buildTimeline = () => { MV.sections.forEach((f) => f()); H.buildShield(); };

  // ---------------------------------------------------------------- sound effects
  // {t, name, vol}: played live through WebAudio and mixed into the export
  TL.sfx = [];
  const sfxLast = {};
  const H = (MV.H = {});
  H.sfx = (t, name, vol = 1) => {
    // limiter: one trigger of the same sound per 40 ms
    const k = name + Math.round(t / 0.04);
    if (sfxLast[k]) { sfxLast[k].vol = Math.max(sfxLast[k].vol, vol); return; }
    TL.sfx.push((sfxLast[k] = { t: +t.toFixed(4), name, vol }));
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
  H.ARROW = 1.4; // arrow-spear size (the game's 1x reads too small in the MV's framing)
  H.green = (tHit, side, o = {}) => {
    const kind = o.kind || 'blue', travel = o.travel || 0.62, dist = o.dist || 300;
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
    H.sfx(tHit, 'Block', o.hitVol ?? 0.5);
    TL.shieldHits.push({ t: tHit, side: final });
    TL.burst(tHit, { x: () => TL.soul.at(tHit).x + SIDE[final][0] * stop, y: () => TL.soul.at(tHit).y + SIDE[final][1] * stop, n: 10, speed: [60, 160], life: [0.15, 0.35], colors: kind === 'yel' ? ['#ffff40', '#ffffff'] : ['#5fd8ff', '#ffffff', '#2a6bff'], size: 2, z: 36 });
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
        D.arrow(ctx, emi, kind, p.dir, p.x, p.y, { alpha: fade, scale: H.ARROW });
      },
    });
  };
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
    const hold = o.hold ?? 0.32, len = o.len || 90, warnW = 18;
    const t1 = tHit + hold + 0.12;
    H.sfx(tw, 'UndSpearAppear', 0.18);
    H.sfx(tHit, 'UndSpearRise', o.vol ?? 0.4);
    const geo = (t, S) => {
      const b = S ? S.box : TL.box.at(t);
      const out = t < tHit ? 0 : t < tHit + 0.06 ? U.eOut((t - tHit) / 0.06) : t < tHit + hold ? 1 : 1 - U.clamp((t - tHit - hold) / 0.12);
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
        return perp < SOUL_R + 3;
      },
      draw(ctx, emi, t) {
        if (t < t0) { // a faint line along the flight path
          const k = U.clamp((t - t0 + warn) / warn);
          ctx.globalAlpha = 0.25 * k; ctx.strokeStyle = '#ff4050'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.globalAlpha = 1;
          return;
        }
        const [px, py] = pos(t);
        D.spear(ctx, emi, px, py, ang, { len, color: o.color });
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
        const x = ex + (o.dx ?? 70), y = ey + (o.dy ?? -30);
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
})();
