// Supabase .env 검증기 — 키 "값"은 절대 출력하지 않고, 형식/존재/라이브 연결만 확인한다.
// 실행: node scripts/check-supabase.mjs   (Node 18+ 필요, 내장 fetch 사용)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let env = {}
try {
  const raw = readFileSync(join(root, '.env'), 'utf8')
  for (const line of raw.split('\n')) {
    if (/^\s*#/.test(line) || !line.includes('=')) continue
    const i = line.indexOf('=')
    const k = line.slice(0, i).trim()
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (k) env[k] = v
  }
} catch (e) {
  console.log('❌ .env 를 못 읽음:', e.message)
  process.exit(1)
}

const URL_KEYS = ['SUPABASE_URL', 'SUPABASE_PROJECT_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_URL']
const KEY_KEYS = ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY',
                  'SUPABASE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']

console.log('발견된 변수명:', Object.keys(env).join(', ') || '(없음)')

const urlName = URL_KEYS.find(k => env[k])
const keyName = KEY_KEYS.find(k => env[k])
if (!urlName) { console.log('❌ URL 변수 없음. 이런 이름 중 하나 필요:', URL_KEYS.join(' / ')); process.exit(1) }
if (!keyName) { console.log('❌ anon/publishable 키 변수 없음:', KEY_KEYS.join(' / ')); process.exit(1) }

const url = env[urlName].replace(/\/+$/, '')
const key = env[keyName]
let host
try { host = new URL(url).host } catch { console.log('❌ URL 형식 오류:', url); process.exit(1) }

const keyKind = key.startsWith('sb_publishable_') ? 'publishable(모던)'
             : (key.split('.').length === 3 ? 'JWT(anon 레거시)' : '알 수 없음')

console.log(`✔ URL 변수 ${urlName} → https://${host}`)
console.log(`✔ 키 변수 ${keyName} — 형식 ${keyKind}, 길이 ${key.length}자`)
if (!/\.supabase\.co$/.test(host)) console.log('⚠ host 가 *.supabase.co 아님 (셀프호스팅이면 무시)')

// 라이브 핑: 키 값은 헤더로만 보내고 화면엔 출력하지 않음.
// 주의: 새 키 체계(sb_publishable_)에서는 /rest/v1/ 루트가 secret 키만 허용하므로
// publishable 키로는 401 "Secret API key required" 가 정상 응답이다.
// 그래서 auth/v1/settings(publishable·anon 모두 허용) 로 유효성을 판정한다.
try {
  const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
  console.log(`라이브 핑(auth/v1/settings): HTTP ${res.status}`)
  if (res.status === 200) console.log('✅ 연결 성공 — URL·키가 유효하고 프로젝트가 응답합니다.')
  else if (res.status === 401) console.log('❌ 401 Unauthorized — 키가 이 프로젝트와 안 맞음(오타/다른 프로젝트 키).')
  else console.log('⚠ 예상 밖 상태코드 — 프로젝트 일시정지/미기동 여부 확인.')
} catch (e) {
  console.log('❌ 네트워크 오류:', e.message)
  console.log('   → URL 오타이거나, 프로젝트가 일시정지(미기동) 상태일 수 있음.')
}
