import type { HttpClient } from "../http";
import type { Job, PaginatedResponse } from "../types";

export interface ListJobsOptions {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface WaitForOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export class JobsResource {
  constructor(private http: HttpClient) {}

  async list(opts: ListJobsOptions = {}): Promise<PaginatedResponse<Job>> {
    const query: Record<string, string> = {};
    if (opts.status) query.status = opts.status;
    if (opts.type) query.type = opts.type;
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<Job>>("/jobs", query);
  }

  async get(jobId: string): Promise<Job> {
    return this.http.get<Job>(`/jobs/${jobId}`);
  }

  async cancel(jobId: string): Promise<{ status: string }> {
    return this.http.deleteWithBody<{ status: string }>(`/jobs/${jobId}`);
  }

  async waitFor(jobId: string, opts: WaitForOptions = {}): Promise<Job> {
    const pollInterval = opts.pollIntervalMs ?? 2000;
    const timeout = opts.timeoutMs ?? 300_000;
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const job = await this.get(jobId);
      if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
        return job;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Job ${jobId} did not complete within ${timeout}ms`);
  }
}
