import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useToast } from "@/hooks/use-toast";
import { Cookie, CheckCircle2 } from "lucide-react";

const CookiePolicy = () => {
  const { preferences, acceptAll, rejectAll, updatePreferences } = useCookieConsent();
  const { toast } = useToast();
  
  const [functionality, setFunctionality] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Initialize toggles with current preferences
  useEffect(() => {
    if (preferences) {
      setFunctionality(preferences.functionality);
      setAnalytics(preferences.analytics);
      setMarketing(preferences.marketing);
    }
  }, [preferences]);

  const handleSavePreferences = () => {
    updatePreferences({
      functionality,
      analytics,
      marketing,
    });
    toast({
      title: "Preferences Saved",
      description: "Your cookie preferences have been updated successfully.",
      duration: 3000,
    });
  };

  const handleAcceptAll = () => {
    acceptAll();
    setFunctionality(true);
    setAnalytics(true);
    setMarketing(true);
    toast({
      title: "All Cookies Accepted",
      description: "You've accepted all cookie categories.",
      duration: 3000,
    });
  };

  const handleRejectAll = () => {
    rejectAll();
    setFunctionality(false);
    setAnalytics(false);
    setMarketing(false);
    toast({
      title: "Optional Cookies Rejected",
      description: "Only essential cookies will be used.",
      duration: 3000,
    });
  };

  return (
    <>
      <SEOHead
        title="Cookie Policy - Skipped"
        description="Learn about how Skipped uses cookies and similar technologies to enhance your experience on our construction materials marketplace."
        keywords="cookie policy, cookies, tracking technologies, web analytics"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
              <p className="text-muted-foreground">Last updated: 30 September 2025</p>
            </header>

            <Card className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and provide information to website owners.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Skipped uses cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Keep you signed in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our platform</li>
                  <li>Improve our services and user experience</li>
                  <li>Provide personalised content and features</li>
                  <li>Measure the effectiveness of our marketing campaigns</li>
                  <li>Protect against fraud and enhance security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Types of Cookies We Use</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Essential Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and payment processing. The website cannot function properly without these cookies.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Functionality Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies enable enhanced functionality and personalisation, such as remembering your preferences, saved searches, and location settings. They may be set by us or by third-party providers whose services we use.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Analytics Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our services and user experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Marketing Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies are used to track visitors across websites and display relevant advertisements. They may be set by our advertising partners to build a profile of your interests and show you relevant ads on other sites.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We may use third-party services that also set cookies on your device. These may include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Analytics Services:</strong> Google Analytics to help us understand website usage</li>
                  <li><strong>Payment Processors:</strong> To securely process transactions</li>
                  <li><strong>Social Media:</strong> To enable social sharing and login features</li>
                  <li><strong>Advertising Networks:</strong> To deliver targeted advertising</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  These third parties have their own privacy policies and cookie policies, which we encourage you to review.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookie Duration</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Session Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These temporary cookies expire when you close your browser and are deleted automatically.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Persistent Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies remain on your device for a set period specified in the cookie or until you delete them. They help us recognise you when you return to our website.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Managing Your Cookie Preferences</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You have several options for managing cookies:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Browser Settings</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Most browsers allow you to refuse or accept cookies and to delete existing cookies. The methods for doing this vary from browser to browser. Please check your browser's help menu for instructions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Cookie Consent Tools</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      When you first visit our website, you'll see a cookie banner allowing you to accept or reject non-essential cookies. You can change your preferences at any time using the tool below.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Opt-Out Links</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      For analytics services like Google Analytics, you can opt out by installing the Google Analytics Opt-out Browser Add-on.
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed mt-3">
                  <strong>Please note:</strong> Blocking or deleting cookies may impact your user experience and limit certain features of our website.
                </p>

                <Separator className="my-6" />

                {/* Interactive Cookie Preferences Manager */}
                <div className="mt-6 p-6 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <Cookie className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Your Cookie Preferences</h3>
                      <p className="text-sm text-muted-foreground">Customise your cookie settings below</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Essential Cookies */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold">Essential Cookies</Label>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Required for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                      <Switch checked disabled aria-label="Essential cookies (always enabled)" />
                    </div>

                    {/* Functionality Cookies */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="functionality-setting" className="text-base font-semibold cursor-pointer">
                          Functionality Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable enhanced functionality and personalisation, such as remembering your preferences.
                        </p>
                      </div>
                      <Switch
                        id="functionality-setting"
                        checked={functionality}
                        onCheckedChange={setFunctionality}
                        aria-label="Functionality cookies"
                      />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="analytics-setting" className="text-base font-semibold cursor-pointer">
                          Analytics Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                        </p>
                      </div>
                      <Switch
                        id="analytics-setting"
                        checked={analytics}
                        onCheckedChange={setAnalytics}
                        aria-label="Analytics cookies"
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="marketing-setting" className="text-base font-semibold cursor-pointer">
                          Marketing Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Used to track visitors across websites to display relevant advertisements and marketing campaigns.
                        </p>
                      </div>
                      <Switch
                        id="marketing-setting"
                        checked={marketing}
                        onCheckedChange={setMarketing}
                        aria-label="Marketing cookies"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="w-full sm:w-auto"
                    >
                      Reject All Optional
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleAcceptAll}
                      className="w-full sm:w-auto"
                    >
                      Accept All
                    </Button>
                    <Button
                      onClick={handleSavePreferences}
                      className="w-full sm:w-auto sm:ml-auto"
                    >
                      Save Preferences
                    </Button>
                  </div>

                  {preferences && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Last updated: {new Date(preferences.timestamp).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Do Not Track Signals</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Some browsers have a "Do Not Track" feature that signals to websites that you do not want to have your online activities tracked. We currently do not respond to Do Not Track signals.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Updates to This Cookie Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please check this page periodically for updates.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. More Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For more information about how we use cookies and protect your privacy, please see our Privacy Policy.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about our use of cookies, please contact us at:
                </p>
                <div className="mt-3 text-muted-foreground">
                  <p>Email: privacy@skipped.com</p>
                  <p>Phone: 0800 123 4567</p>
                </div>
              </section>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;
