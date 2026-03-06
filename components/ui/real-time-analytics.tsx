
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Wallet, Zap, Search, TrendingUp } from 'lucide-react';

// Workaround for framer-motion type mismatch
const MotionPath = motion.path as any;
const MotionDiv = motion.div as any;

interface DebtPoint {
    month: number;
    balanceStandard: number; // Saldo devedor (Cenário Lento)
    balanceSmart: number;    // Saldo devedor com aporte (Cenário Rápido)
    realityMonthly: number;  // Custo Mercado (Inflação)
    programMonthly: number;  // Parcela Paga neste mês
    monthlyProfit: number;   // Lucro do mês
    accumulatedProfit: number; // Lucro acumulado
    isExtraMonth: boolean;
}

interface AnalyticsProps {
    waterMonthly: number;
    soapMonthly: number;
    fixedMonthly: number;
    cashPrice: number;
    lang: string;
    financingMonths: number;
    creditScoreLabel: string;
}

export function Component({
    waterMonthly,
    soapMonthly,
    fixedMonthly,
    cashPrice,
    lang,
    financingMonths
}: AnalyticsProps) {

    // Alterado para iniciar com 0 conforme solicitado
    const [extraPayment, setExtraPayment] = useState<number>(0);
    const [paymentMonth, setPaymentMonth] = useState<number>(12);
    const [selectedPoint, setSelectedPoint] = useState<DebtPoint | null>(null);

    const t: any = {
        pt: {
            title: "SIMULADOR DE ATALHO FINANCEIRO",
            subtitle: "Clique nas linhas para comparar os cenários",
            inputLabel: "Se eu pagar um aporte de:",
            whenLabel: "No mês número:",
            resultTitle: "VOCÊ ELIMINOU:",
            years: "anos",
            months: "meses",
            tableTitle: "RAIO-X DO MÊS",
            marketCost: "Custo Mercado (Inflação)",
            programCost: "Parcela Aquafeel",
            balance: "Saldo Devedor",
            extraPaid: "Aporte no Capital!",
            economy: "Lucro Mensal Líquido",
            accumulated: "Lucro Acumulado",
            scenarioStandard: "Cenário Comum",
            scenarioSmart: "Cenário Aquafeel"
        },
        en: {
            title: "FINANCIAL SHORTCUT SIMULATOR",
            subtitle: "Click lines to compare scenarios",
            inputLabel: "If I pay an extra:",
            whenLabel: "At month number:",
            resultTitle: "YOU ELIMINATED:",
            years: "years",
            months: "months",
            tableTitle: "MONTH X-RAY",
            marketCost: "Market Cost (Inflation)",
            programCost: "Aquafeel Payment",
            balance: "Principal Balance",
            extraPaid: "Principal Payment!",
            economy: "Net Monthly Profit",
            accumulated: "Accumulated Profit",
            scenarioStandard: "Standard Scenario",
            scenarioSmart: "Aquafeel Scenario"
        },
        es: {
            title: "SIMULADOR DE ATAJO FINANCIERO",
            subtitle: "Haga clic en las líneas para comparar",
            inputLabel: "Si pago un aporte de:",
            whenLabel: "En el mes número:",
            resultTitle: "ELIMINASTE:",
            years: "años",
            months: "meses",
            tableTitle: "RAYOS-X DEL MES",
            marketCost: "Costo Mercado (Inflación)",
            programCost: "Cuota Aquafeel",
            balance: "Saldo Principal",
            extraPaid: "¡Aporte a Capital!",
            economy: "Ganancia Mensual Neta",
            accumulated: "Ganancia Acumulada",
            scenarioStandard: "Escenario Común",
            scenarioSmart: "Escenario Aquafeel"
        }
    }[lang] || {
        title: "FINANCIAL SHORTCUT SIMULATOR",
        subtitle: "Click on chart for details",
        inputLabel: "If I pay an extra:",
        whenLabel: "At month number:",
        resultTitle: "YOU ELIMINATED:",
        years: "years",
        months: "months",
        tableTitle: "MONTH X-RAY",
        marketCost: "Market Cost (Inflation)",
        programCost: "Aquafeel Payment (Fixed)",
        balance: "Remaining Balance",
        extraPaid: "Extra Payment!",
        economy: "Monthly Savings",
        accumulated: "Accumulated Profit",
        scenarioStandard: "Standard",
        scenarioSmart: "Smart"
    };

    // --- MOTOR MATEMÁTICO REAL ---
    const simulation = useMemo(() => {
        let monthlyRate = 0;
        if (financingMonths > 0 && fixedMonthly > 0) {
            let low = 0;
            let high = 1;
            let guess = 0.01;
            for (let i = 0; i < 20; i++) {
                const factor = Math.pow(1 + guess, financingMonths);
                const pmt = cashPrice * guess * factor / (factor - 1);
                if (Math.abs(pmt - fixedMonthly) < 0.01) break;
                if (pmt > fixedMonthly) high = guess;
                else low = guess;
                guess = (low + high) / 2;
            }
            monthlyRate = guess;
        }

        const annualInflation = 0.07;
        const monthlyInfRate = Math.pow(1 + annualInflation, 1 / 12) - 1;

        const data: DebtPoint[] = [];

        let balanceStandard = cashPrice;
        let balanceSmart = cashPrice;
        let accumulatedProfitSmart = 0;

        let endMonthStandard = financingMonths;
        let endMonthSmart = financingMonths;

        // Loop estendido para mostrar o futuro
        const maxLoop = Math.max(financingMonths, 60) + 24;

        for (let m = 0; m <= maxLoop; m++) {
            const currentRealityCost = (waterMonthly + soapMonthly) * Math.pow(1 + monthlyInfRate, m);

            // 1. Cenário Standard (Sem aporte extra)
            // Simula o pagamento normal da parcela fixa até acabar
            if (m > 0 && balanceStandard > 0.1) {
                const interest = balanceStandard * monthlyRate;
                const principalPart = fixedMonthly - interest;
                balanceStandard = Math.max(0, balanceStandard - principalPart);
                if (balanceStandard <= 0.1) endMonthStandard = m;
            } else if (m === 0) {
                balanceStandard = cashPrice;
            } else {
                balanceStandard = 0;
            }

            // 2. Cenário Smart (Com aporte extra ÚNICO no mês selecionado)
            let smartPayment = 0;
            let isExtraMonth = false;

            if (m > 0 && balanceSmart > 0.1) {
                const interest = balanceSmart * monthlyRate;
                let paymentNow = fixedMonthly;
                let extraNow = 0;

                // APLICA O APORTE APENAS NO MÊS SELECIONADO
                if (m === paymentMonth) {
                    extraNow = extraPayment;
                    isExtraMonth = true;
                }

                if (balanceSmart + interest < (paymentNow + extraNow)) {
                    paymentNow = balanceSmart + interest;
                    extraNow = 0;
                }

                smartPayment = paymentNow + extraNow;

                // Abate do principal
                const principalDeduction = smartPayment - interest;
                balanceSmart = Math.max(0, balanceSmart - principalDeduction);

                if (balanceSmart <= 0.1) {
                    endMonthSmart = m;
                }
            } else if (m === 0) {
                balanceSmart = cashPrice;
            } else {
                balanceSmart = 0;
                smartPayment = 0;
            }

            // Lucro = Custo de Mercado - O que pagou no Aquafeel
            const monthlyProfit = currentRealityCost - smartPayment;
            accumulatedProfitSmart += monthlyProfit;

            data.push({
                month: m,
                balanceStandard,
                balanceSmart,
                realityMonthly: currentRealityCost,
                programMonthly: smartPayment,
                monthlyProfit,
                accumulatedProfit: accumulatedProfitSmart,
                isExtraMonth
            });
        }

        const monthsSaved = Math.max(0, endMonthStandard - endMonthSmart);

        return { data, monthsSaved, endMonthStandard, endMonthSmart, totalContractValue: cashPrice };
    }, [fixedMonthly, financingMonths, extraPayment, paymentMonth, waterMonthly, soapMonthly, cashPrice]);

    // SVG Config
    const chartHeight = 350;
    const chartWidth = 900;
    // Margem superior para o gráfico não bater no teto
    const maxBalance = simulation.data[0].balanceStandard * 1.2;

    // Limita o eixo X para não ficar muito longo vazio se a divida acabar cedo
    const visibleMonths = Math.max(simulation.endMonthStandard, 60) + 5;

    const getX = (month: number) => (month / visibleMonths) * chartWidth;
    const getY = (balance: number) => chartHeight - (balance / maxBalance) * chartHeight - 20; // -20 padding bottom

    // Paths
    const smartPath = simulation.data.slice(0, visibleMonths).map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.balanceSmart)}`
    ).join(' ');

    const standardPath = simulation.data.slice(0, visibleMonths).map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.balanceStandard)}`
    ).join(' ');

    const savedYears = Math.floor(simulation.monthsSaved / 12);
    const savedRemainingMonths = simulation.monthsSaved % 12;

    const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const svgRect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - svgRect.left;
        const clickedMonthIndex = Math.round((clickX / svgRect.width) * visibleMonths);

        if (clickedMonthIndex >= 0 && clickedMonthIndex < simulation.data.length) {
            setSelectedPoint(simulation.data[clickedMonthIndex]);
        }
    };

    return (
        <div className="w-full bg-white text-slate-800 overflow-hidden rounded-[2.5rem] flex flex-col items-center border border-slate-200 py-10 mt-6 shadow-xl relative select-none">

            {/* Background Decorativo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />

            <header className="relative z-10 text-center mb-8 px-4 w-full">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-100 shadow-sm">
                    <Zap size={14} fill="currentColor" /> {t.title}
                </div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase break-words px-2">{t.subtitle}</h2>
            </header>

            {/* CONTROLES */}
            <div className="relative z-20 w-full max-w-5xl px-4 md:px-8 mb-4">
                <div className="bg-slate-50/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 shadow-md flex flex-col lg:flex-row gap-6 items-center">

                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <Wallet size={16} className="text-emerald-500" /> {t.inputLabel}
                        </label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-900 font-black text-lg">$</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={extraPayment}
                                onChange={(e) => setExtraPayment(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-900 font-mono text-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" /> {t.whenLabel}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max={financingMonths - 1}
                            value={paymentMonth}
                            onChange={(e) => {
                                setPaymentMonth(Number(e.target.value));
                                // Atualiza o ponto selecionado automaticamente ao mover o slider
                                if (simulation.data[Number(e.target.value)]) {
                                    setSelectedPoint(simulation.data[Number(e.target.value)]);
                                }
                            }}
                            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>Mês 1</span>
                            <span className="text-blue-600 font-bold">Aporte Mês {paymentMonth}</span>
                            <span>Mês {financingMonths}</span>
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl min-w-[150px] text-center shadow-sm">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">{t.resultTitle}</span>
                        <div className="flex items-baseline justify-center gap-1">
                            {savedYears > 0 && <span className="text-2xl font-black text-slate-900 tracking-tighter">{savedYears}<span className="text-xs ml-1 text-slate-600">{t.years}</span></span>}
                            {savedRemainingMonths > 0 && <span className="text-xl font-black text-emerald-600 tracking-tighter ml-1">+{savedRemainingMonths}<span className="text-xs ml-1 text-emerald-700">{t.months}</span></span>}
                            {simulation.monthsSaved === 0 && <span className="text-xl font-bold text-slate-400">-</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* LEGENDA DO GRÁFICO */}
            <div className="flex gap-6 mt-4 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-500 border-dashed"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.scenarioStandard}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-700 tracking-widest">{t.scenarioSmart}</span>
                </div>
            </div>

            {/* ÁREA GRÁFICA INTERATIVA */}
            <div className="relative z-10 w-full max-w-6xl px-4 h-[400px] mt-2 group cursor-crosshair">

                {/* SVG PRINCIPAL */}
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full overflow-visible"
                    onClick={handleChartClick}
                    onMouseMove={handleChartClick}
                >
                    <defs>
                        <linearGradient id="smartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid Horizontal */}
                    {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                        <line key={ratio} x1="0" y1={chartHeight * ratio} x2={chartWidth} y2={chartHeight * ratio} stroke="#e2e8f0" strokeOpacity="1" />
                    ))}

                    {/* Marcadores Verticais (Linhas Segmentadas) - Opacidade Aumentada */}
                    {simulation.data.slice(0, visibleMonths).map((_, i) => {
                        // Mostra linha a cada 12 meses (ano) ou no mês do aporte ou quando acaba a dívida
                        if (i % 12 === 0 || i === paymentMonth || i === simulation.endMonthSmart) {
                            const x = getX(i);
                            return (
                                <g key={i}>
                                    <line x1={x} y1="0" x2={x} y2={chartHeight} stroke="#cbd5e1" strokeOpacity={1} strokeDasharray="3,3" />
                                    {i % 12 === 0 && (
                                        <text x={x} y={chartHeight + 15} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                                            {Math.floor(i / 12)}y
                                        </text>
                                    )}
                                </g>
                            );
                        }
                        return null;
                    })}

                    {/* 1. LINHA PADRÃO (Tracejada, Vermelha/Cinza) - Desenhada Primeiro (Fica atrás) */}
                    <path
                        d={standardPath}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeOpacity="0.4"
                        strokeDasharray="6,4"
                        strokeLinecap="round"
                    />

                    {/* Área Economizada (Preenchimento Verde) */}
                    {
                        simulation.monthsSaved > 0 && (
                            <path
                                d={`${smartPath} L ${getX(simulation.endMonthStandard)} ${getY(0)} L ${getX(0)} ${getY(simulation.data[0].balanceSmart)} Z`}
                                fill="url(#smartGradient)"
                                opacity="0.3"
                            />
                        )
                    }

                    {/* 2. LINHA SMART (Sólida, Verde, Brilhante) - Desenhada Por Cima */}
                    <MotionPath
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        d={smartPath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />

                    {/* Ponto de Aporte (Destaque Visual) */}
                    {
                        extraPayment > 0 && (
                            <circle
                                cx={getX(paymentMonth)}
                                cy={getY(simulation.data[paymentMonth].balanceSmart)}
                                r="6"
                                fill="#fbbf24"
                                stroke="white"
                                strokeWidth="2"
                                className="animate-pulse"
                            />
                        )
                    }

                    {/* Ponto de Fim da Dívida */}
                    <circle
                        cx={getX(simulation.endMonthSmart)}
                        cy={getY(0)}
                        r="4"
                        fill="#10b981"
                    />

                    {/* Marcador do Ponto Selecionado (Hover) */}
                    {
                        selectedPoint && (
                            <g transform={`translate(${getX(selectedPoint.month)}, 0)`}>
                                <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#3b82f6" strokeWidth="1" />
                                <circle cy={getY(selectedPoint.balanceSmart)} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <circle cy={getY(selectedPoint.balanceStandard)} r="4" fill="#ef4444" stroke="white" strokeWidth="1" opacity="0.8" />
                            </g>
                        )
                    }

                    {/* Camada Invisível para Hit-Testing (Melhora UX no mobile) */}
                    <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="transparent" />

                </svg>

                {/* TABELA FLUTUANTE (POP-OVER - RAIO X) */}
                <AnimatePresence>
                    {selectedPoint && (
                        <MotionDiv
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 w-[300px] bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-5 z-50 pointer-events-none"
                        >
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <Search size={14} className="text-blue-500" />
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.tableTitle} {selectedPoint.month}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">Ano {Math.ceil(selectedPoint.month / 12)}</span>
                            </div>

                            <div className="space-y-3">
                                {/* Linha 1: Custo Mercado */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-red-500 uppercase">{t.marketCost}</span>
                                    <span className="text-sm font-mono font-bold text-red-500">${Math.round(selectedPoint.realityMonthly)}</span>
                                </div>

                                {/* Linha 2: Custo Aquafeel */}
                                <div className="flex justify-between items-center relative">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">{t.programCost}</span>
                                    <span className="text-sm font-mono font-bold text-blue-600">${Math.round(selectedPoint.programMonthly)}</span>
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-10"></div>
                                </div>

                                {/* Linha Extra: Pagamento Extra */}
                                {selectedPoint.isExtraMonth && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex justify-between items-center animate-pulse">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                            <Zap size={10} /> {t.extraPaid}
                                        </span>
                                        <span className="text-xs font-mono font-black text-emerald-700">+${extraPayment}</span>
                                    </div>
                                )}

                                <div className="h-px bg-slate-100 my-2"></div>

                                {/* Linha Lucro (Profit) */}
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                        <TrendingUp size={12} /> {t.economy}
                                    </span>
                                    <span className="text-sm font-mono font-black text-emerald-600">
                                        +${Math.round(selectedPoint.monthlyProfit).toLocaleString()}
                                    </span>
                                </div>

                                {/* Linha Lucro Acumulado */}
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{t.accumulated}</span>
                                    <span className="text-xs font-mono font-bold text-slate-700">
                                        ${Math.round(selectedPoint.accumulatedProfit).toLocaleString()}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-100 my-2"></div>

                                {/* Saldo Devedor */}
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{t.balance}</span>
                                    <div className="text-right">
                                        <span className={`text-xl font-black font-mono tracking-tighter block ${selectedPoint.balanceSmart === 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                                            ${Math.round(selectedPoint.balanceSmart).toLocaleString()}
                                        </span>
                                        {selectedPoint.balanceSmart < selectedPoint.balanceStandard && selectedPoint.balanceSmart > 0 && (
                                            <span className="text-[9px] text-slate-400 line-through block">
                                                Was: ${Math.round(selectedPoint.balanceStandard).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {selectedPoint.balanceSmart === 0 && (
                                    <div className="mt-2 text-center bg-emerald-500 text-white text-[10px] font-black uppercase py-1 rounded-md animate-bounce shadow-md">
                                        DÍVIDA QUITADA!
                                    </div>
                                )}
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest text-center px-4">
                Toque em qualquer lugar da linha do tempo para inspecionar
            </div>

        </div>
    );
}
