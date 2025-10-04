import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Save } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import MediaUpload, { type MediaFile } from "@/components/MediaUpload";

interface AdminBlogPostEditorProps {
  postId: string | null;
  onSaveComplete: () => void;
}

export function AdminBlogPostEditor({ postId, onSaveComplete }: AdminBlogPostEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    images: [] as string[],
    status: "draft" as "draft" | "published" | "archived",
    meta_description: "",
    meta_keywords: "",
    selectedCategories: [] as string[],
  });

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

  const { data: existingPost } = useQuery({
    queryKey: ["blog-post", postId],
    enabled: !!postId,
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories(category_id)
        `)
        .eq("id", postId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt || "",
        content: existingPost.content,
        images: existingPost.featured_image_url ? [existingPost.featured_image_url] : [],
        status: existingPost.status,
        meta_description: existingPost.meta_description || "",
        meta_keywords: existingPost.meta_keywords || "",
        selectedCategories: existingPost.blog_post_categories?.map((pc: any) => pc.category_id) || [],
      });
    }
  }, [existingPost]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const postData = {
        title: data.title,
        slug: data.slug || undefined,
        excerpt: data.excerpt || null,
        content: data.content,
        featured_image_url: data.images[0] || null,
        status: data.status,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
        author_id: user?.id,
        published_at: data.status === "published" && !existingPost?.published_at 
          ? new Date().toISOString() 
          : existingPost?.published_at,
      };

      let savedPostId = postId;

      if (postId) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", postId);
        if (error) throw error;
      } else {
        const { data: newPost, error } = await supabase
          .from("blog_posts")
          .insert(postData)
          .select()
          .single();
        if (error) throw error;
        savedPostId = newPost.id;
      }

      // Update categories
      if (savedPostId) {
        // Delete existing categories
        await supabase
          .from("blog_post_categories")
          .delete()
          .eq("post_id", savedPostId);

        // Insert new categories
        if (data.selectedCategories.length > 0) {
          await supabase
            .from("blog_post_categories")
            .insert(
              data.selectedCategories.map((catId) => ({
                post_id: savedPostId,
                category_id: catId,
              }))
            );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-dashboard-stats"] });
      toast.success(postId ? "Post updated successfully" : "Post created successfully");
      onSaveComplete();
    },
    onError: () => {
      toast.error("Failed to save post");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const handleMediaChange = (files: MediaFile[]) => {
    const imageUrls = files
      .filter(f => f.uploaded && f.url)
      .map(f => f.url!);
    setFormData(prev => ({ ...prev, images: imageUrls }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {postId ? "Edit Post" : "Create New Post"}
        </h2>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL Slug
                  <span className="text-xs text-muted-foreground ml-2">
                    (leave empty to auto-generate)
                  </span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-blog-post"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short summary (optional)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.excerpt.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Description for search engines"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload
                onFilesChange={handleMediaChange}
                maxImages={5}
                maxVideos={0}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload up to 5 images. First image will be the featured image.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories?.map((category) => (
                  <Badge
                    key={category.id}
                    variant={
                      formData.selectedCategories.includes(category.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    style={
                      formData.selectedCategories.includes(category.id)
                        ? { backgroundColor: category.color }
                        : { borderColor: category.color }
                    }
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
