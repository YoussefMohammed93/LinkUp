import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Query: Get notifications for the current user
export const getNotificationsForUser = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      return [];
    }

    return await ctx.db
      .query("notifications")
      .withIndex("byTargetUserId", (q) => q.eq("targetUserId", currentUser._id))
      .order("desc")
      .collect();
  },
});

// Mutation: Mark all notifications as read for the current user
export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Unauthorized: User not found.");
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("byTargetUserId", (q) => q.eq("targetUserId", currentUser._id))
      .collect();

    for (const notification of notifications) {
      if (!notification.read) {
        await ctx.db.patch(notification._id, { read: true });
      }
    }
  },
});

// Mutation: Create a new notification (to be called when an event occurs)
export const createNotification = mutation({
  args: {
    type: v.union(
      v.literal("follow"),
      v.literal("comment"),
      v.literal("reaction"),
      v.literal("share"),
      v.literal("bookmark")
    ),
    targetUserId: v.id("users"),
    senderId: v.id("users"),
    senderName: v.string(),
    senderImage: v.string(),
    postId: v.optional(v.id("posts")),
  },
  handler: async (
    ctx,
    { type, targetUserId, senderId, senderName, senderImage, postId }
  ) => {
    await ctx.db.insert("notifications", {
      type,
      targetUserId,
      sender: {
        id: senderId,
        name: senderName,
        image: senderImage,
      },
      postId,
      timestamp: Date.now(),
      read: false,
    });
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);

    if (!notification) {
      throw new Error("Notification not found.");
    }

    await ctx.db.patch(notificationId, { read: true });

    return { success: true };
  },
});

export const countUnreadNotifications = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("byTargetUserAndRead", (q) =>
        q.eq("targetUserId", currentUser._id).eq("read", false)
      )
      .collect();
    return unreadNotifications.length;
  },
});
