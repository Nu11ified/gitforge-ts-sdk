import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { ReposResource } from "../resources/repos";
import type { Repo, PaginatedResponse } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    id: "d361989f-a82e-4d64-aa30-25e6521e4f31",
    name: "my-repo",
    slug: "my-repo",
    ownerSlug: "testuser",
    description: "A test repository",
    visibility: "public",
    defaultBranch: "main",
    lfsEnabled: false,
    isArchived: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ReposResource", () => {
  describe("create", () => {
    it("sends POST /repos with full options and returns Repo", async () => {
      const repo = makeRepo({ name: "new-repo", visibility: "private" });
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.create({
        name: "new-repo",
        description: "My new repo",
        visibility: "private",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos");
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        name: "new-repo",
        description: "My new repo",
        visibility: "private",
      });
      expect(result).toEqual(repo);
    });

    it("sends POST /repos with minimal options (name only)", async () => {
      const repo = makeRepo({ name: "minimal-repo" });
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.create({ name: "minimal-repo" });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({ name: "minimal-repo" });
      expect(result.name).toBe("minimal-repo");
    });

    it("throws GitForgeError on 409 duplicate name", async () => {
      const { fetch } = mockError(409, "conflict", "Repository name already exists");
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      try {
        await repos.create({ name: "existing-repo" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(409);
        expect(e.code).toBe("conflict");
        expect(e.message).toBe("Repository name already exists");
      }
    });
  });

  describe("list", () => {
    it("sends GET /repos with no query params by default", async () => {
      const paginated: PaginatedResponse<Repo> = {
        data: [makeRepo()],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.list();

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos");
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("appends limit and offset as query params", async () => {
      const paginated: PaginatedResponse<Repo> = {
        data: [makeRepo()],
        total: 100,
        limit: 10,
        offset: 20,
        hasMore: true,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.list({ limit: 10, offset: 20 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos?limit=10&offset=20");
      expect(calls[0].method).toBe("GET");
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      expect(result.hasMore).toBe(true);
    });

    it("handles empty list", async () => {
      const paginated: PaginatedResponse<Repo> = {
        data: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      };
      const { fetch } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.list();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("get", () => {
    it("sends GET /repos/:id and returns Repo", async () => {
      const repo = makeRepo();
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.get("d361989f-a82e-4d64-aa30-25e6521e4f31");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        "https://api.gitforge.dev/repos/d361989f-a82e-4d64-aa30-25e6521e4f31",
      );
      expect(calls[0].method).toBe("GET");
      expect(result).toEqual(repo);
    });

    it("throws GitForgeError on 404 not found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      try {
        await repos.get("nonexistent-id");
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

  describe("update", () => {
    it("sends PATCH /repos/:id with multiple fields", async () => {
      const repo = makeRepo({ name: "renamed", description: "Updated desc" });
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.update("d361989f-a82e-4d64-aa30-25e6521e4f31", {
        name: "renamed",
        description: "Updated desc",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        "https://api.gitforge.dev/repos/d361989f-a82e-4d64-aa30-25e6521e4f31",
      );
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({
        name: "renamed",
        description: "Updated desc",
      });
      expect(result.name).toBe("renamed");
    });

    it("sends PATCH /repos/:id with partial update (defaultBranch only)", async () => {
      const repo = makeRepo({ defaultBranch: "develop" });
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.update("d361989f-a82e-4d64-aa30-25e6521e4f31", {
        defaultBranch: "develop",
      });

      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({ defaultBranch: "develop" });
      expect(result.defaultBranch).toBe("develop");
    });

    it("supports setting mergeCommitTemplate to null", async () => {
      const repo = makeRepo();
      const { fetch, calls } = mockOk(repo);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.update("d361989f-a82e-4d64-aa30-25e6521e4f31", {
        mergeCommitTemplate: null,
      });

      expect(calls[0].body).toEqual({ mergeCommitTemplate: null });
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id and returns null", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.delete("d361989f-a82e-4d64-aa30-25e6521e4f31");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        "https://api.gitforge.dev/repos/d361989f-a82e-4d64-aa30-25e6521e4f31",
      );
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeRepo());
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.create({ name: "test" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on list", async () => {
      const paginated: PaginatedResponse<Repo> = {
        data: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.list();
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on get", async () => {
      const { fetch, calls } = mockOk(makeRepo());
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.get("some-id");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on update", async () => {
      const { fetch, calls } = mockOk(makeRepo());
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.update("some-id", { name: "updated" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.delete("some-id");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });

  describe("notes", () => {
    it("createNote sends POST /repos/:id/notes with add action", async () => {
      const { fetch, calls } = mockOk({ sha: "a".repeat(40), refSha: "b".repeat(40), success: true });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.createNote("repo-1", "a".repeat(40), "LGTM", { name: "Jane", email: "j@e.com" });

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/notes");
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        sha: "a".repeat(40), action: "add", note: "LGTM",
        author: { name: "Jane", email: "j@e.com" },
      });
      expect(result.success).toBe(true);
    });

    it("appendNote sends POST with append action", async () => {
      const { fetch, calls } = mockOk({ sha: "a".repeat(40), refSha: "b".repeat(40), success: true });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.appendNote("repo-1", "a".repeat(40), "More notes", { name: "Jane", email: "j@e.com" });

      expect(calls[0].body).toEqual({
        sha: "a".repeat(40), action: "append", note: "More notes",
        author: { name: "Jane", email: "j@e.com" },
      });
    });

    it("getNote sends GET /repos/:id/notes/:sha", async () => {
      const { fetch, calls } = mockOk({ sha: "a".repeat(40), note: "Test", refSha: "b".repeat(40) });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.getNote("repo-1", "a".repeat(40));

      expect(calls[0].url).toBe(`https://api.gitforge.dev/repos/repo-1/notes/${"a".repeat(40)}`);
      expect(calls[0].method).toBe("GET");
      expect(result.note).toBe("Test");
    });

    it("deleteNote sends DELETE /repos/:id/notes/:sha with body", async () => {
      const { fetch, calls } = mockOk({ sha: "a".repeat(40), refSha: "b".repeat(40), success: true });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.deleteNote("repo-1", "a".repeat(40), { author: { name: "Jane", email: "j@e.com" } });

      expect(calls[0].url).toBe(`https://api.gitforge.dev/repos/repo-1/notes/${"a".repeat(40)}`);
      expect(calls[0].method).toBe("DELETE");
    });
  });

  describe("restoreCommit", () => {
    it("sends POST /repos/:id/restore-commit", async () => {
      const { fetch, calls } = mockOk({ commitSha: "c".repeat(40), treeSha: "d".repeat(40), targetBranch: "main", success: true });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.restoreCommit("repo-1", {
        targetBranch: "main",
        targetCommitSha: "a".repeat(40),
        author: { name: "Agent", email: "a@e.com" },
      });

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/restore-commit");
      expect(calls[0].method).toBe("POST");
      expect(result.success).toBe(true);
    });
  });

  describe("listFilesWithMetadata", () => {
    it("sends GET /repos/:id/files/metadata", async () => {
      const { fetch, calls } = mockOk({ files: [], commits: {}, ref: "main" });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      await repos.listFilesWithMetadata("repo-1", { ref: "main" });

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/files/metadata?ref=main");
      expect(calls[0].method).toBe("GET");
    });
  });

  describe("pullUpstream", () => {
    it("sends POST /repos/:id/pull-upstream", async () => {
      const { fetch, calls } = mockOk({ status: "fast_forward", oldSha: "a".repeat(40), newSha: "b".repeat(40), branch: "main", success: true });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.pullUpstream("repo-1", { branch: "main" });

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/pull-upstream");
      expect(calls[0].method).toBe("POST");
      expect(result.status).toBe("fast_forward");
    });
  });

  describe("detachUpstream", () => {
    it("sends DELETE /repos/:id/base", async () => {
      const { fetch, calls } = mockOk({ message: "repository detached" });
      const client = new HttpClient({ baseUrl, token, fetch });
      const repos = new ReposResource(client);

      const result = await repos.detachUpstream("repo-1");

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/base");
      expect(calls[0].method).toBe("DELETE");
      expect(result.message).toBe("repository detached");
    });
  });

  describe("getRawFile", () => {
    it("sends GET /repos/:id/raw/:ref with path query", async () => {
      // Need a mock that supports arrayBuffer
      const calls: any[] = [];
      const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
        calls.push({ url: urlStr, method: init?.method ?? "GET", headers: init?.headers ?? {} });
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(5),
        } as Response;
      };
      const client = new HttpClient({ baseUrl, token, fetch: mockFetch as typeof fetch });
      const repos = new ReposResource(client);

      const result = await repos.getRawFile("repo-1", "main", "src/index.ts");

      expect(calls[0].url).toBe("https://api.gitforge.dev/repos/repo-1/raw/main?path=src%2Findex.ts");
      expect(calls[0].method).toBe("GET");
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });
});
