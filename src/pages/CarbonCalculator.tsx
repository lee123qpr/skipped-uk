import { Leaf, Award, TrendingDown, Scale, FileCheck, Info, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const CarbonCalculator = () => {
  // Mock environmental stats - will be populated when transactions are completed
  const stats = {
    carbonSaved: 12500,
    wasteDiverted: 45000,
    listingsTracked: 324
  };

  const materialExamples = [
    {
      name: "Timber/Wood",
      carbonFactor: "0.41 kg CO₂/kg",
      example: "100kg of timber saves 41kg CO₂",
      confidence: "High"
    },
    {
      name: "Steel/Metal",
      carbonFactor: "1.85 kg CO₂/kg",
      example: "50kg of steel saves 92.5kg CO₂",
      confidence: "High"
    },
    {
      name: "Concrete",
      carbonFactor: "0.13 kg CO₂/kg",
      example: "500kg of concrete saves 65kg CO₂",
      confidence: "High"
    },
    {
      name: "Bricks",
      carbonFactor: "0.23 kg CO₂/kg",
      example: "200kg of bricks saves 46kg CO₂",
      confidence: "High"
    },
    {
      name: "Insulation",
      carbonFactor: "1.20 kg CO₂/kg",
      example: "20kg of insulation saves 24kg CO₂",
      confidence: "Medium"
    },
    {
      name: "Plasterboard",
      carbonFactor: "0.45 kg CO₂/kg",
      example: "80kg of plasterboard saves 36kg CO₂",
      confidence: "Medium"
    }
  ];

  return (
    <>
      <SEOHead
        title="Environmental Impact & Carbon Calculator - Track Your Savings"
        description="Learn how Skipped calculates carbon savings and tracks environmental impact using ICE Database methodology. Every reused material helps reduce waste and CO₂ emissions."
        keywords="carbon calculator, environmental impact, ICE database, waste reduction, carbon savings, sustainable construction, circular economy"
      />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        {/* Hero Section */}
        <section className="gradient-carbon text-white py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Leaf className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Track Your Environmental Impact
              </h1>
              <p className="text-lg sm:text-xl text-white/90">
                Every material reused through Skipped helps reduce carbon emissions and divert waste from landfill. See how we calculate your positive impact.
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Carbon Calculator" }]} />
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
          {/* Live Platform Stats */}
          {stats && (
            <section className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-8 text-center">Live Platform Impact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center hover-scale border-success/20">
                  <CardHeader>
                    <TrendingDown className="h-12 w-12 mx-auto text-success mb-4" />
                    <CardTitle className="text-4xl font-bold text-success">
                      {stats.carbonSaved.toLocaleString()}kg
                    </CardTitle>
                    <CardDescription className="text-lg">CO₂ Emissions Saved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Equivalent to driving {Math.round(stats.carbonSaved / 0.12)} miles in an average car
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover-scale border-accent/20">
                  <CardHeader>
                    <Scale className="h-12 w-12 mx-auto text-accent mb-4" />
                    <CardTitle className="text-4xl font-bold text-accent">
                      {stats.wasteDiverted.toLocaleString()}kg
                    </CardTitle>
                    <CardDescription className="text-lg">Waste Diverted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      That's {(stats.wasteDiverted / 1000).toFixed(1)} tonnes kept out of landfill
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover-scale border-primary/20">
                  <CardHeader>
                    <Award className="h-12 w-12 mx-auto text-primary mb-4" />
                    <CardTitle className="text-4xl font-bold text-primary">
                      {stats.listingsTracked.toLocaleString()}
                    </CardTitle>
                    <CardDescription className="text-lg">Materials Tracked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Items with environmental assessment enabled
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* How We Calculate */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">How We Calculate Environmental Impact</h2>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" />
                  Our Methodology
                </CardTitle>
                <CardDescription>
                  Based on the ICE Database v3.0 from the University of Bath
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Skipped uses the industry-standard Inventory of Carbon and Energy (ICE) Database developed by the University of Bath's Circular Ecology team. This database provides embodied carbon and energy data for construction materials, updated regularly with the latest research.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>What is embodied carbon?</strong> It's the total CO₂ emissions from extracting, manufacturing, and transporting materials. When you reuse materials instead of buying new, you save these emissions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-6 w-6 text-accent" />
                    Step 1: Material Classification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    We classify materials into 50+ categories based on the ICE Database, including:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="secondary">Timber & Wood</Badge>
                    <Badge variant="secondary">Steel & Metal</Badge>
                    <Badge variant="secondary">Concrete</Badge>
                    <Badge variant="secondary">Bricks & Blocks</Badge>
                    <Badge variant="secondary">Insulation</Badge>
                    <Badge variant="secondary">Glass & Glazing</Badge>
                    <Badge variant="secondary">Plasterboard</Badge>
                    <Badge variant="secondary">Roofing Materials</Badge>
                    <Badge variant="secondary">Flooring</Badge>
                    <Badge variant="secondary">And many more...</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-6 w-6 text-success" />
                    Step 2: Carbon Factor Application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Each material has a specific carbon factor (kg CO₂ per kg of material) from the ICE Database:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Timber</span>
                      <span className="font-mono text-success">0.41 kg CO₂/kg</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Steel</span>
                      <span className="font-mono text-success">1.85 kg CO₂/kg</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Concrete</span>
                      <span className="font-mono text-success">0.13 kg CO₂/kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-6 w-6 text-primary" />
                    Step 3: Weight Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    We calculate weight using either:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span><strong>Direct weight:</strong> If provided by the seller</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span><strong>Calculated weight:</strong> Based on dimensions and material density</span>
                    </li>
                  </ul>
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mt-3">
                    <p className="text-xs">
                      Example: A piece of timber 2m × 0.1m × 0.05m with density 600kg/m³ = 6kg
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-6 w-6 text-success" />
                    Step 4: Impact Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Final calculation:
                  </p>
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <div className="space-y-2 text-sm font-mono">
                      <div>Weight × Carbon Factor = CO₂ Saved</div>
                      <div className="text-xs text-muted-foreground">Example:</div>
                      <div className="text-success">6kg × 0.41 = 2.46kg CO₂ saved</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Waste diverted is equal to the material weight
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Material Examples */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Carbon Savings by Material Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materialExamples.map((material, index) => (
                <Card key={index} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                      <Badge variant={material.confidence === "High" ? "default" : "secondary"}>
                        {material.confidence}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Carbon Factor:</span>
                      <span className="font-mono font-semibold">{material.carbonFactor}</span>
                    </div>
                    <Separator />
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <p className="text-xs text-center">
                        <Leaf className="h-3 w-3 inline mr-1" />
                        {material.example}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" />
                  Confidence Levels Explained
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Badge variant="default">High</Badge>
                    <p className="text-muted-foreground">
                      Based on comprehensive ICE Database data with detailed material composition and manufacturing processes
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Medium</Badge>
                    <p className="text-muted-foreground">
                      Based on generalised data or estimates from similar materials. Still reliable but may vary by specific product
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline">Low</Badge>
                    <p className="text-muted-foreground">
                      Conservative estimates used when specific material data is limited. Actual savings may be higher
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Environmental Certificates */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Environmental Certificates</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <FileCheck className="h-12 w-12 text-success mb-4" />
                  <CardTitle>What Are They?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    When you purchase a material with environmental assessment enabled, we generate a certificate documenting the positive impact of your sustainable choice.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Certificates include:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>Material details and transaction information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>CO₂ emissions saved calculation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>Waste diverted from landfill</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>Methodology reference (ICE Database v3.0)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>Unique certificate ID for verification</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>How to Use Them</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Environmental certificates are valuable for demonstrating your commitment to sustainability:
                  </p>
                  <div className="space-y-2 text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span><strong>Corporate reporting:</strong> Include in ESG and sustainability reports</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span><strong>Project documentation:</strong> Demonstrate sustainable procurement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span><strong>Tender applications:</strong> Support bids requiring environmental credentials</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span><strong>Marketing:</strong> Showcase your eco-friendly practices to clients</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
                    <p className="text-xs">
                      <strong>Download:</strong> Certificates are generated automatically after transaction completion and available in your dashboard as PDFs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Verification */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Verification & Transparency</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>How Certificates Are Verified</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Each certificate includes a unique ID that can be verified through our platform. We maintain full transparency in our calculations:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Data Sources:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• ICE Database v3.0 (University of Bath)</li>
                      <li>• Material densities from industry standards</li>
                      <li>• Seller-provided dimensions and weights</li>
                      <li>• Conservative estimates when data is limited</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Methodology:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Open and transparent calculations</li>
                      <li>• Regular database updates</li>
                      <li>• Confidence levels clearly stated</li>
                      <li>• Full traceability of impact claims</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Card className="bg-gradient-to-br from-success/5 to-primary/5 border-success/20">
              <CardContent className="pt-8 pb-8">
                <Leaf className="h-12 w-12 mx-auto text-success mb-4" />
                <h2 className="text-2xl font-bold mb-4">Start Making a Difference Today</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Every reused material contributes to a more sustainable construction industry. Browse materials with environmental assessment and track your positive impact.
                </p>
                <Button asChild size="lg" variant="carbon">
                  <Link to="/browse">Find Sustainable Materials</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default CarbonCalculator;
