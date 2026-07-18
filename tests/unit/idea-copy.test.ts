import { describe, expect, it } from "vitest";
import {
  normalizeIdeaBuild,
  normalizeIdeaDifference,
  normalizeIdeaFlow,
  normalizeIdeaMoment,
  normalizeIdeaSource,
  normalizeIdeaTarget,
} from "@/lib/idea-copy";

describe("idea copy normalization", () => {
  it("turns exhaustive-audit source fields into a readable mechanism", () => {
    expect(
      normalizeIdeaSource(
        "구체적인 입력: 상품 사진. 핵심 처리: 상품 배경을 생활 장면으로 변환.",
      ),
    ).toBe("상품 사진을 받아 상품 배경을 생활 장면으로 변환하는 도구");
  });

  it("turns an audit build into a one-line user-facing UVP", () => {
    expect(
      normalizeIdeaBuild(
        "구체적인 입력: 상품 사진.를 넣으면 상품 사진 한 장과 배경 장면 하나만 선택해 생성 후 즉시 결과: 전자상거래용 생활 배경 이미지.",
        "웹",
      ),
    ).toBe(
      "“상품 사진”만 넣으면 전자상거래용 생활 배경 이미지가 바로 나오는 웹 화면 — 상품 사진 한 장과 배경 장면 하나만 선택해 생성",
    );
  });

  it("removes audit labels from the visible flow and preserves ordinary copy", () => {
    expect(
      normalizeIdeaFlow(
        "구체적인 입력: 유튜브 영상 URL. → 핵심 처리: 오디오 기반 전사 후 구조화. → 즉시 결과: 다운로드 가능한 전사 파일.",
      ),
    ).toEqual(["유튜브 영상 URL", "오디오 기반 전사 후 구조화", "다운로드 가능한 전사 파일"]);
    expect(normalizeIdeaBuild("음성을 올리면 결정 세 줄을 보여주는 화면", "웹")).toBe(
      "음성을 올리면 결정 세 줄을 보여주는 화면",
    );
  });

  it("removes mechanical repetition from difference, target, and moment copy", () => {
    expect(
      normalizeIdeaDifference(
        "원본의 입력→처리→결과 흐름을 유지하면서 한국 쇼핑몰용 배경 세 가지 제공만 적용합니다.",
      ),
    ).toBe("기존 흐름은 그대로, 이번 차이는 ‘한국 쇼핑몰용 배경 세 가지 제공’입니다.");
    expect(
      normalizeIdeaTarget(
        "제품 사진이 부족한 1인 브랜드 대표",
        "제품 사진이 부족한 1인 브랜드 대표가 흰 배경 상품을 분위기 있게 보이고 싶을 때에 이 결과를 바로 사용합니다.",
      ),
    ).toBe(
      "제품 사진이 부족한 1인 브랜드 대표. 흰 배경 상품을 분위기 있게 보이고 싶을 때에 이 결과를 바로 사용합니다.",
    );
    expect(
      normalizeIdeaMoment(
        "상품 상세페이지 사진이 부족할 때",
        "상품 상세페이지 사진이 부족할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      ),
    ).toBe("상품 상세페이지 사진이 부족할 때");
  });
});
