import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, MapPin, Truck, Package, Calendar, Save, Leaf } from 'lucide-react';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaUpload from '@/components/MediaUpload';
import CarbonBadge from '@/components/CarbonBadge';

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  price: z.number().positive('Price must be positive').max(999999, 'Price must be less than £1,000,000'),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
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
  delivery_radius: z.number().int().positive().optional(),
  delivery_cost: z.number().nonnegative().optional(),
  allow_offers: z.boolean(),
  minimum_offer_percentage: z.number().int().min(50).max(95).optional(),
});

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
}

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    location: '',
    category_id: '',
    quantity: '1',
    carbon_saved: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'mm'
    },
    weight: '',
    delivery_available: false,
    pickup_available: true,
    delivery_radius: '10',
    delivery_cost: '',
    allow_offers: true,
    minimum_offer_percentage: '80',
  });

  const [carbonCalculation, setCarbonCalculation] = useState<{
    totalCarbon: number;
    carbonPerUnit: number;
    materialType: string;
    calculationMethod: string;
    explanation: string;
  } | null>(null);
  const [isCalculatingCarbon, setIsCalculatingCarbon] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

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
      setFormData(prev => ({ ...prev, [field]: value }));
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
        dimensions: formData.dimensions.length || formData.dimensions.width || formData.dimensions.height 
          ? {
              length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
              width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
              height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
              unit: formData.dimensions.unit
            }
          : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        title: formData.title,
        description: formData.description
      };

      const { data, error } = await supabase.functions.invoke('calculate-carbon', {
        body: requestData
      });

      if (error) {
        console.error('Carbon calculation error:', error);
        throw error;
      }

      if (data && data.success) {
        setCarbonCalculation({
          totalCarbon: data.totalCarbon,
          carbonPerUnit: data.carbonPerUnit,
          materialType: data.materialType,
          calculationMethod: data.calculationMethod,
          explanation: data.explanation
        });
        return data.totalCarbon;
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to calculate carbon:', error);
      toast({
        title: 'Carbon calculation failed',
        description: 'Using estimated carbon savings. Please check your listing details.',
        variant: 'destructive',
      });
      
      // Fallback to simple calculation
      const category = categories.find(c => c.id === formData.category_id);
      const baseCarbon = category?.name.toLowerCase().includes('timber') ? 500 : 
                        category?.name.toLowerCase().includes('brick') ? 200 : 
                        category?.name.toLowerCase().includes('steel') ? 800 : 300;
      const quantity = parseInt(formData.quantity) || 1;
      return Math.round(baseCarbon * Math.log(quantity + 1));
    } finally {
      setIsCalculatingCarbon(false);
    }
  };

  // Auto-calculate carbon savings when key fields change
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formData.title && formData.category_id && formData.condition && formData.quantity) {
        await calculateCarbonSavings();
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.category_id, formData.condition, formData.quantity, formData.dimensions, formData.weight]);

  const handleMediaFilesChange = useCallback((files: MediaFile[]) => {
    setMediaFiles(files);
  }, []);

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a listing.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      // Prepare dimensions object
      const dimensions = formData.dimensions.length || formData.dimensions.width || formData.dimensions.height 
        ? {
            length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
            width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
            height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
            unit: formData.dimensions.unit
          }
        : null;

      const validatedData = listingSchema.parse({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        location: formData.location,
        category_id: formData.category_id,
        quantity: parseInt(formData.quantity),
        carbon_saved: carbonCalculation?.totalCarbon || 0,
        dimensions,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        delivery_available: formData.delivery_available,
        pickup_available: formData.pickup_available,
        delivery_radius: formData.delivery_available && formData.delivery_radius ? parseInt(formData.delivery_radius) : undefined,
        delivery_cost: formData.delivery_cost ? parseFloat(formData.delivery_cost) : undefined,
        allow_offers: formData.allow_offers,
        minimum_offer_percentage: formData.allow_offers && formData.minimum_offer_percentage ? parseInt(formData.minimum_offer_percentage) : undefined,
      });

      setIsLoading(true);
      setIsDraft(saveAsDraft);

      // If we don't have a carbon calculation yet, calculate it now
      let finalCarbonSaved = carbonCalculation?.totalCarbon;
      if (!finalCarbonSaved) {
        finalCarbonSaved = await calculateCarbonSavings();
      }

      // Collect uploaded media URLs
      const uploadedImages = mediaFiles
        .filter(f => f.uploaded && f.url)
        .map(f => f.url!);

      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...validatedData,
          seller_id: user.id,
          images: uploadedImages,
          status: saveAsDraft ? 'draft' : 'active',
          carbon_saved: finalCarbonSaved || 0,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: saveAsDraft ? 'Draft saved!' : 'Listing created!',
        description: saveAsDraft 
          ? 'Your listing has been saved as a draft.' 
          : 'Your item has been listed successfully.',
      });

      navigate('/browse');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error creating listing',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsDraft(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Create New Listing - Construction Materials",
    "description": "List your surplus construction materials for sale on Skipped marketplace",
    "url": "https://skipped.com/sell"
  };

  return (
    <>
      <SEOHead
        title="Sell Construction Materials - Create Listing | Skipped"
        description="List your surplus construction materials for sale on Skipped. Upload photos & videos, set delivery options, and reach thousands of buyers across UK & Ireland."
        keywords="sell construction materials, list building materials, upload construction photos, surplus materials marketplace, sell timber, sell bricks"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Create New Listing</h1>
              <p className="text-muted-foreground">List your surplus construction materials and help others while earning money</p>
            </header>

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
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
                    onFilesChange={handleMediaFilesChange}
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
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Reclaimed Oak Beams - Grade A Quality"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => handleInputChange('category_id', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select 
                        value={formData.condition} 
                        onValueChange={(value) => handleInputChange('condition', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the item's condition, history, dimensions, and any other relevant details..."
                      rows={4}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dimensions (optional)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Length"
                          value={formData.dimensions.length}
                          onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder="Width"
                          value={formData.dimensions.width}
                          onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder="Height"
                          value={formData.dimensions.height}
                          onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                          disabled={isLoading}
                        />
                        <Select 
                          value={formData.dimensions.unit} 
                          onValueChange={(value) => handleInputChange('dimensions.unit', value)}
                          disabled={isLoading}
                        >
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
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="0.0"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="e.g. 12 beams, 1000 bricks"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., London, UK"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Carbon Impact Display */}
                  {(carbonCalculation || isCalculatingCarbon) && (
                    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isCalculatingCarbon ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Calculating carbon impact...
                                </span>
                              </div>
                            ) : carbonCalculation ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Estimated Carbon Saved
                                  </span>
                                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                                    {carbonCalculation.totalCarbon.toLocaleString()} kg CO₂
                                  </span>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {carbonCalculation.explanation}
                                </p>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  Material: {carbonCalculation.materialType.replace(/_/g, ' ')} • 
                                  Method: {carbonCalculation.calculationMethod.replace(/_/g, ' ')}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        💡 Your item may have some value to another user. Don"t skip it, put it up for free!
                      </p>
                    </div>
                    <Switch
                      checked={formData.price === '0'}
                      onCheckedChange={(checked) => handleInputChange('price', checked ? '0' : '')}
                      disabled={isLoading}
                    />
                  </div>

                  {formData.price !== '0' && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (£) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        required
                        disabled={isLoading}
                      />
                      <p className="text-sm text-muted-foreground">
                        This is the price buyers will pay. You'll receive the full amount after our protection period.
                      </p>
                    </div>
                  )}

                  {formData.price === '0' && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">🌱</span>
                        Great choice! Free items help reduce waste and support the community.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Allow Offers</Label>
                      <p className="text-sm text-muted-foreground">Let buyers make offers below your asking price</p>
                    </div>
                    <Switch
                      checked={formData.allow_offers}
                      onCheckedChange={(checked) => handleInputChange('allow_offers', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  {formData.allow_offers && (
                    <div className="space-y-2">
                      <Label>Minimum Offer Percentage</Label>
                      <Select 
                        value={formData.minimum_offer_percentage} 
                        onValueChange={(value) => handleInputChange('minimum_offer_percentage', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60%</SelectItem>
                          <SelectItem value="70">70%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Collection & Delivery</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-6">
                  {/* Pickup */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <Label>Pickup Available</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Buyers can collect the item from your location</p>
                    </div>
                    <Switch
                      checked={formData.pickup_available}
                      onCheckedChange={(checked) => handleInputChange('pickup_available', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Delivery */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <Label>Delivery Available</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">You can deliver the item to buyers within a set radius</p>
                    </div>
                    <Switch
                      checked={formData.delivery_available}
                      onCheckedChange={(checked) => handleInputChange('delivery_available', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  {formData.delivery_available && (
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delivery Radius (miles)</Label>
                        <Select 
                          value={formData.delivery_radius} 
                          onValueChange={(value) => handleInputChange('delivery_radius', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 miles</SelectItem>
                            <SelectItem value="10">10 miles</SelectItem>
                            <SelectItem value="25">25 miles</SelectItem>
                            <SelectItem value="50">50 miles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Cost (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.delivery_cost}
                          onChange={(e) => handleInputChange('delivery_cost', e.target.value)}
                          placeholder="0.00"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environmental Impact */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Environmental Impact</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="carbon_saved">Carbon Saved (kg CO₂)</Label>
                    <Input
                      id="carbon_saved"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.carbon_saved}
                      onChange={(e) => handleInputChange('carbon_saved', e.target.value)}
                      placeholder={carbonCalculation?.totalCarbon?.toString() || "0"}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave empty to auto-calculate based on category and quantity
                    </p>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <CarbonBadge 
                      carbonSaved={carbonCalculation?.totalCarbon || (formData.carbon_saved ? parseFloat(formData.carbon_saved) : 0)} 
                      size="lg" 
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {carbonCalculation ? 'Calculated environmental impact' : 'Estimated environmental impact'} of selling this item instead of disposing of it
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  {isDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving draft...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
                <Button 
                  type="submit" 
                  className="sm:flex-1"
                  disabled={isLoading}
                >
                  {isLoading && !isDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating listing...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CreateListing;