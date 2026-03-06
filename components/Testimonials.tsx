import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface TestimonialsProps {
  lang: Language;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ lang }) => {
  const t = translations[lang].testimonials;

  return (
    <section className="py-20 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
            {t.title}
          </h2>
          <p className="text-slate-500 mt-4">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all duration-300">
                <Quote className="absolute top-6 right-6 text-slate-100 group-hover:text-amber-100 transition-colors" size={40} />
                <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed italic">
                    "{t.t1}"
                </p>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">MJ</div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Mariana J.</p>
                        <p className="text-xs text-slate-400">New Jersey</p>
                    </div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-amber-400 relative transform md:-translate-y-4">
                <Quote className="absolute top-6 right-6 text-slate-100" size={40} />
                <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed italic">
                    "{t.t2}"
                </p>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-aqua-100 rounded-full flex items-center justify-center text-aqua-700 font-bold">RC</div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Roberto & Carla</p>
                        <p className="text-xs text-slate-400">Pennsylvania</p>
                    </div>
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all duration-300">
                <Quote className="absolute top-6 right-6 text-slate-100 group-hover:text-amber-100 transition-colors" size={40} />
                <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed italic">
                    "{t.t3}"
                </p>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">AL</div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Ana Lucia</p>
                        <p className="text-xs text-slate-400">Florida</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};