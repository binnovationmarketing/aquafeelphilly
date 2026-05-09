import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { HeroSection } from './HeroSection';
import { ComparisonCalculator } from './ComparisonCalculator';
import { InfoSection } from './InfoSection';
import { ContaminantTruths } from './ContaminantTruths';
import { WaterMalefices } from './WaterMalefices';
import { WaterConsumptionLogic } from './WaterConsumptionLogic';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { AnalystModal } from './AnalystModal';
import { Sidebar } from './Sidebar';
import AquaFeelLogo from './AquaFeelLogo';
import { Phone, Lock, ChevronRight, Clock, X, Save, FileText, Send, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { translations, Language } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScrollSpy } from '../src/hooks/useScrollSpy';
import { useCountdownTimer } from '../src/hooks/useCountdownTimer';
import { useProposalInit } from '../src/hooks/useProposalInit';
import { useProposalEngagement } from '../src/hooks/useProposalEngagement';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../src/store/useAppStore';

const SECTIONS = ['hero', 'malefices', 'logic', 'soap', 'proposal', 'testimonials', 'faq'];

export function ProposalView() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const setClientData = useAppStore((state: any) => state.setClientData);

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({ phone: '', email: '', status: 'PENDING' });
  const [proposalCalcData, setProposalCalcData] = useState<any>(null);
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [saveResult, setSaveResult] = useState<{ clientWaLink: string; pdfUrl: string; proposalUrl: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const INTERNAL_NUMBERS = ['+19842206002', '+12407064966', '+12407806473'];

  // 1. Load client data + server-side timer anchor
  const { isLoaded, clientData, proposalOpenedAt } = useProposalInit();

  // 2. Countdown anchored to server timestamp (not localStorage)
  const { expirationDate, isExpired, timeLeft } = useCountdownTimer(proposalOpenedAt, 48);

  // 3. Scroll spy for sidebar nav
  const { currentSection, handleNavigate } = useScrollSpy(SECTIONS, 'hero', 300);

  // 4. Engagement tracking
  const { observeSection, recordCalculatorUsed, recordCtaReached, recordCtaClicked } =
    useProposalEngagement(clientData?.id ?? null, clientData?.lang ?? 'pt');

  // 5. Attach section observers once loaded
  useEffect(() => {
    if (!isLoaded) return;
    const cleanups = SECTIONS.map(observeSection).filter(Boolean) as (() => void)[];
    return () => cleanups.forEach(fn => fn());
  }, [isLoaded, observeSection]);

  // 6. Detect when user reaches the CTA area (footer)
  useEffect(() => {
    if (!isLoaded) return;
    const footer = document.getElementById('proposal-cta');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) recordCtaReached(); },
      { threshold: 0.5 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [isLoaded, recordCtaReached]);

  const handleConfirmSave = async () => {
    if (!clientData?.id) {
      setSaveError('Dados do cliente não encontrados. Feche e reabra a proposta.');
      return;
    }
    if (!proposalCalcData) {
      setSaveError('Dados da calculadora não encontrados. Preencha os valores e tente novamente.');
      return;
    }

    setIsSavingProposal(true);
    setSaveError(null);

    const rangeToScore: Record<string, number> = {
      RANGE1: 740, RANGE2: 690, RANGE3: 660, RANGE4: 600, RANGE5: 580,
    };

    let shareToken = clientData.proposalToken || clientData.id;

    try {
      // ── STEP 1: Save core data to DB immediately (non-negotiable) ──
      const payload: any = {
        id: clientData.id,
        phone: saveFormData.phone || null,
        email: saveFormData.email || null,
        status: saveFormData.status,
        water_consumption: Number(proposalCalcData.waterMonthly) || 0,
        cleaning_consumption: Number(proposalCalcData.cleaningMonthly) || 0,
        credit_score: rangeToScore[proposalCalcData.creditRange] || null,
        updated_at: new Date().toISOString(),
      };
      if (clientData.proposalToken) payload.proposal_token = clientData.proposalToken;

      const { data: savedClient, error: dbError } = await supabase
        .from('clients')
        .upsert([payload], { onConflict: 'id' })
        .select('id, proposal_token, proposal_pdf_url')
        .single();

      if (dbError) throw dbError;
      if (savedClient?.proposal_token) shareToken = savedClient.proposal_token;

      const updatedClientData = {
        ...clientData,
        phone: saveFormData.phone,
        email: saveFormData.email,
        status: saveFormData.status as any,
        waterConsumption: proposalCalcData.waterMonthly,
        cleaningConsumption: proposalCalcData.cleaningMonthly,
        creditScore: rangeToScore[proposalCalcData.creditRange] || undefined,
        proposalToken: shareToken,
        proposalPdfUrl: savedClient?.proposal_pdf_url || clientData.proposalPdfUrl,
      };

      setClientData(updatedClientData);
      localStorage.setItem('proposalClientData', JSON.stringify(updatedClientData));
      localStorage.setItem('proposalToken', shareToken);

      // Follow-up task for reschedule
      if (saveFormData.status === 'RESCHEDULE') {
        const followDate = new Date();
        followDate.setDate(followDate.getDate() + 2);
        await supabase.from('tasks').insert({
          client_id: clientData.id,
          analyst_id: clientData.analyst || '',
          title: `Follow-up Automático (Reagendado) - ${clientData.name}`,
          type: 'MESSAGE',
          status: 'PENDING',
          scheduled_for: followDate.toISOString().split('T')[0],
        });
      }

      // ── STEP 2: Generate PDF (non-critical — data is already saved) ──
      let pdfUrl = '';
      try {
        const doc = new jsPDF();
        const W = 210;
        const totalMonthly = Number(proposalCalcData.waterMonthly) + Number(proposalCalcData.cleaningMonthly);
        const totalAnnual = totalMonthly * 12;
        const totalLifetime = totalMonthly * 12 * 30;
        const fmt = (n: number) =>
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

        doc.setFillColor(2, 13, 26);
        doc.rect(0, 0, W, 297, 'F');
        doc.setFillColor(0, 174, 239);
        doc.rect(0, 0, W, 14, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('AQUAFEEL VIP PROPOSAL', W / 2, 28, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(0, 174, 239);
        doc.text('Agua Pura. Familia Protegida.', W / 2, 37, { align: 'center' });

        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(`Cliente: ${clientData.name}`, 20, 52);
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 60);

        doc.setDrawColor(0, 174, 239);
        doc.setLineWidth(0.3);
        doc.line(20, 65, W - 20, 65);

        // Problem section
        doc.setFontSize(12);
        doc.setTextColor(255, 80, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('QUANTO VOCE ESTA DESPERDICANDO HOJE', 20, 75);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(200, 200, 200);
        doc.text(`Gastos mensais com agua contaminada:  ${fmt(proposalCalcData.waterMonthly)}`, 22, 84);
        doc.text(`Gastos mensais com sabao e produtos:   ${fmt(proposalCalcData.cleaningMonthly)}`, 22, 92);

        doc.setFontSize(12);
        doc.setTextColor(255, 120, 120);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL MENSAL:    ${fmt(totalMonthly)}`, 22, 103);
        doc.text(`TOTAL ANUAL:     ${fmt(totalAnnual)}`, 22, 112);
        doc.setFontSize(13);
        doc.setTextColor(255, 60, 60);
        doc.text(`Em 30 anos: ${fmt(totalLifetime)} PERDIDOS`, 22, 124);

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text('Voce esta pagando pela agua que contamina sua propria familia.', 22, 133);
        doc.line(20, 139, W - 20, 139);

        // Solution section
        doc.setFontSize(12);
        doc.setTextColor(17, 202, 160);
        doc.setFont('helvetica', 'bold');
        doc.text('SUA SOLUCAO AQUAFEEL VIP — OFERTA EXCLUSIVA', 20, 149);

        const benefits = [
          ['Sistema de Osmose Reversa (RO) de Alta Performance', 'Remove 99.9% de contaminantes, cloro e metais pesados'],
          ['Sabao Organico 25 ANOS (Lavanderia + Cozinha + Banheiro)', 'Economia de +$2.000 em produtos ao longo do contrato'],
          ['Garantia de 25 Anos', 'Tranquilidade total para sua familia'],
          ['$0 de Entrada — $0 de Instalacao', 'Sem surpresas, sem custos ocultos'],
          ['3 meses GRATIS com indicacao de 3 familias', 'Quanto mais voce indica, mais voce ganha'],
        ];

        let y = 160;
        benefits.forEach(([title, sub]) => {
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(`+ ${title}`, 22, y);
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'normal');
          doc.text(`  ${sub}`, 22, y + 6);
          y += 16;
        });

        doc.line(20, y + 2, W - 20, y + 2);
        y += 10;

        doc.setFontSize(11);
        doc.setTextColor(17, 202, 160);
        doc.setFont('helvetica', 'bold');
        doc.text('Esta proposta e exclusiva e por tempo limitado.', W / 2, y + 6, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        doc.text('Aquafeel ja transformou milhares de familias na Filadelfia.', W / 2, y + 14, { align: 'center' });
        doc.text('Sua familia merece agua 100% pura.', W / 2, y + 22, { align: 'center' });

        doc.setFillColor(0, 174, 239);
        doc.rect(0, 283, W, 14, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text('Aquafeel Solutions Philly  |  aquafeelphilly.com  |  2026', W / 2, 292, { align: 'center' });

        const pdfBlob = doc.output('blob');
        const fileName = `proposal_${clientData.id}_${Date.now()}.pdf`;

        // Upload with 20s timeout
        const uploadResult = await Promise.race([
          supabase.storage.from('proposals').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true }),
          new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('Upload timeout') }), 20000)
          ),
        ]);

        if (!uploadResult.error) {
          const { data: { publicUrl } } = supabase.storage.from('proposals').getPublicUrl(fileName);
          pdfUrl = publicUrl;
          // Update PDF URL in DB (best-effort)
          await supabase.from('clients').update({ proposal_pdf_url: pdfUrl }).eq('id', clientData.id);

          if (pdfUrl) {
            const finalClientData = {
              ...updatedClientData,
              proposalPdfUrl: pdfUrl,
            };
            setClientData(finalClientData);
            localStorage.setItem('proposalClientData', JSON.stringify(finalClientData));
          }
        } else {
          console.warn('PDF upload skipped:', uploadResult.error.message);
        }
      } catch (pdfErr: any) {
        // PDF failure is non-critical — core data is already saved
        console.error('PDF generation error (non-critical):', pdfErr);
      }

      // ── STEP 3: Build WhatsApp links and show success ──
      const proposalUrl = `https://aquafeelphilly.com/proposal?id=${shareToken}&lang=${clientData.lang}`;
      const waMsg = [
        `Ola ${clientData.name}! Aqui esta sua proposta VIP Aquafeel!`,
        pdfUrl ? `PDF com todos os beneficios:\n${pdfUrl}` : '',
        `Proposta interativa:\n${proposalUrl}`,
        `Qualquer duvida, estou a disposicao!`,
      ].filter(Boolean).join('\n\n');

      const rawDigits = saveFormData.phone.replace(/\D/g, '');
      const hasValidPhone = rawDigits.length >= 10;
      const phoneE164 = hasValidPhone ? (rawDigits.startsWith('1') ? rawDigits : `1${rawDigits}`) : '';
      const clientWaLink = hasValidPhone
        ? `https://wa.me/${phoneE164}?text=${encodeURIComponent(waMsg)}`
        : '';

      setSaveResult({ clientWaLink, pdfUrl, proposalUrl });
    } catch (err: any) {
      console.error('Save proposal error:', err);
      setSaveError(err.message || 'Erro desconhecido. Tente novamente.');
    } finally {
      setIsSavingProposal(false);
    }
  };

  if (!isLoaded || !expirationDate || !clientData) return null;

  const { lang, name, spouseName, zipCode } = clientData;
  const safeLang = lang as Language;
  const t = translations[safeLang || 'pt'];
  const displayName = spouseName ? `${name} & ${spouseName}` : name;
  const mainMargin = isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-aqua-200 selection:text-aqua-900 pb-0 flex">
      <Sidebar
        lang={lang}
        clientName={name}
        onNavigate={handleNavigate}
        currentSection={currentSection}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenManager={() => navigate('/dashboard/manager')}
        onBackToDashboard={() => {
          localStorage.removeItem('proposalClientData');
          localStorage.removeItem('proposalToken');
          navigate('/dashboard/analyst');
        }}
        onLogout={async () => {
          localStorage.removeItem('proposalClientData');
          localStorage.removeItem('proposalToken');
          await signOut();
        }}
      />

      <main className={`flex-1 transition-all duration-300 w-full ${mainMargin}`}>
        <div id="hero">
          <HeroSection clientName={name} spouseName={spouseName} lang={lang} />
        </div>
        <InfoSection lang={lang} zipCode={zipCode} />
        <ContaminantTruths lang={lang} />
        <WaterMalefices lang={lang} />
        <div id="logic">
          <WaterConsumptionLogic lang={lang} />
        </div>

        <div id="proposal" className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 md:p-12 shadow-xl border border-white text-center relative overflow-hidden mb-12">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aqua-500 to-transparent opacity-50" />
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-3 md:mb-4">
                {t.package.title} {displayName}
              </h3>
              <p className="text-sm md:text-base text-slate-500 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
                {t.package.desc}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-aqua-600 to-blue-800 mb-1 md:mb-2">25</div>
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.soapYears}</div>
                </div>
                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-700 mb-1 md:mb-2">100%</div>
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.guarantee}</div>
                </div>
                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-slate-900 mb-1 md:mb-2">$0</div>
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.cost}</div>
                </div>
                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600 mb-1 md:mb-2">2026</div>
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.payment}</div>
                </div>
              </div>
            </div>

            <div className="relative z-20 py-10 md:py-12 bg-slate-50 border-t border-slate-200">
              <div className="text-center mb-8 md:mb-10 px-4">
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 leading-tight">
                  {lang === 'pt' ? 'Sua Proposta Exclusiva' : lang === 'en' ? 'Your Exclusive Proposal' : 'Su Propuesta Exclusiva'}
                </h2>
                <p className="text-base md:text-lg font-black text-emerald-600 mt-2 tracking-tight">
                  {lang === 'pt' ? 'Valores com 0 instalação, 0 taxas e 0 entrada.' : lang === 'en' ? '$0 installation, $0 fees and $0 down.' : 'Valores con 0 instalación, 0 tasas y 0 entrada.'}
                </p>
                <p className="text-sm md:text-base text-slate-500 mt-1 px-4">{t.calculator.proposalSub}</p>
              </div>
              <ComparisonCalculator
                clientId={clientData.id}
                lang={lang}
                isExpired={isExpired}
                onSaveProposal={async (data) => {
                  if (!clientData.id) return;
                  recordCalculatorUsed(data.creditRange);
                  setProposalCalcData(data);
                  setSaveFormData({
                    phone: clientData.phone || '',
                    email: clientData.email || '',
                    status: 'PENDING'
                  });
                  setIsSaveModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        <div id="testimonials"><Testimonials lang={lang} /></div>
        <div id="faq"><FAQ spouseName={spouseName || name} lang={lang} /></div>

        <div className="bg-slate-50 py-8 px-4 text-center">
          <p className="text-[9px] md:text-[10px] text-slate-500 font-medium max-w-4xl mx-auto leading-relaxed">
            {t.footer.soapDisclaimer}
          </p>
        </div>

        {/* CTA Footer — engagement tracked via IntersectionObserver above */}
        <footer id="proposal-cta" className="bg-slate-950 text-white relative overflow-hidden border-t border-white/10">
          <div className={`py-8 px-4 md:px-8 transition-colors duration-500 ${isExpired ? 'bg-red-950/80' : 'bg-aqua-950/40'}`}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className={`${isExpired ? 'text-red-500' : 'text-amber-400'} animate-bounce`}>
                  <Clock size={32} />
                </div>
                <div className="text-center md:text-left">
                  <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">
                    {isExpired ? t.urgency.expiredTitle : t.urgency.expires}
                  </span>
                  {!isExpired && (
                    <span className="text-xl md:text-3xl font-black font-mono text-white">
                      {String(timeLeft.hours).padStart(2, '0')}h{' '}
                      {String(timeLeft.minutes).padStart(2, '0')}m{' '}
                      {String(timeLeft.seconds).padStart(2, '0')}s
                    </span>
                  )}
                  <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-widest mt-2">
                    {t.urgency.limit} {expirationDate.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                <button
                  onClick={() => {
                    recordCtaClicked();
                    setIsAnalystModalOpen(true);
                  }}
                  className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl ${isExpired
                    ? 'bg-white text-red-600'
                    : 'bg-red-600 text-white hover:bg-red-500'
                    }`}
                >
                  <Phone size={20} />
                  {isExpired ? t.urgency.expiredButton : t.footer.button}
                  <ChevronRight size={16} />
                </button>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                  {t.urgency.commission}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center gap-6 text-center">
            <AquaFeelLogo width="220px" variant="white" className="opacity-80" />
            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                <Lock size={12} className="text-emerald-500" />
                {lang === 'pt' ? 'Conexão Segura 256-bit' : lang === 'en' ? 'Secure 256-bit Connection' : 'Conexión Segura 256-bit'}
              </div>
              <div className="flex flex-col gap-1 items-center">
                <a href="mailto:binnovationmarketing@gmail.com" className="text-[10px] text-slate-600 hover:text-aqua-400 transition-colors uppercase tracking-widest font-bold">
                  binnovationmarketing@gmail.com
                </a>
                <a href="https://www.instagram.com/aquafeelphilly/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-pink-500 transition-colors uppercase tracking-widest font-bold">
                  @aquafeelphilly
                </a>
              </div>
            </div>
            <div className="w-full h-px bg-white/5 my-4" />
            <div className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold leading-relaxed max-w-2xl">
              {t.footer.rights}
            </div>
          </div>
        </footer>
      </main>

      <AnalystModal
        isOpen={isAnalystModalOpen}
        onClose={() => setIsAnalystModalOpen(false)}
        lang={lang}
        clientName={name}
      />

      {/* Save Proposal Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            {/* Success State */}
            {saveResult ? (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="font-black text-slate-800 text-lg">Proposta Salva! ✅</h3>
                  <p className="text-slate-500 text-xs mt-1">Envie agora via WhatsApp</p>
                </div>

                {/* Client WhatsApp */}
                <a href={saveResult.clientWaLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#25D366]">Enviar ao Cliente</p>
                    <p className="text-slate-600 text-xs font-bold">{clientData.name}</p>
                  </div>
                  <Send size={18} className="text-[#25D366] shrink-0" />
                </a>

                {/* Internal numbers */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notificar Equipe Interna:</p>
                  {INTERNAL_NUMBERS.map((num) => {
                    const internalMsg = `🏠 Nova Proposta Aquafeel!\nCliente: ${clientData.name}\nProposta: ${window.location.origin}/proposal?id=${clientData.id}`;
                    return (
                      <a key={num}
                        href={`https://wa.me/${num.replace(/\D/g, '')}?text=${encodeURIComponent(internalMsg)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-xs">
                        <span className="font-bold text-slate-600">{num}</span>
                        <Send size={14} className="text-slate-400 shrink-0" />
                      </a>
                    );
                  })}
                </div>

                <button onClick={() => {
                    setSaveResult(null);
                    setIsSaveModalOpen(false);
                    setSaveError(null);
                    // Redirect to analyst dashboard with organic products orientation
                    toast.success('Proposta salva! Lembre o cliente de indicar 3 familias para ganhar 1 ano de produtos organicos Pure Selects!', { duration: 6000 });
                    navigate('/dashboard/analyst');
                  }}
                  className="w-full py-3 rounded-xl bg-aqua-600 text-white font-black text-sm hover:bg-aqua-500 transition-colors shadow-md">
                  Ir para o Painel do Analista
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <h3 className="font-black text-slate-800 flex items-center justify-center gap-2">
                    <FileText size={18} className="text-aqua-600" /> Confirmar Proposta
                  </h3>
                  <button disabled={isSavingProposal} onClick={() => { setIsSaveModalOpen(false); setSaveError(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status do Lead</label>
                    <select
                      value={saveFormData.status}
                      onChange={(e) => setSaveFormData({ ...saveFormData, status: e.target.value })}
                      className="w-full text-sm font-bold border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-aqua-500 bg-slate-50 text-slate-700 hover:bg-white transition-colors"
                    >
                      <option value="PENDING">PENDING (Aguardando Decisão)</option>
                      <option value="SALE">SALE (Fechado/Vendido)</option>
                      <option value="NO SALE">NO SALE (Não Fechou)</option>
                      <option value="NOT INTERESTED">NOT INTERESTED (Não tem interesse)</option>
                      <option value="RESCHEDULE">RESCHEDULE (Reagendar para depois)</option>
                    </select>
                    {saveFormData.status === 'RESCHEDULE' && (
                      <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                        <Calendar size={12} /> Tarefa de follow-up será criada (Daqui a 2 dias).
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Telefone (WhatsApp)</label>
                      <input
                        type="tel"
                        value={saveFormData.phone}
                        onChange={(e) => setSaveFormData({ ...saveFormData, phone: e.target.value })}
                        className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-aqua-500 bg-white text-slate-900 placeholder:text-slate-300"
                        placeholder="(99) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={saveFormData.email}
                        onChange={(e) => setSaveFormData({ ...saveFormData, email: e.target.value })}
                        className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-aqua-500 bg-white text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {saveError && (
                  <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
                    {saveError}
                  </div>
                )}

                <div className="p-4 bg-slate-50 border-t border-slate-100 gap-2 flex">
                  <button
                    disabled={isSavingProposal}
                    onClick={() => { setIsSaveModalOpen(false); setSaveError(null); }}
                    className="flex-1 py-3 text-sm font-bold text-slate-500 border-2 border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isSavingProposal}
                    onClick={handleConfirmSave}
                    className="flex-[2] flex justify-center items-center py-3 text-sm font-black bg-aqua-600 text-white rounded-xl hover:bg-aqua-500 disabled:opacity-50 transition-all shadow-md shadow-aqua-500/20"
                  >
                    {isSavingProposal ? 'Salvando...' : 'Guardar Info & Status'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
