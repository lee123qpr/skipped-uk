import { Leaf } from "lucide-react";

interface CarbonBadgeProps {
  carbonSaved: number;
  landfillDiverted?: number;
  size?: "sm" | "md" | "lg";
  showBoth?: boolean;
  className?: string;
}

const CarbonBadge = ({ carbonSaved, landfillDiverted, size = "md", showBoth = false, className = "" }: CarbonBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  if (showBoth && landfillDiverted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium shadow-sm transition-smooth hover:shadow-md ${sizeClasses[size]}`}>
          <Leaf className={iconSizes[size]} />
          <span>{landfillDiverted.toFixed(0)}kg diverted</span>
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-success text-success-foreground font-medium shadow-carbon transition-smooth hover:shadow-lg ${sizeClasses[size]}`}>
          <Leaf className={iconSizes[size]} />
          <span>{carbonSaved}kg CO₂ saved</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-success text-success-foreground font-medium shadow-carbon transition-smooth hover:shadow-lg ${sizeClasses[size]} ${className}`}>
      <Leaf className={iconSizes[size]} />
      <span>{carbonSaved}kg CO₂ saved</span>
    </div>
  );
};

export default CarbonBadge;