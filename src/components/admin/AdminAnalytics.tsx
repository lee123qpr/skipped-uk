import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    userGrowth: [] as any[],
    listingsByCategory: [] as any[],
    transactionTrends: [] as any[],
    revenueByMonth: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch user growth data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      // Fetch listings by category
      const { data: listings } = await supabase
        .from("listings")
        .select("category_id, categories(name)")
        .eq("status", "active");

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("created_at, amount, status")
        .order("created_at", { ascending: true });

      // Process user growth data
      const usersByMonth: { [key: string]: number } = {};
      profiles?.forEach((profile) => {
        const month = new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        usersByMonth[month] = (usersByMonth[month] || 0) + 1;
      });

      const userGrowth = Object.entries(usersByMonth).map(([month, count]) => ({
        month,
        users: count,
      }));

      // Process listings by category
      const categoryCount: { [key: string]: number } = {};
      listings?.forEach((listing: any) => {
        const category = listing.categories?.name || "Uncategorized";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const listingsByCategory = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
      }));

      // Process transaction trends
      const transactionsByMonth: { [key: string]: { count: number; revenue: number } } = {};
      transactions?.forEach((tx) => {
        const month = new Date(tx.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        if (!transactionsByMonth[month]) {
          transactionsByMonth[month] = { count: 0, revenue: 0 };
        }
        transactionsByMonth[month].count += 1;
        if (tx.status === "completed") {
          transactionsByMonth[month].revenue += Number(tx.amount);
        }
      });

      const transactionTrends = Object.entries(transactionsByMonth).map(([month, data]) => ({
        month,
        transactions: data.count,
      }));

      const revenueByMonth = Object.entries(transactionsByMonth).map(([month, data]) => ({
        month,
        revenue: data.revenue,
      }));

      setAnalytics({
        userGrowth,
        listingsByCategory,
        transactionTrends,
        revenueByMonth,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Listings by Category */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Listings by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.listingsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.listingsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="transactions" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Month */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}