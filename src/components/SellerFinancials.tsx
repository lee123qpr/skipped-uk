import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  Clock, 
  Shield, 
  TrendingUp, 
  Star, 
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  PoundSterling,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatDistanceToNow } from "date-fns";
import StripeConnectOnboarding from "./StripeConnectOnboarding";

interface PerformanceData {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

interface FinancialData {
  hasStripeAccount: boolean;
  balance: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
  escrow: {
    total: number;
    breakdown: {
      paid: number;
      dispatched: number;
      delivered: number;
    };
    transactions: number;
  };
  earnings: {
    monthly: number;
    lifetime: number;
    transactionCount: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    created: string;
    status: string;
    description: string | null;
    fee: number;
    net: number;
  }>;
  lastUpdated: string;
}

export const SellerFinancials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinancials = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch performance data and financial data in parallel
      const [
        { count: totalListingsCount },
        { count: activeListingsCount },
        { data: completedTransactions },
        { data: reviews },
        financialResult
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", user.id),
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", user.id)
          .eq("status", "active"),
        supabase
          .from("transactions")
          .select("amount")
          .eq("seller_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("reviews")
          .select("rating")
          .eq("seller_id", user.id),
        supabase.functions.invoke("get-seller-financials", {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        })
      ]);

      // Set performance data
      const totalSales = completedTransactions?.length || 0;
      const totalRevenue = completedTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      setPerformanceData({
        totalListings: totalListingsCount || 0,
        activeListings: activeListingsCount || 0,
        totalSales,
        totalRevenue,
        averageRating,
        totalReviews,
      });

      // Handle financial data
      if (financialResult.error) {
        throw new Error(financialResult.error);
      }

      if (!financialResult.data?.hasStripeAccount) {
        setData(null);
      } else {
        setData(financialResult.data);
      }
    } catch (error) {
      console.error("Error fetching financials:", error);
      toast({
        title: "Error loading financial data",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancials();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchFinancials(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const formatCurrency = (amount: number, currency = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getTransactionTypeIcon = (type: string) => {
    if (type.includes("charge") || type.includes("payment")) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (type.includes("refund")) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Coins className="h-4 w-4 text-muted-foreground" />;
  };

  const getTransactionTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      charge: "Sale",
      payment: "Sale",
      payment_refund: "Refund",
      refund: "Refund",
      transfer: "Transfer",
      payout: "Payout",
      stripe_fee: "Stripe Fee",
      application_fee: "Platform Fee",
    };
    return typeMap[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        {/* Performance Metrics Skeleton */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`perf-${i}`} className="h-32 w-full" />
            ))}
          </div>
        </div>
        {/* Financial Overview Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`fin-${i}`} className="h-32 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Dashboard</CardTitle>
          <CardDescription>
            Complete your Stripe setup above to view your financial information
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const availableBalance = data.balance.available[0]?.amount || 0;
  const pendingBalance = data.balance.pending[0]?.amount || 0;

  const performanceStats = [
    {
      title: "Total Listings",
      value: performanceData?.totalListings || 0,
      description: `${performanceData?.activeListings || 0} currently active`,
      icon: Package,
    },
    {
      title: "Total Sales",
      value: performanceData?.totalSales || 0,
      description: "Completed transactions",
      icon: TrendingUp,
    },
    {
      title: "Total Revenue",
      value: `£${(performanceData?.totalRevenue || 0).toFixed(2)}`,
      description: "From completed sales",
      icon: PoundSterling,
    },
    {
      title: "Average Rating",
      value: performanceData && performanceData.averageRating > 0 ? performanceData.averageRating.toFixed(1) : "N/A",
      description: `${performanceData?.totalReviews || 0} review${(performanceData?.totalReviews || 0) !== 1 ? 's' : ''}`,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <StripeConnectOnboarding />

      {/* Performance Metrics */}
      {performanceData && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Track your listings, sales, and customer satisfaction
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceStats.map((stat, index) => {
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
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-sm text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFinancials(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to withdraw
            </p>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {formatCurrency(pendingBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing (2-7 days)
            </p>
          </CardContent>
        </Card>

        {/* In Escrow */}
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              In Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(data.escrow.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.escrow.transactions} transaction{data.escrow.transactions !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {data.escrow.breakdown.paid > 0 && (
                <Badge variant="outline" className="text-xs">
                  Paid: {formatCurrency(data.escrow.breakdown.paid)}
                </Badge>
              )}
              {data.escrow.breakdown.dispatched > 0 && (
                <Badge variant="outline" className="text-xs">
                  Dispatched: {formatCurrency(data.escrow.breakdown.dispatched)}
                </Badge>
              )}
              {data.escrow.breakdown.delivered > 0 && (
                <Badge variant="outline" className="text-xs">
                  Delivered: {formatCurrency(data.escrow.breakdown.delivered)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* This Month's Earnings */}
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(data.earnings.monthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Lifetime Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(data.earnings.lifetime)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            From {data.earnings.transactionCount} completed transaction{data.earnings.transactionCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and payouts</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recent activity
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivity.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">
                        {new Date(txn.created).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(txn.type)}
                          <span className="text-sm">{getTransactionTypeName(txn.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {txn.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.amount, txn.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {txn.fee > 0 ? `-${formatCurrency(txn.fee, txn.currency)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.net, txn.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={txn.status === "available" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
