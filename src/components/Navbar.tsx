import { User, Heart, ShoppingBag, Plus, LogOut, Bell, Shield, Settings, LayoutDashboard, Coins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import skippedLogo from "@/assets/skipped-logo.jpeg";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { counts, notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const totalNotifications = counts.unreadNotifications;

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <ShoppingBag className="h-4 w-4" />;
      case 'dispute':
        return <Shield className="h-4 w-4" />;
      case 'offer':
        return <Plus className="h-4 w-4" />;
      case 'review_reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Get pending disputes count for admin badge
  const { data: pendingDisputesCount = 0 } = useQuery({
    queryKey: ['pending-disputes-count'],
    queryFn: async () => {
      if (!isAdmin) return 0;
      const { count } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!isAdmin,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSellClick = () => {
    if (user) {
      navigate("/create-listing");
    } else {
      navigate("/sign-up");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={skippedLogo} 
              alt="Skipped - Construction Materials Marketplace" 
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="marketplace" size="sm" onClick={handleSellClick}>
                <Plus className="h-4 w-4 mr-2" />
                Sell Item
              </Button>
              
              {user && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="relative"
                      >
                        <Bell className="h-4 w-4" />
                        {totalNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                            {totalNotifications > 9 ? '9+' : totalNotifications}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg w-80">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div>
                          <h3 className="font-semibold">Notifications</h3>
                          <p className="text-xs text-muted-foreground">
                            {totalNotifications === 0 ? 'No new notifications' : `${totalNotifications} unread`}
                          </p>
                        </div>
                        {totalNotifications > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-xs"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      {totalNotifications === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          All caught up! 🎉
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[400px]">
                          <div className="py-2">
                            {notifications.map((notification) => (
                              <DropdownMenuItem 
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className="px-4 py-3 cursor-pointer hover:bg-accent"
                              >
                                <div className="flex items-start gap-3 w-full">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {notification.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/browse")}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Listings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=purchases")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Purchases</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=favourites")}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favourites</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=financials")}>
                      <Coins className="mr-2 h-4 w-4" />
                      <span>Financials</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin")} className="text-primary font-medium">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                          {pendingDisputesCount > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {pendingDisputesCount}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/sign-up">
                    <Button variant="marketplace" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                  
                  <Link to="/sign-in">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center space-x-1">
              <Button variant="marketplace" size="sm" onClick={handleSellClick}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/browse")}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="relative"
                    >
                      <Bell className="h-4 w-4" />
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                          {totalNotifications > 9 ? '9+' : totalNotifications}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg w-72">
                    <div className="px-4 py-3 border-b">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <p className="text-xs text-muted-foreground">
                        {totalNotifications === 0 ? 'No new notifications' : `${totalNotifications} unread`}
                      </p>
                    </div>
                    {totalNotifications === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                        All caught up!
                      </div>
                    ) : (
                      <>
                        {counts.unreadMessages > 0 && (
                          <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                            <div className="flex items-center gap-2 w-full">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bell className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">New Messages</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {counts.unreadMessages} unread
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        )}
                        {counts.newOffers > 0 && (
                          <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                            <div className="flex items-center gap-2 w-full">
                              <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <Plus className="h-3 w-3 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">New Offers</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {counts.newOffers} new
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        )}
                        {counts.pendingOffers > 0 && (
                          <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                            <div className="flex items-center gap-2 w-full">
                              <div className="h-7 w-7 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="h-3 w-3 text-yellow-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">Pending Offers</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {counts.pendingOffers} awaiting
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Listings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=purchases")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Purchases</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=favourites")}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favourites</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=financials")}>
                      <Coins className="mr-2 h-4 w-4" />
                      <span>Financials</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                        {pendingDisputesCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {pendingDisputesCount}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/sign-up">
                    <Button variant="marketplace" size="sm" className="text-xs px-2">
                      Sign Up
                    </Button>
                  </Link>
                  <Link to="/sign-in">
                    <Button variant="outline" size="sm" className="text-xs px-2">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;