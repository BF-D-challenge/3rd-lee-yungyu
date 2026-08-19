import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

test("Preview live 설정에서도 세 처리 API가 fail-closed 된다", async ({ request }) => {
  const webhookBody = JSON.stringify({ object: "instagram", entry: [] });
  const signature = `sha256=${createHmac("sha256", "e2e-meta-secret")
    .update(webhookBody)
    .digest("hex")}`;

  const webhook = await request.post("/api/matpin/webhook", {
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
    },
    data: webhookBody,
  });
  const worker = await request.post("/api/matpin/jobs/process", {
    headers: { authorization: "Bearer e2e-cron-secret" },
  });
  const reprocess = await request.post(
    "/api/matpin/messages/11111111-1111-4111-8111-111111111111/reprocess",
    { headers: { authorization: "Bearer e2e-cron-secret" } },
  );

  expect(webhook.status()).toBe(503);
  expect(await webhook.json()).toEqual({ error: "pipeline_not_configured" });
  expect(worker.status()).toBe(409);
  expect(await worker.json()).toEqual({ error: "pipeline_not_live" });
  expect(reprocess.status()).toBe(409);
  expect(await reprocess.json()).toEqual({ error: "pipeline_not_live" });
});

test("미인증 관리자 mutation은 pipeline 상태를 노출하지 않는다", async ({ request }) => {
  const paths = [
    "/api/matpin/admin/conversations/conversation-1/messages",
    "/api/matpin/admin/messages/11111111-1111-4111-8111-111111111111/resend",
    "/api/matpin/admin/messages/11111111-1111-4111-8111-111111111111/reprocess",
  ];

  for (const path of paths) {
    const response = await request.post(path, { data: "not-json" });
    expect(response.status(), path).toBe(403);
    expect(await response.json(), path).toEqual({ error: "admin_not_configured" });
  }
});

test("장소 확정과 개인정보 삭제 API는 pipeline보다 사용자 인증을 먼저 확인한다", async ({ request }) => {
  const confirm = await request.post(
    "/api/matpin/messages/11111111-1111-4111-8111-111111111111/confirm",
    {
      headers: { authorization: "Bearer e2e-user-token" },
      data: { candidateId: "candidate-1" },
    },
  );
  const account = await request.delete("/api/matpin/account", {
    headers: { authorization: "Bearer e2e-user-token" },
  });
  const savedPlace = await request.delete("/api/matpin/saves/1", {
    headers: { authorization: "Bearer e2e-user-token" },
  });

  expect(confirm.status()).toBe(503);
  expect(await confirm.json()).toEqual({ error: "not_configured" });
  expect(account.status()).toBe(401);
  expect(await account.json()).toEqual({ error: "login_required" });
  expect(savedPlace.status()).toBe(401);
  expect(await savedPlace.json()).toEqual({ error: "login_required" });
});
