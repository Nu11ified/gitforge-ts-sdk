import type { HttpClient } from "../http";

export interface PatchSet {
  id: string;
  repoId: string;
  name: string;
  description: string | null;
  baseRef: string;
  baseSha: string;
  materializedBranch: string | null;
  materializedSha: string | null;
  status: string;
  autoRebase: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patch {
  id: string;
  name: string;
  description: string | null;
  order: number;
  diff: string;
  status: string;
  conflictDetails: string | null;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatchSetWithPatches extends PatchSet {
  patches: Patch[];
}

export interface CreatePatchSetOptions {
  name: string;
  baseRef?: string;
  description?: string;
}

export interface UpdatePatchSetOptions {
  name?: string;
  description?: string;
  autoRebase?: boolean;
  visibility?: string;
}

export interface AddPatchOptions {
  name: string;
  diff: string;
  description?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface UpdatePatchOptions {
  name?: string;
  status?: string;
  order?: number;
}

export interface RebaseResult {
  status: string;
  conflictedPatch?: string;
}

export interface MaterializeResult {
  headSha: string;
  status: string;
}

export class PatchSetsResource {
  constructor(private http: HttpClient) {}

  async create(
    repoId: string,
    opts: CreatePatchSetOptions,
  ): Promise<{ id: string; name: string; materializedBranch: string }> {
    return this.http.post("/patch-sets", { repoId, ...opts });
  }

  async list(opts?: { repoId?: string }): Promise<PatchSet[]> {
    const query: Record<string, string> = {};
    if (opts?.repoId) query.repoId = opts.repoId;
    return this.http.get<PatchSet[]>("/patch-sets", query);
  }

  async get(setId: string): Promise<PatchSetWithPatches> {
    return this.http.get<PatchSetWithPatches>(`/patch-sets/${setId}`);
  }

  async update(setId: string, opts: UpdatePatchSetOptions): Promise<PatchSet> {
    return this.http.patch<PatchSet>(`/patch-sets/${setId}`, opts);
  }

  async delete(setId: string): Promise<null> {
    return this.http.delete(`/patch-sets/${setId}`);
  }

  async addPatch(
    setId: string,
    opts: AddPatchOptions,
  ): Promise<{ id: string; order: number }> {
    return this.http.post(`/patch-sets/${setId}/patches`, opts);
  }

  async updatePatch(
    setId: string,
    patchId: string,
    opts: UpdatePatchOptions,
  ): Promise<void> {
    return this.http.patch(`/patch-sets/${setId}/patches/${patchId}`, opts) as any;
  }

  async removePatch(setId: string, patchId: string): Promise<null> {
    return this.http.delete(`/patch-sets/${setId}/patches/${patchId}`);
  }

  async rebase(setId: string): Promise<RebaseResult> {
    return this.http.post(`/patch-sets/${setId}/rebase`);
  }

  async materialize(setId: string): Promise<MaterializeResult> {
    return this.http.post(`/patch-sets/${setId}/materialize`);
  }
}
