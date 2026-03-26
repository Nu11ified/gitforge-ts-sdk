import type { HttpClient } from "../http";
import type { TreeEntry, BlobContent } from "../types";

export interface ListFilesOptions {
  path?: string;
  ephemeral?: boolean;
}

export interface GetFileOptions {
  ephemeral?: boolean;
}

export class FilesResource {
  constructor(private http: HttpClient) {}

  async listFiles(repoId: string, ref: string, opts: ListFilesOptions = {}): Promise<TreeEntry[]> {
    const query: Record<string, string> = {};
    if (opts.path) query.path = opts.path;
    if (opts.ephemeral) query.ephemeral = "true";
    return this.http.get<TreeEntry[]>(`/repos/${repoId}/tree/${ref}`, query);
  }

  async getFile(repoId: string, ref: string, path: string, opts: GetFileOptions = {}): Promise<BlobContent> {
    const query: Record<string, string> = { path };
    if (opts.ephemeral) query.ephemeral = "true";
    return this.http.get<BlobContent>(`/repos/${repoId}/blob/${ref}`, query);
  }
}
