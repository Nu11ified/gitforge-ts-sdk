import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { CommitsResource, CommitBuilder } from "../resources/commits";
import type { Commit, CommitDetail, DiffEntry, CommitResult } from "../types";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";

function makeCommit(overrides: Partial<Commit> = {}): Commit {
  return {
    sha: "abc123def456789",
    message: "fix: resolve null pointer",
    author: "Alice",
    authorEmail: "alice@example.com",
    date: "2026-03-20T10:00:00.000Z",
    parentShas: ["000111222333444"],
    ...overrides,
  };
}

function makeCommitDetail(overrides: Partial<CommitDetail> = {}): CommitDetail {
  return {
    sha: "abc123def456789",
    message: "fix: resolve null pointer",
    author: "Alice",
    authorEmail: "alice@example.com",
    date: "2026-03-20T10:00:00.000Z",
    parentShas: ["000111222333444"],
    tree: "treeSha123",
    files: [{ path: "src/index.ts", status: "modified" }],
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

function makeCommitResult(overrides: Partial<CommitResult> = {}): CommitResult {
  return {
    commitSha: "newcommitsha123",
    treeSha: "newtreesha456",
    branch: "feature/test",
    ref: "refs/heads/feature/test",
    parentShas: ["abc123def456789"],
    oldSha: "abc123def456789",
    newSha: "newcommitsha123",
    ...overrides,
  };
}

describe("CommitsResource", () => {
  describe("list", () => {
    it("sends GET /repos/:id/commits with no query params", async () => {
      const commits = [makeCommit()];
      const { fetch, calls } = mockOk(commits);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const result = await resource.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(1);
      expect(result[0].sha).toBe("abc123def456789");
    });

    it("adds ref query param", async () => {
      const commits = [makeCommit()];
      const { fetch, calls } = mockOk(commits);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.list(repoId, { ref: "main" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits?ref=main`);
    });

    it("adds ephemeral=true query param", async () => {
      const commits = [makeCommit()];
      const { fetch, calls } = mockOk(commits);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.list(repoId, { ephemeral: true });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits?ephemeral=true`);
    });

    it("adds limit query param", async () => {
      const commits = [makeCommit()];
      const { fetch, calls } = mockOk(commits);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.list(repoId, { limit: 10 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits?limit=10`);
    });

    it("combines multiple query params", async () => {
      const commits = [makeCommit()];
      const { fetch, calls } = mockOk(commits);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.list(repoId, { ref: "develop", limit: 5 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits?ref=develop&limit=5`);
    });
  });

  describe("get", () => {
    it("sends GET /repos/:id/commits/:sha", async () => {
      const detail = makeCommitDetail();
      const { fetch, calls } = mockOk(detail);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const result = await resource.get(repoId, "abc123def456789");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits/abc123def456789`);
      expect(calls[0].method).toBe("GET");
      expect(result.sha).toBe("abc123def456789");
      expect(result.tree).toBe("treeSha123");
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe("src/index.ts");
    });

    it("throws GitForgeError 404 when commit not found", async () => {
      const { fetch } = mockError(404, "not_found", "Commit not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      try {
        await resource.get(repoId, "nonexistent");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Commit not found");
      }
    });
  });

  describe("getDiff", () => {
    it("sends GET /repos/:id/commits/:sha/diff", async () => {
      const diffs = [makeDiffEntry()];
      const { fetch, calls } = mockOk(diffs);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const result = await resource.getDiff(repoId, "abc123def456789");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits/abc123def456789/diff`);
      expect(calls[0].method).toBe("GET");
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("src/index.ts");
      expect(result[0].additions).toBe(5);
      expect(result[0].deletions).toBe(2);
    });
  });

  describe("create / CommitBuilder", () => {
    it("returns a CommitBuilder, not a Promise", () => {
      const { fetch } = mockOk({});
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const builder = resource.create(repoId, {
        branch: "main",
        message: "test commit",
        authorName: "Alice",
        authorEmail: "alice@example.com",
      });

      expect(builder).toBeInstanceOf(CommitBuilder);
      // Must NOT be a Promise
      expect(builder).not.toHaveProperty("then");
    });

    it("addFile adds a file to the files array in the body", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "add file",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("README.md", "# Hello")
        .send();

      expect(calls).toHaveLength(1);
      const body = calls[0].body as Record<string, unknown>;
      const files = body.files as Array<Record<string, unknown>>;
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("README.md");
      expect(files[0].content).toBe("# Hello");
    });

    it("addFile with encoding option sets encoding", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "add binary",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("image.png", "base64data==", { encoding: "base64" })
        .send();

      const body = calls[0].body as Record<string, unknown>;
      const files = body.files as Array<Record<string, unknown>>;
      expect(files[0].encoding).toBe("base64");
    });

    it("addFile with mode option sets mode", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "add executable",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("deploy.sh", "#!/bin/bash", { mode: "100755" })
        .send();

      const body = calls[0].body as Record<string, unknown>;
      const files = body.files as Array<Record<string, unknown>>;
      expect(files[0].mode).toBe("100755");
    });

    it("deleteFile adds path to deletes array", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "remove file",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .deleteFile("old-file.txt")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      expect(body.deletes).toEqual(["old-file.txt"]);
    });

    it("ephemeral(true) sets ephemeral flag in body", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "preview/test",
          message: "ephemeral commit",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .ephemeral(true)
        .addFile("test.txt", "content")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      expect(body.ephemeral).toBe(true);
    });

    it("expectedHeadSha sets expectedHeadSha in body", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "cas commit",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .expectedHeadSha("abc123def456789")
        .addFile("test.txt", "content")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      expect(body.expectedHeadSha).toBe("abc123def456789");
    });

    it("send() calls POST /repos/:id/commits with correct body shape", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "feature/test",
          message: "full commit",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("src/main.ts", "console.log('hi')")
        .deleteFile("old.ts")
        .send();

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/commits`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        branch: "feature/test",
        message: "full commit",
        author: { name: "Alice", email: "alice@example.com" },
        files: [{ path: "src/main.ts", content: "console.log('hi')", encoding: undefined, mode: undefined }],
        deletes: ["old.ts"],
      });
    });

    it("send() returns CommitResult", async () => {
      const commitResult = makeCommitResult();
      const { fetch } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const result = await resource
        .create(repoId, {
          branch: "main",
          message: "test",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("test.txt", "content")
        .send();

      expect(result.commitSha).toBe("newcommitsha123");
      expect(result.treeSha).toBe("newtreesha456");
      expect(result.branch).toBe("feature/test");
      expect(result.ref).toBe("refs/heads/feature/test");
      expect(result.parentShas).toEqual(["abc123def456789"]);
      expect(result.oldSha).toBe("abc123def456789");
      expect(result.newSha).toBe("newcommitsha123");
    });

    it("supports chaining: addFile().addFile().deleteFile().send()", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      const result = await resource
        .create(repoId, {
          branch: "main",
          message: "chained commit",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("a.txt", "aaa")
        .addFile("b.txt", "bbb")
        .deleteFile("c.txt")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      const files = body.files as Array<Record<string, unknown>>;
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe("a.txt");
      expect(files[1].path).toBe("b.txt");
      expect(body.deletes).toEqual(["c.txt"]);
      expect(result.commitSha).toBe("newcommitsha123");
    });

    it("includes baseBranch in body when provided", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "feature/new",
          message: "commit on new branch",
          authorName: "Alice",
          authorEmail: "alice@example.com",
          baseBranch: "main",
        })
        .addFile("test.txt", "content")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      expect(body.baseBranch).toBe("main");
    });

    it("omits ephemeral and expectedHeadSha when not set", async () => {
      const commitResult = makeCommitResult();
      const { fetch, calls } = mockOk(commitResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "simple commit",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("test.txt", "content")
        .send();

      const body = calls[0].body as Record<string, unknown>;
      expect(body.ephemeral).toBeUndefined();
      expect(body.expectedHeadSha).toBeUndefined();
      expect(body.baseBranch).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("throws GitForgeError 409 on send() when branch has moved", async () => {
      const { fetch } = mockError(409, "branch_moved", "Branch head has moved");
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      try {
        await resource
          .create(repoId, {
            branch: "main",
            message: "conflict commit",
            authorName: "Alice",
            authorEmail: "alice@example.com",
          })
          .expectedHeadSha("stalesha123")
          .addFile("test.txt", "content")
          .send();
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(409);
        expect(e.code).toBe("branch_moved");
        expect(e.message).toBe("Branch head has moved");
      }
    });

    it("throws GitForgeError 404 on get() when commit not found", async () => {
      const { fetch } = mockError(404, "not_found", "Commit not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      try {
        await resource.get(repoId, "nonexistent");
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
    it("includes Bearer token on list", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on get", async () => {
      const { fetch, calls } = mockOk(makeCommitDetail());
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.get(repoId, "abc123");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on getDiff", async () => {
      const { fetch, calls } = mockOk([]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource.getDiff(repoId, "abc123");
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on send", async () => {
      const { fetch, calls } = mockOk(makeCommitResult());
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new CommitsResource(client);

      await resource
        .create(repoId, {
          branch: "main",
          message: "test",
          authorName: "Alice",
          authorEmail: "alice@example.com",
        })
        .addFile("test.txt", "content")
        .send();

      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
