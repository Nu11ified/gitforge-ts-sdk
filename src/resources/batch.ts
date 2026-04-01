import type { HttpClient } from "../http";
import type { BatchResponse, DiffResult } from "../types";

export interface BatchBranchItem {
  repoId: string;
  name: string;
  fromRef?: string;
  fromSha?: string;
}

export interface BatchCommitItem {
  repoId: string;
  ref: string;
  message: string;
  files: Array<{ path: string; content: string; encoding?: string; mode?: string }>;
  author?: { name: string; email: string };
}

export interface BatchFileReadItem {
  repoId: string;
  path: string;
  ref?: string;
}

export interface BatchFileWriteItem {
  repoId: string;
  ref: string;
  path: string;
  content: string;
  encoding?: string;
  message?: string;
  createBranch?: string;
}

export interface BatchRefItem {
  repoId: string;
  pattern?: string;
}

export interface BatchPrItem {
  repoId: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  body?: string;
}

export interface BatchDiffItem {
  repoId: string;
  base: string;
  head: string;
  paths?: string[];
  format?: "name-only" | "stat";
}

export interface BatchOptions {
  atomic?: boolean;
  onError?: "continue" | "stop";
}

export class BatchResource {
  constructor(private http: HttpClient) {}

  async createBranches(items: BatchBranchItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/branches", { action: "create", items, ...opts });
  }

  async deleteBranches(items: Array<{ repoId: string; name: string }>, opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/branches", { action: "delete", items, ...opts });
  }

  async createCommits(items: BatchCommitItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/commits", { items, ...opts });
  }

  async readFiles(items: BatchFileReadItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/files/read", { items, ...opts });
  }

  async writeFiles(items: BatchFileWriteItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/files/write", { items, ...opts });
  }

  async readRefs(items: BatchRefItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/refs", { action: "read", items, ...opts });
  }

  async createPrs(items: BatchPrItem[], opts?: BatchOptions): Promise<BatchResponse> {
    return this.http.post<BatchResponse>("/batch/prs", { items, ...opts });
  }

  async diff(items: BatchDiffItem[], opts?: Omit<BatchOptions, "atomic">): Promise<BatchResponse<DiffResult>> {
    return this.http.post<BatchResponse<DiffResult>>("/batch/diff", { items, ...opts });
  }
}
