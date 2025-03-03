import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const getChatFriends = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const currentUserId = currentUser._id;

    const followingRecords = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", currentUserId))
      .collect();

    const followingIds = followingRecords.map((rec) => rec.followingId);

    const followerRecords = await ctx.db
      .query("follows")
      .withIndex("byFollowing", (q) => q.eq("followingId", currentUserId))
      .collect();

    const followerIds = followerRecords.map((rec) => rec.followerId);

    const mutualIds = followingIds.filter((id) => followerIds.includes(id));

    const friendPromises = mutualIds.map(async (id) => {
      const friend = await ctx.db.get(id);

      if (!friend) return null;

      const messages = await ctx.db
        .query("directMessages")
        .filter((q) =>
          q.or(
            q.and(
              q.eq(q.field("senderId"), currentUserId),
              q.eq(q.field("recipientId"), id)
            ),
            q.and(
              q.eq(q.field("senderId"), id),
              q.eq(q.field("recipientId"), currentUserId)
            )
          )
        )
        .collect();

      const sortedMessages = messages.sort((a, b) => a.sentAt - b.sentAt);

      const lastMessageObj =
        sortedMessages.length > 0
          ? sortedMessages[sortedMessages.length - 1]
          : null;

      const unreadMessages = messages.filter(
        (msg) => msg.senderId === id && msg.readAt == null
      );

      const unreadCount = unreadMessages.length;

      return {
        ...friend,
        chatId:
          currentUserId < id
            ? `${currentUserId}_${id}`
            : `${id}_${currentUserId}`,
        lastMessage: lastMessageObj?.content || "",
        lastMessageTime: lastMessageObj ? lastMessageObj.sentAt : null,
        lastMessageSenderId: lastMessageObj?.senderId || "",
        unreadCount,
      };
    });

    const friendsWithChatData = (await Promise.all(friendPromises)).filter(
      (f) => f !== null
    );
    return friendsWithChatData;
  },
});
