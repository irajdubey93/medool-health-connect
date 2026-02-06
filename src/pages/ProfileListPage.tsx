/**
 * Profile List Page
 * Shows all family profiles with options to manage
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles, useSetDefaultProfile, useDeleteProfile } from "@/hooks/useProfiles";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Star, Pencil, Trash2, Users, Check } from "lucide-react";
import type { Profile } from "@/types/api";

export default function ProfileListPage() {
  const navigate = useNavigate();
  const { activeProfile, setActiveProfile } = useAuth();
  const { data: profiles, isLoading, refetch } = useProfiles();
  const setDefaultMutation = useSetDefaultProfile();
  const deleteMutation = useDeleteProfile();
  
  const [deleteProfileId, setDeleteProfileId] = React.useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSetDefault = (profileId: string) => {
    setDefaultMutation.mutate(profileId);
  };

  const handleDelete = () => {
    if (deleteProfileId) {
      deleteMutation.mutate(deleteProfileId, {
        onSuccess: () => {
          setDeleteProfileId(null);
        },
      });
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfile(profile);
  };

  if (isLoading) {
    return (
      <MobileLayout title="Family Profiles" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Family Profiles" showBack>
      <div className="p-4 space-y-4">
        {/* Add profile button */}
        <Link to="/profile/new">
          <Button className="w-full bg-gradient-primary" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Family Member
          </Button>
        </Link>

        {/* Profile list */}
        {profiles && profiles.length > 0 ? (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all ${
                  activeProfile?.id === profile.id
                    ? "ring-2 ring-primary"
                    : "hover:shadow-md"
                }`}
                onClick={() => handleSelectProfile(profile)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12 bg-primary/10">
                    <AvatarFallback className="text-primary font-semibold">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{profile.name}</p>
                      {profile.is_default && (
                        <Star className="h-4 w-4 text-warning fill-warning" />
                      )}
                      {activeProfile?.id === profile.id && (
                        <Check className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={
                          profile.user_type === "CGHS"
                            ? "bg-success/10 text-success border-success/30 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {profile.user_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {profile.relation}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${profile.id}/edit`);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!profile.is_default && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(profile.id);
                          }}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      {profile.relation !== "SELF" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteProfileId(profile.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No profiles yet"
            description="Add yourself or a family member to get started"
            action={{
              label: "Add Profile",
              onClick: () => navigate("/profile/new"),
            }}
          />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this profile and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
