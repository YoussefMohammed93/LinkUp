import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { query, mutation } from "./_generated/server";

// Create a new bookmark
export const addBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const existing = await ctx.db
      .query("bookmarks")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("bookmarks", {
      postId,
      userId: user._id,
      createdAt: Date.now(),
    });

    const post = await ctx.db.get(postId);

    if (post && post.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        type: "bookmark",
        targetUserId: post.authorId,
        sender: {
          id: user._id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          image: user.imageUrl || "",
        },

        postId,
        timestamp: Date.now(),
        read: false,
      });
    }
  },
});

// Remove a bookmark
export const removeBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .unique();

    if (!bookmark) {
      throw new Error("Bookmark not found.");
    }

    await ctx.db.delete(bookmark._id);
  },
});

// Query: Check if a post has been bookmarked by the current user
export const hasBookmarked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const bookmark = await ctx.db
      .query("bookmarks")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .unique();

    return Boolean(bookmark);
  },
});

// Query: Get all bookmarked posts for the current user
export const getBookmarkedPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const postIds = bookmarks.map((bookmark) => bookmark.postId);
    if (postIds.length === 0) return [];

    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.or(...postIds.map((id) => q.eq(q.field("_id"), id))))
      .order("desc")
      .collect();

    return posts;
  },
});
