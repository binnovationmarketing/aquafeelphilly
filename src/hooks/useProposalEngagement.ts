import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface EngagementData {
  sections_viewed:      string[];
  section_time:         Record<string, number>; // seconds per section
  calculator_used:      boolean;
  calculator_credit_range?: string;
  reached_cta:          boolean;
  cta_clicked:          boolean;
  total_time_seconds:   number;
  lang:                 string;
  device:               'mobile' | 'desktop';
  first_viewed_at:      string;
  last_updated_at:      string;
}

/**
 * Tracks how the client interacts with the proposal and persists the data
 * to Supabase via the `update_proposal_engagement` RPC.
 *
 * Observations saved:
 * - Which sections were visible (IntersectionObserver)
 * - Time spent in each section (seconds)
 * - Whether the financing calculator was used
 * - Which credit range was selected
 * - Whether the CTA button was reached and/or clicked
 * - Total time on page
 *
 * All writes are debounced and batched — no per-keystroke RPC calls.
 */
export function useProposalEngagement(
  clientId: string | null,
  lang: string
) {
  const engagementRef = useRef<EngagementData>({
    sections_viewed:    [],
    section_time:       {},
    calculator_used:    false,
    reached_cta:        false,
    cta_clicked:        false,
    total_time_seconds: 0,
    lang,
    device:             window.innerWidth < 768 ? 'mobile' : 'desktop',
    first_viewed_at:    new Date().toISOString(),
    last_updated_at:    new Date().toISOString(),
  });

  const flushTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageStart   = useRef<number>(Date.now());
  const sectionStart = useRef<Record<string, number>>({});

  // ── Persist to Supabase (debounced 5 s) ───────────────────────────────────
  const flush = useCallback(async () => {
    if (!clientId) return;
    const data = engagementRef.current;
    data.total_time_seconds = Math.floor((Date.now() - pageStart.current) / 1000);
    data.last_updated_at    = new Date().toISOString();

    try {
      await supabase.rpc('update_proposal_engagement', {
        token:           clientId,   // we pass the client UUID as the token
        engagement_data: data as any,
      });
    } catch (err) {
      console.warn('Engagement flush error:', err);
    }
  }, [clientId]);

  const scheduledFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 5000);
  }, [flush]);

  // ── Section visibility tracking ───────────────────────────────────────────
  const observeSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const eng = engagementRef.current;
        if (entry.isIntersecting) {
          // Section entered viewport
          sectionStart.current[sectionId] = Date.now();
          if (!eng.sections_viewed.includes(sectionId)) {
            eng.sections_viewed = [...eng.sections_viewed, sectionId];
          }
        } else {
          // Section left viewport — accumulate time
          const start = sectionStart.current[sectionId];
          if (start) {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            eng.section_time[sectionId] = (eng.section_time[sectionId] || 0) + elapsed;
            delete sectionStart.current[sectionId];
          }
        }
        scheduledFlush();
      },
      { threshold: 0.3 }  // at least 30% of section must be visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scheduledFlush]);

  // ── Public event recorders ─────────────────────────────────────────────────
  const recordCalculatorUsed = useCallback((creditRange?: string) => {
    engagementRef.current.calculator_used = true;
    if (creditRange) engagementRef.current.calculator_credit_range = creditRange;
    scheduledFlush();
  }, [scheduledFlush]);

  const recordCtaReached = useCallback(() => {
    engagementRef.current.reached_cta = true;
    scheduledFlush();
  }, [scheduledFlush]);

  const recordCtaClicked = useCallback(() => {
    engagementRef.current.cta_clicked = true;
    engagementRef.current.reached_cta = true;
    flush(); // immediate flush on CTA click
  }, [flush]);

  // ── Flush on page unload ──────────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (!clientId) return;
      // Use sendBeacon for reliability on page close
      const data = engagementRef.current;
      data.total_time_seconds = Math.floor((Date.now() - pageStart.current) / 1000);
      data.last_updated_at    = new Date().toISOString();
      // sendBeacon to a Supabase edge function URL would be ideal;
      // for now we attempt a sync flush
      flush();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [flush, clientId]);

  return { observeSection, recordCalculatorUsed, recordCtaReached, recordCtaClicked };
}
