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
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FileImage,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  ShoppingCart,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ExtractedTest, PrescriptionStatus } from "@/types/api";

const statusConfig: Record<
  PrescriptionStatus,
  { label: string; icon: React.ReactNode; description: string }
> = {
  UPLOADED: {
    label: "Processing",
    icon: <Clock className="h-5 w-5" />,
    description: "Your prescription is being analyzed...",
  },
  EXTRACTING: {
    label: "Extracting Tests",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    description: "AI is identifying tests from your prescription...",
  },
  EXTRACTED: {
    label: "Ready",
    icon: <CheckCircle className="h-5 w-5 text-success" />,
    description: "Tests have been extracted. Review and add to cart.",
  },
  EXTRACTION_FAILED: {
    label: "Extraction Failed",
    icon: <XCircle className="h-5 w-5 text-destructive" />,
    description: "Could not extract tests. Try uploading a clearer image.",
  },
};

export default function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { addItem, hasItem } = useCart();

  const { data: prescription, isLoading: prescriptionLoading } = usePrescription(prescriptionId);
  const { data: extractedTests, isLoading: extractedLoading } = useExtractedTests(prescriptionId);

  const [selectedTests, setSelectedTests] = React.useState<Set<string>>(new Set());

  const isLoading = prescriptionLoading || extractedLoading;

  // Filter mapped tests (with valid test reference)
  const mappedTests = extractedTests?.filter((et) => et.is_mapped && et.test) || [];
  const unmappedTests = extractedTests?.filter((et) => !et.is_mapped) || [];

  const toggleTest = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const selectAll = () => {
    const allTestIds = mappedTests
      .filter((et) => et.test && !hasItem(et.test.id))
      .map((et) => et.test!.id);
    setSelectedTests(new Set(allTestIds));
  };

  const handleAddToCart = () => {
    mappedTests.forEach((et) => {
      if (et.test && selectedTests.has(et.test.id)) {
        addItem(et.test, true);
      }
    });
    setSelectedTests(new Set());
    navigate("/cart");
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

  const status = statusConfig[prescription.status];
  const canAddToCart = prescription.status === "EXTRACTED" && selectedTests.size > 0;

  return (
    <MobileLayout title="Prescription" showBack showNav={false}>
      <div className="p-4 space-y-4 pb-24">
        {/* Prescription image */}
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              {prescription.file_type === "IMAGE" ? (
                <img
                  src={prescription.file_url}
                  alt="Prescription"
                  className="w-full max-h-64 object-contain bg-muted"
                />
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold">
                {prescription.title || "Prescription"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Uploaded {format(new Date(prescription.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
              {prescription.notes && (
                <p className="text-sm mt-2">{prescription.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className={cn(
          prescription.status === "EXTRACTION_FAILED" && "border-destructive/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {status.icon}
              <div>
                <p className="font-medium">{status.label}</p>
                <p className="text-sm text-muted-foreground">{status.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extracted tests */}
        {prescription.status === "EXTRACTED" && (
          <>
            {mappedTests.length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Identified Tests ({mappedTests.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mappedTests.map((et) => {
                    if (!et.test) return null;
                    const inCart = hasItem(et.test.id);
                    const isSelected = selectedTests.has(et.test.id);

                    return (
                      <div
                        key={et.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          inCart
                            ? "bg-muted opacity-60"
                            : isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => !inCart && toggleTest(et.test!.id)}
                      >
                        <Checkbox
                          checked={inCart || isSelected}
                          disabled={inCart}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{et.test.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {et.extracted_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(et.confidence * 100)}% match
                            </Badge>
                            {inCart && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                In Cart
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Unmapped tests */}
            {unmappedTests.length > 0 && (
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Could Not Match ({unmappedTests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unmappedTests.map((et) => (
                    <div
                      key={et.id}
                      className="p-3 rounded-lg bg-muted/50 text-muted-foreground"
                    >
                      <p className="text-sm">{et.extracted_name}</p>
                      <p className="text-xs mt-1">
                        Search manually if needed
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {mappedTests.length === 0 && unmappedTests.length === 0 && (
              <EmptyState
                icon={<FileImage className="h-8 w-8" />}
                title="No tests found"
                description="We couldn't identify any tests in this prescription"
                action={{
                  label: "Search Tests",
                  onClick: () => navigate("/search"),
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Fixed bottom action */}
      {prescription.status === "EXTRACTED" && mappedTests.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            className="w-full bg-gradient-primary"
            size="lg"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
          >
            {selectedTests.size > 0 ? (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add {selectedTests.size} Test(s) to Cart
              </>
            ) : (
              "Select Tests to Add"
            )}
          </Button>
        </div>
      )}
    </MobileLayout>
  );
}
