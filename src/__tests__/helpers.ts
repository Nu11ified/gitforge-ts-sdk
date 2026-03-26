import { mock } from "bun:test";

export type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
};

/**
 * Create a mock fetch that records calls and returns preset responses.
 * Pass an array of responses; they're consumed in order.
 */
export function createMockFetch(
  responses: Array<{ status: number; body: unknown; ok?: boolean }>,
): { fetch: typeof globalThis.fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  let callIndex = 0;

  const mockFetchFn = mock(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    const method = init?.method ?? "GET";
    const headers = (init?.headers as Record<string, string>) ?? {};
    const bodyText = init?.body ? String(init.body) : undefined;
    let body: unknown;
    try { body = bodyText ? JSON.parse(bodyText) : undefined; } catch { body = bodyText; }
    calls.push({ url: urlStr, method, headers, body });

    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;

    return {
      ok: resp.ok ?? (resp.status >= 200 && resp.status < 300),
      status: resp.status,
      json: async () => resp.body,
      text: async () => (resp.body != null ? JSON.stringify(resp.body) : ""),
    } as Response;
  }) as unknown as typeof globalThis.fetch;

  return { fetch: mockFetchFn, calls };
}

/**
 * Shortcut: create a mock fetch that always returns 200 with the given body.
 */
export function mockOk(body: unknown) {
  return createMockFetch([{ status: 200, body, ok: true }]);
}

/**
 * Shortcut: create a mock fetch that returns an error.
 */
export function mockError(status: number, code: string, message: string) {
  return createMockFetch([{
    status,
    body: { code, message },
    ok: false,
  }]);
}
