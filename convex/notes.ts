import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { prospectId: v.string() },
  handler: async (ctx, { prospectId }) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .first();
    return note?.content ?? "";
  },
});

export const set = mutation({
  args: { prospectId: v.string(), content: v.string() },
  handler: async (ctx, { prospectId, content }) => {
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { content });
    } else {
      await ctx.db.insert("notes", { prospectId, content });
    }
  },
});
