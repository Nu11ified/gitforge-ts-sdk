import type { HttpClient } from "../http";
import type {
  ShellExecResult,
  ShellMultiExecResult,
  ShellDestroyResult,
} from "../types";

export interface ShellExecOptions {
  sessionId?: string;
  ref?: string;
  env?: Record<string, string>;
}

export interface ShellMultiExecOptions {
  sessionId?: string;
  mounts?: Array<{ repoId: string; path: string; ref: string }>;
  env?: Record<string, string>;
}

export class ShellResource {
  constructor(private http: HttpClient) {}

  async exec(
    repoId: string,
    command: string,
    opts?: ShellExecOptions,
  ): Promise<ShellExecResult> {
    return this.http.post<ShellExecResult>(`/repos/${repoId}/shell`, {
      command,
      ...opts,
    });
  }

  async execMulti(
    command: string,
    opts?: ShellMultiExecOptions,
  ): Promise<ShellMultiExecResult> {
    return this.http.post<ShellMultiExecResult>(`/shell`, {
      command,
      ...opts,
    });
  }

  async destroy(sessionId: string): Promise<ShellDestroyResult> {
    return this.http.deleteWithBody<ShellDestroyResult>(`/shell/${sessionId}`);
  }
}
