import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────────────

export const listUploads = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("enrichment_uploads")
      .order("desc")
      .take(20);
  },
});

export const listRows = query({
  args: { uploadId: v.id("enrichment_uploads") },
  handler: async (ctx, { uploadId }) => {
    return await ctx.db
      .query("enrichment_rows")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", uploadId))
      .collect();
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

/**
 * Save the result of a CSV upload + matching run.
 * Returns the upload document ID so the client can link rows to it.
 */
export const saveUpload = mutation({
  args: {
    fileName: v.string(),
    uploadedAt: v.string(),
    totalRows: v.number(),
    matchedCount: v.number(),
    needsReviewCount: v.number(),
    unmatchedCount: v.number(),
    rows: v.array(
      v.object({
        csvCompanyName: v.string(),
        csvCompanyDomain: v.optional(v.string()),
        csvContactName: v.string(),
        csvTitle: v.optional(v.string()),
        csvEmail: v.string(),
        csvLinkedinUrl: v.optional(v.string()),
        matchResult: v.string(),
        matchReason: v.optional(v.string()),
        matchedProspectId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { rows, ...uploadMeta }) => {
    const uploadId = await ctx.db.insert("enrichment_uploads", uploadMeta);
    for (const row of rows) {
      await ctx.db.insert("enrichment_rows", { uploadId, ...row });
    }
    return uploadId;
  },
});

/**
 * Apply a matched/approved enrichment row to the target prospect:
 * - Sets email, linkedin, companyDomain from the CSV
 * - Sets outreachStatus based on whether a draft exists
 * - Marks the row as approved
 */
export const applyMatch = mutation({
  args: {
    rowId: v.id("enrichment_rows"),
    prospectId: v.string(),
    email: v.string(),
    linkedinUrl: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
  },
  handler: async (ctx, { rowId, prospectId, email, linkedinUrl, companyDomain }) => {
    // Mark row reviewed
    await ctx.db.patch(rowId, { reviewStatus: "approved" });

    // Find prospect in DB
    const doc = await ctx.db
      .query("prospects")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .first();
    if (!doc) return;

    const hasDraft = !!(doc.draftEmail && doc.draftEmail.trim());
    const newStatus = hasDraft ? "ready_to_send" : "enriched";

    const patch: Record<string, unknown> = {
      email,
      outreachStatus: newStatus,
    };
    if (linkedinUrl) patch.linkedin = linkedinUrl;
    if (companyDomain) patch.companyDomain = companyDomain;

    await ctx.db.patch(doc._id, patch);
  },
});

/**
 * Reject a needs_review row (no changes to prospect).
 */
export const rejectRow = mutation({
  args: { rowId: v.id("enrichment_rows") },
  handler: async (ctx, { rowId }) => {
    await ctx.db.patch(rowId, { reviewStatus: "rejected" });
  },
});

/**
 * Batch-apply all auto-matched rows from an upload.
 * Called once by the client after saving the upload.
 */
export const applyAllMatched = mutation({
  args: { uploadId: v.id("enrichment_uploads") },
  handler: async (ctx, { uploadId }) => {
    const rows = await ctx.db
      .query("enrichment_rows")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", uploadId))
      .collect();

    for (const row of rows) {
      if (row.matchResult !== "matched" || !row.matchedProspectId) continue;

      const doc = await ctx.db
        .query("prospects")
        .withIndex("by_prospectId", (q) => q.eq("prospectId", row.matchedProspectId!))
        .first();
      if (!doc) continue;

      const hasDraft = !!(doc.draftEmail && doc.draftEmail.trim());
      const patch: Record<string, unknown> = {
        email: row.csvEmail,
        outreachStatus: hasDraft ? "ready_to_send" : "enriched",
      };
      if (row.csvLinkedinUrl) patch.linkedin = row.csvLinkedinUrl;
      if (row.csvCompanyDomain) patch.companyDomain = row.csvCompanyDomain;

      await ctx.db.patch(doc._id, patch);
    }
  },
});
