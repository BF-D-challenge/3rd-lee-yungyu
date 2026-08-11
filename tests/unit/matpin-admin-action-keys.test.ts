import { describe, expect, it, vi } from "vitest";
import {
  createMatpinAdminActionIntent,
  persistMatpinAdminActionKeys,
  readMatpinAdminActionKeys,
} from "@/lib/matpin/admin-action-keys";

function memoryStorage() {
  let value: string | null = null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next; }),
  };
}

describe("Matpin admin action key persistence", () => {
  it("creates a stable intent without exposing the DM text", async () => {
    const first = await createMatpinAdminActionIntent(
      "reply",
      "/api/matpin/admin/conversations/one/messages",
      { text: "같은 답장입니다." },
    );
    const second = await createMatpinAdminActionIntent(
      "reply",
      "/api/matpin/admin/conversations/one/messages",
      { text: "같은 답장입니다." },
    );

    expect(first).toBe(second);
    expect(first).not.toContain("같은 답장입니다.");
  });

  it("restores only validated fingerprints and UUID keys", () => {
    const storage = memoryStorage();
    const intent = "a".repeat(64);
    const key = "11111111-1111-4111-8111-111111111111";
    persistMatpinAdminActionKeys(new Map([
      [intent, key],
      ["원문이 들어간 잘못된 키", "not-a-uuid"],
    ]), storage);

    expect(JSON.stringify(storage.setItem.mock.calls)).not.toContain("원문이 들어간 잘못된 키");
    expect(readMatpinAdminActionKeys(storage)).toEqual(new Map([[intent, key]]));
  });
});
