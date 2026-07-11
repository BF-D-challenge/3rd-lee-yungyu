import fs from "node:fs";
import path from "node:path";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node analyze-pixel-campfire.mjs <source.scss>");

const root = process.cwd();
const researchDir = path.join(root, "docs/research/pixel-campfire");
const devHtml = path.join(root, "docs/dev/pixel-campfire-analysis.html");
fs.mkdirSync(researchDir, { recursive: true });

const source = fs.readFileSync(sourcePath, "utf8");
fs.writeFileSync(path.join(researchDir, "original.scss"), source);

const parseShadows = (value) => [...value.matchAll(/(-?\d+)px\s+(-?\d+)px\s+rgb\((\d+),\s*(\d+),\s*(\d+)\)/g)].map((match) => ({
  x: Number(match[1]), y: Number(match[2]),
  rgb: [Number(match[3]), Number(match[4]), Number(match[5])],
}));

const staticMatch = source.match(/&::before\s*\{\s*box-shadow:\s*([\s\S]*?);\s*\}/);
const keyframesMatch = source.match(/@keyframes\s+animate\s*\{([\s\S]*)\}\s*$/);
if (!staticMatch || !keyframesMatch) throw new Error("Expected ::before and @keyframes animate");

const warm = new Set(["189,65,105", "165,120,138", "250,141,124", "124,72,72", "98,59,63"]);
const classify = ({ x, y, rgb }) => {
  const color = rgb.join(",");
  if (x < 248 && y >= 92) return "character_and_armor";
  if (x > 356 && y >= 132) return "wooden_chair";
  if (x >= 230 && x <= 365 && y < 105 && warm.has(color)) return "sparks";
  if (x >= 230 && x <= 365 && y < 185 && warm.has(color)) return "flame";
  if (x >= 235 && x <= 365 && y >= 145 && y < 225) return "logs";
  if (y >= 165 && x >= 170 && x <= 420 && ["101,104,126", "82,84,102", "82,84,101", "80,82,98"].includes(color)) return "ground_light";
  if (y >= 165) return "ground_shadow";
  return "ambient_pixels";
};

const enrich = (pixels) => pixels.map((pixel) => ({ ...pixel, layer: classify(pixel) }));
const staticPixels = enrich(parseShadows(staticMatch[1]));
const frames = {};
for (const match of keyframesMatch[1].matchAll(/(\d+(?:\.\d+)?)%\s*\{\s*box-shadow:\s*([^}]*)\}/g)) {
  frames[match[1]] = enrich(parseShadows(match[2]));
}

const allPixels = [...staticPixels, ...Object.values(frames).flat()];
const orderedFrameKeys = Object.keys(frames).sort((a, b) => Number(a) - Number(b));
const orderedFrames = Object.fromEntries(orderedFrameKeys.map((key) => [key, frames[key]]));
const paletteMap = new Map();
const layerMap = new Map();
for (const pixel of allPixels) {
  const color = pixel.rgb.join(",");
  paletteMap.set(color, (paletteMap.get(color) || 0) + 1);
  layerMap.set(pixel.layer, (layerMap.get(pixel.layer) || 0) + 1);
}
const bounds = {
  minX: Math.min(...allPixels.map((pixel) => pixel.x)),
  maxX: Math.max(...allPixels.map((pixel) => pixel.x)),
  minY: Math.min(...allPixels.map((pixel) => pixel.y)),
  maxY: Math.max(...allPixels.map((pixel) => pixel.y)),
};
const data = {
  schemaVersion: 1,
  source: path.basename(sourcePath),
  pixelSize: 4,
  animation: { durationMs: 500, timing: "steps(1,end)", frameKeys: orderedFrameKeys },
  bounds,
  counts: { static: staticPixels.length, animated: Object.values(frames).reduce((sum, pixels) => sum + pixels.length, 0), total: allPixels.length },
  palette: [...paletteMap].sort((a, b) => b[1] - a[1]).map(([rgb, count]) => ({ rgb: rgb.split(",").map(Number), count })),
  layers: [...layerMap].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
  staticPixels,
  frames: orderedFrames,
};

const requiredLayers = ["character_and_armor", "wooden_chair", "flame", "logs", "ground_light", "ground_shadow"];
const assertions = [
  [data.pixelSize === 4, "pixel grid must remain 4px"],
  [data.counts.static === 2394, `expected 2394 static pixels, got ${data.counts.static}`],
  [data.counts.animated === 3013, `expected 3013 animated pixels, got ${data.counts.animated}`],
  [data.counts.total === 5407, `expected 5407 total coordinates, got ${data.counts.total}`],
  [Object.keys(frames).length === 7, `expected 7 animation frames, got ${Object.keys(frames).length}`],
  [Object.keys(frames).some((key) => key.includes(".")), "decimal keyframe percentages were lost"],
  [requiredLayers.every((name) => data.layers.some((layer) => layer.name === name && layer.count > 0)), "a required visual layer is empty"],
  [allPixels.every(({ x, y }) => x % 4 === 0 && y % 4 === 0), "a coordinate escaped the 4px grid"],
];
const failedAssertions = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failedAssertions.length) throw new Error(`Pixel fidelity validation failed:\n- ${failedAssertions.join("\n- ")}`);
fs.writeFileSync(path.join(researchDir, "pixel-campfire.json"), JSON.stringify(data));

const rules = `# Pixel Campfire Reference\n\n## Purpose\n\nThis folder is the fidelity contract for the campfire artwork. Do not redraw it from memory. Read the JSON and compare against the analysis page before editing the product flow.\n\n## Source facts\n\n- Pixel size: **4px**\n- Static pixels: **${data.counts.static}**\n- Animated-frame pixels: **${data.counts.animated}**\n- Total recorded coordinates: **${data.counts.total}**\n- Bounds: **${bounds.minX},${bounds.minY} → ${bounds.maxX},${bounds.maxY}**\n- Animation: **500ms steps(1,end)**\n- Frames: **${Object.keys(frames).join(", ")}**\n\n## Layer contract\n\n${data.layers.map(({ name, count }) => `- \`${name}\`: ${count} pixels`).join("\n")}\n\n## Non-negotiable implementation rules\n\n1. Preserve the 4px grid or an integer multiple of it.\n2. Never replace the artwork with gradients, blur-built shapes, smooth SVG paths, or a generic flame icon.\n3. Ground light and ground shadow are required layers, not decoration.\n4. Animate by switching pixel frames with \`steps(1,end)\`; do not approximate with smooth scale or sway.\n5. Keep logs, flame, sparks, ground light, chairs, ghosts, and people independently addressable.\n6. Removing a character must be done by layer, never by cutting a rectangular coordinate region.\n7. A golden render must be reviewed at 1x and nearest-neighbour 4x before merging.\n8. Palette changes may remap colors, but coordinates and layer membership stay stable unless the golden render is updated.\n\n## Required golden states\n\n- empty: four chairs and four floating ghosts\n- one-supporter: one seated person and three floating ghosts\n- full: four seated people and no ghosts\n- fading: small flame plus all three dotted flame-size guides\n`;
fs.writeFileSync(path.join(researchDir, "README.md"), rules);

const embedded = JSON.stringify(data).replaceAll("</script>", "<\\/script>");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Campfire Analysis</title><style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#11141c;color:#f5f7fb}*{box-sizing:border-box}body{margin:0}.page{width:min(1200px,calc(100% - 32px));margin:auto;padding:28px 0 50px}h1,h2,p{margin:0}.lead{margin-top:8px;color:#aab2c2}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:20px 0}.stat{padding:12px;border:1px solid #343b49;border-radius:9px;background:#181d27}.stat b{display:block;font-size:20px}.stat span{color:#9da6b6;font-size:11px}.controls{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}.controls label{padding:7px 9px;border:1px solid #3a4352;border-radius:6px;background:#171c25;font-size:11px}.viewer{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{min-width:0;padding:14px;border:1px solid #343b49;border-radius:10px;background:#181d27}.panel h2{font-size:15px}.canvas-wrap{display:grid;place-items:center;max-width:100%;min-height:310px;margin-top:10px;background:#5f6171;overflow:auto}.canvas-wrap canvas{image-rendering:pixelated}.palette{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px}.swatch{width:72px;padding:6px;border-radius:5px;color:#fff;font-size:8px;text-shadow:0 1px #000}.legend{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:12px}.legend div{padding:7px;background:#11151d;font-size:10px}.frame-buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.frame-buttons button{padding:7px 10px;border:1px solid #455064;border-radius:5px;background:#111722;color:#fff}.active{border-color:#e8c56a!important;color:#e8c56a!important}@media(max-width:800px){.viewer{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}
</style></head><body><main class="page"><h1>Pixel Campfire · layer analysis</h1><p class="lead">원본 픽셀을 레이어와 애니메이션 프레임으로 분리해, 구현자가 추측하지 않고 참조하도록 만든 기준 페이지입니다.</p><section class="stats"><div class="stat"><b>${data.counts.total}</b><span>전체 좌표</span></div><div class="stat"><b>${data.counts.static}</b><span>정적 픽셀</span></div><div class="stat"><b>${data.counts.animated}</b><span>프레임 픽셀</span></div><div class="stat"><b>${data.palette.length}</b><span>색상</span></div><div class="stat"><b>4px</b><span>기본 그리드</span></div></section><div class="controls" id="controls"></div><div class="viewer"><section class="panel"><h2>원본 크기 · 1×</h2><div class="frame-buttons" id="frames"></div><div class="canvas-wrap"><canvas id="one"></canvas></div></section><section class="panel"><h2>최근접 확대 · 2×</h2><div class="canvas-wrap"><canvas id="two"></canvas></div></section></div><section class="panel" style="margin-top:12px"><h2>팔레트</h2><div class="palette" id="palette"></div><div class="legend" id="legend"></div></section></main><script>const DATA=${embedded};const activeLayers=new Set(DATA.layers.map(x=>x.name));let frame='static';const controls=document.getElementById('controls'),framesEl=document.getElementById('frames');DATA.layers.forEach(({name,count})=>{const label=document.createElement('label');label.innerHTML='<input type="checkbox" checked> '+name+' · '+count;label.querySelector('input').onchange=e=>{e.target.checked?activeLayers.add(name):activeLayers.delete(name);draw()};controls.append(label)});['static',...DATA.animation.frameKeys].forEach(key=>{const b=document.createElement('button');b.textContent=key==='static'?'static':key+'%';b.onclick=()=>{frame=key;draw()};framesEl.append(b)});const render=(canvas,scale)=>{canvas.width=(DATA.bounds.maxX+4)*scale;canvas.height=(DATA.bounds.maxY+4)*scale;canvas.style.width=canvas.width+'px';canvas.style.height=canvas.height+'px';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const pixels=frame==='static'?DATA.staticPixels:[...DATA.staticPixels,...DATA.frames[frame]];for(const p of pixels){if(!activeLayers.has(p.layer))continue;ctx.fillStyle='rgb('+p.rgb.join(',')+')';ctx.fillRect(p.x*scale,p.y*scale,4*scale,4*scale)}};function draw(){render(document.getElementById('one'),1);render(document.getElementById('two'),2);[...framesEl.children].forEach((b,i)=>b.classList.toggle('active',(i===0&&frame==='static')||b.textContent===frame+'%'))}DATA.palette.forEach(({rgb,count})=>{const s=document.createElement('div');s.className='swatch';s.style.background='rgb('+rgb.join(',')+')';s.textContent=rgb.join(',')+' · '+count;document.getElementById('palette').append(s)});DATA.layers.forEach(x=>{const d=document.createElement('div');d.textContent=x.name+' · '+x.count;document.getElementById('legend').append(d)});draw();</script></body></html>`;
fs.writeFileSync(devHtml, html);
console.log(JSON.stringify({ researchDir, devHtml, counts: data.counts, frames: Object.keys(frames), layers: data.layers }));
