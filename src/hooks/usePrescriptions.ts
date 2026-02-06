/**
 * Prescription Hooks
 * Upload, list, and extraction
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { uploadWithRetry } from "@/lib/upload-retry";
import type { Prescription, PrescriptionListResponse, Extraction, CartAssist } from "@/types/api";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

export const PRESCRIPTIONS_QUERY_KEY = ["prescriptions"];

export function usePrescriptions(profileId: string | undefined) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_QUERY_KEY, profileId],
    queryFn: async () => {
      const response = await api.get<PrescriptionListResponse>("/prescriptions", {
        profile_id: profileId,
        limit: 50,
      } as Record<string, unknown>);
      // Normalize to expected format
      return {
        items: response.prescriptions || [],
        total: response.total || 0,
        limit: 50,
        offset: 0,
        has_more: (response.prescriptions?.length || 0) >= 50,
      };
    },
    enabled: !!profileId,
  });
}

export function usePrescription(prescriptionId: string | undefined) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_QUERY_KEY, "detail", prescriptionId],
    queryFn: () => api.get<Prescription>(`/prescriptions/${prescriptionId}`),
    enabled: !!prescriptionId,
  });
}

export function useExtractedTests(prescriptionId: string | undefined) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_QUERY_KEY, "extracted", prescriptionId],
    queryFn: () => api.get<CartAssist>(`/prescriptions/${prescriptionId}/extracted-tests`),
    enabled: !!prescriptionId,
  });
}

interface UploadPrescriptionParams {
  file: File;
  profileId: string;
  title?: string;
  notes?: string;
  onProgress?: (progress: number) => void;
}

export function useUploadPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, profileId, title, notes, onProgress }: UploadPrescriptionParams) => {
      const result = await uploadWithRetry<Prescription>({
        url: "/prescriptions",
        file,
        fieldName: "file",
        additionalData: {
          profile_id: profileId,
          source: "UPLOAD",
          ...(title && { title }),
          ...(notes && { note: notes }),
        },
        onProgress,
        onRetry: (attempt) => {
          toast.info(`Retrying upload (${attempt}/3)...`);
        },
      });
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRESCRIPTIONS_QUERY_KEY });
      analytics.prescriptionUploaded(data.profile_id, "file");
      toast.success("Prescription uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: string) =>
      api.delete(`/prescriptions/${prescriptionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESCRIPTIONS_QUERY_KEY });
      toast.success("Prescription deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
