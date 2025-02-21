import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { query, mutation } from "./_generated/server";

// Create a new post
export const createPost = mutation({
  args: {
    content: v.string(),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { content, images }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const post = {
      content,
      authorId: user._id,
      authorName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      authorImageUrl: user.imageUrl,
      images: images || [],
      createdAt: Date.now(),
    };

    await ctx.db.insert("posts", post);
  },
});

// Query: Get all posts, ordered by creation time (newest first)
export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").collect();
  },
});

// Query: Get posts by the current user
export const getMyPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("posts")
      .withIndex("byAuthor", (q) => q.eq("authorId", user._id))
      .order("desc")
      .collect();
  },
});

// Query: Get a single post by ID
export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    return post;
  },
});

// Delete a post (only by the author)
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.authorId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own posts.");
    }

    await ctx.db.delete(postId);
  },
});

// Query: Get all posts by a specific user
export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("posts")
      .withIndex("byAuthor", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();
  },
});

// Query: Get posts by users that the current user follows
export const getFollowingPosts = query({
  args: {},
  async handler(ctx) {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const followRecords = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followingIds = followRecords.map((record) => record.followingId);

    if (followingIds.length === 0) return [];

    return await ctx.db
      .query("posts")
      .filter((q) =>
        q.or(...followingIds.map((id) => q.eq(q.field("authorId"), id)))
      )
      .order("desc")
      .collect();
  },
});
