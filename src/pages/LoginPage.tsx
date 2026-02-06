/**
 * Login Page
 * - Phone input with +91 prefix
 * - OTP request with cooldown
 * - OTP verification with auto-focus
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { ArrowRight, Phone, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import medoolLoader from "@/assets/medool-loader.gif";

type Step = "phone" | "otp";

const DEFAULT_COOLDOWN = 60; // seconds

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestOTP, verifyOTP, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus phone input on mount
  useEffect(() => {
    if (step === "phone") {
      phoneInputRef.current?.focus();
    }
  }, [step]);

  // Validate phone number
  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  // Handle phone submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone || isLoading || cooldown > 0) return;

    setError("");
    setIsLoading(true);

    try {
      await requestOTP(`+91${phone}`);
      setCooldown(DEFAULT_COOLDOWN);
      setStep("otp");
      toast.success("OTP sent to your phone");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP submit
  const handleOTPSubmit = async (value: string) => {
    if (value.length !== 6 || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      await verifyOTP(`+91${phone}`, value);
      toast.success("Welcome to Medool!");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid OTP";
      setError(message);
      setOtp("");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (cooldown > 0 || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      await requestOTP(`+91${phone}`);
      setCooldown(DEFAULT_COOLDOWN);
      toast.success("OTP resent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend OTP";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to phone
  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setError("");
  };

  if (authLoading) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking session..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-primary px-6 pt-12 pb-16 safe-top">
        <div className="flex items-center justify-center mb-6">
          <img
            src={medoolLoader}
            alt="Medool"
            className="h-16 w-16"
          />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">
          Welcome to Medool
        </h1>
        <p className="text-white/80 text-center mt-2">
          Book diagnostic tests with ease
        </p>
      </div>

      {/* Content card */}
      <div className="flex-1 -mt-8 rounded-t-3xl bg-background px-6 pt-8">
        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Enter your phone number</h2>
              <p className="text-sm text-muted-foreground">
                We'll send you a verification code
              </p>
            </div>

            {/* Phone input */}
            <div className="relative">
              <div className="absolute left-0 top-0 flex h-full items-center pl-4 text-muted-foreground">
                <Phone className="h-5 w-5 mr-2" />
                <span className="font-medium">+91</span>
              </div>
              <Input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhone(value);
                  setError("");
                }}
                className={cn(
                  "h-14 pl-24 text-lg font-medium",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={!isValidPhone || isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Change number
            </button>

            <div>
              <h2 className="text-xl font-semibold mb-2">Enter verification code</h2>
              <p className="text-sm text-muted-foreground">
                Code sent to +91 {phone}
              </p>
            </div>

            {/* OTP input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  setError("");
                  if (value.length === 6) {
                    handleOTPSubmit(value);
                  }
                }}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={cn(
                        "h-14 w-12 text-xl",
                        error && "border-destructive"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {isLoading && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" text="Verifying..." />
              </div>
            )}

            {/* Resend button */}
            <div className="text-center">
              {cooldown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in {cooldown}s
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
