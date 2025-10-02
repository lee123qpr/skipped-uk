import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface Banner {
  id: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  banner_type: "info" | "warning" | "critical";
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
}

const AdminBannerManager = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message: "",
    link_url: "",
    link_text: "",
    banner_type: "info" as "info" | "warning" | "critical",
    is_active: false,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch banners");
      console.error(error);
    } else {
      setBanners((data || []) as Banner[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerData = {
      message: formData.message,
      link_url: formData.link_url || null,
      link_text: formData.link_text || null,
      banner_type: formData.banner_type,
      is_active: formData.is_active,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("site_banners")
        .update(bannerData)
        .eq("id", editing);

      if (error) {
        toast.error("Failed to update banner");
        console.error(error);
      } else {
        toast.success("Banner updated successfully");
        resetForm();
        fetchBanners();
      }
    } else {
      const { error } = await supabase
        .from("site_banners")
        .insert([bannerData]);

      if (error) {
        toast.error("Failed to create banner");
        console.error(error);
      } else {
        toast.success("Banner created successfully");
        resetForm();
        fetchBanners();
      }
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner.id);
    setFormData({
      message: banner.message,
      link_url: banner.link_url || "",
      link_text: banner.link_text || "",
      banner_type: banner.banner_type,
      is_active: banner.is_active,
      start_date: banner.start_date ? format(new Date(banner.start_date), "yyyy-MM-dd'T'HH:mm") : "",
      end_date: banner.end_date ? format(new Date(banner.end_date), "yyyy-MM-dd'T'HH:mm") : "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    const { error } = await supabase
      .from("site_banners")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete banner");
      console.error(error);
    } else {
      toast.success("Banner deleted successfully");
      fetchBanners();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("site_banners")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update banner status");
      console.error(error);
    } else {
      toast.success("Banner status updated");
      fetchBanners();
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      message: "",
      link_url: "",
      link_text: "",
      banner_type: "info",
      is_active: false,
      start_date: "",
      end_date: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Announcement Banners</h2>
        <p className="text-muted-foreground">Manage site-wide announcement banners</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Banner" : "Create New Banner"}</CardTitle>
          <CardDescription>
            {editing ? "Update the banner details below" : "Create a new announcement banner"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                placeholder="Enter the announcement message"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL (optional)</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_text">Link Text (optional)</Label>
                <Input
                  id="link_text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  placeholder="Learn more"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_type">Banner Type</Label>
              <Select
                value={formData.banner_type}
                onValueChange={(value: "info" | "warning" | "critical") =>
                  setFormData({ ...formData, banner_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="critical">Critical (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date (optional)</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (optional)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editing ? "Update Banner" : "Create Banner"}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : banners.length === 0 ? (
            <p className="text-muted-foreground">No banners created yet</p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            banner.banner_type === "info"
                              ? "bg-blue-100 text-blue-700"
                              : banner.banner_type === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {banner.banner_type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            banner.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {banner.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="font-medium">{banner.message}</p>
                      {banner.link_url && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Link: {banner.link_text || banner.link_url}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {banner.view_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {banner.click_count} clicks
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleActive(banner.id, banner.is_active)}
                      >
                        <Switch checked={banner.is_active} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBannerManager;
