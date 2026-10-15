// Sprite/asset layer. Undyne's parts, heads, spears and the prologue frames come
// from the packed sheet in src/assets.js; the soul, buttons, HP label and fonts
// are the original UNDERTALE battle UI.
(function () {
  const MV = window.MV, AS = window.MV_ASSETS, G = window.MV_GLYPHS;

  MV.COL = {
    soulRed: '#ff0000', soulGreen: '#00c000',
    orange: '#ff7f27', yellow: '#ffff40', hpRed: '#ff0000', hpYellow: '#ffff00',
    cyan: '#5fd8ff', blue: '#00a2e8', spear: '#9fe8ff', gold: '#ffd84a',
  };
  const hex6 = (h) => (h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h);
  MV.hex6 = hex6;
  const canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = false;
    return [c, x];
  };
  MV.canvas = canvas;

  // ------------------------------------------------------------ silhouettes / tints
  const silCache = new Map();
  MV.sil = (src, color) => {
    if (typeof src === 'string') src = MV.SPR[src] || MV.IMG[src];
    let m = silCache.get(src);
    if (!m) silCache.set(src, (m = {}));
    if (m[color]) return m[color];
    const [c, x] = canvas(src.width, src.height);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return (m[color] = c);
  };
  // keep only the bright line art (white / light pixels) of a sprite, tinted
  const lineCache = new Map();
  MV.lines = (src, color = '#ffffff') => {
    if (typeof src === 'string') src = MV.SPR[src] || MV.IMG[src];
    let m = lineCache.get(src);
    if (!m) lineCache.set(src, (m = {}));
    if (m[color]) return m[color];
    const [c, x] = canvas(src.width, src.height);
    x.drawImage(src, 0, 0);
    const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex6(color).slice(i, i + 2), 16));
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128 || d[i] + d[i + 1] + d[i + 2] < 300) { d[i + 3] = 0; continue; }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    x.putImageData(id, 0, 0);
    return (m[color] = c);
  };

  // draw a sprite: (x,y) is the anchor; ax/ay anchor fractions; scale = art pixel size
  MV.spr = (ctx, img, x, y, o = {}) => {
    if (typeof img === 'string') img = MV.SPR[img] || MV.IMG[img];
    if (o.color) img = MV.sil(img, o.color);
    const ax = o.ax ?? 0.5, ay = o.ay ?? 0.5, s = o.scale || 1;
    const w = img.width, h = img.height;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.flip ? -1 : 1) * s * (o.sx ?? 1), (o.flipY ? -1 : 1) * s * (o.sy ?? 1));
    ctx.drawImage(img, -Math.round(w * ax), -Math.round(h * ay));
    ctx.restore();
  };

  // uncached tint of a canvas that changes every frame (two slots: world, glow)
  const tintSlots = [null, null];
  MV.tintNow = (src, color, slot = 0) => {
    let t = tintSlots[slot];
    if (!t || t[0].width !== src.width || t[0].height !== src.height) t = tintSlots[slot] = canvas(src.width, src.height);
    const [c, x] = t;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    return c;
  };

  // ------------------------------------------------------------ loading
  const IMG = (MV.IMG = {});
  MV.META = AS.meta;
  MV.SPR = {};
  MV.frame = (obj, anim, i = 0) => {
    const m = AS.meta[obj][anim];
    return IMG[`${obj}/${anim}/${((i % m.n) + m.n) % m.n}`];
  };
  MV.part = (name) => IMG[name];
  MV.RIG_U = AS.rig;
  MV.loadAssets = () =>
    Promise.all(
      Object.entries(AS.img).map(
        ([k, src]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = src; })
      )
    ).then(build);

  function build() {
    const S = MV.SPR;
    // souls: the original heart is white and stored point-right (the game shows it
    // at 90 degrees), so turn it upright once; tint per mode
    const rot90 = (img) => {
      const [c, x] = canvas(img.height, img.width);
      x.translate(img.height, 0);
      x.rotate(Math.PI / 2);
      x.drawImage(img, 0, 0);
      return c;
    };
    const heart = rot90(MV.frame('PlayerHeart', 'Default'));
    S.heart = heart;
    S.soul_red = MV.sil(heart, MV.COL.soulRed);
    S.soul_green = MV.sil(heart, MV.COL.soulGreen);
    S.soul_white = MV.sil(heart, '#ffffff');
    for (let i = 0; i < 4; i++) S['shard' + i] = MV.sil(MV.frame('HeartShard', 'Default', i), '#ffffff');

    // Chinese command buttons built on the original button art (border + icon kept), lettered
    // like the Chinese build: heavy 14x14 glyphs at 2x from x 35, advance 31 (tools/make_font.py)
    const labels = ['战斗', '行动', '物品', '仁慈'], BG = window.MV_BTN_GLYPHS;
    ['UIFight', 'UIAct', 'UIItem', 'UIMercy'].forEach((obj, i) => {
      for (const hl of [false, true]) {
        const src = MV.frame(obj, hl ? 'Highlight' : 'Default');
        const [c, x] = canvas(src.width, src.height);
        x.drawImage(src, 0, 0);
        x.fillStyle = '#000';
        x.fillRect(29, 2, src.width - 31, src.height - 4);
        const col = hl ? MV.COL.yellow : MV.COL.orange;
        let gx = 35;
        for (const ch of labels[i]) {
          const [n, rows] = BG[ch];
          x.fillStyle = col;
          for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) if ((rows[j] >> (n - 1 - k)) & 1) x.fillRect(gx + k * 2, 7 + j * 2, 2, 2);
          gx += 31;
        }
        S[`btn${i}${hl ? 'h' : ''}`] = c;
      }
    });
    S.hpLabel = MV.frame('HP', 'Default');
  }

  // ------------------------------------------------------------ bitmap fonts from the original textures
  const FONTS = {
    battle: { img: 'BattleFont', cw: 6, ch: 6, first: 32 }, // HUD (name, LV, numbers)
    damage: { img: 'DamageFont', cw: 33, ch: 32, first: 32 }, // big numbers
    dialog: { img: 'DefaultFont', cw: 10, ch: 16, first: 32 },
  };
  const fontCache = {};
  MV.fontGlyph = (font, chr, color) => {
    const key = font + chr + color;
    if (fontCache[key]) return fontCache[key];
    const f = FONTS[font];
    const code = chr.toUpperCase && font === 'battle' ? chr.toUpperCase().charCodeAt(0) : chr.charCodeAt(0);
    const idx = code - f.first;
    const img = IMG[f.img];
    const cols = img.width / f.cw;
    const [c, x] = canvas(f.cw, f.ch);
    const sx = (idx % cols) * f.cw, sy = Math.floor(idx / cols) * f.ch;
    x.drawImage(img, sx, sy, f.cw, f.ch, 0, 0, f.cw, f.ch);
    // multiply-tint keeps the black outline of the damage font black
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = color;
    x.fillRect(0, 0, f.cw, f.ch);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(img, sx, sy, f.cw, f.ch, 0, 0, f.cw, f.ch);
    return (fontCache[key] = c);
  };
  MV.FONTS = FONTS;
})();
