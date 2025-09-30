import { Info } from "lucide-react";

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "warning";
}

const InfoBox = ({ children, variant = "primary" }: InfoBoxProps) => {
  const variantStyles = {
    primary: "bg-primary/10 border-primary/30 text-foreground",
    accent: "bg-accent/10 border-accent/30 text-foreground",
    warning: "bg-warning/10 border-warning/30 text-foreground",
  };

  const iconStyles = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex gap-3">
        <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconStyles[variant]}`} />
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
};

export default InfoBox;
