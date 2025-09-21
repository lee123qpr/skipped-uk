import { Shield, CreditCard, Truck, CheckCircle, Users, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

const trustFeatures = [
  {
    icon: Shield,
    title: "Buyer Protection",
    description: "Every purchase is protected with our 7-day guarantee and dispute resolution service"
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Safe transactions with funds held until you're completely satisfied with your purchase"
  },
  {
    icon: Truck,
    title: "Flexible Collection",
    description: "Choose pickup, delivery, or postage options that work best for your project needs"
  },
  {
    icon: CheckCircle,
    title: "Verified Sellers",
    description: "All commercial sellers are verified with ID and company checks for your peace of mind"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by construction professionals, for construction professionals across UK & Ireland"
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Detailed condition reports and photos ensure you know exactly what you're buying"
  }
];

const TrustSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Skipped?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've built the safest, most trusted marketplace for construction materials in the UK & Ireland
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustFeatures.map((feature) => (
            <Card key={feature.title} className="p-6 text-center bg-card border-border shadow-soft hover:shadow-medium transition-smooth">
              <div className="inline-flex w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;