import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { BranchesResource } from "../resources/branches";
import type { Branch, PaginatedResponse } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    name: "main",
    sha: "abc123def456789",
    ...overrides,
  };
}

function makePaginated(branches: Branch[], overrides: Partial<PaginatedResponse<Branch>> = {}): PaginatedResponse<Branch> {
  return {
    data: branches,
    total: branches.length,
    limit: 50,
    offset: 0,
    hasMore: false,
    ...overrides,
  };
}

describe("BranchesResource", () => {
  describe("list", () => {
    it("sends GET /repos/:id/branches with no extra query params", async () => {
      const paginated = makePaginated([makeBranch()]);
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/branches`);
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("main");
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("appends limit and offset query params", async () => {
      const paginated = makePaginated([makeBranch()], {
        total: 100,
        limit: 10,
        offset: 20,
        hasMore: true,
      });
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.list(repoId, { limit: 10, offset: 20 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/branches?limit=10&offset=20`);
      expect(calls[0].method).toBe("GET");
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      expect(result.hasMore).toBe(true);
    });

    it("adds namespace=ephemeral query param", async () => {
      const paginated = makePaginated([
        makeBranch({ name: "ephemeral/preview-1", expiresAt: "2026-04-01T00:00:00.000Z" }),
      ]);
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.list(repoId, { namespace: "ephemeral" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/branches?namespace=ephemeral`);
      expect(result.data[0].expiresAt).toBe("2026-04-01T00:00:00.000Z");
    });
  });

  describe("create", () => {
    it("sends POST /repos/:id/branches with name and baseBranch", async () => {
      const branch = makeBranch({ name: "feature/new", sha: "def456abc789" });
      const { fetch, calls } = mockOk(branch);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.create(repoId, {
        name: "feature/new",
        baseBranch: "main",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/branches`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        name: "feature/new",
        baseBranch: "main",
      });
      expect(result).toEqual(branch);
    });

    it("sends POST with ephemeral options (targetIsEphemeral, ttlSeconds)", async () => {
      const branch = makeBranch({
        name: "preview/deploy-42",
        sha: "aaa111bbb222",
        expiresAt: "2026-03-27T01:00:00.000Z",
      });
      const { fetch, calls } = mockOk(branch);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.create(repoId, {
        name: "preview/deploy-42",
        targetIsEphemeral: true,
        ttlSeconds: 3600,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        name: "preview/deploy-42",
        targetIsEphemeral: true,
        ttlSeconds: 3600,
      });
      expect(result.expiresAt).toBe("2026-03-27T01:00:00.000Z");
    });

    it("sends POST with specific sha", async () => {
      const branch = makeBranch({ name: "hotfix/urgent", sha: "deadbeef12345678" });
      const { fetch, calls } = mockOk(branch);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.create(repoId, {
        name: "hotfix/urgent",
        sha: "deadbeef12345678",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        name: "hotfix/urgent",
        sha: "deadbeef12345678",
      });
      expect(result.sha).toBe("deadbeef12345678");
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id/branches/:name with URL-encoded name", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.delete(repoId, "feature/my-branch");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/branches/${encodeURIComponent("feature/my-branch")}`,
      );
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });

    it("adds namespace=ephemeral query param and URL-encodes slash in name", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.delete(repoId, "feat/foo", { namespace: "ephemeral" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/branches/${encodeURIComponent("feat/foo")}?namespace=ephemeral`,
      );
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("promote", () => {
    it("sends POST /repos/:id/branches/promote with baseBranch", async () => {
      const promoteResult = { targetBranch: "main", commitSha: "abc123" };
      const { fetch, calls } = mockOk(promoteResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.promote(repoId, { baseBranch: "staging" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/branches/promote`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({ baseBranch: "staging" });
      expect(result.targetBranch).toBe("main");
      expect(result.commitSha).toBe("abc123");
    });

    it("sends POST with custom targetBranch", async () => {
      const promoteResult = { targetBranch: "release/v2", commitSha: "def456" };
      const { fetch, calls } = mockOk(promoteResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      const result = await branches.promote(repoId, {
        baseBranch: "develop",
        targetBranch: "release/v2",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].body).toEqual({
        baseBranch: "develop",
        targetBranch: "release/v2",
      });
      expect(result.targetBranch).toBe("release/v2");
      expect(result.commitSha).toBe("def456");
    });

    it("throws GitForgeError 409 when target branch already exists", async () => {
      const { fetch } = mockError(409, "conflict", "Target branch already exists");
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      try {
        await branches.promote(repoId, { baseBranch: "staging" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(409);
        expect(e.code).toBe("conflict");
        expect(e.message).toBe("Target branch already exists");
      }
    });

    it("throws GitForgeError 404 when branch not found", async () => {
      const { fetch } = mockError(404, "not_found", "Branch not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      try {
        await branches.promote(repoId, { baseBranch: "nonexistent" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Branch not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on list", async () => {
      const paginated = makePaginated([]);
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      await branches.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeBranch());
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      await branches.create(repoId, { name: "test" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      await branches.delete(repoId, "test");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on promote", async () => {
      const { fetch, calls } = mockOk({ targetBranch: "main", commitSha: "abc" });
      const client = new HttpClient({ baseUrl, token, fetch });
      const branches = new BranchesResource(client);

      await branches.promote(repoId, { baseBranch: "staging" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
