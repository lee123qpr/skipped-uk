import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Save, User, MapPin, Building, Phone, Mail } from 'lucide-react';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { VerificationBadges } from '@/components/VerificationBadge';
import { z } from 'zod';

const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name must be less than 100 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  company_name: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  company_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  business_logo_url: string | null;
  verified: boolean;
  stripe_onboarding_complete: boolean;
  identity_verified: boolean;
  created_at: string;
  updated_at: string;
}

const ProfileEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    company_name: '',
    phone: '',
    location: '',
    business_logo_url: '',
  });

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setFormData({
            display_name: data.display_name || '',
            username: data.username || '',
            bio: data.bio || '',
            company_name: data.company_name || '',
            phone: data.phone || '',
            location: data.location || '',
            business_logo_url: data.business_logo_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    if (username.length < 3) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('user_id', user?.id);

      if (error) throw error;

      setUsernameAvailable(data.length === 0);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(formData.username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, profile?.username, user?.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile photo has been updated successfully',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (profile?.business_logo_url) {
        const oldPath = profile.business_logo_url.split('/').slice(-2).join('/');
        await supabase.storage.from('business-logos').remove([oldPath]);
      }

      // Upload new logo
      const { data, error } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(data.path);

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ business_logo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, business_logo_url: publicUrl } : null);
      setFormData(prev => ({ ...prev, business_logo_url: publicUrl }));
      
      toast({
        title: 'Business logo updated',
        description: 'Your business logo has been updated successfully',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate username availability
    if (formData.username !== profile?.username && usernameAvailable === false) {
      toast({
        title: 'Username not available',
        description: 'Please choose a different username',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validate form data
      const validatedData = profileSchema.parse(formData);
      
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: validatedData.display_name,
          username: validatedData.username,
          bio: validatedData.bio || null,
          company_name: validatedData.company_name || null,
          phone: validatedData.phone || null,
          location: validatedData.location || null,
          business_logo_url: formData.business_logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        ...validatedData,
        updated_at: new Date().toISOString(),
      } : null);

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully',
        variant: 'default',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error updating profile:', error);
        toast({
          title: 'Update failed',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <Card className="shadow-soft w-full">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your public profile information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg border-2 border-border">
                    {formData.display_name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-2">Profile Photo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a profile photo to help others recognise you
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploadingAvatar}
                />
                <Button asChild variant="outline" size="sm" disabled={uploadingAvatar}>
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </label>
                </Button>
              </div>
            </div>

            {/* Business Logo Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-6 border-t">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={profile?.business_logo_url || undefined} />
                  <AvatarFallback className="text-lg border-2 border-border">
                    {formData.company_name?.charAt(0)?.toUpperCase() || 'B'}
                  </AvatarFallback>
                </Avatar>
                
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-2">Business Logo (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload your business logo to appear on environmental certificates only
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploadingLogo}
                />
                <Button asChild variant="outline" size="sm" disabled={uploadingLogo}>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Building className="h-4 w-4 mr-2" />
                    {profile?.business_logo_url ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="display_name">
                  <User className="h-4 w-4 inline mr-2" />
                  Display Name *
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="your-username"
                    required
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {formData.username && formData.username !== profile?.username && usernameAvailable !== null && (
                  <p className={`text-xs ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameAvailable ? 'Username is available' : 'Username is already taken'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  <Building className="h-4 w-4 inline mr-2" />
                  Company Name
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your company or business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+44 7XXX XXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <LocationAutocomplete
                id="location"
                label="Location"
                value={formData.location}
                onChange={(locationData) => {
                  handleInputChange('location', locationData.publicLocation);
                  setFormData(prev => ({
                    ...prev,
                    fullAddress: locationData.fullAddress,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                  }));
                }}
                placeholder="Start typing your location..."
              />
            </div>

            {/* Account Information */}
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-4">Account Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Member since:</span>
                  <span>{new Date(profile?.created_at || '').toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                {/* Verification Badges */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Verifications</h4>
                  <VerificationBadges
                    emailVerified={profile?.verified || false}
                    stripeVerified={profile?.stripe_onboarding_complete || false}
                    identityVerified={profile?.identity_verified || false}
                    size="md"
                    showLabel={true}
                  />
                  {!profile?.verified && !profile?.stripe_onboarding_complete && !profile?.identity_verified && (
                    <p className="text-xs text-muted-foreground mt-2">
                      No verifications yet. Verify your account to build trust with buyers and sellers.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={saving || (formData.username !== profile?.username && usernameAvailable === false)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;