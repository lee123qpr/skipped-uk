import { User, Heart, ShoppingBag, Plus, LogOut, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/dashboard?tab=messages")}
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
                    )}
                  </Button>

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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/dashboard?tab=messages")}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Button>
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