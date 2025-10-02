import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminDisputes } from "@/components/admin/AdminDisputes";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminListings } from "@/components/admin/AdminListings";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminFinancials } from "@/components/admin/AdminFinancials";
import { AdminSystemHealth } from "@/components/admin/AdminSystemHealth";
import { AdminSettings } from "@/components/admin/AdminSettings";
import AdminBannerManager from "@/components/admin/AdminBannerManager";
import AdminPlatformSettings from "@/components/admin/AdminPlatformSettings";
import { AdminEnvironmental } from "@/components/admin/AdminEnvironmental";
import { AdminCertificates } from "@/components/admin/AdminCertificates";
import { toast } from "sonner";

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'overview';
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingDisputes: 0,
    totalRevenue: 0,
    liveUsers: 0,
    growthRate: 0,
    conversionRate: 0,
    avgTransactionValue: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access admin panel");
        navigate("/signin");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast.error("Unauthorized: Admin access required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchDashboardStats();
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch active listings
      const { count: listingCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch pending disputes
      const { count: disputeCount } = await supabase
        .from("disputes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch total revenue and calculate metrics
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, status, created_at")
        .eq("status", "completed");

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const avgTransactionValue = transactions && transactions.length > 0 
        ? totalRevenue / transactions.length 
        : 0;

      // Calculate growth rate (M-o-M)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const { count: lastMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneMonthAgo.toISOString());

      const { count: prevMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", twoMonthsAgo.toISOString())
        .lt("created_at", oneMonthAgo.toISOString());

      const growthRate = prevMonthUsers && prevMonthUsers > 0
        ? ((lastMonthUsers || 0) - (prevMonthUsers || 0)) / (prevMonthUsers || 1) * 100
        : 0;

      // Calculate conversion rate (offers → completed transactions)
      const { count: totalOffers } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted");

      const { count: completedTransactions } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      const conversionRate = totalOffers && totalOffers > 0
        ? ((completedTransactions || 0) / (totalOffers || 1)) * 100
        : 0;

      setStats({
        totalUsers: userCount || 0,
        activeListings: listingCount || 0,
        pendingDisputes: disputeCount || 0,
        totalRevenue,
        liveUsers: 0, // Real-time tracking would use Supabase Realtime
        growthRate: Math.round(growthRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return <AdminOverview stats={stats} />;
      case 'disputes':
        return <AdminDisputes onDisputeResolved={fetchDashboardStats} />;
      case 'users':
        return <AdminUsers />;
      case 'listings':
        return <AdminListings />;
      case 'transactions':
        return <AdminTransactions />;
      case 'financials':
        return <AdminFinancials />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'environmental':
        return <AdminEnvironmental />;
      case 'certificates':
        return <AdminCertificates />;
      case 'health':
        return <AdminSystemHealth />;
      case 'settings':
        return <AdminSettings />;
      case 'banners':
        return <AdminBannerManager />;
      case 'platform-settings':
        return <AdminPlatformSettings />;
      default:
        return <AdminOverview stats={stats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Sidebar */}
      <AdminSidebar pendingDisputesCount={stats.pendingDisputes} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 md:px-6 py-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}