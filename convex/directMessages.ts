import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDirectMessages = query({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, { user1, user2 }) => {
    const messages1 = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), user1),
          q.eq(q.field("recipientId"), user2),
          q.eq(q.field("deleted"), false)
        )
      )
      .collect();

    const messages2 = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), user2),
          q.eq(q.field("recipientId"), user1),
          q.eq(q.field("deleted"), false)
        )
      )
      .collect();

    const allMessages = [...messages1, ...messages2].sort(
      (a, b) => a.sentAt - b.sentAt
    );
    return allMessages;
  },
});

export const sendDirectMessage = mutation({
  args: {
    recipientId: v.id("users"),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    content: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { recipientId, messageType, content, attachments }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!currentUser) throw new Error("Current user not found");

    const now = Date.now();
    const message = {
      senderId: currentUser._id,
      recipientId,
      messageType,
      content,
      attachments,
      sentAt: now,
      deliveredAt: now,
      readAt: null,
      updatedAt: undefined,
      deleted: false,
    };

    await ctx.db.insert("directMessages", message);
    return message;
  },
});

export const markDirectMessagesRead = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, { user1, user2 }) => {
    const messages = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), user2),
          q.eq(q.field("recipientId"), user1),
          q.eq(q.field("readAt"), null)
        )
      )
      .collect();
    const now = Date.now();
    await Promise.all(
      messages.map((msg) => ctx.db.patch(msg._id, { readAt: now }))
    );
    return { success: true };
  },
});

export const countUnreadMessages = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unreadMessages = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("recipientId"), userId),
          q.eq(q.field("readAt"), null)
        )
      )
      .collect();
    return unreadMessages.length;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    newContent: v.string(),
  },
  handler: async (ctx, { messageId, newContent }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("Current user not found");

    if (message.senderId !== currentUser._id) {
      throw new Error("Unauthorized to edit this message");
    }

    await ctx.db.patch(messageId, {
      content: newContent,
      edited: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("directMessages") },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("Current user not found");

    if (message.senderId !== currentUser._id) {
      throw new Error("Unauthorized to delete this message");
    }

    await ctx.db.patch(messageId, { deleted: true });
    return { success: true };
  },
});
