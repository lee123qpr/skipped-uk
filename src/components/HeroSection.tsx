import { Search, ArrowRight, Recycle, Shield, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-construction.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Construction materials warehouse"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            {/* Large Recycling Symbol */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Recycle className="h-12 w-12 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Save Money. <span className="text-primary">Save Waste.</span>
              <br />
              <span className="text-accent">Save the Planet.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The UK's marketplace for surplus and second-hand construction materials. 
              Find quality materials at great prices while reducing landfill waste.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="flex bg-card border border-border rounded-2xl p-2 shadow-medium">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search timber, bricks, steel, insulation, scaffolding..."
                  className="pl-12 pr-4 py-3 text-base md:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Link to="/browse">
                <Button size="lg" variant="marketplace" className="px-6 md:px-8">
                  Search
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Quick Search Options */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/browse?category=4b282b08-da63-404b-97a8-780a19f62025">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Timber & Wood
                  </Button>
                </Link>
                <Link to="/browse?category=57cbc162-8ec1-4966-94ef-ecaa4c550f73">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Insulation
                  </Button>
                </Link>
                <Link to="/browse?category=bd07a74a-0382-4ca9-8bc2-413dc535bb0b">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Bricks & Blocks
                  </Button>
                </Link>
                <Link to="/browse?category=9f341527-9eb5-49ad-a7c7-1808ac1193d8">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Steel & Metal
                  </Button>
                </Link>
                <Link to="/browse?category=81c7aa08-6925-427f-8f47-2aa2e67fe8cd">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Roofing Materials
                  </Button>
                </Link>
                <Link to="/browse?category=c3bd7b13-f4cc-4b27-a62b-a54b281c1ee8">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Doors & Windows
                  </Button>
                </Link>
                <Link to="/browse?category=0566c7cb-58ae-44cf-a0c3-03f852913a0c">
                  <Button variant="outline" size="sm" className="text-xs hover-scale">
                    Scaffolding
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto pt-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Recycle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">2.4M kg</div>
              <div className="text-muted-foreground">CO₂ Saved</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-muted-foreground">Buyer Protection</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="h-8 w-8 text-warning" />
              </div>
              <div className="text-2xl font-bold text-foreground">Same Day</div>
              <div className="text-muted-foreground">Collection Available</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/browse">
              <Button size="xl" variant="marketplace">
                Start Buying
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/sell">
              <Button size="xl" variant="outline">
                Sell Your Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;