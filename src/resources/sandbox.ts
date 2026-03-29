import type { HttpClient } from "../http";
import type { SandboxUrl } from "../types";

export interface CreateSandboxUrlOptions {
  ttlSeconds: number;
  scopes?: ("repo:read" | "repo:write")[];
  branch?: string;
  ephemeral?: boolean;
}

export class SandboxResource {
  constructor(private http: HttpClient) {}

  async createSandboxUrl(
    repoId: string,
    opts: CreateSandboxUrlOptions,
  ): Promise<SandboxUrl> {
    return this.http.post<SandboxUrl>(`/repos/${repoId}/sandbox-url`, opts);
  }
}
