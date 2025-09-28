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
import { ProfileSkeleton, MyListingSkeleton } from "@/components/LoadingSkeletons";

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
      navigate("/sign-in");
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
              <Button variant="outline" disabled>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 pb-24 max-w-full overflow-x-hidden">
            <ProfileSkeleton />
            <div className="mt-6">
              <div className="grid w-full grid-cols-4 mb-6 h-12 bg-muted rounded-md animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <MyListingSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </>
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
            <div className="overflow-x-auto mb-6 sticky top-20 z-10">
              <TabsList className="grid w-full grid-cols-4 bg-muted/80 backdrop-blur-sm border h-auto p-1 min-w-[320px]">
                <TabsTrigger value="listings" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">My Listings</span>
                  <span className="sm:hidden text-[10px] truncate">Lists</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 relative min-w-0">
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Messages</span>
                  <span className="sm:hidden text-[10px] truncate">Msgs</span>
                  <NotificationBadge count={counts.unreadMessages + counts.pendingOffers + counts.newOffers} />
                </TabsTrigger>
                <TabsTrigger value="favourites" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0">
                  <Heart className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Favourites</span>
                  <span className="sm:hidden text-[10px] truncate">Favs</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0">
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Profile</span>
                  <span className="sm:hidden text-[10px] truncate">Profile</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
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