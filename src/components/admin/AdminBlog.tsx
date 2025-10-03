import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBlogDashboard } from "./blog/AdminBlogDashboard";
import { AdminBlogPostsList } from "./blog/AdminBlogPostsList";
import { AdminBlogPostEditor } from "./blog/AdminBlogPostEditor";
import { AdminBlogCategories } from "./blog/AdminBlogCategories";

export function AdminBlog() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const handleCreatePost = () => {
    setEditingPostId(null);
    setActiveTab("editor");
  };

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setActiveTab("editor");
  };

  const handleSaveComplete = () => {
    setEditingPostId(null);
    setActiveTab("posts");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">News & Resources</h1>
        <p className="text-muted-foreground mt-2">
          Manage blog posts, categories, and content to drive SEO traffic
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="editor">
            {editingPostId ? "Edit Post" : "New Post"}
          </TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AdminBlogDashboard onCreatePost={handleCreatePost} />
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <AdminBlogPostsList
            onCreatePost={handleCreatePost}
            onEditPost={handleEditPost}
          />
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <AdminBlogPostEditor
            postId={editingPostId}
            onSaveComplete={handleSaveComplete}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <AdminBlogCategories />
        </TabsContent>
      </Tabs>
    </div>
  );
}
