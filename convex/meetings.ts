import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const docs = await ctx.db.query("meetings").collect();
    return docs.map(({ _id, _creationTime, meetingId, ...rest }) => ({
      id: meetingId,
      ...rest,
    }));
  },
});

export const batchUpsert = mutation({
  args: { meetings: v.array(v.any()) },
  handler: async (ctx, { meetings }) => {
    const existing = await ctx.db.query("meetings").collect();
    const existingMap = new Map(existing.map((doc) => [String(doc.meetingId), doc._id]));
    const incomingIds = new Set<string>();

    for (const meeting of meetings) {
      const mid = String(meeting.id);
      incomingIds.add(mid);

      const { id, ...data } = meeting as Record<string, unknown>;
      const existingDocId = existingMap.get(mid);

      if (existingDocId) {
        await ctx.db.patch(existingDocId, { meetingId: meeting.id, ...data });
      } else {
        await ctx.db.insert("meetings", { meetingId: meeting.id, ...data });
      }
    }

    for (const [mid, docId] of existingMap) {
      if (!incomingIds.has(mid)) {
        await ctx.db.delete(docId);
      }
    }
  },
});

export const isEmpty = query({
  handler: async (ctx) => {
    const first = await ctx.db.query("meetings").first();
    return first === null;
  },
});
