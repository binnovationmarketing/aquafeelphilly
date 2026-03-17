
import React, { useState } from 'react';
import { ExternalLink, Microscope, AlertOctagon, MapPin, X, Play, AlertTriangle } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface InfoSectionProps {
  lang: Language;
  zipCode?: string;
}

// ─── State contaminant data (EWG 2013-2024) ────────────────────────────────
type StateKey = 'PA' | 'NJ' | 'VA' | 'MD' | 'DE';

const STATE_DATA: Record<StateKey, {
  name: string;
  totalContaminants: number;
  serves: string;
  utilities: number;
  topContaminants: { name: string; peopleServed: number; aboveGuidelines: boolean }[];
  ewgUrl: string;
}> = {
  PA: {
    name: 'Pennsylvania',
    totalContaminants: 123,
    serves: '11,354,000',
    utilities: 1884,
    ewgUrl: 'https://www.ewg.org/tapwater/state-of-the-water.php?state=PA',
    topContaminants: [
      { name: 'Trihalometanos (TTHMs)', peopleServed: 11248834, aboveGuidelines: true },
      { name: 'Bromodiclorometano', peopleServed: 11206464, aboveGuidelines: true },
      { name: 'Clorofórmio', peopleServed: 10990188, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA5)', peopleServed: 10946414, aboveGuidelines: true },
      { name: 'Ácido Dicloroacético', peopleServed: 10782662, aboveGuidelines: true },
      { name: 'Cromo-6 (Hexavalente)', peopleServed: 8653607, aboveGuidelines: true },
      { name: 'Nitrato', peopleServed: 8934125, aboveGuidelines: true },
      { name: 'PFOA', peopleServed: 4424312, aboveGuidelines: true },
      { name: 'PFOS', peopleServed: 3938450, aboveGuidelines: true },
      { name: 'Radônio', peopleServed: 2135627, aboveGuidelines: true },
      { name: 'Arsênico', peopleServed: 1736632, aboveGuidelines: true },
      { name: 'Tálio', peopleServed: 78215, aboveGuidelines: true },
      { name: 'Chumbo (via canos antigos)', peopleServed: 9170556, aboveGuidelines: false },
      { name: 'Bário', peopleServed: 8807030, aboveGuidelines: false },
      { name: 'Manganês', peopleServed: 9170556, aboveGuidelines: false },
    ],
  },
  NJ: {
    name: 'New Jersey',
    totalContaminants: 131,
    serves: '8,854,000',
    utilities: 563,
    ewgUrl: 'https://www.ewg.org/tapwater/state-of-the-water.php?state=NJ',
    topContaminants: [
      { name: 'Trihalometanos (TTHMs)', peopleServed: 8840043, aboveGuidelines: true },
      { name: 'Bromodiclorometano', peopleServed: 8819097, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA5)', peopleServed: 8761774, aboveGuidelines: true },
      { name: 'Clorofórmio', peopleServed: 8354836, aboveGuidelines: true },
      { name: 'PFOA', peopleServed: 7406155, aboveGuidelines: true },
      { name: 'PFOS', peopleServed: 5952807, aboveGuidelines: true },
      { name: 'Cromo-6 (Hexavalente)', peopleServed: 6784930, aboveGuidelines: true },
      { name: 'Nitrato', peopleServed: 5420982, aboveGuidelines: true },
      { name: 'Radônio combinado', peopleServed: 5356260, aboveGuidelines: true },
      { name: 'Arsênico', peopleServed: 4194538, aboveGuidelines: true },
      { name: 'Tálio', peopleServed: 17444, aboveGuidelines: true },
      { name: 'Benzeno', peopleServed: 390, aboveGuidelines: true },
      { name: 'Manganês', peopleServed: 8540306, aboveGuidelines: false },
      { name: 'Alumínio', peopleServed: 4881893, aboveGuidelines: false },
      { name: 'Chumbo (via canos antigos)', peopleServed: 8854000, aboveGuidelines: false },
    ],
  },
  VA: {
    name: 'Virginia',
    totalContaminants: 108,
    serves: '7,327,000',
    utilities: 1070,
    ewgUrl: 'https://www.ewg.org/tapwater/state-of-the-water.php?state=VA',
    topContaminants: [
      { name: 'Trihalometanos (TTHMs)', peopleServed: 7241461, aboveGuidelines: true },
      { name: 'Bromodiclorometano', peopleServed: 7223123, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA5)', peopleServed: 7189323, aboveGuidelines: true },
      { name: 'Clorofórmio', peopleServed: 7168067, aboveGuidelines: true },
      { name: 'Cromo-6 (Hexavalente)', peopleServed: 6139692, aboveGuidelines: true },
      { name: 'PFOA', peopleServed: 1821040, aboveGuidelines: true },
      { name: 'PFOS', peopleServed: 1685655, aboveGuidelines: true },
      { name: 'Nitrato', peopleServed: 1846025, aboveGuidelines: true },
      { name: 'Radônio combinado', peopleServed: 2635828, aboveGuidelines: true },
      { name: 'Arsênico', peopleServed: 240687, aboveGuidelines: true },
      { name: 'Tálio', peopleServed: 833, aboveGuidelines: true },
      { name: 'Clorato', peopleServed: 1285839, aboveGuidelines: true },
      { name: 'Manganês', peopleServed: 6892229, aboveGuidelines: false },
      { name: 'Chumbo (via canos antigos)', peopleServed: 7327000, aboveGuidelines: false },
    ],
  },
  MD: {
    name: 'Maryland',
    totalContaminants: 94,
    serves: '5,431,000',
    utilities: 463,
    ewgUrl: 'https://www.ewg.org/tapwater/state-of-the-water.php?state=MD',
    topContaminants: [
      { name: 'Trihalometanos (TTHMs)', peopleServed: 5113230, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA9)', peopleServed: 5069602, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA5)', peopleServed: 4998276, aboveGuidelines: true },
      { name: 'Radônio combinado', peopleServed: 4508430, aboveGuidelines: true },
      { name: 'Bromodiclorometano', peopleServed: 4418651, aboveGuidelines: true },
      { name: 'Nitrato', peopleServed: 4243535, aboveGuidelines: true },
      { name: 'Cromo-6 (Hexavalente)', peopleServed: 2622476, aboveGuidelines: true },
      { name: 'Arsênico', peopleServed: 429418, aboveGuidelines: true },
      { name: 'PFOA', peopleServed: 144318, aboveGuidelines: true },
      { name: 'PFOS', peopleServed: 139364, aboveGuidelines: true },
      { name: 'Clorato', peopleServed: 28776, aboveGuidelines: true },
      { name: 'Manganês', peopleServed: 5087595, aboveGuidelines: false },
      { name: 'Chumbo (via canos antigos)', peopleServed: 5431000, aboveGuidelines: false },
    ],
  },
  DE: {
    name: 'Delaware',
    totalContaminants: 99,
    serves: '877,000',
    utilities: 203,
    ewgUrl: 'https://www.ewg.org/tapwater/state-of-the-water.php?state=DE',
    topContaminants: [
      { name: 'Bromodiclorometano', peopleServed: 864971, aboveGuidelines: true },
      { name: 'Trihalometanos (TTHMs)', peopleServed: 864113, aboveGuidelines: true },
      { name: 'Clorofórmio', peopleServed: 846078, aboveGuidelines: true },
      { name: 'Ácidos Haloacéticos (HAA5)', peopleServed: 816355, aboveGuidelines: true },
      { name: 'Radônio combinado', peopleServed: 805712, aboveGuidelines: true },
      { name: 'Nitrato', peopleServed: 771103, aboveGuidelines: true },
      { name: 'Cromo-6 (Hexavalente)', peopleServed: 693895, aboveGuidelines: true },
      { name: 'PFOA', peopleServed: 621278, aboveGuidelines: true },
      { name: 'Arsênico', peopleServed: 66720, aboveGuidelines: true },
      { name: 'Benzeno', peopleServed: 216, aboveGuidelines: true },
      { name: 'Vinyl Cloreto', peopleServed: 190, aboveGuidelines: true },
      { name: 'PCBs (Bifenilas Policloradas)', peopleServed: 60, aboveGuidelines: true },
      { name: 'Chumbo (via canos antigos)', peopleServed: 877000, aboveGuidelines: false },
    ],
  },
};

// Map each daily routine activity to the contaminant key-words per activity
const ACTIVITY_CONTAMINANT_MAP: Record<string, string[]> = {
  teeth: ['Trihalometanos', 'Clorofórmio', 'Bromodiclorometano', 'Cromo-6', 'Arsênico', 'Tálio', 'PFOA', 'PFOS', 'Nitrato', 'Radônio', 'Clorato'],
  face: ['Clorofórmio', 'Bromodiclorometano', 'Cromo-6', 'PFOA', 'PFOS', 'Arsênico', 'Tálio', 'Trihalometanos', 'Benzeno'],
  shower: ['Bromodiclorometano', 'Trihalometanos', 'Clorofórmio', 'PFOA', 'PFOS', 'Cromo-6', 'Clorato', 'Arsênico'],
  cook: ['Nitrato', 'Arsênico', 'Cromo-6', 'Chumbo', 'Clorofórmio', 'PFOA', 'PFOS', 'Manganês', 'Bário', 'Alumínio', 'Radônio'],
  food: ['Nitrato', 'Arsênico', 'Cromo-6', 'Chumbo', 'PFOA', 'PFOS', 'Benzeno', 'Clorofórmio', 'Trihalometanos'],
  laundry: ['Trihalometanos', 'Clorofórmio', 'PFOA', 'PFOS', 'Cromo-6', 'Bromodiclorometano'],
};

const DAILY_ACTIVITIES = [
  { key: 'teeth', icon: '🪥', label: 'Escovar Dentes', risk: 'Ingestão direta de contaminantes', color: 'red' },
  { key: 'face', icon: '🧖‍♀️', label: 'Lavar o Rosto', risk: 'Absorção cutânea de toxinas', color: 'orange' },
  { key: 'shower', icon: '🚿', label: 'Tomar Banho', risk: 'Vapores inalados + absorção pela pele', color: 'red' },
  { key: 'cook', icon: '🍳', label: 'Cozinhar', risk: 'Contaminantes concentrados pelo calor', color: 'red' },
  { key: 'food', icon: '🍎', label: 'Lavar Alimentos', risk: 'Depósito de contaminantes na superfície', color: 'orange' },
  { key: 'laundry', icon: '👕', label: 'Lavar Roupa', risk: 'Contato dérmico prolongado', color: 'yellow' },
];

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-50 border-red-200 hover:border-red-400',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
  yellow: 'bg-amber-50 border-amber-200 hover:border-amber-400',
};

export const InfoSection: React.FC<InfoSectionProps> = ({ lang, zipCode }) => {
  const t = translations[lang].info;

  const ewgLink = zipCode
    ? `https://www.ewg.org/tapwater/search-results.php?zip5=${zipCode}`
    : 'https://www.ewg.org/tapwater/';

  const [selectedState, setSelectedState] = useState<StateKey>('PA');
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  const stateData = STATE_DATA[selectedState];

  // Filter state contaminants that match the selected activity
  const activityContaminants = activeActivity
    ? stateData.topContaminants.filter(c =>
        ACTIVITY_CONTAMINANT_MAP[activeActivity]?.some(keyword =>
          c.name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    : [];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US').format(n);

  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-aqua-600 font-bold tracking-wider uppercase text-sm">{t.label}</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2">{t.title}</h2>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        {/* ── YouTube Trigger Card (replaces broken iframe) ─────────────────── */}
        <a
          href="https://www.youtube.com/watch?v=Dxl3FVgzPO4"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-16 flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-gradient-to-br from-slate-900 to-red-950 rounded-2xl p-8 shadow-2xl border border-red-900/40 group cursor-pointer hover:shadow-red-900/30 transition-all duration-500 overflow-hidden relative"
        >
          {/* Red glow */}
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Play button */}
          <div className="relative shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-red-900/40">
            <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping"></div>
            <Play className="text-red-400 fill-red-400 ml-1" size={40} />
          </div>

          <div className="text-center md:text-left">
            <span className="inline-block text-[10px] font-black tracking-[0.25em] uppercase text-red-400 mb-2">
              ⚠️ Assista antes de beber
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
              O que está <span className="text-red-400">realmente</span> na sua água?
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-4">
              Documentário chocante revela os contaminantes invisíveis que chegam até sua torneira diariamente — mesmo após o tratamento municipal.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">
              Assistir no YouTube <ExternalLink size={14} />
            </span>
          </div>
        </a>

        {/* ── Cards Row ─────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* Card 1 – Regional Alert */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-white hover:border-red-100 cursor-default group">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">
                {t.alertTitle} {zipCode && <span className="text-red-500">({zipCode})</span>}
              </h3>
            </div>
            <p className="text-slate-600 mb-4 text-sm leading-relaxed">{t.alertBody}</p>
            <div className="space-y-3">
              <a
                href={ewgLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all group/link border border-slate-100 cursor-pointer"
              >
                <span className="text-sm font-bold text-slate-700">VER RELATÓRIO DO MEU ZIP CODE</span>
                <ExternalLink size={16} className="text-aqua-500 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Card 2 – The Invisible Cycle + State Selector */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors duration-700"></div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="bg-red-100 p-3 rounded-full text-red-600 animate-pulse">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">O Ciclo Invisível</h3>
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-0.5">Dados reais por estado (2013-2024)</p>
              </div>
            </div>

            {/* State Selector */}
            <div className="relative z-10 mb-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Selecione seu estado:</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATE_DATA) as StateKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedState(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-200 border ${selectedState === key
                      ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    {STATE_DATA[key].name.split(' ').map(w => w[0]).join('')} – {STATE_DATA[key].name}
                  </button>
                ))}
              </div>
            </div>

            {/* State Stats Banner */}
            <div className="relative z-10 bg-red-600 rounded-xl p-4 mb-4 text-white grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Contaminantes</p>
                <p className="text-2xl font-black">{stateData.totalContaminants}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Pessoas Expostas</p>
                <p className="text-lg font-black leading-tight">{stateData.serves}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Redes de Água</p>
                <p className="text-2xl font-black">{stateData.utilities.toLocaleString()}</p>
              </div>
            </div>

            {/* Daily Routine Clickable Icons */}
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                Clique em uma atividade para ver os contaminantes:
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {DAILY_ACTIVITIES.map(activity => (
                  <button
                    key={activity.key}
                    onClick={() => setActiveActivity(prev => prev === activity.key ? null : activity.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center ${activeActivity === activity.key
                      ? 'bg-red-600 border-red-700 shadow-lg scale-105'
                      : `${COLOR_MAP[activity.color]} border`
                    }`}
                  >
                    <span className={`text-2xl ${activeActivity === activity.key ? 'brightness-200' : ''}`}>
                      {activity.icon}
                    </span>
                    <span className={`text-[10px] font-black leading-tight ${activeActivity === activity.key ? 'text-white' : 'text-slate-700'}`}>
                      {activity.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contaminant popup for selected activity */}
            {activeActivity && (
              <div className="relative z-10 mt-4 bg-white rounded-xl border border-red-200 shadow-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-0.5 flex items-center gap-1">
                      <Microscope size={11} /> Contaminantes em {stateData.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {DAILY_ACTIVITIES.find(a => a.key === activeActivity)?.risk}
                    </p>
                  </div>
                  <button onClick={() => setActiveActivity(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {activityContaminants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhum contaminante crítico mapeado para esta atividade neste estado.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {activityContaminants.map((c, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${c.aboveGuidelines ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          {c.aboveGuidelines ? (
                            <AlertTriangle size={12} className="text-red-500 shrink-0" />
                          ) : (
                            <AlertOctagon size={12} className="text-orange-400 shrink-0" />
                          )}
                          <span className="text-[11px] font-bold text-slate-800">{c.name}</span>
                          {c.aboveGuidelines && (
                            <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Acima do limite
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0 ml-2">
                          {fmt(c.peopleServed)} pessoas
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <a
                  href={stateData.ewgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-black text-red-600 hover:text-red-700 mt-3 transition-colors"
                >
                  Ver relatório completo de {stateData.name} no EWG <ExternalLink size={11} />
                </a>
              </div>
            )}

            {/* Bottom note */}
            {!activeActivity && (
              <p className="relative z-10 text-[11px] text-slate-500 mt-4 font-medium leading-relaxed border-t border-slate-100 pt-3">
                Mesmo fervendo a água, você <strong>concentra</strong> os metais pesados. A pele absorve toxinas pelo banho quente.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
