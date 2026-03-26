import type { HttpClient } from "../http";
import type { RepoToken } from "../types";

export interface CreateTokenOptions {
  ttlSeconds: number;
  scopes?: string[];
  type?: "standard" | "ephemeral" | "import";
}

export class TokensResource {
  constructor(private http: HttpClient) {}

  async create(repoId: string, opts: CreateTokenOptions): Promise<RepoToken> {
    return this.http.post<RepoToken>(`/repos/${repoId}/tokens`, opts);
  }
}
