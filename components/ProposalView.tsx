import { useState } from 'react';
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
import { Phone, Lock, ChevronRight, Clock } from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScrollSpy } from '../src/hooks/useScrollSpy';
import { useCountdownTimer } from '../src/hooks/useCountdownTimer';
import { useProposalInit } from '../src/hooks/useProposalInit';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../src/store/useAppStore';

export function ProposalView() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const setClientData = useAppStore((state: any) => state.setClientData);

    // 1. Initialize Client Data from URL / Storage
    const { isLoaded, clientData } = useProposalInit();

    // 2. Countdown Timer
    const { expirationDate, isExpired, timeLeft } = useCountdownTimer('proposalFirstAccess', 48);

    // 3. Scroll Spy for navigation mapping
    const sections = ['hero', 'malefices', 'logic', 'soap', 'proposal', 'testimonials', 'faq'];
    const { currentSection, handleNavigate } = useScrollSpy(sections, 'hero', 300);

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
                    navigate('/dashboard/analyst');
                }}
                onLogout={async () => {
                    localStorage.removeItem('proposalClientData');
                    await signOut();
                }}
            />

            <main className={`flex-1 transition-all duration-300 w-full ${mainMargin}`}>
                <div id="hero"><HeroSection clientName={name} spouseName={spouseName} lang={lang} /></div>
                <InfoSection lang={lang} zipCode={zipCode} />
                <ContaminantTruths lang={lang} />
                <WaterMalefices lang={lang} />
                <div id="logic"><WaterConsumptionLogic lang={lang} /></div>

                <div id="proposal" className="max-w-5xl mx-auto px-4 py-12 md:py-16">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 md:p-12 shadow-xl border border-white text-center relative overflow-hidden mb-12">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aqua-500 to-transparent opacity-50"></div>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-3 md:mb-4">{t.package.title} {displayName}</h3>
                            <p className="text-sm md:text-base text-slate-500 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">{t.package.desc}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100"><div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-aqua-600 to-blue-800 mb-1 md:mb-2">25</div><div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.soapYears}</div></div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100"><div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-700 mb-1 md:mb-2">100%</div><div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.guarantee}</div></div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100"><div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-slate-900 mb-1 md:mb-2">$0</div><div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.cost}</div></div>
                                <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100"><div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600 mb-1 md:mb-2">2026</div><div className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-400">{t.package.payment}</div></div>
                            </div>
                        </div>

                        <div className="relative z-20 py-10 md:py-12 bg-slate-50 border-t border-slate-200">
                            <div className="text-center mb-8 md:mb-10 px-4">
                                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 leading-tight">{lang === 'pt' ? 'Sua Proposta Exclusiva' : lang === 'en' ? 'Your Exclusive Proposal' : 'Su Propuesta Exclusiva'}</h2>
                                <p className="text-sm md:text-base text-slate-500 mt-2 px-4">{t.calculator.proposalSub}</p>
                            </div>
                            <ComparisonCalculator
                                clientId={clientData.id}
                                lang={lang}
                                isExpired={isExpired}
                                onSaveProposal={async (data) => {
                                    if (!clientData.id) return;

                                    const rangeToScore: Record<string, number> = {
                                        'RANGE1': 740,
                                        'RANGE2': 690,
                                        'RANGE3': 660,
                                        'RANGE4': 600,
                                    };

                                    const { error } = await supabase
                                        .from('clients')
                                        .update({
                                            water_consumption: data.waterMonthly,
                                            cleaning_consumption: data.cleaningMonthly,
                                            credit_score: rangeToScore[data.creditRange] || null,
                                        })
                                        .eq('id', clientData.id);

                                    if (error) {
                                        console.error('Error saving proposal:', error);
                                        throw error;
                                    }

                                    setClientData({
                                        ...clientData,
                                        waterConsumption: data.waterMonthly,
                                        cleaningConsumption: data.cleaningMonthly,
                                        creditScore: rangeToScore[data.creditRange] || undefined
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div id="testimonials"><Testimonials lang={lang} /></div>
                <div id="faq"><FAQ spouseName={spouseName || name} lang={lang} /></div>

                <div className="bg-slate-50 py-8 px-4 text-center">
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-medium max-w-4xl mx-auto leading-relaxed">{t.footer.soapDisclaimer}</p>
                </div>

                <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-white/10">
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
                                            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
                                        </span>
                                    )}
                                    <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-widest mt-2">{t.urgency.limit} {expirationDate.toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => setIsAnalystModalOpen(true)}
                                    className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl ${isExpired ? 'bg-white text-red-600' : 'bg-red-600 text-white hover:bg-red-500'}`}
                                >
                                    <Phone size={20} />
                                    {isExpired ? t.urgency.expiredButton : t.footer.button}
                                    <ChevronRight size={16} />
                                </button>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{t.urgency.commission}</p>
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
                                <a href="https://www.instagram.com/aquafeelphilly/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-pink-500 transition-colors uppercase tracking-widest font-bold flex items-center gap-1">
                                    <span>@aquafeelphilly</span>
                                </a>
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/5 my-4"></div>

                        <div className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold leading-relaxed max-w-2xl">
                            {t.footer.rights}
                        </div>
                    </div>
                </footer>
            </main>

            <AnalystModal isOpen={isAnalystModalOpen} onClose={() => setIsAnalystModalOpen(false)} lang={lang} clientName={name} />
        </div>
    );
}
