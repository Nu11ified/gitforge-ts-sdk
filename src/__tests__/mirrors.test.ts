import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { MirrorsResource } from "../resources/mirrors";
import type { MirrorConfig } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";
const mirrorId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function makeMirror(overrides: Partial<MirrorConfig> = {}): MirrorConfig {
  return {
    id: mirrorId,
    sourceUrl: "https://github.com/example/repo.git",
    interval: 3600,
    lastSyncAt: null,
    lastError: null,
    enabled: true,
    createdAt: "2026-03-20T10:00:00.000Z",
    direction: "pull",
    provider: "github",
    credentialId: null,
    ...overrides,
  };
}

describe("MirrorsResource", () => {
  describe("list", () => {
    it("sends GET /repos/:id/mirrors", async () => {
      const mirrors = [makeMirror()];
      const { fetch, calls } = mockOk(mirrors);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/mirrors`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mirrorId);
      expect(result[0].sourceUrl).toBe("https://github.com/example/repo.git");
    });
  });

  describe("create", () => {
    it("sends POST /repos/:id/mirrors with sourceUrl", async () => {
      const mirror = makeMirror();
      const { fetch, calls } = mockOk(mirror);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.create(repoId, {
        sourceUrl: "https://github.com/example/repo.git",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/mirrors`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        sourceUrl: "https://github.com/example/repo.git",
      });
      expect(result).toEqual(mirror);
    });

    it("sends POST with all options (interval, direction, provider, credentialId)", async () => {
      const mirror = makeMirror({
        interval: 1800,
        direction: "push",
        provider: "gitlab",
        credentialId: "cred-uuid-123",
      });
      const { fetch, calls } = mockOk(mirror);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.create(repoId, {
        sourceUrl: "https://github.com/example/repo.git",
        interval: 1800,
        direction: "push",
        provider: "gitlab",
        credentialId: "cred-uuid-123",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        sourceUrl: "https://github.com/example/repo.git",
        interval: 1800,
        direction: "push",
        provider: "gitlab",
        credentialId: "cred-uuid-123",
      });
      expect(result.interval).toBe(1800);
      expect(result.direction).toBe("push");
      expect(result.provider).toBe("gitlab");
      expect(result.credentialId).toBe("cred-uuid-123");
    });
  });

  describe("update", () => {
    it("sends PATCH /repos/:id/mirrors/:mirrorId with enabled: false", async () => {
      const mirror = makeMirror({ enabled: false });
      const { fetch, calls } = mockOk(mirror);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.update(repoId, mirrorId, { enabled: false });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/mirrors/${mirrorId}`);
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({ enabled: false });
      expect(result.enabled).toBe(false);
    });

    it("sends PATCH with multiple fields", async () => {
      const mirror = makeMirror({
        sourceUrl: "https://gitlab.com/org/repo.git",
        interval: 7200,
        enabled: true,
        direction: "bidirectional",
        provider: "gitlab",
        credentialId: "cred-456",
      });
      const { fetch, calls } = mockOk(mirror);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.update(repoId, mirrorId, {
        sourceUrl: "https://gitlab.com/org/repo.git",
        interval: 7200,
        enabled: true,
        direction: "bidirectional",
        provider: "gitlab",
        credentialId: "cred-456",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({
        sourceUrl: "https://gitlab.com/org/repo.git",
        interval: 7200,
        enabled: true,
        direction: "bidirectional",
        provider: "gitlab",
        credentialId: "cred-456",
      });
      expect(result.sourceUrl).toBe("https://gitlab.com/org/repo.git");
      expect(result.interval).toBe(7200);
      expect(result.direction).toBe("bidirectional");
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id/mirrors/:mirrorId", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.delete(repoId, mirrorId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/mirrors/${mirrorId}`);
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("sync", () => {
    it("sends POST /repos/:id/mirrors/:mirrorId/sync", async () => {
      const syncResult = { message: "Sync initiated" };
      const { fetch, calls } = mockOk(syncResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.sync(repoId, mirrorId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/mirrors/${mirrorId}/sync`);
      expect(calls[0].method).toBe("POST");
      expect(result.message).toBe("Sync initiated");
    });
  });

  describe("MirrorConfig shape", () => {
    it("returns correct MirrorConfig shape with all fields", async () => {
      const mirror = makeMirror({
        lastSyncAt: "2026-03-25T12:00:00.000Z",
        lastError: "connection timeout",
      });
      const { fetch } = mockOk([mirror]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      const result = await resource.list(repoId);
      const m = result[0];

      expect(m.id).toBe(mirrorId);
      expect(m.sourceUrl).toBe("https://github.com/example/repo.git");
      expect(m.interval).toBe(3600);
      expect(m.lastSyncAt).toBe("2026-03-25T12:00:00.000Z");
      expect(m.lastError).toBe("connection timeout");
      expect(m.enabled).toBe(true);
      expect(m.createdAt).toBe("2026-03-20T10:00:00.000Z");
      expect(m.direction).toBe("pull");
      expect(m.provider).toBe("github");
      expect(m.credentialId).toBeNull();
    });
  });

  describe("errors", () => {
    it("throws GitForgeError 404 when mirror not found", async () => {
      const { fetch } = mockError(404, "not_found", "Mirror not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      try {
        await resource.update(repoId, "nonexistent-id", { enabled: false });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Mirror not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on list", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      await resource.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeMirror());
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      await resource.create(repoId, { sourceUrl: "https://github.com/x/y.git" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on update", async () => {
      const { fetch, calls } = mockOk(makeMirror());
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      await resource.update(repoId, mirrorId, { enabled: false });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      await resource.delete(repoId, mirrorId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on sync", async () => {
      const { fetch, calls } = mockOk({ message: "Sync initiated" });
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new MirrorsResource(client);

      await resource.sync(repoId, mirrorId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
