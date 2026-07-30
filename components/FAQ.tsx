
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, AlertOctagon, Wallet, Home, BrainCircuit, X } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface FAQProps {
  spouseName?: string;
  lang: Language;
}

interface Question {
  id: number;
  category: 'money' | 'trust' | 'logistics' | 'health';
  q: string;
  a: string;
  icon: React.ElementType;
}

export const FAQ: React.FC<FAQProps> = ({ spouseName, lang }) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  const t = translations[lang].faq;
  const familyText = lang === 'pt' ? 'Minha família' : (lang === 'en' ? 'My family' : 'Mi familia');
  const objectionName = spouseName ? spouseName : familyText;

  // BANCO DE DADOS DE OBJEÇÕES (20 PERGUNTAS)
  const questions: Question[] = [
    // DINHEIRO / VALOR
    { id: 1, category: 'money', icon: Wallet, q: t.q1, a: t.a1 }, // 3 meses gratis
    { id: 2, category: 'money', icon: Wallet, q: t.q2, a: t.a2 }, // Pagamento a vista
    { id: 3, category: 'money', icon: Wallet, q: `${objectionName} ${t.q3}`, a: t.a3 }, // Nova conta
    { id: 4, category: 'money', icon: Wallet, q: "¿É caro demais para mim?", a: "Caro é pagar por água suja a vida toda. O sistema se paga com a economia de supermercado. É uma troca de conta, não uma nova conta." },
    { id: 5, category: 'money', icon: Wallet, q: "¿A parcela aumenta?", a: "Não. Diferente da conta de água e do supermercado que sobem com a inflação, nossa parcela é fixa e congelada." },
    
    // CONFIANÇA / TÉCNICA
    { id: 6, category: 'trust', icon: AlertOctagon, q: t.q5, a: t.a5 }, // Home Depot
    { id: 7, category: 'trust', icon: AlertOctagon, q: t.q6, a: t.a6 }, // Filtro comum
    { id: 8, category: 'trust', icon: CheckCircle2, q: "¿E se quebrar?", a: "Você tem garantia vitalícia limitada. Se algo falhar, nós consertamos. Você nunca ficará sem água pura." },
    { id: 9, category: 'trust', icon: CheckCircle2, q: "¿A água fica sem gosto?", a: "A água pura é leve. O gosto que você sente hoje é cloro e minerais pesados. Em 2 dias seu paladar se adapta à pureza real." },
    { id: 10, category: 'trust', icon: AlertOctagon, q: "¿Precisa de eletricidade?", a: "O sistema principal funciona com pressão hidráulica. Apenas o sistema UV (se incluso) usa energia mínima (menos que uma lâmpada LED)." },

    // LOGÍSTICA / CASA
    { id: 11, category: 'logistics', icon: Home, q: t.q4, a: t.a4 }, // Mudança
    { id: 12, category: 'logistics', icon: Home, q: "¿Eu moro de aluguel...", a: "Sem problemas. Instalamos de forma não invasiva e, quando você se mudar, levamos o sistema para sua casa própria." },
    { id: 13, category: 'logistics', icon: Home, q: "¿Vai furar meu granito?", a: "Geralmente usamos o furo do dispensador de sabão ou fazemos um furo técnico minúsculo que pode ser revertido com uma tampa estética cromada." },
    { id: 14, category: 'logistics', icon: Home, q: "¿Ocupa muito espaço?", a: "O sistema é compacto e cabe embaixo da pia ou na garagem/basement, dependendo da configuração escolhida para sua casa." },
    { id: 15, category: 'logistics', icon: Home, q: "¿Faz bagunça instalar?", a: "Nossos técnicos usam protocolo 'Luva Branca'. Deixamos sua casa mais limpa do que a encontramos." },

    // SAÚDE / MEDO
    { id: 16, category: 'health', icon: BrainCircuit, q: "¿A água da torneira não é segura?", a: "Ela é 'legal', mas não saudável. O governo não filtra hormônios, microplásticos ou PFAS. Nós filtramos." },
    { id: 17, category: 'health', icon: BrainCircuit, q: "¿Água engarrafada é melhor?", a: "Não. 40% é torneira filtrada e o plástico libera toxinas no calor. Além de custar 2000x mais caro." },
    { id: 18, category: 'health', icon: BrainCircuit, q: "¿O banho importa?", a: "Sim. Sua pele absorve mais cloro em 10 minutos de banho quente do que bebendo 8 copos de água." },
    { id: 19, category: 'health', icon: BrainCircuit, q: "¿Preciso falar com meu médico?", a: "Médicos recomendam hidratação pura. Nosso sistema remove o sódio e metais que sobrecarregam os rins." },
    { id: 20, category: 'health', icon: BrainCircuit, q: "¿Por que decidir agora?", a: "Porque cada dia que passa é um dia a mais que sua família consome contaminantes acumulativos. A saúde não espera." }
  ];

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#020617] px-4 py-24">
      <div className="pointer-events-none absolute right-1/4 top-0 h-80 w-80 rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-200">
            <HelpCircle size={14} />
            <span>{t.transparency}</span>
          </div>
          <h2 className="mb-6 font-serif text-4xl font-black text-white md:text-5xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">{t.subtitle}</p>
        </div>

        {/* INFOGRÁFICO INTERATIVO (GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {questions.map((item) => (
            <MotionDiv 
              key={item.id}
              layoutId={`card-${item.id}`}
              onClick={() => setActiveId(activeId === item.id ? null : item.id)}
              className={`relative cursor-pointer rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                activeId === item.id
                  ? 'z-10 scale-[1.02] border-cyan-300/40 bg-white/[0.07] shadow-[0_20px_50px_-20px_rgba(34,211,238,0.4)]'
                  : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/30 hover:bg-white/[0.06]'
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-3 ${activeId === item.id ? 'bg-cyan-400 text-slate-900' : 'bg-white/5 text-cyan-300'}`}>
                  <item.icon size={20} />
                </div>
                {activeId === item.id ? (
                  <X size={20} className="text-slate-400 hover:text-white" />
                ) : (
                  <ChevronDown size={20} className="text-slate-500" />
                )}
              </div>

              <h3 className={`mb-2 text-sm font-bold leading-tight md:text-base ${activeId === item.id ? 'text-white' : 'text-slate-200'}`}>
                {item.q}
              </h3>

              <AnimatePresence>
                {activeId === item.id && (
                  <MotionDiv 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/10 text-slate-300 text-sm leading-relaxed font-medium">
                      {item.a}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
              
              {!activeId && (
                <p className="text-xs text-slate-400 line-clamp-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Toque para ver a resposta...
                </p>
              )}
            </MotionDiv>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ainda com dúvidas?</p>
          <p className="mt-2 font-serif text-xl font-bold text-white">Nossos analistas estão prontos para explicar cada detalhe.</p>
        </div>
      </div>
    </section>
  );
};
