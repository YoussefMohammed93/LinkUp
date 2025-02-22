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
