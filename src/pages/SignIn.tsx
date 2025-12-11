import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import SEOHead from "@/components/SEOHead";
import InfoBox from "@/components/InfoBox";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import skippedLogo from "@/assets/skipped-logo.jpeg";
const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });

      // Wait a moment for auth state to propagate, then check role
      setTimeout(async () => {
        try {
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();
          if (user) {
            // Check for admin role
            const {
              data: roles
            } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();

            // Redirect based on role
            if (roles) {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          } else {
            navigate("/dashboard");
          }
        } catch (roleError) {
          navigate("/dashboard");
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <>
      <SEOHead title="Sign In to Skipped" description="Sign in to your Skipped account to buy and sell construction materials with buyer protection across the UK." keywords="sign in, login, construction materials marketplace, UK building materials" />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth text-base">
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>
          </div>

          <Card className="p-6 shadow-strong bg-card border-border">
            {/* Header */}
            <header className="text-center mb-6">
              <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-3">
                <img src={skippedLogo} alt="Skipped" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
              <p className="text-muted-foreground text-sm">Sign in to your account</p>
            </header>

          {/* Info Box */}
          

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/reset-password" className="text-sm text-primary hover:text-primary-hover transition-smooth">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="marketplace" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>


          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/sign-up" className="text-primary hover:text-primary-hover font-medium transition-smooth">
              Sign up
            </Link>
            </div>
          </Card>
        </div>
      </div>
    </>;
};
export default SignIn;