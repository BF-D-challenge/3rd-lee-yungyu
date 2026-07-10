/** moonlight 원본 인그레이빙 로제트(12방향, 중심 150,242.5·반경54·15°간격) — 좌표 그대로 루프 펼침. */
export const BACK_RAYS = (() => {
  let out = "";
  for (let a = 0; a < 180; a += 15) {
    const r = (a * Math.PI) / 180;
    const x = Math.cos(r) * 54;
    const y = Math.sin(r) * 54;
    out += `<line x1="${150 - x}" y1="${242.5 - y}" x2="${150 + x}" y2="${242.5 + y}"/>`;
  }
  return out;
})();

export const BACK_DOTS = ([[40, 40], [260, 40], [40, 445], [260, 445]] as const)
  .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`)
  .join("");

/** 덱 공용 뒷면 (300:485) — 디자인 리셋 D12: moonlight 인그레이빙을 색만 흑백 반전(I, 2026-07-08 최종).
 *  원본(흰 종이+검정 잉크)과 도형·좌표 100% 동일, 카드지↔잉크 색만 반전(검정 카드지+흰 잉크, 파랑 톤 없음).
 *  축 텍스트 삭제(로제트만) — defs/filter 전무(자산 0, 56장 중복 세이프). */
export function backSvg(cornerRadius = 48): string {
  return (
    `<svg viewBox="0 0 300 485" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="geometricPrecision">` +
    `<rect x="0" y="0" width="300" height="485" rx="${cornerRadius}" fill="#0a0a0b"/>` +
    `<rect x="4.5" y="4.5" width="291" height="476" rx="${Math.max(8, cornerRadius - 6)}" fill="none" stroke="#eaeaea" stroke-width="3"/>` +
    `<rect x="17" y="17" width="266" height="451" rx="${Math.min(11, cornerRadius)}" fill="none" stroke="#eaeaea" stroke-width="1"/>` +
    `<g stroke="#eaeaea" stroke-width="1.7" stroke-linecap="round">${BACK_RAYS}</g>` +
    `<circle cx="150" cy="242.5" r="4.2" fill="#eaeaea"/>` +
    `<g fill="#eaeaea">${BACK_DOTS}</g>` +
    `</svg>`
  );
}
