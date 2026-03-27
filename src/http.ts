import { GitForgeError, RefUpdateError } from "./errors";

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

    let body: any;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      const code = body?.code ?? body?.error ?? "unknown";
      const message = body?.message ?? `HTTP ${res.status}`;

      // CAS conflict: API returns { error: "branch_moved", currentSha }
      if (res.status === 409 && code === "branch_moved" && body?.currentSha) {
        throw new RefUpdateError(message, body.currentSha);
      }

      throw new GitForgeError(res.status, code, message);
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

  async getRaw(path: string, query?: Record<string, string>): Promise<ArrayBuffer> {
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      url += "?" + new URLSearchParams(query).toString();
    }
    const res = await this.fetch(url, { method: "GET", headers: this.headers() });
    if (!res.ok) {
      let body: any;
      try { body = await res.json(); } catch { body = null; }
      const code = body?.code ?? body?.error ?? "unknown";
      const message = body?.message ?? `HTTP ${res.status}`;
      throw new GitForgeError(res.status, code, message);
    }
    return res.arrayBuffer();
  }

  async deleteWithBody<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(res) as Promise<T>;
  }
}
