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
    lastActiveAt: v.optional(v.number()),
    coverImageUrl: v.optional(v.union(v.string(), v.null())),
  }).index("byClerkUserId", ["clerkUserId"]),

  posts: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    authorName: v.string(),
    createdAt: v.number(),
    authorImageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    sharedPostId: v.optional(v.id("posts")),
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
    reaction: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("care"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
    createdAt: v.number(),
  }).index("byPost", ["postId"]),

  bookmarks: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byPost", ["postId"])
    .index("byUser", ["userId"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byBlocker", ["blockerId"])
    .index("byBlocked", ["blockedId"]),

  reports: defineTable({
    postId: v.id("posts"),
    reporterId: v.id("users"),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("byPost", ["postId"])
    .index("byReporter", ["reporterId"]),

  comments: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("byPost", ["postId"])
    .index("byAuthor", ["authorId"]),
});
