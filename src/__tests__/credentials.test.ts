import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { CredentialsResource } from "../resources/credentials";
import type { GitCredential } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";
const credId = "cred-0001-aaaa-bbbb-cccc";

function makeCredential(overrides: Partial<GitCredential> = {}): GitCredential {
  return {
    id: credId,
    provider: "github",
    username: null,
    label: null,
    createdAt: "2026-03-26T12:00:00.000Z",
    ...overrides,
  };
}

describe("CredentialsResource", () => {
  describe("create", () => {
    it("sends POST /repos/:id/credentials with provider and token", async () => {
      const cred = makeCredential();
      const { fetch, calls } = mockOk(cred);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.create(repoId, {
        provider: "github",
        token: "ghp_abc123",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/credentials`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        provider: "github",
        token: "ghp_abc123",
      });
      expect(result).toEqual(cred);
    });

    it("sends POST with all options (username, label, sourceUrl)", async () => {
      const cred = makeCredential({
        username: "myuser",
        label: "Production mirror token",
      });
      const { fetch, calls } = mockOk(cred);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.create(repoId, {
        provider: "gitlab",
        token: "glpat_xyz789",
        username: "myuser",
        label: "Production mirror token",
        sourceUrl: "https://gitlab.com/org/repo.git",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        provider: "gitlab",
        token: "glpat_xyz789",
        username: "myuser",
        label: "Production mirror token",
        sourceUrl: "https://gitlab.com/org/repo.git",
      });
      expect(result.username).toBe("myuser");
      expect(result.label).toBe("Production mirror token");
    });
  });

  describe("list", () => {
    it("sends GET /repos/:id/credentials", async () => {
      const creds = [
        makeCredential({ id: "cred-1", provider: "github" }),
        makeCredential({ id: "cred-2", provider: "gitlab", label: "backup" }),
      ];
      const { fetch, calls } = mockOk(creds);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/credentials`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("cred-1");
      expect(result[1].label).toBe("backup");
    });
  });

  describe("update", () => {
    it("sends PATCH /repos/:id/credentials/:credId with token", async () => {
      const cred = makeCredential();
      const { fetch, calls } = mockOk(cred);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.update(repoId, credId, {
        token: "ghp_new_token_456",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/credentials/${credId}`);
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({ token: "ghp_new_token_456" });
      expect(result).toEqual(cred);
    });

    it("sends PATCH with label option", async () => {
      const cred = makeCredential({ label: "Updated label" });
      const { fetch, calls } = mockOk(cred);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.update(repoId, credId, {
        label: "Updated label",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].body).toEqual({ label: "Updated label" });
      expect(result.label).toBe("Updated label");
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id/credentials/:credId", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.delete(repoId, credId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/credentials/${credId}`);
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("response shape", () => {
    it("returns correct GitCredential shape (id, provider, username, label, createdAt — NOT token)", async () => {
      const cred = makeCredential({
        id: "cred-shape-test",
        provider: "github",
        username: "octocat",
        label: "CI token",
        createdAt: "2026-01-15T09:30:00.000Z",
      });
      const { fetch } = mockOk(cred);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      const result = await credentials.create(repoId, {
        provider: "github",
        token: "ghp_secret",
      });

      expect(result.id).toBe("cred-shape-test");
      expect(result.provider).toBe("github");
      expect(result.username).toBe("octocat");
      expect(result.label).toBe("CI token");
      expect(result.createdAt).toBe("2026-01-15T09:30:00.000Z");
      // token field should NOT be present in the response type
      expect((result as Record<string, unknown>).token).toBeUndefined();
    });
  });

  describe("errors", () => {
    it("throws GitForgeError on 404", async () => {
      const { fetch } = mockError(404, "not_found", "Credential not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      try {
        await credentials.update(repoId, "nonexistent-id", { token: "x" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Credential not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeCredential());
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      await credentials.create(repoId, { provider: "github", token: "ghp_x" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on list", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      await credentials.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on update", async () => {
      const { fetch, calls } = mockOk(makeCredential());
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      await credentials.update(repoId, credId, { label: "x" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const credentials = new CredentialsResource(client);

      await credentials.delete(repoId, credId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
