import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Settings, LogOut, MessageCircle, PoundSterling, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import MyListings from "@/components/MyListings";
import MessagesInbox from "@/components/MessagesInbox";
import FavouritesTab from "@/components/FavouritesTab";
import ProfileEdit from "@/components/ProfileEdit";
import NotificationBadge from "@/components/NotificationBadge";

interface UserProfile {
  display_name: string | null;
  username: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  company_name: string | null;
  location: string | null;
  verified: boolean;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { counts } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Get tab from URL params, default to 'listings'
  const activeTab = searchParams.get('tab') || 'listings';

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Dashboard - Skipped"
        description="Manage your Skipped account, listings, and profile"
        keywords="dashboard, account, profile, listings"
      />
      <div className="bg-background">
        <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 pb-24 max-w-full overflow-x-hidden">
          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || 
                       profile?.username?.charAt(0)?.toUpperCase() || 
                       user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">
                      Welcome back, {profile?.display_name || profile?.username || 'User'}!
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      @{profile?.username || 'username'}
                      {profile?.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="min-w-0">
                    <span className="text-muted-foreground block">Email:</span>
                    <p className="font-medium truncate">{user?.email}</p>
                  </div>
                  {profile?.phone && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground block">Phone:</span>
                      <p className="font-medium truncate">{profile.phone}</p>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground block">Location:</span>
                      <p className="font-medium truncate">{profile.location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => navigate(`/dashboard?tab=${value}`)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-20 z-10 bg-muted h-auto p-1">
              <TabsTrigger value="listings" className="flex flex-col sm:flex-row items-center gap-1 text-xs md:text-sm px-2 py-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">My Listings</span>
                <span className="sm:hidden text-xs">Listings</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex flex-col sm:flex-row items-center gap-1 text-xs md:text-sm px-2 py-2 relative">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                <span className="sm:hidden text-xs">Messages</span>
                <NotificationBadge count={counts.unreadMessages + counts.pendingOffers + counts.newOffers} />
              </TabsTrigger>
              <TabsTrigger value="favourites" className="flex flex-col sm:flex-row items-center gap-1 text-xs md:text-sm px-2 py-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favourites</span>
                <span className="sm:hidden text-xs">Saved</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 text-xs md:text-sm px-2 py-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden text-xs">Profile</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="listings" className="space-y-4">
              <MyListings />
            </TabsContent>
            
            <TabsContent value="messages" className="space-y-4">
              <MessagesInbox />
            </TabsContent>
            
            <TabsContent value="favourites" className="space-y-4">
              <FavouritesTab />
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-4">
              <ProfileEdit />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Dashboard;