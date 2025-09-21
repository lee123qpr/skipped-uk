import { Search, ArrowRight, Recycle, Shield, Truck } from "lucide-react";
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
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Save Money. <span className="text-primary">Save Waste.</span>
              <br />
              <span className="text-accent">Save the Planet.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The UK & Ireland's marketplace for surplus and second-hand construction materials. 
              Find quality materials at great prices while reducing landfill waste.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-card border border-border rounded-2xl p-2 shadow-medium">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search timber, bricks, steel, insulation..."
                  className="pl-12 pr-4 py-3 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button size="lg" variant="marketplace" className="px-8">
                Search
                <ArrowRight className="h-5 w-5" />
              </Button>
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
            <Button size="xl" variant="marketplace">
              Start Buying
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="xl" variant="outline">
              Sell Your Materials
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;