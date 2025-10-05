import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Clock, CheckCircle, XCircle, AlertTriangle, Package, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-transactions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: txData, error: txError } = await query;
      if (txError) throw txError;
      if (!txData) return [];

      // Fetch related data separately
      const listingIds = [...new Set(txData.map(t => t.listing_id))];
      const buyerIds = [...new Set(txData.map(t => t.buyer_id))];
      const sellerIds = [...new Set(txData.map(t => t.seller_id))];

      const [listingsData, buyersData, sellersData] = await Promise.all([
        supabase.from('listings').select('id, title').in('id', listingIds),
        supabase.from('profiles').select('user_id, display_name, username').in('user_id', buyerIds),
        supabase.from('profiles').select('user_id, display_name, username').in('user_id', sellerIds),
      ]);

      // Create lookup maps
      const listingsMap = new Map(listingsData.data?.map(l => [l.id, l]) || []);
      const buyersMap = new Map(buyersData.data?.map(b => [b.user_id, b]) || []);
      const sellersMap = new Map(sellersData.data?.map(s => [s.user_id, s]) || []);

      // Merge data
      return txData.map(tx => ({
        ...tx,
        listing: listingsMap.get(tx.listing_id),
        buyer: buyersMap.get(tx.buyer_id),
        seller: sellersMap.get(tx.seller_id),
      }));
    },
  });

  // Status counts for cards
  const statusCounts = {
    pending_payment: transactions.filter(t => t.status === 'pending_payment').length,
    paid: transactions.filter(t => t.status === 'paid').length,
    dispatched: transactions.filter(t => t.status === 'dispatched').length,
    delivered: transactions.filter(t => t.status === 'delivered').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    disputed: transactions.filter(t => t.status === 'disputed' || t.status === 'disputed_pending_review').length,
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.buyer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.seller?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { variant: "secondary" as const, label: "Pending Payment", icon: Clock },
      paid: { variant: "default" as const, label: "Paid", icon: CreditCard },
      dispatched: { variant: "default" as const, label: "Dispatched", icon: Package },
      delivered: { variant: "default" as const, label: "Delivered", icon: CheckCircle },
      completed: { variant: "default" as const, label: "Completed", icon: CheckCircle },
      disputed: { variant: "destructive" as const, label: "Disputed", icon: AlertTriangle },
      disputed_pending_review: { variant: "destructive" as const, label: "Dispute - Under Review", icon: AlertTriangle },
      refunded: { variant: "secondary" as const, label: "Refunded", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_payment;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Transaction Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage platform transactions</p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Payment</p>
          <p className="text-2xl font-bold mt-1">{statusCounts.pending_payment}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold mt-1">{statusCounts.paid}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Dispatched</p>
          <p className="text-2xl font-bold mt-1">{statusCounts.dispatched}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Delivered</p>
          <p className="text-2xl font-bold mt-1">{statusCounts.delivered}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold mt-1">{statusCounts.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Disputed</p>
          <p className="text-2xl font-bold mt-1 text-destructive">{statusCounts.disputed}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by listing, buyer, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="disputed_pending_review">Dispute - Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold">{transaction.listing?.title || 'Unknown Listing'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transaction ID: {transaction.id.slice(0, 8)}...
                    </p>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold">£{Number(transaction.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p className="font-semibold text-sm truncate">
                      {transaction.buyer?.display_name || transaction.buyer?.username || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Seller</p>
                    <p className="font-semibold text-sm truncate">
                      {transaction.seller?.display_name || transaction.seller?.username || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-semibold text-sm">
                      {new Date(transaction.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {transaction.listing_id && (
                    <Link to={`/listing/${transaction.listing_id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Listing
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredTransactions.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
