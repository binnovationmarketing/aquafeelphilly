import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Download, QrCode, Link2, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const PROD_URL = 'https://aquafeelphilly.com';
const SHARE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ShareProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;      // proposal_token UUID
  clientDbId?: string;   // actual clients.id — used to set share_expires_at
  clientName?: string;
}

/** Converts a display name to a URL-safe slug (no PII — purely cosmetic) */
function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export const ShareProposalModal: React.FC<ShareProposalModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientDbId,
  clientName = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [settingExpiry, setSettingExpiry] = useState(false);

  const nameSlug = clientName ? toSlug(clientName) : '';
  const proposalLink = nameSlug
    ? `${PROD_URL}/proposal?id=${clientId}&n=${nameSlug}`
    : `${PROD_URL}/proposal?id=${clientId}`;

  // Set share_expires_at when modal opens (24h from now)
  useEffect(() => {
    if (!isOpen) return;
    const expiry = new Date(Date.now() + SHARE_TTL_MS);
    setExpiresAt(expiry);

    const dbId = clientDbId;
    if (!dbId) return;

    setSettingExpiry(true);
    void (async () => {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ share_expires_at: expiry.toISOString() })
          .eq('id', dbId);
        if (error) console.warn('Could not set share expiry:', error.message);
      } catch (e) {
        console.warn('Share expiry update failed:', e);
      } finally {
        setSettingExpiry(false);
      }
    })();
  }, [isOpen, clientDbId]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposalLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('proposal-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `aquafeel-proposta-${clientName.replace(/\s+/g, '-') || 'qrcode'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    toast.success('QR Code baixado!');
  };

  const expiryLabel = expiresAt
    ? expiresAt.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    : '—';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#020d1a] to-[#0a1f35] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-aqua-500/20 rounded-xl">
              <QrCode size={20} className="text-aqua-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-base">Compartilhar Proposta</h3>
              <p className="text-slate-400 text-xs">
                {clientName ? `Link exclusivo para ${clientName}` : 'Link seguro e personalizado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* 24h expiry badge */}
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              {settingExpiry
                ? 'Definindo prazo de acesso...'
                : `Link ativo por 24 horas — expira em ${expiryLabel}`}
            </p>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Shield size={16} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">
              Link seguro — nenhum dado pessoal exposto. Apenas um ID único e nome de referência.
            </p>
          </div>

          {/* Link preview */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Link2 size={11} /> Link Gerado
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono truncate select-all">
                {proposalLink}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-aqua-600 hover:bg-aqua-500 text-white shadow-md shadow-aqua-500/30'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
              <QRCodeSVG
                id="proposal-qr-svg"
                value={proposalLink}
                size={180}
                bgColor="#ffffff"
                fgColor="#020d1a"
                level="M"
                imageSettings={{
                  src: '/logo.png',
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Download size={14} />
              Baixar QR Code
            </button>
          </div>

          {/* Engagement notice */}
          <p className="text-center text-[10px] text-slate-400 font-medium">
            Você receberá uma notificação assim que o cliente abrir esta proposta.
          </p>
        </div>
      </div>
    </div>
  );
};
