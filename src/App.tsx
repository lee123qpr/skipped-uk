import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configure React Query with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh for this time
      gcTime: 1000 * 60 * 30, // 30 minutes - cached data kept in memory
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Only retry failed requests once
    },
  },
});
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/components/AuthContext";
import { NotificationProvider } from "@/components/NotificationProvider";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import PaymentVerifier from "@/components/PaymentVerifier";
import { OfflineDetector } from "@/components/OfflineDetector";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import CreateListing from "./pages/CreateListing";
import Dashboard from "./pages/Dashboard";
import ListingDetails from "./pages/ListingDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import BuyerProtection from "./pages/BuyerProtection";
import DeliveryOptions from "./pages/DeliveryOptions";
import CarbonCalculator from "./pages/CarbonCalculator";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import NewsResources from "./pages/NewsResources";
import BlogPost from "./pages/BlogPost";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import DisputeResolution from "./pages/DisputeResolution";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import AuthHashRouter from "@/components/AuthHashRouter";

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <AuthHashRouter />
                <PaymentVerifier />
                <OfflineDetector />
                <CookieConsent />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/listing/:id" element={<ListingDetails />} />
                <Route path="/create-listing" element={<CreateListing />} />
                <Route path="/listing/:id/edit" element={<CreateListing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/buyer-protection" element={<BuyerProtection />} />
                <Route path="/delivery-options" element={<DeliveryOptions />} />
                <Route path="/carbon-calculator" element={<CarbonCalculator />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/news-resources" element={<NewsResources />} />
                <Route path="/news-resources/:slug" element={<BlogPost />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/dispute-resolution" element={<DisputeResolution />} />
                <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
