import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { mutation, query } from "./_generated/server";

export const getLikes = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("postId"), postId))
      .collect();

    const reactions = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        return {
          reaction: like.reaction,
          firstName: user?.firstName,
          lastName: user?.lastName,
        };
      })
    );

    return reactions;
  },
});

export const reactToPost = mutation({
  args: {
    postId: v.id("posts"),
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
  handler: async (ctx, { postId, reaction }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const existing = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
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
      await ctx.db.insert("likes", {
        postId,
        userId: user._id,
        reaction,
        createdAt: Date.now(),
      });
    }
  },
});

export const getReaction = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reaction = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), postId),
          q.eq(q.field("userId"), user._id)
        )
      )
      .first();

    return reaction ? reaction.reaction : null;
  },
});
