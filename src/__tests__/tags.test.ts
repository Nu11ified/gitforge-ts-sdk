import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { TagsResource } from "../resources/tags";
import type { Tag, PaginatedResponse } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    name: "v1.0.0",
    sha: "abc123def456789",
    ...overrides,
  };
}

function makePaginated(tags: Tag[], overrides: Partial<PaginatedResponse<Tag>> = {}): PaginatedResponse<Tag> {
  return {
    data: tags,
    total: tags.length,
    limit: 50,
    offset: 0,
    hasMore: false,
    ...overrides,
  };
}

describe("TagsResource", () => {
  describe("list", () => {
    it("sends GET /repos/:id/tags with no extra query params", async () => {
      const paginated = makePaginated([makeTag()]);
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tags`);
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("v1.0.0");
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("appends limit and offset query params", async () => {
      const paginated = makePaginated([makeTag()], {
        total: 100,
        limit: 10,
        offset: 5,
        hasMore: true,
      });
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.list(repoId, { limit: 10, offset: 5 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tags?limit=10&offset=5`);
      expect(calls[0].method).toBe("GET");
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it("returns correct PaginatedResponse<Tag> shape", async () => {
      const tags = [
        makeTag({ name: "v1.0.0", sha: "aaa111" }),
        makeTag({ name: "v2.0.0", sha: "bbb222" }),
      ];
      const paginated = makePaginated(tags, { total: 2 });
      const { fetch } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new TagsResource(client);

      const result = await resource.list(repoId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: "v1.0.0", sha: "aaa111" });
      expect(result.data[1]).toEqual({ name: "v2.0.0", sha: "bbb222" });
      expect(result.total).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe("create", () => {
    it("sends POST /repos/:id/tags with name and sha", async () => {
      const tag = makeTag({ name: "v1.0.0", sha: "abc123" });
      const { fetch, calls } = mockOk(tag);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.create(repoId, { name: "v1.0.0", sha: "abc123" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tags`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({ name: "v1.0.0", sha: "abc123" });
      expect(result).toEqual(tag);
    });

    it("returns correct Tag shape", async () => {
      const tag = makeTag({ name: "release-v3", sha: "deadbeef12345678" });
      const { fetch } = mockOk(tag);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.create(repoId, { name: "release-v3", sha: "deadbeef12345678" });

      expect(result.name).toBe("release-v3");
      expect(result.sha).toBe("deadbeef12345678");
    });

    it("throws GitForgeError 400 on validation error (missing name/sha)", async () => {
      const { fetch } = mockError(400, "validation_error", "name and sha are required");
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      try {
        await tags.create(repoId, { name: "", sha: "" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(400);
        expect(e.code).toBe("validation_error");
        expect(e.message).toBe("name and sha are required");
      }
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id/tags/v1.0.0", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.delete(repoId, "v1.0.0");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tags/v1.0.0`);
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });

    it("URL-encodes slash in tag name (release/v2)", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      const result = await tags.delete(repoId, "release/v2");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/tags/${encodeURIComponent("release/v2")}`,
      );
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });

    it("throws GitForgeError 404 when tag not found", async () => {
      const { fetch } = mockError(404, "not_found", "Tag not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      try {
        await tags.delete(repoId, "nonexistent");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Tag not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on list", async () => {
      const paginated = makePaginated([]);
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      await tags.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeTag());
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      await tags.create(repoId, { name: "v1.0.0", sha: "abc123" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const tags = new TagsResource(client);

      await tags.delete(repoId, "v1.0.0");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
