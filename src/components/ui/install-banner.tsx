/**
 * PWA Install Banner Component
 * Shows install prompt for eligible devices
 */

import React from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface InstallBannerProps {
  onDismiss?: () => void;
}

export function InstallBanner({ onDismiss }: InstallBannerProps) {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      handleDismiss();
    }
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 shadow-lg border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install Medool App</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add to home screen for quick access
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleDismiss} className="flex-1">
            Not Now
          </Button>
          <Button size="sm" onClick={handleInstall} className="flex-1 bg-gradient-primary">
            Install
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
