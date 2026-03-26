import { GitForgeError } from "./errors";

export interface HttpClientOptions {
  baseUrl: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}

export class HttpClient {
  private baseUrl: string;
  private token: string;
  private fetch: typeof globalThis.fetch;

  constructor(opts: HttpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.token = opts.token;
    this.fetch = opts.fetch ?? globalThis.fetch;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      ...extra,
    };
  }

  private async handleResponse(res: Response): Promise<unknown> {
    if (res.status === 204) return null;

    const body = await res.json();

    if (!res.ok) {
      throw new GitForgeError(
        res.status,
        body?.code ?? "unknown",
        body?.message ?? `HTTP ${res.status}`,
      );
    }

    return body;
  }

  async get<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      url += "?" + new URLSearchParams(query).toString();
    }
    const res = await this.fetch(url, { method: "GET", headers: this.headers() });
    return this.handleResponse(res) as Promise<T>;
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(res) as Promise<T>;
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(res) as Promise<T>;
  }

  async delete(path: string, query?: Record<string, string>): Promise<null> {
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      url += "?" + new URLSearchParams(query).toString();
    }
    const res = await this.fetch(url, {
      method: "DELETE",
      headers: this.headers(),
    });
    return this.handleResponse(res) as Promise<null>;
  }
}
