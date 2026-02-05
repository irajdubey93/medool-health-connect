/**
 * Mobile App Layout
 * - Bottom navigation tabs
 * - Header with back button
 * - Safe area handling
 */

import React, { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  ClipboardList,
  User,
  ChevronLeft,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showHeader?: boolean;
  showNav?: boolean;
  rightAction?: ReactNode;
}

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/orders", icon: ClipboardList, label: "Orders" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function MobileLayout({
  children,
  title,
  showBack = false,
  showHeader = true,
  showNav = true,
  rightAction,
}: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
          <div className="flex h-14 items-center px-4">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted touch-target"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            
            {title && (
              <h1 className="flex-1 text-lg font-semibold truncate">
                {title}
              </h1>
            )}

            {!title && <div className="flex-1" />}

            {/* Cart button */}
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted touch-target"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs bg-primary text-primary-foreground"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </Badge>
              )}
            </Link>

            {rightAction && <div className="ml-2">{rightAction}</div>}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1",
        showNav && "pb-16" // Space for bottom nav
      )}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-bottom">
          <div className="flex h-16 items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 touch-target",
                    "transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-2xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * Simple page wrapper without nav
 */
export function PageWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  );
}
