/**
 * Address Create/Edit Page
 * Form for creating or editing an address
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAddress, useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";
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
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import type { AddressCreate, AddressUpdate } from "@/types/api";

interface FormData {
  label: string;
  address_line: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

const LABEL_OPTIONS = ["Home", "Office", "Work", "Other"];

export default function AddressFormPage() {
  const navigate = useNavigate();
  const { addressId } = useParams();
  const isEditing = !!addressId;

  const { data: address, isLoading } = useAddress(addressId);
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      label: "Home",
      address_line: "",
      landmark: "",
      city: "Dehradun",
      state: "Uttarakhand",
      pincode: "",
      latitude: 30.3165,
      longitude: 78.0322,
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (address) {
      setValue("label", address.label);
      setValue("address_line", address.address_line);
      setValue("landmark", address.landmark || "");
      setValue("city", address.city);
      setValue("state", address.state);
      setValue("pincode", address.pincode);
      setValue("latitude", address.latitude);
      setValue("longitude", address.longitude);
    }
  }, [address, setValue]);

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude);
        setValue("longitude", position.coords.longitude);
        toast.success("Location captured");
      },
      (error) => {
        console.error("Error getting location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable it in browser settings.");
        } else {
          toast.error("Couldn't get your location. Please type coordinates or try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const onSubmit = async (data: FormData) => {
    if (isEditing && addressId) {
      const updateData: AddressUpdate = {
        label: data.label,
        address_line: data.address_line,
        landmark: data.landmark || undefined,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      await updateMutation.mutateAsync({ id: addressId, data: updateData });
    } else {
      const createData: AddressCreate = {
        label: data.label,
        address_line: data.address_line,
        landmark: data.landmark || undefined,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      await createMutation.mutateAsync(createData);
    }
    navigate("/addresses");
  };

  if (isLoading && isEditing) {
    return (
      <MobileLayout title="Edit Address" showBack>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={isEditing ? "Edit Address" : "Add Address"} showBack>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Label */}
            <div className="space-y-2">
              <Label>Label *</Label>
              <Select
                value={watch("label")}
                onValueChange={(value) => setValue("label", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_OPTIONS.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address Line */}
            <div className="space-y-2">
              <Label htmlFor="address_line">Address *</Label>
              <Input
                id="address_line"
                placeholder="House/Flat No., Building, Street"
                {...register("address_line", { required: "Address is required" })}
              />
              {errors.address_line && (
                <p className="text-sm text-destructive">{errors.address_line.message}</p>
              )}
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Near hospital, temple, etc."
                {...register("landmark")}
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  {...register("city", { required: "City is required" })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="State"
                  {...register("state", { required: "State is required" })}
                />
              </div>
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                placeholder="6-digit pincode"
                maxLength={6}
                {...register("pincode", {
                  required: "Pincode is required",
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: "Enter a valid 6-digit pincode",
                  },
                })}
              />
              {errors.pincode && (
                <p className="text-sm text-destructive">{errors.pincode.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  {...register("latitude", { valueAsNumber: true })}
                  className="flex-1"
                />
                <Input
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  {...register("longitude", { valueAsNumber: true })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGetLocation}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the pin icon to use your current location
              </p>
            </div>
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
            ? "Update Address"
            : "Save Address"}
        </Button>
      </form>
    </MobileLayout>
  );
}
