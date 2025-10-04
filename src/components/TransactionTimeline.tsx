import { CheckCircle2, Circle, Clock, Package, Truck, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TimelineStep {
  label: string;
  timestamp?: string;
  status: "complete" | "current" | "upcoming" | "disputed";
  icon: typeof CheckCircle2;
  description?: string;
}

interface TransactionTimelineProps {
  transaction: {
    status: string;
    created_at: string;
    paid_at?: string | null;
    dispatch_confirmed_at?: string | null;
    delivery_confirmed_at?: string | null;
    completed_at?: string | null;
    disputed_at?: string | null;
  };
  userRole: "buyer" | "seller";
}

export function TransactionTimeline({ transaction, userRole }: TransactionTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const isDisputed = transaction.status === "disputed" || transaction.status === "disputed_pending_review";
    
    const steps: TimelineStep[] = [
      {
        label: "Payment in Escrow",
        timestamp: transaction.paid_at || undefined,
        status: transaction.paid_at || transaction.dispatch_confirmed_at || ["paid", "dispatched", "delivered", "completed", "disputed", "disputed_pending_review"].includes(transaction.status)
          ? "complete" 
          : "upcoming",
        icon: transaction.paid_at || transaction.dispatch_confirmed_at || ["paid", "dispatched", "delivered", "completed", "disputed", "disputed_pending_review"].includes(transaction.status)
          ? CheckCircle2 
          : Clock,
        description: transaction.paid_at || transaction.dispatch_confirmed_at || ["paid", "dispatched", "delivered", "completed", "disputed", "disputed_pending_review"].includes(transaction.status)
          ? (userRole === "buyer" ? "✓ Payment held securely in escrow" : "✓ Payment received and held in escrow")
          : (userRole === "buyer" ? "Complete payment to continue" : "Waiting for buyer payment"),
      },
      {
        label: userRole === "seller" ? "Mark Item as Dispatched" : "Seller Dispatches Item",
        timestamp: transaction.dispatch_confirmed_at || undefined,
        status: transaction.dispatch_confirmed_at 
          ? "complete" 
          : transaction.status === "paid" 
            ? "current" 
            : "upcoming",
        icon: transaction.dispatch_confirmed_at ? CheckCircle2 : Package,
        description: transaction.dispatch_confirmed_at
          ? (userRole === "buyer" ? "✓ Item dispatched by seller" : "✓ You marked item as dispatched")
          : transaction.status === "paid"
            ? (userRole === "seller" ? "👉 ACTION: Mark as dispatched when item is sent" : "⏳ Waiting for seller to dispatch item")
            : (userRole === "seller" ? "Mark as shipped when paid" : "Seller will dispatch after payment"),
      },
      {
        label: userRole === "buyer" ? "Confirm Item Received" : "Buyer Confirms Delivery",
        timestamp: transaction.delivery_confirmed_at || undefined,
        status: transaction.delivery_confirmed_at 
          ? "complete" 
          : transaction.status === "dispatched" 
            ? "current" 
            : "upcoming",
        icon: transaction.delivery_confirmed_at ? CheckCircle2 : Truck,
        description: transaction.delivery_confirmed_at
          ? (userRole === "buyer" ? "✓ You confirmed delivery" : "✓ Buyer confirmed delivery")
          : transaction.status === "dispatched"
            ? (userRole === "buyer" ? "👉 ACTION: Confirm when you receive the item" : "⏳ Waiting for buyer to confirm receipt")
            : (userRole === "buyer" ? "Confirm receipt when delivered" : "Buyer will confirm delivery"),
      },
      {
        label: "Complete & Leave Feedback",
        timestamp: transaction.completed_at || undefined,
        status: transaction.completed_at ? "complete" : "upcoming",
        icon: transaction.completed_at ? CheckCircle2 : Circle,
        description: transaction.completed_at
          ? "✓ Transaction complete - Thank you!"
          : (userRole === "seller" ? "Funds released to you after confirmation" : "Leave feedback after delivery confirmation"),
      },
    ];

    // If disputed, mark all steps after dispute as disputed
    if (isDisputed && transaction.disputed_at) {
      const disputeIndex = steps.findIndex(s => !s.timestamp);
      steps.forEach((step, index) => {
        if (index >= disputeIndex) {
          step.status = "disputed";
        }
      });
      
      // Add dispute indicator
      steps.push({
        label: "Dispute Raised",
        timestamp: transaction.disputed_at,
        status: "disputed",
        icon: AlertCircle,
        description: "Transaction is under dispute review",
      });
    }

    return steps;
  };

  const steps = getSteps();

  const getStepColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "complete":
        return "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20";
      case "current":
        return "text-primary border-primary bg-primary/10 animate-pulse";
      case "disputed":
        return "text-destructive border-destructive bg-destructive/10";
      default:
        return "text-muted-foreground border-muted bg-muted/20";
    }
  };

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;
        
        return (
          <div key={index} className="flex gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 border-2 ${getStepColor(step.status)}`}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className={`w-0.5 h-full min-h-[40px] ${
                  step.status === "complete" 
                    ? "bg-green-300 dark:bg-green-700" 
                    : step.status === "disputed"
                      ? "bg-destructive/30"
                      : "bg-border"
                }`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-semibold ${
                    step.status === "complete" 
                      ? "text-foreground" 
                      : step.status === "current"
                        ? "text-primary"
                        : step.status === "disputed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </h4>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
                {step.timestamp && (
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(step.timestamp), "MMM d, HH:mm")}
                  </time>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}