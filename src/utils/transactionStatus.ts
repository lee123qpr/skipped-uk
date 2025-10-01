import { CheckCircle2, Truck, AlertTriangle, Clock, Package, CreditCard } from "lucide-react";

export type TransactionStatus = 
  | "pending" 
  | "pending_payment"
  | "paid" 
  | "dispatched" 
  | "delivered" 
  | "completed" 
  | "disputed" 
  | "refunded";

export interface StatusConfig {
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  icon: any;
  description: string;
}

export const TRANSACTION_STATUS_CONFIG: Record<TransactionStatus, StatusConfig> = {
  pending: {
    label: "Awaiting Payment",
    variant: "outline",
    className: "border-amber-500 text-amber-700 dark:text-amber-400",
    icon: Clock,
    description: "Transaction created, awaiting buyer payment"
  },
  pending_payment: {
    label: "Awaiting Payment",
    variant: "outline",
    className: "border-amber-500 text-amber-700 dark:text-amber-400",
    icon: CreditCard,
    description: "Payment pending confirmation"
  },
  paid: {
    label: "Paid - Awaiting Dispatch",
    variant: "default",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
    icon: Package,
    description: "Payment received, seller should dispatch item"
  },
  dispatched: {
    label: "Item Dispatched",
    variant: "default",
    className: "bg-purple-500 hover:bg-purple-600 text-white",
    icon: Truck,
    description: "Item shipped, awaiting buyer confirmation"
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    className: "bg-green-600 hover:bg-green-700 text-white",
    icon: CheckCircle2,
    description: "Item delivered and confirmed"
  },
  completed: {
    label: "Completed",
    variant: "default",
    className: "bg-green-600 hover:bg-green-700 text-white",
    icon: CheckCircle2,
    description: "Transaction successfully completed"
  },
  disputed: {
    label: "Disputed",
    variant: "destructive",
    className: "",
    icon: AlertTriangle,
    description: "Transaction under dispute"
  },
  refunded: {
    label: "Refunded",
    variant: "destructive",
    className: "",
    icon: AlertTriangle,
    description: "Payment refunded to buyer"
  }
};

export const getStatusConfig = (status: string): StatusConfig => {
  return TRANSACTION_STATUS_CONFIG[status as TransactionStatus] || {
    label: status,
    variant: "outline",
    icon: Clock,
    description: "Unknown status"
  };
};

export const canBuyerPay = (status: string): boolean => {
  return status === "pending" || status === "pending_payment";
};

export const canSellerDispatch = (status: string): boolean => {
  return status === "paid";
};

export const canBuyerConfirmDelivery = (status: string): boolean => {
  return status === "dispatched";
};

export const canRaiseDispute = (status: string): boolean => {
  return status === "dispatched";
};

export const isTransactionActive = (status: string): boolean => {
  return !["completed", "disputed", "refunded"].includes(status);
};
