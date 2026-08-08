import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "이용약관 | 맛핀",
  description: "맛핀 이용 조건과 사용자의 선택권을 안내합니다.",
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link className={styles.brand} href="/matpin">맛핀</Link><Link className={styles.back} href="/matpin">홈으로</Link></header>
      <article className={styles.content}>
        <p className={styles.eyebrow}>이용약관</p>
        <h1>맛핀을 쓰기 전에<br />알아둘 내용이에요.</h1>
        <p className={styles.updated}>시행일: 2026년 8월 9일</p>
        <section><h2>1. 제공하는 기능</h2><p>맛핀은 사용자가 matpin.kr로 공유한 공개 Instagram 릴스에서 장소 단서를 찾고, 실제 장소 후보를 확인해 개인 지도에 저장합니다.</p></section>
        <section><h2>2. 결과 확인</h2><p>영상이나 지도 정보가 불분명하면 잘못된 후보가 나올 수 있습니다. 맛핀은 확신이 낮을 때 사용자의 확인을 요청합니다. 방문 전에는 원본 릴스와 지도 정보를 다시 확인해주세요.</p></section>
        <section><h2>3. 사용할 수 없는 콘텐츠</h2><p>비공개 릴스, 접근 권한이 없는 콘텐츠, 타인의 권리를 침해하는 콘텐츠는 처리하지 않습니다. 사용자는 자신이 Instagram에서 정상적으로 공유할 수 있는 콘텐츠만 보내야 합니다.</p></section>
        <section><h2>4. 서비스 변경과 중단</h2><p>Meta, Google, Supabase, Vercel 등 외부 서비스의 장애나 정책 변경으로 일부 기능이 잠시 멈출 수 있습니다. 중요한 저장 장소는 원본 지도에서도 확인해주세요.</p></section>
        <section><h2>5. 개인정보와 삭제</h2><p>개인정보 처리 방법과 직접 삭제 절차는 각각 안내 페이지에서 확인할 수 있습니다.</p></section>
        <nav className={styles.actions}><Link href="/privacy">개인정보처리방침</Link><Link href="/data-deletion">데이터 삭제 방법</Link></nav>
      </article>
    </main>
  );
}
