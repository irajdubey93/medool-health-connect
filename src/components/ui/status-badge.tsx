/**
 * Status Badge Component
 * Displays order and rider status with appropriate colors
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FlaskConical,
  Building2,
  FileCheck,
  CheckCircle2,
  Ban,
  Loader2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, RiderAssignmentStatus } from "@/types/api";

// Order status configuration
const orderStatusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  OPS_REVIEW: {
    label: "Under Review",
    icon: Clock,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  OPS_APPROVED: {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-info/15 text-info border-info/30",
  },
  OPS_REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: Calendar,
    className: "bg-info/15 text-info border-info/30",
  },
  COLLECTED: {
    label: "Sample Collected",
    icon: FlaskConical,
    className: "bg-info/15 text-info border-info/30",
  },
  DELIVERED_TO_LAB: {
    label: "At Lab",
    icon: Building2,
    className: "bg-info/15 text-info border-info/30",
  },
  REPORTS_RECEIVED: {
    label: "Reports Ready",
    icon: FileCheck,
    className: "bg-success/15 text-success border-success/30",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-success/15 text-success border-success/30",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    className: "bg-muted text-muted-foreground border-muted",
  },
};

// Rider status configuration
const riderStatusConfig: Record<
  RiderAssignmentStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  PENDING: {
    label: "Waiting for dispatch...",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  },
  OFFERING: {
    label: "Finding rider nearby...",
    icon: Loader2,
    className: "bg-warning/15 text-warning",
  },
  ASSIGNED: {
    label: "Rider assigned",
    icon: UserCheck,
    className: "bg-success/15 text-success",
  },
  CANCELLED: {
    label: "Dispatch cancelled",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive",
  },
  FAILED: {
    label: "No rider available",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = orderStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

interface RiderStatusBadgeProps {
  status: RiderAssignmentStatus;
  riderName?: string;
  className?: string;
}

export function RiderStatusBadge({
  status,
  riderName,
  className,
}: RiderStatusBadgeProps) {
  const config = riderStatusConfig[status];
  const Icon = config.icon;

  const label = status === "ASSIGNED" && riderName
    ? `Rider: ${riderName}`
    : config.label;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", config.className, className)}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "OFFERING" && "animate-spin")} />
      {label}
    </Badge>
  );
}

interface SlotStatusBadgeProps {
  slotTime: string;
  isConfirmed: boolean;
  orderStatus: OrderStatus;
  className?: string;
}

export function SlotStatusBadge({
  slotTime,
  isConfirmed,
  orderStatus,
  className,
}: SlotStatusBadgeProps) {
  const isCancelledOrRejected =
    orderStatus === "CANCELLED" || orderStatus === "OPS_REJECTED";

  if (isCancelledOrRejected) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 font-medium bg-muted text-muted-foreground line-through",
          className
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        Slot: {slotTime}
      </Badge>
    );
  }

  if (isConfirmed) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 font-medium bg-success/15 text-success border-success/30",
          className
        )}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Confirmed: {slotTime}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium bg-warning/15 text-warning border-warning/30",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      Requested: {slotTime}
    </Badge>
  );
}
