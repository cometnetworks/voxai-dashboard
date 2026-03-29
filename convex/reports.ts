import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const docs = await ctx.db.query("reports_history").collect();
    return docs.map(({ _id, _creationTime, reportId, ...rest }) => ({
      id: reportId,
      ...rest,
    }));
  },
});

export const batchUpsert = mutation({
  args: { reports: v.array(v.any()) },
  handler: async (ctx, { reports }) => {
    const existing = await ctx.db.query("reports_history").collect();
    const existingMap = new Map(existing.map((doc) => [String(doc.reportId), doc._id]));
    const incomingIds = new Set<string>();

    for (const report of reports) {
      const rid = String(report.id);
      incomingIds.add(rid);

      const { id, ...data } = report as Record<string, unknown>;
      const existingDocId = existingMap.get(rid);

      if (existingDocId) {
        await ctx.db.patch(existingDocId, { reportId: report.id, ...data });
      } else {
        await ctx.db.insert("reports_history", { reportId: report.id, ...data });
      }
    }

    for (const [rid, docId] of existingMap) {
      if (!incomingIds.has(rid)) {
        await ctx.db.delete(docId);
      }
    }
  },
});

export const isEmpty = query({
  handler: async (ctx) => {
    const first = await ctx.db.query("reports_history").first();
    return first === null;
  },
});
