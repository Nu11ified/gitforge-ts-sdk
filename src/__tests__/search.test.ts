import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { SearchResource } from "../resources/search";
import type { SearchResult, DiffEntry, Comparison } from "../types";
import type { SearchCodeResult } from "../resources/search";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    repoId,
    repoName: "my-repo",
    filePath: "src/index.ts",
    branch: "main",
    language: "typescript",
    matches: [{ line: 10, content: 'console.log("hello")', highlight: "hello" }],
    ...overrides,
  };
}

function makeSearchCodeResult(overrides: Partial<SearchCodeResult> = {}): SearchCodeResult {
  return {
    results: [makeSearchResult()],
    total: 1,
    page: 1,
    perPage: 20,
    ...overrides,
  };
}

function makeDiffEntry(overrides: Partial<DiffEntry> = {}): DiffEntry {
  return {
    path: "src/index.ts",
    status: "modified",
    additions: 5,
    deletions: 2,
    patch: "@@ -1,3 +1,6 @@\n+new line",
    ...overrides,
  };
}

function makeComparison(overrides: Partial<Comparison> = {}): Comparison {
  return {
    ahead: 3,
    behind: 1,
    commits: [
      { sha: "abc123", message: "feat: add feature", author: "dev", date: "2026-03-25T00:00:00Z" },
    ],
    files: [{ path: "src/index.ts", status: "modified" }],
    ...overrides,
  };
}

describe("SearchResource", () => {
  describe("searchCode", () => {
    it("sends GET /repos/:id/search?q=hello with only required query param", async () => {
      const result = makeSearchCodeResult();
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.searchCode(repoId, { query: "hello" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/search?q=hello`);
      expect(calls[0].method).toBe("GET");
      expect(res.results).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.page).toBe(1);
      expect(res.perPage).toBe(20);
    });

    it("maps language option to lang query param", async () => {
      const result = makeSearchCodeResult();
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      await search.searchCode(repoId, { query: "hello", language: "typescript" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("lang=typescript");
      expect(calls[0].url).toContain("q=hello");
    });

    it("includes branch, perPage, and page query params", async () => {
      const result = makeSearchCodeResult({ page: 2, perPage: 10, total: 50 });
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.searchCode(repoId, {
        query: "hello",
        branch: "develop",
        perPage: 10,
        page: 2,
      });

      expect(calls).toHaveLength(1);
      const url = calls[0].url;
      expect(url).toContain("q=hello");
      expect(url).toContain("branch=develop");
      expect(url).toContain("perPage=10");
      expect(url).toContain("page=2");
      expect(res.page).toBe(2);
      expect(res.perPage).toBe(10);
      expect(res.total).toBe(50);
    });

    it("does not include optional params when not provided", async () => {
      const result = makeSearchCodeResult();
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      await search.searchCode(repoId, { query: "test" });

      expect(calls).toHaveLength(1);
      const url = calls[0].url;
      expect(url).not.toContain("lang=");
      expect(url).not.toContain("branch=");
      expect(url).not.toContain("perPage=");
      expect(url).not.toContain("page=");
    });

    it("returns correct SearchCodeResult shape with matches", async () => {
      const searchResult = makeSearchResult({
        filePath: "lib/utils.ts",
        language: "typescript",
        matches: [
          { line: 5, content: "function hello() {}", highlight: "hello" },
          { line: 12, content: 'return "hello world"', highlight: "hello" },
        ],
      });
      const result = makeSearchCodeResult({ results: [searchResult], total: 1 });
      const { fetch } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.searchCode(repoId, { query: "hello" });

      expect(res.results[0].filePath).toBe("lib/utils.ts");
      expect(res.results[0].language).toBe("typescript");
      expect(res.results[0].matches).toHaveLength(2);
      expect(res.results[0].matches[0].line).toBe(5);
      expect(res.results[0].matches[1].content).toBe('return "hello world"');
    });
  });

  describe("compare", () => {
    it("sends GET /repos/:id/compare?base=main&head=feature", async () => {
      const comparison = makeComparison();
      const { fetch, calls } = mockOk(comparison);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.compare(repoId, "main", "feature");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/compare?base=main&head=feature`);
      expect(calls[0].method).toBe("GET");
      expect(res.ahead).toBe(3);
      expect(res.behind).toBe(1);
      expect(res.commits).toHaveLength(1);
      expect(res.files).toHaveLength(1);
    });

    it("returns correct Comparison shape", async () => {
      const comparison = makeComparison({
        ahead: 5,
        behind: 0,
        commits: [
          { sha: "aaa", message: "first", author: "dev1", date: "2026-03-20T00:00:00Z" },
          { sha: "bbb", message: "second", author: "dev2", date: "2026-03-21T00:00:00Z" },
        ],
        files: [
          { path: "a.ts", status: "added" },
          { path: "b.ts", status: "deleted" },
        ],
      });
      const { fetch } = mockOk(comparison);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.compare(repoId, "main", "feature");

      expect(res.ahead).toBe(5);
      expect(res.behind).toBe(0);
      expect(res.commits).toHaveLength(2);
      expect(res.commits[0].sha).toBe("aaa");
      expect(res.commits[1].message).toBe("second");
      expect(res.files).toHaveLength(2);
      expect(res.files[0].status).toBe("added");
      expect(res.files[1].path).toBe("b.ts");
    });
  });

  describe("compareDiff", () => {
    it("sends GET /repos/:id/compare/diff?base=main&head=feature", async () => {
      const diffs = [makeDiffEntry()];
      const { fetch, calls } = mockOk(diffs);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.compareDiff(repoId, "main", "feature");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/compare/diff?base=main&head=feature`);
      expect(calls[0].method).toBe("GET");
      expect(res).toHaveLength(1);
      expect(res[0].path).toBe("src/index.ts");
      expect(res[0].status).toBe("modified");
      expect(res[0].additions).toBe(5);
      expect(res[0].deletions).toBe(2);
      expect(res[0].patch).toContain("+new line");
    });

    it("returns correct DiffEntry[] shape with multiple entries", async () => {
      const diffs = [
        makeDiffEntry({ path: "a.ts", status: "added", additions: 10, deletions: 0 }),
        makeDiffEntry({ path: "b.ts", status: "deleted", additions: 0, deletions: 15 }),
      ];
      const { fetch } = mockOk(diffs);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      const res = await search.compareDiff(repoId, "v1.0", "v2.0");

      expect(res).toHaveLength(2);
      expect(res[0].path).toBe("a.ts");
      expect(res[0].additions).toBe(10);
      expect(res[1].path).toBe("b.ts");
      expect(res[1].deletions).toBe(15);
    });
  });

  describe("error handling", () => {
    it("throws GitForgeError 404 on searchCode when repo not found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      try {
        await search.searchCode(repoId, { query: "hello" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Repository not found");
      }
    });

    it("throws GitForgeError 404 on compare when repo not found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      try {
        await search.compare(repoId, "main", "feature");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
      }
    });

    it("throws GitForgeError 404 on compareDiff when repo not found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      try {
        await search.compareDiff(repoId, "main", "feature");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on searchCode", async () => {
      const result = makeSearchCodeResult();
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      await search.searchCode(repoId, { query: "test" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on compare", async () => {
      const comparison = makeComparison();
      const { fetch, calls } = mockOk(comparison);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      await search.compare(repoId, "main", "feature");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on compareDiff", async () => {
      const diffs = [makeDiffEntry()];
      const { fetch, calls } = mockOk(diffs);
      const client = new HttpClient({ baseUrl, token, fetch });
      const search = new SearchResource(client);

      await search.compareDiff(repoId, "main", "feature");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
