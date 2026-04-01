import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { BatchResource } from "../resources/batch";
import { mockOk } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";

const batchResponse = {
  results: [{ index: 0, status: "fulfilled", value: { name: "refs/heads/fix", sha: "abc", type: "branch" } }],
  summary: { total: 1, succeeded: 1, failed: 0 },
};

describe("BatchResource", () => {
  describe("createBranches", () => {
    it("sends POST /batch/branches with action=create", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      const result = await batch.createBranches([{ repoId: "r1", name: "fix/cve", fromRef: "main" }]);

      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/batch/branches");
      expect(calls[0].body).toEqual({ action: "create", items: [{ repoId: "r1", name: "fix/cve", fromRef: "main" }] });
      expect(result.summary.succeeded).toBe(1);
    });
  });

  describe("deleteBranches", () => {
    it("sends POST /batch/branches with action=delete", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.deleteBranches([{ repoId: "r1", name: "fix/cve" }]);

      expect(calls[0].body).toEqual({ action: "delete", items: [{ repoId: "r1", name: "fix/cve" }] });
    });
  });

  describe("createCommits", () => {
    it("sends POST /batch/commits", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.createCommits([{ repoId: "r1", ref: "main", message: "fix", files: [{ path: "f.ts", content: "x" }] }]);

      expect(calls[0].url).toContain("/batch/commits");
      expect(calls[0].body).toHaveProperty("items");
    });
  });

  describe("readFiles", () => {
    it("sends POST /batch/files/read", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.readFiles([{ repoId: "r1", path: "package.json" }]);

      expect(calls[0].url).toContain("/batch/files/read");
    });
  });

  describe("writeFiles", () => {
    it("sends POST /batch/files/write", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.writeFiles([{ repoId: "r1", ref: "main", path: "f.ts", content: "x" }]);

      expect(calls[0].url).toContain("/batch/files/write");
    });
  });

  describe("readRefs", () => {
    it("sends POST /batch/refs with action=read", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.readRefs([{ repoId: "r1" }]);

      expect(calls[0].url).toContain("/batch/refs");
      expect(calls[0].body).toEqual({ action: "read", items: [{ repoId: "r1" }] });
    });
  });

  describe("createPrs", () => {
    it("sends POST /batch/prs", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.createPrs([{ repoId: "r1", sourceBranch: "fix", targetBranch: "main", title: "Fix CVE" }]);

      expect(calls[0].url).toContain("/batch/prs");
    });
  });

  describe("diff", () => {
    it("sends POST /batch/diff", async () => {
      const { fetch, calls } = mockOk(batchResponse);
      const client = new HttpClient({ baseUrl, token, fetch });
      const batch = new BatchResource(client);

      await batch.diff([{ repoId: "r1", base: "main", head: "fix" }]);

      expect(calls[0].url).toContain("/batch/diff");
      expect(calls[0].body).toEqual({ items: [{ repoId: "r1", base: "main", head: "fix" }] });
    });
  });
});
