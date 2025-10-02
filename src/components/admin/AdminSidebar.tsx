import { LayoutDashboard, AlertTriangle, Users, Package, DollarSign, TrendingUp, Settings, Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import skippedLogo from "@/assets/skipped-logo.jpeg";

interface AdminSidebarProps {
  pendingDisputesCount: number;
}

export function AdminSidebar({ pendingDisputesCount }: AdminSidebarProps) {
  const location = useLocation();
  const currentSection = new URLSearchParams(location.search).get('section') || 'overview';

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
      name: "Analytics",
      icon: TrendingUp,
      section: "analytics",
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
    <aside className="hidden md:flex w-64 border-r bg-card flex-col">
      <div className="p-6 border-b space-y-4">
        <Link to="/" className="block">
          <img src={skippedLogo} alt="Skipped Logo" className="h-16 w-full object-contain rounded-lg" />
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">Platform Management</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentSection === item.section;
          return (
            <Link
              key={item.section}
              to={`/admin?section=${item.section}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge !== null && (
                <Badge variant={item.badgeVariant || "secondary"} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="px-3 py-2 bg-muted rounded-lg">
          <p className="text-xs font-medium text-muted-foreground">Admin Access</p>
          <p className="text-xs text-muted-foreground mt-1">Full platform control</p>
        </div>
      </div>
    </aside>
  );
}
