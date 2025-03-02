import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { mutation, query } from "./_generated/server";

// Mutation to create a new comment
export const createComment = mutation({
  args: {
    content: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { content, postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized: User not found.");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found.");

    const comment = {
      content,
      authorId: user._id,
      postId,
      createdAt: Date.now(),
    };

    await ctx.db.insert("comments", comment);

    if (post.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        type: "comment",
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

// Mutation to delete a comment (only by its author or the post author)
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

// Mutation to update a comment (only by its author)
export const updateComment = mutation({
  args: { commentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { commentId, content }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized: User not found");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== user._id) {
      throw new Error("Unauthorized: You can only update your own comments");
    }

    await ctx.db.patch(commentId, { content, edited: true });
  },
});
