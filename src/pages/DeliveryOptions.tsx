import { Truck, MapPin, Package, CheckCircle, MessageCircle, Clock, Info } from "lucide-react";
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

const DeliveryOptions = () => {
  return (
    <>
      <SEOHead
        title="Delivery & Collection Options - Flexible Ways to Receive Materials"
        description="Learn about Skipped's flexible delivery and collection options for construction materials. Choose pickup for zero cost or seller-managed delivery to your site."
        keywords="delivery options, collection, pickup, construction materials delivery, free collection, seller delivery"
      />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        {/* Hero Section */}
        <section className="gradient-hero text-white py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Truck className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Flexible Delivery & Collection
              </h1>
              <p className="text-lg sm:text-xl text-white/90">
                Choose the option that works best for you. Collect materials directly from sellers or arrange convenient delivery to your site.
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Delivery & Collection Options" }]} />
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
          {/* Two Methods Comparison */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Choose Your Delivery Method</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Collection/Pickup */}
              <Card className="border-2 hover-scale">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-12 w-12 text-primary" />
                    <Badge variant="secondary" className="text-lg">Zero Cost</Badge>
                  </div>
                  <CardTitle className="text-2xl">Collection / Pickup</CardTitle>
                  <CardDescription>
                    Meet the seller and collect materials directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Benefits:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>No delivery costs</strong> - Completely free</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Inspect before collecting</strong> - See the exact items in person</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Meet the seller</strong> - Build trust through face-to-face interaction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Faster collection</strong> - Often available same-day or next-day</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>More control</strong> - You handle the transport</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card className="border-2 hover-scale">
                <CardHeader className="bg-accent/5">
                  <div className="flex items-center justify-between mb-4">
                    <Truck className="h-12 w-12 text-accent" />
                    <Badge variant="outline" className="text-lg">Seller Managed</Badge>
                  </div>
                  <CardTitle className="text-2xl">Delivery</CardTitle>
                  <CardDescription>
                    Let the seller deliver materials to your location
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Benefits:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Convenient</strong> - Materials brought to your site</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Cost shown upfront</strong> - Delivery price clearly displayed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Professional handling</strong> - Seller manages logistics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>Delivery radius shown</strong> - Know if the seller delivers to your area</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                        <span><strong>No transport needed</strong> - Perfect for large/heavy items</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How Collection Works */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">How Collection Works</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Browse & Make an Offer</h3>
                      <p className="text-muted-foreground mb-3">
                        Find materials near you using our location-based search. Filter by "Collection Available" to see only pickup options.
                      </p>
                      <Badge variant="secondary">Tip: Check the public location on the map before offering</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Negotiate & Communicate</h3>
                      <p className="text-muted-foreground mb-3">
                        Use our built-in messaging system to ask questions, negotiate the price, and discuss collection details with the seller.
                      </p>
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                        <p className="text-sm flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                          <span><strong>Stay safe:</strong> Keep all communication on our platform. Never share personal contact details before payment.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Seller Accepts & You Pay</h3>
                      <p className="text-muted-foreground mb-3">
                        Once the seller accepts your offer, you make secure payment through our platform. Your money is held in escrow for your protection.
                      </p>
                      <Badge variant="default">Payment is secure with Stripe</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Arrange Collection Details</h3>
                      <p className="text-muted-foreground mb-3">
                        After payment, continue communicating through our messaging system to arrange the specific collection time, access details, and any loading requirements.
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                        <li className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>Agree on a convenient time for both parties</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>Seller will provide the exact address and access instructions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>Discuss any loading equipment or assistance needed</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="font-bold text-success">5</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Collect & Confirm</h3>
                      <p className="text-muted-foreground mb-3">
                        Collect the materials at the agreed time. Inspect them to ensure they match the listing description. Once satisfied, confirm delivery in your dashboard to release payment to the seller.
                      </p>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>Remember:</strong> Only confirm delivery after you've collected and inspected the items. Payment is released to the seller immediately after confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How Delivery Works */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">How Delivery Works</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="font-bold text-accent">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Browse with Delivery Filter</h3>
                      <p className="text-muted-foreground mb-3">
                        Filter listings by "Delivery Available" and enter your location to see materials that can be delivered to your area.
                      </p>
                      <Badge variant="secondary">Delivery cost and radius are shown on each listing</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="font-bold text-accent">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Make an Offer & Discuss Details</h3>
                      <p className="text-muted-foreground mb-3">
                        Make your offer including the delivery option. Use our messaging system to confirm delivery dates, access requirements, and unloading arrangements.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="font-bold text-accent">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Seller Accepts & You Pay</h3>
                      <p className="text-muted-foreground mb-3">
                        Once accepted, you pay the total amount (item price + delivery cost) securely. Payment is held in escrow until you confirm delivery.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="font-bold text-accent">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Seller Dispatches</h3>
                      <p className="text-muted-foreground mb-3">
                        The seller confirms dispatch and manages the delivery to your location. You'll receive a notification when items are on their way.
                      </p>
                      <Badge variant="outline">Track status in your dashboard</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="font-bold text-success">5</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Receive & Confirm Delivery</h3>
                      <p className="text-muted-foreground mb-3">
                        Receive your materials and inspect them to ensure they match the description. Confirm delivery in your dashboard to release payment to the seller.
                      </p>
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                        <p className="text-sm">
                          <strong>Important:</strong> Check items thoroughly before confirming delivery. If there's an issue, raise a dispute before confirming.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Location Features */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Location & Search Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <MapPin className="h-8 w-8 text-primary mb-4" />
                  <CardTitle>Map-Based Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Search by radius (5, 10, 25, 50, 100+ miles)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>See approximate location on Google Maps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Distance shown on each listing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Visual map view of available materials</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Package className="h-8 w-8 text-accent mb-4" />
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Delivery cost clearly displayed on listings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Maximum delivery radius shown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Seller's delivery notes and requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Filter to show only delivery available items</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" />
                  Privacy & Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Your privacy is important to us. Here's how we handle location information:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span><strong>Public location:</strong> An approximate location is shown on the map to protect seller privacy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span><strong>Exact address:</strong> Only shared after payment through our secure messaging system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span><strong>Buyer location:</strong> Your exact address is only known to sellers you've paid</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Tips */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Tips for Buyers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">For Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Bring appropriate transport and equipment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Confirm collection time 24 hours before</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Ask about loading assistance if needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Be punctual and respectful of the seller's time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Inspect items before leaving the location</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">For Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Provide clear access instructions to the seller</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Ensure someone is available to receive delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Check delivery vehicle access and restrictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Arrange unloading equipment if required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>Inspect immediately upon delivery</span>
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
                <h2 className="text-2xl font-bold mb-4">Ready to Find Materials Near You?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Start browsing with our location-based search to find quality construction materials available for collection or delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="marketplace">
                    <Link to="/browse?delivery=collection">Browse for Collection</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/browse?delivery=delivery">Browse with Delivery</Link>
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

export default DeliveryOptions;
