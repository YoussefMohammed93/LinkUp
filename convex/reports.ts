import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export const createReport = mutation(
  async (
    { db, auth },
    { postId, reason }: { postId: Id<"posts">; reason: string }
  ) => {
    const userIdentity = await auth.getUserIdentity();

    if (!userIdentity) {
      throw new Error("User must be authenticated to report a post.");
    }

    const reporter = await db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), userIdentity.subject))
      .unique();

    if (!reporter) {
      throw new Error("Reporter not found in the database.");
    }

    const createdAt = Date.now();
    await db.insert("reports", {
      postId,
      reporterId: reporter._id,
      reason,
      createdAt,
    });

    return { success: true };
  }
);
