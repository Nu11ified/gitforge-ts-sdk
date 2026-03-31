import type { HttpClient } from "../http";

export interface Change {
  id: string;
  changeId: string;
  repoId: string;
  ownerId: string;
  parentChangeId: string | null;
  commitSha: string | null;
  treeSha: string | null;
  baseCommitSha: string;
  description: string | null;
  status: string;
  conflictDetails: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeOptions {
  baseRef?: string;
  description?: string;
  parentChangeId?: string;
  files?: { path: string; content: string; encoding?: string }[];
}

export interface AmendOptions {
  files?: { path: string; content: string; encoding?: string }[];
  deletes?: string[];
}

export interface SquashOptions {
  files?: string[];
}

export interface SplitOptions {
  files: string[];
}

export interface SplitResult {
  first: Change;
  remainder: Change;
}

export interface SquashResult {
  parent: Change;
  child: Change;
}

export interface MaterializeResult {
  branch: string;
  sha: string;
}

export interface ImportOptions {
  branch: string;
  since?: string;
}

export class ChangesResource {
  constructor(private http: HttpClient) {}

  async create(repoId: string, opts: CreateChangeOptions): Promise<Change> {
    return this.http.post(`/repos/${repoId}/changes`, opts);
  }

  async list(repoId: string, opts?: { status?: string; owner?: string }): Promise<{ items: Change[]; total: number }> {
    const query: Record<string, string> = {};
    if (opts?.status) query.status = opts.status;
    if (opts?.owner) query.owner = opts.owner;
    return this.http.get(`/repos/${repoId}/changes`, query);
  }

  async get(repoId: string, changeId: string): Promise<Change> {
    return this.http.get(`/repos/${repoId}/changes/${changeId}`);
  }

  async abandon(repoId: string, changeId: string): Promise<Change> {
    return this.http.delete(`/repos/${repoId}/changes/${changeId}`) as any;
  }

  async amend(repoId: string, changeId: string, opts: AmendOptions): Promise<Change> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/amend`, opts);
  }

  async squash(repoId: string, changeId: string, opts?: SquashOptions): Promise<SquashResult> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/squash`, opts ?? {});
  }

  async split(repoId: string, changeId: string, opts: SplitOptions): Promise<SplitResult> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/split`, opts);
  }

  async describe(repoId: string, changeId: string, description: string): Promise<Change> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/describe`, { description });
  }

  async rebase(repoId: string, changeId: string, newBase: string): Promise<Change> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/rebase`, { newBase });
  }

  async resolve(repoId: string, changeId: string, files: { path: string; content: string }[]): Promise<Change> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/resolve`, { files });
  }

  async createBookmark(repoId: string, changeId: string, name: string): Promise<void> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/bookmark`, { name }) as any;
  }

  async deleteBookmark(repoId: string, changeId: string, name: string): Promise<void> {
    return this.http.delete(`/repos/${repoId}/changes/${changeId}/bookmark/${name}`) as any;
  }

  async materialize(repoId: string, changeId: string, branch: string): Promise<MaterializeResult> {
    return this.http.post(`/repos/${repoId}/changes/${changeId}/materialize`, { branch });
  }

  async importFromCommits(repoId: string, opts: ImportOptions): Promise<{ changes: Change[] }> {
    return this.http.post(`/repos/${repoId}/changes/from-commits`, opts);
  }
}
