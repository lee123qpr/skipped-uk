import { Shield, CheckCircle, AlertCircle, MessageCircle, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const BuyerProtection = () => {
  return (
    <>
      <SEOHead
        title="Buyer Protection - Shop with Complete Confidence"
        description="Learn how Skipped's escrow payment system, dispute resolution, and full refund protection keeps your purchases safe. 100% buyer protection on every transaction."
        keywords="buyer protection, escrow payment, refund policy, secure marketplace, construction materials, dispute resolution"
      />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        {/* Hero Section */}
        <section className="gradient-hero text-white py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Shield className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Shop with Complete Confidence
              </h1>
              <p className="text-lg sm:text-xl text-white/90">
                Every purchase on Skipped is protected by our secure escrow system. Your money is held safely until you confirm delivery.
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Buyer Protection" }]} />
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
            <Card className="text-center hover-scale">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>100% Buyer Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your payment is held in escrow until you confirm delivery
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-scale">
              <CardHeader>
                <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Powered by Stripe with bank-level encryption
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-scale">
              <CardHeader>
                <MessageCircle className="h-12 w-12 mx-auto text-accent mb-4" />
                <CardTitle>UK-Based Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team is here to help resolve any issues quickly
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">How Our Protection Works</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Escrow Payment System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">1</Badge>
                      <div>
                        <p className="font-medium">You make payment</p>
                        <p className="text-sm text-muted-foreground">Your funds are held securely in escrow</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">2</Badge>
                      <div>
                        <p className="font-medium">Seller dispatches item</p>
                        <p className="text-sm text-muted-foreground">You can track the transaction status in real-time</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">3</Badge>
                      <div>
                        <p className="font-medium">You confirm delivery</p>
                        <p className="text-sm text-muted-foreground">Only then is payment released to the seller</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">4</Badge>
                      <div>
                        <p className="font-medium">Leave a review</p>
                        <p className="text-sm text-muted-foreground">Help build trust in the community</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-accent" />
                    Built-In Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our secure messaging system lets you communicate safely with sellers throughout your transaction:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Ask questions about the item before making an offer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Negotiate prices and arrange collection/delivery details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Get updates on dispatch and delivery status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>All messages are recorded for your protection</span>
                    </li>
                  </ul>
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-accent">
                      💬 Always communicate through our platform. Never share personal contact details or arrange off-platform payments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Transaction Timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Transaction Timeline</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Offer Accepted & Payment</h3>
                      <p className="text-muted-foreground">You make payment and funds are held in secure escrow</p>
                      <Badge variant="secondary" className="mt-2">Status: Payment Pending → Paid</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Seller Dispatches</h3>
                      <p className="text-muted-foreground">Seller confirms dispatch and you're notified immediately</p>
                      <Badge variant="secondary" className="mt-2">Status: Dispatched</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Delivery/Collection</h3>
                      <p className="text-muted-foreground">You collect or receive your materials</p>
                      <Badge variant="secondary" className="mt-2">Status: In Transit</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="font-bold text-success">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">You Confirm Delivery</h3>
                      <p className="text-muted-foreground">Once satisfied, you confirm delivery and payment is released to seller</p>
                      <Badge variant="default" className="mt-2">Status: Completed</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Dispute Resolution Process</h2>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-warning" />
                  What If Something Goes Wrong?
                </CardTitle>
                <CardDescription>
                  We're here to help if your transaction doesn't go as planned
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Common Reasons to Raise a Dispute:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <span>Item not as described or condition differs significantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <span>Item not received or seller not responding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <span>Delivery issues or damaged goods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <span>Any other issue affecting the transaction</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">How the Process Works:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Step 1: Raise a Dispute</p>
                        <p className="text-sm text-muted-foreground">
                          You can raise a dispute from your dashboard at any time before confirming delivery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Step 2: Communication</p>
                        <p className="text-sm text-muted-foreground">
                          We encourage both parties to communicate and resolve the issue directly through our messaging system
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Step 3: Admin Review</p>
                        <p className="text-sm text-muted-foreground">
                          Our team reviews all evidence, messages, and listing details
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="font-medium">Step 4: Resolution</p>
                        <p className="text-sm text-muted-foreground">
                          We make a fair decision based on the evidence. This may result in a full refund, partial refund, or release of payment to seller
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Refund Policy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Refund Policy</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  Full Refund Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You're eligible for a full refund in the following situations:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span>Item not received and seller cannot provide proof of dispatch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span>Item significantly not as described in the listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span>Item is damaged and seller did not disclose damage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span>Seller cancels the transaction after payment</span>
                  </li>
                </ul>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>Note:</strong> Refunds are processed back to your original payment method within 5-10 business days after resolution.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tips for Buyers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Tips for Safe Buying</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Before Making an Offer</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Read the full listing description carefully</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Check all photos and ask for more if needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Use our messaging system to ask questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Check seller's ratings and reviews</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">After Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Arrange collection/delivery details through our platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Keep all communication on Skipped</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Inspect items thoroughly upon collection/delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Only confirm delivery when satisfied</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Start Shopping?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Browse thousands of quality construction materials with complete buyer protection on every purchase.
                </p>
                <Button asChild size="lg" variant="marketplace">
                  <Link to="/browse">Browse Materials</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default BuyerProtection;
