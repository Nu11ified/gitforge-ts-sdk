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
}
