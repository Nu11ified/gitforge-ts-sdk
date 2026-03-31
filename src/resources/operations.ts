import type { HttpClient } from "../http";

export interface Operation {
  id: string;
  changeId: string | null;
  repoId: string;
  operationType: string;
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  createdAt: string;
}

export class OperationsResource {
  constructor(private http: HttpClient) {}

  async list(repoId: string, opts?: { limit?: number; offset?: number }): Promise<{ items: Operation[]; total: number }> {
    const query: Record<string, string> = {};
    if (opts?.limit) query.limit = String(opts.limit);
    if (opts?.offset) query.offset = String(opts.offset);
    return this.http.get(`/repos/${repoId}/operations`, query);
  }

  async undo(repoId: string, operationId?: string): Promise<{ undoneOperation: Operation }> {
    return this.http.post(`/repos/${repoId}/operations/undo`, { operationId });
  }

  async restore(repoId: string, operationId: string): Promise<{ restoredCount: number }> {
    return this.http.post(`/repos/${repoId}/operations/${operationId}/restore`);
  }
}
