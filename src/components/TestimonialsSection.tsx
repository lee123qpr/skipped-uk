import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "David Thompson",
    role: "Site Manager",
    location: "Manchester",
    content: "Saved over £3,000 on bricks for our extension project. The quality was excellent and delivery was spot on. This platform is a game-changer for construction costs.",
    initials: "DT"
  },
  {
    name: "Sarah Mitchell",
    role: "Property Developer",
    location: "London",
    content: "We've reduced our material waste by 60% and made money selling our surplus. The carbon tracking feature helps us meet our sustainability targets too.",
    initials: "SM"
  },
  {
    name: "James Roberts",
    role: "Builder",
    location: "Birmingham",
    content: "Found insulation materials at half the retail price. The buyer protection gave me confidence, and the seller was professional. Will definitely use again.",
    initials: "JR"
  },
  {
    name: "Emma Clarke",
    role: "Homeowner",
    location: "Leeds",
    content: "Renovating our home on a budget seemed impossible until we found Skipped. Got beautiful reclaimed timber and saved enough to upgrade other areas of the project.",
    initials: "EC"
  },
  {
    name: "Michael O'Brien",
    role: "Contractor",
    location: "Bristol",
    content: "The environmental impact alone makes this worthwhile, but saving money whilst doing good? Brilliant. Easy to use and genuine buyer protection.",
    initials: "MO"
  },
  {
    name: "Lisa Patel",
    role: "Architect",
    location: "Edinburgh",
    content: "I recommend Skipped to all my clients now. It's amazing how much quality material goes to waste. This platform solves that problem whilst saving money.",
    initials: "LP"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of builders, contractors, and homeowners saving money and reducing waste
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                
                <p className="text-muted-foreground mb-6 line-clamp-4">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
