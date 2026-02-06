/**
 * Test Detail Page
 * Show full test information
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
  FileText,
  AlertCircle,
  Check,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SampleType } from "@/types/api";

const sampleTypeIcons: Record<SampleType, React.ReactNode> = {
  BLOOD: <Droplet className="h-5 w-5" />,
  URINE: <FlaskConical className="h-5 w-5" />,
  STOOL: <FlaskConical className="h-5 w-5" />,
  OTHER: <FlaskConical className="h-5 w-5" />,
};

const sampleTypeColors: Record<SampleType, string> = {
  BLOOD: "bg-red-100 text-red-700",
  URINE: "bg-amber-100 text-amber-700",
  STOOL: "bg-orange-100 text-orange-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export default function TestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { addItem, hasItem } = useCart();

  const { data: test, isLoading } = useTest(testId);

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

  const inCart = hasItem(test.id);

  const handleAddToCart = () => {
    addItem(test);
  };

  return (
    <MobileLayout title="Test Details" showBack>
      <div className="p-4 space-y-4 pb-24">
        {/* Test header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  sampleTypeColors[test.sample_type]
                )}
              >
                {sampleTypeIcons[test.sample_type]}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{test.name}</h1>
                <p className="text-sm text-muted-foreground">{test.code}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className={sampleTypeColors[test.sample_type]}>
                {test.sample_type} Sample
              </Badge>
              {test.fasting_required && (
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  <Clock className="h-3 w-3 mr-1" />
                  {test.fasting_hours || 8} hours fasting
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {test.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{test.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Special Instructions */}
        {test.special_instructions && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                Special Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">{test.special_instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Aliases */}
        {test.aliases && test.aliases.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Also Known As</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {test.aliases.map((alias, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {alias}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed bottom action */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t">
        <div className="flex gap-3">
          <Button
            className={cn("flex-1", !inCart && "bg-gradient-primary")}
            size="lg"
            variant={inCart ? "secondary" : "default"}
            onClick={handleAddToCart}
            disabled={inCart}
          >
            {inCart ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Added to Cart
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
          {inCart && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
