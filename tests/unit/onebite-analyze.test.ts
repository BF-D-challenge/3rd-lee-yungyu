import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/onebite/analyze/route";
import {
  ONEBITE_MAX_IMAGE_BYTES,
  onebiteAnalysisSchema,
} from "@/app/api/onebite/analyze/contract";

type Analysis = Parameters<typeof onebiteAnalysisSchema.parse>[0];

const safeAnalysis = {
  isMealPhoto: true,
  visibleGroups: ["starch", "protein"],
  actionCode: "add_vegetable",
  confidence: "high",
  riskFlag: "none",
} satisfies Analysis;

function geminiResponse(analysis: unknown) {
  return {
    status: "completed",
    steps: [
      { type: "thought" },
      {
        type: "model_output",
        content: [{ type: "text", text: JSON.stringify(analysis) }],
      },
    ],
  };
}

async function jpegPhoto({
  width = 2200,
  height = 1200,
}: {
  width?: number;
  height?: number;
} = {}) {
  const bytes = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 190, g: 120, b: 70 },
    },
  })
    .jpeg()
    .withMetadata({
      orientation: 6,
      exif: {
        IFD0: {
          Artist: "should-not-leave-server",
        },
      },
    })
    .toBuffer();

  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new File([arrayBuffer], "meal.jpg", { type: "image/jpeg" });
}

async function analyzeRequest(photo: File, headers?: HeadersInit) {
  const formData = new FormData();
  formData.set("photo", photo);
  return POST(new Request("https://example.com/api/onebite/analyze", {
    method: "POST",
    headers,
    body: formData,
  }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/onebite/analyze", () => {
  it("이미지를 서버에서 디코드·회전·축소·메타데이터 제거한 뒤 Gemini에 한 번만 보낸다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("ALLSALE_GEMINI_API_KEY", "");
    vi.stubEnv("ONEBITE_GEMINI_MODEL", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(geminiResponse(safeAnalysis)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await analyzeRequest(await jpegPhoto());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual({
      mode: "live",
      analysis: safeAnalysis,
      actionLine: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
    });
    expect(JSON.stringify(body)).not.toContain("server-only-test-key");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [upstreamUrl, init] = fetchSpy.mock.calls[0];
    expect(upstreamUrl).toBe(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
    );
    expect((init as RequestInit).headers).toEqual(expect.objectContaining({
      "api-revision": "2026-05-20",
      "x-goog-api-key": "server-only-test-key",
    }));

    const upstreamBody = JSON.parse(String((init as RequestInit).body));
    expect(upstreamBody.model).toBe("gemini-3.6-flash");
    expect(upstreamBody.store).toBe(false);
    expect(upstreamBody.input[1]).toEqual(expect.objectContaining({
      type: "image",
      mime_type: "image/webp",
    }));
    expect(upstreamBody.response_format.mime_type).toBe("application/json");

    const preparedImage = Buffer.from(upstreamBody.input[1].data, "base64");
    const metadata = await sharp(preparedImage).metadata();
    expect(metadata.format).toBe("webp");
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBeLessThanOrEqual(1600);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  });

  it("모델의 자유 문장과 계약 밖 필드는 결과로 통과시키지 않는다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(geminiResponse({
        ...safeAnalysis,
        actionLine: "다음 끼니는 굶으세요.",
      })), { status: 200 }),
    );

    const response = await analyzeRequest(await jpegPhoto());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "gemini_failed" });
  });

  it.each([
    {
      analysis: {
        isMealPhoto: false,
        visibleGroups: [],
        actionCode: "retake_photo",
        confidence: "high",
        riskFlag: "not_food",
      },
      error: "not_food",
      actionLine: "음식 전체가 밝게 보이도록 위에서 다시 찍어주세요.",
    },
    {
      analysis: {
        isMealPhoto: true,
        visibleGroups: ["unknown"],
        actionCode: "retake_photo",
        confidence: "low",
        riskFlag: "uncertain",
      },
      error: "uncertain",
      actionLine: "음식 전체가 밝게 보이도록 위에서 다시 찍어주세요.",
    },
    {
      analysis: {
        isMealPhoto: true,
        visibleGroups: ["starch"],
        actionCode: "retake_photo",
        confidence: "medium",
        riskFlag: "medical_or_ed",
      },
      error: "medical_or_ed",
      actionLine:
        "이 사진으로 코칭을 계속하지 않아요. 식단은 담당 의료진이나 임상영양사와 확인해주세요.",
    },
  ])("$error 결과는 서버의 고정 안전 행동과 함께 422로 차단한다", async ({
    analysis,
    error,
    actionLine,
  }) => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(geminiResponse(analysis)), { status: 200 }),
    );

    const response = await analyzeRequest(await jpegPhoto());
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe(error);
    expect(body.actionLine).toBe(actionLine);
  });

  it("허용하지 않은 형식과 5MB 초과 파일은 외부 호출 전에 거부한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const wrongType = await analyzeRequest(
      new File(["not-an-image"], "meal.gif", { type: "image/gif" }),
    );
    expect(wrongType.status).toBe(415);
    expect(await wrongType.json()).toEqual({ error: "unsupported_image_type" });

    const oversized = await analyzeRequest(
      new File(
        [new Uint8Array(ONEBITE_MAX_IMAGE_BYTES + 1)],
        "meal.jpg",
        { type: "image/jpeg" },
      ),
    );
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toEqual({ error: "image_too_large" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("확장자와 MIME만 이미지인 손상 파일은 실제 디코드 단계에서 거부한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await analyzeRequest(
      new File(["not-a-jpeg"], "meal.jpg", { type: "image/jpeg" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "image_decode_failed" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Gemini 서버 키가 없으면 가짜 분석 대신 설정 오류를 반환한다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ALLSALE_GEMINI_API_KEY", "");

    const response = await analyzeRequest(await jpegPhoto());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "gemini_not_configured" });
  });

  it("cross-site 업로드 릴레이는 이미지 파싱 전에 차단한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await analyzeRequest(await jpegPhoto(), {
      "sec-fetch-site": "cross-site",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "cross_site_request" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
