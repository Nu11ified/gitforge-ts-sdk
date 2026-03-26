import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { createMockFetch, mockOk, mockError } from "./helpers";

describe("HttpClient", () => {
  const baseUrl = "https://api.gitforge.dev";
  const token = "gf_test_token_abc123";

  function makeClient(fetchFn: typeof globalThis.fetch) {
    return new HttpClient({ baseUrl, token, fetch: fetchFn });
  }

  describe("authentication", () => {
    it("sends Bearer token on every GET request", async () => {
      const { fetch, calls } = mockOk({ ok: true });
      const client = makeClient(fetch);
      await client.get("/repos");
      expect(calls).toHaveLength(1);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("sends Bearer token on POST request", async () => {
      const { fetch, calls } = mockOk({ id: "1" });
      const client = makeClient(fetch);
      await client.post("/repos", { name: "test" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("sends Bearer token on PATCH request", async () => {
      const { fetch, calls } = mockOk({ id: "1" });
      const client = makeClient(fetch);
      await client.patch("/repos/1", { name: "updated" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("sends Bearer token on DELETE request", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = makeClient(fetch);
      await client.delete("/repos/1");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });

  describe("URL construction", () => {
    it("builds full URL from baseUrl + path", async () => {
      const { fetch, calls } = mockOk([]);
      const client = makeClient(fetch);
      await client.get("/repos");
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos");
    });

    it("strips trailing slash from baseUrl", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({
        baseUrl: "https://api.gitforge.dev///",
        token,
        fetch,
      });
      await client.get("/repos");
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos");
    });

    it("appends query params to GET requests", async () => {
      const { fetch, calls } = mockOk({ data: [] });
      const client = makeClient(fetch);
      await client.get("/repos", { limit: "10", offset: "20" });
      expect(calls[0].url).toBe(
        "https://api.gitforge.dev/repos?limit=10&offset=20",
      );
    });

    it("does not append query string when query is empty", async () => {
      const { fetch, calls } = mockOk([]);
      const client = makeClient(fetch);
      await client.get("/repos", {});
      expect(calls[0].url).toBe("https://api.gitforge.dev/repos");
    });
  });

  describe("POST", () => {
    it("sends JSON body with Content-Type header", async () => {
      const { fetch, calls } = mockOk({ id: "new-repo" });
      const client = makeClient(fetch);
      await client.post("/repos", { name: "my-repo", visibility: "private" });

      expect(calls[0].method).toBe("POST");
      expect(calls[0].headers["Content-Type"]).toBe("application/json");
      expect(calls[0].body).toEqual({ name: "my-repo", visibility: "private" });
    });

    it("sends undefined body when no body provided", async () => {
      const { fetch, calls } = mockOk({ ok: true });
      const client = makeClient(fetch);
      await client.post("/repos/1/sync");

      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toBeUndefined();
    });
  });

  describe("PATCH", () => {
    it("sends JSON body with Content-Type header", async () => {
      const { fetch, calls } = mockOk({ id: "1", name: "updated" });
      const client = makeClient(fetch);
      await client.patch("/repos/1", { name: "updated" });

      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].headers["Content-Type"]).toBe("application/json");
      expect(calls[0].body).toEqual({ name: "updated" });
    });
  });

  describe("DELETE", () => {
    it("returns null on 204 No Content", async () => {
      const { fetch } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = makeClient(fetch);
      const result = await client.delete("/repos/1");
      expect(result).toBeNull();
    });

    it("supports query parameters", async () => {
      const { fetch, calls } = createMockFetch([
        { status: 204, body: null, ok: true },
      ]);
      const client = makeClient(fetch);
      await client.delete("/refs/heads/feature", { force: "true" });
      expect(calls[0].url).toBe(
        "https://api.gitforge.dev/refs/heads/feature?force=true",
      );
      expect(calls[0].method).toBe("DELETE");
    });
  });

  describe("error handling", () => {
    it("maps non-ok response to GitForgeError with status, code, message", async () => {
      const { fetch } = mockError(403, "forbidden", "You do not have access");
      const client = makeClient(fetch);

      try {
        await client.get("/repos/secret");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(403);
        expect(e.code).toBe("forbidden");
        expect(e.message).toBe("You do not have access");
      }
    });

    it("handles 404 Not Found", async () => {
      const { fetch } = mockError(404, "not_found", "Repository not found");
      const client = makeClient(fetch);

      try {
        await client.get("/repos/nonexistent");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Repository not found");
      }
    });

    it("handles 409 Conflict", async () => {
      const { fetch } = mockError(409, "branch_moved", "Branch was updated");
      const client = makeClient(fetch);

      try {
        await client.post("/repos/1/commits", { branch: "main" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(409);
        expect(e.code).toBe("branch_moved");
      }
    });

    it("handles 500 Internal Server Error", async () => {
      const { fetch } = mockError(500, "internal", "Something went wrong");
      const client = makeClient(fetch);

      try {
        await client.get("/repos");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(500);
        expect(e.code).toBe("internal");
        expect(e.message).toBe("Something went wrong");
      }
    });

    it("uses fallback code and message when body lacks them", async () => {
      const { fetch } = createMockFetch([
        { status: 502, body: {}, ok: false },
      ]);
      const client = makeClient(fetch);

      try {
        await client.get("/repos");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(502);
        expect(e.code).toBe("unknown");
        expect(e.message).toBe("HTTP 502");
      }
    });
  });

  describe("response handling", () => {
    it("handles 204 No Content and returns null", async () => {
      const { fetch } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = makeClient(fetch);
      const result = await client.delete("/repos/1");
      expect(result).toBeNull();
    });

    it("returns parsed JSON body on success", async () => {
      const payload = { id: "repo-1", name: "test-repo" };
      const { fetch } = mockOk(payload);
      const client = makeClient(fetch);
      const result = await client.get("/repos/repo-1");
      expect(result).toEqual(payload);
    });
  });

  describe("sequential requests", () => {
    it("multiple sequential requests work correctly", async () => {
      const { fetch, calls } = createMockFetch([
        { status: 200, body: { id: "1" }, ok: true },
        { status: 200, body: { id: "2" }, ok: true },
        { status: 200, body: { id: "3" }, ok: true },
      ]);
      const client = makeClient(fetch);

      const r1 = await client.get("/repos/1");
      const r2 = await client.post("/repos", { name: "new" });
      const r3 = await client.patch("/repos/1", { name: "updated" });

      expect(r1).toEqual({ id: "1" });
      expect(r2).toEqual({ id: "2" });
      expect(r3).toEqual({ id: "3" });
      expect(calls).toHaveLength(3);
      expect(calls[0].method).toBe("GET");
      expect(calls[1].method).toBe("POST");
      expect(calls[2].method).toBe("PATCH");
    });
  });
});
