import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from "lucide-react";

export function AdminFinancials() {
  // Fetch Stripe balance
  const { data: stripeData, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-stripe-balance');
      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['admin-financials-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate financial metrics
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const refundedTransactions = transactions.filter(t => t.status === 'refunded');
  
  const totalTurnover = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = refundedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFees = completedTransactions.reduce((sum, t) => sum + Number(t.buyer_protection_fee || 0), 0);
  const netRevenue = totalTurnover - totalRefunds;
  
  // Stripe takes ~2.9% + 30p per transaction, calculate our profit after Stripe fees
  const estimatedStripeFees = completedTransactions.reduce((sum, t) => {
    const amount = Number(t.amount);
    return sum + (amount * 0.029 + 0.30);
  }, 0);
  
  const profit = totalFees - estimatedStripeFees;

  // Get available and pending balance from Stripe
  const availableBalance = stripeData?.balance?.available?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
  const pendingBalance = stripeData?.balance?.pending?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;

  // Calculate this month's metrics
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTransactions = completedTransactions.filter(t => 
    new Date(t.created_at) >= firstDayOfMonth
  );
  const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthFees = thisMonthTransactions.reduce((sum, t) => sum + Number(t.buyer_protection_fee || 0), 0);

  if (stripeLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Overview</h2>
        <p className="text-muted-foreground mt-1">Platform financial metrics and Stripe account balance</p>
      </div>

      {/* Stripe Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold mt-2">£{(availableBalance / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
              <p className="text-3xl font-bold mt-2">£{(pendingBalance / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Processing</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Turnover</p>
              <p className="text-2xl font-bold mt-2">£{totalTurnover.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {completedTransactions.length} transactions
                </Badge>
              </div>
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Fees Collected</p>
              <p className="text-2xl font-bold mt-2">£{totalFees.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3" />
                <span>Buyer protection fees</span>
              </div>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estimated Profit</p>
              <p className="text-2xl font-bold mt-2">£{profit.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>After Stripe fees</span>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold mt-2">£{totalRefunds.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="destructive" className="text-xs">
                  {refundedTransactions.length} refunds
                </Badge>
              </div>
            </div>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
        </Card>
      </div>

      {/* This Month Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">This Month's Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold mt-1">£{thisMonthRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonthTransactions.length} completed transactions
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fees Collected</p>
            <p className="text-2xl font-bold mt-1">£{thisMonthFees.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              From buyer protection
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Transaction</p>
            <p className="text-2xl font-bold mt-1">
              £{thisMonthTransactions.length > 0 
                ? (thisMonthRevenue / thisMonthTransactions.length).toFixed(2) 
                : '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Per completed sale
            </p>
          </div>
        </div>
      </Card>

      {/* All-Time Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All-Time Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Net Revenue</p>
            <p className="text-xl font-bold">£{netRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">After refunds</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Avg Transaction Value</p>
            <p className="text-xl font-bold">
              £{completedTransactions.length > 0 
                ? (totalTurnover / completedTransactions.length).toFixed(2) 
                : '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Per sale</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Est. Stripe Fees</p>
            <p className="text-xl font-bold">£{estimatedStripeFees.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">2.9% + 30p per txn</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Refund Rate</p>
            <p className="text-xl font-bold">
              {transactions.length > 0 
                ? ((refundedTransactions.length / transactions.length) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-xs text-muted-foreground">Of all transactions</p>
          </div>
        </div>
      </Card>

      {/* Transaction Status Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['pending', 'paid', 'dispatched', 'delivered', 'completed', 'disputed', 'refunded'].map(status => {
            const count = transactions.filter(t => t.status === status).length;
            const total = transactions.filter(t => t.status === status)
              .reduce((sum, t) => sum + Number(t.amount), 0);
            
            return (
              <div key={status} className="space-y-1">
                <p className="text-xs text-muted-foreground capitalize">{status}</p>
                <p className="text-lg font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground">£{total.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
