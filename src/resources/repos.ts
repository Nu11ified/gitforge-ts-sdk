import type { HttpClient } from "../http";
import type { Repo, PaginatedResponse } from "../types";

export interface CreateRepoOptions {
  name: string;
  description?: string;
  visibility?: "public" | "private";
}

export interface UpdateRepoOptions {
  name?: string;
  description?: string;
  defaultBranch?: string;
  mergeCommitTemplate?: string | null;
}

export interface ListReposOptions {
  limit?: number;
  offset?: number;
}

export class ReposResource {
  constructor(private http: HttpClient) {}

  async create(opts: CreateRepoOptions): Promise<Repo> {
    return this.http.post<Repo>("/repos", opts);
  }

  async list(opts: ListReposOptions = {}): Promise<PaginatedResponse<Repo>> {
    const query: Record<string, string> = {};
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<Repo>>("/repos", query);
  }

  async get(id: string): Promise<Repo> {
    return this.http.get<Repo>(`/repos/${id}`);
  }

  async update(id: string, opts: UpdateRepoOptions): Promise<Repo> {
    return this.http.patch<Repo>(`/repos/${id}`, opts);
  }

  async delete(id: string): Promise<null> {
    return this.http.delete(`/repos/${id}`);
  }

  // --- Git Notes ---

  async createNote(repoId: string, sha: string, note: string, author: { name: string; email: string }, opts?: { expectedRefSha?: string }): Promise<{ sha: string; refSha: string; success: boolean }> {
    return this.http.post(`/repos/${repoId}/notes`, { sha, action: "add", note, author, ...opts });
  }

  async appendNote(repoId: string, sha: string, note: string, author: { name: string; email: string }): Promise<{ sha: string; refSha: string; success: boolean }> {
    return this.http.post(`/repos/${repoId}/notes`, { sha, action: "append", note, author });
  }

  async getNote(repoId: string, sha: string): Promise<{ sha: string; note: string; refSha: string }> {
    return this.http.get(`/repos/${repoId}/notes/${sha}`);
  }

  async deleteNote(repoId: string, sha: string, opts?: { author?: { name: string; email: string }; expectedRefSha?: string }): Promise<{ sha: string; refSha: string; success: boolean }> {
    return this.http.deleteWithBody(`/repos/${repoId}/notes/${sha}`, opts);
  }

  // --- Restore Commit ---

  async restoreCommit(repoId: string, opts: {
    targetBranch: string;
    targetCommitSha: string;
    author: { name: string; email: string };
    committer?: { name: string; email: string };
    commitMessage?: string;
    expectedHeadSha?: string;
  }): Promise<{ commitSha: string; treeSha: string; targetBranch: string; success: boolean }> {
    return this.http.post(`/repos/${repoId}/restore-commit`, opts);
  }

  // --- Files Metadata ---

  async listFilesWithMetadata(repoId: string, opts?: { ref?: string; ephemeral?: boolean }): Promise<{
    files: Array<{ path: string; mode: string; size: number; last_commit_sha: string | null }>;
    commits: Record<string, { author: string; date: string; message: string }>;
    ref: string;
  }> {
    const query: Record<string, string> = {};
    if (opts?.ref) query.ref = opts.ref;
    if (opts?.ephemeral !== undefined) query.ephemeral = String(opts.ephemeral);
    return this.http.get(`/repos/${repoId}/files/metadata`, query);
  }

  // --- Fork Sync ---

  async pullUpstream(repoId: string, opts?: { branch?: string }): Promise<{ status: string; oldSha: string; newSha: string; branch: string; success: boolean }> {
    return this.http.post(`/repos/${repoId}/pull-upstream`, opts ?? {});
  }

  async detachUpstream(repoId: string): Promise<{ message: string }> {
    return this.http.delete(`/repos/${repoId}/base`) as unknown as Promise<{ message: string }>;
  }

  // --- Raw Blob ---

  async getRawFile(repoId: string, ref: string, path: string, opts?: { download?: boolean }): Promise<ArrayBuffer> {
    const query: Record<string, string> = { path };
    if (opts?.download) query.download = "true";
    return this.http.getRaw(`/repos/${repoId}/raw/${ref}`, query);
  }

  // --- Archive ---

  async getArchive(repoId: string, ref: string, opts?: { format?: "tarball" | "zip"; paths?: string[] }): Promise<ArrayBuffer> {
    const format = opts?.format ?? "tarball";
    const query: Record<string, string> = {};
    if (opts?.paths?.length) query.paths = opts.paths.join(",");
    return this.http.getRaw(`/repos/${repoId}/archive/${format}/${ref}`, query);
  }
}
