import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Core collections (migrated from localStorage) ─────────────────────────

  prospects: defineTable({
    // App-level ID (e.g. "p1", "p_abc123") — indexed for fast lookup
    prospectId: v.string(),
    // Core fields
    company: v.optional(v.string()),
    industry: v.optional(v.string()),
    score: v.optional(v.number()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    decisionMaker: v.optional(v.string()),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    companyLinkedin: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    trigger: v.optional(v.string()),
    painPoints: v.optional(v.array(v.string())),
    techStack: v.optional(v.string()),
    useCase: v.optional(v.string()),
    draftSubject: v.optional(v.string()),
    draftEmail: v.optional(v.string()),
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.string()),
    linkedinSearch: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    // Outreach pipeline
    // extracted | missing_email | enriched | ready_to_send | scheduled |
    // sent | delivered | opened | replied | bounced | failed | do_not_send
    outreachStatus: v.optional(v.string()),
    resendMessageId: v.optional(v.string()),
    lastSentAt: v.optional(v.string()),
    bounced: v.optional(v.boolean()),
    doNotSend: v.optional(v.boolean()),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_outreachStatus", ["outreachStatus"]),

  meetings: defineTable({
    meetingId: v.union(v.string(), v.number()),
    prospectId: v.string(),
    date: v.string(),
    link: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_meetingId", ["meetingId"]),

  reports_history: defineTable({
    reportId: v.union(v.string(), v.number()),
    name: v.string(),
    date: v.string(),
    count: v.string(),
  }).index("by_reportId", ["reportId"]),

  notes: defineTable({
    prospectId: v.string(),
    content: v.string(),
  }).index("by_prospectId", ["prospectId"]),

  // ─── Enrichment pipeline ───────────────────────────────────────────────────

  enrichment_uploads: defineTable({
    uploadedAt: v.string(),
    fileName: v.string(),
    totalRows: v.number(),
    matchedCount: v.number(),
    needsReviewCount: v.number(),
    unmatchedCount: v.number(),
  }).index("by_uploadedAt", ["uploadedAt"]),

  enrichment_rows: defineTable({
    uploadId: v.id("enrichment_uploads"),
    // Apollo CSV data
    csvCompanyName: v.string(),
    csvCompanyDomain: v.optional(v.string()),
    csvContactName: v.string(),
    csvTitle: v.optional(v.string()),
    csvEmail: v.string(),
    csvLinkedinUrl: v.optional(v.string()),
    // Matching result: 'matched' | 'needs_review' | 'unmatched'
    matchResult: v.string(),
    matchReason: v.optional(v.string()),
    matchedProspectId: v.optional(v.string()),
    // User action on needs_review: 'approved' | 'rejected' | null
    reviewStatus: v.optional(v.string()),
  })
    .index("by_uploadId", ["uploadId"])
    .index("by_matchResult", ["matchResult"]),

  // ─── Outreach pipeline tables ───────────────────────────────────────────────

  send_queue: defineTable({
    prospectId: v.string(),
    emailTo: v.string(),
    subject: v.string(),
    body: v.string(),
    // 'queued' | 'sending' | 'sent' | 'failed' | 'paused' | 'discarded'
    status: v.string(),
    scheduledAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    resendMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_prospectId", ["prospectId"]),

  // Idempotent event log — one row per (resendMessageId + eventType) pair
  email_events: defineTable({
    resendMessageId: v.string(),
    prospectId: v.string(),
    // 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed'
    eventType: v.string(),
    occurredAt: v.string(),
    rawPayload: v.string(), // JSON string of the full Resend webhook payload
  })
    .index("by_resendMessageId_eventType", ["resendMessageId", "eventType"])
    .index("by_prospectId", ["prospectId"]),
});
