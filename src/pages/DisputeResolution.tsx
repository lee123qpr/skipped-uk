import { Shield, AlertCircle, CheckCircle, Clock, FileText, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DisputeResolution = () => {
  const disputeReasons = [
    { title: "Item Not as Described", description: "The item received doesn't match the listing photos or description" },
    { title: "Item Not Received", description: "The item was never delivered or made available for collection" },
    { title: "Item Damaged", description: "The item arrived damaged beyond what was disclosed in the listing" },
    { title: "Wrong Item", description: "A different item was delivered than what was ordered" },
    { title: "Incomplete Delivery", description: "Only part of the order was delivered" },
    { title: "Safety Concerns", description: "The item poses a safety risk not mentioned in the listing" }
  ];

  const disputeProcess = [
    {
      icon: AlertCircle,
      title: "Raise a Dispute",
      description: "Go to your Dashboard, find the transaction, and click 'Raise Dispute'. Provide detailed information about the issue."
    },
    {
      icon: FileText,
      title: "Provide Evidence",
      description: "Upload clear photos, screenshots of the listing, and any relevant communication with the seller. More evidence means faster resolution."
    },
    {
      icon: MessageSquare,
      title: "Communication",
      description: "Our team may contact you for additional information. Both parties can submit statements and evidence during the review period."
    },
    {
      icon: Shield,
      title: "Admin Review",
      description: "Our dispute resolution team reviews all evidence impartially. We consider listing accuracy, communications, and platform policies."
    },
    {
      icon: CheckCircle,
      title: "Resolution",
      description: "Decisions are made within 48 hours for most cases. Outcomes include full refunds, partial refunds, or case dismissal with detailed reasoning."
    }
  ];

  const evidenceRequired = [
    "Clear photos of the item showing the issue",
    "Screenshots of the original listing",
    "Photos of packaging (if damaged during delivery)",
    "Any communication with the seller",
    "Delivery documentation or collection confirmation",
    "Measurements or specifications (if applicable)"
  ];

  const resolutionOutcomes = [
    {
      title: "Full Refund",
      description: "Issued when the item is significantly not as described, never received, or completely unusable."
    },
    {
      title: "Partial Refund",
      description: "Offered when the item has minor issues or can still be used but wasn't exactly as described."
    },
    {
      title: "Case Dismissed",
      description: "When evidence shows the listing was accurate and the seller fulfilled their obligations."
    },
    {
      title: "Mediated Solution",
      description: "Sometimes we help both parties reach a compromise that works for everyone."
    }
  ];

  return (
    <>
      <SEOHead
        title="Dispute Resolution - How We Resolve Issues"
        description="Learn about Skipped's dispute resolution process. Find out how to raise a dispute, what evidence to provide, and how we protect both buyers and sellers fairly."
        keywords="dispute resolution, refund process, buyer protection, seller protection, transaction disputes, escrow disputes"
        canonicalUrl="https://skipped.co.uk/dispute-resolution"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main id="main-content" className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <Breadcrumbs items={[{ label: "Dispute Resolution" }]} />
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-12 w-12 text-primary mr-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Dispute Resolution
                </h1>
              </div>
              <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
                Fair and transparent resolution for buyers and sellers
              </p>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Introduction */}
            <Card className="p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">What If Something Goes Wrong?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We understand that sometimes transactions don't go as planned. That's why we've built a comprehensive dispute resolution system to protect both buyers and sellers. Our escrow payment system holds funds until both parties are satisfied, giving you peace of mind throughout every transaction.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our team reviews every dispute fairly and impartially, considering evidence from both sides before making a decision. Most disputes are resolved within 48 hours, and 95% of our users report satisfaction with the outcome.
              </p>
            </Card>

            {/* Common Reasons */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Common Reasons to Raise a Dispute</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disputeReasons.map((reason, idx) => (
                  <Card key={idx} className="p-4 hover:shadow-lg transition-smooth">
                    <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Dispute Process */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">The Dispute Resolution Process</h2>
              <div className="space-y-6">
                {disputeProcess.map((step, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {idx + 1}. {step.title}
                        </h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Evidence Required */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Evidence to Provide</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Strong evidence helps us resolve your dispute quickly. Please provide:
                </p>
                <ul className="space-y-2">
                  {evidenceRequired.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Timeline Expectations</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Initial Response</h3>
                    <p className="text-muted-foreground">Within 24 hours of raising a dispute</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Evidence Review</h3>
                    <p className="text-muted-foreground">1-3 days for both parties to submit evidence</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Resolution Decision</h3>
                    <p className="text-muted-foreground">48 hours after evidence review is complete</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Refund Processing</h3>
                    <p className="text-muted-foreground">5-10 business days if approved</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Resolution Outcomes */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Possible Outcomes</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {resolutionOutcomes.map((outcome, idx) => (
                  <Card key={idx} className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{outcome.title}</h3>
                    <p className="text-muted-foreground">{outcome.description}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Tips */}
            <Card className="p-6 md:p-8 mb-8 bg-accent/5">
              <h2 className="text-2xl font-bold text-foreground mb-4">Tips for Successful Dispute Resolution</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Raise disputes promptly</strong> - Don't wait too long after receiving an item</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Provide clear evidence</strong> - Multiple photos from different angles help significantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Be factual and specific</strong> - Focus on objective facts rather than emotions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Respond to requests</strong> - Reply quickly if we ask for additional information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Keep communication on-platform</strong> - Use our messaging system for all dispute-related discussions</span>
                </li>
              </ul>
            </Card>

            {/* CTA */}
            <Card className="p-8 text-center bg-primary/5">
              <h2 className="text-2xl font-bold text-foreground mb-4">Need Help with a Transaction?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you're experiencing issues with a purchase or sale, our support team is here to help. For urgent matters, contact us directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact-us">Contact Support</Link>
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

export default DisputeResolution;
