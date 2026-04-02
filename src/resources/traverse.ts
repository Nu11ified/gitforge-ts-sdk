import type { HttpClient } from "../http";
import type { PaginatedResponse } from "../types";

// ---------------------------------------------------------------------------
// Option interfaces
// ---------------------------------------------------------------------------

export interface ListTraverseReposOptions {
  q?: string;
  language?: string;
  buildSystem?: string;
  isMonorepo?: boolean;
  sort?: "recent" | "name" | "size" | "fileCount";
  limit?: number;
  offset?: number;
}

export interface GetTraverseRepoOptions {
  ref?: string;
  depth?: "L1" | "L2" | "L3";
  path?: string;
  include?: string[];
}

export interface ImpactOptions {
  paths: string[];
  ref?: string;
}

// ---------------------------------------------------------------------------
// Result interfaces
// ---------------------------------------------------------------------------

export interface TraverseRepoSummary {
  id: string;
  name: string;
  slug?: string;
  defaultBranch: string;
  fileCount?: number;
  languages?: Record<string, number>;
  buildSystem?: string | null;
  isMonorepo?: boolean;
  indexStatus?: IndexStatus;
}

export interface IndexStatus {
  l1: "pending" | "building" | "ready" | "error";
  l2: "pending" | "building" | "ready" | "error";
  l3: "pending" | "building" | "ready" | "error";
}

export interface FileTreeEntry {
  path: string;
  type: "blob" | "tree";
  mode: string;
  size?: number;
  sha?: string;
  language?: string;
}

export interface FileSymbols {
  exports: SymbolInfo[];
  imports: ImportInfo[];
}

export interface SymbolInfo {
  name: string;
  kind: string;
  line: number;
}

export interface ImportInfo {
  source: string;
  symbols: string[];
}

export interface FileSummary {
  path: string;
  summary: string;
  relevanceTags?: string[];
}

export interface ArchitectureInfo {
  layers: string[];
  entryPoints: string[];
  description?: string;
}

export interface TraverseRepoResult {
  indexStatus: IndexStatus;
  head: string;
  ref: string;
  tree?: FileTreeEntry[];
  configs?: Record<string, unknown>;
  languages?: Record<string, number>;
  buildSystem?: string | null;
  isMonorepo?: boolean;
  fileCount?: number;
  symbols?: Record<string, FileSymbols>;
  entryPoints?: string[];
  testMap?: Record<string, string>;
  architecture?: ArchitectureInfo;
  relevanceTags?: string[];
  summaries?: FileSummary[];
}

export interface ImpactedFile {
  path: string;
  reason: string;
  depth: number;
}

export interface ImpactResult {
  impacted: ImpactedFile[];
  testFiles: string[];
  totalImpactedFiles: number;
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class TraverseResource {
  constructor(private http: HttpClient) {}

  async repos(
    opts: ListTraverseReposOptions = {},
  ): Promise<PaginatedResponse<TraverseRepoSummary>> {
    const query: Record<string, string> = {};
    if (opts.q !== undefined) query.q = opts.q;
    if (opts.language !== undefined) query.language = opts.language;
    if (opts.buildSystem !== undefined) query.buildSystem = opts.buildSystem;
    if (opts.isMonorepo !== undefined) query.isMonorepo = String(opts.isMonorepo);
    if (opts.sort !== undefined) query.sort = opts.sort;
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<TraverseRepoSummary>>(
      "/traverse/repos",
      query,
    );
  }

  async repo(
    repoId: string,
    opts: GetTraverseRepoOptions = {},
  ): Promise<TraverseRepoResult> {
    const query: Record<string, string> = {};
    if (opts.ref !== undefined) query.ref = opts.ref;
    if (opts.depth !== undefined) query.depth = opts.depth;
    if (opts.path !== undefined) query.path = opts.path;
    if (opts.include !== undefined && opts.include.length > 0) {
      query.include = opts.include.join(",");
    }
    return this.http.get<TraverseRepoResult>(
      `/traverse/${repoId}`,
      query,
    );
  }

  async impact(
    repoId: string,
    opts: ImpactOptions,
  ): Promise<ImpactResult> {
    const query: Record<string, string> = {
      paths: opts.paths.join(","),
    };
    if (opts.ref !== undefined) query.ref = opts.ref;
    return this.http.get<ImpactResult>(
      `/traverse/${repoId}/impact`,
      query,
    );
  }
}
