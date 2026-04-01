import type { HttpClient } from "../http";
import type { BatchResponse, RepoState } from "../types";

export interface StateCurrentItem {
  repoId: string;
  paths: string[];
  ref?: string;
  include?: ("content" | "metadata" | "history")[];
}

export class StateResource {
  constructor(private http: HttpClient) {}

  async current(items: StateCurrentItem[]): Promise<BatchResponse<RepoState>> {
    return this.http.post<BatchResponse<RepoState>>("/state/current", { items });
  }
}
