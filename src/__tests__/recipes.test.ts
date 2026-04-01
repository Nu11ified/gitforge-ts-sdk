import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { RecipesResource } from "../resources/recipes";
import { mockOk, createMockFetch } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";

describe("RecipesResource", () => {
  describe("run", () => {
    it("sends POST /recipes/:name with repos and params", async () => {
      const result = { status: "completed", steps: [], results: [] };
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const recipes = new RecipesResource(client);

      const res = await recipes.run("patch-fleet", { repos: ["r1", "r2"], params: { branchName: "fix/cve" } });

      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/recipes/patch-fleet");
      expect(calls[0].body).toEqual({ repos: ["r1", "r2"], params: { branchName: "fix/cve" } });
      expect(res.status).toBe("completed");
    });
  });

  describe("patchFleet", () => {
    it("calls /recipes/patch-fleet with structured params", async () => {
      const result = { jobId: "j1", status: "running" };
      const { fetch, calls } = createMockFetch([{ status: 202, body: result }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const recipes = new RecipesResource(client);

      const res = await recipes.patchFleet({
        repos: ["r1"],
        branchName: "fix/cve",
        commitMessage: "fix: CVE",
        files: [{ path: "package.json", content: "{}" }],
      });

      expect(calls[0].url).toContain("/recipes/patch-fleet");
      expect(res).toEqual(result);
    });
  });

  describe("snapshot", () => {
    it("calls /recipes/snapshot", async () => {
      const result = { status: "completed", steps: [], results: [] };
      const { fetch, calls } = mockOk(result);
      const client = new HttpClient({ baseUrl, token, fetch });
      const recipes = new RecipesResource(client);

      await recipes.snapshot({ repos: ["r1"], paths: ["package.json"] });

      expect(calls[0].url).toContain("/recipes/snapshot");
    });
  });
});
