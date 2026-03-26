import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { TokensResource } from "../resources/tokens";
import type { RepoToken } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

function makeRepoToken(overrides: Partial<RepoToken> = {}): RepoToken {
  return {
    token: "gf_repo_abc123xyz",
    patId: "pat-0001-0002-0003",
    expiresAt: "2026-03-26T01:00:00.000Z",
    remoteUrl: "https://x:gf_repo_abc123xyz@gitforge.dev/testuser/my-repo.git",
    ...overrides,
  };
}

describe("TokensResource", () => {
  describe("create", () => {
    it("sends POST /repos/:id/tokens with ttlSeconds", async () => {
      const repoToken = makeRepoToken();
      const { fetch, calls } = mockOk(repoToken);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      const result = await tokens.create(repoId, { ttlSeconds: 3600 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `https://api.gitforge.dev/repos/${repoId}/tokens`,
      );
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({ ttlSeconds: 3600 });
      expect(result).toEqual(repoToken);
    });

    it("sends scopes option in request body", async () => {
      const repoToken = makeRepoToken();
      const { fetch, calls } = mockOk(repoToken);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      await tokens.create(repoId, {
        ttlSeconds: 7200,
        scopes: ["read", "write"],
      });

      expect(calls[0].body).toEqual({
        ttlSeconds: 7200,
        scopes: ["read", "write"],
      });
    });

    it("sends type option in request body", async () => {
      const repoToken = makeRepoToken();
      const { fetch, calls } = mockOk(repoToken);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      await tokens.create(repoId, {
        ttlSeconds: 3600,
        type: "ephemeral",
      });

      expect(calls[0].body).toEqual({
        ttlSeconds: 3600,
        type: "ephemeral",
      });
    });

    it("sends all options in request body", async () => {
      const repoToken = makeRepoToken();
      const { fetch, calls } = mockOk(repoToken);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      await tokens.create(repoId, {
        ttlSeconds: 1800,
        scopes: ["read"],
        type: "import",
      });

      expect(calls[0].body).toEqual({
        ttlSeconds: 1800,
        scopes: ["read"],
        type: "import",
      });
    });

    it("returns RepoToken shape with all fields", async () => {
      const repoToken = makeRepoToken();
      const { fetch } = mockOk(repoToken);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      const result = await tokens.create(repoId, { ttlSeconds: 3600 });

      expect(result.token).toBe("gf_repo_abc123xyz");
      expect(result.patId).toBe("pat-0001-0002-0003");
      expect(result.expiresAt).toBe("2026-03-26T01:00:00.000Z");
      expect(result.remoteUrl).toBe(
        "https://x:gf_repo_abc123xyz@gitforge.dev/testuser/my-repo.git",
      );
    });
  });

  describe("errors", () => {
    it("throws GitForgeError on 401 unauthorized", async () => {
      const { fetch } = mockError(401, "unauthorized", "Invalid or expired token");
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      try {
        await tokens.create(repoId, { ttlSeconds: 3600 });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(401);
        expect(e.code).toBe("unauthorized");
        expect(e.message).toBe("Invalid or expired token");
      }
    });

    it("throws GitForgeError on 404 repo not found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      try {
        await tokens.create(repoId, { ttlSeconds: 3600 });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Repository not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeRepoToken());
      const client = new HttpClient({ baseUrl, token, fetch });
      const tokens = new TokensResource(client);

      await tokens.create(repoId, { ttlSeconds: 3600 });

      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
