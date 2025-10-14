import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, PoundSterling, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Analytics {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export const SellerAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        // Fetch listings count
        const { count: totalListingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", user.id);

        const { count: activeListingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", user.id)
          .eq("status", "active");

        // Fetch completed transactions
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("seller_id", user.id)
          .eq("status", "completed");

        const totalSales = transactions?.length || 0;
        const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Fetch reviews
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("seller_id", user.id);

        const totalReviews = reviews?.length || 0;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        setAnalytics({
          totalListings: totalListingsCount || 0,
          activeListings: activeListingsCount || 0,
          totalSales,
          totalRevenue,
          averageRating,
          totalReviews,
        });
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      title: "Total Listings",
      value: analytics.totalListings,
      description: `${analytics.activeListings} currently active`,
      icon: Package,
    },
    {
      title: "Total Sales",
      value: analytics.totalSales,
      description: "Completed transactions",
      icon: TrendingUp,
    },
    {
      title: "Total Revenue",
      value: `£${analytics.totalRevenue.toFixed(2)}`,
      description: "From completed sales",
      icon: PoundSterling,
    },
    {
      title: "Average Rating",
      value: analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : "N/A",
      description: `${analytics.totalReviews} review${analytics.totalReviews !== 1 ? 's' : ''}`,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Seller Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Track your performance and sales metrics
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
