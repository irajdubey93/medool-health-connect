/**
 * Home Page
 * - Quick actions for booking
 * - Active profile display
 * - Recent orders summary
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FileImage,
  Search,
  ClipboardList,
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react";
import medoolLoader from "@/assets/medool-loader.gif";

export default function HomePage() {
  const { activeProfile, profiles } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MobileLayout>
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
                    {getInitials(activeProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{activeProfile.name}</p>
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
        {!activeProfile && profiles.length === 0 && (
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

        {/* Empty state */}
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
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-6" />
    </MobileLayout>
  );
}
