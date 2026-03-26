import type { HttpClient } from "../http";
import type { MirrorConfig } from "../types";

export interface CreateMirrorOptions {
  sourceUrl: string;
  interval?: number;
  direction?: "pull" | "push" | "bidirectional";
  provider?: string;
  credentialId?: string;
}

export interface UpdateMirrorOptions {
  sourceUrl?: string;
  interval?: number;
  enabled?: boolean;
  direction?: string;
  provider?: string;
  credentialId?: string;
}

export class MirrorsResource {
  constructor(private http: HttpClient) {}

  async list(repoId: string): Promise<MirrorConfig[]> {
    return this.http.get<MirrorConfig[]>(`/repos/${repoId}/mirrors`);
  }

  async create(repoId: string, opts: CreateMirrorOptions): Promise<MirrorConfig> {
    return this.http.post<MirrorConfig>(`/repos/${repoId}/mirrors`, opts);
  }

  async update(repoId: string, mirrorId: string, opts: UpdateMirrorOptions): Promise<MirrorConfig> {
    return this.http.patch<MirrorConfig>(`/repos/${repoId}/mirrors/${mirrorId}`, opts);
  }

  async delete(repoId: string, mirrorId: string): Promise<null> {
    return this.http.delete(`/repos/${repoId}/mirrors/${mirrorId}`);
  }

  async sync(repoId: string, mirrorId: string): Promise<{ message: string }> {
    return this.http.post<{ message: string }>(`/repos/${repoId}/mirrors/${mirrorId}/sync`);
  }
}
