import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { StateResource } from "../resources/state";
import { mockOk } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";

describe("StateResource", () => {
  describe("current", () => {
    it("sends POST /state/current with items", async () => {
      const response = {
        results: [{
          index: 0,
          status: "fulfilled",
          value: {
            repoId: "r1",
            ref: "main",
            headSha: "abc123",
            files: [{ path: "package.json", content: "{}", size: 2 }],
          },
        }],
        summary: { total: 1, succeeded: 1, failed: 0 },
      };
      const { fetch, calls } = mockOk(response);
      const client = new HttpClient({ baseUrl, token, fetch });
      const state = new StateResource(client);

      const result = await state.current([
        { repoId: "r1", paths: ["package.json"] },
      ]);

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/state/current");
      expect(calls[0].body).toEqual({ items: [{ repoId: "r1", paths: ["package.json"] }] });
      expect(result.results).toHaveLength(1);
    });

    it("passes optional ref and include params", async () => {
      const response = { results: [], summary: { total: 0, succeeded: 0, failed: 0 } };
      const { fetch, calls } = mockOk(response);
      const client = new HttpClient({ baseUrl, token, fetch });
      const state = new StateResource(client);

      await state.current([
        { repoId: "r1", paths: ["f.ts"], ref: "dev", include: ["content", "metadata"] },
      ]);

      expect(calls[0].body).toEqual({
        items: [{ repoId: "r1", paths: ["f.ts"], ref: "dev", include: ["content", "metadata"] }],
      });
    });
  });
});
