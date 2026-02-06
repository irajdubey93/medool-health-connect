/**
 * Home Page
 * - Quick actions for booking
 * - Active profile display
 * - Recent orders summary
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { InstallBanner } from "@/components/ui/install-banner";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import {
  FileImage,
  Search,
  ClipboardList,
  ChevronRight,
  User,
  Sparkles,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import medoolLoader from "@/assets/medool-loader.gif";
import type { OrderStatus } from "@/types/api";

export default function HomePage() {
  const navigate = useNavigate();
  const { activeProfile, profiles } = useAuth();
  
  // Fetch recent orders
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 3 });

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

  return (
    <MobileLayout>
      <OfflineIndicator />
      <InstallBanner />
      {/* Hero section with gradient */}
      <div className="bg-gradient-primary px-6 pt-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={medoolLoader} alt="Medool" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">Medool</span>
          </div>
        </div>

        {/* Active profile */}
        {activeProfile && (
          <Link to="/profile" className="block">
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12 bg-primary/10">
                  <AvatarFallback className="text-primary font-semibold">
                    {getInitials(activeProfile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{activeProfile.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={
                        activeProfile.user_type === "CGHS"
                          ? "bg-success/10 text-success border-success/30 text-xs"
                          : "bg-muted text-muted-foreground text-xs"
                      }
                    >
                      {activeProfile.user_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activeProfile.relation}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* No profile prompt */}
        {!activeProfile && (!profiles || profiles.length === 0) && (
          <Link to="/profile/new" className="block">
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Create your profile</p>
                  <p className="text-sm text-muted-foreground">
                    Add yourself or a family member
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-6 -mt-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Book a test
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/prescription/upload">
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col gap-3 py-6 hover:bg-accent hover:border-primary/30"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileImage className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Upload Prescription</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI-powered extraction
                    </p>
                  </div>
                </Button>
              </Link>

              <Link to="/search">
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col gap-3 py-6 hover:bg-accent hover:border-primary/30"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Search Tests</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Browse catalog
                    </p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            to="/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-2/3 mb-2" />
                  <Skeleton className="h-5 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ordersData?.items && ordersData.items.length > 0 ? (
          <div className="space-y-3">
            {ordersData.items.slice(0, 3).map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">Order</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>Lab ID: {order.selected_lab_id?.slice(0, 8)}...</span>
                    <span className="ml-auto font-medium text-foreground">
                      ₹{(order.total_payable_paise / 100).toFixed(0)}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-10 px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No orders yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Book your first diagnostic test
              </p>
              <Link to="/search">
                <Button className="bg-gradient-primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Booking
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-6" />
    </MobileLayout>
  );
}
