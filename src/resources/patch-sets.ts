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

export interface PublishResult {
  id: string;
  name: string;
  visibility: "public";
  ownerName: string;
  repoName: string;
  patchCount: number;
}

export interface ForkResult {
  id: string;
  name: string;
  forkedFromId: string;
  repoId: string;
  patchCount: number;
}

export interface UpdateChange {
  type: "added" | "modified" | "removed" | "reordered";
  patchId: string;
  name: string;
  order: number;
}

export interface UpdatesResult {
  hasUpdates: boolean;
  upstreamSetId: string;
  changes: UpdateChange[];
}

export interface AcceptUpdatesOptions {
  patches: string[] | ["all"];
}

export interface AcceptResult {
  accepted: number;
  conflicts: number;
}

export interface ExploreOptions {
  q?: string;
  base?: string;
  page?: number;
  pageSize?: number;
}

export interface ExploreResult {
  items: PatchSet[];
  total: number;
  page: number;
  pageSize: number;
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

  // ---- Sharing methods ----

  async publish(setId: string): Promise<PublishResult> {
    return this.http.post(`/patch-sets/${setId}/publish`);
  }

  async unpublish(setId: string): Promise<void> {
    return this.http.delete(`/patch-sets/${setId}/publish`) as any;
  }

  async fork(setId: string, opts?: { name?: string }): Promise<ForkResult> {
    return this.http.post(`/patch-sets/${setId}/fork`, opts ?? {});
  }

  async subscribe(setId: string): Promise<void> {
    return this.http.post(`/patch-sets/${setId}/subscribe`) as any;
  }

  async unsubscribe(setId: string): Promise<void> {
    return this.http.delete(`/patch-sets/${setId}/subscribe`) as any;
  }

  async getUpdates(setId: string): Promise<UpdatesResult> {
    return this.http.get<UpdatesResult>(`/patch-sets/${setId}/updates`);
  }

  async acceptUpdates(
    setId: string,
    opts: AcceptUpdatesOptions,
  ): Promise<AcceptResult> {
    return this.http.post(`/patch-sets/${setId}/updates/accept`, opts);
  }

  async explore(opts?: ExploreOptions): Promise<ExploreResult> {
    const query: Record<string, string> = {};
    if (opts?.q) query.q = opts.q;
    if (opts?.base) query.base = opts.base;
    if (opts?.page) query.page = String(opts.page);
    if (opts?.pageSize) query.pageSize = String(opts.pageSize);
    return this.http.get<ExploreResult>("/explore/patch-sets", query);
  }
}
