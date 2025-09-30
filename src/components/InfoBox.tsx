import { Info } from "lucide-react";
interface InfoBoxProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "warning";
}
const InfoBox = ({
  children,
  variant = "primary"
}: InfoBoxProps) => {
  const variantStyles = {
    primary: "bg-primary/10 border-primary/30 text-foreground",
    accent: "bg-accent/10 border-accent/30 text-foreground",
    warning: "bg-warning/10 border-warning/30 text-foreground"
  };
  const iconStyles = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning"
  };
  return;
};
export default InfoBox;