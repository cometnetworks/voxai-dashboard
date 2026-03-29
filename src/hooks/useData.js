import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { defaultProspects, defaultMeetings } from '../data/mockData';

/**
 * Central data hook — backed by Convex (cross-device, real-time).
 *
 * Maintains the exact same interface as the previous localStorage version:
 *   { prospects, setProspects, meetings, setMeetings,
 *     reportsHistory, setReportsHistory, isLoading }
 *
 * One-time auto-migration:
 *   On first load, if Convex DB is empty, this hook seeds it from:
 *     1. localStorage (existing user data), or
 *     2. mockData defaults (fresh install)
 */
export function useData() {
  // ── Convex reactive queries ────────────────────────────────────────────────
  const prospectsData    = useQuery(api.prospects.list);
  const meetingsData     = useQuery(api.meetings.list);
  const reportsData      = useQuery(api.reports.list);

  const prospectsEmpty   = useQuery(api.prospects.isEmpty);
  const meetingsEmpty    = useQuery(api.meetings.isEmpty);
  const reportsEmpty     = useQuery(api.reports.isEmpty);

  // ── Convex mutations ───────────────────────────────────────────────────────
  const upsertProspects  = useMutation(api.prospects.batchUpsert);
  const upsertMeetings   = useMutation(api.meetings.batchUpsert);
  const upsertReports    = useMutation(api.reports.batchUpsert);

  // ── One-time migration from localStorage → Convex ─────────────────────────
  const migrated = useRef(false);

  useEffect(() => {
    if (migrated.current) return;
    if (prospectsEmpty === undefined || meetingsEmpty === undefined || reportsEmpty === undefined) return;

    migrated.current = true;

    if (prospectsEmpty) {
      const saved = localStorage.getItem('vox_prospects');
      const data  = saved ? JSON.parse(saved) : defaultProspects;
      upsertProspects({ prospects: data });
      // Keep localStorage as backup until user confirms migration is working
    }

    if (meetingsEmpty) {
      const saved = localStorage.getItem('vox_meetings');
      const data  = saved ? JSON.parse(saved) : defaultMeetings;
      upsertMeetings({ meetings: data });
    }

    if (reportsEmpty) {
      const saved = localStorage.getItem('vox_reports_history');
      const data  = saved ? JSON.parse(saved) : [];
      if (data.length > 0) {
        upsertReports({ reports: data });
      }
    }
  }, [prospectsEmpty, meetingsEmpty, reportsEmpty, upsertProspects, upsertMeetings, upsertReports]);

  // ── setProspects — same signature as before ────────────────────────────────
  // Accepts either a new array or an updater function: prev => next
  const setProspects = useCallback((updaterOrArray) => {
    const current = prospectsData ?? [];
    const next    = typeof updaterOrArray === 'function'
      ? updaterOrArray(current)
      : updaterOrArray;
    return upsertProspects({ prospects: next });
  }, [prospectsData, upsertProspects]);

  const setMeetings = useCallback((updaterOrArray) => {
    const current = meetingsData ?? [];
    const next    = typeof updaterOrArray === 'function'
      ? updaterOrArray(current)
      : updaterOrArray;
    return upsertMeetings({ meetings: next });
  }, [meetingsData, upsertMeetings]);

  const setReportsHistory = useCallback((updaterOrArray) => {
    const current = reportsData ?? [];
    const next    = typeof updaterOrArray === 'function'
      ? updaterOrArray(current)
      : updaterOrArray;
    return upsertReports({ reports: next });
  }, [reportsData, upsertReports]);

  // ── Loading state ──────────────────────────────────────────────────────────
  // undefined = Convex still fetching; null would be an error
  const isLoading = prospectsData === undefined;

  return {
    prospects:       prospectsData       ?? [],
    setProspects,
    meetings:        meetingsData        ?? [],
    setMeetings,
    reportsHistory:  reportsData         ?? [],
    setReportsHistory,
    isLoading,
  };
}
