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

const categories = [
  { title: "Timber & Wood", icon: TreePine, itemCount: 2847 },
  { title: "Bricks & Blocks", icon: Building2, itemCount: 1923 },
  { title: "M&E Equipment", icon: Zap, itemCount: 756 },
  { title: "Insulation", icon: Home, itemCount: 1234 },
  { title: "Tools & Plant", icon: Wrench, itemCount: 892 },
  { title: "Finishes", icon: Paintbrush, itemCount: 678 },
  { title: "Steel & Metal", icon: Grid3X3, itemCount: 543 },
  { title: "Fixtures", icon: Home, itemCount: 421 },
];

const CategoriesSection = () => {
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
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              icon={category.icon}
              itemCount={category.itemCount}
            />
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg">
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;