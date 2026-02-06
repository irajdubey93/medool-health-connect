/**
 * Test Search Page
 * Browse and search diagnostic tests
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteTests } from "@/hooks/useTests";
import { useCart } from "@/contexts/CartContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Check,
  Droplet,
  FlaskConical,
  Clock,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Test, SampleType } from "@/types/api";
import { useDebounce } from "@/hooks/useDebounce";

const sampleTypeIcons: Record<SampleType, React.ReactNode> = {
  BLOOD: <Droplet className="h-4 w-4" />,
  URINE: <FlaskConical className="h-4 w-4" />,
  STOOL: <FlaskConical className="h-4 w-4" />,
  OTHER: <FlaskConical className="h-4 w-4" />,
};

const sampleTypeColors: Record<SampleType, string> = {
  BLOOD: "bg-red-100 text-red-700 border-red-200",
  URINE: "bg-amber-100 text-amber-700 border-amber-200",
  STOOL: "bg-orange-100 text-orange-700 border-orange-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function TestSearchPage() {
  const navigate = useNavigate();
  const { addItem, hasItem } = useCart();

  const [query, setQuery] = useState("");
  const [sampleTypeFilter, setSampleTypeFilter] = useState<SampleType | null>(null);
  const [fastingFilter, setFastingFilter] = useState<boolean | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTests({
    q: debouncedQuery || undefined,
    sample_type: sampleTypeFilter || undefined,
    fasting_required: fastingFilter ?? undefined,
    limit: 20,
  });

  const tests = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? [];
    // Filter out any undefined items for safety
    return allItems.filter((test): test is Test => test != null && typeof test.id === "string");
  }, [data]);

  const handleAddToCart = (test: Test, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(test);
  };

  const clearFilters = () => {
    setSampleTypeFilter(null);
    setFastingFilter(null);
  };

  const hasFilters = sampleTypeFilter !== null || fastingFilter !== null;

  return (
    <MobileLayout title="Search Tests">
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="p-4 border-b bg-background sticky top-14 z-30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests, packages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
            <Badge
              variant={sampleTypeFilter === "BLOOD" ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap",
                sampleTypeFilter === "BLOOD" && "bg-red-600"
              )}
              onClick={() =>
                setSampleTypeFilter(sampleTypeFilter === "BLOOD" ? null : "BLOOD")
              }
            >
              <Droplet className="h-3 w-3 mr-1" />
              Blood
            </Badge>
            <Badge
              variant={sampleTypeFilter === "URINE" ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap",
                sampleTypeFilter === "URINE" && "bg-amber-600"
              )}
              onClick={() =>
                setSampleTypeFilter(sampleTypeFilter === "URINE" ? null : "URINE")
              }
            >
              <FlaskConical className="h-3 w-3 mr-1" />
              Urine
            </Badge>
            <Badge
              variant={fastingFilter === true ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFastingFilter(fastingFilter === true ? null : true)}
            >
              <Clock className="h-3 w-3 mr-1" />
              Fasting
            </Badge>
            {hasFilters && (
              <Badge
                variant="outline"
                className="cursor-pointer text-destructive border-destructive"
                onClick={clearFilters}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 p-4 space-y-3">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : tests.length > 0 ? (
            <>
              {tests.map((test) => {
                const inCart = hasItem(test.id);
                return (
                  <Card
                    key={test.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/test/${test.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {test.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {test.code}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={cn("text-xs", sampleTypeColors[test.sample_type])}
                            >
                              {sampleTypeIcons[test.sample_type]}
                              <span className="ml-1">{test.sample_type}</span>
                            </Badge>
                            {test.fasting_required && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {test.fasting_hours || 8}h fasting
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={inCart ? "secondary" : "default"}
                          className={cn(!inCart && "bg-gradient-primary")}
                          onClick={(e) => handleAddToCart(test, e)}
                          disabled={inCart}
                        >
                          {inCart ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Load more */}
              {hasNextPage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              )}
            </>
          ) : query.length >= 2 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No tests found"
              description={`No results for "${query}". Try a different search term.`}
            />
          ) : (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Search for tests"
              description="Enter at least 2 characters to search"
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
