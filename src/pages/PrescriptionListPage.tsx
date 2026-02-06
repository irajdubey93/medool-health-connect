/**
 * Prescription List Page
 * View all prescriptions for a profile
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  FileImage,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import type { PrescriptionStatus } from "@/types/api";

const statusConfig: Record<
  PrescriptionStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  UPLOADED: {
    label: "Processing",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  EXTRACTING: {
    label: "Extracting",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-info/15 text-info border-info/30",
  },
  EXTRACTED: {
    label: "Ready",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: "bg-success/15 text-success border-success/30",
  },
  EXTRACTION_FAILED: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export default function PrescriptionListPage() {
  const navigate = useNavigate();
  const { profiles, activeProfile } = useAuth();

  const [selectedProfileId, setSelectedProfileId] = useState(activeProfile?.id || "");

  const { data, isLoading } = usePrescriptions(selectedProfileId);
  const prescriptions = data?.items || [];

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  if (isLoading) {
    return (
      <MobileLayout title="Prescriptions" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Prescriptions" showBack>
      <div className="p-4 space-y-4">
        {/* Profile filter */}
        <div className="flex gap-3">
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select patient">
                {selectedProfile && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedProfile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedProfile.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{profile.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to="/prescription/upload">
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Prescription list */}
        {prescriptions.length > 0 ? (
          <div className="space-y-3">
            {prescriptions.map((prescription) => {
              const status = statusConfig[prescription.status];
              return (
                <Card
                  key={prescription.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {prescription.file_type === "IMAGE" ? (
                          <img
                            src={prescription.file_url}
                            alt="Prescription"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {prescription.title || "Untitled Prescription"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(prescription.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-2 gap-1 ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileImage className="h-8 w-8" />}
            title="No prescriptions"
            description="Upload a prescription to get AI-powered test recommendations"
            action={{
              label: "Upload Prescription",
              onClick: () => navigate("/prescription/upload"),
            }}
          />
        )}
      </div>
    </MobileLayout>
  );
}
