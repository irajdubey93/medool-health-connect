/**
 * Offline Indicator Component
 * Shows when the app is offline
 */

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground",
        "py-2 px-4 text-center text-sm font-medium",
        "flex items-center justify-center gap-2",
        "animate-slide-down"
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
}
