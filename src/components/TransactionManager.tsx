import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Clock,
  Star
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { TransactionTimeline } from "./TransactionTimeline";
import ErrorBoundary from "./ErrorBoundary";
import { DisputeDialog } from "./DisputeDialog";
import { getStatusConfig, canBuyerPay, canSellerDispatch, canBuyerConfirmDelivery, canRaiseDispute } from "@/utils/transactionStatus";

const stripePromise = loadStripe("pk_test_51QqxZjCZoEP5gSXQv8c5gj7jnQUqGqQCQDGQChzw3vTMrIxXpjIWhJUW4mEDRe0gQRNXGWCNB7NZ5Qr1hWRQkb5P00hIjXSHVl");

interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  buyer_protection_fee?: number | null;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  paid_at: string | null;
  dispatch_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  completed_at: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  listings?: {
    title: string;
    images: string[];
    environmental_assessment_enabled?: boolean;
  };
}

interface TransactionManagerProps {
  transaction: Transaction;
  userRole: "buyer" | "seller";
  onUpdate: () => void;
}

export const TransactionManager = ({ 
  transaction, 
  userRole,
  onUpdate 
}: TransactionManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  console.log('[TransactionManager] Rendering with:', { 
    transactionId: transaction.id, 
    status: transaction.status, 
    userRole,
    paidAt: transaction.paid_at,
    dispatchedAt: transaction.dispatch_confirmed_at 
  });

  // Prevent accidental page navigation during payment
  useEffect(() => {
    if (transaction.status === "pending_payment") {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Payment verification in progress. Are you sure you want to leave?";
        return e.returnValue;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [transaction.status]);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Store transaction ID and timestamp in session storage
      sessionStorage.setItem("pending_payment_tx", transaction.id);
      sessionStorage.setItem("pending_payment_time", Date.now().toString());

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { 
          transactionId: transaction.id,
          amount: transaction.amount,
          buyerProtectionFee: transaction.buyer_protection_fee || (transaction.amount * 0.05),
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.checkoutUrl) {
        toast({
          title: "Redirecting to payment",
          description: "Taking you to Stripe Checkout. Do not close this window.",
        });
        
        // Small delay to ensure storage is written
        setTimeout(() => {
          window.location.href = data.checkoutUrl as string;
        }, 500);
      }

      onUpdate();
    } catch (error: any) {
      // Clear session storage on error
      sessionStorage.removeItem("pending_payment_tx");
      sessionStorage.removeItem("pending_payment_time");
      
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleManualVerification = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { 
          transactionId: transaction.id,
          forceCheck: true // Flag to check Stripe directly
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Payment Verified!",
          description: "Your payment has been confirmed.",
        });
        onUpdate();
      } else {
        toast({
          title: "Payment Not Found",
          description: "No completed payment found for this transaction. Please contact support if you've been charged.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDispatch = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-dispatch", {
        body: { transactionId: transaction.id },
      });

      if (error) throw error;

      toast({
        title: "Dispatch Confirmed",
        description: "Buyer has been notified that item has been sent.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-delivery", {
        body: { transactionId: transaction.id },
      });

      if (error) throw error;

      // Check if listing has environmental assessment enabled
      if (transaction.listings?.environmental_assessment_enabled) {
        // Generate certificates
        const { error: certError } = await supabase.functions.invoke("generate-environmental-certificate", {
          body: { transactionId: transaction.id },
        });

        if (certError) {
          console.error('Certificate generation error:', certError);
          // Don't fail the delivery confirmation if certificate generation fails
        }
      }

      toast({
        title: "Delivery Confirmed",
        description: transaction.listings?.environmental_assessment_enabled 
          ? "Funds have been released! Your environmental certificate is being generated."
          : "Funds have been released to the seller!",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the other user's ID for the dispute dialog
  const otherUserId = userRole === "buyer" ? transaction.seller_id : transaction.buyer_id;

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  const getStatusBadge = () => {
    return <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Transaction Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold">£{transaction.amount.toFixed(2)}</span>
          </div>
          {userRole === "buyer" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buyer Protection:</span>
                <span className="font-semibold">£{(transaction.buyer_protection_fee || transaction.amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">£{(transaction.amount + (transaction.buyer_protection_fee || transaction.amount * 0.05)).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Buyer Actions */}
        {userRole === "buyer" && (
          <div className="space-y-2">
            {transaction.status === "pending_payment" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      ⏳ Verifying Your Payment
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      We're confirming your payment with Stripe. This usually takes a few seconds.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      💡 If you just completed payment, please wait 10-15 seconds...
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Refresh Status
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleManualVerification}
                    disabled={isVerifying}
                    className="flex-1"
                  >
                    {isVerifying ? "Checking..." : "Verify Now"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Still stuck? Contact support with transaction ID
                </p>
              </div>
            )}
            
            {transaction.status === "pending" && (
              <ErrorBoundary fallback={<div className="text-destructive text-sm">Payment unavailable. Please refresh.</div>}>
                <Button 
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Redirecting..." : "Buy Now - Complete Payment"}
                </Button>
              </ErrorBoundary>
            )}

            {canBuyerConfirmDelivery(transaction.status) && !transaction.status.includes('disputed') && (
              <>
                <Button 
                  onClick={handleConfirmDelivery}
                  disabled={isLoading}
                  className="w-full"
                >
                  Confirm Received - No Issues
                </Button>
                <Button 
                  onClick={() => setShowDisputeDialog(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Raise Dispute
                </Button>
              </>
            )}

            {/* Show dispute status message */}
            {transaction.status.includes('disputed') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  ⚠️ Dispute Submitted
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Your dispute is under admin review. Both parties will be notified of the outcome within 24-48 hours. Funds remain in escrow during the review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seller Actions */}
        {userRole === "seller" && (
          <div className="space-y-2">
            {transaction.status === "paid" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  💰 Payment Received in Escrow (£{transaction.amount.toFixed(2)})
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Funds are held securely. Mark as dispatched once you've sent the item.
                </p>
              </div>
            )}
            
            {canSellerDispatch(transaction.status) && (
              <Button 
                onClick={handleConfirmDispatch}
                disabled={isLoading}
                className="w-full"
              >
                📦 {isLoading ? "Confirming..." : "Mark as Dispatched"}
              </Button>
            )}

            {transaction.status === "dispatched" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  ⏳ Awaiting buyer confirmation. Funds will be released to you when buyer confirms receipt.
                </p>
              </div>
            )}
            
            {transaction.status === "pending_payment" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  ⏳ Waiting for buyer to complete payment...
                </p>
              </div>
            )}

            {/* Show dispute status message for seller */}
            {transaction.status.includes('disputed') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  ⚠️ Dispute Raised
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  A dispute has been raised by the buyer. An admin will review the case within 24-48 hours. Funds remain in escrow during the review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Completed Transaction - Review Prompt */}
        {transaction.status === "completed" && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  ✅ Transaction Complete!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                  {userRole === "buyer" 
                    ? "Thank you for your purchase! Help other buyers by leaving a review for the seller."
                    : "Funds have been released to your account. Please leave feedback for the buyer."
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                // Navigate to Dashboard profile tab where TransactionReviews is displayed
                window.location.href = "/dashboard?tab=profile#reviews";
              }}
              className="w-full"
              size="sm"
            >
              <Star className="h-4 w-4 mr-2" />
              Leave a Review
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">Transaction Timeline</h4>
          <TransactionTimeline transaction={transaction} userRole={userRole} />
        </div>
      </CardContent>

      {/* Dispute Dialog */}
      <DisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        transactionId={transaction.id}
        userRole={userRole}
        otherUserId={otherUserId}
        onSuccess={onUpdate}
      />
    </Card>
  );
};
