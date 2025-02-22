import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    clerkUserId: v.string(),
    bio: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.union(v.string(), v.null())),
    lastActiveAt: v.optional(v.number()),
  }).index("byClerkUserId", ["clerkUserId"]),

  posts: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    authorName: v.string(),
    authorImageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    createdAt: v.number(),
    visibility: v.union(v.literal("public"), v.literal("friends-only")),
  })
    .index("byAuthor", ["authorId"])
    .index("byCreationTime", ["createdAt"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("byFollower", ["followerId"])
    .index("byFollowing", ["followingId"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("byPost", ["postId"]),

  bookmarks: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byPost", ["postId"])
    .index("byUser", ["userId"]),
});
