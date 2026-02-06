/**
 * Profile Create/Edit Page
 * Form for creating or editing a profile
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { useProfile, useCreateProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Lock, AlertCircle } from "lucide-react";
import { analytics } from "@/lib/analytics";
import type { ProfileCreate, ProfileUpdate, Gender, Relation, UserType } from "@/types/api";

interface FormData {
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  relation: Relation;
  user_type: UserType;
}

export default function ProfileFormPage() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const isEditing = !!profileId;
  
  const { profiles, refreshProfiles } = useAuth();
  const { data: profile, isLoading } = useProfile(profileId);
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();

  const hasSelfProfile = profiles.some((p) => p.relation === "SELF");
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      full_name: "",
      gender: "MALE",
      date_of_birth: "",
      relation: hasSelfProfile ? "SPOUSE" : "SELF",
      user_type: "REGULAR",
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (profile) {
      setValue("full_name", profile.full_name);
      setValue("gender", profile.gender || "MALE");
      setValue(
        "date_of_birth",
        profile.date_of_birth ? profile.date_of_birth.split("T")[0] : ""
      );
      setValue("relation", profile.relation);
      setValue("user_type", profile.user_type);
    }
  }, [profile, setValue]);

  const selectedRelation = watch("relation");

  const onSubmit = async (data: FormData) => {
    if (isEditing && profileId) {
      // When editing, we can't change user_type after first booking
      const updateData: ProfileUpdate = {
        full_name: data.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth || undefined,
        relation: data.relation,
      };
      await updateMutation.mutateAsync({ id: profileId, data: updateData });
    } else {
      const createData: ProfileCreate = {
        full_name: data.full_name,
        gender: data.gender || undefined,
        date_of_birth: data.date_of_birth || undefined,
        relation: data.relation || undefined,
        user_type: data.user_type,
      };
      await createMutation.mutateAsync(createData);
      analytics.profileCreated(data.relation, data.user_type);
    }
    await refreshProfiles();
    navigate("/profiles");
  };

  if (isLoading && isEditing) {
    return (
      <MobileLayout title="Edit Profile" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  const isUserTypeLocked = isEditing && profile?.user_type_locked;

  return (
    <MobileLayout title={isEditing ? "Edit Profile" : "Add Profile"} showBack>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                {...register("full_name", { required: "Full name is required" })}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={watch("gender")}
                onValueChange={(value: Gender) => setValue("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <Input
                    id="dob"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>

            {/* Relation */}
            <div className="space-y-2">
              <Label>Relation</Label>
              <Select
                value={watch("relation")}
                onValueChange={(value: Relation) => setValue("relation", value)}
                disabled={isEditing && profile?.relation === "SELF"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {!hasSelfProfile && <SelectItem value="SELF">Self</SelectItem>}
                  {(hasSelfProfile || isEditing) && profile?.relation === "SELF" && (
                    <SelectItem value="SELF">Self</SelectItem>
                  )}
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUserTypeLocked ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Patient type cannot be changed after booking
                </span>
                <Badge variant="outline" className="ml-auto">
                  {profile?.user_type}
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={watch("user_type")}
                  onValueChange={(value: UserType) => setValue("user_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="CGHS">CGHS</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  CGHS patients get empaneled lab rates. This cannot be changed after first booking.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-gradient-primary"
          size="lg"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "Saving..."
            : isEditing
            ? "Update Profile"
            : "Create Profile"}
        </Button>
      </form>
    </MobileLayout>
  );
}
