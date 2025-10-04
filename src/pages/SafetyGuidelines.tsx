import { Shield, AlertTriangle, Eye, Lock, Users, HardHat, TrendingUp, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SafetyGuidelines = () => {
  const buyerSafety = [
    { title: "Verify Seller Information", description: "Check seller ratings, reviews, and verification badges before making offers" },
    { title: "Inspect Before Paying", description: "Always view items in person when possible, especially for high-value purchases" },
    { title: "Use Platform Payments", description: "Never send money outside of Skipped's secure payment system" },
    { title: "Check Listing Details", description: "Read descriptions carefully and ask questions before committing to purchase" },
    { title: "Document Everything", description: "Take photos and screenshots of listings, items, and all communications" },
    { title: "Report Suspicious Activity", description: "Contact us immediately if something feels wrong or too good to be true" }
  ];

  const sellerSafety = [
    { title: "Accurate Descriptions", description: "Provide honest, detailed descriptions and clear photos of items" },
    { title: "Disclose All Defects", description: "Always mention any damage, wear, or issues with materials" },
    { title: "Secure Transactions", description: "Only accept payments through Skipped's platform - never direct transfers" },
    { title: "Safe Meeting Locations", description: "Arrange collections in safe, public locations during daylight hours when possible" },
    { title: "Verify Buyers", description: "Check buyer profiles and ratings before confirming transactions" },
    { title: "Keep Records", description: "Maintain records of all sales, communications, and deliveries" }
  ];

  const redFlags = [
    "Requests to communicate off-platform via WhatsApp, phone, or email",
    "Offers to pay or requests for payment outside of Skipped",
    "Prices significantly below market value (too good to be true)",
    "Pressure to complete transactions quickly without proper checks",
    "Vague or inconsistent item descriptions",
    "Refusal to provide additional photos or information",
    "New accounts with no reviews or verification",
    "Requests for personal financial information"
  ];

  const physicalSafety = [
    {
      icon: HardHat,
      title: "Heavy Materials Handling",
      description: "Always use appropriate lifting equipment for heavy items. Never attempt to lift materials beyond your capability. Consider hiring professional moving services."
    },
    {
      icon: Eye,
      title: "Personal Protective Equipment",
      description: "Wear appropriate PPE when handling construction materials: gloves, safety glasses, steel-toe boots, and hard hats when necessary."
    },
    {
      icon: Users,
      title: "Collection Arrangements",
      description: "Bring assistance for heavy items. Meet in safe, well-lit locations. Let someone know where you're going and when you'll return."
    },
    {
      icon: AlertTriangle,
      title: "Vehicle Safety",
      description: "Ensure your vehicle can safely carry the materials. Secure loads properly and comply with road safety regulations."
    }
  ];

  return (
    <>
      <SEOHead
        title="Safety Guidelines - Stay Safe on Skipped"
        description="Essential safety tips for buyers and sellers on Skipped. Learn how to spot scams, stay safe during transactions, handle materials safely, and protect yourself."
        keywords="safety guidelines, scam prevention, safe transactions, buyer safety, seller safety, construction materials safety, platform security"
        canonicalUrl="https://skipped.co.uk/safety-guidelines"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main id="main-content" className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <Breadcrumbs items={[{ label: "Safety Guidelines" }]} />
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-12 w-12 text-primary mr-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Safety Guidelines
                </h1>
              </div>
              <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
                Your safety is our priority. Follow these guidelines for secure and successful transactions.
              </p>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Introduction */}
            <Card className="p-6 md:p-8 mb-12 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">Safety First</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Skipped is designed to be a safe marketplace for construction materials, but your vigilance is essential. Follow these guidelines to protect yourself from scams, ensure smooth transactions, and stay physically safe when handling materials.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Remember:</strong> If something feels wrong or too good to be true, trust your instincts and contact our support team immediately.
                  </p>
                </div>
              </div>
            </Card>

            {/* For Buyers */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">For Buyers</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buyerSafety.map((tip, idx) => (
                  <Card key={idx} className="p-6 hover:shadow-lg transition-smooth">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      {tip.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* For Sellers */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">For Sellers</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerSafety.map((tip, idx) => (
                  <Card key={idx} className="p-6 hover:shadow-lg transition-smooth">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      {tip.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Red Flags */}
            <section className="mb-12">
              <Card className="p-6 md:p-8 border-destructive/20 bg-destructive/5">
                <div className="flex items-start gap-4 mb-6">
                  <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Red Flags to Watch Out For</h2>
                    <p className="text-muted-foreground">
                      Be cautious if you encounter any of these warning signs:
                    </p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{flag}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* Physical Safety */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Physical Safety</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {physicalSafety.map((tip, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <tip.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{tip.title}</h3>
                        <p className="text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Account Security */}
            <section className="mb-12">
              <Card className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Lock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Account Security</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong className="text-foreground">Strong Passwords:</strong> Use unique, complex passwords and never share them with anyone.</p>
                      <p><strong className="text-foreground">Enable Verification:</strong> Complete email and phone verification to protect your account.</p>
                      <p><strong className="text-foreground">Monitor Activity:</strong> Regularly check your account for unauthorized activity.</p>
                      <p><strong className="text-foreground">Secure Devices:</strong> Keep your devices and browsers updated with the latest security patches.</p>
                      <p><strong className="text-foreground">Report Issues:</strong> Contact us immediately if you suspect your account has been compromised.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* What We Do */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">How Skipped Protects You</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Secure Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    All payments are processed through Stripe with bank-level encryption
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">24/7 Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Our systems continuously monitor for suspicious activity and fraud
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Dispute Resolution</h3>
                  <p className="text-sm text-muted-foreground">
                    Fair and impartial resolution process with buyer protection
                  </p>
                </Card>
              </div>
            </section>

            {/* CTA */}
            <Card className="p-8 text-center bg-primary/5">
              <h2 className="text-2xl font-bold text-foreground mb-4">Have Safety Concerns?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you encounter suspicious activity, feel unsafe, or have questions about a transaction, contact our support team immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/contact-us">Report an Issue</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/faq">View FAQ</Link>
                </Button>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default SafetyGuidelines;
