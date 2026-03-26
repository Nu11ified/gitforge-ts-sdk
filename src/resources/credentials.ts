import type { HttpClient } from "../http";
import type { GitCredential } from "../types";

export interface CreateCredentialOptions {
  provider: string;
  token: string;
  username?: string;
  label?: string;
  sourceUrl?: string;
}

export interface UpdateCredentialOptions {
  token?: string;
  username?: string;
  label?: string;
}

export class CredentialsResource {
  constructor(private http: HttpClient) {}

  async create(repoId: string, opts: CreateCredentialOptions): Promise<GitCredential> {
    return this.http.post<GitCredential>(`/repos/${repoId}/credentials`, opts);
  }

  async list(repoId: string): Promise<GitCredential[]> {
    return this.http.get<GitCredential[]>(`/repos/${repoId}/credentials`);
  }

  async update(repoId: string, credId: string, opts: UpdateCredentialOptions): Promise<GitCredential> {
    return this.http.patch<GitCredential>(`/repos/${repoId}/credentials/${credId}`, opts);
  }

  async delete(repoId: string, credId: string): Promise<null> {
    return this.http.delete(`/repos/${repoId}/credentials/${credId}`);
  }
}
