import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import skippedLogo from "@/assets/skipped-logo.jpeg";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Sign In to Skipped"
        description="Sign in to your Skipped account to buy and sell construction materials with buyer protection across the UK."
        keywords="sign in, login, construction materials marketplace, UK building materials"
      />
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

          {/* Info Alert */}
          <Alert className="mb-4 bg-accent/5 border-accent/20">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              Sign in with your email and password. If you've forgotten your password, click "Forgot password?" below.
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded border-border" disabled={isLoading} />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/reset-password" className="text-sm text-primary hover:text-primary-hover transition-smooth">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="marketplace" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.160 1.219-5.160s-.312-.219-.312-.219c0-1.219.687-2.128 1.594-2.128.219 0 .312.156.312.438 0 .219-.156.687-.219 1.062-.156.687.312 1.219.999 1.219.999 0 1.687-1.062 1.687-2.595 0-1.312-.937-2.282-2.282-2.282-1.594 0-2.595 1.156-2.595 2.438 0 .499.187.812.437 1.062.125.125.156.219.125.375-.031.125-.125.499-.156.624-.031.156-.125.187-.281.125-.781-.375-1.281-1.499-1.281-2.438 0-1.781 1.312-3.406 3.781-3.406 1.999 0 3.531 1.406 3.531 3.281 0 2-1.219 3.562-2.906 3.562-.562 0-1.094-.281-1.281-.656 0 0-.281 1.062-.343 1.312-.125.499-.437.999-.687 1.344.499.156 1.031.219 1.594.219 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
                Continue with Apple
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/sign-up" className="text-primary hover:text-primary-hover font-medium transition-smooth">
              Sign up
            </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SignIn;