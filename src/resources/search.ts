import type { HttpClient } from "../http";
import type { SearchResult, DiffEntry, Comparison } from "../types";

export interface SearchCodeOptions {
  query: string;
  language?: string;
  branch?: string;
  perPage?: number;
  page?: number;
}

export interface SearchCodeResult {
  results: SearchResult[];
  total: number;
  page: number;
  perPage: number;
}

export class SearchResource {
  constructor(private http: HttpClient) {}

  async searchCode(repoId: string, opts: SearchCodeOptions): Promise<SearchCodeResult> {
    const query: Record<string, string> = { q: opts.query };
    if (opts.language) query.lang = opts.language;
    if (opts.branch) query.branch = opts.branch;
    if (opts.perPage !== undefined) query.perPage = String(opts.perPage);
    if (opts.page !== undefined) query.page = String(opts.page);
    return this.http.get<SearchCodeResult>(`/repos/${repoId}/search`, query);
  }

  async compare(repoId: string, base: string, head: string): Promise<Comparison> {
    return this.http.get<Comparison>(`/repos/${repoId}/compare`, { base, head });
  }

  async compareDiff(repoId: string, base: string, head: string): Promise<DiffEntry[]> {
    return this.http.get<DiffEntry[]>(`/repos/${repoId}/compare/diff`, { base, head });
  }
}
