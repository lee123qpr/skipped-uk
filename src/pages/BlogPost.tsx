import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, Clock, Eye, Calendar, ChevronRight, Share2 } from "lucide-react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("blog-session-id");
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("blog-session-id", id);
    }
    return id;
  });
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories(
            blog_categories(id, name, slug, color)
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      
      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("NOT_FOUND");
        }
        throw error;
      }
      return data;
    },
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.id],
    enabled: !!post?.id,
    queryFn: async () => {
      if (!post) return [];
      
      const categoryIds = post.blog_post_categories.map((pc: any) => pc.blog_categories.id);
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories!inner(category_id)
        `)
        .eq("status", "published")
        .neq("id", post.id)
        .in("blog_post_categories.category_id", categoryIds)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  // Record view
  useEffect(() => {
    if (post?.id) {
      const recordView = async () => {
        const today = new Date().toISOString().split("T")[0];
        const viewKey = `blog-view-${post.id}-${sessionId}-${today}`;
        
        if (localStorage.getItem(viewKey)) return;
        
        // Call secure edge function to record view
        await supabase.functions.invoke('track-blog-view', {
          body: {
            postId: post.id,
            sessionId: sessionId,
            userAgent: navigator.userAgent,
          }
        });
        
        localStorage.setItem(viewKey, "true");
      };
      
      recordView();
    }
  }, [post?.id, sessionId]);

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackType: "helpful" | "not_helpful") => {
      if (!post) return;
      
      await supabase.from("blog_post_feedback").insert({
        post_id: post.id,
        session_id: sessionId,
        feedback_type: feedbackType,
      });
    },
    onSuccess: (_, feedbackType) => {
      setFeedbackGiven(feedbackType);
      toast.success("Thank you for your feedback!");
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/news-resources")}>
          Back to News & Resources
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "News & Resources", href: "/news-resources" },
    { label: post.title },
  ];

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.meta_description || post.excerpt || ""}
        keywords={post.meta_keywords || ""}
        ogImage={post.featured_image_url || undefined}
        ogType="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.featured_image_url,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: {
            "@type": "Person",
            name: "Skipped UK",
          },
        }}
      />

      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero Image */}
          {post.featured_image_url && (
            <div className="w-full h-[400px] overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Header */}
          <header className="space-y-6 mb-8">
            {/* Categories */}
            {post.blog_post_categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.blog_post_categories.map((pc: any) => (
                  <Link
                    key={pc.blog_categories.slug}
                    to={`/news-resources?category=${pc.blog_categories.slug}`}
                  >
                    <Badge
                      variant="outline"
                      style={{ borderColor: pc.blog_categories.color }}
                      className="hover:bg-secondary"
                    >
                      {pc.blog_categories.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), "dd MMMM yyyy")}
                  </time>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.reading_time_minutes} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.view_count} views</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2 ml-auto"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </header>

          <Separator className="my-8" />

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-8" />

          {/* Feedback */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
            <div className="flex gap-4">
              <Button
                variant={feedbackGiven === "helpful" ? "default" : "outline"}
                onClick={() => feedbackMutation.mutate("helpful")}
                disabled={!!feedbackGiven}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              <Button
                variant={feedbackGiven === "not_helpful" ? "default" : "outline"}
                onClick={() => feedbackMutation.mutate("not_helpful")}
                disabled={!!feedbackGiven}
                className="gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Not Helpful
              </Button>
            </div>
            {feedbackGiven && (
              <p className="text-sm text-muted-foreground mt-4">
                Thank you for your feedback!
              </p>
            )}
          </Card>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/news-resources/${relatedPost.slug}`}
                    className="group block space-y-3 rounded-lg border bg-card p-4 transition-all hover:shadow-lg hover:border-primary"
                  >
                    {relatedPost.featured_image_url && (
                      <div className="aspect-video overflow-hidden rounded-lg">
                        <img
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{relatedPost.reading_time_minutes} min</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>

      <Footer />
    </>
  );
}
