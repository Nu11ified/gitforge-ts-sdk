import type { PaginatedResponse } from "./types";

export type PageFetcher<T> = (
  limit: number,
  offset: number,
) => Promise<PaginatedResponse<T>>;

export interface PaginateOptions {
  pageSize?: number;
  maxItems?: number;
}

/**
 * Async generator that auto-paginates through a list endpoint.
 *
 * Usage:
 *   for await (const repo of paginate((l, o) => client.repos.list({ limit: l, offset: o }))) {
 *     console.log(repo.name);
 *   }
 */
export async function* paginate<T>(
  fetcher: PageFetcher<T>,
  opts: PaginateOptions = {},
): AsyncGenerator<T, void, undefined> {
  const pageSize = opts.pageSize ?? 20;
  const maxItems = opts.maxItems ?? Infinity;
  let offset = 0;
  let yielded = 0;

  while (true) {
    const page = await fetcher(pageSize, offset);

    for (const item of page.data) {
      if (yielded >= maxItems) return;
      yield item;
      yielded++;
    }

    if (!page.hasMore || page.data.length === 0) return;
    offset += page.data.length;
  }
}
