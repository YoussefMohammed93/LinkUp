/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";

async function userByClerkUserId(ctx: QueryCtx, clerkUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export const createStory = mutation({
  args: {
    content: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
  },
  async handler(ctx, { content, imageUrls }) {
    if (!content && (!imageUrls || imageUrls.length === 0)) {
      throw new Error("Please provide text content or at least one image.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await userByClerkUserId(ctx, identity.subject);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;

    return await ctx.db.insert("stories", {
      content,
      imageUrls,
      authorId: user._id,
      createdAt: now,
      expiresAt,
    });
  },
});

export const getActiveStories = query(async ({ db }) => {
  const now = Date.now();

  const stories = await db
    .query("stories")
    .filter((q) => q.gt(q.field("expiresAt"), now))
    .collect();

  if (stories.length === 0) return [];

  const authorIds = stories.map((story) => story.authorId);

  const uniqueAuthorIdStrings = new Set(authorIds.map((id) => id.toString()));

  const uniqueAuthorIds = Array.from(uniqueAuthorIdStrings).map(
    (idString) => idString as Id<"users">
  );

  const userRecords = await Promise.all(
    uniqueAuthorIds.map(async (idObj) => {
      const user = await db.get(idObj);
      return { userId: idObj, user };
    })
  );

  const userMap = new Map<string, any>();
  for (const { userId, user } of userRecords) {
    if (user) {
      userMap.set(userId.toString(), user);
    }
  }

  return stories.map((story) => {
    const author = userMap.get(story.authorId.toString());
    const authorName = author
      ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim()
      : "Unknown";
    const authorAvatar = author?.imageUrl || "/avatar-placeholder.png";

    return {
      ...story,
      authorName,
      authorAvatar,
    };
  });
});

export const removeExpiredStories = mutation({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const expiredStories = await ctx.db
      .query("stories")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    await Promise.all(expiredStories.map((story) => ctx.db.delete(story._id)));
    return { success: true, removed: expiredStories.length };
  },
});

export const deleteStory = mutation({
  args: { storyId: v.id("stories") },
  async handler(ctx, { storyId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    const user = await ctx.db.get(story.authorId);
    if (!user || user.clerkUserId !== identity.subject) {
      throw new Error("Unauthorized: not the story author");
    }

    await ctx.db.delete(storyId);
    return { success: true };
  },
});

export const getStoryViewCount = query({
  args: { storyId: v.id("stories") },
  async handler(ctx, { storyId }) {
    const views = await ctx.db
      .query("storyViews")
      .withIndex("byStory", (q) => q.eq("storyId", storyId))
      .collect();

    return views.length;
  },
});

export const hasViewed = query({
  args: { storyId: v.id("stories") },
  async handler(ctx, { storyId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const userId = identity.subject as Id<"users">;

    const view = await ctx.db
      .query("storyViews")
      .filter((q) =>
        q.and(q.eq("storyId", storyId as any), q.eq("userId", userId as any))
      )
      .unique();

    return view !== null;
  },
});

export const getActiveFriendStories = query({
  args: {},
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const now = Date.now();

    const activeStories = await ctx.db
      .query("stories")
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    const followingRecords = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followingSet = new Set(
      followingRecords.map((record) => record.followingId.toString())
    );

    const followerRecords = await ctx.db
      .query("follows")
      .withIndex("byFollowing", (q) => q.eq("followingId", currentUser._id))
      .collect();

    const followersSet = new Set(
      followerRecords.map((record) => record.followerId.toString())
    );

    const friendStories = activeStories.filter((story) => {
      const authorIdStr = story.authorId.toString();
      return (
        authorIdStr === currentUser._id.toString() ||
        (followingSet.has(authorIdStr) && followersSet.has(authorIdStr))
      );
    });

    const authorIds = friendStories.map((story) => story.authorId);
    const uniqueAuthorIds = Array.from(
      new Set(authorIds.map((id) => id.toString()))
    ).map((idStr) => idStr as Id<"users">);
    const authorRecords = await Promise.all(
      uniqueAuthorIds.map(async (id) => await ctx.db.get(id))
    );

    const authorMap = new Map(
      authorRecords
        .filter(
          (author): author is NonNullable<typeof author> => author !== null
        )
        .map((author) => [author._id.toString(), author])
    );

    return friendStories.map((story) => {
      const author = authorMap.get(story.authorId.toString());
      const authorName =
        author !== null && author !== undefined
          ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim() ||
            "Unknown"
          : "Unknown";
      const authorAvatar =
        author !== null && author !== undefined
          ? (author.imageUrl ?? "/avatar-placeholder.png")
          : "/avatar-placeholder.png";
      return {
        ...story,
        authorName,
        authorAvatar,
      };
    });
  },
});
