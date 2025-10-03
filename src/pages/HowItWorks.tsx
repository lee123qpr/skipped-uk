import { ShoppingCart, Store, Shield, MessageCircle, MapPin, CreditCard, Package, CheckCircle, AlertTriangle, Star, Award, TrendingUp } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HowItWorks = () => {
  return (
    <>
      <SEOHead
        title="How Skipped Works - Complete Guide for Buyers & Sellers"
        description="Learn how Skipped's marketplace connects buyers and sellers of construction materials. From browsing to secure payments, delivery, and environmental impact tracking."
        keywords="how it works, marketplace guide, buying construction materials, selling materials, escrow payment, secure transactions"
      />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        {/* Hero Section */}
        <section className="gradient-hero text-white py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Package className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                How Skipped Works
              </h1>
              <p className="text-lg sm:text-xl text-white/90">
                Your complete guide to buying and selling construction materials safely, sustainably, and securely on Skipped.
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "How It Works" }]} />
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
          {/* Buyer & Seller Tabs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Choose Your Journey</h2>
            
            <Tabs defaultValue="buyer" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="buyer" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  For Buyers
                </TabsTrigger>
                <TabsTrigger value="seller" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  For Sellers
                </TabsTrigger>
              </TabsList>

              {/* BUYER JOURNEY */}
              <TabsContent value="buyer" className="space-y-12">
                {/* Step 1: Browse & Search */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xl">1</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Browse & Search</CardTitle>
                        <CardDescription>Find the perfect materials for your project</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Location-Based Search
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Enter your location and search radius (5-100+ miles)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>See materials near you on an interactive map</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Distance displayed on each listing</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Package className="h-5 w-5 text-accent" />
                          Smart Filters
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Filter by category (50+ material types)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Condition: New, Like New, Good, Fair, Poor</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Delivery options: Collection or Delivery available</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Sort by price, distance, or recently added</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Contact & Negotiate */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xl">2</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Contact & Negotiate</CardTitle>
                        <CardDescription>Communicate safely through our platform</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="h-6 w-6 text-accent mt-1 shrink-0" />
                        <div className="space-y-2">
                          <h3 className="font-semibold">Built-In Messaging System</h3>
                          <p className="text-sm text-muted-foreground">
                            All communication happens securely through Skipped. This protects both parties and provides a record of all agreements.
                          </p>
                          <ul className="space-y-1 text-sm text-muted-foreground mt-3">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Ask questions about condition, dimensions, history</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Request additional photos if needed</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Make offers and negotiate prices</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Sellers can accept, counter, or decline offers</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Safety First</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Never share personal contact details or arrange off-platform payments. Keep all communication on Skipped for your protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Secure Payment */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xl">3</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Secure Payment</CardTitle>
                        <CardDescription>Your money is protected with our escrow system</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Shield className="h-8 w-8 text-success mb-2" />
                        <h3 className="font-semibold">Escrow Protection</h3>
                        <p className="text-sm text-muted-foreground">
                          When the seller accepts your offer, you make payment through our secure Stripe integration. Your funds are held safely in escrow until you confirm delivery.
                        </p>
                        <Badge variant="default" className="mt-2">100% Buyer Protection</Badge>
                      </div>
                      <div className="space-y-3">
                        <CreditCard className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold">Payment Methods</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Credit & debit cards</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Bank transfers (via Stripe)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Bank-level encryption</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>PCI compliant processing</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4: Delivery or Collection */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xl">4</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Delivery or Collection</CardTitle>
                        <CardDescription>Receive your materials your way</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      After payment, continue communicating through our messaging system to arrange the final details:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-2">
                        <CardHeader>
                          <MapPin className="h-8 w-8 text-primary mb-2" />
                          <CardTitle className="text-lg">Collection/Pickup</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Arrange convenient collection time</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Seller provides exact address</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Discuss loading requirements</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Inspect items in person</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader>
                          <Package className="h-8 w-8 text-accent mb-2" />
                          <CardTitle className="text-lg">Delivery</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Seller confirms dispatch date</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Provide delivery address & access details</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Track status in your dashboard</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Inspect upon arrival</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm">
                        <strong>Remember:</strong> All arrangements should be discussed through our messaging system. This keeps a record for your protection.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 5: Confirm & Review */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-success text-xl">5</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Confirm & Review</CardTitle>
                        <CardDescription>Complete your transaction and help the community</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-success mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">Confirm Delivery</h3>
                          <p className="text-sm text-muted-foreground">
                            Once you've received and inspected your materials, confirm delivery in your dashboard. This releases payment to the seller and completes the transaction.
                          </p>
                          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                            <p className="text-xs">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              Only confirm when you're satisfied. If there's an issue, raise a dispute first.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <Star className="h-6 w-6 text-warning mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">Leave a Review</h3>
                          <p className="text-sm text-muted-foreground">
                            Share your experience to help build trust in the community. Rate the seller and describe the transaction.
                          </p>
                          <Badge variant="secondary" className="mt-2">Reviews are public and help other buyers</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Buyer CTA */}
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <CardContent className="pt-8 pb-8 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Ready to Start Buying?</h2>
                    <p className="text-muted-foreground mb-6">
                      Browse thousands of quality construction materials near you
                    </p>
                    <Button asChild size="lg" variant="marketplace">
                      <Link to="/browse">Browse Materials</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SELLER JOURNEY */}
              <TabsContent value="seller" className="space-y-12">
                {/* Step 1: Create Listing */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-accent text-xl">1</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Create Your Listing</CardTitle>
                        <CardDescription>Showcase your materials effectively</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold">Essential Information</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Clear title with material type</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Detailed description with condition, history, dimensions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>High-quality photos (up to 5 images)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Competitive pricing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Quantity and weight (if known)</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold">Delivery Options</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Enable collection (always recommended)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Optionally offer delivery within a radius</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Set delivery cost and maximum distance</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span>Add any delivery notes or requirements</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Award className="h-6 w-6 text-success mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm">Environmental Assessment (Optional)</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enable this feature to calculate the carbon savings and environmental impact. Buyers receive a certificate and can promote their sustainable choices.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Receive & Respond */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-accent text-xl">2</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Receive & Respond to Offers</CardTitle>
                        <CardDescription>Communicate with potential buyers</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <MessageCircle className="h-6 w-6 text-accent mt-1 shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">Secure Messaging</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Buyers can message you through our platform to ask questions. You'll receive notifications for new messages and offers.
                          </p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Answer questions promptly and honestly</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Provide additional photos if requested</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Be clear about condition and any defects</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-success/50">
                          <CardHeader>
                            <CheckCircle className="h-8 w-8 text-success mb-2" />
                            <CardTitle className="text-base">Accept Offer</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              If the offer is acceptable, accept it and the buyer proceeds to payment
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-warning/50">
                          <CardHeader>
                            <TrendingUp className="h-8 w-8 text-warning mb-2" />
                            <CardTitle className="text-base">Counter Offer</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              Negotiate by sending a counter-offer with your preferred price
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                          <CardHeader>
                            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                            <CardTitle className="text-base">Decline Offer</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              Politely decline if the offer doesn't meet your expectations
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Stripe Connect */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-accent text-xl">3</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Stripe Connect Setup</CardTitle>
                        <CardDescription>Receive payments securely</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm mb-3">
                        Before you can receive payments, you'll need to connect your Stripe account. This is a one-time setup that takes just a few minutes.
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>Secure payment processing by Stripe</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>Payments directly to your bank account</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>Track earnings in your dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>Automatic tax documentation</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4: Dispatch */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-accent text-xl">4</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Dispatch Item</CardTitle>
                        <CardDescription>Arrange collection or delivery</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      After the buyer pays, use our messaging system to arrange the final details:
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">For Collection</h3>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Agree on a convenient collection time</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Provide your exact address and access instructions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Have materials ready and accessible</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Be available at the agreed time</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <Package className="h-6 w-6 text-accent mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">For Delivery</h3>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Confirm delivery date with buyer</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Get full delivery address and access details</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Arrange transport and loading equipment</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Mark as "Dispatched" in your dashboard</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm">
                        <strong>Important:</strong> Once you confirm dispatch in your dashboard, the buyer is notified and can track the transaction status.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 5: Payment & Reviews */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-success text-xl">5</span>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Receive Payment & Reviews</CardTitle>
                        <CardDescription>Complete the transaction</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <CreditCard className="h-6 w-6 text-success mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">Payment Release</h3>
                          <p className="text-sm text-muted-foreground">
                            Once the buyer confirms delivery, payment is automatically released from escrow to your Stripe account. Funds typically arrive within 2-7 business days.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <Star className="h-6 w-6 text-warning mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">Build Your Reputation</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            After the transaction, buyers can leave reviews. Positive reviews help you:
                          </p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Build trust with future buyers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Increase visibility in search results</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Sell materials faster at better prices</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>Earn verified seller badges</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seller CTA */}
                <Card className="bg-gradient-to-br from-accent/5 to-success/5 border-accent/20">
                  <CardContent className="pt-8 pb-8 text-center">
                    <Store className="h-12 w-12 mx-auto text-accent mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Ready to Start Selling?</h2>
                    <p className="text-muted-foreground mb-6">
                      Turn your surplus materials into cash and help reduce waste
                    </p>
                    <Button asChild size="lg" variant="marketplace">
                      <Link to="/sell">Create Your First Listing</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Key Features */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover-scale">
                <CardHeader>
                  <Shield className="h-10 w-10 mx-auto text-primary mb-3" />
                  <CardTitle className="text-lg">Verified Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Stripe verified accounts and community ratings
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-scale">
                <CardHeader>
                  <Award className="h-10 w-10 mx-auto text-success mb-3" />
                  <CardTitle className="text-lg">Environmental Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track and showcase your carbon savings
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-scale">
                <CardHeader>
                  <MessageCircle className="h-10 w-10 mx-auto text-accent mb-3" />
                  <CardTitle className="text-lg">Secure Messaging</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    All communication recorded for protection
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-scale">
                <CardHeader>
                  <Package className="h-10 w-10 mx-auto text-primary mb-3" />
                  <CardTitle className="text-lg">Transaction Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track every step from offer to delivery
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Safety Guidelines */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Safety Guidelines</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-warning/20">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-warning mb-4" />
                  <CardTitle>Always Do</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Keep all communication on Skipped's platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Pay through our secure escrow system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Inspect items before confirming delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Be honest about condition and defects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Read reviews before transacting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Raise disputes if something goes wrong</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
                  <CardTitle>Never Do</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Share personal contact details before payment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Arrange payments outside the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Confirm delivery before receiving items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Misrepresent condition or quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Ignore red flags or suspicious behaviour</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>Accept cash or cheques as payment</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center">
            <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border-primary/20">
              <CardContent className="pt-12 pb-12">
                <Package className="h-16 w-16 mx-auto text-primary mb-6" />
                <h2 className="text-3xl font-bold mb-4">Join the Circular Economy</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                  Whether you're buying or selling, Skipped makes it safe, simple, and sustainable to trade construction materials.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="xl" variant="marketplace">
                    <Link to="/browse">Start Buying</Link>
                  </Button>
                  <Button asChild size="xl" variant="outline">
                    <Link to="/sell">Start Selling</Link>
                  </Button>
                </div>
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

export default HowItWorks;
