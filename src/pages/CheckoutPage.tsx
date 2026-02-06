/**
 * Checkout Page
 * Simplified multi-step quote and order flow
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useAddresses } from "@/hooks/useAddresses";
import { useSlots } from "@/hooks/useSlots";
import { useQuotePreview, useCreateQuote, useFinalizeQuote } from "@/hooks/useQuotes";
import { useCreateOrder } from "@/hooks/useOrders";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  MapPin,
  Calendar,
  Tag,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Clock,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Slot, LabOptionSummary } from "@/types/api";

type Step = "review" | "address" | "slot" | "labs" | "confirm";

const STEPS: Step[] = ["review", "address", "slot", "labs", "confirm"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { items, clearCart } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const [step, setStep] = useState<Step>("review");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [finalQuote, setFinalQuote] = useState<any>(null);

  const quotePreviewMutation = useQuotePreview();
  const createQuoteMutation = useCreateQuote();
  const finalizeQuoteMutation = useFinalizeQuote();
  const createOrderMutation = useCreateOrder();

  const { data: slots, isLoading: slotsLoading } = useSlots({
    date: selectedDate,
    address_id: selectedAddressId,
  });

  // Set default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const stepIndex = STEPS.indexOf(step);

  // Convert cart items to quote format
  const quoteItems = items.map((item) => ({
    test_id: item.test_id,
    quantity: item.quantity || 1,
  }));

  const handleNext = async () => {
    if (step === "review") {
      setStep("address");
    } else if (step === "address") {
      setStep("slot");
    } else if (step === "slot") {
      // Get lab pricing
      try {
        await quotePreviewMutation.mutateAsync({
          profile_id: activeProfile!.id,
          address_id: selectedAddressId,
          items: quoteItems,
          slot_start_at: selectedSlot || undefined,
          coupon_code: couponCode || undefined,
        });
        setStep("labs");
      } catch {
        // Error handled by mutation
      }
    } else if (step === "labs") {
      // Create and finalize quote
      try {
        const newQuote = await createQuoteMutation.mutateAsync({
          profile_id: activeProfile!.id,
          address_id: selectedAddressId,
          items: quoteItems,
          slot_start_at: selectedSlot || undefined,
          coupon_code: couponCode || undefined,
        });

        setQuoteId(newQuote.quote_id);

        const finalized = await finalizeQuoteMutation.mutateAsync({
          quoteId: newQuote.quote_id,
          data: { selected_lab_id: selectedLabId },
        });

        setFinalQuote(finalized);
        setStep("confirm");
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const handlePlaceOrder = async () => {
    if (!quoteId) return;

    try {
      const orderResponse = await createOrderMutation.mutateAsync({
        quote_id: quoteId,
      });
      clearCart();
      navigate(`/orders/${orderResponse.order_id}`, { replace: true });
    } catch {
      // Error handled by mutation
    }
  };

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  // Available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE, MMM d"),
    };
  });

  if (!activeProfile || items.length === 0) {
    navigate("/cart");
    return null;
  }

  const labOptions = quotePreviewMutation.data?.labs || [];

  return (
    <MobileLayout title="Checkout" showBack showNav={false}>
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Progress indicator */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    i <= stepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Step 1: Review */}
          {step === "review" && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activeProfile.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeProfile.user_type} • {activeProfile.relation}
                      </p>
                    </div>
                    <Badge variant="outline">{activeProfile.gender}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Tests ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.test_id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm">{item.test.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.test.sample_type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 2: Address */}
          {step === "address" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Collection Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addressesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : addresses && addresses.length > 0 ? (
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={setSelectedAddressId}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <RadioGroupItem value={address.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.label || "Address"}</span>
                            {address.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.address_line1}
                          </p>
                          {address.pincode && (
                            <p className="text-xs text-muted-foreground">
                              Pincode: {address.pincode}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">
                      No addresses saved
                    </p>
                    <Button onClick={() => navigate("/address/new")}>
                      Add Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Slot */}
          {step === "slot" && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {availableDates.map((date) => (
                      <Button
                        key={date.value}
                        variant={selectedDate === date.value ? "default" : "outline"}
                        className={cn(
                          "flex-shrink-0",
                          selectedDate === date.value && "bg-gradient-primary"
                        )}
                        onClick={() => {
                          setSelectedDate(date.value);
                          setSelectedSlot("");
                        }}
                      >
                        {date.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Select Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : slots && slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot: Slot) => {
                        const isAvailable = slot.available > 0;
                        const startTime = format(new Date(slot.start_at), "h:mm a");
                        return (
                          <Button
                            key={slot.start_at}
                            variant={selectedSlot === slot.start_at ? "default" : "outline"}
                            className={cn(
                              "h-auto py-2 flex-col",
                              selectedSlot === slot.start_at && "bg-gradient-primary",
                              !isAvailable && "opacity-50"
                            )}
                            disabled={!isAvailable}
                            onClick={() => setSelectedSlot(slot.start_at)}
                          >
                            <span className="text-sm">{startTime}</span>
                            {!isAvailable && (
                              <span className="text-2xs text-muted-foreground">Full</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No slots available for this date
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Coupon Code (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 4: Labs */}
          {step === "labs" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Select Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotePreviewMutation.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : labOptions.length > 0 ? (
                  <RadioGroup
                    value={selectedLabId}
                    onValueChange={setSelectedLabId}
                    className="space-y-3"
                  >
                    {labOptions.map((labOption: LabOptionSummary, index: number) => (
                      <div
                        key={labOption.lab_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedLabId === labOption.lab_id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedLabId(labOption.lab_id)}
                      >
                        <RadioGroupItem value={labOption.lab_id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{labOption.lab_name}</span>
                            {index === 0 && (
                              <Badge className="bg-success text-success-foreground text-xs">
                                Best Price
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {labOption.distance_km?.toFixed(1)} km away
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-semibold text-primary">
                              {formatPrice(labOption.total_payable_paise)}
                            </span>
                            {labOption.total_discount_paise > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Save {formatPrice(labOption.total_discount_paise)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No labs available for this selection
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Confirm */}
          {step === "confirm" && finalQuote && (
            <>
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Tests ({finalQuote.items?.length || items.length})</span>
                    <span>{formatPrice(finalQuote.tests_subtotal_paise || 0)}</span>
                  </div>
                  {finalQuote.total_discount_paise > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-{formatPrice(finalQuote.total_discount_paise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total (COD)</span>
                    <span className="text-lg text-primary">
                      {formatPrice(finalQuote.total_payable_paise)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{activeProfile.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeProfile.user_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm">{selectedAddress?.address_line1}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm">
                      {selectedSlot && format(new Date(selectedSlot), "EEE, MMM d 'at' h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="p-3 bg-warning/10 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm text-warning">
                  Your slot will be confirmed after operations review.
                  You'll be notified once confirmed.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="border-t p-4 bg-background">
          <div className="flex gap-3">
            {step !== "review" && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={
                  createQuoteMutation.isPending ||
                  finalizeQuoteMutation.isPending ||
                  createOrderMutation.isPending
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {step === "confirm" ? (
              <Button
                className="flex-1 bg-gradient-primary"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Placing Order...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Place Order (COD)
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-gradient-primary"
                size="lg"
                onClick={handleNext}
                disabled={
                  (step === "address" && !selectedAddressId) ||
                  (step === "slot" && !selectedSlot) ||
                  (step === "labs" && !selectedLabId) ||
                  quotePreviewMutation.isPending ||
                  createQuoteMutation.isPending ||
                  finalizeQuoteMutation.isPending
                }
              >
                {quotePreviewMutation.isPending ||
                createQuoteMutation.isPending ||
                finalizeQuoteMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
