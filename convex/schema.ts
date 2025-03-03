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
    edited: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("byPost", ["postId"])
    .index("byAuthor", ["authorId"]),

  commentLikes: defineTable({
    commentId: v.id("comments"),
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
  }).index("byComment", ["commentId"]),

  stories: defineTable({
    content: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    authorId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("byAuthor", ["authorId"])
    .index("byCreationTime", ["createdAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    viewedAt: v.number(),
    hasViewed: v.boolean(),
  })
    .index("byStoryUser", ["storyId", "userId"])
    .index("byStory", ["storyId"])
    .index("byUser", ["userId"]),

  notifications: defineTable({
    type: v.union(
      v.literal("follow"),
      v.literal("comment"),
      v.literal("reaction"),
      v.literal("share"),
      v.literal("bookmark"),
      v.literal("reaction-comment")
    ),
    targetUserId: v.id("users"),
    sender: v.object({
      id: v.id("users"),
      name: v.string(),
      image: v.string(),
    }),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    reaction: v.optional(
      v.union(
        v.literal("like"),
        v.literal("love"),
        v.literal("care"),
        v.literal("haha"),
        v.literal("wow"),
        v.literal("sad"),
        v.literal("angry")
      )
    ),
    timestamp: v.number(),
    read: v.boolean(),
  })
    .index("byTargetUserId", ["targetUserId"])
    .index("byTargetUserAndRead", ["targetUserId", "read"]),

  directMessages: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    content: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    sentAt: v.number(),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.union(v.number(), v.null())),
    updatedAt: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
  })
    .index("bySender", ["senderId"])
    .index("byRecipient", ["recipientId"])
    .index("byConversation", ["senderId", "recipientId"]),
});
