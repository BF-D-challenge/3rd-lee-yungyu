import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 맛핀",
  description: "Instagram 릴스를 지도에 저장하는 맛핀의 개인정보 처리 방법을 안내합니다.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link className={styles.brand} href="/matpin">맛핀</Link><Link className={styles.back} href="/matpin">홈으로</Link></header>
      <article className={styles.content}>
        <p className={styles.eyebrow}>개인정보처리방침</p>
        <h1>맛핀은 지도 저장에<br />필요한 정보만 사용해요.</h1>
        <p className={styles.updated}>시행일: 2026년 8월 1일</p>

        <section><h2>1. 어떤 정보를 받나요?</h2><ul><li>Instagram이 만든 사용자 식별값과 메시지 식별값</li><li>matpin.kr로 공유한 공개 릴스의 주소와 임시 미디어 주소</li><li>영상에서 확인한 장소 단서, 장소 후보, 사용자가 저장한 장소</li><li>오류 확인에 필요한 처리 시각과 기술 기록</li></ul></section>
        <section><h2>2. 왜 사용하나요?</h2><p>보낸 릴스에서 식당·카페 단서를 찾고, 실제 장소 후보를 확인해 개인 지도에 저장하며, Instagram 답장으로 결과 링크를 보내기 위해 사용합니다.</p></section>
        <section><h2>3. 어떤 서비스가 함께 처리하나요?</h2><ul><li>Meta: Instagram 메시지 수신과 답장</li><li>Google Gemini 및 Google Maps: 영상 단서 분석과 장소 후보 확인</li><li>Supabase: 암호화된 계정 연결 정보와 저장 장소 보관</li><li>Vercel: 맛핀 웹과 서버 기능 운영</li></ul></section>
        <section><h2>4. 얼마나 보관하나요?</h2><p>릴스 임시 미디어 주소는 분석이 끝나거나 최종 실패하면 제거합니다. 개인 지도 링크는 마지막 릴스를 받은 뒤 90일 동안 유효합니다. 사용자가 직접 삭제하면 계정 연결 정보, 처리 기록, 저장 장소를 즉시 함께 삭제합니다.</p></section>
        <section><h2>5. 어떻게 보호하나요?</h2><p>Instagram 사용자 식별값과 임시 미디어 주소는 서버에서 암호화합니다. 브라우저에는 원래 식별값을 보여주지 않습니다. 데이터베이스는 서버 전용 권한으로만 접근합니다.</p></section>
        <section><h2>6. 내가 할 수 있는 일</h2><p>개인 지도에서 장소 하나를 지우거나, ‘내 데이터 관리’에서 맛핀 데이터를 모두 삭제할 수 있습니다. 문제가 있으면 Instagram <strong>@matpin.kr</strong>로 메시지를 보내주세요.</p></section>

        <nav className={styles.actions} aria-label="법적 안내"><Link href="/data-deletion">데이터 삭제 방법</Link><Link href="/terms">이용약관</Link></nav>
      </article>
    </main>
  );
}
