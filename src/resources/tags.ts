import type { HttpClient } from "../http";
import type { Tag, PaginatedResponse } from "../types";

export interface CreateTagOptions {
  name: string;
  sha: string;
}

export interface ListTagsOptions {
  limit?: number;
  offset?: number;
}

export class TagsResource {
  constructor(private http: HttpClient) {}

  async list(repoId: string, opts: ListTagsOptions = {}): Promise<PaginatedResponse<Tag>> {
    const query: Record<string, string> = {};
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<Tag>>(`/repos/${repoId}/tags`, query);
  }

  async create(repoId: string, opts: CreateTagOptions): Promise<Tag> {
    return this.http.post<Tag>(`/repos/${repoId}/tags`, opts);
  }

  async delete(repoId: string, name: string): Promise<null> {
    return this.http.delete(`/repos/${repoId}/tags/${encodeURIComponent(name)}`);
  }
}
