import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, DollarSign, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { AdminDisputes } from "@/components/admin/AdminDisputes";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { toast } from "sonner";

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingDisputes: 0,
    totalRevenue: 0,
    liveUsers: 0,
    growthRate: 0,
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

      // Fetch total revenue
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        activeListings: listingCount || 0,
        pendingDisputes: disputeCount || 0,
        totalRevenue,
        liveUsers: 0, // Would need real-time tracking
        growthRate: 12.5, // Mock data - would calculate from historical data
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage disputes, users, and view platform analytics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-2xl font-bold">{stats.activeListings}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Disputes</p>
              <p className="text-2xl font-bold">{stats.pendingDisputes}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live Users</p>
              <p className="text-2xl font-bold">{stats.liveUsers}</p>
            </div>
            <Activity className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <p className="text-2xl font-bold">{stats.growthRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="disputes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes">
          <AdminDisputes onDisputeResolved={fetchDashboardStats} />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}