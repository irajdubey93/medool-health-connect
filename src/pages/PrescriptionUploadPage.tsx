/**
 * Prescription Upload Page
 * Upload and manage prescriptions
 */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUploadPrescription } from "@/hooks/usePrescriptions";
import { processUploadFile, formatFileSize } from "@/lib/image-compression";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Camera,
  Upload,
  FileImage,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "compressing" | "uploading" | "success" | "error";

export default function PrescriptionUploadPage() {
  const navigate = useNavigate();
  const { profiles, activeProfile } = useAuth();
  const uploadMutation = useUploadPrescription();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedProfileId, setSelectedProfileId] = useState(activeProfile?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setUploadState("compressing");
    setProgress(0);

    try {
      const result = await processUploadFile(selectedFile, (p) => {
        setProgress(p * 0.5); // First 50% is compression
      });

      setFile(result.file);
      
      // Create preview for images
      if (result.file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(result.file);
      } else {
        setPreview(null);
      }

      setUploadState("idle");
      setProgress(0);

      // Show compression info if file was compressed
      if (result.compressionRatio > 1) {
        toast.info(
          `Image optimized: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
      setUploadState("error");
      setFile(null);
      setPreview(null);
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadState("idle");
  };

  const handleUpload = async () => {
    if (!file || !selectedProfileId) return;

    setUploadState("uploading");
    setProgress(50);
    setError(null);

    try {
      const prescription = await uploadMutation.mutateAsync({
        file,
        profileId: selectedProfileId,
        title: title || undefined,
        notes: notes || undefined,
        onProgress: (p) => {
          setProgress(50 + p * 0.5); // Last 50% is upload
        },
      });

      setUploadState("success");
      setProgress(100);

      // Navigate to prescription detail after short delay
      setTimeout(() => {
        navigate(`/prescriptions/${prescription.id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <MobileLayout title="Upload Prescription" showBack showNav={false}>
      <div className="p-4 space-y-4">
        {/* Profile selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">For Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient">
                  {selectedProfile && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(selectedProfile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedProfile.full_name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{profile.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({profile.relation})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* File upload area */}
        <Card>
          <CardContent className="p-4">
            {!file ? (
              <div className="space-y-4">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Select Prescription</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPEG, PNG, or PDF (max 10MB)
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Gallery
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Prescription preview"
                      className="w-full rounded-lg object-contain max-h-64"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <FileImage className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveFile}
                    disabled={uploadState === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File info */}
                <div className="flex items-center gap-2 text-sm">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                </div>

                {/* Progress */}
                {(uploadState === "compressing" || uploadState === "uploading") && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {uploadState === "compressing"
                        ? "Optimizing image..."
                        : "Uploading..."}
                    </p>
                  </div>
                )}

                {/* Success state */}
                {uploadState === "success" && (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>Upload complete!</span>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optional fields */}
        {file && uploadState !== "success" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Additional Info (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blood test prescription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploadState === "uploading"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploadState === "uploading"}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload button */}
        {file && uploadState !== "success" && (
          <Button
            className="w-full bg-gradient-primary"
            size="lg"
            onClick={handleUpload}
            disabled={!selectedProfileId || uploadState === "uploading" || uploadState === "compressing"}
          >
            {uploadState === "uploading" ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Prescription
              </>
            )}
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
