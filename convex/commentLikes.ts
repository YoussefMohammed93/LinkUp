import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { mutation, query } from "./_generated/server";

// Query: Get all reactions for a given comment
export const getLikes = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const commentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("byComment", (q) => q.eq("commentId", commentId))
      .collect();

    return commentLikes;
  },
});

// Query: Get the current user’s reaction on a given comment
export const getReaction = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reaction = await ctx.db
      .query("commentLikes")
      .filter((q) =>
        q.and(
          q.eq(q.field("commentId"), commentId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .first();

    return reaction ? reaction.reaction : null;
  },
});

// Mutation: React to a comment (add, update, or remove reaction)
export const reactToComment = mutation({
  args: {
    commentId: v.id("comments"),
    reaction: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("care"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
  },
  handler: async (ctx, { commentId, reaction }) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const existing = await ctx.db
      .query("commentLikes")
      .filter((q) =>
        q.and(
          q.eq(q.field("commentId"), commentId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .first();

    if (existing) {
      if (existing.reaction === reaction) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { reaction, createdAt: Date.now() });
      }
    } else {
      await ctx.db.insert("commentLikes", {
        commentId,
        userId: user._id,
        reaction,
        createdAt: Date.now(),
      });
    }

    const comment = await ctx.db.get(commentId);
    if (comment && comment.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        type: "reaction",
        targetUserId: comment.authorId,
        sender: {
          id: user._id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          image: user.imageUrl || "",
        },
        timestamp: Date.now(),
        read: false,
      });
    }
  },
});
