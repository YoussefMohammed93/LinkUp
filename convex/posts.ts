import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { query, mutation } from "./_generated/server";

// Create a new post
export const createPost = mutation({
  args: {
    content: v.string(),
    images: v.optional(v.array(v.string())),
    visibility: v.union(v.literal("public"), v.literal("friends-only")),
  },
  handler: async (ctx, { content, images, visibility }) => {
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
      visibility,
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
  args: {
    userId: v.id("users"),
    includeFriendsPosts: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, includeFriendsPosts }) => {
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("byAuthor", (q) => q.eq("authorId", userId));

    if (!includeFriendsPosts) {
      postsQuery = postsQuery.filter((q) =>
        q.eq(q.field("visibility"), "public")
      );
    }

    return await postsQuery.order("desc").collect();
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

// Query: Get posts for the feed
export const getFeedPosts = query({
  args: { currentUserId: v.optional(v.id("users")) },
  async handler(ctx, { currentUserId }) {
    let currentUser = await getCurrentUser(ctx);
    if (!currentUser && currentUserId) {
      currentUser = await ctx.db.get(currentUserId);
    }

    if (!currentUser) {
      return await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("visibility"), "public"))
        .order("desc")
        .collect();
    }

    const blocks = await ctx.db
      .query("blocks")
      .filter((q) =>
        q.or(
          q.eq(q.field("blockerId"), currentUser._id),
          q.eq(q.field("blockedId"), currentUser._id)
        )
      )
      .collect();

    const blockedIds = new Set<string>();
    for (const block of blocks) {
      if (block.blockerId === currentUser._id) {
        blockedIds.add(block.blockedId);
      }
      if (block.blockedId === currentUser._id) {
        blockedIds.add(block.blockerId);
      }
    }

    const ownPosts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), currentUser._id))
      .order("desc")
      .collect();

    const publicPosts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("visibility"), "public"),
          q.neq(q.field("authorId"), currentUser._id)
        )
      )
      .order("desc")
      .collect();

    const friendPosts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("visibility"), "friends-only"),
          q.neq(q.field("authorId"), currentUser._id)
        )
      )
      .order("desc")
      .collect();

    const feedFriendPosts = [];
    for (const post of friendPosts) {
      const currentFollows = await ctx.db
        .query("follows")
        .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
        .filter((q) => q.eq(q.field("followingId"), post.authorId))
        .unique();

      const authorFollows = await ctx.db
        .query("follows")
        .withIndex("byFollower", (q) => q.eq("followerId", post.authorId))
        .filter((q) => q.eq(q.field("followingId"), currentUser._id))
        .unique();

      if (currentFollows && authorFollows) {
        feedFriendPosts.push(post);
      }
    }

    const allPosts = [...ownPosts, ...publicPosts, ...feedFriendPosts];
    const filteredPosts = allPosts.filter(
      (post) => !blockedIds.has(post.authorId)
    );

    return filteredPosts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Mutation: Share a post
export const sharePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    visibility: v.union(v.literal("public"), v.literal("friends-only")),
  },
  handler: async (ctx, { postId, content, visibility }) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    const originalPost = await ctx.db.get(postId);

    if (!originalPost) {
      throw new Error("Cannot share a post that doesn't exist.");
    }

    const realOriginalPostId = originalPost.sharedPostId
      ? originalPost.sharedPostId
      : postId;

    await ctx.db.insert("posts", {
      content,
      authorId: user._id,
      authorName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      authorImageUrl: user.imageUrl,
      images: [],
      createdAt: Date.now(),
      visibility,
      sharedPostId: realOriginalPostId,
    });
  },
});
