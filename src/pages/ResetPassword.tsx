import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEOHead from "@/components/SEOHead";
import skippedLogo from "@/assets/skipped-logo.jpeg";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sign-in`,
      });

      if (error) {
        console.error("Password reset error:", error);
        // Still show success message to avoid revealing if email exists
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <SEOHead
          title="Check Your Email - Password Reset"
          description="Password reset link sent. Check your email to reset your Skipped account password."
          keywords="password reset, check email, account recovery"
        />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="p-6 md:p-8 shadow-strong bg-card border-border text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">Check your email</h1>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We've sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary hover:text-primary-hover font-medium"
                  >
                    try again
                  </button>
                </p>
                
                <Link to="/sign-in">
                  <Button variant="outline" size="lg" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Reset Your Password - Skipped"
        description="Forgot your password? Reset your Skipped account password securely and get back to buying and selling construction materials."
        keywords="password reset, forgot password, account recovery, Skipped login"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back to Sign In */}
          <div className="text-center mb-6">
            <Link to="/sign-in" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth text-base">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

          <Card className="p-6 shadow-strong bg-card border-border">
            {/* Header */}
            <header className="text-center mb-6">
              <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-3">
                <img src={skippedLogo} alt="" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Reset your password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </header>

          {/* Info Alert */}
          <Alert className="mb-4 bg-warning/5 border-warning/20">
            <Info className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              Enter your email address and we'll send you a secure link to reset your password. The link will expire after 24 hours.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="marketplace" size="lg" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link to="/sign-in" className="text-primary hover:text-primary-hover font-medium transition-smooth">
              Sign in
            </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;