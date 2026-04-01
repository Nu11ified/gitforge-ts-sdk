import type { HttpClient } from "../http";
import type { StreamEvent } from "../types";

export interface RepoStreamOptions {
  types?: string[];
  paths?: string[];
}

export interface ChangeStreamOptions {
  repos?: string[];
  eventTypes?: string[];
  paths?: string[];
}

export class StreamsResource {
  constructor(private http: HttpClient) {}

  async *repo(repoId: string, opts: RepoStreamOptions = {}): AsyncGenerator<StreamEvent> {
    const query: Record<string, string> = {};
    if (opts.types?.length) query.types = opts.types.join(",");
    if (opts.paths?.length) query.paths = opts.paths.join(",");

    for await (const raw of this.http.sse(`/repos/${repoId}/stream`, query)) {
      if (raw.event === "connected") continue;
      try {
        yield { event: raw.event, data: JSON.parse(raw.data) };
      } catch {
        yield { event: raw.event, data: { raw: raw.data } };
      }
    }
  }

  async *changes(opts: ChangeStreamOptions = {}): AsyncGenerator<StreamEvent> {
    const query: Record<string, string> = {};
    if (opts.repos?.length) query.repos = opts.repos.join(",");
    if (opts.eventTypes?.length) query.eventTypes = opts.eventTypes.join(",");
    if (opts.paths?.length) query.paths = opts.paths.join(",");

    for await (const raw of this.http.sse("/stream/changes", query)) {
      if (raw.event === "connected") continue;
      try {
        yield { event: raw.event, data: JSON.parse(raw.data) };
      } catch {
        yield { event: raw.event, data: { raw: raw.data } };
      }
    }
  }
}
