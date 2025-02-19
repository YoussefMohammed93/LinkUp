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
  }).index("byClerkUserId", ["clerkUserId"]),

  posts: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    authorName: v.string(),
    authorImageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("byAuthor", ["authorId"])
    .index("byCreationTime", ["createdAt"]),
});
