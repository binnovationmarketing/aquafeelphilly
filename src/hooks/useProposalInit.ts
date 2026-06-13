import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ClientData } from '../../types';
import { supabase } from '../../lib/supabase';

/**
 * Loads client proposal data via one of three strategies (in priority order):
 *
 * 1. ?id=UUID  — Secure share link. Fetches the client from Supabase using the
 *               RPC `get_proposal_by_token`. Tracks the view server-side.
 *               No PII ever appears in the URL.
 *
 * 2. Legacy params — ?n=name&l=lang&z=zip (backwards compat for old links)
 *               Falls through to localStorage.
 *
 * 3. localStorage — Used when analyst navigates internally from /lead/new
 *               without a UUID (e.g. Supabase save failed as fallback).
 */
export function useProposalInit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setClientData = useAppStore((state: any) => state.setClientData);
  const clientData = useAppStore((state: any) => state.clientData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [proposalOpenedAt, setProposalOpenedAt] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ── Strategy 1: secure UUID link ──────────────────────────────────────
      const tokenId = searchParams.get('id');
      if (tokenId) {
        try {
          // Fetch full client record via security-definer RPC (works for anon)
          const { data, error } = await supabase.rpc('get_proposal_by_token', { token: tokenId });

          if (error || !data || data.length === 0) {
            console.error('Proposal token not found:', error);
            navigate('/');
            return;
          }

          const row = Array.isArray(data) ? data[0] : data;

          const client: ClientData = {
            id: row.id,
            proposalToken: row.proposal_token || tokenId,
            proposalPdfUrl: row.proposal_pdf_url || undefined,
            name: row.name || '',
            spouseName: row.spouse_name || '',
            email: row.email || '',
            phone: row.phone || '',
            zipCode: row.zip_code || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            lang: (row.lang as ClientData['lang']) || 'pt',
            status: row.status || 'LEAD',
            observations: row.observations || [],
            referrals: row.referrals || [],
            analyst: row.analyst || 'System',
            creditScore: row.credit_score,
            waterConsumption: row.water_consumption,
            cleaningConsumption: row.cleaning_consumption,
            peopleCount: row.people_count,
            installationDate: row.installation_date,
            nextWaterAnalysis: row.next_water_analysis,
            saltReminder: row.salt_reminder,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          if (cancelled) return;

          setClientData(client);
          // Store token in localStorage so page refresh keeps the link
          localStorage.setItem('proposalToken', client.proposalToken || tokenId);
          localStorage.setItem('proposalClientData', JSON.stringify(client));

          // Track this view server-side (sets proposal_opened_at on first open)
          await supabase.rpc('track_proposal_view', { token: tokenId });

          // Read back proposal_opened_at so the countdown uses the server timestamp
          if (row.proposal_opened_at) {
            setProposalOpenedAt(row.proposal_opened_at);
          } else {
            // Just opened for the first time — use now as the anchor
            setProposalOpenedAt(new Date().toISOString());
          }

          // Expose share expiry for public-access guard in ProposalView
          if (row.share_expires_at) {
            setShareExpiresAt(row.share_expires_at);
          }

          setIsLoaded(true);
          return;
        } catch (err) {
          console.error('Error loading proposal by token:', err);
          // Fall through to legacy / localStorage
        }
      }

      // ── Strategy 2: legacy URL params ─────────────────────────────────────
      const urlName = searchParams.get('n') || searchParams.get('name');
      const urlSpouse = searchParams.get('s') || searchParams.get('spouse');
      const urlLang = searchParams.get('l') || searchParams.get('lang');
      const urlEmail = searchParams.get('e') || searchParams.get('email');
      const urlZip = searchParams.get('z') || searchParams.get('zip');

      if (urlName) {
        const selectedLang =
          urlLang === 'en' || urlLang === 'es' || urlLang === 'pt' ? urlLang : 'pt';
        const data: ClientData = {
          id: crypto.randomUUID(),
          name: urlName,
          spouseName: urlSpouse || '',
          lang: selectedLang as ClientData['lang'],
          email: urlEmail || '',
          phone: '',
          zipCode: urlZip || '',
          status: 'LEAD',
          observations: [],
          referrals: [],
          analyst: 'System',
          createdAt: new Date().toISOString(),
        };

        if (cancelled) return;
        setClientData(data);
        localStorage.setItem('proposalClientData', JSON.stringify(data));
        setProposalOpenedAt(new Date().toISOString());
        setIsLoaded(true);
        return;
      }

      // ── Strategy 3: localStorage (internal navigation / refresh) ──────────
      const storedToken = localStorage.getItem('proposalToken');
      if (storedToken) {
        // Try to re-fetch from Supabase using cached token
        try {
          const { data, error } = await supabase.rpc('get_proposal_by_token', { token: storedToken });
          if (!error && data && (Array.isArray(data) ? data.length > 0 : true)) {
            const row = Array.isArray(data) ? data[0] : data;
            const client: ClientData = {
              id: row.id,
              proposalToken: row.proposal_token || storedToken,
              proposalPdfUrl: row.proposal_pdf_url || undefined,
              name: row.name || '', spouseName: row.spouse_name || '',
              email: row.email || '', phone: row.phone || '', zipCode: row.zip_code || '',
              address: row.address || '', city: row.city || '', state: row.state || '',
              lang: (row.lang as ClientData['lang']) || 'pt', status: row.status || 'LEAD',
              observations: row.observations || [], referrals: row.referrals || [],
              analyst: row.analyst || 'System', creditScore: row.credit_score,
              waterConsumption: row.water_consumption, cleaningConsumption: row.cleaning_consumption,
              peopleCount: row.people_count, installationDate: row.installation_date,
              nextWaterAnalysis: row.next_water_analysis, saltReminder: row.salt_reminder,
              createdAt: row.created_at, updatedAt: row.updated_at,
            };
            if (cancelled) return;
            setClientData(client);
            setProposalOpenedAt(row.proposal_opened_at || new Date().toISOString());
            setIsLoaded(true);
            return;
          }
        } catch (_) { /* fall through */ }
      }

      const storedClient = localStorage.getItem('proposalClientData');
      if (storedClient) {
        try {
          const parsed = JSON.parse(storedClient);
          if (parsed?.name) {
            if (cancelled) return;
            setClientData(parsed);
            setProposalOpenedAt(new Date().toISOString());
            setIsLoaded(true);
            return;
          }
        } catch (_) {
          localStorage.removeItem('proposalClientData');
        }
      }

      // Nothing found — redirect home
      navigate('/');
    }

    init();
    return () => { cancelled = true; };
  }, [searchParams, navigate, setClientData]);

  return { isLoaded, clientData, proposalOpenedAt, shareExpiresAt };
}
