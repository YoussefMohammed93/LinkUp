import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";

import { v, Validator } from "convex/values";
import { UserJSON } from "@clerk/nextjs/server";

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getRecentUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(5);
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      email: data.email_addresses[0].email_address,
      clerkUserId: data.id,
      imageUrl: data.image_url ?? undefined,
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
    };

    const user = await userByClerkUserId(ctx, data.id);

    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByClerkUserId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(`User with clerkUserId ${clerkUserId} not found`);
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);

  if (!userRecord) throw new Error("Can't get current user");

  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) return null;

  return await userByClerkUserId(ctx, identity.subject);
}

async function userByClerkUserId(ctx: QueryCtx, clerkUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export const updateUser = mutation({
  args: {
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      bio: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      coverImageUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await userByClerkUserId(ctx, identity.subject);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, updates);
    const updatedUser = await userByClerkUserId(ctx, identity.subject);

    if (!updatedUser) {
      throw new Error("User not found after update");
    }

    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const newAuthorName =
        `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim();

      const userPosts = await ctx.db
        .query("posts")
        .withIndex("byAuthor", (q) => q.eq("authorId", user._id))
        .collect();

      await Promise.all(
        userPosts.map((post) =>
          ctx.db.patch(post._id, { authorName: newAuthorName })
        )
      );
    }

    return updatedUser;
  },
});

export const getUserById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (user === null) {
      throw new Error("User not found");
    }

    return user;
  },
});

export const updateOnlineStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const user = await userByClerkUserId(ctx, identity.subject);

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { lastActiveAt: now });

    return { success: true, lastActiveAt: now };
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  async handler(ctx, { query }) {
    const allUsers = await ctx.db.query("users").collect();
    const lowerQuery = query.toLowerCase();

    return allUsers.filter((user) => {
      return (
        (user.firstName && user.firstName.toLowerCase().includes(lowerQuery)) ||
        (user.lastName && user.lastName.toLowerCase().includes(lowerQuery)) ||
        (user.jobTitle && user.jobTitle.toLowerCase().includes(lowerQuery)) ||
        (user.email && user.email.toLowerCase().includes(lowerQuery))
      );
    });
  },
});
