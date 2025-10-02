import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Megaphone, Settings as SettingsIcon } from "lucide-react";

export function AdminSettings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage platform settings and configurations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors" 
          onClick={() => navigate("/admin?section=banners")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>Announcement Banners</CardTitle>
            </div>
            <CardDescription>Manage site-wide announcement banners</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage announcement banners that appear at the top of your site
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors" 
          onClick={() => navigate("/admin?section=platform-settings")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Platform Settings</CardTitle>
            </div>
            <CardDescription>Configure global platform settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage maintenance mode, feature flags, and fee configuration
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
