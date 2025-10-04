import { useState } from "react";
import { Search, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqSections = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create an account?",
          answer: "Click 'Sign Up' in the top navigation, then enter your email and create a password. You'll receive a confirmation email to verify your account."
        },
        {
          question: "Is Skipped free to use?",
          answer: "Yes! Creating an account and browsing listings is completely free. We only charge a small buyer protection fee (3%) when you complete a purchase, and sellers pay a platform fee when items are sold."
        },
        {
          question: "What areas does Skipped cover?",
          answer: "Skipped covers the entire United Kingdom. You can search for materials near your location and filter by distance to find items close to you."
        },
        {
          question: "Do I need to verify my account?",
          answer: "Email verification is required to use the platform. Additional verification badges can be earned through ID verification and successful transactions."
        }
      ]
    },
    {
      title: "Buying",
      items: [
        {
          question: "How do I find items near me?",
          answer: "Use the search bar on the Browse page and enable location search. You can filter by distance, category, price range, and condition to find exactly what you need."
        },
        {
          question: "How do I make an offer?",
          answer: "On any listing page, click 'Make Offer' and enter your proposed amount. The seller will be notified and can accept, reject, or counter your offer."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We accept all major debit and credit cards through our secure Stripe payment system. All payments are held in escrow until the transaction is complete."
        },
        {
          question: "How does escrow payment work?",
          answer: "When you pay for an item, your money is held securely by Stripe. It's only released to the seller once you confirm delivery or the protection period expires. This protects both buyers and sellers."
        },
        {
          question: "What are buyer protection fees?",
          answer: "We charge a 3% buyer protection fee on all purchases. This covers secure payment processing, dispute resolution, and protection against fraud or misrepresented items."
        },
        {
          question: "When is payment released to the seller?",
          answer: "Payment is released when you confirm delivery, or automatically after 7 days if no issues are reported. This gives you time to inspect the item."
        },
        {
          question: "Can I cancel after payment?",
          answer: "Yes, you can raise a dispute if the item isn't as described, isn't delivered, or doesn't match the listing. Our team will review and help resolve the issue."
        }
      ]
    },
    {
      title: "Selling",
      items: [
        {
          question: "How do I list an item?",
          answer: "Click 'Sell' in the navigation, fill in the listing form with title, description, category, price, and photos. Add your location and delivery options, then publish."
        },
        {
          question: "What categories are available?",
          answer: "We support all construction material categories including Aggregates, Bricks & Blocks, Timber, Insulation, Roofing, Plumbing, Electrical, Tools, and more."
        },
        {
          question: "How much does it cost to sell?",
          answer: "We charge a platform fee when your item sells. The exact percentage depends on your seller tier and transaction volume. Listing items is free."
        },
        {
          question: "How do I price my items?",
          answer: "Consider the original retail price, current condition, and local market rates. Browse similar listings to see competitive pricing. Remember, buyers often make offers below asking price."
        },
        {
          question: "How do offers work?",
          answer: "Buyers can make offers on your listings. You'll receive a notification and can accept, reject, or send a counter-offer. Negotiate until you reach an agreement."
        },
        {
          question: "When do I receive payment?",
          answer: "Payment is released to your Stripe Connect account once the buyer confirms delivery or after 7 days. You can then transfer funds to your bank account."
        },
        {
          question: "What is Stripe Connect?",
          answer: "Stripe Connect is our payment partner that handles all transactions securely. You'll need to complete onboarding to receive payments."
        },
        {
          question: "Do I need to complete Stripe onboarding?",
          answer: "Yes, before you can sell items, you must complete Stripe onboarding. This verifies your identity and bank details for secure payments."
        }
      ]
    },
    {
      title: "Delivery & Collection",
      items: [
        {
          question: "What delivery options are available?",
          answer: "Sellers can offer collection only, delivery, or both. Delivery costs and arrangements are managed between buyer and seller. Some items may require specialist haulage."
        },
        {
          question: "Who arranges delivery?",
          answer: "This depends on the listing. Some sellers include delivery, others offer collection only. Always confirm delivery arrangements before purchasing."
        },
        {
          question: "Can I collect items myself?",
          answer: "Yes, if the seller offers collection. You'll coordinate a time with the seller after purchase. Bring appropriate transport and equipment for heavy materials."
        },
        {
          question: "What if the item is damaged during delivery?",
          answer: "Document the damage with photos immediately and raise a dispute. We'll review the evidence and help resolve the issue, which may include a partial or full refund."
        }
      ]
    },
    {
      title: "Disputes & Refunds",
      items: [
        {
          question: "How do I raise a dispute?",
          answer: "Go to your Dashboard, find the transaction, and click 'Raise Dispute'. Provide a clear description and upload evidence (photos, messages). Our team will review within 24-48 hours."
        },
        {
          question: "How long does dispute resolution take?",
          answer: "Most disputes are resolved within 48 hours. Complex cases may take up to 7 days. You'll be notified of updates throughout the process."
        },
        {
          question: "When am I eligible for a refund?",
          answer: "Refunds are issued when items are significantly not as described, never delivered, or damaged beyond acceptable use. Buyer protection covers verified disputes."
        },
        {
          question: "What evidence do I need to provide?",
          answer: "Clear photos of the item, screenshots of listing descriptions, delivery documentation, and any relevant messages with the seller. The more evidence, the faster the resolution."
        }
      ]
    },
    {
      title: "Safety & Security",
      items: [
        {
          question: "Is my payment information safe?",
          answer: "Yes. All payments are processed through Stripe, a PCI-compliant payment processor. We never store your card details on our servers."
        },
        {
          question: "How do I report suspicious activity?",
          answer: "Contact us immediately at support@skipped.com or use the 'Report' button on listings. We investigate all reports and take action against fraudulent accounts."
        },
        {
          question: "What should I avoid doing?",
          answer: "Never share payment details outside the platform, don't arrange off-platform payments, and avoid meeting in unsafe locations. Always use our secure messaging system."
        },
        {
          question: "How does Skipped verify users?",
          answer: "We offer verification badges for email, phone, and ID verification. Look for verified badges on seller profiles to increase trust."
        }
      ]
    },
    {
      title: "Environmental Impact",
      items: [
        {
          question: "How is CO₂ saved calculated?",
          answer: "We calculate the carbon emissions avoided by reusing materials instead of manufacturing new ones. This is based on material type, weight, and industry-standard emission factors."
        },
        {
          question: "Can I download environmental certificates?",
          answer: "Yes! After completing a purchase, go to your Dashboard and click 'Download Certificate'. This PDF shows the environmental impact of your sustainable purchase."
        },
        {
          question: "How does Skipped help sustainability?",
          answer: "By keeping construction materials in circulation, we reduce waste going to landfill, decrease demand for new manufacturing, and lower the industry's carbon footprint."
        }
      ]
    },
    {
      title: "Account & Technical",
      items: [
        {
          question: "How do I reset my password?",
          answer: "Click 'Sign In', then 'Forgot Password'. Enter your email and we'll send a password reset link. Follow the link to create a new password."
        },
        {
          question: "How do I update my profile?",
          answer: "Go to your Dashboard and click 'Edit Profile'. You can update your name, photo, bio, and contact preferences."
        },
        {
          question: "How do I enable notifications?",
          answer: "In your Dashboard, go to notification settings. You can choose to receive alerts for messages, offers, transactions, and platform updates."
        },
        {
          question: "Why am I not receiving emails?",
          answer: "Check your spam folder first. If emails aren't arriving, verify your email address in account settings and ensure notifications are enabled."
        },
        {
          question: "Is there a mobile app?",
          answer: "Skipped is a progressive web app (PWA), which means you can install it on your mobile device from your browser for an app-like experience."
        }
      ]
    },
    {
      title: "Fees & Payments",
      items: [
        {
          question: "What fees does Skipped charge?",
          answer: "Buyers pay a 3% protection fee. Sellers pay a platform fee on completed sales. All fees are clearly shown before confirming transactions."
        },
        {
          question: "When am I charged?",
          answer: "Buyers are charged immediately when purchasing. Sellers are charged when payment is released from escrow to their account."
        },
        {
          question: "How do refunds work?",
          answer: "If a dispute is resolved in your favour, refunds are returned to your original payment method within 5-10 business days."
        },
        {
          question: "What is the buyer protection fee?",
          answer: "The 3% fee covers secure payment processing, escrow services, dispute resolution, and fraud protection for all buyers."
        }
      ]
    },
    {
      title: "Reviews & Ratings",
      items: [
        {
          question: "How do reviews work?",
          answer: "After a transaction completes, both buyer and seller can leave a star rating and written review. Reviews are public and help build trust in the community."
        },
        {
          question: "Can I edit my review?",
          answer: "No, reviews are permanent once submitted. Take time to write a fair and accurate review as it impacts user reputations."
        },
        {
          question: "When can I leave a review?",
          answer: "Reviews can be submitted once the transaction is marked as complete, either after confirming delivery or when payment is released."
        },
        {
          question: "What if I receive an unfair review?",
          answer: "Contact our support team if you believe a review violates our guidelines. We'll investigate and remove reviews that are abusive or fraudulent."
        }
      ]
    }
  ];

  const filteredSections = searchQuery
    ? faqSections.map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : faqSections;

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about buying and selling construction materials on Skipped. Learn about payments, delivery, disputes, safety, and more."
        keywords="skipped faq, construction materials questions, buying guide, selling guide, payment help, dispute resolution, delivery options"
        canonicalUrl="https://skipped.co.uk/faq"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main id="main-content" className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <Breadcrumbs items={[{ label: "FAQ" }]} />
              <div className="flex items-center justify-center mb-6">
                <HelpCircle className="h-12 w-12 text-primary mr-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Frequently Asked Questions
                </h1>
              </div>
              <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
                Everything you need to know about using Skipped
              </p>
            </div>
          </section>

          {/* Search Section */}
          <section className="py-8 border-b border-border">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-lg"
                />
              </div>
            </div>
          </section>

          {/* FAQ Content */}
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              {filteredSections.length > 0 ? (
                <div className="space-y-8">
                  {filteredSections.map((section, idx) => (
                    <Card key={idx} className="p-6">
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        {section.title}
                      </h2>
                      <Accordion type="single" collapsible className="w-full">
                        {section.items.map((item, itemIdx) => (
                          <AccordionItem key={itemIdx} value={`item-${idx}-${itemIdx}`}>
                            <AccordionTrigger className="text-left text-foreground hover:text-primary transition-smooth">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">
                    No results found for "{searchQuery}". Try different keywords or browse all questions above.
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 text-center">
              <Card className="max-w-2xl mx-auto p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button asChild size="lg">
                  <Link to="/contact-us">Contact Support</Link>
                </Button>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default FAQ;
