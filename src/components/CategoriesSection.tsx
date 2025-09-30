import { 
  TreePine, 
  Building2, 
  Zap, 
  Home, 
  Wrench, 
  Paintbrush,
  Grid3X3,
  ArrowRight
} from "lucide-react";
import CategoryCard from "./CategoryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";

const iconMap = {
  TreePine,
  Building2,
  Zap,
  Home,
  Wrench,
  Paintbrush,
  Grid3X3,
};

const CategoriesSection = () => {
  // Use shared categories hook
  const { data: categories, isLoading } = useCategories();
  const [showAll, setShowAll] = useState(false);
  
  const INITIAL_DISPLAY_COUNT = 8;
  const displayedCategories = showAll 
    ? categories 
    : categories?.slice(0, INITIAL_DISPLAY_COUNT);
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find exactly what you need from our wide range of construction materials and equipment
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))
          ) : (
            displayedCategories?.map((category) => {
              const IconComponent = iconMap[category.icon_name as keyof typeof iconMap] || Home;
              return (
                <CategoryCard
                  key={category.id}
                  title={category.name}
                  icon={IconComponent}
                  itemCount={category.item_count}
                  categoryId={category.id}
                />
              );
            })
          )}
        </div>

        {!isLoading && categories && categories.length > INITIAL_DISPLAY_COUNT && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show More'}
              <ArrowRight className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;