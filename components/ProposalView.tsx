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
    if (!clientData?.id || !proposalCalcData) return;
    setIsSavingProposal(true);
    try {
      const rangeToScore: Record<string, number> = {
        'RANGE1': 740, 'RANGE2': 690, 'RANGE3': 660, 'RANGE4': 600,
      };

      // 1. Generate PDF
      const doc = new jsPDF();
      doc.setFillColor(2, 13, 26); // #020d1a
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Aquafeel VIP Proposal", 105, 30, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(17, 202, 160); // #11caa0
      doc.text(`Cliente: ${clientData.name}`, 105, 50, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(200, 200, 200);
      doc.text(`Gastos Mensais Atuais:`, 20, 80);
      doc.text(`- Agua: $${proposalCalcData.waterMonthly}`, 25, 90);
      doc.text(`- Produtos/Sabao: $${proposalCalcData.cleaningMonthly}`, 25, 100);
      
      const totalMonthly = Number(proposalCalcData.waterMonthly) + Number(proposalCalcData.cleaningMonthly);
      doc.setTextColor(255, 80, 80);
      doc.text(`Desperdicio ao longo da vida: $${(totalMonthly * 12 * 30).toLocaleString()}`, 20, 120);
      
      doc.setTextColor(17, 202, 160);
      doc.text(`Solucao Aquafeel VIP:`, 20, 150);
      doc.setTextColor(200, 200, 200);
      doc.text(`- Sistema RO (Osmose Reversa) de Alta Performance`, 25, 160);
      doc.text(`- Sabao Organico 1 Ano: Lavanderia, Cozinha e Banheiro`, 25, 170);
      doc.text(`- Garantia de 25 Anos`, 25, 180);
      doc.text(`- $0 Entrada / $0 Instalacao`, 25, 190);
      doc.text(`- 3 Meses livres de pagamento (Com indicacao)`, 25, 200);

      doc.setFontSize(10);
      doc.text("Proteja sua familia, seu patrimonio e sua saude.", 105, 260, { align: "center" });
      doc.text("Aquafeel Solutions Philly", 105, 270, { align: "center" });

      const pdfBlob = doc.output('blob');
      const fileName = `proposal_${clientData.id}_${Date.now()}.pdf`;

      // 2. Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('proposals')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error("Erro ao fazer upload do PDF:", uploadError);
        // We continue even if PDF upload fails, so we don't block saving the client
      }

      let pdfUrl = '';
      if (uploadData) {
        const { data: publicUrlData } = supabase.storage.from('proposals').getPublicUrl(fileName);
        pdfUrl = publicUrlData.publicUrl;
      }

      // 3. Save to DB
      const { error } = await supabase
        .from('clients')
        .update({
          phone: saveFormData.phone,
          email: saveFormData.email,
          status: saveFormData.status,
          water_consumption: proposalCalcData.waterMonthly,
          cleaning_consumption: proposalCalcData.cleaningMonthly,
          credit_score: rangeToScore[proposalCalcData.creditRange] || null,
          proposal_pdf_url: pdfUrl || null
        })
        .eq('id', clientData.id);

      if (error) throw error;

      if (saveFormData.status === 'RESCHEDULE') {
        const followDate = new Date();
        followDate.setDate(followDate.getDate() + 2);
        
        await supabase.from('tasks').insert({
          client_id: clientData.id,
          analyst_id: clientData.analyst || '',
          title: `Follow-up Automático (Reagendado) - ${clientData.name}`,
          type: 'MESSAGE',
          status: 'PENDING',
          scheduled_for: followDate.toISOString().split('T')[0]
        });
      }

      setClientData({
        ...clientData,
        phone: saveFormData.phone,
        email: saveFormData.email,
        status: saveFormData.status as any,
        waterConsumption: proposalCalcData.waterMonthly,
        cleaningConsumption: proposalCalcData.cleaningMonthly,
        creditScore: rangeToScore[proposalCalcData.creditRange] || undefined,
      });

      // 4. WhatsApp Link
      let msg = `Olá ${clientData.name}! Aqui está o resumo da sua proposta VIP da Aquafeel Solutions! \n\nAcesse o PDF com os seus benefícios aqui:\n${pdfUrl}\n\nPara acessar a proposta completa interativa, use este link:\n${window.location.origin}/proposal?id=${clientData.id}&lang=${clientData.lang}`;
      const encodedMsg = encodeURIComponent(msg);
      const rawDigits = saveFormData.phone.replace(/\D/g, '');
      const phoneDigits = rawDigits.startsWith('1') ? rawDigits : `1${rawDigits}`;
      const waLink = `https://wa.me/${phoneDigits}?text=${encodedMsg}`;

      toast.success(
        <div className="flex flex-col gap-2">
          <span>Proposta Salva com PDF! ✅</span>
          {phoneDigits && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white px-3 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-xs mt-2 hover:bg-emerald-600">
              <Send size={14} /> Enviar PDF no WhatsApp
            </a>
          )}
        </div>,
        { duration: 8000 }
      );
      
      setIsSaveModalOpen(false);
    } catch (err: any) {
      toast.error('Erro ao guardar proposta: ' + err.message);
    } finally {
      setIsSavingProposal(false);
    }
  };

  if (!isLoaded || !expirationDate || !clientData) return null;

  const { lang, name, spouseName, zipCode } = clientData;
  const safeLang    = lang as Language;
  const t           = translations[safeLang || 'pt'];
  const displayName = spouseName ? `${name} & ${spouseName}` : name;
  const mainMargin  = isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]';

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
                <p className="text-sm md:text-base text-slate-500 mt-2 px-4">{t.calculator.proposalSub}</p>
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
                  className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl ${
                    isExpired
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
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-black text-slate-800 flex items-center justify-center gap-2">
                <FileText size={18} className="text-aqua-600" /> Confirmar Proposta
              </h3>
              <button disabled={isSavingProposal} onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
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

            <div className="p-4 bg-slate-50 border-t border-slate-100 gap-2 flex">
              <button 
                disabled={isSavingProposal}
                onClick={() => setIsSaveModalOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
