import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "사용자 데이터 삭제 | 맛핀",
  description: "맛핀에 저장된 Instagram 릴스와 장소 데이터를 직접 삭제하는 방법입니다.",
};

export default function DataDeletionPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link className={styles.brand} href="/matpin">맛핀</Link><Link className={styles.back} href="/matpin">홈으로</Link></header>
      <article className={styles.content}>
        <p className={styles.eyebrow}>사용자 데이터 삭제</p>
        <h1>내 맛핀 데이터는<br />직접 지울 수 있어요.</h1>
        <p className={styles.updated}>저장 장소, 릴스 처리 기록, Instagram 계정 연결 정보가 함께 삭제되며 복구할 수 없습니다.</p>

        <section><h2>삭제하는 방법</h2><ol><li>Instagram에서 맛핀이 보낸 최신 ‘내 지도’ 링크를 엽니다.</li><li>화면 아래의 ‘내 데이터 관리’를 누릅니다.</li><li>‘모든 맛핀 데이터 삭제’를 누르고 한 번 더 확인합니다.</li></ol></section>
        <section><h2>링크가 열리지 않나요?</h2><p>개인 지도 링크는 마지막 릴스를 받은 뒤 90일 동안 유효합니다. 링크가 없거나 만료됐다면 Instagram <strong>@matpin.kr</strong>로 삭제 요청을 보내주세요. 요청한 계정의 데이터만 확인해 처리합니다.</p></section>
        <section><h2>삭제 뒤에는 어떻게 되나요?</h2><p>맛핀에 저장된 계정 연결 정보와 모든 하위 데이터가 삭제됩니다. 다시 이용하려면 Instagram에서 matpin.kr로 새 릴스를 보내주세요.</p></section>

        <nav className={styles.actions}><Link href="/privacy">개인정보처리방침 보기</Link><Link href="/matpin">맛핀 홈으로</Link></nav>
      </article>
    </main>
  );
}
