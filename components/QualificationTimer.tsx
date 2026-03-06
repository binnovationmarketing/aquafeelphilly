
import React, { useState, useEffect, useCallback } from 'react';
import { Timer, CheckCircle, ChevronRight } from 'lucide-react';
import { Language } from '../utils/i18n';

interface QualificationTimerProps {
    lang: Language;
    durationSeconds?: number;
    onComplete?: () => void;
}

export const QualificationTimer: React.FC<QualificationTimerProps> = ({
    lang,
    durationSeconds = 30,
    onComplete
}) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const labels = {
        pt: {
            title: 'Tempo de Reflexão',
            subtitle: 'Deixe estas informações assimilarem por',
            seconds: 'segundos',
            start: 'Iniciar Timer',
            done: 'Pronto!',
            doneSubtitle: 'O cliente tem toda a informação necessária para decidir.',
            cta: 'Ver Proposta',
        },
        en: {
            title: 'Reflection Time',
            subtitle: 'Let this information sink in for',
            seconds: 'seconds',
            start: 'Start Timer',
            done: 'Done!',
            doneSubtitle: 'The client has all the information needed to decide.',
            cta: 'See Proposal',
        },
        es: {
            title: 'Tiempo de Reflexión',
            subtitle: 'Deje que esta información se asimile durante',
            seconds: 'segundos',
            start: 'Iniciar Timer',
            done: '¡Listo!',
            doneSubtitle: 'El cliente tiene toda la información necesaria para decidir.',
            cta: 'Ver Propuesta',
        }
    };

    const t = labels[lang];
    const percentage = ((durationSeconds - timeLeft) / durationSeconds) * 100;

    const startTimer = useCallback(() => {
        setIsRunning(true);
        setTimeLeft(durationSeconds);
        setIsDone(false);
    }, [durationSeconds]);

    useEffect(() => {
        if (!isRunning) return;

        if (timeLeft <= 0) {
            setIsRunning(false);
            setIsDone(true);
            onComplete?.();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Background glow */}
            <div className={`absolute inset-0 transition-all duration-1000 ${isDone ? 'bg-emerald-500/10' : isRunning ? 'bg-aqua-500/5' : ''}`} />

            <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Timer size={16} className="text-aqua-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-aqua-400">{t.title}</span>
                </div>

                {/* Timer Circle */}
                <div className="relative w-36 h-36 mx-auto mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={isDone ? '#10b981' : '#00AEEF'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isDone ? (
                            <CheckCircle size={48} className="text-emerald-400" />
                        ) : (
                            <span className="text-4xl font-black font-mono text-white">
                                {timeLeft}
                            </span>
                        )}
                    </div>
                </div>

                {isDone ? (
                    <div>
                        <h3 className="text-2xl font-black text-emerald-400 mb-2">{t.done}</h3>
                        <p className="text-slate-400 text-sm mb-6">{t.doneSubtitle}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-slate-400 text-sm mb-2">
                            {t.subtitle} <span className="font-black text-white">{durationSeconds} {t.seconds}</span>
                        </p>
                        {!isRunning && (
                            <p className="text-slate-500 text-xs mb-6">
                                {lang === 'pt' ? 'Pressione para iniciar o silêncio estratégico.' :
                                    lang === 'en' ? 'Press to start the strategic silence.' :
                                        'Presione para iniciar el silencio estratégico.'}
                            </p>
                        )}
                    </div>
                )}

                {!isRunning && !isDone && (
                    <button
                        onClick={startTimer}
                        className="px-8 py-3 bg-aqua-600 hover:bg-aqua-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-aqua-500/30"
                    >
                        {t.start}
                    </button>
                )}

                {isDone && onComplete && (
                    <button
                        onClick={onComplete}
                        className="flex items-center gap-2 mx-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                        {t.cta}
                        <ChevronRight size={16} />
                    </button>
                )}

                {isRunning && (
                    <div className="flex gap-1 justify-center mt-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-aqua-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
