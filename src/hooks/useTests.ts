/**
 * Test Catalog Hooks
 * Search and fetch tests
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { normalizePaginatedResponse } from "@/lib/api-utils";
import type { Test, TestSearchParams, PaginatedResponse } from "@/types/api";

export const TESTS_QUERY_KEY = ["tests"];

export function useSearchTests(params: TestSearchParams) {
  return useQuery({
    queryKey: [...TESTS_QUERY_KEY, "search", params],
    queryFn: async () => {
      const response = await api.get<unknown>("/tests", params as Record<string, unknown>);
      return normalizePaginatedResponse<Test>(response, params);
    },
    enabled: !params.q || params.q.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - can be stale-while-revalidate
  });
}

export function useInfiniteTests(params: Omit<TestSearchParams, "offset">) {
  return useInfiniteQuery({
    queryKey: [...TESTS_QUERY_KEY, "infinite", params],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = {
        ...params,
        offset: pageParam,
        limit: params.limit || 20,
      };
      const response = await api.get<unknown>("/tests", queryParams as Record<string, unknown>);
      return normalizePaginatedResponse<Test>(response, queryParams);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      return lastPage.offset + lastPage.limit;
    },
    initialPageParam: 0,
    enabled: !params.q || params.q.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTest(testId: string | undefined) {
  return useQuery({
    queryKey: [...TESTS_QUERY_KEY, testId],
    queryFn: () => api.get<Test>(`/tests/${testId}`),
    enabled: !!testId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
