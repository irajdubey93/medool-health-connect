/**
 * Order Detail Page
 * Full order information with timeline, rider status, and reports
 */

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder, useCancelOrder } from "@/hooks/useOrders";
import { useReportDownload } from "@/hooks/useReports";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  OrderStatusBadge,
  RiderStatusBadge,
  SlotStatusBadge,
} from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  MapPin,
  Calendar,
  Building2,
  FileText,
  Download,
  XCircle,
  Phone,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Bike,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/api";

// Timeline steps with order
const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "OPS_REVIEW", label: "Order Placed" },
  { status: "OPS_APPROVED", label: "Approved" },
  { status: "SCHEDULED", label: "Scheduled" },
  { status: "COLLECTED", label: "Sample Collected" },
  { status: "DELIVERED_TO_LAB", label: "Delivered to Lab" },
  { status: "REPORTS_RECEIVED", label: "Reports Ready" },
  { status: "COMPLETED", label: "Completed" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  OPS_REVIEW: 0,
  OPS_APPROVED: 1,
  OPS_REJECTED: -1,
  SCHEDULED: 2,
  COLLECTED: 3,
  DELIVERED_TO_LAB: 4,
  REPORTS_RECEIVED: 5,
  COMPLETED: 6,
  CANCELLED: -1,
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrder(orderId);
  const cancelMutation = useCancelOrder();
  const reportDownloadMutation = useReportDownload();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  const handleCancel = async () => {
    if (!orderId || !cancelReason.trim()) return;

    try {
      await cancelMutation.mutateAsync({
        orderId,
        data: { reason: cancelReason },
      });
      setShowCancelDialog(false);
      setCancelReason("");
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownloadReport = (reportId: string) => {
    if (!orderId) return;
    reportDownloadMutation.mutate({ orderId, reportId });
  };

  const canCancel = order && (
    order.status === "OPS_REVIEW" || 
    order.status === "OPS_APPROVED"
  );

  if (isLoading) {
    return (
      <MobileLayout title="Order Details" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  if (!order) {
    return (
      <MobileLayout title="Order Details" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </MobileLayout>
    );
  }

  const currentStepIndex = STATUS_ORDER[order.status];
  const isTerminal = order.status === "CANCELLED" || order.status === "OPS_REJECTED";

  return (
    <MobileLayout title={`Order #${order.order_number}`} showBack showNav={false}>
      <div className="p-4 space-y-4 pb-24">
        {/* Status header */}
        <Card className={cn(
          isTerminal && "border-destructive/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Rejection/Cancellation reason */}
            {order.status === "OPS_REJECTED" && order.rejection_reason && (
              <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Reason: {order.rejection_reason}</span>
                </p>
              </div>
            )}
            {order.status === "CANCELLED" && order.cancellation_reason && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Cancelled: {order.cancellation_reason}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        {!isTerminal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TIMELINE_STEPS.map((step, index) => {
                  const stepIndex = STATUS_ORDER[step.status];
                  const isCompleted = stepIndex <= currentStepIndex;
                  const isCurrent = step.status === order.status;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "w-0.5 h-8",
                              stepIndex < currentStepIndex
                                ? "bg-primary"
                                : "bg-muted"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p
                          className={cn(
                            "font-medium text-sm",
                            isCurrent ? "text-primary" : isCompleted ? "" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rider status */}
        {order.rider_assignment && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Rider Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiderStatusBadge
                status={order.rider_assignment.status}
                riderName={order.rider_assignment.rider_name}
              />
            </CardContent>
          </Card>
        )}

        {/* Slot info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Collection Slot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SlotStatusBadge
              slotTime={format(new Date(order.slot_start_at), "EEE, MMM d 'at' h:mm a")}
              isConfirmed={order.slot_confirmed}
              orderStatus={order.status}
            />
          </CardContent>
        </Card>

        {/* Patient & Address */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{order.profile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.profile.user_type} • {order.profile.relation}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm">{order.address.address_line}</p>
                <p className="text-xs text-muted-foreground">
                  {order.address.city} - {order.address.pincode}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm">{order.lab.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tests ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{item.test.name}</span>
                <span className="text-sm font-medium">
                  {formatPrice(item.price_paise)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment (COD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(order.total_mrp_paise)}</span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_paise)}</span>
              </div>
            )}
            {order.coupon_discount_paise > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Coupon</span>
                <span>-{formatPrice(order.coupon_discount_paise)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.final_price_paise)}</span>
            </div>
            {order.cod_collected_paise > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground pt-2">
                <span>Collected</span>
                <span>{formatPrice(order.cod_collected_paise)}</span>
              </div>
            )}
            {order.cod_outstanding_paise > 0 && (
              <div className="flex justify-between text-sm font-medium">
                <span>Outstanding</span>
                <span className="text-warning">{formatPrice(order.cod_outstanding_paise)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        {order.reports.length > 0 && (
          <Card className="border-success/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-success">
                <FileText className="h-4 w-4" />
                Reports ({order.reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.reports.map((report, index) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Report {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.file_type} • {(report.file_size_bytes / 1024).toFixed(0)} KB
                        {report.is_verified && (
                          <Badge variant="outline" className="ml-2 text-xs text-success">
                            Verified
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadReport(report.id)}
                    disabled={reportDownloadMutation.isPending}
                  >
                    {reportDownloadMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom action */}
      {canCancel && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        </div>
      )}

      {/* Cancel dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please provide a reason for cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {cancelMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Cancel Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
