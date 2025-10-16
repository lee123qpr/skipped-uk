import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Truck, Package, Calendar, Leaf } from 'lucide-react';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaUpload from '@/components/MediaUpload';
import CarbonBadge from '@/components/CarbonBadge';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StripeLogo from '@/components/StripeLogo';
import { useCategories } from '@/hooks/useCategories';
import { toTitleCase } from '@/lib/utils';
const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  price: z.number().nonnegative('Price must be zero (free) or a positive amount').max(999999, 'Price must be less than £1,000,000'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair', 'salvage', 'parts_repair'], {
    errorMap: () => ({
      message: 'Please select a condition'
    })
  }),
  location: z.string().min(2, 'Location is required').max(100, 'Location must be less than 100 characters'),
  category_id: z.string().uuid('Please select a category'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  carbon_saved: z.number().nonnegative('Carbon saved cannot be negative').optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    unit: z.string().optional()
  }).optional(),
  weight: z.number().positive().optional(),
  delivery_available: z.boolean(),
  pickup_available: z.boolean(),
  collection_location: z.string().optional(),
  collection_notes: z.string().max(500, 'Collection notes must be less than 500 characters').optional(),
  delivery_radius: z.number().int().positive().optional(),
  delivery_cost: z.number().nonnegative().optional(),
  delivery_notes: z.string().max(500, 'Delivery notes must be less than 500 characters').optional(),
  reason_for_selling: z.string().optional(),
  manufacturer: z.string().max(100, 'Manufacturer name must be less than 100 characters').optional(),
  environmental_assessment_enabled: z.boolean().optional()
}).refine(data => data.delivery_available || data.pickup_available, {
  message: 'You must enable at least collection or delivery',
  path: ['pickup_available']
}).refine(data => {
  if (data.environmental_assessment_enabled && !data.weight) {
    return false;
  }
  return true;
}, {
  message: 'Weight per item is required for environmental certification',
  path: ['weight']
});
interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  order: number; // For drag & drop ordering
}
const CreateListing = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    id: listingId
  } = useParams();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Immediate authentication check - redirect if not signed in
  useEffect(() => {
    if (loading) return; // Wait for auth to initialise (prevents iOS refresh sign-out)
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a listing.',
        variant: 'destructive'
      });
      navigate('/sign-in');
    }
  }, [user, loading, navigate, toast]);
  const [originalListing, setOriginalListing] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    location: '',
    category_id: '',
    quantity: '1',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'mm'
    },
    weight: '',
    delivery_available: false,
    pickup_available: true,
    collection_location: '',
    collection_notes: '',
    delivery_radius: '10',
    delivery_cost: '',
    delivery_notes: '',
    reason_for_selling: '',
    manufacturer: '',
    environmental_assessment_enabled: false,
    // Additional location fields for privacy and mapping
    fullAddress: '',
    latitude: 0,
    longitude: 0,
    locationBounds: null as any
  });
  const [carbonCalculation, setCarbonCalculation] = useState<{
    totalCarbon: number;
    carbonPerUnit: number;
    materialType: string;
    calculationMethod: string;
    explanation: string;
    landfillDiverted?: number;
    calculationConfidence?: string;
  } | null>(null);
  const [isCalculatingCarbon, setIsCalculatingCarbon] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState<boolean | null>(null);

  // Use shared categories hook
  const {
    data: categories = []
  } = useCategories();

  // Check Stripe onboarding status via the edge function
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) return;
      try {
        // Check actual Stripe status via edge function
        const {
          data,
          error
        } = await supabase.functions.invoke('check-connect-status');
        if (error) {
          setStripeOnboarded(false);
          return;
        }

        // User must have onboarding complete AND charges enabled
        const isFullyOnboarded = data?.connected && data?.onboardingComplete && data?.chargesEnabled;
        setStripeOnboarded(isFullyOnboarded);
      } catch (err) {
        setStripeOnboarded(false);
      }
    };
    checkStripeStatus();
  }, [user]);

  // Fetch existing listing data when editing
  useEffect(() => {
    const fetchListingData = async () => {
      if (!listingId || !user) return;
      try {
        setIsLoading(true);
        const {
          data: listing,
          error
        } = await supabase.from('listings').select(`
            *,
            categories (
              id,
              name
            )
          `).eq('id', listingId).eq('seller_id', user.id).single();
        if (error) {
          toast({
            title: 'Error loading listing',
            description: 'Could not load listing data for editing.',
            variant: 'destructive'
          });
          navigate('/browse');
          return;
        }
        if (!listing) {
          toast({
            title: 'Listing not found',
            description: 'The listing you are trying to edit was not found.',
            variant: 'destructive'
          });
          navigate('/browse');
          return;
        }

        // Set editing mode and original listing
        setIsEditing(true);
        setOriginalListing(listing);

        // Parse dimensions if they exist
        const dimensions = listing.dimensions ? (() => {
          const dims = listing.dimensions as any;
          return {
            length: dims?.length?.toString() || '',
            width: dims?.width?.toString() || '',
            height: dims?.height?.toString() || '',
            unit: dims?.unit || 'mm'
          };
        })() : {
          length: '',
          width: '',
          height: '',
          unit: 'mm'
        };

        // Populate form with existing data
        setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price?.toString() || '',
          condition: listing.condition || '',
          location: listing.public_location || listing.location || '',
          category_id: listing.category_id || '',
          quantity: listing.quantity?.toString() || '1',
          dimensions,
          weight: listing.weight?.toString() || '',
          delivery_available: listing.delivery_available || false,
          pickup_available: listing.pickup_available !== false,
          // Default to true
          collection_location: listing.collection_location || '',
          collection_notes: listing.collection_notes || '',
          delivery_radius: listing.delivery_radius?.toString() || '10',
          delivery_cost: listing.delivery_cost?.toString() || '',
          delivery_notes: (listing as any).delivery_notes || '',
          reason_for_selling: listing.reason_for_selling || '',
          manufacturer: (listing as any).manufacturer || '',
          environmental_assessment_enabled: (listing as any).environmental_assessment_enabled || false,
          fullAddress: listing.full_address || '',
          latitude: listing.latitude || 0,
          longitude: listing.longitude || 0,
          locationBounds: listing.location_bounds || null
        });

        // Set up media files if images exist
        if (listing.images && listing.images.length > 0) {
          const existingMedia: MediaFile[] = listing.images.map((url, index) => ({
            id: `existing-${index}`,
            file: new File([], `image-${index}`, {
              type: 'image/jpeg'
            }),
            preview: url,
            type: 'image' as const,
            uploaded: true,
            url: url,
            order: index
          }));
          setMediaFiles(existingMedia);
        }

        // Set existing carbon calculation if available
        if (listing.carbon_saved && listing.certificate_methodology) {
          const methodology = listing.certificate_methodology as any;
          setCarbonCalculation({
            totalCarbon: listing.carbon_saved,
            carbonPerUnit: methodology.carbonFactor || 0,
            materialType: methodology.materialType || '',
            calculationMethod: methodology.calculationMethod || '',
            explanation: methodology.explanation || '',
            landfillDiverted: methodology.weight || 0,
            calculationConfidence: listing.calculation_confidence || 'medium'
          });
        }
      } catch (error) {
        toast({
          title: 'Error loading listing',
          description: 'Could not load listing data for editing.',
          variant: 'destructive'
        });
        navigate('/browse');
      } finally {
        setIsLoading(false);
      }
    };
    fetchListingData();
  }, [listingId, user, navigate, toast]);
  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.startsWith('dimensions.')) {
      const dimensionField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  const calculateCarbonSavings = async () => {
    if (!formData.title || !formData.category_id || !formData.condition || !formData.quantity) {
      return 0;
    }
    try {
      setIsCalculatingCarbon(true);
      const category = categories.find(c => c.id === formData.category_id);
      const requestData = {
        categoryName: category?.name || '',
        condition: formData.condition,
        quantity: parseInt(formData.quantity) || 1,
        dimensions: formData.dimensions.length || formData.dimensions.width || formData.dimensions.height ? {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
          unit: formData.dimensions.unit
        } : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        title: formData.title,
        description: formData.description
      };
      const {
        data,
        error
      } = await supabase.functions.invoke('calculate-carbon', {
        body: requestData
      });
      if (error) {
        throw error;
      }
      if (data && data.success) {
        setCarbonCalculation({
          totalCarbon: data.totalCarbon,
          carbonPerUnit: data.carbonPerUnit,
          materialType: data.materialType,
          calculationMethod: data.calculationMethod,
          explanation: data.explanation,
          landfillDiverted: data.landfillDiverted || data.weight,
          calculationConfidence: data.calculationConfidence
        });
        return data.totalCarbon;
      }
      return 0;
    } catch (error) {
      toast({
        title: 'Carbon calculation failed',
        description: 'Using estimated carbon savings. Please check your listing details.',
        variant: 'destructive'
      });

      // Fallback to simple calculation
      const category = categories.find(c => c.id === formData.category_id);
      const categoryName = category?.name.toLowerCase() || '';
      const baseCarbon = categoryName.includes('timber') || categoryName.includes('wood') ? 500 : categoryName.includes('brick') || categoryName.includes('concrete') ? 200 : categoryName.includes('steel') || categoryName.includes('metal') || categoryName.includes('scaffolding') ? 800 : categoryName.includes('insulation') ? 400 : categoryName.includes('roofing') ? 350 : 300;
      const quantity = parseInt(formData.quantity) || 1;
      return Math.round(baseCarbon * Math.log(quantity + 1));
    } finally {
      setIsCalculatingCarbon(false);
    }
  };

  // Auto-calculate carbon savings when key fields change (but not on initial load when editing)
  useEffect(() => {
    // Skip auto-calculation on initial load when editing
    if (isEditing && !originalListing) return;

    const timeoutId = setTimeout(async () => {
      if (formData.title && formData.category_id && formData.condition && formData.quantity) {
        await calculateCarbonSavings();
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.category_id, formData.condition, formData.quantity, formData.dimensions, formData.weight, isEditing, originalListing]);
  const handleMediaFilesChange = useCallback((files: MediaFile[]) => {
    setMediaFiles(files);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({}); // Clear previous errors

    try {
      // Prepare dimensions object with proper validation
      const dimensions = formData.dimensions.length || formData.dimensions.width || formData.dimensions.height ? (() => {
        const length = formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined;
        const width = formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined;
        const height = formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined;

        // Check for invalid numbers
        if (length !== undefined && isNaN(length) || width !== undefined && isNaN(width) || height !== undefined && isNaN(height)) {
          throw new Error('Please enter valid numbers for dimensions');
        }
        return {
          length: length,
          width: width,
          height: height,
          unit: formData.dimensions.unit
        };
      })() : null;

      // Validate price
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        throw new Error('Please enter a valid price');
      }

      // Validate weight
      const weight = formData.weight ? parseFloat(formData.weight) : undefined;
      if (weight !== undefined && isNaN(weight)) {
        throw new Error('Please enter a valid weight');
      }

      // Check weight requirement for environmental certification
      if (formData.environmental_assessment_enabled && !weight) {
        throw new Error('Weight per item is required for environmental certification');
      }

      // Validate at least one image is uploaded
      const hasUploadedImages = mediaFiles.some(f => f.uploaded && f.url);
      if (!hasUploadedImages) {
        throw new Error('At least one photo is required. Please upload at least one image before posting your listing.');
      }

      // Validate quantity
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity < 1) {
        throw new Error('Please enter a valid quantity');
      }
      const validatedData = listingSchema.parse({
        title: toTitleCase(formData.title),
        description: formData.description,
        price: price,
        condition: formData.condition,
        location: formData.location,
        category_id: formData.category_id,
        quantity: quantity,
        carbon_saved: carbonCalculation?.totalCarbon || 0,
        dimensions: dimensions || undefined,
        weight: weight,
        delivery_available: formData.delivery_available,
        pickup_available: formData.pickup_available,
        collection_location: formData.pickup_available && formData.collection_location ? formData.collection_location : undefined,
        collection_notes: formData.pickup_available && formData.collection_notes ? formData.collection_notes : undefined,
        delivery_radius: formData.delivery_available && formData.delivery_radius ? parseInt(formData.delivery_radius) : undefined,
        delivery_cost: formData.delivery_cost ? parseFloat(formData.delivery_cost) : undefined,
        delivery_notes: formData.delivery_available && formData.delivery_notes ? formData.delivery_notes : undefined,
        reason_for_selling: formData.reason_for_selling || undefined,
        manufacturer: formData.manufacturer || undefined,
        environmental_assessment_enabled: formData.environmental_assessment_enabled
      });
      setIsLoading(true);

      // If we don't have a carbon calculation yet, calculate it now
      let finalCarbonSaved = carbonCalculation?.totalCarbon;
      if (!finalCarbonSaved) {
        finalCarbonSaved = await calculateCarbonSavings();
      }

      // Collect uploaded media URLs
      const uploadedImages = mediaFiles.filter(f => f.uploaded && f.url).map(f => f.url!);
      if (isEditing && listingId) {
        // Update existing listing
        const {
          data,
          error
        } = await supabase.from('listings').update({
          ...validatedData,
          images: uploadedImages,
          carbon_saved: finalCarbonSaved || 0,
          environmental_assessment_enabled: formData.environmental_assessment_enabled,
          calculation_confidence: carbonCalculation?.calculationConfidence as 'high' | 'medium' | 'low' | undefined,
          certificate_methodology: formData.environmental_assessment_enabled && carbonCalculation ? {
            carbonFactor: carbonCalculation.carbonPerUnit,
            materialType: carbonCalculation.materialType,
            calculationMethod: carbonCalculation.calculationMethod,
            weight: carbonCalculation.landfillDiverted,
            explanation: carbonCalculation.explanation
          } : undefined,
          public_location: formData.location,
          full_address: formData.fullAddress || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          location_bounds: formData.locationBounds || null,
          updated_at: new Date().toISOString()
        } as any).eq('id', listingId).eq('seller_id', user.id).select().single();
        if (error) throw error;
        toast({
          title: 'Listing updated!',
          description: 'Your listing has been updated successfully.'
        });
        navigate('/dashboard');
      } else {
        // Create new listing
        const {
          data,
          error
        } = await supabase.from('listings').insert({
          ...validatedData,
          seller_id: user.id,
          images: uploadedImages,
          status: 'active',
          carbon_saved: finalCarbonSaved || 0,
          environmental_assessment_enabled: formData.environmental_assessment_enabled,
          calculation_confidence: carbonCalculation?.calculationConfidence as 'high' | 'medium' | 'low' | undefined,
          certificate_methodology: formData.environmental_assessment_enabled && carbonCalculation ? {
            carbonFactor: carbonCalculation.carbonPerUnit,
            materialType: carbonCalculation.materialType,
            calculationMethod: carbonCalculation.calculationMethod,
            weight: carbonCalculation.landfillDiverted,
            explanation: carbonCalculation.explanation
          } : undefined,
          // Privacy-friendly location storage
          public_location: formData.location,
          full_address: formData.fullAddress || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          location_bounds: formData.locationBounds || null
        } as any).select().single();
        if (error) throw error;
        toast({
          title: 'Listing created!',
          description: 'Your item has been listed successfully.'
        });
        navigate('/browse');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map errors to fields for visual feedback
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setFieldErrors(errors);

        // Show first error in toast
        const firstError = error.errors[0];
        const fieldName = firstError.path.join(' > ') || 'Form';
        toast({
          title: `Error: ${fieldName}`,
          description: firstError.message,
          variant: 'destructive'
        });

        // Scroll to first error field
        const firstErrorField = document.querySelector('[data-error="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      } else if (error instanceof Error) {
        toast({
          title: 'Validation error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error creating listing',
          description: 'Please check your form and try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (loading || isLoading || stripeOnboarded === null) {
    return <>
        <SEOHead title={isEditing ? "Edit Listing - Skipped" : "Create Listing - Skipped"} description={isEditing ? "Edit your construction materials listing" : "List your surplus construction materials for sale"} keywords="create listing, sell materials, construction marketplace" />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>;
  }

  // Block listing creation if Stripe onboarding is not complete
  if (!stripeOnboarded && !isEditing) {
    return <>
        <SEOHead title="Payment Setup Required - Skipped" description="Complete payment setup to start selling on Skipped" keywords="payment setup, stripe connect, seller onboarding" />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-warning/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#635BFF]/10 flex items-center justify-center">
                      <StripeLogo className="h-6 w-auto text-[#635BFF]" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Payment Setup Required</CardTitle>
                  <CardDescription className="text-base mt-2">
                    To create listings and receive payments, you need to set up your Stripe Connect account first
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                    <span>Powered by</span>
                    <StripeLogo className="h-3 w-auto text-[#635BFF]" />
                    
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Why is this required?</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Secure payment processing for all transactions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Direct deposits to your bank account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Buyer protection and fraud prevention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Builds trust with potential buyers</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Quick setup:</span> The Stripe Connect onboarding process takes about 5 minutes. You'll need basic business information and bank details.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={async () => {
                    // Pre-open a tab synchronously to avoid popup blocking
                    const preOpened = window.open('', '_blank');
                    try {
                      const {
                        data,
                        error
                      } = await supabase.functions.invoke('create-connect-account');
                      if (error) throw error;
                      if (data?.url) {
                        if (preOpened) {
                          preOpened.location.href = data.url;
                        } else {
                          // Fallback if browser blocked the pre-opened tab
                          window.location.href = data.url;
                        }
                        toast({
                          title: 'Opening Stripe setup',
                          description: 'Complete the setup to start receiving payments'
                        });
                      } else {
                        preOpened?.close();
                        toast({
                          title: 'Error',
                          description: 'No setup link returned. Please try again.',
                          variant: 'destructive'
                        });
                      }
                    } catch (error: any) {
                      preOpened?.close();
                      toast({
                        title: 'Error',
                        description: 'Failed to initiate payment setup. Please try again.',
                        variant: 'destructive'
                      });
                    }
                  }} className="flex-1" size="lg">
                      Set Up Payments
                    </Button>
                    <Button onClick={() => navigate('/browse')} variant="outline" className="flex-1" size="lg">
                      Browse Listings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>;
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": isEditing ? "Edit Listing - Construction Materials" : "Create New Listing - Construction Materials",
    "description": isEditing ? "Edit your construction material listing on Skipped marketplace" : "List your surplus construction materials for sale on Skipped marketplace",
    "url": isEditing ? `https://skipped.com/listing/${listingId}/edit` : "https://skipped.com/sell"
  };
  return <>
      <SEOHead title={isEditing ? "Edit Listing - Construction Materials | Skipped" : "Sell Construction Materials - Create Listing | Skipped"} description={isEditing ? "Edit your construction material listing on Skipped marketplace. Update photos, pricing, and delivery options." : "List your surplus construction materials for sale on Skipped. Upload photos & videos, set delivery options, and reach thousands of buyers across the UK."} keywords={isEditing ? "edit listing, update construction materials, modify listing" : "sell construction materials, list building materials, upload construction photos, surplus materials marketplace, sell timber, sell bricks"} structuredData={structuredData} />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {isEditing ? 'Edit Listing' : 'Create New Listing'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Update your construction material listing details' : 'List your surplus construction materials and help others while earning money'}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Media Upload */}
              <Card className="p-4 md:p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Photos & Videos</CardTitle>
                  <CardDescription>
                    Add high-quality images and videos to showcase your materials. The first image will be your main photo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <MediaUpload 
                    key={isEditing ? listingId : 'new-listing'}
                    onFilesChange={handleMediaFilesChange} 
                    initialFiles={mediaFiles}
                    maxImages={8} 
                    maxVideos={2} 
                    maxImageSize={10} 
                    maxVideoSize={50} 
                  />
                </CardContent>
              </Card>

              {/* Basic Details */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} placeholder="e.g., Reclaimed Oak Beams - Grade A Quality" required disabled={isLoading} data-error={!!fieldErrors.title} className={fieldErrors.title ? 'border-destructive' : ''} />
                    {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={value => handleInputChange('category_id', value)} disabled={isLoading}>
                        <SelectTrigger data-error={!!fieldErrors.category_id} className={fieldErrors.category_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                      {fieldErrors.category_id && <p className="text-sm text-destructive">{fieldErrors.category_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={value => handleInputChange('condition', value)} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New (unopened/unused)</SelectItem>
                          <SelectItem value="like_new">Like New (minimal use, excellent condition)</SelectItem>
                          <SelectItem value="excellent">Excellent (lightly used, very good condition)</SelectItem>
                          <SelectItem value="good">Good (used with normal wear)</SelectItem>
                          <SelectItem value="fair">Fair (used with visible wear but functional)</SelectItem>
                          <SelectItem value="salvage">Salvage (heavily used, suitable for repurposing)</SelectItem>
                          <SelectItem value="parts_repair">Parts/Repair (damaged, may need repair or for parts only)</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.condition && <p className="text-sm text-destructive">{fieldErrors.condition}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason_for_selling">Reason for Selling (optional)</Label>
                    <Select value={formData.reason_for_selling} onValueChange={value => handleInputChange('reason_for_selling', value)} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surplus">Surplus (excess materials from project)</SelectItem>
                        <SelectItem value="incorrect_order">Incorrect Order (wrong item ordered)</SelectItem>
                        <SelectItem value="saving_from_skip">Saving from Skip (rescued from waste)</SelectItem>
                        <SelectItem value="no_longer_needed">No Longer Needed (project cancelled/changed)</SelectItem>
                        <SelectItem value="downsizing">Downsizing (clearing space)</SelectItem>
                        <SelectItem value="end_of_project">End of Project (leftover materials)</SelectItem>
                        <SelectItem value="upgrading">Upgrading (replacing with better materials)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer (optional)</Label>
                    <Input id="manufacturer" type="text" value={formData.manufacturer} onChange={e => handleInputChange('manufacturer', e.target.value)} placeholder="e.g. Hanson, Ensign, DeWalt, Makita..." disabled={isLoading} maxLength={100} />
                    <p className="text-xs text-muted-foreground">
                      Add the manufacturer/brand name to help buyers find your item
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe the item's condition, history, dimensions, and any other relevant details..." rows={4} required disabled={isLoading} data-error={!!fieldErrors.description} className={fieldErrors.description ? 'border-destructive' : ''} />
                    {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
                    <p className="text-sm text-muted-foreground">
                      {formData.description.length}/1000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dimensions (optional)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <Input type="number" step="0.1" min="0" placeholder="Length" value={formData.dimensions.length} onChange={e => handleInputChange('dimensions.length', e.target.value)} disabled={isLoading} />
                        <Input type="number" step="0.1" min="0" placeholder="Width" value={formData.dimensions.width} onChange={e => handleInputChange('dimensions.width', e.target.value)} disabled={isLoading} />
                        <Input type="number" step="0.1" min="0" placeholder="Height" value={formData.dimensions.height} onChange={e => handleInputChange('dimensions.height', e.target.value)} disabled={isLoading} />
                        <Select value={formData.dimensions.unit} onValueChange={value => handleInputChange('dimensions.unit', value)} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mm">mm</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="ft">ft</SelectItem>
                            <SelectItem value="in">in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight per item (kg) {formData.environmental_assessment_enabled && <span className="text-destructive">*</span>}</Label>
                      <Input id="weight" type="number" step="0.1" min="0" value={formData.weight} onChange={e => handleInputChange('weight', e.target.value)} placeholder="e.g. 25.5" disabled={isLoading} required={formData.environmental_assessment_enabled} />
                      {formData.weight && formData.quantity && <p className="text-xs text-muted-foreground">
                          Total weight: <span className="font-medium">{(parseFloat(formData.weight) * parseInt(formData.quantity)).toFixed(1)} kg</span> ({formData.quantity} items × {parseFloat(formData.weight).toFixed(1)} kg each)
                        </p>}
                      {formData.environmental_assessment_enabled && !formData.weight && <p className="text-xs text-amber-600 dark:text-amber-400">
                          Required for environmental certification
                        </p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="flex items-center gap-2">Quantity *</Label>
                      <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={e => handleInputChange('quantity', e.target.value)} placeholder="e.g. 12 beams, 1000 bricks" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                      <LocationAutocomplete id="location" label="Location" value={formData.location} onChange={locationData => {
                      handleInputChange('location', locationData.publicLocation);
                      // Store additional location data if needed
                      setFormData(prev => ({
                        ...prev,
                        fullAddress: locationData.fullAddress,
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        locationBounds: locationData.bounds
                      }));
                    }} placeholder="Enter postcode or town/city..." required disabled={isLoading} />
                    <p className="text-xs text-muted-foreground">
                      🔒 Only your town/city area is shown publicly, not your full address
                    </p>
                    </div>
                  </div>

                  {/* Carbon Impact Display */}
                  {(carbonCalculation || isCalculatingCarbon) && <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isCalculatingCarbon ? <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Calculating carbon impact...
                                </span>
                              </div> : carbonCalculation ? <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Landfill Diverted</p>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                      {carbonCalculation.landfillDiverted?.toFixed(0) || 0} kg
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Carbon Saved</p>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                      {carbonCalculation.totalCarbon.toLocaleString()} kg CO₂
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400 pt-2 border-t border-green-200 dark:border-green-800">
                                  {carbonCalculation.explanation}
                                </p>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  Material: {carbonCalculation.materialType.replace(/_/g, ' ')} • 
                                  Method: {carbonCalculation.calculationMethod.replace(/_/g, ' ')}
                                </div>
                              </div> : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>}

                  {/* Environmental Impact Assessment Opt-In */}
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Environmental Impact Certificate</CardTitle>
                        </div>
                        <Switch checked={formData.environmental_assessment_enabled} onCheckedChange={checked => handleInputChange('environmental_assessment_enabled', checked)} disabled={isLoading} />
                      </div>
                      <CardDescription>
                        Generate a verified environmental impact certificate after sale (optional)
                      </CardDescription>
                    </CardHeader>
                    {formData.environmental_assessment_enabled && <CardContent className="space-y-4">
                        <div className="rounded-lg bg-background p-4 space-y-3 border">
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <p className="text-sm">Receive verified carbon savings certificate after sale</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <p className="text-sm">Perfect for businesses tracking sustainability goals</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <p className="text-sm">Contributes to BREEAM, ESG reporting, CSR initiatives</p>
                          </div>
                          <div className="flex items-start gap-2 pt-2 border-t">
                            <span className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</span>
                            <p className="text-sm font-medium">Accurate weight required for certification</p>
                          </div>
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            Calculations based on ICE Database (University of Bath)
                          </p>
                        </div>

                        {carbonCalculation && <div className="rounded-lg bg-background p-4 border space-y-2">
                            <h4 className="font-semibold text-sm">Estimated Environmental Impact:</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Landfill Diverted</p>
                                <p className="text-lg font-bold text-green-600">{carbonCalculation.landfillDiverted?.toFixed(1) || 0} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                                <p className="text-lg font-bold text-green-600">{carbonCalculation.totalCarbon} kg</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2">
                              Confidence: <span className="font-medium capitalize">{carbonCalculation.calculationConfidence || 'medium'}</span>
                              {' • '}
                              {carbonCalculation.calculationMethod === 'provided_weight' ? 'Based on provided weight ✓' : 'Estimated from dimensions ~'}
                            </p>
                          </div>}

                        {!formData.weight && <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              <strong>Note:</strong> For high-confidence certification, please provide the weight above. 
                              Without weight, we'll estimate from dimensions (medium confidence).
                            </p>
                          </div>}
                      </CardContent>}
                  </Card>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <Label>Free Item</Label>
                      <p className="text-sm text-muted-foreground">Help others while clearing space - offer this item for free</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        💡 Your item may have some value to another user. Don"t skip it, put it up for free!
                      </p>
                    </div>
                    <Switch checked={formData.price === '0'} onCheckedChange={checked => handleInputChange('price', checked ? '0' : '')} disabled={isLoading} />
                  </div>

                  {formData.price !== '0' && <div className="space-y-2">
                      <Label htmlFor="price">Price (£) *</Label>
                      <Input id="price" type="number" step="0.01" min="0.01" value={formData.price} onChange={e => handleInputChange('price', e.target.value)} placeholder="0.00" required disabled={isLoading} />
                      <p className="text-sm text-muted-foreground">This is the price buyers will pay. You'll receive the full amount including any delivery charges below.</p>
                    </div>}

                  {formData.price === '0' && <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">🌱</span>
                        Great choice! Free items help reduce waste and support the community.
                      </p>
                    </div>}
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Collection & Delivery</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-6">
                  {/* Collection Options */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <Label>Collection Available</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Allow buyers to collect the item from your location</p>
                    </div>
                    <Switch checked={formData.pickup_available} onCheckedChange={checked => handleInputChange('pickup_available', checked)} disabled={isLoading} />
                  </div>

                  {formData.pickup_available && <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="collection-location">Collection Location</Label>
                        <Select value={formData.collection_location} onValueChange={value => handleInputChange('collection_location', value)} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Driveway">Driveway</SelectItem>
                            <SelectItem value="Rear Garden">Rear Garden</SelectItem>
                            <SelectItem value="Construction Site">Construction Site</SelectItem>
                            <SelectItem value="Kerbside">Kerbside</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collection-notes">Collection Notes (Optional)</Label>
                        <Textarea id="collection-notes" value={formData.collection_notes} onChange={e => handleInputChange('collection_notes', e.target.value)} placeholder="e.g. Heavy item, labour needed to collect, collecting from upper floor..." disabled={isLoading} rows={2} />
                        <p className="text-sm text-muted-foreground">
                          Add any special requirements or important information for collection
                        </p>
                      </div>
                    </div>}

                  {/* Delivery */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <Label>Delivery Available</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">You can deliver the item to buyers within a set radius</p>
                    </div>
                    <Switch checked={formData.delivery_available} onCheckedChange={checked => handleInputChange('delivery_available', checked)} disabled={isLoading} />
                  </div>

                  {formData.delivery_available && <div className="ml-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Delivery Method</Label>
                          <Select value={formData.delivery_radius} onValueChange={value => handleInputChange('delivery_radius', value)} disabled={isLoading}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Via courier/post</SelectItem>
                              <SelectItem value="5">5 miles</SelectItem>
                              <SelectItem value="10">10 miles</SelectItem>
                              <SelectItem value="25">25 miles</SelectItem>
                              <SelectItem value="50">50 miles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Delivery Cost (£)</Label>
                          <Input type="number" step="0.01" min="0" value={formData.delivery_cost} onChange={e => handleInputChange('delivery_cost', e.target.value)} placeholder="0.00" disabled={isLoading} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
                        <Textarea id="delivery-notes" value={formData.delivery_notes} onChange={e => handleInputChange('delivery_notes', e.target.value)} placeholder="e.g. I can deliver personally on weekends, or can arrange courier..." disabled={isLoading} rows={2} data-error={!!fieldErrors.delivery_notes} className={fieldErrors.delivery_notes ? 'border-destructive' : ''} />
                        {fieldErrors.delivery_notes && <p className="text-sm text-destructive">{fieldErrors.delivery_notes}</p>}
                        <p className="text-sm text-muted-foreground">
                          Add any special delivery arrangements or options you can offer
                        </p>
                      </div>
                    </div>}
                </CardContent>
              </Card>

              {/* Environmental Impact */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Environmental Impact</CardTitle>
                  <CardDescription>
                    Auto-calculated based on your listing details
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  {isCalculatingCarbon ? <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <p className="text-sm">Calculating environmental impact...</p>
                      </div>
                    </div> : carbonCalculation ? <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Landfill Diverted</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {carbonCalculation.landfillDiverted?.toFixed(0) || 0} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">CO₂ Saved</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {carbonCalculation.totalCarbon} kg
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 pt-2 border-t border-green-200 dark:border-green-800">
                        {carbonCalculation.explanation}
                      </p>
                    </div> : <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Leaf className="h-5 w-5" />
                        <p className="text-sm">Fill in title, category, condition and quantity to see environmental impact</p>
                      </div>
                    </div>}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating listing...' : 'Creating listing...'}
                    </> : isEditing ? 'Update Listing' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </>;
};
export default CreateListing;