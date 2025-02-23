import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

// Helper function to get a user by their Clerk user ID.
async function userByClerkUserId(ctx: QueryCtx, clerkUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

// Block a user.
export const blockUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, { targetUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) throw new Error("Current user not found");

    if (currentUser._id === targetUserId)
      throw new Error("Cannot block yourself");

    const followsCurrentToTarget = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
      .filter((q) => q.eq(q.field("followingId"), targetUserId))
      .collect();
    for (const record of followsCurrentToTarget) {
      await ctx.db.delete(record._id);
    }

    const followsTargetToCurrent = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", targetUserId))
      .filter((q) => q.eq(q.field("followingId"), currentUser._id))
      .collect();
    for (const record of followsTargetToCurrent) {
      await ctx.db.delete(record._id);
    }

    const postsByTarget = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), targetUserId))
      .collect();
    const postIds = postsByTarget.map((post) => post._id);
    if (postIds.length > 0) {
      const bookmarksToRemove = await ctx.db
        .query("bookmarks")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), currentUser._id),
            q.or(...postIds.map((id) => q.eq(q.field("postId"), id)))
          )
        )
        .collect();
      for (const bookmark of bookmarksToRemove) {
        await ctx.db.delete(bookmark._id);
      }
    }

    const existingBlock = await ctx.db
      .query("blocks")
      .withIndex("byBlocker", (q) => q.eq("blockerId", currentUser._id))
      .filter((q) => q.eq(q.field("blockedId"), targetUserId))
      .unique();
    if (existingBlock) throw new Error("User is already blocked");

    await ctx.db.insert("blocks", {
      blockerId: currentUser._id,
      blockedId: targetUserId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Unblock a user.
export const unblockUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, { targetUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) throw new Error("Current user not found");

    if (currentUser._id === targetUserId)
      throw new Error("Cannot unblock yourself");

    const blockRecord = await ctx.db
      .query("blocks")
      .withIndex("byBlocker", (q) => q.eq("blockerId", currentUser._id))
      .filter((q) => q.eq(q.field("blockedId"), targetUserId))
      .unique();

    if (!blockRecord) throw new Error("Block record not found");

    await ctx.db.delete(blockRecord._id);
    return { success: true };
  },
});

// Get a list of users blocked by the current user.
export const getBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) throw new Error("User not found");

    return await ctx.db
      .query("blocks")
      .withIndex("byBlocker", (q) => q.eq("blockerId", currentUser._id))
      .collect();
  },
});

// Check if a user is blocked by another user.
export const isBlockedBy = query({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, { blockerId, blockedId }) => {
    const blockRecord = await ctx.db
      .query("blocks")
      .withIndex("byBlocker", (q) => q.eq("blockerId", blockerId))
      .filter((q) => q.eq(q.field("blockedId"), blockedId))
      .unique();
    return blockRecord !== null;
  },
});

// Get a list of block records for the current user.
export const getUserBlockRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) throw new Error("User not found");

    return await ctx.db
      .query("blocks")
      .filter((q) =>
        q.or(
          q.eq(q.field("blockerId"), currentUser._id),
          q.eq(q.field("blockedId"), currentUser._id)
        )
      )
      .collect();
  },
});
