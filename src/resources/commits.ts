import type { HttpClient } from "../http";
import type { Commit, CommitDetail, DiffEntry, CommitResult, CommitFileEntry } from "../types";

export interface ListCommitsOptions {
  ref?: string;
  ephemeral?: boolean;
  limit?: number;
}

export interface CreateCommitOptions {
  branch: string;
  message: string;
  authorName: string;
  authorEmail: string;
  baseBranch?: string;
}

export class CommitBuilder {
  private files: CommitFileEntry[] = [];
  private deletes: string[] = [];
  private isEphemeral = false;
  private casHeadSha?: string;

  constructor(
    private http: HttpClient,
    private repoId: string,
    private opts: CreateCommitOptions,
  ) {}

  addFile(path: string, content: string, options?: { encoding?: "utf8" | "base64"; mode?: "100644" | "100755" | "120000" }): this {
    this.files.push({ path, content, encoding: options?.encoding, mode: options?.mode });
    return this;
  }

  deleteFile(path: string): this {
    this.deletes.push(path);
    return this;
  }

  ephemeral(value = true): this {
    this.isEphemeral = value;
    return this;
  }

  expectedHeadSha(sha: string): this {
    this.casHeadSha = sha;
    return this;
  }

  async send(): Promise<CommitResult> {
    const body: Record<string, unknown> = {
      branch: this.opts.branch,
      message: this.opts.message,
      author: { name: this.opts.authorName, email: this.opts.authorEmail },
      files: this.files,
      deletes: this.deletes,
    };
    if (this.opts.baseBranch) body.baseBranch = this.opts.baseBranch;
    if (this.isEphemeral) body.ephemeral = true;
    if (this.casHeadSha) body.expectedHeadSha = this.casHeadSha;

    return this.http.post<CommitResult>(`/repos/${this.repoId}/commits`, body);
  }
}

export interface CreateCommitFromDiffOptions {
  targetBranch: string;
  commitMessage: string;
  authorName: string;
  authorEmail: string;
  diff: string;
  baseBranch?: string;
  expectedHeadSha?: string;
}

export class CommitsResource {
  constructor(private http: HttpClient) {}

  async list(repoId: string, opts: ListCommitsOptions = {}): Promise<Commit[]> {
    const query: Record<string, string> = {};
    if (opts.ref) query.ref = opts.ref;
    if (opts.ephemeral) query.ephemeral = "true";
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    return this.http.get<Commit[]>(`/repos/${repoId}/commits`, query);
  }

  async get(repoId: string, sha: string): Promise<CommitDetail> {
    return this.http.get<CommitDetail>(`/repos/${repoId}/commits/${sha}`);
  }

  async getDiff(repoId: string, sha: string): Promise<DiffEntry[]> {
    return this.http.get<DiffEntry[]>(`/repos/${repoId}/commits/${sha}/diff`);
  }

  create(repoId: string, opts: CreateCommitOptions): CommitBuilder {
    return new CommitBuilder(this.http, repoId, opts);
  }

  async createFromDiff(repoId: string, opts: CreateCommitFromDiffOptions): Promise<CommitResult> {
    const body: Record<string, unknown> = {
      targetBranch: opts.targetBranch,
      commitMessage: opts.commitMessage,
      author: { name: opts.authorName, email: opts.authorEmail },
      diff: opts.diff,
    };
    if (opts.baseBranch) body.baseBranch = opts.baseBranch;
    if (opts.expectedHeadSha) body.expectedHeadSha = opts.expectedHeadSha;
    return this.http.post<CommitResult>(`/repos/${repoId}/diff-commit`, body);
  }
}
