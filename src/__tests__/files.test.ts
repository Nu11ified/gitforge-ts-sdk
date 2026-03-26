import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { FilesResource } from "../resources/files";
import type { TreeEntry, BlobContent } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";
const ref = "main";

function makeTreeEntry(overrides: Partial<TreeEntry> = {}): TreeEntry {
  return {
    name: "README.md",
    type: "blob",
    mode: "100644",
    sha: "abc123def456789",
    ...overrides,
  };
}

function makeBlobContent(overrides: Partial<BlobContent> = {}): BlobContent {
  return {
    content: "# Hello World\n",
    size: 15,
    ...overrides,
  };
}

describe("FilesResource", () => {
  describe("listFiles", () => {
    it("sends GET /repos/:id/tree/:ref with no extra query params", async () => {
      const entries = [makeTreeEntry(), makeTreeEntry({ name: "src", type: "tree", mode: "040000" })];
      const { fetch, calls } = mockOk(entries);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.listFiles(repoId, ref);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tree/${ref}`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("README.md");
      expect(result[0].type).toBe("blob");
      expect(result[0].mode).toBe("100644");
      expect(result[0].sha).toBe("abc123def456789");
      expect(result[1].name).toBe("src");
      expect(result[1].type).toBe("tree");
    });

    it("adds path query param when opts.path is provided", async () => {
      const entries = [makeTreeEntry({ name: "index.ts" })];
      const { fetch, calls } = mockOk(entries);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.listFiles(repoId, ref, { path: "src" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tree/${ref}?path=src`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("index.ts");
    });

    it("adds ephemeral=true query param when opts.ephemeral is true", async () => {
      const entries = [makeTreeEntry()];
      const { fetch, calls } = mockOk(entries);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.listFiles(repoId, ref, { ephemeral: true });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/tree/${ref}?ephemeral=true`);
      expect(result).toHaveLength(1);
    });

    it("returns correct TreeEntry[] shape", async () => {
      const entries: TreeEntry[] = [
        { name: "file.txt", type: "blob", mode: "100644", sha: "aaa111" },
        { name: "lib", type: "tree", mode: "040000", sha: "bbb222" },
        { name: "run.sh", type: "blob", mode: "100755", sha: "ccc333" },
      ];
      const { fetch } = mockOk(entries);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.listFiles(repoId, ref);

      expect(result).toEqual(entries);
    });
  });

  describe("getFile", () => {
    it("sends GET /repos/:id/blob/:ref?path=README.md", async () => {
      const blob = makeBlobContent();
      const { fetch, calls } = mockOk(blob);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.getFile(repoId, ref, "README.md");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/blob/${ref}?path=README.md`);
      expect(calls[0].method).toBe("GET");
      expect(result.content).toBe("# Hello World\n");
      expect(result.size).toBe(15);
    });

    it("adds ephemeral=true query param alongside path", async () => {
      const blob = makeBlobContent({ content: "export default {};", size: 18 });
      const { fetch, calls } = mockOk(blob);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.getFile(repoId, ref, "src/index.ts", { ephemeral: true });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain(`/repos/${repoId}/blob/${ref}?`);
      // Verify both params are present
      const url = new URL(calls[0].url);
      expect(url.searchParams.get("path")).toBe("src/index.ts");
      expect(url.searchParams.get("ephemeral")).toBe("true");
      expect(result.content).toBe("export default {};");
      expect(result.size).toBe(18);
    });

    it("returns correct BlobContent shape", async () => {
      const blob: BlobContent = { content: "const x = 42;", size: 13 };
      const { fetch } = mockOk(blob);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      const result = await files.getFile(repoId, ref, "test.js");

      expect(result).toEqual(blob);
    });
  });

  describe("error handling", () => {
    it("throws GitForgeError 404 when file not found", async () => {
      const { fetch } = mockError(404, "not_found", "File not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      try {
        await files.getFile(repoId, ref, "nonexistent.txt");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("File not found");
      }
    });

    it("throws GitForgeError 404 when tree path not found", async () => {
      const { fetch } = mockError(404, "not_found", "Path not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      try {
        await files.listFiles(repoId, ref, { path: "nonexistent/dir" });
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on listFiles", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      await files.listFiles(repoId, ref);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on getFile", async () => {
      const { fetch, calls } = mockOk(makeBlobContent());
      const client = new HttpClient({ baseUrl, token, fetch });
      const files = new FilesResource(client);

      await files.getFile(repoId, ref, "README.md");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
