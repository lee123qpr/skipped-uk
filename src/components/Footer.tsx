import { useState, useEffect } from "react";
import { Leaf, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import skippedLogo from "@/assets/skipped-logo.jpeg";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [totalCarbonSaved, setTotalCarbonSaved] = useState<number | null>(null);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchCarbonStats = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("listing_id, listings(carbon_saved)")
        .eq("status", "completed");

      if (!error && data) {
        const total = data.reduce((sum, transaction) => {
          const carbonSaved = (transaction.listings as any)?.carbon_saved || 0;
          return sum + Number(carbonSaved);
        }, 0);
        setTotalCarbonSaved(total);
      }
    };

    fetchCarbonStats();
  }, []);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.toLowerCase().trim() });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
        setEmail("");
      }
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <img src={skippedLogo} alt="Skipped - Construction Materials Marketplace" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The UK's premier marketplace for sustainable construction materials. 
              Reducing waste, saving money, protecting our planet.
            </p>
            <div className="flex items-center gap-2 text-sm text-accent">
              <Leaf className="h-4 w-4" />
              <span className="font-medium">
                {totalCarbonSaved !== null 
                  ? `${totalCarbonSaved >= 1000 ? `${(totalCarbonSaved / 1000).toFixed(1)}k` : totalCarbonSaved.toFixed(0)} kg CO₂ saved to date`
                  : "Loading CO₂ stats..."}
              </span>
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Marketplace</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/browse" className="hover:text-primary transition-smooth">Browse Materials</Link></li>
              <li><Link to="/sell" className="hover:text-primary transition-smooth">Sell Items</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-smooth">How It Works</Link></li>
              <li><Link to="/buyer-protection" className="hover:text-primary transition-smooth">Buyer Protection</Link></li>
              <li><Link to="/delivery-options" className="hover:text-primary transition-smooth">Delivery/Collection</Link></li>
              <li><Link to="/carbon-calculator" className="hover:text-primary transition-smooth">Carbon Calculator</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary transition-smooth">FAQ</Link></li>
              <li><Link to="/contact-us" className="hover:text-primary transition-smooth">Contact Us</Link></li>
              <li><Link to="/dispute-resolution" className="hover:text-primary transition-smooth">Dispute Resolution</Link></li>
              <li><Link to="/safety-guidelines" className="hover:text-primary transition-smooth">Safety Guidelines</Link></li>
              <li><Link to="/news-resources" className="hover:text-primary transition-smooth">News & Resources</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get notified about new materials and sustainability tips
            </p>
            <form onSubmit={handleNewsletterSubscribe} className="flex space-x-2">
              <Input 
                type="email"
                placeholder="Enter email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-input border-border" 
                disabled={isSubscribing}
              />
              <Button type="submit" variant="default" size="sm" disabled={isSubscribing}>
                {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
              </Button>
            </form>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@skipped.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0800 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>UK</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© {currentYear} Skipped. All rights reserved.</p>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-primary transition-smooth">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-smooth">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition-smooth">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;