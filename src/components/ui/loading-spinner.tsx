/**
 * Branded Loading Spinner
 * Uses the Medool animated loader GIF
 */

import React from "react";
import medoolLoader from "@/assets/medool-loader.gif";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <img
        src={medoolLoader}
        alt="Loading..."
        className={sizeMap[size]}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse-gentle">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Page-level loading state
 */
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
