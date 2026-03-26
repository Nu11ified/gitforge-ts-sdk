import type { HttpClient } from "../http";
import type { Webhook, WebhookDelivery, PaginatedResponse } from "../types";

export interface CreateWebhookOptions {
  url: string;
  secret?: string;
  events?: string[] | null;
}

export interface WebhookTestResult {
  success: boolean;
  status: number | null;
  responseBody: string | null;
  durationMs: number;
  error: string | null;
}

export class WebhooksResource {
  constructor(private http: HttpClient) {}

  async create(repoId: string, opts: CreateWebhookOptions): Promise<Webhook> {
    return this.http.post<Webhook>(`/repos/${repoId}/webhooks`, opts);
  }

  async list(repoId: string, opts: { limit?: number; offset?: number } = {}): Promise<PaginatedResponse<Webhook>> {
    const query: Record<string, string> = {};
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<Webhook>>(`/repos/${repoId}/webhooks`, query);
  }

  async delete(repoId: string, webhookId: string): Promise<null> {
    return this.http.delete(`/repos/${repoId}/webhooks/${webhookId}`);
  }

  async test(repoId: string, webhookId: string): Promise<WebhookTestResult> {
    return this.http.post<WebhookTestResult>(`/repos/${repoId}/webhooks/${webhookId}/test`);
  }

  async deliveries(
    repoId: string,
    webhookId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<PaginatedResponse<WebhookDelivery>> {
    const query: Record<string, string> = {};
    if (opts.limit !== undefined) query.limit = String(opts.limit);
    if (opts.offset !== undefined) query.offset = String(opts.offset);
    return this.http.get<PaginatedResponse<WebhookDelivery>>(
      `/repos/${repoId}/webhooks/${webhookId}/deliveries`,
      query,
    );
  }
}
