import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service - Skipped"
        description="Read Skipped's Terms of Service to understand the rules and guidelines for using our construction materials marketplace platform."
        keywords="terms of service, user agreement, marketplace terms, construction marketplace"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: 30 September 2025</p>
            </header>

            <Card className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Skipped's marketplace platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Skipped provides an online marketplace platform that connects buyers and sellers of construction materials, including surplus, second-hand, and reclaimed materials. We facilitate transactions but are not a party to the actual sale between buyers and sellers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p className="leading-relaxed">To use certain features of our platform, you must create an account. You agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Maintain the security of your password</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorised use</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Conduct</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Use the platform for any unlawful purpose</li>
                  <li>Post false, inaccurate, or misleading information</li>
                  <li>Impersonate any person or entity</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Interfere with or disrupt the platform's functionality</li>
                  <li>Collect user information without consent</li>
                  <li>Use automated systems to access the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Listing Requirements</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">When listing items for sale, sellers must:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Provide accurate descriptions and photographs</li>
                  <li>Set fair and accurate pricing</li>
                  <li>Specify correct location and delivery options</li>
                  <li>Only list items they legally own and have the right to sell</li>
                  <li>Honour confirmed sales and transactions</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Buyer Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">Buyers agree to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Make payment for purchased items promptly</li>
                  <li>Communicate clearly with sellers</li>
                  <li>Inspect items upon collection or delivery</li>
                  <li>Report issues through proper dispute channels</li>
                  <li>Provide honest reviews and feedback</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Payments and Fees</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All transactions are processed through our secure payment system. Sellers may be charged commission fees on successful sales. Buyers benefit from our buyer protection programme. All fees are clearly displayed before transaction completion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Buyer Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our buyer protection programme covers eligible purchases where items significantly differ from descriptions or are not received. Claims must be filed within specified timeframes and are subject to investigation and approval.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content on the Skipped platform, including text, graphics, logos, and software, is owned by Skipped or its licensors and is protected by intellectual property laws. Users retain ownership of content they post but grant Skipped a licence to use, display, and distribute such content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We provide a dispute resolution process for issues arising between buyers and sellers. Users should first attempt to resolve disputes directly. If unsuccessful, our support team can assist with mediation. We reserve the right to make final decisions on disputes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Skipped acts as a marketplace platform and is not responsible for the quality, safety, or legality of items listed, the accuracy of listings, or the ability of sellers to complete transactions. To the fullest extent permitted by law, we disclaim all warranties and limit our liability for damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these Terms of Service or engage in prohibited activities. Users may also terminate their accounts at any time through account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Modifications to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the modified terms. We will notify users of significant changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Service are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-3 text-muted-foreground">
                  <p>Email: support@skipped.com</p>
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

export default TermsOfService;
