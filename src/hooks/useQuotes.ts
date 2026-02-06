/**
 * Quote Hooks
 * Preview, create, finalize quotes
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Quote,
  QuotePreviewRequest,
  QuotePreviewResponse,
  QuoteCreateRequest,
  QuoteCreateResponse,
  QuoteFinalizeRequest,
} from "@/types/api";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

export const QUOTES_QUERY_KEY = ["quotes"];

export function useQuotePreview() {
  return useMutation({
    mutationFn: (data: QuotePreviewRequest) =>
      api.post<QuotePreviewResponse>("/quotes/preview", data),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuoteCreateRequest) => api.post<QuoteCreateResponse>("/quotes", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      analytics.quoteCreated(data.lab_options?.length || 0, "");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useFinalizeQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: QuoteFinalizeRequest }) =>
      api.post<Quote>(`/quotes/${quoteId}/finalize`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      toast.success("Quote finalized");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
