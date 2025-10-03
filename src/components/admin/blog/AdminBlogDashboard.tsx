import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, TrendingUp, Plus, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminBlogDashboardProps {
  onCreatePost: () => void;
}

export function AdminBlogDashboard({ onCreatePost }: AdminBlogDashboardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["blog-dashboard-stats"],
    queryFn: async () => {
      const [postsResult, viewsResult, feedbackResult, categoriesResult] = await Promise.all([
        supabase.from("blog_posts").select("status", { count: "exact" }),
        supabase.from("blog_post_views").select("*", { count: "exact" }),
        supabase.from("blog_post_feedback").select("feedback_type", { count: "exact" }),
        supabase.from("blog_categories").select("*", { count: "exact" }),
      ]);

      const posts = postsResult.data || [];
      const published = posts.filter(p => p.status === "published").length;
      const drafts = posts.filter(p => p.status === "draft").length;

      const feedback = feedbackResult.data || [];
      const helpful = feedback.filter(f => f.feedback_type === "helpful").length;

      return {
        total: postsResult.count || 0,
        published,
        drafts,
        views: viewsResult.count || 0,
        helpful,
        categories: categoriesResult.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Posts",
      value: stats?.total || 0,
      icon: FileText,
      description: `${stats?.published || 0} published, ${stats?.drafts || 0} drafts`,
    },
    {
      title: "Total Views",
      value: stats?.views || 0,
      icon: Eye,
      description: "Unique page views",
    },
    {
      title: "Helpful Feedback",
      value: stats?.helpful || 0,
      icon: ThumbsUp,
      description: "Positive responses",
    },
    {
      title: "Categories",
      value: stats?.categories || 0,
      icon: TrendingUp,
      description: "Active categories",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <Button onClick={onCreatePost} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
