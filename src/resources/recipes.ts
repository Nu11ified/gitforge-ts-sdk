import type { HttpClient } from "../http";
import type { RecipeResult, RecipeJobResult } from "../types";

export interface RunRecipeOptions {
  repos?: string[];
  repoPattern?: string;
  params?: Record<string, unknown>;
  atomic?: boolean;
  dryRun?: boolean;
}

export interface PatchFleetOptions {
  repos: string[];
  branchName: string;
  commitMessage: string;
  files: Array<{ path: string; content: string }>;
  createPr?: { title: string; body?: string };
}

export interface SnapshotOptions {
  repos: string[];
  paths?: string[];
  ref?: string;
}

export class RecipesResource {
  constructor(private http: HttpClient) {}

  async run(name: string, opts: RunRecipeOptions): Promise<RecipeResult | RecipeJobResult> {
    return this.http.post<RecipeResult | RecipeJobResult>(`/recipes/${name}`, opts);
  }

  async patchFleet(opts: PatchFleetOptions): Promise<RecipeResult | RecipeJobResult> {
    return this.run("patch-fleet", {
      repos: opts.repos,
      params: {
        branchName: opts.branchName,
        commitMessage: opts.commitMessage,
        files: opts.files,
        createPr: opts.createPr,
      },
    });
  }

  async snapshot(opts: SnapshotOptions): Promise<RecipeResult | RecipeJobResult> {
    return this.run("snapshot", {
      repos: opts.repos,
      params: {
        paths: opts.paths,
        ref: opts.ref,
      },
    });
  }
}
