import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileEdit from "@/components/ProfileEdit";
import { ProfileSkeleton } from "@/components/LoadingSkeletons";

const UnifiedReviews = React.lazy(() => import("@/components/UnifiedReviews"));

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/sign-in");
    } else {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <>
        <SEOHead
          title="Account Settings - Skipped"
          description="Manage your account settings and preferences"
          keywords="settings, account, profile"
        />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
            <div className="max-w-5xl mx-auto space-y-8">
              <ProfileSkeleton />
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Account Settings - Skipped"
        description="Manage your account settings and preferences"
        keywords="settings, account, profile"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile, preferences, and account information
              </p>
            </div>
            
            <ProfileEdit />
            
            <Suspense fallback={<Card><CardContent className="py-8 text-center text-muted-foreground">Loading reviews…</CardContent></Card>}>
              <UnifiedReviews userId={user?.id || ''} />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Settings;
