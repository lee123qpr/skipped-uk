import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AdminBlogPostsListProps {
  onCreatePost: () => void;
  onEditPost: (postId: string) => void;
}

export function AdminBlogPostsList({ onCreatePost, onEditPost }: AdminBlogPostsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories(
            blog_categories(name, slug, color)
          )
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.textSearch("search_vector", searchQuery, {
          type: "websearch",
          config: "english",
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch author profiles separately for non-null author_ids
      if (data && data.length > 0) {
        const authorIds = data.filter(post => post.author_id).map(post => post.author_id);
        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, username')
            .in('user_id', authorIds);
          
          // Attach profile data to posts
          return data.map(post => ({
            ...post,
            profiles: post.author_id 
              ? profiles?.find(p => p.user_id === post.author_id) || null
              : null
          }));
        }
      }
      
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-dashboard-stats"] });
      toast.success("Post deleted successfully");
      setDeletePostId(null);
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "default",
      draft: "secondary",
      archived: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreatePost} className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No posts found. Create your first blog post to get started.
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    {(post as any).profiles?.display_name || (post as any).profiles?.username || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
                      {post.blog_post_categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.blog_post_categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{post.view_count}</TableCell>
                  <TableCell>
                    {post.published_at
                      ? format(new Date(post.published_at), "dd MMM yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.status === "published" && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`/news-resources/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Post
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEditPost(post.id)} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletePostId(post.id)}
                          className="gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deleteMutation.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
