/**
 * Address List Page
 * Shows saved addresses with management options
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAddresses, useSetDefaultAddress, useDeleteAddress } from "@/hooks/useAddresses";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
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
import {
  Plus,
  MoreVertical,
  Star,
  Pencil,
  Trash2,
  MapPin,
  Home,
  Building2,
  Briefcase,
} from "lucide-react";

const labelIcons: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Office: <Briefcase className="h-4 w-4" />,
  Work: <Building2 className="h-4 w-4" />,
};

export default function AddressListPage() {
  const navigate = useNavigate();
  const { data: addresses, isLoading } = useAddresses();
  const setDefaultMutation = useSetDefaultAddress();
  const deleteMutation = useDeleteAddress();

  const [deleteAddressId, setDeleteAddressId] = React.useState<string | null>(null);

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleDelete = () => {
    if (deleteAddressId) {
      deleteMutation.mutate(deleteAddressId, {
        onSuccess: () => {
          setDeleteAddressId(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Saved Addresses" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Saved Addresses" showBack>
      <div className="p-4 space-y-4">
        {/* Add address button */}
        <Link to="/address/new">
          <Button className="w-full bg-gradient-primary" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add New Address
          </Button>
        </Link>

        {/* Address list */}
        {addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={`transition-all ${
                  address.is_default ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {labelIcons[address.label] || <MapPin className="h-5 w-5 text-primary" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{address.label}</span>
                        {address.is_default && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                            <Star className="h-3 w-3 mr-1 fill-primary" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {address.address_line}
                        {address.landmark && `, ${address.landmark}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/address/${address.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!address.is_default && (
                          <DropdownMenuItem onClick={() => handleSetDefault(address.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteAddressId(address.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MapPin className="h-8 w-8" />}
            title="No addresses saved"
            description="Add an address for sample collection"
            action={{
              label: "Add Address",
              onClick: () => navigate("/address/new"),
            }}
          />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this address. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
