import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

// Pages
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import ProfileListPage from "@/pages/ProfileListPage";
import ProfileFormPage from "@/pages/ProfileFormPage";
import AddressListPage from "@/pages/AddressListPage";
import AddressFormPage from "@/pages/AddressFormPage";
import TestSearchPage from "@/pages/TestSearchPage";
import TestDetailPage from "@/pages/TestDetailPage";
import CartPage from "@/pages/CartPage";
import PrescriptionUploadPage from "@/pages/PrescriptionUploadPage";
import PrescriptionListPage from "@/pages/PrescriptionListPage";
import PrescriptionDetailPage from "@/pages/PrescriptionDetailPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersListPage from "@/pages/OrdersListPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Track app open
function AppAnalytics() {
  useEffect(() => {
    analytics.appOpen();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AppAnalytics />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />

              {/* Profile routes */}
              <Route
                path="/profiles"
                element={
                  <ProtectedRoute>
                    <ProfileListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/new"
                element={
                  <ProtectedRoute>
                    <ProfileFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:profileId/edit"
                element={
                  <ProtectedRoute>
                    <ProfileFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Address routes */}
              <Route
                path="/addresses"
                element={
                  <ProtectedRoute>
                    <AddressListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/address/new"
                element={
                  <ProtectedRoute>
                    <AddressFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/address/:addressId/edit"
                element={
                  <ProtectedRoute>
                    <AddressFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Test catalog routes */}
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <TestSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:testId"
                element={
                  <ProtectedRoute>
                    <TestDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Cart */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />

              {/* Prescription routes */}
              <Route
                path="/prescription/upload"
                element={
                  <ProtectedRoute>
                    <PrescriptionUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prescriptions"
                element={
                  <ProtectedRoute>
                    <PrescriptionListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prescriptions/:prescriptionId"
                element={
                  <ProtectedRoute>
                    <PrescriptionDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Checkout */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />

              {/* Order routes */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
