import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Globally routes Supabase auth hash callbacks (e.g. #access_token=...)
// to our dedicated /auth/callback page so users don't get stuck on /
const AuthHashRouter = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { pathname, search, hash } = window.location;
    const hasAuthHash = hash.includes('access_token') || hash.includes('type=signup') || hash.includes('error_code');

    // Only redirect if tokens are present and we're not already on the callback route
    if (hasAuthHash && pathname !== '/auth/callback') {
      const target = `${window.location.origin}/auth/callback${search}${hash}`;
      // Use replace to avoid back button loop and preserve tokens
      window.location.replace(target);
    }
  }, [location]);

  return null;
};

export default AuthHashRouter;
