import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentVerifier = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const verifyingRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (verifyingRef.current) return;

    if (payment === "success" && sessionId) {
      verifyingRef.current = true;

      supabase.functions
        .invoke("verify-payment", { body: { sessionId } })
        .then(({ data, error }) => {
          if (error) throw error;

          if (data?.success) {
            toast({
              title: "Payment Successful",
              description: "Your payment has been confirmed.",
            });
          } else {
            toast({
              title: "Payment Verification",
              description: data?.message || "Payment status could not be verified.",
              variant: "destructive",
            });
          }
        })
        .catch((err: any) => {
          console.error("verify-payment error", err);
          toast({
            title: "Verification Error",
            description: err.message || "Failed to verify payment status.",
            variant: "destructive",
          });
        })
        .finally(() => {
          // Clean URL and send user to dashboard messages
          navigate("/dashboard?tab=messages", { replace: true });
          verifyingRef.current = false;
        });
    }
  }, [location.search, navigate, toast]);

  return null;
};

export default PaymentVerifier;
