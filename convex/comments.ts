import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { mutation, query } from "./_generated/server";

// Mutation to create a new comment
export const createComment = mutation({
  args: { postId: v.id("posts"), content: v.string() },
  handler: async (ctx, { postId, content }) => {
    const user = await getCurrentUser(ctx);

    if (!user) throw new Error("Unauthorized: User not found");

    return await ctx.db.insert("comments", {
      content,
      authorId: user._id,
      postId,
      createdAt: Date.now(),
    });
  },
});

// Query to get all comments for a given post
export const getCommentsForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db
      .query("comments")
      .withIndex("byPost", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();
  },
});

// Mutation to delete a comment (only by its author)
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const user = await getCurrentUser(ctx);

    if (!user) throw new Error("Unauthorized: User not found");

    const comment = await ctx.db.get(commentId);

    if (!comment) throw new Error("Comment not found");

    const post = await ctx.db.get(comment.postId);

    if (!post) throw new Error("Post not found");

    if (comment.authorId !== user._id && post.authorId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    await ctx.db.delete(commentId);
  },
});
