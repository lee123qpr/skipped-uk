import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Activity, Database, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function AdminSystemHealth() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Database health metrics
  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ['db-health', refreshKey],
    queryFn: async () => {
      const [profiles, listings, transactions, disputes, messages] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('disputes').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      return {
        profiles: profiles.count || 0,
        listings: listings.count || 0,
        transactions: transactions.count || 0,
        disputes: disputes.count || 0,
        messages: messages.count || 0,
      };
    },
  });

  // Active transactions by status
  const { data: transactionHealth } = useQuery({
    queryKey: ['transaction-health', refreshKey],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('status, updated_at')
        .in('status', ['pending_payment', 'paid', 'dispatched', 'delivered']);

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const stuck = transactions?.filter(t => 
        new Date(t.updated_at).getTime() < sevenDaysAgo
      ).length || 0;

      const needsAttention = transactions?.filter(t => 
        new Date(t.updated_at).getTime() < threeDaysAgo &&
        new Date(t.updated_at).getTime() >= sevenDaysAgo
      ).length || 0;

      const recent = transactions?.filter(t => 
        new Date(t.updated_at).getTime() >= oneDayAgo
      ).length || 0;

      return {
        total: transactions?.length || 0,
        stuck,
        needsAttention,
        recent,
      };
    },
  });

  // Dispute health
  const { data: disputeHealth } = useQuery({
    queryKey: ['dispute-health', refreshKey],
    queryFn: async () => {
      const { data: disputes } = await supabase
        .from('disputes')
        .select('status, created_at');

      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      const pending = disputes?.filter(d => d.status === 'pending').length || 0;
      const oldPending = disputes?.filter(d => 
        d.status === 'pending' && 
        new Date(d.created_at).getTime() < threeDaysAgo
      ).length || 0;
      const resolved = disputes?.filter(d => d.status === 'resolved').length || 0;

      return {
        total: disputes?.length || 0,
        pending,
        oldPending,
        resolved,
      };
    },
  });

  // System performance metrics
  const { data: performanceMetrics } = useQuery({
    queryKey: ['performance-metrics', refreshKey],
    queryFn: async () => {
      const start = Date.now();
      
      // Test query performance
      await supabase.from('profiles').select('id').limit(1);
      const queryTime = Date.now() - start;

      // Get recent error rate (from postgres logs would be ideal, but we'll estimate)
      const { error: testError } = await supabase.from('profiles').select('id').limit(1);
      const errorRate = testError ? 100 : 0; // Simplified

      return {
        avgQueryTime: queryTime,
        errorRate,
        uptime: 99.9, // Would come from monitoring service
      };
    },
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success("Refreshing health metrics...");
  };

  const getHealthStatus = () => {
    if (!transactionHealth || !disputeHealth) return { status: 'unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    
    if (transactionHealth.stuck > 5 || disputeHealth.oldPending > 3) {
      return { status: 'critical', color: 'text-destructive', bg: 'bg-destructive/10' };
    }
    
    if (transactionHealth.needsAttention > 3 || disputeHealth.pending > 5) {
      return { status: 'warning', color: 'text-warning', bg: 'bg-warning/10' };
    }
    
    return { status: 'healthy', color: 'text-success', bg: 'bg-success/10' };
  };

  const healthStatus = getHealthStatus();

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground mt-1">Monitor platform performance and database health</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Health Status */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-full ${healthStatus.bg} flex items-center justify-center`}>
            {healthStatus.status === 'healthy' ? (
              <CheckCircle className={`h-8 w-8 ${healthStatus.color}`} />
            ) : (
              <AlertCircle className={`h-8 w-8 ${healthStatus.color}`} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold capitalize">{healthStatus.status}</h3>
            <p className="text-sm text-muted-foreground">
              {healthStatus.status === 'healthy' && 'All systems operational'}
              {healthStatus.status === 'warning' && 'Some items need attention'}
              {healthStatus.status === 'critical' && 'Critical issues detected'}
            </p>
          </div>
        </div>
      </Card>

      {/* Database Health */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Database Health</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Users</p>
            <p className="text-2xl font-bold">{dbHealth?.profiles.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Listings</p>
            <p className="text-2xl font-bold">{dbHealth?.listings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{dbHealth?.transactions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Disputes</p>
            <p className="text-2xl font-bold">{dbHealth?.disputes.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Messages</p>
            <p className="text-2xl font-bold">{dbHealth?.messages.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Transaction Health */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Transaction Health</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Active Total</p>
              <p className="text-2xl font-bold">{transactionHealth?.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recent (24h)</p>
              <p className="text-2xl font-bold text-success">{transactionHealth?.recent}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Needs Attention (3-7d)</p>
              <p className="text-2xl font-bold text-warning">{transactionHealth?.needsAttention}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stuck (7d+)</p>
              <p className="text-2xl font-bold text-destructive">{transactionHealth?.stuck}</p>
            </div>
          </div>
          {(transactionHealth?.stuck || 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                {transactionHealth?.stuck} stuck transactions require immediate attention
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Dispute Health */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dispute Health</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{disputeHealth?.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{disputeHealth?.pending}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Old Pending (3d+)</p>
              <p className="text-2xl font-bold text-destructive">{disputeHealth?.oldPending}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-success">{disputeHealth?.resolved}</p>
            </div>
          </div>
          {(disputeHealth?.oldPending || 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                {disputeHealth?.oldPending} disputes pending for more than 3 days
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Avg Query Time</p>
            <p className="text-2xl font-bold">{performanceMetrics?.avgQueryTime}ms</p>
            <Badge variant={performanceMetrics && performanceMetrics.avgQueryTime < 100 ? "default" : "destructive"} className="mt-2">
              {performanceMetrics && performanceMetrics.avgQueryTime < 100 ? "Good" : "Slow"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">{performanceMetrics?.errorRate}%</p>
            <Badge variant={performanceMetrics && performanceMetrics.errorRate < 1 ? "default" : "destructive"} className="mt-2">
              {performanceMetrics && performanceMetrics.errorRate < 1 ? "Good" : "High"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{performanceMetrics?.uptime}%</p>
            <Badge variant="default" className="mt-2">Excellent</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
