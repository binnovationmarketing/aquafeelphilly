import React from 'react';
import AquaFeelLogo from './AquaFeelLogo';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aqua-500/10 rounded-full blur-[100px] opacity-50 animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="animate-in fade-in zoom-in duration-700">
                    <AquaFeelLogo width="240px" variant="white" className="drop-shadow-2xl" />
                </div>

                <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    <Loader2 size={28} className="text-aqua-400 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Experience</p>
                </div>
            </div>
        </div>
    );
};
