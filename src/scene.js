// Frame composition: evaluates the timeline at time t and paints the world,
// emissive (bloom source) and screen-overlay canvases.
(function () {
  const MV = window.MV, U = MV.U, D = MV.D, TL = MV.TL, T = MV.T;
  const L = MV.LAYOUT;
  const R = Math.round;

  // ---------------------------------------------------------------- UI pieces
  D.button = (ctx, emi, i, x, y, o = {}) => {
    const sel = (o.sel || 0) > 0.5;
    ctx.globalAlpha = o.a ?? 1;
    ctx.drawImage(MV.SPR['btn' + i + (sel ? 'h' : '')], R(x), R(y));
    ctx.globalAlpha = 1;
    if (sel) D.soul(ctx, emi, x + 16, y + 21, { col: 'red' });
    if (emi && sel) { emi.globalAlpha = 0.22 * (o.a ?? 1); emi.fillStyle = MV.COL.yellow; emi.fillRect(R(x) - 3, R(y) - 3, L.btnW + 6, L.btnH + 6); emi.globalAlpha = 1; }
  };

  // ---------------------------------------------------------------- state
  MV.state = (t) => {
    const fx = TL.fxAt(t);
    const cam = TL.cam.at(t);
    // auto-framing: her head and the bottom of the arena stay between the letterbox bands
    const sw = TL.safe.at(t).v * (1 - U.clamp(Math.abs(cam.pitch) / 0.15));
    if (sw > 0.001) {
      const u = TL.und.at(t), bx = TL.box.at(t), so = TL.soul.at(t);
      const wTop = u.a > 0.3 ? Math.max(u.y, L.und[1]) - 118 * u.sc - 20 : 40;
      // green: leave room under the box so spears rising from below are seen the whole way in
      const wBot = bx.draw > 0.5 ? bx.y + bx.h + (TL.soulCol.at(t) === 'green' ? 120 : 16) : so.a > 0.5 ? 524 : u.y + 24;
      const sTop = TL.frame.at(t).top + 6, sBot = 540 - TL.frame.at(t).bot - 6;
      const z = Math.min(cam.zoom, (sBot - sTop) / Math.max(40, wBot - wTop));
      const hi = wTop + (270 - sTop) / z, lo = wBot - (sBot - 270) / z;
      const y = lo <= hi ? U.clamp(cam.y, lo, hi) : (lo + hi) / 2;
      cam.zoom = U.lerp(cam.zoom, z, sw); cam.y = U.lerp(cam.y, y, sw);
    }
    cam.x += fx.sx; cam.y += fx.sy;
    // constant rumble under the boss's pressure
    const rv = TL.rumble.at(t).v;
    if (rv > 0.01) { cam.x += U.noise(t * 29) * rv; cam.y += U.noise(t * 33 + 11) * rv; cam.roll += U.noise(t * 9 + 3) * rv * 0.0016; }
    cam.zoom *= 1 + fx.zoom;
    cam.roll += fx.rot;
    const box = TL.box.at(t);
    box.bulge = {};
    for (const h of TL.boxHits) {
      const dt = t - h.t;
      if (dt < 0 || dt > 0.8) continue;
      const k = h.amt * Math.exp(-dt * 9) * Math.cos(dt * 38);
      const q = box.bulge[h.side];
      if (!q || Math.abs(k) > Math.abs(q[0])) box.bulge[h.side] = [k, h.u, 0.22];
    }
    // the shield flashes white then red for a moment on each block; the blow pushes the soul
    // back a few px (heavier blocks further) and it springs home, the shield arc dented in
    let sh = 0, dent = 0;
    const soul = TL.soul.at(t);
    for (const h of TL.shieldHits) {
      const dt = t - h.t;
      if (dt < 0 || dt > 0.4) continue;
      if (dt < 0.12) sh = Math.max(sh, dt < 0.04 ? 1 : 0.4);
      const v = MV.H.SIDE[h.side], k = (h.heavy ? 4.5 : 2.2) * Math.exp(-dt * 15) * Math.cos(dt * 40);
      soul.x -= v[0] * k; soul.y -= v[1] * k;
      dent = Math.max(dent, (h.heavy ? 1 : 0.6) * Math.exp(-dt * 20));
    }
    return {
      t, fx, cam, box,
      soul,
      soulCol: TL.soulCol.at(t),
      aura: TL.aura.at(t).v,
      shield: Object.assign(TL.shield.at(t), { hit: sh, dent }),
      und: TL.und.at(t), show: TL.uShow.at(t), head: TL.head.at(t), melt: TL.melt.at(t),
      shadow: TL.shadow.at(t), rage: TL.rage.at(t).v,
      boss: TL.boss.at(t), bossName: TL.bossName.at(t), frame: TL.frame.at(t),
      hud: TL.hud.at(t),
      btn: TL.btn.map((b) => b.at(t)),
      bg: TL.bg.at(t),
      post: TL.post.at(t),
    };
  };

  // ---------------------------------------------------------------- scene
  MV.Scene = class {
    constructor() {
      const W = MV.VW + MV.PADX * 2, H = MV.VH + MV.PADY * 2;
      [this.world, this.ctx] = D.tmp(W, H);
      [this.emiC, this.emi] = D.tmp(W, H);
      [this.glowA, this.gA] = D.tmp(W >> 2, H >> 2);
      [this.glowB, this.gB] = D.tmp(W >> 3, H >> 3);
      [this.screen, this.sctx] = D.tmp(MV.SW, MV.SH);
      [this.undC, this.uctx] = D.tmp(W, H); // the standing layer (see post.js)
      this.W = W; this.H = H;
    }
    render(t) {
      const { ctx, emi, sctx } = this;
      const S = (this.S = MV.state(t));
      for (const c of [ctx, emi]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, this.W, this.H);
        c.setTransform(1, 0, 0, 1, MV.PADX, MV.PADY);
        c.imageSmoothingEnabled = false;
        c.globalAlpha = 1;
      }
      sctx.clearRect(0, 0, MV.SW, MV.SH);
      const evs = TL.active(t);
      // when the camera tips the arena into a floor, Undyne (and what belongs to her) moves to
      // the standing layer so she stays upright
      S.stand = Math.abs(S.cam.pitch) > 0.02 && S.und.a > 0.001;
      const layer = (z0, z1, filter) => {
        for (const e of evs) if (e.z >= z0 && e.z < z1 && !e.screen && !(S.stand && e.und) && (!filter || filter(e))) e.draw(ctx, emi, t, S);
      };
      const bg = S.bg;
      if (bg.cav > 0.001) D.cavern(ctx, emi, t, { a: bg.cav, rain: bg.rain, drift: bg.drift, ceiling: bg.ceiling, k: bg.k });
      // the floor grid of the low 3D view: lines scroll toward the camera on the beat
      if (bg.grid > 0.001) {
        const sc = ((t - T.off) / T.beat) % 1, k = bg.grid;
        for (let x = -240; x <= 1200; x += 48) D.rect(ctx, x, -135, 2, 810, '#1e4a8a', 0.55 * k);
        for (let i = -4; i < 20; i++) { const y = -135 + (i + sc) * 48; D.rect(ctx, -240, y, 1440, 2, '#1e4a8a', 0.55 * k); if (emi) D.rect(emi, -240, y - 1, 1440, 4, '#2a6bff', 0.12 * k); }
      }
      this.drawShadow(S, t);
      layer(-1000, -100); // backdrops
      if (S.stand) {
        const u = this.uctx;
        u.setTransform(1, 0, 0, 1, 0, 0); u.clearRect(0, 0, this.W, this.H);
        u.setTransform(1, 0, 0, 1, MV.PADX, MV.PADY); u.imageSmoothingEnabled = false;
        const keep = [this.ctx, this.emi];
        this.ctx = u; this.emi = null;
        for (const e of evs) if (e.und && e.z < -100) e.draw(u, null, t, S);
        this.drawUndyne(S, t);
        for (const e of evs) if (e.und && e.z >= -100) e.draw(u, null, t, S);
        [this.ctx, this.emi] = keep;
      } else this.drawUndyne(S, t);
      layer(-100, 0);
      if (bg.flowers > 0.001) D.flowers(ctx, emi, 424, t, bg.flowers);
      // arena
      const b = S.box;
      if (b.fill > 0 && b.draw > 0) D.rect(ctx, b.x, b.y, b.w, b.h, '#000', b.fill * Math.min(1, b.draw * 1.5));
      D.clipRect(ctx, b.x, b.y, b.w, b.h);
      D.clipRect(emi, b.x - 40, b.y - 40, b.w + 80, b.h + 80);
      layer(0, 10, (e) => e.clip === 'box');
      ctx.restore(); emi.restore();
      D.box(ctx, emi, b);
      D.cracks(ctx, emi, b, S.boss.crack, t);
      D.posture(ctx, emi, b, S.boss, t);
      layer(0, 40, (e) => e.clip !== 'box');
      this.drawSoul(S, t);
      layer(40, 1000);
      this.drawFrame(S, t);
      D.bossHud(sctx, S, t);
      for (const e of evs) if (e.screen) e.draw(sctx, null, t, S);
      // bloom sources: quarter + eighth resolution blurs
      const { gA, gB } = this;
      gA.setTransform(1, 0, 0, 1, 0, 0); gB.setTransform(1, 0, 0, 1, 0, 0);
      gA.clearRect(0, 0, this.glowA.width, this.glowA.height);
      gB.clearRect(0, 0, this.glowB.width, this.glowB.height);
      gA.imageSmoothingEnabled = gB.imageSmoothingEnabled = true;
      gA.filter = 'blur(2px)';
      gA.drawImage(this.emiC, 0, 0, this.glowA.width, this.glowA.height);
      gA.filter = 'none';
      gB.filter = 'blur(3px)';
      gB.drawImage(this.emiC, 0, 0, this.glowB.width, this.glowB.height);
      gB.filter = 'none';
      return S;
    }
    // her giant shadow looming behind the arena, the eye burning red
    drawShadow(S, t) {
      const { ctx, emi } = this, sh = S.shadow;
      if (sh.a <= 0.001) return;
      const beatPh = (t - T.off) / T.beat;
      const breathe = (1 - Math.abs(Math.sin(beatPh * Math.PI * 0.5))) * 2;
      const o = { head: S.head, arm: S.und.arm * 0.6, t, melt: S.melt, scale: sh.sc, breathe, sil: '#0a1838', alpha: sh.a * 0.7, glow: 0, eye: 0 };
      D.undyne(ctx, null, sh.x, sh.y, o);
      if (sh.eye > 0.01 && !S.melt) {
        const [ex, ey] = D.undyneEye(sh.x, sh.y, { scale: sh.sc, breathe });
        D.eyeGlow(ctx, emi, ex, ey, sh.a * sh.eye, t, sh.sc / 2);
      }
    }
    drawUndyne(S, t) {
      const { ctx, emi } = this;
      const u = S.und;
      if (u.a <= 0.001) return;
      if (S.rage > 0.01) D.rage(ctx, emi, u.x, u.y, u.sc, t, S.rage * u.a);
      const sh = u.shake || 0;
      const jx = sh ? R(U.noise(t * 47) * sh) : 0, jy = sh ? R(U.noise(t * 53 + 7) * sh * 0.6) : 0;
      // breathing on the beat (half time), the hair burning on its own clock
      const beatPh = (t - T.off) / T.beat;
      const breathe = u.breathe * (1 - Math.abs(Math.sin(beatPh * Math.PI * 0.5))) * 2;
      const o = {
        head: S.head, arm: u.arm, armL: u.armL, lean: u.lean, breathe, t, melt: S.melt,
        alpha: u.a, scale: u.sc, glow: u.glow, flash: u.flash, drip: u.drip, eye: u.eye, show: S.show, cut: u.cut, vox: u.vox, vyaw: u.vyaw,
        sil: u.sil > 0.5 ? '#000000' : null,
      };
      if (u.ghost > 0.01)
        for (let k = 3; k >= 1; k--) {
          const p = TL.und.at(t - k * 0.04);
          D.undyne(ctx, null, p.x + jx, p.y + jy, Object.assign({}, o, { sil: k % 2 ? '#2a6bff' : '#5fd8ff', alpha: u.ghost * (0.5 - k * 0.12) * u.a, glow: 0, eye: 0 }));
        }
      D.undyne(ctx, emi, u.x + jx, u.y + jy, o);
      // Sekiro's deathblow mark on her chest once her posture breaks
      if (S.boss.mark > 0.01) { const [mx, my] = D.undynePt(u.x + jx, u.y + jy, 52, 70, u.sc); D.deathMark(ctx, emi, mx, my, S.boss.mark, t); }
    }
    // the letterbox bands, and the player's HUD laid out in the bottom one (screen space:
    // the camera never crops it)
    drawFrame(S, t) {
      const c = this.sctx, f = S.frame;
      if (f.top > 0.5) D.rect(c, 0, 0, 960, f.top, '#000000', 1);
      if (f.bot > 0.5) D.rect(c, 0, 540 - f.bot, 960, f.bot, '#000000', 1);
      if (f.top > 0.5) D.rect(c, 0, f.top - 1, 960, 1, '#1a2a48', 1);
      if (f.bot > 0.5) D.rect(c, 0, 540 - f.bot, 960, 1, '#1a2a48', 1);
      const h = S.hud, y0 = 540 - f.bot;
      if (f.bot < 20) return;
      const y = y0 + 25;
      if (h.a > 0.001) {
        const jit = h.jit || 0;
        D.hud(c, 'FRISK', 22, y, { alpha: h.a, shake: jit, seed: t * 60 });
        D.hud(c, 'LV 12', 114, y, { alpha: h.a, shake: jit, seed: t * 61 });
        c.globalAlpha = h.a; c.drawImage(MV.SPR.hpLabel, 196, y); c.globalAlpha = 1;
        D.hpBar(c, 226, y - 2, h.hp, 64, h.a);
        D.hud(c, String(R(h.hp)) + ' / 64', 316, y, { alpha: h.a, shake: jit, seed: t * 62 });
      }
      for (let i = 0; i < 4; i++) {
        const bs = S.btn[i];
        if (bs.a <= 0.001) continue;
        c.save();
        c.translate(446 + i * 128 + (bs.dx || 0), y0 + 13 + (bs.dy || 0) * 0.5);
        c.scale(0.8, 0.8);
        D.button(c, null, i, 0, 0, { a: bs.a, sel: bs.sel });
        c.restore();
      }
    }
    drawSoul(S, t) {
      const { ctx, emi } = this;
      const s = S.soul;
      if (s.a <= 0.001) return;
      const col = S.soulCol;
      const p1 = TL.soul.at(t - 1 / 60);
      const sp = Math.hypot(s.x - p1.x, s.y - p1.y) * 60;
      const trail = U.clamp((sp - 150) / 600) * s.a;
      if (trail > 0.02) {
        for (let k = 5; k >= 1; k--) {
          const p = TL.soul.at(t - k * 0.014);
          MV.spr(ctx, MV.sil('soul_' + col, col === 'green' ? '#80ff90' : '#ff6070'), p.x, p.y, { rot: p.rot, scale: p.sc, alpha: trail * (0.55 - k * 0.09) });
        }
      }
      if (col === 'green' && S.shield.a > 0.001) D.shield(ctx, emi, s.x, s.y, S.shield.dir, { alpha: S.shield.a * s.a, hit: S.shield.hit, ring: S.shield.ring, dent: S.shield.dent });
      D.soul(ctx, emi, s.x, s.y, { col, rot: s.rot, scale: s.sc, sq: s.sq, alpha: s.a, aura: S.aura, t });
    }
  };
})();
