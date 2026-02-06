/**
 * Cart Page
 * Review and checkout cart items
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ShoppingCart,
  Trash2,
  Droplet,
  FlaskConical,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SampleType } from "@/types/api";

const sampleTypeIcons: Record<SampleType, React.ReactNode> = {
  BLOOD: <Droplet className="h-4 w-4" />,
  URINE: <FlaskConical className="h-4 w-4" />,
};

const sampleTypeColors: Record<SampleType, string> = {
  BLOOD: "bg-red-100 text-red-700",
  URINE: "bg-amber-100 text-amber-700",
};

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearCart } = useCart();
  const { activeProfile } = useAuth();

  const handleRemoveItem = (testId: string) => {
    removeItem(testId);
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <MobileLayout title="Cart" showBack>
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Add tests from search or prescription to get started"
          action={{
            label: "Search Tests",
            onClick: () => navigate("/search"),
          }}
        />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Cart" showBack showNav={false}>
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Active profile banner */}
        {activeProfile && (
          <div className="p-3 bg-primary/5 border-b flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{activeProfile.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {activeProfile.user_type} • {activeProfile.relation}
              </p>
            </div>
            <Link to="/profiles" className="text-xs text-primary font-medium">
              Change
            </Link>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.map((item) => (
            <Card key={item.test_id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                      sampleTypeColors[item.test.sample_type] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {sampleTypeIcons[item.test.sample_type] || <FlaskConical className="h-4 w-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {item.test.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.test.sample_type}
                      </Badge>
                      {item.test.requires_fasting && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Fasting
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveItem(item.test_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Clear cart */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={clearCart}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        {/* Bottom section */}
        <div className="border-t p-4 bg-background">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">{items.length} test(s)</span>
            <span className="text-sm text-muted-foreground">
              Prices shown after lab selection
            </span>
          </div>
          <Button
            className="w-full bg-gradient-primary"
            size="lg"
            onClick={handleProceedToCheckout}
            disabled={!activeProfile}
          >
            {!activeProfile ? (
              "Select a Profile First"
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
