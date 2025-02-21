import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { mutation, query } from "./_generated/server";

// Mutation: Like a post
export const likePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const existingLikes = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .collect();

    if (existingLikes.length > 0) {
      throw new Error("Post already liked.");
    }

    await ctx.db.insert("likes", {
      postId,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Unlike a post
export const unlikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const likes = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .collect();

    if (likes.length === 0) {
      throw new Error("Like not found.");
    }

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
  },
});

// Query: Count likes for a post
export const countLikes = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("postId"), postId))
      .collect();

    return likes.length;
  },
});

// Query: Check if the current user has liked a post
export const hasLiked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const likes = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .collect();

    return likes.length > 0;
  },
});

// Query: Get users who liked a post
export const getLikes = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("postId"), postId))
      .collect();

    const users = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        return user;
      })
    );

    return users;
  },
});
