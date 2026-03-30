import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns all prospects as plain objects (strips Convex internals). */
export const list = query({
  handler: async (ctx) => {
    const docs = await ctx.db.query("prospects").collect();
    return docs.map(({ _id, _creationTime, prospectId, ...rest }) => ({
      id: prospectId,
      ...rest,
    }));
  },
});

/**
 * Full sync: takes the entire new array, diffs against what's in the DB,
 * and applies creates / updates / deletes.
 * This preserves the `setProspects(prev => ...)` API from the frontend.
 */
export const batchUpsert = mutation({
  args: { prospects: v.array(v.any()) },
  handler: async (ctx, { prospects }) => {
    const existing = await ctx.db.query("prospects").collect();
    const existingMap = new Map(existing.map((doc) => [doc.prospectId, doc._id]));
    const incomingIds = new Set<string>();

    for (const prospect of prospects) {
      const pid = prospect.id as string;
      if (!pid) continue;
      incomingIds.add(pid);

      // Strip the app-level `id` — it's stored as `prospectId`
      const { id, ...data } = prospect as Record<string, unknown>;
      const existingDocId = existingMap.get(pid);

      if (existingDocId) {
        await ctx.db.patch(existingDocId, { prospectId: pid, ...data });
      } else {
        await ctx.db.insert("prospects", { prospectId: pid, ...data });
      }
    }

    // Delete prospects that were removed from the array
    for (const [pid, docId] of existingMap) {
      if (!incomingIds.has(pid)) {
        await ctx.db.delete(docId);
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.query("prospects").filter(q => q.eq(q.field("prospectId"), id)).first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const update = mutation({
  args: { id: v.string(), data: v.any() },
  handler: async (ctx, { id, data }) => {
    const existing = await ctx.db.query("prospects").filter(q => q.eq(q.field("prospectId"), id)).first();
    if (existing) {
      await ctx.db.patch(existing._id, data);
    }
  },
});

/** Check whether any prospects have been seeded yet (used for auto-migration). */
export const isEmpty = query({
  handler: async (ctx) => {
    const first = await ctx.db.query("prospects").first();
    return first === null;
  },
});
