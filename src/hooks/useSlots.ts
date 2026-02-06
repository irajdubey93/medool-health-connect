/**
 * Slot Hooks
 * Fetch available slots for booking
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Slot } from "@/types/api";

export const SLOTS_QUERY_KEY = ["slots"];

interface SlotsParams {
  date: string; // YYYY-MM-DD
  address_id: string;
}

export function useSlots(params: SlotsParams) {
  return useQuery({
    queryKey: [...SLOTS_QUERY_KEY, params],
    queryFn: () =>
      api.get<Slot[]>("/slots", { date: params.date, address_id: params.address_id }),
    enabled: !!params.date && !!params.address_id,
    staleTime: 2 * 60 * 1000, // 2 minutes - slots change frequently
  });
}
