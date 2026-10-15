#!/usr/bin/env python3
"""Pack every sprite / font / sound the MV uses into src/assets.js (data URIs),
so the player works from file:// with no loader.

    python3 tools/import_assets.py

Sources (all under asset/):
  * undyne_sheet.png   the UNDERTALE Undyne sheet: Undying parts, heads, melt frames,
                       the normal form's fatal-hit / melt frames, spears and arrows
  * ui/                UNDERTALE battle UI (soul, buttons, HP label, bitmap fonts)
  * sfx_ut/, sfx/      UNDERTALE sound effects (mp3 / wav), re-encoded to mono 96k mp3

Sheet sprites sit on an opaque black backing; the black that touches a sprite's
border is cleared (flood fill), the black inside the line art stays (it occludes).
The Undying melt frames are stored 2x on the sheet and are halved here.
"""
import base64, io, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage

OUT = 'src/assets.js'
SHEET = Image.open('asset/undyne_sheet.png').convert('RGBA')

def crop(x, y, w, h):
    return SHEET.crop((x, y, x + w, y + h))

def clear_outside(img):
    """Transparent everything that is dark and connected to the border."""
    a = np.array(img)
    dark = (a[:, :, 3] < 128) | (a[:, :, :3].sum(2) < 60)
    lab, _ = ndimage.label(dark)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(border))
    a[out] = 0
    return Image.fromarray(a)

def trim(img):
    bb = img.getbbox()
    return img.crop(bb) if bb else img

def half(img):
    return img.resize((img.width // 2, img.height // 2), Image.NEAREST)

def png(img):
    b = io.BytesIO()
    img.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

IMG = {}

# ---------------------------------------------------------------- UNDERTALE battle UI
for f in sorted(os.listdir('asset/ui')):
    key = f[:-4]
    parts = key.split('_')
    if len(parts) == 3:
        key = '/'.join(parts)
    IMG[key] = Image.open('asset/ui/' + f).convert('RGBA')

# ---------------------------------------------------------------- Undyne the Undying
BODY = (5, 1840, 95, 143)
PARTS = {
    'spearArm': (132, 1840, 46, 76),
    'torso': (183, 1840, 79, 58),
    'armL': (267, 1840, 19, 44),
    'cape': (292, 1840, 39, 27),
    'legs': (337, 1840, 40, 42),
}
HEADS = [(7, 2053), (5, 2091), (47, 2091)] + [(7 + 45 * i, 2130) for i in range(6)] + \
        [(5 + 42 * i, 2184) for i in range(5)] + [(7, 2240)]
body = clear_outside(crop(*BODY))
IMG['und/body'] = body
for k, r in PARTS.items():
    IMG['und/' + k] = clear_outside(crop(*r))
for i, (x, y) in enumerate(HEADS):
    IMG[f'und/head{i}'] = clear_outside(crop(x, y, 37, 32))
IMG['und/melt0'] = half(clear_outside(crop(5, 2295, 196, 286)))
IMG['und/melt1'] = half(clear_outside(crop(206, 2295, 196, 286)))
IMG['und/beam'] = trim(crop(5, 2010, 140, 18))

# where each part sits on the composite body: best overlap of the part's white
# line art with the body's white line art
def white(img):
    a = np.array(img)
    return (a[:, :, 3] > 128) & (a[:, :, :3].min(2) > 200)
bw = white(body)
RIG = {}
for k in list(PARTS) + ['head0']:
    pw = white(IMG['und/' + k])
    ph, pwid = pw.shape
    best = None
    for oy in range(-10, bw.shape[0] - ph + 10):
        for ox in range(-10, bw.shape[1] - pwid + 10):
            y0, x0 = max(0, oy), max(0, ox)
            y1, x1 = min(bw.shape[0], oy + ph), min(bw.shape[1], ox + pwid)
            if y1 <= y0 or x1 <= x0:
                continue
            sub = pw[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
            s = (sub & bw[y0:y1, x0:x1]).sum() - 0.5 * (sub & ~bw[y0:y1, x0:x1]).sum()
            if best is None or s > best[0]:
                best = (int(s), ox, oy)
    RIG[k] = [best[1], best[2]]
    print(f'rig {k:9s} at {best[1]:3d},{best[2]:3d}  score {best[0]} / {int(pw.sum())}')

# the ponytail: the sheet's loose hair piece is drawn turned, so take it from the
# composite instead - whatever line art no part covers
cov = np.zeros(bw.shape, bool)
for k in list(PARTS) + ['head0']:
    a = np.array(IMG['und/' + k])[:, :, 3] > 0
    ox, oy = RIG[k]
    for y, x in zip(*np.nonzero(a)):
        if 0 <= oy + y < cov.shape[0] and 0 <= ox + x < cov.shape[1]:
            cov[oy + y, ox + x] = True
hb = np.array(body).copy()
hb[cov] = 0
hair = Image.fromarray(hb)
bb = hair.getbbox()
IMG['und/hair'] = hair.crop(bb)
RIG['hair'] = [bb[0], bb[1]]
print('rig hair      at', bb[:2], 'size', IMG['und/hair'].size)

# ---------------------------------------------------------------- normal Undyne (prologue)
for i, x in enumerate([7, 99, 191, 283, 375, 467, 559, 651, 743, 835]):
    IMG[f'boss/fatal{i}'] = clear_outside(crop(x, 552, 86, 118))
for i, x in enumerate([17, 128, 238, 349]):
    IMG[f'boss/melt{i}'] = clear_outside(crop(x, 694, 86, 120))
IMG['boss/spear'] = clear_outside(crop(5, 23, 47, 71))

# ---------------------------------------------------------------- spears
# arrow-spears: (x, y, w, h) on the sheet; direction = where the point faces
ARROWS = {
    'blue_d': (10, 996, 13, 25), 'blue_u': (39, 997, 13, 25), 'blue_r': (63, 1000, 25, 13), 'blue_l': (98, 1000, 25, 13),
    'red_d': (10, 1031, 13, 25), 'red_u': (39, 1032, 13, 25), 'red_r': (63, 1035, 25, 13), 'red_l': (98, 1035, 25, 13),
    'yel_d': (46, 1063, 12, 22), 'yel_r': (65, 1071, 21, 12), 'yel_l': (98, 1071, 22, 12),
}
for k, r in ARROWS.items():
    IMG['spear/' + k] = clear_outside(crop(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2))
IMG['spear/yel_u'] = IMG['spear/yel_d'].transpose(Image.FLIP_TOP_BOTTOM)
IMG['spear/big_d'] = trim(crop(5, 1095, 20, 80))
IMG['spear/big_u'] = trim(crop(31, 1094, 22, 62))
IMG['spear/big_r'] = trim(crop(58, 1114, 62, 22))
IMG['swing/red'] = trim(crop(28, 848, 271, 121))
IMG['swing/green'] = trim(crop(336, 848, 271, 121))

# ---------------------------------------------------------------- sounds
SFX = {}
def enc(path):
    with tempfile.TemporaryDirectory() as td:
        o = os.path.join(td, 'o.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-af', 'silenceremove=stop_periods=-1:stop_duration=0.15:stop_threshold=-60dB',
                        '-ac', '1', '-ar', '44100', '-b:a', '96k', o], check=True)
        return 'data:audio/mpeg;base64,' + base64.b64encode(open(o, 'rb').read()).decode()
for f in sorted(os.listdir('asset/sfx_ut')):
    SFX[f.rsplit('.', 1)[0]] = enc('asset/sfx_ut/' + f)
WAV = {'snd_spearappear': 'UndSpearAppear', 'snd_spearrise': 'UndSpearRise', 'snd_tempbell': 'Block',
       'snd_arrow': 'UndArrow', 'snd_hurt1': 'Hurt', 'snd_laz': 'Laz', 'snd_break1': 'UndBreak1',
       'snd_break2': 'UndBreak2', 'snd_damage': 'UndDamage', 'snd_hit': 'Hit', 'snd_select': 'UndSelect',
       'snd_saber3': 'UndSaber', 'SND_TXT2': 'UndTxt', 'snd_heal_c': 'Heal'}
for f, k in WAV.items():
    SFX[k] = enc(f'asset/sfx/{f}.wav')

data = dict(img={k: png(v) for k, v in IMG.items()}, sfx=SFX, rig=RIG,
            meta={'PlayerHeart': {'Default': {'n': 1}, 'Split': {'n': 1}}, 'HeartShard': {'Default': {'n': 4}},
                  'UIFight': {'Default': {'n': 1}, 'Highlight': {'n': 1}}, 'UIAct': {'Default': {'n': 1}, 'Highlight': {'n': 1}},
                  'UIItem': {'Default': {'n': 1}, 'Highlight': {'n': 1}}, 'UIMercy': {'Default': {'n': 1}, 'Highlight': {'n': 1}},
                  'HP': {'Default': {'n': 1}}})
with open(OUT, 'w') as f:
    f.write('// Generated by tools/import_assets.py. Packed sprites and SFX. Do not edit.\n')
    f.write('window.MV_ASSETS = ')
    json.dump(data, f, separators=(',', ':'))
    f.write(';\n')
print(f'{len(IMG)} images, {len(SFX)} sounds -> {OUT} ({os.path.getsize(OUT) // 1024} KB)')
os.makedirs('work', exist_ok=True)
sheet = Image.new('RGBA', (1000, 900), (40, 0, 70, 255))
x = y = 4; rowh = 0
for k, v in IMG.items():
    if x + v.width > 996:
        x = 4; y += rowh + 4; rowh = 0
    sheet.alpha_composite(v, (x, y)); x += v.width + 4; rowh = max(rowh, v.height)
sheet.save('work/assets_preview.png')
