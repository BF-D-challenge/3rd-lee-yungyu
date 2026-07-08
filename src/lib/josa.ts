export type JosaPair = "을/를" | "이/가" | "은/는" | "으로/로";

const batchimOf = (word: string): number => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return -1; // 한글 아님 → 판단 불가
  return (last - 0xac00) % 28;
};

/** 받침 유무로 조사 선택: josa('러닝', '을/를') → '러닝을' */
export function josa(word: string, pair: JosaPair): string {
  const b = batchimOf(word);
  const [withB, withoutB] = pair.split("/");
  if (b === -1) return `${word}${withB}(${withoutB})`;
  if (pair === "으로/로") return word + (b === 0 || b === 8 ? withoutB : withB); // ㄹ받침 예외
  return word + (b > 0 ? withB : withoutB);
}

const JOSA_SUFFIX: Record<string, JosaPair> = {
  을: "을/를",
  를: "을/를",
  이: "이/가",
  가: "이/가",
  은: "은/는",
  는: "은/는",
};

/**
 * "{key}" 플레이스홀더를 채우면서, 토큰 바로 뒤의 조사(을/를/이/가/은/는, "(으)로")를
 * 치환된 단어의 받침에 맞게 자동 교정한다.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}(\(으\)로|[을를이가은는])?/g, (match, key, suffix) => {
    const value = values[key];
    if (value === undefined) return match;
    if (!suffix) return value;
    if (suffix === "(으)로") return josa(value, "으로/로");
    return josa(value, JOSA_SUFFIX[suffix]);
  });
}
