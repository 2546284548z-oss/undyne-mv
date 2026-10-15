// Procedural sound effects: reverse swells, whooshes, a glitch stutter, water drips,
// a heartbeat, a sub boom, text blips, a shimmer and a rumble. Deterministic (seeded noise), shared by the
// live player (WebAudio buffers) and tools/render.cjs.
(function (root) {
  const TAU = Math.PI * 2;
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
    };
  };
  // RBJ biquad; set() may be called every sample for sweeps
  const biquad = (sr) => {
    let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const f = {
      set(type, fc, q = 0.707) {
        const w = (TAU * Math.min(fc, sr * 0.45)) / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q);
        let c0, c1, c2;
        if (type === 'lp') { c0 = (1 - cw) / 2; c1 = 1 - cw; c2 = c0; }
        else if (type === 'hp') { c0 = (1 + cw) / 2; c1 = -(1 + cw); c2 = c0; }
        else { c0 = al; c1 = 0; c2 = -al; } // band-pass, 0 dB peak
        const a0 = 1 + al;
        b0 = c0 / a0; b1 = c1 / a0; b2 = c2 / a0; a1 = (-2 * cw) / a0; a2 = (1 - al) / a0;
        return f;
      },
      run(x) { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; },
    };
    return f;
  };
  const finish = (o, sr, peak) => {
    let m = 0;
    for (let i = 0; i < o.length; i++) m = Math.max(m, Math.abs(o[i]));
    const n = Math.min(o.length, Math.round(sr * 0.006)); // de-click the tail
    for (let i = 0; i < o.length; i++) o[i] *= (m > 0 ? peak / m : 0) * (i >= o.length - n ? (o.length - 1 - i) / n : 1);
    return o;
  };
  const buf = (sr, sec) => new Float32Array(Math.round(sr * sec));

  const LEN = { Whoosh: 0.42, Swell: 1.0, SwellShort: 0.5, Glitch: 0.26 };
  const SOUNDS = {
    // air pass-by: noise through a band-pass sweeping up
    Whoosh(sr) {
      const o = buf(sr, LEN.Whoosh), nz = rng(47), bp = biquad(sr), hp = biquad(sr).set('hp', 250);
      for (let i = 0; i < o.length; i++) {
        const u = i / o.length;
        bp.set('bp', 450 * Math.pow(9, u), 1.1);
        o[i] = hp.run(bp.run(nz())) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 2);
      }
      return finish(o, sr, 0.8);
    },
    // reverse cymbal: rises to the downbeat and stops dead on it (schedule at tHit - LEN)
    Swell(sr) { return swell(sr, LEN.Swell, 53); },
    SwellShort(sr) { return swell(sr, LEN.SwellShort, 59); },
    // digital stutter: sample-and-hold noise and square blips, chopped into 16 ms grains
    Glitch(sr) {
      const o = buf(sr, LEN.Glitch), nz = rng(97), g = Math.round(sr * 0.016);
      let hold = 0, rate = 1, f = 200, on = 1;
      for (let i = 0; i < o.length; i++) {
        if (i % g === 0) { rate = 2 + Math.floor((nz() + 1) * 20); f = 90 + (nz() + 1) * 500; on = nz() > -0.45 ? 1 : 0; }
        if (i % rate === 0) hold = nz();
        const sq = Math.sin((TAU * f * i) / sr) > 0 ? 1 : -1;
        o[i] = on * (hold * 0.6 + sq * 0.35) * (1 - i / o.length);
      }
      return finish(o, sr, 0.7);
    },
  };
  // ---- hitsound building blocks. env(t, a, d): attack a s, exponential decay rate d
  const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) * d));
  // a sine whose pitch glides f0 -> f1 over g s (phase integrated, so the glide is clean)
  const glide = (sr, f0, f1, g) => { let ph = 0; return (t) => { ph += (TAU * (f1 + (f0 - f1) * Math.exp(-t / g))) / sr; return Math.sin(ph); }; };
  const hit = (sec, seed, peak, fn) => (sr) => {
    const o = buf(sr, sec), nz = rng(seed);
    fn(o, sr, nz);
    return finish(o, sr, peak);
  };
  Object.assign(SOUNDS, {
    // a water drop: a short sine that slides up, the plip of Waterfall
    Drip: hit(0.22, 11, 0.6, (o, sr) => {
      const g = glide(sr, 700, 1900, 0.02);
      for (let i = 0; i < o.length; i++) { const t = i / sr; o[i] = g(t) * env(t, 0.001, 26); }
    }),
    // a heartbeat: two low thumps (lub-dub)
    Heartbeat: hit(0.6, 13, 0.9, (o, sr, nz) => {
      const lp = biquad(sr).set('lp', 160), b1 = glide(sr, 90, 48, 0.04), b2 = glide(sr, 80, 44, 0.04);
      for (let i = 0; i < o.length; i++) {
        const t = i / sr, t2 = t - 0.2;
        o[i] = b1(t) * env(t, 0.004, 14) + (t2 > 0 ? b2(t2) * env(t2, 0.004, 16) * 0.75 : 0) + lp.run(nz()) * env(t, 0.002, 40) * 0.3;
      }
    }),
    // a deep sub boom for the biggest hits
    Boom: hit(1.4, 17, 0.95, (o, sr, nz) => {
      const lp = biquad(sr).set('lp', 900), b = glide(sr, 120, 34, 0.12);
      for (let i = 0; i < o.length; i++) { const t = i / sr; o[i] = b(t) * env(t, 0.003, 2.6) * 0.9 + lp.run(nz()) * env(t, 0.001, 9) * 0.6; }
    }),
    // Undyne's text voice: a short square blip (the game's voice is a buzzy square)
    Blip: hit(0.06, 19, 0.5, (o, sr) => {
      for (let i = 0; i < o.length; i++) { const t = i / sr; o[i] = (Math.sin(TAU * 330 * t) > 0 ? 1 : -1) * env(t, 0.002, 45) * 0.7; }
    }),
    // narration blip: a softer, higher tick
    Tick: hit(0.04, 23, 0.4, (o, sr) => {
      for (let i = 0; i < o.length; i++) { const t = i / sr; o[i] = Math.sin(TAU * 1250 * t) * env(t, 0.001, 90); }
    }),
    // glassy shimmer for the determination glow
    Shimmer: hit(1.6, 29, 0.55, (o, sr, nz) => {
      const fs = [1318, 1975, 2637, 3135, 3951];
      for (let i = 0; i < o.length; i++) {
        const t = i / sr; let v = 0;
        fs.forEach((f, k) => { v += Math.sin(TAU * f * t + k) * Math.exp(-t * (2 + k)) * (0.5 + 0.5 * Math.sin(TAU * (3 + k) * t)); });
        o[i] = v * Math.min(1, t * 30) * 0.3;
      }
    }),
    // low rumble under the dust and the transformation
    Rumble: hit(2.4, 31, 0.6, (o, sr, nz) => {
      const lp = biquad(sr).set('lp', 120);
      for (let i = 0; i < o.length; i++) { const t = i / sr, u = t / 2.4; o[i] = lp.run(nz()) * 6 * Math.sin(Math.PI * u) ** 2; }
    }),
  });
  function swell(sr, len, seed) {
    const o = buf(sr, len), nz = rng(seed), hp = biquad(sr).set('hp', 2600), bp = biquad(sr);
    for (let i = 0; i < o.length; i++) {
      const u = i / o.length;
      bp.set('bp', 3000 + 6000 * u, 0.9);
      const x = nz();
      o[i] = (hp.run(x) * 0.7 + bp.run(x) * 0.8) * Math.pow(u, 3.2);
    }
    return finish(o, sr, 0.75);
  }

  const cache = {};
  const API = {
    names: Object.keys(SOUNDS),
    has: (name) => Object.prototype.hasOwnProperty.call(SOUNDS, name),
    len: (name) => LEN[name] || 0,
    // mono Float32Array at sample rate sr
    make(name, sr) { const k = name + '@' + sr; return cache[k] || (cache[k] = SOUNDS[name](sr)); },
  };
  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.MV_SYNTH = API;
})(typeof window !== 'undefined' ? window : globalThis);
