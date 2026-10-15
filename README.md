# BATTLE AGAINST A TRUE HERO · 像素 MV

基于 UNDERTALE 曲目 *Battle Against a True Hero*（150 BPM）编排的像素演出：不死的安黛因之战。无构建步骤，打开 `index.html` 即可播放，全片 2 分 57.8 秒。

做法沿用 [guiguisocute/mtt-mv-pub](https://github.com/guiguisocute/mtt-mv-pub)（镁塔顿演出战）：Canvas 像素世界 + WebGL 后期，所有画面都是时间的纯函数，按音乐分析出的拍点编舞；导出时用无头 Chromium 逐帧渲染再用 ffmpeg 编码，不用任何视频模型。

叙事：一场**谁也打不倒谁**的战斗。玩家的绿色灵魂用盾挡下她的每一支长矛，红色灵魂躲开每一次突刺（HP 全程 64 / 64）；她每吃一刀都笑着站起来，直到最后一个和弦。开场和结尾都没有音乐：开场她替孩子挡下一刀、开始融化、拒绝倒下；结尾她化作尘埃。

## 本地播放

```sh
node tools/serve.cjs                 # http://127.0.0.1:4173
```

也可以直接用浏览器打开 `index.html`（`file://` 即可）。

- `空格` / `Z`：播放 / 暂停
- `←` `→`：快退 / 快进 2 秒（按住 Shift 为 1 小节）
- `D`：显示时间 / 小节 / 段落
- 点击底部进度条跳转
- URL 参数：`?t=40` 从 40 秒开始；`?lat=0.03` 调整画面与声音的延迟校准

## 导出成片

需要 Node、ffmpeg，以及 Playwright Chromium：

```sh
npm install playwright
npx playwright install chromium
node tools/render.cjs --gpu --vcodec=h264_nvenc --workers=2   # 有 N 卡
node tools/render.cjs --workers=4                             # 纯 CPU（SwiftShader，较慢）
# → dist/mv_1080p60.mp4（1920×1080 60fps，已混入音效）
```

其余参数（`--fps --w --h`、`--t0 / --t1`、`--frames=dist/frames`、`--audio-only`、`--limit`）见 `tools/render.cjs` 文件头。

## 规则

- **绿色灵魂**：长矛从上下左右四个方向飞来，盾必须在长矛落地的那一刻正对它（`tools/check.cjs` 逐支校验）。黄色长矛先从一侧逼近，再绕到背后从反方向刺来。
- **红色灵魂**：先定灵魂的路线，再沿路线布置长矛 / 光束；240 Hz 逐帧检测，没有任何一次接触。
- 长矛的落点跟着鼓点：反拍的拍手（第 2、6、10、14 个 16 分位）+ 旋律重音；方向跟着旋律：音往上走从上方来，往下走从下方来，平行则左右交替。
- 一个画面一个机位，镜头只在乐句边界上大幅移动；场景切换都由音乐的过门（fill）带过去。

## 三幕结构

| 幕 | 视频时间 | 声音 | 内容 |
| --- | --- | --- | --- |
| 一 · 挡下 | 0 – 9 s | 静默，只有音效 | 瀑布的桥上，她替孩子挡下一刀 → 开始融化 →「我还不能倒下！」→ 心跳、白光吞没画面 |
| 二 · 不死 | 9 – 165.8 s | 全曲 98 小节 | 见下方分镜 |
| 三 · 尘埃 | 165.8 – 177.8 s | 静默 | 最后的话 → 由上而下化作尘埃 →「* 她坚持到了最后一刻。」 |

## 分镜（第二幕）

| 小节 | 段落 | 画面 |
| --- | --- | --- |
| 0–3 | 独奏 riff | 黑暗中只有她燃烧的眼睛；身体在 riff 的 3-3-3-3-4 重音上逐块亮起（头、头发、躯干、手臂、长矛、披风、双腿），镜头从眼睛一路拉远；3「不死的安黛因」 |
| 4–6 | 贝斯进入 | 战斗框一笔画出，HUD 与按钮逐拍落下；「只要你还是绿色的，就别想逃！」 |
| 7–10 | 第一批长矛 | 灵魂变绿，盾出现；长矛按四分音符飞来，10 第一支黄矛 |
| 11 | 鼓过门 | 四支长矛按 16 分音符从四面来，盾转一整圈 |
| 12–19 | 全乐队 | 盾牌游戏：反拍 + 旋律重音，方向跟旋律走 |
| 20–26 | 副旋律 | 镜头推近、慢慢侧倾，更密，残影 |
| 27 | **第一回合** | 战斗 → 一刀 → 2475 → 她大笑「就这样？」 |
| 28–31 | 主题 · 红 | 灵魂变红、框撑开：长矛按旋律从地板 / 天花板刺出，灵魂每小节换一条上下通道 |
| 32–35 | 矛雨 | 灵魂横扫整个框，长矛贴着它两侧落下 |
| 36–39 | 矛环 | 八支长矛围住灵魂再收拢，灵魂从缝隙里滑出；随后两道横扫 |
| 40–43 | 独眼光束 | 光束按拍子交替两行，最后一切一起来 |
| 44–51 | 主题再现 · 绿 | 镜头把战场倾斜成 3D，她的长矛挥砍弧光在强拍上闪过身后 |
| 52–55 | 世界翻转 | 每小节整个画面转 90° |
| 56–58 | 高潮 | 更近、更热 |
| 59 | **第二回合** | 3864，脸裂开，身体开始融化 |
| 60–71 | 间奏 | 鼓点消失，HUD 退场：瀑布的水晶穹顶、落水、回音花；她在融化，依次念出「艾斯戈尔……艾菲斯……帕派瑞斯……大家都在指望着我。」回音花重复这些名字；71 四声心跳 |
| 72–79 | 终章 · 绿 | 她重新凝聚：「来吧！！」最密的盾牌风暴 |
| 80–87 | 终章 · 红 | 地刺、矛雨、矛环、光束、横扫全部再来一遍 |
| 88–93 | 终章 · 绿 | 最后的风暴，92–93 世界再转 |
| 94–95 | 矛阵 | 十二支长矛围住灵魂；95 的鼓过门里按 16 分音符逐支刺入，盾牌转了三圈 |
| 96 | 最后一击 | 最后一个和弦上一刀落下：11960，血条清空；她融化，但没有倒下 |

## 音乐分析

`tools/analyze_music.py`（librosa）把分析结果写入 `src/analysis.js`。

| 项目 | 结果 |
| --- | --- |
| 速度 | **150 BPM 全曲恒定**，一拍 0.4 s，一小节 1.6 s |
| 首拍 | 0.002 s |
| 长度 | 156.8 s = 98 小节（最后一击在第 96 小节，之后余音） |
| 段落 | 0–3 独奏 riff · 4–10 贝斯 · 11 过门 · 12–27 全乐队 · 28–43 / 44–59 主题 ×2 · 60–71 间奏 · 72–95 终章（8+8+8）· 96 收尾 |

`src/analysis.js` 提供逐 16 分的 `kick / snare / hat / tone` 强度、旋律音高 `lead`、逐拍低音 `bass`，供长矛落点、方向和镜头冲击取用。

## 代码结构

```
index.html                 播放器
music.mp3                  Battle Against a True Hero
asset/                     素材源文件：安黛因精灵表、战斗 UI、音效（tools/import_assets.py 打包）
src/analysis.js            音乐分析结果（生成）
src/assets.js              图片与音效（生成：tools/import_assets.py；含部件在身体上的位置）
src/glyphs.js              16px 点阵字（宋体 + Unifont 补字：tools/fill_glyphs.py）
src/util.js                时间：T.pre = 9 s 序幕，T.at(小节, 拍, 16分)，T.tail = 12 s 尾声
src/engine.js              无状态关键帧轨道 / 事件 / 冲击 / 粒子
src/sprites.js draw.js     精灵、安黛因部件骨架、长矛、盾、瀑布背景、刀光
src/scene.js post.js       画面合成、HUD；WebGL 3D 相机与后期
src/timeline.js            编舞工具：绿魂长矛 + 自动转盾、红魂地刺 / 飞矛 / 矛环 / 光束、对白、战斗回合
src/tl_prologue.js         第一幕：挡下（静默）
src/tl_awaken.js           0–11
src/tl_shield.js           12–27（含长矛生成器）
src/tl_spears.js           28–59
src/tl_bridge.js           60–71
src/tl_finale.js           72–97
src/tl_epilogue.js         第三幕：尘埃（静默）
src/synth.js               程序化音效（心跳、水滴、低频轰鸣、说话音等）
src/main.js                播放器、音效调度、导出 API
tools/render.cjs           导出：逐帧渲染 + 混音 + 编码
tools/check.cjs            校验：红魂零接触 / 盾挡下每一支长矛 / HP 不减 / 音效与字形齐全
```

## 工具

```bash
python3 tools/analyze_music.py                       # music.mp3 -> src/analysis.js
python3 tools/import_assets.py                       # asset/ -> src/assets.js（预览：work/assets_preview.png）
python3 tools/fill_glyphs.py                         # 新增中文后补字
node tools/check.cjs                                 # 全片校验
node tools/frames.cjs work/f 12.5 40.3 --bars        # 按小节渲染若干帧（不加 --bars 则为秒）
python3 tools/sheet.py out.png 4 work/f/*.png        # 拼成联系表
node tools/render.cjs                                # 导出成片
```

## 素材来源与许可

- 安黛因精灵表、战斗 UI、音效与原曲 *Battle Against a True Hero* 的版权归 Toby Fox / UNDERTALE 所有；精灵表与部分音效取自 [xFN10x/True-Hero-Simulator](https://github.com/xFN10x/True-Hero-Simulator)，战斗 UI 与其余音效取自 mtt-mv-pub 的打包资源。本项目为非商业同人作品，MIT 不覆盖这些素材。
- 引擎、后期、导出与工具改编自 [guiguisocute/mtt-mv-pub](https://github.com/guiguisocute/mtt-mv-pub)（MIT）；本仓库代码同样以 [MIT](LICENSE) 授权。
