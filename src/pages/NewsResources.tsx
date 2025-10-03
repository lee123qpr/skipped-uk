import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          profiles:author_id(display_name, username),
          blog_post_categories(
            blog_categories(id, name, slug, color)
          )
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (searchQuery) {
        query = query.textSearch("search_vector", searchQuery, {
          type: "websearch",
          config: "english",
        });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by category if selected
      if (selectedCategory) {
        return data.filter((post) =>
          post.blog_post_categories.some(
            (pc: any) => pc.blog_categories.id === selectedCategory
          )
        );
      }

      return data;
    },
  });

  return (
    <>
      <SEOHead
        title="News & Resources | Construction Materials Marketplace"
        description="Stay updated with the latest news, insights, and resources about sustainable construction, material recycling, and industry trends."
        keywords="construction news, sustainability tips, material recycling, industry insights, green building"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b bg-gradient-subtle">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                News & Resources
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover insights, tips, and industry news about sustainable construction
                and material recycling
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                All Posts
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                  style={
                    selectedCategory === category.id
                      ? { backgroundColor: category.color }
                      : { borderColor: category.color }
                  }
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.post_count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts?.map((post) => (
                <Link
                  key={post.id}
                  to={`/news-resources/${post.slug}`}
                  className="group block space-y-4 rounded-lg border bg-card p-4 transition-all hover:shadow-lg hover:border-primary"
                >
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {post.blog_post_categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.blog_post_categories.slice(0, 2).map((pc: any) => (
                          <Badge
                            key={pc.blog_categories.slug}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: pc.blog_categories.color }}
                          >
                            {pc.blog_categories.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.reading_time_minutes} min read</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.view_count} views</span>
                      </div>
                      {post.published_at && (
                        <span>{format(new Date(post.published_at), "dd MMM yyyy")}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
