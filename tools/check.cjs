// Validate choreography: node tools/check.cjs [t0] [t1]
//  * red soul: no spear / beam ever touches it (240 Hz)
//  * green soul: the shield faces every spear the moment it lands, blocks >= 60 ms apart
//  * HP never drops (every attack is dodged or blocked)
//  * every sound effect exists, every character drawn has a glyph
const { chromium, pageUrl, SWIFT } = require('./pw.cjs');
(async () => {
  const argv = process.argv.slice(2);
  const [t0 = '0', t1 = ''] = argv.filter((a) => !a.startsWith('--'));
  const browser = await chromium.launch({ args: SWIFT });
  const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text()); });
  await page.goto(pageUrl('?render=1&w=320&h=180'));
  await page.waitForFunction(() => window.MV && window.MV.ready, null, { timeout: 60000 });
  let bad = 0;
  const report = (list, ok, fail) => { console.log(list.length ? fail(list.length) : ok); for (const h of list.slice(0, 30)) console.log('  ' + JSON.stringify(h)); bad += list.length; };
  report(await page.evaluate(([a, b]) => window.MV.checkHits(+a, b ? +b : window.MV.T.end), [t0, t1]), 'OK: red soul never touched', (n) => `RED SOUL: ${n} collisions`);
  report(await page.evaluate(() => window.MV.checkShield()), 'OK: every spear blocked by the shield', (n) => `SHIELD: ${n} misses`);
  report(await page.evaluate(() => { const o = []; for (let t = 0; t < window.MV.T.end; t += 1 / 30) if (window.MV.TL.hud.at(t).hp < 64) { o.push({ t }); break; } return o; }), 'OK: HP 64 / 64 throughout', () => 'HP dropped');
  const stats = await page.evaluate(() => ({ spears: window.MV.TL.greens.length, blocks: window.MV.TL.shieldHits.length, hazards: window.MV.TL.events.filter((e) => e.hit).length, sfx: window.MV.TL.sfx.length, end: window.MV.T.end }));
  console.log(`   ${stats.spears} green spears, ${stats.hazards} red hazards, ${stats.sfx} sound cues, length ${stats.end.toFixed(2)} s`);
  report(await page.evaluate(() => {
    const MV = window.MV, have = new Set([...Object.keys(window.MV_ASSETS.sfx), ...(window.MV_SYNTH ? window.MV_SYNTH.names : [])]);
    return MV.TL.sfx.filter((e) => !have.has(e.name)).map((e) => ({ name: e.name, t: +e.t.toFixed(2) }));
  }), 'OK: every sound effect exists', (n) => `SOUND: ${n} unknown effects`);
  const fs = require('fs'), path = require('path'), dir = path.resolve(__dirname, '../src');
  const have = await page.evaluate(() => Object.keys(window.MV_GLYPHS));
  const used = new Set();
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.js') && !/^(glyphs|assets|analysis)\.js$/.test(f)) for (const ch of fs.readFileSync(path.join(dir, f), 'utf8').match(/[^\x00-\x7f]/g) || []) used.add(ch);
  const noGlyph = [...used].filter((ch) => !have.includes(ch) && !'♥★←→↑↓◀▶●'.includes(ch) && /\S/.test(ch));
  console.log(noGlyph.length ? `FONT: no glyph for ${noGlyph.join('')} (run tools/fill_glyphs.py)` : 'OK: every character has a glyph');
  bad += noGlyph.length;
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
