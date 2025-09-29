import { Search, MessageSquare, HandshakeIcon, TrendingDown } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse & Search",
    description: "Find quality construction materials at discounted prices or list your surplus items in minutes"
  },
  {
    icon: MessageSquare,
    title: "Connect & Negotiate",
    description: "Message sellers directly, ask questions, and make offers on items you're interested in"
  },
  {
    icon: HandshakeIcon,
    title: "Complete the Deal",
    description: "Arrange collection or delivery with buyer protection ensuring a safe transaction"
  },
  {
    icon: TrendingDown,
    title: "Save & Track Impact",
    description: "Save money whilst reducing landfill waste and track your environmental carbon savings"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="mb-4 relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
