import { describe, it, expect } from "bun:test";
import { paginate, type PageFetcher } from "../pagination";

describe("paginate", () => {
  it("yields all items from a single page", async () => {
    const fetcher: PageFetcher<{ id: string }> = async (_limit, _offset) => ({
      data: [{ id: "a" }, { id: "b" }],
      total: 2, limit: 20, offset: 0, hasMore: false,
    });

    const items: { id: string }[] = [];
    for await (const item of paginate(fetcher)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("fetches multiple pages until hasMore is false", async () => {
    let callCount = 0;
    const fetcher: PageFetcher<number> = async (limit, offset) => {
      callCount++;
      if (offset === 0) return { data: [1, 2], total: 5, limit, offset, hasMore: true };
      if (offset === 2) return { data: [3, 4], total: 5, limit, offset, hasMore: true };
      return { data: [5], total: 5, limit, offset, hasMore: false };
    };

    const items: number[] = [];
    for await (const item of paginate(fetcher, { pageSize: 2 })) {
      items.push(item);
    }

    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect(callCount).toBe(3);
  });

  it("respects maxItems limit", async () => {
    const fetcher: PageFetcher<number> = async () => ({
      data: [1, 2, 3, 4, 5], total: 100, limit: 5, offset: 0, hasMore: true,
    });

    const items: number[] = [];
    for await (const item of paginate(fetcher, { maxItems: 3 })) {
      items.push(item);
    }

    expect(items).toEqual([1, 2, 3]);
  });

  it("handles empty first page", async () => {
    const fetcher: PageFetcher<number> = async () => ({
      data: [], total: 0, limit: 20, offset: 0, hasMore: false,
    });

    const items: number[] = [];
    for await (const item of paginate(fetcher)) {
      items.push(item);
    }

    expect(items).toEqual([]);
  });
});
