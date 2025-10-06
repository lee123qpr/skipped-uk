import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Mail, Eye, MoreVertical, 
  ShoppingCart, Package, TrendingUp, Star,
  Calendar, Clock, AlertCircle, CheckCircle2,
  XCircle, Plane
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { RemoveUserDialog } from "./RemoveUserDialog";
import { AdminMessageDialog } from "./AdminMessageDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStats {
  totalSales: number;
  totalRevenue: number;
  totalPurchases: number;
  totalSpend: number;
  activeListings: number;
  averageRating: number;
  reviewCount: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  verified: boolean;
  identity_verified: boolean;
  created_at: string;
  account_status: string;
  on_holiday: boolean;
  stripe_onboarding_complete: boolean;
  company_name: string | null;
  last_active_at: string | null;
  stats?: UserStats;
}

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStripe, setFilterStripe] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; userId: string; userName: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with account status
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, username, company_name, verified, identity_verified, stripe_onboarding_complete, created_at, account_status, on_holiday, last_active_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch stats for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get sales stats
          const { data: sales } = await supabase
            .from("transactions")
            .select("amount, status")
            .eq("seller_id", profile.user_id)
            .in("status", ["completed", "delivered", "paid", "dispatched"]);

          // Get purchase stats
          const { data: purchases } = await supabase
            .from("transactions")
            .select("amount")
            .eq("buyer_id", profile.user_id)
            .eq("status", "completed");

          // Get active listings count
          const { count: listingsCount } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", profile.user_id)
            .eq("status", "active");

          // Get average rating
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("seller_id", profile.user_id);

          const totalSales = sales?.filter(s => s.status === "completed").length || 0;
          const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;
          const totalPurchases = purchases?.length || 0;
          const totalSpend = purchases?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
          const averageRating = reviews?.length 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

          return {
            ...profile,
            stats: {
              totalSales,
              totalRevenue,
              totalPurchases,
              totalSpend,
              activeListings: listingsCount || 0,
              averageRating,
              reviewCount: reviews?.length || 0,
            },
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    // Search filter
    const searchMatch =
      !searchQuery ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Stripe filter
    const stripeMatch =
      filterStripe === "all" ||
      (filterStripe === "connected" && user.stripe_onboarding_complete) ||
      (filterStripe === "not_connected" && !user.stripe_onboarding_complete);

    // Activity filter
    const activityMatch =
      filterActivity === "all" ||
      (filterActivity === "has_sales" && (user.stats?.totalSales || 0) > 0) ||
      (filterActivity === "has_purchases" && (user.stats?.totalPurchases || 0) > 0) ||
      (filterActivity === "has_listings" && (user.stats?.activeListings || 0) > 0) ||
      (filterActivity === "never_transacted" && !user.stats?.totalSales && !user.stats?.totalPurchases);

    // Status filter
    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "active" && user.account_status === "active") ||
      (filterStatus === "holiday" && user.on_holiday) ||
      (filterStatus === "suspended" && user.account_status === "suspended");

    return searchMatch && stripeMatch && activityMatch && statusMatch;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "sales":
        return (b.stats?.totalSales || 0) - (a.stats?.totalSales || 0);
      case "purchases":
        return (b.stats?.totalPurchases || 0) - (a.stats?.totalPurchases || 0);
      case "revenue":
        return (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0);
      case "rating":
        return (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
      case "active":
        const aLastActive = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
        const bLastActive = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
        return bLastActive - aLastActive;
      case "newest":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleViewProfile = (userId: string) => {
    // Open profile in new tab (public profile view would need to be created)
    // For now, show info that this feature needs implementation
    toast.error("User profile view page needs to be implemented");
  };

  const handleMessage = (user: UserProfile) => {
    setMessageDialog({
      open: true,
      userId: user.id,
      userName: user.display_name || user.username || 'User'
    });
  };

  const handleRemoveUser = (user: UserProfile) => {
    setSelectedUser(user);
    setRemoveDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStripe} onValueChange={setFilterStripe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stripe Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="connected">Stripe Connected</SelectItem>
            <SelectItem value="not_connected">Not Connected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterActivity} onValueChange={setFilterActivity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="has_sales">Has Sales</SelectItem>
            <SelectItem value="has_purchases">Has Purchases</SelectItem>
            <SelectItem value="has_listings">Has Listings</SelectItem>
            <SelectItem value="never_transacted">Never Transacted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="holiday">On Holiday</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="sales">Most Sales</SelectItem>
            <SelectItem value="purchases">Most Purchases</SelectItem>
            <SelectItem value="revenue">Highest Revenue</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="active">Recently Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">
                      {user.display_name || user.username}
                    </h3>
                    {user.account_status === "suspended" && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                    {user.on_holiday && (
                      <Badge variant="secondary" className="gap-1">
                        <Plane className="h-3 w-3" /> On Holiday
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                    {user.company_name && ` • ${user.company_name}`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewProfile(user.user_id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMessage(user)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemoveUser(user)}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Remove User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Sales Stats */}
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {user.stats?.totalSales || 0} sales
                    </p>
                    <p className="text-xs text-muted-foreground">
                      £{(user.stats?.totalRevenue || 0).toFixed(2)} revenue
                    </p>
                  </div>
                </div>

                {/* Purchase Stats */}
                <div className="flex items-start gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {user.stats?.totalPurchases || 0} purchases
                    </p>
                    <p className="text-xs text-muted-foreground">
                      £{(user.stats?.totalSpend || 0).toFixed(2)} spent
                    </p>
                  </div>
                </div>

                {/* Active Listings */}
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {user.stats?.activeListings || 0} active
                    </p>
                    <p className="text-xs text-muted-foreground">listings</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {user.stats?.averageRating 
                        ? user.stats.averageRating.toFixed(1)
                        : "N/A"}{" "}
                      ⭐
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.stats?.reviewCount || 0} reviews
                    </p>
                  </div>
                </div>

                {/* Stripe Status */}
                <div className="flex items-start gap-2">
                  {user.stripe_onboarding_complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Stripe</p>
                    <p className="text-xs text-muted-foreground">
                      {user.stripe_onboarding_complete ? "Connected" : "Not Setup"}
                    </p>
                  </div>
                </div>

                {/* Last Active / Member Since */}
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {user.last_active_at
                        ? formatDistanceToNow(new Date(user.last_active_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(user.created_at), "PP")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedUsers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No users found matching your filters
          </p>
        </Card>
      )}

      {/* Remove User Dialog */}
      {selectedUser && (
        <RemoveUserDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          userId={selectedUser.user_id}
          userName={selectedUser.display_name || selectedUser.username}
          onSuccess={fetchUsers}
        />
      )}

      {/* Admin Message Dialog */}
      {messageDialog && (
        <AdminMessageDialog
          open={messageDialog.open}
          onOpenChange={(open) => !open && setMessageDialog(null)}
          userId={messageDialog.userId}
          userName={messageDialog.userName}
        />
      )}
    </div>
  );
}