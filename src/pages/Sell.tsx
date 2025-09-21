import { useState } from "react";
import { Upload, X, Plus, MapPin, Truck, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarbonBadge from "@/components/CarbonBadge";

const Sell = () => {
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subCategory: "",
    condition: "",
    description: "",
    dimensions: "",
    quantity: "",
    price: "",
    allowOffers: true,
    minOfferPercentage: "80",
    pickupAllowed: true,
    dropoffAvailable: false,
    dropoffRadius: "10",
    dropoffFee: "",
    postageAvailable: false,
    postageCost: "",
    pickupRestrictions: ""
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Simulate image upload - in real app would upload to server
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages].slice(0, 8)); // Max 8 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const calculateCarbonSavings = () => {
    // Simple calculation based on category and quantity
    const baseCarbon = formData.category === "timber" ? 500 : 
                      formData.category === "bricks" ? 200 : 
                      formData.category === "steel" ? 800 : 300;
    const quantity = parseInt(formData.quantity) || 1;
    return Math.round(baseCarbon * Math.log(quantity + 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Listing submitted:", { ...formData, images, carbonSaved: calculateCarbonSavings() });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sell Construction Materials",
    "description": "List your surplus construction materials for sale on Skipped marketplace",
    "url": "https://skipped.com/sell"
  };

  return (
    <>
      <SEOHead
        title="Sell Your Construction Materials - Skipped"
        description="List your surplus construction materials for sale on Skipped. Reach thousands of buyers across UK & Ireland with complete seller protection and fair fees."
        keywords="sell construction materials, list building materials, surplus materials marketplace, sell timber, sell bricks, construction equipment for sale"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Sell Your Materials</h1>
              <p className="text-muted-foreground">List your surplus construction materials and help others while earning money</p>
            </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images */}
            <Card className="p-4 md:p-6 bg-card border-border">
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">Photos</h2>
              <p className="text-muted-foreground mb-4 text-sm md:text-base">Add at least 2 photos. The first photo will be your main image.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-smooth"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                
                {images.length < 8 && (
                  <label className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-smooth">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </Card>

            {/* Basic Details */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Item Details</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Title *</label>
                  <Input
                    placeholder="e.g. Reclaimed Oak Beams - Grade A Quality"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category *</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timber">Timber & Wood</SelectItem>
                        <SelectItem value="bricks">Bricks & Blocks</SelectItem>
                        <SelectItem value="insulation">Insulation</SelectItem>
                        <SelectItem value="steel">Steel & Metal</SelectItem>
                        <SelectItem value="me">M&E Equipment</SelectItem>
                        <SelectItem value="tools">Tools & Plant</SelectItem>
                        <SelectItem value="fixtures">Fixtures</SelectItem>
                        <SelectItem value="finishes">Finishes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Condition *</label>
                    <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
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
                  <label className="text-sm font-medium text-foreground">Description *</label>
                  <Textarea
                    placeholder="Describe the item, its history, any defects, and why you're selling..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Dimensions</label>
                    <Input
                      placeholder="e.g. 2.4m x 200mm x 50mm"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange("dimensions", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quantity *</label>
                    <Input
                      placeholder="e.g. 12 beams, 1000 bricks"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Pricing</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Price (£) *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the price buyers will pay. You'll receive the full amount after our protection period.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Allow Offers</label>
                    <p className="text-sm text-muted-foreground">Let buyers make offers below your asking price</p>
                  </div>
                  <Switch
                    checked={formData.allowOffers}
                    onCheckedChange={(checked) => handleInputChange("allowOffers", checked)}
                  />
                </div>

                {formData.allowOffers && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Minimum Offer (%)</label>
                    <Select value={formData.minOfferPercentage} onValueChange={(value) => handleInputChange("minOfferPercentage", value)}>
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
              </div>
            </Card>

            {/* Delivery Options */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Collection & Delivery</h2>
              
              <div className="space-y-6">
                {/* Pickup */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <label className="text-sm font-medium text-foreground">Pickup Available</label>
                    </div>
                    <p className="text-sm text-muted-foreground">Buyers can collect the item from your location</p>
                  </div>
                  <Switch
                    checked={formData.pickupAllowed}
                    onCheckedChange={(checked) => handleInputChange("pickupAllowed", checked)}
                  />
                </div>

                {formData.pickupAllowed && (
                  <div className="space-y-2 ml-6">
                    <label className="text-sm font-medium text-foreground">Pickup Restrictions</label>
                    <Textarea
                      placeholder="e.g. Weekends only, No parking available, Crane required"
                      value={formData.pickupRestrictions}
                      onChange={(e) => handleInputChange("pickupRestrictions", e.target.value)}
                      rows={2}
                    />
                  </div>
                )}

                {/* Drop-off */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <label className="text-sm font-medium text-foreground">Drop-off Available</label>
                    </div>
                    <p className="text-sm text-muted-foreground">You can deliver the item to buyers within a set radius</p>
                  </div>
                  <Switch
                    checked={formData.dropoffAvailable}
                    onCheckedChange={(checked) => handleInputChange("dropoffAvailable", checked)}
                  />
                </div>

                {formData.dropoffAvailable && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Delivery Radius (miles)</label>
                      <Select value={formData.dropoffRadius} onValueChange={(value) => handleInputChange("dropoffRadius", value)}>
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
                      <label className="text-sm font-medium text-foreground">Delivery Fee (£)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.dropoffFee}
                        onChange={(e) => handleInputChange("dropoffFee", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Postage */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <label className="text-sm font-medium text-foreground">Postage Available</label>
                    </div>
                    <p className="text-sm text-muted-foreground">Ship the item via courier service</p>
                  </div>
                  <Switch
                    checked={formData.postageAvailable}
                    onCheckedChange={(checked) => handleInputChange("postageAvailable", checked)}
                  />
                </div>

                {formData.postageAvailable && (
                  <div className="space-y-2 ml-6">
                    <label className="text-sm font-medium text-foreground">Postage Cost (£)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.postageCost}
                      onChange={(e) => handleInputChange("postageCost", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Environmental Impact */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Environmental Impact</h2>
              
              <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Estimated Carbon Savings</span>
                    <CarbonBadge carbonSaved={calculateCarbonSavings()} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By selling this item instead of sending it to landfill, you're helping save approximately{" "}
                    <span className="font-medium text-accent">{calculateCarbonSavings()}kg of CO₂</span> emissions.
                  </p>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Calendar className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              
              <Button type="submit" variant="marketplace" size="lg" className="w-full sm:w-auto">
                Publish Listing
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

export default Sell;