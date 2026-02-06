/**
 * Orders List Page
 * View all orders with filtering
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge, SlotStatusBadge } from "@/components/ui/status-badge";
import {
  ClipboardList,
  ChevronRight,
  Building2,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";
import type { OrderStatus } from "@/types/api";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "OPS_REVIEW", label: "Under Review" },
  { value: "OPS_APPROVED", label: "Approved" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COLLECTED", label: "Collected" },
  { value: "REPORTS_RECEIVED", label: "Reports Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrdersListPage() {
  const navigate = useNavigate();
  const { activeProfile, profiles } = useAuth();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");

  const { data, isLoading, isFetching } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    profile_id: profileFilter !== "all" ? profileFilter : undefined,
    limit: 50,
  });

  const orders = data?.items || [];

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  return (
    <MobileLayout title="Orders">
      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="p-4 border-b bg-background sticky top-14 z-30 space-y-3">
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All Profiles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <Skeleton className="h-6 w-24" />
                </CardContent>
              </Card>
            ))
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{order.profile.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {order.profile.user_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{order.lab.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <SlotStatusBadge
                        slotTime={format(new Date(order.slot_start_at), "MMM d, h:mm a")}
                        isConfirmed={order.slot_confirmed}
                        orderStatus={order.status}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {order.items.length} test(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        {formatPrice(order.final_price_paise)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No orders yet"
              description="Your orders will appear here after you book a test"
              action={{
                label: "Book a Test",
                onClick: () => navigate("/search"),
              }}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
