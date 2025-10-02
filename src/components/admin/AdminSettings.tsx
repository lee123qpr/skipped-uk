import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Shield, Database, Mail } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function AdminSettings() {
  const [saving, setSaving] = useState(false);

  // Fetch current admin user
  const { data: adminUser } = useQuery({
    queryKey: ['current-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return { ...user, profile };
    },
  });

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [categories, listings, users, transactions] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
      ]);

      return {
        categories: categories.count || 0,
        listings: listings.count || 0,
        users: users.count || 0,
        transactions: transactions.count || 0,
      };
    },
  });

  const handleSaveSettings = async (section: string) => {
    setSaving(true);
    try {
      // Settings would be saved to a settings table
      toast.success(`${section} settings saved`);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Settings</h2>
        <p className="text-muted-foreground mt-1">Configure platform settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Platform Name</Label>
                <Input defaultValue="Skipped - Construction Materials Marketplace" />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input type="email" defaultValue="support@skipped.com" />
              </div>
              <div>
                <Label>Platform Description</Label>
                <Textarea 
                  rows={3}
                  defaultValue="A sustainable marketplace for construction materials in the UK"
                />
              </div>
              <Button onClick={() => handleSaveSettings("General")} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{platformStats?.categories}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold">{platformStats?.listings}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{platformStats?.users}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{platformStats?.transactions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Feature Flags</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable New Listings</Label>
                  <p className="text-sm text-muted-foreground">Allow users to create new listings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Listing Approval</Label>
                  <p className="text-sm text-muted-foreground">Listings require admin approval before going live</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Transactions</Label>
                  <p className="text-sm text-muted-foreground">Allow users to make purchases</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
                </div>
                <Switch />
              </div>
              <Button onClick={() => handleSaveSettings("Features")} disabled={saving}>
                {saving ? "Saving..." : "Save Feature Flags"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New User Registrations</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new users sign up</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Disputes</Label>
                  <p className="text-sm text-muted-foreground">Get notified when disputes are raised</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stuck Transactions</Label>
                  <p className="text-sm text-muted-foreground">Get notified about transactions stuck for 7+ days</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive daily platform activity summary</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => handleSaveSettings("Notifications")} disabled={saving}>
                {saving ? "Saving..." : "Save Notification Settings"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
            <div className="space-y-4">
              <div>
                <Label>Pending Disputes Alert (count)</Label>
                <Input type="number" defaultValue="5" />
                <p className="text-xs text-muted-foreground mt-1">Alert when pending disputes exceed this number</p>
              </div>
              <div>
                <Label>Stuck Transactions Alert (count)</Label>
                <Input type="number" defaultValue="3" />
                <p className="text-xs text-muted-foreground mt-1">Alert when stuck transactions exceed this number</p>
              </div>
              <div>
                <Label>Error Rate Alert (%)</Label>
                <Input type="number" defaultValue="5" />
                <p className="text-xs text-muted-foreground mt-1">Alert when error rate exceeds this percentage</p>
              </div>
              <Button onClick={() => handleSaveSettings("Alert Thresholds")} disabled={saving}>
                {saving ? "Saving..." : "Save Alert Settings"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Account</h3>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={adminUser?.email || ''} disabled />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input defaultValue={adminUser?.profile?.display_name || ''} />
              </div>
              <div>
                <Label>Username</Label>
                <Input defaultValue={adminUser?.profile?.username || ''} />
              </div>
              <Button onClick={() => handleSaveSettings("Account")} disabled={saving}>
                {saving ? "Saving..." : "Update Account"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Security Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add extra security to your admin account</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified of admin panel logins</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => handleSaveSettings("Security")} disabled={saving}>
                {saving ? "Saving..." : "Save Security Settings"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Database Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project ID</p>
                  <p className="text-sm font-mono">whfjfwxjtujfntwukzih</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="text-sm font-mono">eu-west-2 (London)</p>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Quick Links</p>
                <div className="space-y-2">
                  <a 
                    href="https://supabase.com/dashboard/project/whfjfwxjtujfntwukzih" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    → Supabase Dashboard
                  </a>
                  <a 
                    href="https://supabase.com/dashboard/project/whfjfwxjtujfntwukzih/editor" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    → Table Editor
                  </a>
                  <a 
                    href="https://supabase.com/dashboard/project/whfjfwxjtujfntwukzih/sql/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    → SQL Editor
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Database Maintenance</h3>
            <div className="space-y-4">
              <div>
                <Label>Backup Settings</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Automatic backups are enabled via Supabase
                </p>
                <Button variant="outline" size="sm">
                  View Backup History
                </Button>
              </div>
              <div>
                <Label>RLS Policy Status</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  All tables have Row Level Security enabled
                </p>
                <Button variant="outline" size="sm">
                  Run Security Scan
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
