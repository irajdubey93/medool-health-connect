/**
 * Order Hooks
 * Create, list, detail, cancel orders
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderCancelRequest,
  OrderListResponse,
  OrderListItem,
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
    queryFn: async () => {
      const response = await api.get<OrderListResponse>("/orders", params as Record<string, unknown>);
      // Normalize to expected format for UI components
      return {
        items: response.orders || [],
        total: response.total || 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
        has_more: (response.orders?.length || 0) >= (params.limit || 20),
      };
    },
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
    mutationFn: (data: OrderCreateRequest) => api.post<OrderCreateResponse>("/orders", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      // Note: OrderCreateResponse returns order_id, not full order
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
