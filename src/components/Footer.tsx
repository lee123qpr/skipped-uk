import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import skippedLogo from "@/assets/skipped-logo.jpeg";

const Footer = () => {

  return <footer className="bg-card border-t border-border">
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
              <span className="font-medium">2.4M kg CO₂ saved to date</span>
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
              <li><Link to="/how-it-works" className="hover:text-primary transition-smooth">Help Centre</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-smooth">Contact Us</Link></li>
              <li><Link to="/buyer-protection" className="hover:text-primary transition-smooth">Dispute Resolution</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-smooth">Safety Guidelines</Link></li>
              <li><Link to="/buyer-protection" className="hover:text-primary transition-smooth">Trust & Safety</Link></li>
              <li><Link to="/news-resources" className="hover:text-primary transition-smooth">News & Resources</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get notified about new materials and sustainability tips
            </p>
            <div className="flex space-x-2">
              <Input placeholder="Enter email" className="flex-1 bg-input border-border" />
              <Button variant="default" size="sm">
                Subscribe
              </Button>
            </div>
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
          <p className="text-sm text-muted-foreground">© 2026 Skipped. All rights reserved.</p>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-primary transition-smooth">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-smooth">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition-smooth">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;