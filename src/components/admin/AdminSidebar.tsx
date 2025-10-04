import { LayoutDashboard, AlertTriangle, Users, Package, DollarSign, TrendingUp, Settings, Activity, Wallet, LogOut, Newspaper } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";
import skippedLogo from "@/assets/skipped-logo.jpeg";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  pendingDisputesCount: number;
}

export function AdminSidebar({ pendingDisputesCount }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { open, setOpenMobile } = useSidebar();
  const currentSection = new URLSearchParams(location.search).get('section') || 'overview';

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    setOpenMobile(false);
  };

  const navigation = [
    {
      name: "Overview",
      icon: LayoutDashboard,
      section: "overview",
      badge: null,
    },
    {
      name: "Disputes",
      icon: AlertTriangle,
      section: "disputes",
      badge: pendingDisputesCount > 0 ? pendingDisputesCount : null,
      badgeVariant: "destructive" as const,
    },
    {
      name: "Users",
      icon: Users,
      section: "users",
      badge: null,
    },
    {
      name: "Listings",
      icon: Package,
      section: "listings",
      badge: null,
    },
    {
      name: "Transactions",
      icon: DollarSign,
      section: "transactions",
      badge: null,
    },
    {
      name: "Financials",
      icon: Wallet,
      section: "financials",
      badge: null,
    },
    {
      name: "Analytics",
      icon: TrendingUp,
      section: "analytics",
      badge: null,
    },
    {
      name: "News & Resources",
      icon: Newspaper,
      section: "blog",
      badge: null,
    },
    {
      name: "System Health",
      icon: Activity,
      section: "health",
      badge: null,
    },
    {
      name: "Settings",
      icon: Settings,
      section: "settings",
      badge: null,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="p-4 space-y-3">
          <Link to="/" className="block">
            <img 
              src={skippedLogo} 
              alt="Skipped Logo" 
              className={cn(
                "h-10 w-full object-contain rounded-lg transition-all",
                !open && "h-8"
              )} 
            />
          </Link>
          {open && (
            <div className="text-center">
              <h2 className="text-base font-semibold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Platform Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = currentSection === item.section;
                return (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link to={`/admin?section=${item.section}`} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        {item.badge !== null && (
                          <Badge 
                            variant={item.badgeVariant || "secondary"} 
                            className="ml-auto"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 space-y-2">
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size={open ? "default" : "icon"}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Sign Out</span>}
          </Button>
          {open && (
            <div className="px-3 py-2 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Admin Access</p>
              <p className="text-xs text-muted-foreground mt-1">Full platform control</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
