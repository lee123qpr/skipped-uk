import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Parse both search and hash params (Supabase may use either depending on flow)
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
        const type = searchParams.get('type') || hashParams.get('type');
        const accessToken = hashParams.get('access_token');

        if (errorCode) {
          // Explicit error from Supabase
          setStatus('error');
          toast({
            title: 'Verification failed',
            description: errorDescription || 'Invalid or expired verification link.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/sign-in'), 2500);
          return;
        }

        // Treat verified if type=signup OR an access_token exists
        if (type === 'signup' || !!accessToken) {
          setStatus('success');
          toast({
            title: 'Email verified!',
            description: 'Your account has been verified. Please sign in to continue.',
          });
          setTimeout(() => navigate('/sign-in'), 1500);
          return;
        }

        // Fallback: Supabase sometimes redirects without tokens after verifying on server
        setStatus('success');
        toast({
          title: 'You’re all set!',
          description: 'If you just confirmed your email, you can now sign in.',
        });
        setTimeout(() => navigate('/sign-in'), 1500);
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        toast({
          title: 'Verification failed',
          description: error?.message || 'Something went wrong during verification.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/sign-in'), 2500);
      }
    };

    handleEmailVerification();
  }, [navigate, toast]);

  return (
    <>
      <SEOHead 
        title="Verifying Email - Skipped" 
        description="Verifying your email address"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Verifying your email</h1>
              <p className="text-muted-foreground">Please wait while we confirm your account...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Email verified!</h1>
              <p className="text-muted-foreground">Redirecting you to sign in...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Verification failed</h1>
              <p className="text-muted-foreground">Redirecting you to sign in...</p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthCallback;
