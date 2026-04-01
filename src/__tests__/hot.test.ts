import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { HotResource } from "../resources/hot";
import { mockOk } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

describe("HotResource", () => {
  describe("readFile", () => {
    it("sends GET /repos/:id/hot/files/:path with ref query param", async () => {
      const file = { path: "src/index.ts", content: "export {};", size: 10 };
      const { fetch, calls } = mockOk(file);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      const result = await hot.readFile(repoId, "src/index.ts", { ref: "main" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain(`/repos/${repoId}/hot/files/src/index.ts`);
      expect(calls[0].url).toContain("ref=main");
      expect(calls[0].method).toBe("GET");
      expect(result.content).toBe("export {};");
    });

    it("defaults ref to main when not provided", async () => {
      const file = { path: "README.md", content: "# Hi", size: 4 };
      const { fetch, calls } = mockOk(file);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      await hot.readFile(repoId, "README.md");

      expect(calls[0].url).toContain("ref=main");
    });

    it("passes include options", async () => {
      const file = { path: "f.ts", content: "x", size: 1, lastCommit: { sha: "abc", message: "m", author: "a", date: "d" } };
      const { fetch, calls } = mockOk(file);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      await hot.readFile(repoId, "f.ts", { ref: "dev", include: ["content", "metadata"] });

      expect(calls[0].url).toContain("include=content%2Cmetadata");
    });
  });

  describe("listTree", () => {
    it("sends GET /repos/:id/hot/tree/:path", async () => {
      const tree = { entries: [{ name: "src", path: "src", type: "tree", mode: "040000", sha: "abc" }] };
      const { fetch, calls } = mockOk(tree);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      const result = await hot.listTree(repoId, ".", { ref: "main", depth: 2 });

      expect(calls[0].url).toContain(`/repos/${repoId}/hot/tree/.`);
      expect(calls[0].url).toContain("ref=main");
      expect(calls[0].url).toContain("depth=2");
      expect(result.entries).toHaveLength(1);
    });
  });

  describe("commit", () => {
    it("sends POST /repos/:id/hot/commit with operations", async () => {
      const commitResult = { commitSha: "abc123", treeSha: "def456", parentShas: ["000"], ref: "refs/heads/main" };
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      const result = await hot.commit(repoId, {
        ref: "main",
        message: "update config",
        operations: [{ action: "upsert", path: "config.json", content: "{}" }],
      });

      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain(`/repos/${repoId}/hot/commit`);
      expect(calls[0].body).toEqual({
        ref: "main",
        message: "update config",
        operations: [{ action: "upsert", path: "config.json", content: "{}" }],
      });
      expect(result.commitSha).toBe("abc123");
    });
  });

  describe("listRefs", () => {
    it("sends GET /repos/:id/hot/refs with optional pattern", async () => {
      const refs = { refs: [{ name: "refs/heads/main", sha: "abc", type: "branch" }] };
      const { fetch, calls } = mockOk(refs);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      const result = await hot.listRefs(repoId, { pattern: "refs/heads/*" });

      expect(calls[0].url).toContain(`/repos/${repoId}/hot/refs`);
      expect(calls[0].url).toContain("pattern=refs%2Fheads%2F*");
      expect(result.refs).toHaveLength(1);
    });
  });

  describe("createRef", () => {
    it("sends POST /repos/:id/hot/refs", async () => {
      const ref = { name: "refs/heads/feature", sha: "abc123", type: "branch" };
      const { fetch, calls } = mockOk(ref);
      const client = new HttpClient({ baseUrl, token, fetch });
      const hot = new HotResource(client);

      const result = await hot.createRef(repoId, { name: "feature", sha: "abc123".padEnd(40, "0") });

      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain(`/repos/${repoId}/hot/refs`);
      expect(result.name).toBe("refs/heads/feature");
    });
  });
});
