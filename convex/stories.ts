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
