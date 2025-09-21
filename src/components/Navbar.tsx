import { User, Heart, ShoppingBag, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-foreground rounded transform rotate-45"></div>
            </div>
            <div className="font-semibold text-xl text-foreground">
              <span className="text-primary">Skipped</span>
            </div>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <Link to="/sell">
                <Button variant="marketplace" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Sell Item
                </Button>
              </Link>
              
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <ShoppingBag className="h-4 w-4" />
              </Button>
              
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
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center space-x-1">
              <Link to="/sell">
                <Button variant="marketplace" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button variant="marketplace" size="sm">
                  Sign Up
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;