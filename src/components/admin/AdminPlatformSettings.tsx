import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Shield, DollarSign, Zap } from "lucide-react";

interface PlatformSettings {
  maintenance_mode: {
    enabled: boolean;
    message: string;
  };
  feature_flags: {
    new_registrations: boolean;
    create_listings: boolean;
    make_offers: boolean;
    transactions: boolean;
  };
  buyer_protection_fee_percentage: {
    value: number;
  };
  platform_commission_percentage: {
    value: number;
  };
}

const AdminPlatformSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    maintenance_mode: { enabled: false, message: "" },
    feature_flags: {
      new_registrations: true,
      create_listings: true,
      make_offers: true,
      transactions: true,
    },
    buyer_protection_fee_percentage: { value: 3.5 },
    platform_commission_percentage: { value: 5.0 },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*");

    if (error) {
      toast.error("Failed to fetch settings");
      console.error(error);
    } else if (data) {
      const settingsObj: any = {};
      data.forEach((setting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsObj as PlatformSettings);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({ setting_value: value })
      .eq("setting_key", key);

    if (error) {
      toast.error(`Failed to update ${key}`);
      console.error(error);
    } else {
      toast.success("Setting updated successfully");
    }
    setSaving(false);
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    const newValue = { ...settings.maintenance_mode, enabled };
    setSettings({ ...settings, maintenance_mode: newValue });
    await updateSetting("maintenance_mode", newValue);
  };

  const handleMaintenanceMessage = async () => {
    await updateSetting("maintenance_mode", settings.maintenance_mode);
  };

  const handleFeatureToggle = async (feature: keyof PlatformSettings["feature_flags"]) => {
    const newFlags = {
      ...settings.feature_flags,
      [feature]: !settings.feature_flags[feature],
    };
    setSettings({ ...settings, feature_flags: newFlags });
    await updateSetting("feature_flags", newFlags);
  };

  const handleFeeUpdate = async (key: "buyer_protection_fee_percentage" | "platform_commission_percentage") => {
    await updateSetting(key, settings[key]);
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <p className="text-muted-foreground">Manage global platform configuration</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Maintenance Mode</CardTitle>
          </div>
          <CardDescription>
            Enable maintenance mode to prevent users from accessing the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users will see a maintenance message
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenance_mode.enabled}
              onCheckedChange={handleMaintenanceToggle}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              value={settings.maintenance_mode.message}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenance_mode: {
                    ...settings.maintenance_mode,
                    message: e.target.value,
                  },
                })
              }
              placeholder="We are currently performing maintenance..."
            />
            <Button onClick={handleMaintenanceMessage} disabled={saving}>
              Update Message
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
          <CardDescription>
            Enable or disable specific platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Registrations</Label>
              <p className="text-sm text-muted-foreground">Allow new users to register</p>
            </div>
            <Switch
              checked={settings.feature_flags.new_registrations}
              onCheckedChange={() => handleFeatureToggle("new_registrations")}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Create Listings</Label>
              <p className="text-sm text-muted-foreground">Allow users to create new listings</p>
            </div>
            <Switch
              checked={settings.feature_flags.create_listings}
              onCheckedChange={() => handleFeatureToggle("create_listings")}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Make Offers</Label>
              <p className="text-sm text-muted-foreground">Allow users to make offers on listings</p>
            </div>
            <Switch
              checked={settings.feature_flags.make_offers}
              onCheckedChange={() => handleFeatureToggle("make_offers")}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transactions</Label>
              <p className="text-sm text-muted-foreground">Enable payment processing</p>
            </div>
            <Switch
              checked={settings.feature_flags.transactions}
              onCheckedChange={() => handleFeatureToggle("transactions")}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Fee Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure platform fees and commissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="buyer-protection-fee">Buyer Protection Fee (%)</Label>
            <div className="flex gap-2">
              <Input
                id="buyer-protection-fee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.buyer_protection_fee_percentage.value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    buyer_protection_fee_percentage: { value: parseFloat(e.target.value) },
                  })
                }
              />
              <Button
                onClick={() => handleFeeUpdate("buyer_protection_fee_percentage")}
                disabled={saving}
              >
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Fee added to transactions for buyer protection
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform-commission">Platform Commission (%)</Label>
            <div className="flex gap-2">
              <Input
                id="platform-commission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.platform_commission_percentage.value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform_commission_percentage: { value: parseFloat(e.target.value) },
                  })
                }
              />
              <Button
                onClick={() => handleFeeUpdate("platform_commission_percentage")}
                disabled={saving}
              >
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Commission taken from completed transactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformSettings;
