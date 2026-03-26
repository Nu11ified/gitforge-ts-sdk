import type { HttpClient } from "../http";
import type { Branch, PaginatedResponse } from "../types";

export interface CreateBranchOptions {
  name: string;
  baseBranch?: string;
  sha?: string;
  targetIsEphemeral?: boolean;
  baseIsEphemeral?: boolean;
  ttlSeconds?: number;
}

export interface ListBranchesOptions {
  limit?: number;
  offset?: number;
  namespace?: "ephemeral";
}

export interface DeleteBranchOptions {
  namespace?: "ephemeral";
}

export interface PromoteBranchOptions {
  baseBranch: string;
  targetBranch?: string;
}

export interface PromoteResult {
  targetBranch: string;
  commitSha: string;
}

export class BranchesResource {
  constructor(private http: HttpClient) {}

  async list(repoId: string, opts: ListBranchesOptions = {}): Promise<PaginatedResponse<Branch>> {
    const query: Record<string, string> = {};
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    if (opts.namespace) query.namespace = opts.namespace;
    return this.http.get<PaginatedResponse<Branch>>(`/repos/${repoId}/branches`, query);
  }

  async create(repoId: string, opts: CreateBranchOptions): Promise<Branch> {
    return this.http.post<Branch>(`/repos/${repoId}/branches`, opts);
  }

  async delete(repoId: string, name: string, opts: DeleteBranchOptions = {}): Promise<null> {
    const query: Record<string, string> = {};
    if (opts.namespace) query.namespace = opts.namespace;
    const path = `/repos/${repoId}/branches/${encodeURIComponent(name)}`;
    return this.http.delete(path, Object.keys(query).length > 0 ? query : undefined);
  }

  async promote(repoId: string, opts: PromoteBranchOptions): Promise<PromoteResult> {
    return this.http.post<PromoteResult>(`/repos/${repoId}/branches/promote`, opts);
  }
}
