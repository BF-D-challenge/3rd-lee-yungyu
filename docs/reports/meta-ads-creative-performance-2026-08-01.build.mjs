// BF.D Meta 광고 성과 보고서 → 인쇄용 HTML 조립 (pdf-report 스킬 Step 3~4)
import fs from 'fs'

const css = fs.readFileSync('style.css', 'utf8')
const b64 = p => 'data:image/jpeg;base64,' + fs.readFileSync(`img_s/${p}.jpg`).toString('base64')

const EXTRA = `
/* 보고서 전용 보강 */
.cover { padding-top: 34mm; }
.kpi.k5 { grid-template-columns: repeat(5, 1fr); }
.kpi .v { font-size: 13.5pt; }
.prow { display: grid; grid-template-columns: 48mm 1fr; margin: 0 0 7pt; }
.prow img { width: 100%; height: 100%; aspect-ratio: 4/5; object-fit: cover;
  object-position: center top; display: block; }
.prow .imglink { display: block; height: 100%; }
.card .body { padding: 7pt 9pt 8pt; }
.card .n { font-size: 11pt; }
.card .s { font-size: 7.6pt; color: #8a8a8f; letter-spacing: .02em; }
.mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3pt; margin: 5pt 0 5pt; }
.mgrid div { background: #f6f6f7; border-radius: 4px; padding: 3.5pt 4pt; }
.mgrid .l { font-size: 6.8pt; color: #777; }
.mgrid .v { font-size: 8.6pt; font-weight: 700; color: #111; }
.card .t { max-height: none; font-size: 8.2pt; line-height: 1.5; color: #333; }
.tag { display: inline-block; font-size: 7pt; font-weight: 700; padding: 1pt 5pt;
  border-radius: 3px; vertical-align: 2px; margin-left: 4pt; }
.tag.g { background: #e7f5ec; color: #0a7d3f; }
.tag.y { background: #fdf3dd; color: #8c5600; }
.tag.n { background: #f0f0f2; color: #777; }
td.num, th.num { text-align: right; }
/* 제목 다음 도입문과 첫 시각물을 한 블록으로 묶어 제목만 남는 페이지를 막는다 */
.blk { page-break-inside: avoid; }
.blk > p:first-child { margin-top: 0; }
table.cmp { font-size: 8.6pt; }
table.cmp th, table.cmp td { padding: 4pt 4pt; white-space: nowrap; }
.share { height: 16px; border-radius: 3px; overflow: hidden; display: flex; margin: 8pt 0 5pt; }
.share i { display: block; height: 100%; }
.share i.a { background: #111; } .share i.b { background: #d8d8dc; }
.legend { font-size: 8.5pt; color: #555; }
.legend b { color: #111; }
.two { gap: 10pt; margin-top: 11pt; }
.legend { margin-bottom: 2pt; }
.foot { font-size: 8pt; color: #777; line-height: 1.6; margin-top: 14pt;
  border-top: 1px solid #e3e3e5; padding-top: 7pt; }
`

const products = [
  {
    key: 'cardbeyond', name: '카드너머', ad: 'AD_CARDBEYOND_TAROT_INVITATION',
    url: 'https://bfd-seven.vercel.app/reserve/story-cards',
    alt: '카드너머 광고 소재: 카드를 건네며 대화를 시작하는 장면',
    tag: ['g', '예약 1건'],
    m: [['지출', '₩37,231'], ['도달', '5,854명'], ['노출', '6,099회'], ['빈도', '1.04회'],
        ['CPM', '₩6,104'], ['랜딩 조회', '90회'], ['노출→조회', '1.48%'], ['예약', '1건']],
    read: '<b>확인된 사실:</b> 랜딩 조회 90회와 실제 광고 예약 1건을 만들었습니다. 조회당 ₩414, 확인된 예약 1건당 광고비는 ₩37,231입니다.',
  },
  {
    key: 'today', name: '오늘 해볼까', ad: 'AD_TODAY_TOMORROW_RESPONSE',
    url: 'https://bfd-seven.vercel.app/reserve/today',
    alt: '오늘 해볼까 광고 소재: 아이디어를 보내고 하루 뒤 반응을 확인하는 장면',
    tag: ['y', '랜딩 16회'],
    m: [['지출', '₩6,833'], ['도달', '1,028명'], ['노출', '1,094회'], ['빈도', '1.06회'],
        ['CPM', '₩6,246'], ['랜딩 조회', '16회'], ['노출→조회', '1.46%'], ['예약', '0건']],
    read: '<b>읽는 법:</b> 조회당 비용 ₩427로 카드너머의 ₩414와 비슷했습니다. 광고가 사람을 데려오는 힘은 비슷했지만, 16명 중 예약 완료는 없었습니다.',
  },
  {
    key: 'matpick', name: '맛핀', ad: 'AD_MATPIN_SAVED_SHORTS',
    url: 'https://bfd-seven.vercel.app/reserve/matpick',
    alt: '맛핀 광고 소재: 저장한 맛집 쇼츠 200개 속에서 고르기 어려운 상황',
    tag: ['n', '데이터 부족'],
    m: [['지출', '₩706'], ['도달', '142명'], ['노출', '151회'], ['빈도', '1.06회'],
        ['CPM', '₩4,675'], ['랜딩 조회', '0회'], ['노출→조회', '0%'], ['예약', '0건']],
    read: '<b>읽는 법:</b> 151회 노출은 광고 이미지의 좋고 나쁨을 판단하기에 너무 적습니다. 0회 조회만으로 실패라고 결론 내리면 안 됩니다.',
  },
  {
    key: 'onebite', name: '한입코치', ad: 'AD_ONEBITE_FRIDGE_COACH',
    url: 'https://bfd-seven.vercel.app/reserve/onebite',
    alt: '한입코치 광고 소재: 늦은 밤 냉장고 앞에서 야식을 고르는 상황',
    tag: ['n', '데이터 부족'],
    m: [['지출', '₩486'], ['도달', '57명'], ['노출', '61회'], ['빈도', '1.07회'],
        ['CPM', '₩7,967'], ['랜딩 조회', '0회'], ['노출→조회', '0%'], ['예약', '0건']],
    read: '<b>읽는 법:</b> 61회 노출은 사실상 예열 수준입니다. 광고 이미지나 제품 아이디어를 평가할 만큼 데이터가 쌓이지 않았습니다.',
  },
]

const card = p => `<div class="card prow">
  <a class="imglink" href="${p.url}"><img src="${b64(p.key)}" alt="${p.alt}" /></a>
  <div class="body">
    <div class="n">${p.name}<span class="tag ${p.tag[0]}">${p.tag[1]}</span></div>
    <div class="s">${p.ad}</div>
    <div class="mgrid">${p.m.map(([l, v]) => `<div><div class="l">${l}</div><div class="v">${v}</div></div>`).join('')}</div>
    <div class="t">${p.read}</div>
    <a class="lk" href="${p.url}">${p.url.replace('https://', '')} — 랜딩 열기</a>
  </div>
</div>`

const kpi = (cls, items) => `<div class="kpi ${cls}">${
  items.map(([l, v]) => `<div><div class="v">${v}</div><div class="l">${l}</div></div>`).join('')}</div>`

const hours = [
  ['20–21시', 4350, 100, true], ['21–22시', 691, 15.89, false], ['22–23시', 960, 22.07, false],
  ['23–24시', 93, 2.14, false], ['00–01시', 1311, 30.14, false],
]

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>BF.D 광고 이미지별 성과 — 2026-08-01</title>
<style>
${css}
${EXTRA}
</style>
</head>
<body>
<div class="cover">
  <h1>5만원 광고 실험,<br />무엇을 배웠을까?</h1>
  <div class="rule"></div>
  <div class="meta">
    BF.D · Meta 광고 테스트 최종 보고서<br />
    캠페인 <b>TR_LPV_IG_KR_W30-39_6H_20260801</b><br />
    대상 대한민국 30~39세 여성 · Instagram Feed / Stories / Reels<br />
    확인 시점 2026-08-02 00:26 KST
  </div>
  <div class="note" style="margin-top:14pt">네 제품의 광고 이미지를 같은 기준으로 비교했습니다. 광고비, 노출, 랜딩 조회, 실제 예약을 한 흐름으로 연결해 정리한 결과입니다. 광고 소재 이미지를 누르면 해당 제품의 예약 랜딩이 열립니다.</div>
</div>

<h2>1. 한눈에 보는 결론</h2>
<div class="lead">카드너머만 실제 예약 1건을 만들었습니다. 다만 카드너머가 전체 광고비의 82.27%를 사용했습니다. ‘예약 신호는 카드너머’, ‘최종 우승자는 아직 없음’이 정확한 결론입니다.</div>
<div class="blk">
<p>오늘 해볼까도 랜딩 조회 비용은 카드너머와 비슷했지만 예약은 없었고, 맛핀과 한입코치는 시험 기회가 너무 적었습니다.</p>
${kpi('k5', [['세전 광고비', '₩45,256'], ['도달', '6,990명'], ['노출', '7,405회'], ['랜딩 조회', '106회'], ['실제 광고 예약', '1건']])}
${kpi('k5', [['평균 빈도', '1.06회'], ['전체 CPM', '₩6,112'], ['노출→랜딩 조회', '1.43%'], ['랜딩 조회 1회 비용', '₩427'], ['조회→예약', '0.94%']])}
</div>

<h2>2. 예산과 남은 금액</h2>
<div class="blk">
<p>광고 관리자 지출은 세전이고, 선불 잔액은 부가세까지 차감된 금액입니다.</p>
${kpi('', [['처음 충전', '₩50,000'], ['세전 광고비', '₩45,256'], ['부가세 약 10%', '약 ₩4,526'], ['남은 선불 잔액', '₩216']])}
<div class="note"><b>쉽게 말하면:</b> 광고 화면의 ₩45,256에 부가세를 더하면 실제 차감액과 거의 같습니다. 잔액 ₩216은 정상적인 추가 테스트를 하기에는 부족합니다.</div>
</div>

<h2>3. 네 제품 성과 비교</h2>
<div class="blk">
<p>같은 숫자를 한 표에 놓으면 무엇이 확인됐고 무엇이 아직 모르는지 보입니다.</p>
<table class="cmp">
<thead><tr><th>제품</th><th class="num">지출</th><th class="num">도달</th><th class="num">노출</th><th class="num">빈도</th><th class="num">CPM</th><th class="num">랜딩 조회</th><th class="num">노출→조회</th><th class="num">조회당 비용</th><th class="num">예약</th><th class="num">조회→예약</th><th class="num">예산 비중</th><th>판정</th></tr></thead>
<tbody>
<tr><td><b>카드너머</b></td><td class="num">₩37,231</td><td class="num">5,854</td><td class="num">6,099</td><td class="num">1.04</td><td class="num">₩6,104</td><td class="num">90</td><td class="num">1.48%</td><td class="num">₩414</td><td class="num">1</td><td class="num">1.11%</td><td class="num">82.27%</td><td>예약 신호 확인</td></tr>
<tr><td><b>오늘 해볼까</b></td><td class="num">₩6,833</td><td class="num">1,028</td><td class="num">1,094</td><td class="num">1.06</td><td class="num">₩6,246</td><td class="num">16</td><td class="num">1.46%</td><td class="num">₩427</td><td class="num">0</td><td class="num">0%</td><td class="num">15.10%</td><td>추가 검증 필요</td></tr>
<tr><td><b>맛핀</b></td><td class="num">₩706</td><td class="num">142</td><td class="num">151</td><td class="num">1.06</td><td class="num">₩4,675</td><td class="num">0</td><td class="num">0%</td><td class="num">—</td><td class="num">0</td><td class="num">—</td><td class="num">1.56%</td><td>데이터 부족</td></tr>
<tr><td><b>한입코치</b></td><td class="num">₩486</td><td class="num">57</td><td class="num">61</td><td class="num">1.07</td><td class="num">₩7,967</td><td class="num">0</td><td class="num">0%</td><td class="num">—</td><td class="num">0</td><td class="num">—</td><td class="num">1.07%</td><td>데이터 부족</td></tr>
</tbody>
</table>
</div>
<div class="note"><b>CPM</b> 광고가 1,000번 노출될 때 든 비용 · <b>노출→조회</b> 노출 수 중 실제 랜딩 조회로 이어진 비율(링크 클릭률과 다른 값) · <b>조회→예약</b> 랜딩을 본 사람 중 예약을 끝낸 비율</div>

<h2>4. 광고 이미지별 상세 성과</h2>
<div class="note">사람이 실제로 본 Feed 4:5 광고 소재만 표시했습니다. 랜딩 화면 이미지는 포함하지 않았습니다. <b>사진을 누르면 그 제품의 예약 랜딩이 열립니다.</b></div>
${products.map(card).join('\n')}

<h2>5. 시간대별 노출</h2>
<div class="blk">
<p>광고 계정 시간대(KST) 기준입니다. 막대 길이는 같은 날 가장 많이 노출된 20~21시와 비교한 값입니다.</p>
<div class="tl">
${hours.map(([l, v, w, hi]) => `<div class="row${hi ? ' hi' : ''}"><span class="b">${l}</span><span class="bar"><i style="width:${w}%"></i></span><span class="b" style="text-align:right">${v.toLocaleString()}회</span></div>`).join('\n')}
</div>
</div>
<table>
<thead><tr><th>시간</th><th class="num">카드너머</th><th class="num">오늘 해볼까</th><th class="num">맛핀</th><th class="num">한입코치</th><th class="num">전체</th></tr></thead>
<tbody>
<tr><td>20–21시</td><td class="num">4,350</td><td class="num">0</td><td class="num">0</td><td class="num">0</td><td class="num">4,350</td></tr>
<tr><td>21–22시</td><td class="num">691</td><td class="num">0</td><td class="num">0</td><td class="num">0</td><td class="num">691</td></tr>
<tr><td>22–23시</td><td class="num">960</td><td class="num">0</td><td class="num">0</td><td class="num">0</td><td class="num">960</td></tr>
<tr><td>23–24시</td><td class="num">64</td><td class="num">28</td><td class="num">1</td><td class="num">0</td><td class="num">93</td></tr>
<tr><td>00–01시</td><td class="num">34</td><td class="num">1,066</td><td class="num">150</td><td class="num">61</td><td class="num">1,311</td></tr>
</tbody>
</table>

<h2>6. 실제 예약 확인</h2>
<div class="blk">
<p><b>카드너머에서 1건</b> 확인됐습니다. Instagram 유료 광고 UTM과 Meta 클릭 식별값을 거쳐 2026년 8월 1일 23:07 KST에 운영 Supabase에 정상 저장됐습니다. 내부 출시 검증 예약은 제외했습니다.</p>
${kpi('', [['제품', '카드너머'], ['광고 랜딩 조회', '90회'], ['광고 예약', '1건'], ['조회→예약', '1.11%']])}
</div>

<h2>7. 왜 아직 공정한 승부가 아닐까요?</h2>
<div class="blk">
<p>총 지출 ₩45,256 중 카드너머에 ₩37,231이 사용됐습니다. 오늘 해볼까는 ₩6,833, 맛핀은 ₩706, 한입코치는 ₩486으로 광고 기회가 크게 달랐습니다.</p>
<div class="share" role="img" aria-label="카드너머 지출 82.27퍼센트, 나머지 세 광고 합계 17.73퍼센트"><i class="a" style="width:82.27%"></i><i class="b" style="width:17.73%"></i></div>
<div class="legend">■ 카드너머 <b>82.27%</b> &nbsp;&nbsp; □ 나머지 3개 합계 <b>17.73%</b></div>
</div>
<div class="two">
  <div class="hcard">
    <div class="h">대학생도 쉽게 말하면</div>
    <div class="mini">네 명이 같은 시험을 봤지만 시험 시간이 달랐습니다. 카드너머는 가장 오래 시험을 보고 예약 1건을 만들었습니다. 오늘 해볼까는 클릭 관심을 확인했고, 맛핀과 한입코치는 아직 시험 시간이 너무 짧았습니다.</div>
  </div>
  <div class="hcard">
    <div class="h">이번 실험에서 배운 것</div>
    <div class="mini">· 카드너머는 광고에서 예약까지 실제로 이어졌습니다.<br />· 오늘 해볼까는 랜딩 조회 비용이 카드너머와 비슷했습니다.<br />· 균등 예산이 아니면 이미지의 우열을 단정할 수 없습니다.<br />· 다음에는 제품별 최소 표본을 먼저 확보해야 합니다.</div>
  </div>
</div>

<h2>8. 다음 실험 방법</h2>
<div class="blk">
<p>추가 예산을 쓴다면 다음 세 단계만 지키면 이번보다 훨씬 정확한 비교가 됩니다.</p>
<ol>
<li><b>제품별 예산을 분리합니다.</b> 네 광고 세트에 같은 총예산을 넣어 한 제품이 먼저 전부 쓰지 못하게 합니다.</li>
<li><b>최소 표본을 정합니다.</b> 제품별 랜딩 조회가 적어도 30회 쌓이기 전에는 승자·실패를 결정하지 않습니다.</li>
<li><b>같은 기준으로 판단합니다.</b> 랜딩 조회 비용, 예약 수, 조회→예약 전환율을 함께 보고 카드너머의 예약 신호가 반복되는지 확인합니다.</li>
</ol>
</div>
<div class="foot">출처: Meta Ads Manager 광고 세트×광고 계정 시간대 보고서, 청구 및 결제의 선불 잔액, 운영 Supabase 예약 집계 · 캠페인 TR_LPV_IG_KR_W30-39_6H_20260801 · 확인 시점 2026-08-02 00:26 KST<br />광고비·도달·노출·랜딩 조회는 Meta 반영 지연으로 소폭 바뀔 수 있습니다. 예약 수는 광고 UTM이 있는 운영 DB 행만 포함하고 내부 QA 2건과 OAuth 검증 1건은 제외했습니다. Instagram 아이디·이메일 등 개인 식별 정보는 보고서에 포함하지 않았습니다.</div>
</body></html>`

fs.writeFileSync('report.html', html)
console.log('생성: report.html', (html.length / 1024 / 1024).toFixed(2), 'MB')
