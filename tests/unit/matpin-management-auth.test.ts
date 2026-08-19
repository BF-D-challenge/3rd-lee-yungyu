import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authUser: vi.fn(),
  trustedOrigin: vi.fn(),
  deleteAccount: vi.fn(),
  deletePlace: vi.fn(),
  disableProfile: vi.fn(),
}));

vi.mock("@/lib/backend/server-auth", () => ({
  getVerifiedAuthUser: mocks.authUser,
  hasTrustedMutationOrigin: mocks.trustedOrigin,
}));

vi.mock("@/lib/matpin/store", () => ({
  deleteMatpinAccount: mocks.deleteAccount,
  deleteMatpinSavedPlace: mocks.deletePlace,
  disableMatpinPublicProfile: mocks.disableProfile,
}));

import { DELETE as deleteAccount } from "@/app/api/matpin/account/route";
import { PATCH as updateVisibility } from "@/app/api/matpin/profile/visibility/route";
import { DELETE as deletePlace } from "@/app/api/matpin/saves/[id]/route";

const privateHeaders = { authorization: "Bearer private-link-token" };

beforeEach(() => {
  mocks.trustedOrigin.mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Matpin management login gate", () => {
  it("rejects every management mutation when there is no verified login", async () => {
    mocks.authUser.mockResolvedValue(null);

    const account = await deleteAccount(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
      headers: privateHeaders,
    }));
    const place = await deletePlace(new Request("https://matpin.example/api/matpin/saves/1", {
      method: "DELETE",
      headers: privateHeaders,
    }), { params: Promise.resolve({ id: "1" }) });
    const visibility = await updateVisibility(new Request("https://matpin.example/api/matpin/profile/visibility", {
      method: "PATCH",
      headers: { ...privateHeaders, "content-type": "application/json" },
      body: JSON.stringify({ isPublic: false }),
    }));

    for (const response of [account, place, visibility]) {
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "login_required" });
    }
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
    expect(mocks.deletePlace).not.toHaveBeenCalled();
    expect(mocks.disableProfile).not.toHaveBeenCalled();
  });

  it("requires the private chat link even after login", async () => {
    mocks.authUser.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    const response = await deleteAccount(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "private_link_required" });
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("allows a logged-in holder of the private chat link to manage the profile", async () => {
    const authUserId = "11111111-1111-4111-8111-111111111111";
    mocks.authUser.mockResolvedValue({ id: authUserId });
    mocks.deleteAccount.mockResolvedValue(true);
    mocks.deletePlace.mockResolvedValue(true);
    mocks.disableProfile.mockResolvedValue(true);

    const account = await deleteAccount(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
      headers: privateHeaders,
    }));
    const place = await deletePlace(new Request("https://matpin.example/api/matpin/saves/7", {
      method: "DELETE",
      headers: privateHeaders,
    }), { params: Promise.resolve({ id: "7" }) });
    const visibility = await updateVisibility(new Request("https://matpin.example/api/matpin/profile/visibility", {
      method: "PATCH",
      headers: { ...privateHeaders, "content-type": "application/json" },
      body: JSON.stringify({ isPublic: false }),
    }));

    expect(account.status).toBe(200);
    expect(place.status).toBe(204);
    expect(visibility.status).toBe(200);
    expect(mocks.deleteAccount).toHaveBeenCalledWith("private-link-token", authUserId);
    expect(mocks.deletePlace).toHaveBeenCalledWith(7, "private-link-token", authUserId);
    expect(mocks.disableProfile).toHaveBeenCalledWith("private-link-token", authUserId);
  });

  it("rejects cross-origin mutations before auth or data access", async () => {
    mocks.trustedOrigin.mockReturnValue(false);
    const response = await deleteAccount(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
      headers: { ...privateHeaders, origin: "https://evil.example" },
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "cross_origin_forbidden" });
    expect(mocks.authUser).not.toHaveBeenCalled();
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });
});
