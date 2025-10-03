import { User, Heart, ShoppingBag, Plus, LogOut, Bell, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import skippedLogo from "@/assets/skipped-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { counts } = useNotifications();
  const navigate = useNavigate();

  // Check if user is admin
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

  const totalNotifications = counts.unreadMessages + counts.pendingOffers + counts.newOffers;

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
                    <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg w-72">
                      <div className="px-4 py-3 border-b">
                        <h3 className="font-semibold">Notifications</h3>
                        <p className="text-xs text-muted-foreground">
                          {totalNotifications === 0 ? 'No new notifications' : `${totalNotifications} unread`}
                        </p>
                      </div>
                      {totalNotifications === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          All caught up!
                        </div>
                      ) : (
                        <>
                          {counts.unreadMessages > 0 && (
                            <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                              <div className="flex items-center gap-3 w-full">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Bell className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">New Messages</p>
                                  <p className="text-xs text-muted-foreground">
                                    {counts.unreadMessages} unread {counts.unreadMessages === 1 ? 'message' : 'messages'}
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          )}
                          {counts.newOffers > 0 && (
                            <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                              <div className="flex items-center gap-3 w-full">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                  <Plus className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">New Offers</p>
                                  <p className="text-xs text-muted-foreground">
                                    {counts.newOffers} new {counts.newOffers === 1 ? 'offer' : 'offers'}
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          )}
                          {counts.pendingOffers > 0 && (
                            <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>
                              <div className="flex items-center gap-3 w-full">
                                <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">Pending Offers</p>
                                  <p className="text-xs text-muted-foreground">
                                    {counts.pendingOffers} awaiting response
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/dashboard?tab=favourites")}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  
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
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=listings")}>My Listings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>Messages</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=favourites")}>Favourites</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=profile")}>Settings</DropdownMenuItem>
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
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=listings")}>My Listings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=messages")}>Messages</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard?tab=favourites")}>Favourites</DropdownMenuItem>
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