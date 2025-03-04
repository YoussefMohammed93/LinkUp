/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as blocks from "../blocks.js";
import type * as bookmarks from "../bookmarks.js";
import type * as chatFriends from "../chatFriends.js";
import type * as commentLikes from "../commentLikes.js";
import type * as comments from "../comments.js";
import type * as directMessages from "../directMessages.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as reports from "../reports.js";
import type * as stories from "../stories.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  blocks: typeof blocks;
  bookmarks: typeof bookmarks;
  chatFriends: typeof chatFriends;
  commentLikes: typeof commentLikes;
  comments: typeof comments;
  directMessages: typeof directMessages;
  follows: typeof follows;
  http: typeof http;
  likes: typeof likes;
  notifications: typeof notifications;
  posts: typeof posts;
  reports: typeof reports;
  stories: typeof stories;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
