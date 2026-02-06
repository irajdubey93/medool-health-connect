/**
 * Test Detail Page
 * Simplified view for test details
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTest } from "@/hooks/useTests";
import { useCart } from "@/contexts/CartContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import {
  Droplet,
  FlaskConical,
  Clock,
  ShoppingCart,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { SampleType, TestDetail } from "@/types/api";

const sampleTypeIcons: Record<SampleType, React.ReactNode> = {
  BLOOD: <Droplet className="h-5 w-5" />,
  URINE: <FlaskConical className="h-5 w-5" />,
};

const sampleTypeColors: Record<SampleType, string> = {
  BLOOD: "bg-red-100 text-red-700",
  URINE: "bg-amber-100 text-amber-700",
};

export default function TestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { addItem, hasItem } = useCart();

  const { data: test, isLoading } = useTest(testId);

  const isInCart = test ? hasItem(test.id) : false;

  const handleAddToCart = () => {
    if (test && !isInCart) {
      addItem(test);
      toast.success("Added to cart");
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Test Details" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  if (!test) {
    return (
      <MobileLayout title="Test Details" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Test not found</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Test Details" showBack showNav={false}>
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Test info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    sampleTypeColors[test.sample_type] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {sampleTypeIcons[test.sample_type] || <FlaskConical className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">{test.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Code: {test.code}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">{test.sample_type}</Badge>
                {test.requires_fasting && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Fasting Required
                  </Badge>
                )}
                {test.requires_cold_chain && (
                  <Badge variant="outline">Cold Chain</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sample Type</span>
                <span>{test.sample_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fasting</span>
                <span>{test.requires_fasting ? "Required" : "Not required"}</span>
              </div>
              {test.requires_cold_chain && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cold Chain</span>
                  <span>Required</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom action */}
        <div className="border-t p-4 bg-background">
          <Button
            className={`w-full ${isInCart ? "" : "bg-gradient-primary"}`}
            size="lg"
            variant={isInCart ? "outline" : "default"}
            onClick={isInCart ? () => navigate("/cart") : handleAddToCart}
          >
            {isInCart ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Go to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
