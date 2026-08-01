import { describe, expect, it, vi } from "vitest";
import {
  instagramHandleError,
  loadPendingInstagramHandle,
  normalizeInstagramHandle,
  savePendingInstagramHandle,
} from "@/lib/instagram-handle";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("Instagram handle contract", () => {
  it("removes @ and normalizes case before storage", () => {
    expect(normalizeInstagramHandle(" @My.Daily_Meal ")).toBe("my.daily_meal");
  });

  it("rejects whitespace and Korean display names", () => {
    expect(normalizeInstagramHandle("my meal")).toBeNull();
    expect(normalizeInstagramHandle("오늘의식사")).toBeNull();
    expect(instagramHandleError("my meal")).toContain("영문");
  });

  it.each([
    ["", "입력"],
    [".dailymeal", "처음이나 끝"],
    ["dailymeal.", "처음이나 끝"],
    ["daily..meal", "연속"],
    ["daily-meal", "영문"],
    ["a".repeat(31), "30자"],
  ])("rejects %j with a useful reason", (value, reason) => {
    expect(normalizeInstagramHandle(value)).toBeNull();
    expect(instagramHandleError(value)).toContain(reason);
  });

  it.each(["meal_1", "meal.day", "_meal", "m"])("accepts %s", (value) => {
    expect(normalizeInstagramHandle(value)).toBe(value);
    expect(instagramHandleError(value)).toBe("");
  });

  it("keeps pending values separate for every Instagram reservation product", () => {
    vi.stubGlobal("sessionStorage", new MemoryStorage());

    savePendingInstagramHandle("@matpin_test", "matpick");
    savePendingInstagramHandle("@onebite_test", "onebite");
    savePendingInstagramHandle("@cardbeyond_test", "story-cards");

    expect(loadPendingInstagramHandle("matpick")).toBe("matpin_test");
    expect(loadPendingInstagramHandle("onebite")).toBe("onebite_test");
    expect(loadPendingInstagramHandle("story-cards")).toBe("cardbeyond_test");
  });
});
