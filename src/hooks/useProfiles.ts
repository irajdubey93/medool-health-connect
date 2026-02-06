/**
 * Profile Management Hooks
 * CRUD operations for user profiles
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Profile, ProfileCreate, ProfileUpdate } from "@/types/api";
import { toast } from "sonner";

export const PROFILES_QUERY_KEY = ["profiles"];

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: () => api.get<Profile[]>("/profiles"),
  });
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILES_QUERY_KEY, profileId],
    queryFn: () => api.get<Profile>(`/profiles/${profileId}`),
    enabled: !!profileId,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileCreate) => api.post<Profile>("/profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      toast.success("Profile created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProfileUpdate }) =>
      api.patch<Profile>(`/profiles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetDefaultProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<Profile>(`/profiles/${profileId}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      toast.success("Default profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => api.delete(`/profiles/${profileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      toast.success("Profile deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
