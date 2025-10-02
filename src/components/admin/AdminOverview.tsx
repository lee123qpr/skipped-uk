import { Card } from "@/components/ui/card";
import { Users, Package, DollarSign, AlertTriangle, Activity, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AdminOverviewProps {
  stats: {
    totalUsers: number;
    activeListings: number;
    pendingDisputes: number;
    totalRevenue: number;
    liveUsers: number;
    growthRate: number;
    conversionRate: number;
    avgTransactionValue: number;
  };
}

export function AdminOverview({ stats }: AdminOverviewProps) {
  // Recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const [disputes, users, transactions] = await Promise.all([
        supabase.from('disputes').select('*, listing_id, raised_by_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('display_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('transactions').select('amount, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const activities: any[] = [];
      
      disputes.data?.forEach(d => {
        activities.push({
          type: 'dispute',
          message: `New dispute raised - Review needed`,
          time: new Date(d.created_at),
          icon: AlertTriangle,
          color: 'text-destructive',
        });
      });

      users.data?.forEach(u => {
        activities.push({
          type: 'user',
          message: `New user registered - ${u.display_name || 'Unknown'}`,
          time: new Date(u.created_at),
          icon: Users,
          color: 'text-primary',
        });
      });

      transactions.data?.forEach(t => {
        if (t.status === 'completed') {
          activities.push({
            type: 'transaction',
            message: `Transaction completed - £${Number(t.amount).toFixed(2)}`,
            time: new Date(t.created_at),
            icon: CheckCircle,
            color: 'text-success',
          });
        }
      });

      return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
    },
  });

  // Priority actions
  const { data: priorityActions = [] } = useQuery({
    queryKey: ['admin-priority-actions'],
    queryFn: async () => {
      const actions: any[] = [];

      // Pending disputes > 3 days
      const { data: oldDisputes } = await supabase
        .from('disputes')
        .select('id, created_at')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

      if (oldDisputes && oldDisputes.length > 0) {
        actions.push({
          title: `${oldDisputes.length} Disputes Pending >3 Days`,
          description: 'Urgent attention required',
          priority: 'high',
          link: '/admin?section=disputes',
        });
      }

      // Stuck transactions > 7 days
      const { data: stuckTransactions } = await supabase
        .from('transactions')
        .select('id, status, updated_at')
        .in('status', ['pending', 'paid', 'dispatched'])
        .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (stuckTransactions && stuckTransactions.length > 0) {
        actions.push({
          title: `${stuckTransactions.length} Stuck Transactions`,
          description: 'No activity in 7+ days',
          priority: 'medium',
          link: '/admin?section=transactions',
        });
      }

      return actions;
    },
  });

  // Revenue trend (last 6 months)
  const { data: revenueTrend = [] } = useQuery({
    queryKey: ['admin-revenue-trend'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthlyData: { [key: string]: number } = {};
      
      data?.forEach(t => {
        const month = new Date(t.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + Number(t.amount);
      });

      return Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));
    },
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      change: `+${stats.growthRate}%`,
    },
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: Package,
      color: "text-success",
      bgColor: "bg-success/10",
      change: null,
    },
    {
      title: "Pending Disputes",
      value: stats.pendingDisputes,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      change: stats.pendingDisputes > 5 ? "High" : null,
    },
    {
      title: "Total Revenue",
      value: `£${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      change: null,
    },
    {
      title: "Live Users",
      value: stats.liveUsers,
      icon: Activity,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      change: "Real-time",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      change: null,
    },
    {
      title: "Avg Transaction",
      value: `£${stats.avgTransactionValue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                )}
              </div>
              <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Priority Actions */}
      {priorityActions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold">Priority Actions</h3>
          </div>
          <div className="space-y-3">
            {priorityActions.map((action, idx) => (
              <a
                key={idx}
                href={action.link}
                className="block p-4 rounded-lg border border-border hover:bg-secondary transition-smooth"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      action.priority === 'high' && "bg-destructive/10 text-destructive",
                      action.priority === 'medium' && "bg-warning/10 text-warning"
                    )}
                  >
                    {action.priority.toUpperCase()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Feed & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className={`h-8 w-8 rounded-full ${activity.color === 'text-destructive' ? 'bg-destructive/10' : activity.color === 'text-primary' ? 'bg-primary/10' : 'bg-success/10'} flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.time).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
