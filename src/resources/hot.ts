import type { HttpClient } from "../http";
import type { HotFile, HotTreeResult, HotCommitResult, HotRefEntry } from "../types";

export interface HotReadFileOptions {
  ref?: string;
  include?: ("content" | "metadata" | "history")[];
}

export interface HotListTreeOptions {
  ref?: string;
  depth?: number;
}

export interface HotCommitOptions {
  ref: string;
  message: string;
  operations: Array<
    | { action: "upsert"; path: string; content: string; encoding?: string; mode?: string }
    | { action: "delete"; path: string }
    | { action: "move"; from: string; to: string }
    | { action: "chmod"; path: string; mode: string }
  >;
  author?: { name: string; email: string; timestamp?: number; tz?: string };
  expectedHeadSha?: string;
}

export interface HotListRefsOptions {
  pattern?: string;
}

export interface HotCreateRefOptions {
  name: string;
  sha: string;
  force?: boolean;
}

export class HotResource {
  constructor(private http: HttpClient) {}

  async readFile(repoId: string, path: string, opts: HotReadFileOptions = {}): Promise<HotFile> {
    const query: Record<string, string> = {};
    query.ref = opts.ref ?? "main";
    if (opts.include?.length) query.include = opts.include.join(",");
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return this.http.get<HotFile>(`/repos/${repoId}/hot/files/${encodedPath}`, query);
  }

  async listTree(repoId: string, path: string, opts: HotListTreeOptions = {}): Promise<HotTreeResult> {
    const query: Record<string, string> = {};
    query.ref = opts.ref ?? "main";
    if (opts.depth !== undefined) query.depth = String(opts.depth);
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return this.http.get<HotTreeResult>(`/repos/${repoId}/hot/tree/${encodedPath}`, query);
  }

  async commit(repoId: string, opts: HotCommitOptions): Promise<HotCommitResult> {
    return this.http.post<HotCommitResult>(`/repos/${repoId}/hot/commit`, opts);
  }

  async listRefs(repoId: string, opts: HotListRefsOptions = {}): Promise<{ refs: HotRefEntry[] }> {
    const query: Record<string, string> = {};
    if (opts.pattern) query.pattern = opts.pattern;
    return this.http.get<{ refs: HotRefEntry[] }>(`/repos/${repoId}/hot/refs`, query);
  }

  async createRef(repoId: string, opts: HotCreateRefOptions): Promise<HotRefEntry> {
    return this.http.post<HotRefEntry>(`/repos/${repoId}/hot/refs`, opts);
  }
}
