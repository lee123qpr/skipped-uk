import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000)
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactUs = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Message sent successfully! We'll get back to you within 24 hours.");
    reset();
    setIsSubmitting(false);
  };

  return (
    <>
      <SEOHead
        title="Contact Us - Get in Touch"
        description="Contact Skipped support team for help with buying, selling, disputes, or technical issues. Email, phone, and online form available. UK-based support team."
        keywords="contact skipped, customer support, help desk, technical support, dispute help, contact details"
        canonicalUrl="https://skipped.co.uk/contact-us"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main id="main-content" className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <Breadcrumbs items={[{ label: "Contact Us" }]} />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">
                Contact Us
              </h1>
              <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
                Our support team is here to help with any questions or concerns
              </p>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Get In Touch</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Email</h3>
                        <a href="mailto:support@skipped.com" className="text-muted-foreground hover:text-primary transition-smooth">
                          support@skipped.com
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          We aim to respond within 24 hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Phone</h3>
                        <a href="tel:08001234567" className="text-muted-foreground hover:text-primary transition-smooth">
                          0800 123 4567
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          Mon-Fri: 9am-6pm GMT
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Location</h3>
                        <p className="text-muted-foreground">United Kingdom</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Serving the entire UK
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Business Hours</h3>
                        <p className="text-muted-foreground">Monday - Friday: 9am - 6pm</p>
                        <p className="text-muted-foreground">Saturday: 10am - 4pm</p>
                        <p className="text-muted-foreground">Sunday: Closed</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Emergency support available 24/7
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-primary/5">
                  <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      <Link to="/faq" className="hover:text-primary transition-smooth">
                        → Frequently Asked Questions
                      </Link>
                    </li>
                    <li>
                      <Link to="/dispute-resolution" className="hover:text-primary transition-smooth">
                        → Dispute Resolution Process
                      </Link>
                    </li>
                    <li>
                      <Link to="/safety-guidelines" className="hover:text-primary transition-smooth">
                        → Safety Guidelines
                      </Link>
                    </li>
                    <li>
                      <Link to="/how-it-works" className="hover:text-primary transition-smooth">
                        → How Skipped Works
                      </Link>
                    </li>
                  </ul>
                </Card>
              </div>

              {/* Contact Form */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Your full name"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your.email@example.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select onValueChange={(value) => setValue("subject", value)}>
                      <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Enquiry</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="dispute">Dispute Resolution</SelectItem>
                        <SelectItem value="safety">Safety Concern</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                        <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...register("message")}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    We typically respond within 24 hours during business days
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default ContactUs;
