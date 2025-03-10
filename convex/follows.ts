import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const isFollowing = query({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  async handler(ctx, { followerId, followingId }) {
    const record = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("followingId"), followingId))
      .unique();
    return record !== null;
  },
});

export const isFollowedBy = query({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  async handler(ctx, { followerId, followingId }) {
    const record = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("followingId"), followingId))
      .unique();
    return record !== null;
  },
});

export const followUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  async handler(ctx, { targetUserId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("Current user not found");

    if (currentUser._id === targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    const existingFollows = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    if (existingFollows.find((record) => record.followingId === targetUserId)) {
      throw new Error("Already following this user");
    }

    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: targetUserId,
    });

    await ctx.db.insert("notifications", {
      type: "follow",
      targetUserId,
      sender: {
        id: currentUser._id,
        name: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
        image: currentUser.imageUrl || "",
      },
      timestamp: Date.now(),
      read: false,
    });

    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: { targetUserId: v.id("users") },
  async handler(ctx, { targetUserId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("Current user not found");

    if (currentUser._id === targetUserId)
      throw new Error("Cannot unfollow yourself");

    const followRecord = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
      .filter((q) => q.eq(q.field("followingId"), targetUserId))
      .unique();

    if (followRecord) {
      await ctx.db.delete(followRecord._id);
    }

    return { success: true };
  },
});

export const getFollowersCount = query({
  args: { userId: v.id("users") },
  async handler(ctx, { userId }) {
    return await ctx.db
      .query("follows")
      .withIndex("byFollowing", (q) => q.eq("followingId", userId))
      .collect();
  },
});

export const getFollowingCount = query({
  args: { userId: v.id("users") },
  async handler(ctx, { userId }) {
    return await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", userId))
      .collect();
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  async handler(ctx, { userId }) {
    const followRecords = await ctx.db
      .query("follows")
      .withIndex("byFollowing", (q) => q.eq("followingId", userId))
      .collect();

    const followerIds = followRecords.map((record) => record.followerId);

    const followers = await Promise.all(
      followerIds.map(async (id) => await ctx.db.get(id))
    );

    return followers;
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  async handler(ctx, { userId }) {
    const followRecords = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", userId))
      .collect();

    const followingIds = followRecords.map((record) => record.followingId);

    const following = await Promise.all(
      followingIds.map(async (id) => await ctx.db.get(id))
    );

    return following;
  },
});
