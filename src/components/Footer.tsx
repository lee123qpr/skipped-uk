import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <div className="w-6 h-6 bg-primary-foreground rounded transform rotate-45"></div>
              </div>
              <div className="font-semibold text-xl text-foreground">
                Build<span className="text-accent">Reuse</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The UK & Ireland's premier marketplace for sustainable construction materials. 
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
              <li><a href="#" className="hover:text-primary transition-smooth">Browse Materials</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Sell Items</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Buyer Protection</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Delivery Options</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Carbon Calculator</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Help Centre</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Dispute Resolution</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Trust & Safety</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get notified about new materials and sustainability tips
            </p>
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter email" 
                className="flex-1 bg-input border-border"
              />
              <Button variant="default" size="sm">
                Subscribe
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@buildreuse.co.uk</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0800 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>UK & Ireland</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 BuildReuse. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-smooth">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-smooth">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-smooth">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;