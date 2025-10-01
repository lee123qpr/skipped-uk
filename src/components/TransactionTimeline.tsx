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
    const isDisputed = transaction.status === "disputed";
    
    const steps: TimelineStep[] = [
      {
        label: "Order Created",
        timestamp: transaction.created_at,
        status: "complete",
        icon: CheckCircle2,
        description: userRole === "buyer" ? "You placed this order" : "Order received from buyer",
      },
      {
        label: "Payment Received",
        timestamp: transaction.paid_at || undefined,
        status: transaction.paid_at ? "complete" : transaction.status === "pending_payment" ? "current" : "upcoming",
        icon: transaction.paid_at ? CheckCircle2 : Clock,
        description: transaction.paid_at 
          ? "Payment processed successfully"
          : userRole === "buyer" 
            ? "Complete payment to continue"
            : "Awaiting buyer payment",
      },
      {
        label: "Item Dispatched",
        timestamp: transaction.dispatch_confirmed_at || undefined,
        status: transaction.dispatch_confirmed_at 
          ? "complete" 
          : transaction.status === "paid" 
            ? "current" 
            : "upcoming",
        icon: transaction.dispatch_confirmed_at ? CheckCircle2 : Package,
        description: transaction.dispatch_confirmed_at
          ? "Item shipped by seller"
          : userRole === "seller"
            ? "Mark as shipped when dispatched"
            : "Seller will dispatch the item soon",
      },
      {
        label: "Item Delivered",
        timestamp: transaction.delivery_confirmed_at || undefined,
        status: transaction.delivery_confirmed_at 
          ? "complete" 
          : transaction.status === "dispatched" 
            ? "current" 
            : "upcoming",
        icon: transaction.delivery_confirmed_at ? CheckCircle2 : Truck,
        description: transaction.delivery_confirmed_at
          ? "Delivery confirmed by buyer"
          : userRole === "buyer"
            ? "Confirm receipt when you receive the item"
            : "Awaiting buyer confirmation",
      },
      {
        label: "Transaction Complete",
        timestamp: transaction.completed_at || undefined,
        status: transaction.completed_at ? "complete" : "upcoming",
        icon: transaction.completed_at ? CheckCircle2 : Circle,
        description: transaction.completed_at
          ? "Transaction successfully completed"
          : "Funds will be released to seller",
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