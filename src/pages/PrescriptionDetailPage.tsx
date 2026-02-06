/**
 * Prescription Detail Page
 * View prescription and extracted tests
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrescription, useExtractedTests } from "@/hooks/usePrescriptions";
import { useCart } from "@/contexts/CartContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingCart,
  Check,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { PrescriptionStatus, ResolvedItem } from "@/types/api";

const statusConfig: Record<
  PrescriptionStatus,
  { label: string; icon: React.ReactNode; description: string }
> = {
  UPLOADED: {
    label: "Processing",
    icon: <Clock className="h-5 w-5" />,
    description: "Your prescription is being processed",
  },
  EXTRACTING: {
    label: "Extracting",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    description: "AI is extracting test information",
  },
  EXTRACTED: {
    label: "Ready",
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Tests have been extracted successfully",
  },
  FAILED: {
    label: "Failed",
    icon: <XCircle className="h-5 w-5" />,
    description: "Could not extract tests from this prescription",
  },
};

export default function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { addItem, hasItem } = useCart();

  const { data: prescription, isLoading } = usePrescription(prescriptionId);
  const { data: cartAssist, isLoading: extractedLoading } = useExtractedTests(prescriptionId);

  // Get resolved and unmapped items from cart assist
  const resolvedItems = cartAssist?.resolved_items || [];
  const unmappedItems = cartAssist?.unmapped_items || [];

  const handleAddToCart = (item: ResolvedItem) => {
    if (!hasItem(item.test_id)) {
      // Create a minimal test object from the resolved item
      addItem({
        id: item.test_id,
        code: item.test_code,
        name: item.test_name,
        sample_type: item.sample_type as "BLOOD" | "URINE",
        requires_fasting: item.requires_fasting,
        requires_cold_chain: false,
        is_active: true,
      }, true);
      toast.success(`Added ${item.test_name} to cart`);
    }
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    resolvedItems.forEach((item) => {
      if (!hasItem(item.test_id)) {
        addItem({
          id: item.test_id,
          code: item.test_code,
          name: item.test_name,
          sample_type: item.sample_type as "BLOOD" | "URINE",
          requires_fasting: item.requires_fasting,
          requires_cold_chain: false,
          is_active: true,
        }, true);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} test(s) to cart`);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Prescription" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  if (!prescription) {
    return (
      <MobileLayout title="Prescription" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Prescription not found</p>
        </div>
      </MobileLayout>
    );
  }

  const status = statusConfig[prescription.status] || statusConfig.UPLOADED;
  const allInCart = resolvedItems.length > 0 && resolvedItems.every((item) => hasItem(item.test_id));

  return (
    <MobileLayout title="Prescription" showBack showNav={false}>
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Prescription info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {prescription.title || "Untitled Prescription"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(prescription.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-2 gap-1 ${
                      prescription.status === "EXTRACTED"
                        ? "bg-success/15 text-success"
                        : prescription.status === "FAILED"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </div>

              {prescription.note && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{prescription.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status message */}
          {prescription.status !== "EXTRACTED" && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{status.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Extracted tests */}
          {prescription.status === "EXTRACTED" && (
            <>
              {resolvedItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Matched Tests ({resolvedItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resolvedItems.map((item) => {
                      const inCart = hasItem(item.test_id);
                      return (
                        <div
                          key={item.test_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.test_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.extracted_label}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={inCart ? "outline" : "default"}
                            onClick={() => handleAddToCart(item)}
                            disabled={inCart}
                          >
                            {inCart ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {unmappedItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      Unmatched Items ({unmappedItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {unmappedItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-muted/50"
                      >
                        <p className="text-sm text-muted-foreground">
                          {item.extracted_label}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Bottom action */}
        {prescription.status === "EXTRACTED" && resolvedItems.length > 0 && (
          <div className="border-t p-4 bg-background">
            <Button
              className={`w-full ${allInCart ? "" : "bg-gradient-primary"}`}
              size="lg"
              variant={allInCart ? "outline" : "default"}
              onClick={allInCart ? () => navigate("/cart") : handleAddAllToCart}
            >
              {allInCart ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Go to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add All to Cart
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
