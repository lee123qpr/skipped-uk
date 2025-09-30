import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  itemCount: number;
  categoryId: string;
  className?: string;
}

const CategoryCard = ({ title, icon: Icon, itemCount, categoryId, className = "" }: CategoryCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/browse?category=${categoryId}`);
  };
  
  return (
    <Card 
      onClick={handleClick}
      className={`group cursor-pointer transition-smooth hover:shadow-medium hover:scale-105 p-6 text-center bg-card border-border ${className}`}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {itemCount.toLocaleString()} items
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;