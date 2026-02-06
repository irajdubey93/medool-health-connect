/**
 * Order Hooks
 * Create, list, detail, cancel orders
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Order,
  OrderCreateRequest,
  OrderCancelRequest,
  PaginatedResponse,
  OrderStatus,
} from "@/types/api";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

export const ORDERS_QUERY_KEY = ["orders"];

interface OrdersParams {
  status?: OrderStatus;
  profile_id?: string;
  limit?: number;
  offset?: number;
}

export function useOrders(params: OrdersParams = {}) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, params],
    queryFn: () =>
      api.get<PaginatedResponse<Order>>("/orders", params as Record<string, unknown>),
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, orderId],
    queryFn: () => api.get<Order>(`/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Auto-refresh while in transitional states
      const order = query.state.data;
      if (order) {
        const transitionalStatuses: OrderStatus[] = [
          "OPS_REVIEW",
          "OPS_APPROVED",
          "SCHEDULED",
          "COLLECTED",
          "DELIVERED_TO_LAB",
        ];
        if (transitionalStatuses.includes(order.status)) {
          return 30000; // 30 seconds
        }
      }
      return false;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderCreateRequest) => api.post<Order>("/orders", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      analytics.orderPlaced(data.id, data.final_price_paise);
      toast.success("Order placed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: OrderCancelRequest }) =>
      api.post<Order>(`/orders/${orderId}/cancel`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      analytics.orderCancelled(data.id, data.status);
      toast.success("Order cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
