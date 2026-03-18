"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published";
  featured_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export default function WebsiteNewsPage() {
  const { organizationId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/website/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing && editing.id !== "new") {
        await fetch(`/api/website/posts?id=${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, excerpt }),
        });
      } else {
        await fetch("/api/website/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            content,
            excerpt,
            status: "draft",
          }),
        });
      }
      setEditing(null);
      setTitle("");
      setContent("");
      setExcerpt("");
      loadPosts();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await fetch(`/api/website/posts?id=${id}`, { method: "DELETE" });
      loadPosts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const startEdit = (post: Post) => {
    setEditing(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt);
  };

  const startNew = () => {
    setEditing({
      id: "new",
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setTitle("");
    setContent("");
    setExcerpt("");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/website"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">News & Blog</h1>
            <p className="text-sm text-gray-500">
              Publish news articles and school updates
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="px-4 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full text-2xl font-bold border-0 outline-none placeholder-gray-300"
          />
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt / summary"
            className="w-full text-sm border-0 outline-none placeholder-gray-300 text-gray-600"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            rows={12}
            className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-fuchsia-500 resize-y"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !title}
              className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Save {editing.id === "new" ? "Draft" : "Changes"}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setTitle("");
                setContent("");
                setExcerpt("");
              }}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {!editing &&
        (loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-fuchsia-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first news post or blog article.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{post.title}</div>
                  {post.excerpt && (
                    <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {post.excerpt}
                    </div>
                  )}
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      post.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.status}
                  </span>
                  <button
                    onClick={() => startEdit(post)}
                    className="p-1.5 rounded-lg hover:bg-fuchsia-50 text-gray-500 hover:text-fuchsia-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
