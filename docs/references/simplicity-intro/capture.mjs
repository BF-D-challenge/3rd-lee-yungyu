// toss.im/simplicity 인트로 프레임 단위 캡처
// - 새 탭 생성 → bringToFront(스로틀 방지) → MutationObserver 주입 → navigate
// - 첫 12초 동안 ~300ms 간격 스크린샷 + 스타일 뮤테이션 로그
// Node 22 내장 WebSocket 사용
import { writeFileSync, mkdirSync } from 'fs'

const OUT = process.argv[2] || './toss-intro'
mkdirSync(OUT, { recursive: true })

// 새 탭 생성 (Chrome 최신은 PUT 요구)
const tab = await (await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' })).json()
console.log('tab', tab.id)

const ws = new WebSocket(tab.webSocketDebuggerUrl)
let mid = 0
const pending = new Map()
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++mid
  pending.set(id, { res, rej })
  ws.send(JSON.stringify({ id, method, params }))
})
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id)
    m.error ? rej(new Error(m.error.message)) : res(m.result)
  }
})
await new Promise((r) => ws.addEventListener('open', r))

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

// 탭 활성화 — 백그라운드면 rAF 스로틀로 인트로가 안 돎
await fetch(`http://localhost:9222/json/activate/${tab.id}`)

// MutationObserver: 인트로 동안의 인라인 style/class/childList 변화 기록
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
(() => {
  const t0 = performance.now()
  window.__muts = []
  const sig = (el) => {
    if (!el || !el.tagName) return '?'
    const c = (el.className && typeof el.className === 'string') ? '.' + el.className.split(' ').slice(0,2).join('.') : ''
    return el.tagName.toLowerCase() + c
  }
  const mo = new MutationObserver((list) => {
    const t = Math.round(performance.now() - t0)
    for (const m of list) {
      if (window.__muts.length > 6000) return
      if (m.type === 'attributes') {
        const v = m.target.getAttribute(m.attributeName) || ''
        window.__muts.push([t, 'attr', sig(m.target), m.attributeName, v.slice(0, 220)])
      } else if (m.type === 'childList') {
        window.__muts.push([t, 'child', sig(m.target), m.addedNodes.length + '+/' + m.removedNodes.length + '-',
          [...m.addedNodes].slice(0,2).map(sig).join(',')])
      }
    }
  })
  const start = () => mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class'], childList: true, subtree: true })
  document.documentElement ? start() : document.addEventListener('DOMContentLoaded', start)
})()
` })

console.log('navigating…')
await send('Page.navigate', { url: 'https://toss.im/simplicity' })

// 첫 12초: 300ms 간격 스크린샷 (인트로 프레임)
const t0 = Date.now()
const frames = []
for (let i = 0; i < 40; i++) {
  const el = Date.now() - t0
  try {
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 })
    const name = `f${String(i).padStart(2, '0')}-${el}ms.jpg`
    writeFileSync(`${OUT}/${name}`, Buffer.from(shot.data, 'base64'))
    frames.push(name)
  } catch (e) { console.log('shot fail', e.message) }
  await new Promise((r) => setTimeout(r, 300))
}
console.log('frames', frames.length)

// 뮤테이션 로그 + 인트로 관련 DOM 상태 회수
const muts = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__muts || [])', returnByValue: true })
writeFileSync(`${OUT}/mutations.json`, muts.result.value)

const probe = await send('Runtime.evaluate', { expression: `JSON.stringify({
  title: document.title,
  bodyClass: document.body.className,
  bg: getComputedStyle(document.body).backgroundColor,
  overflow: getComputedStyle(document.documentElement).overflow,
  videos: [...document.querySelectorAll('video')].map(v => ({src: (v.currentSrc||'').slice(-60), playing: !v.paused, w: v.clientWidth})),
  canvases: document.querySelectorAll('canvas').length,
  h1: document.querySelector('h1')?.textContent?.slice(0,80) || null,
})`, returnByValue: true })
writeFileSync(`${OUT}/probe.json`, probe.result.value)
console.log('probe', probe.result.value)
ws.close()
process.exit(0)
