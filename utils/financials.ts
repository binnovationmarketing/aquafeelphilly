
type CreditFactors = {
  '180x': number;
  '120x': number;
  '60x': number;
};

export const getCreditRange = (score: number | undefined) => {
  if (!score) return { label: '-', color: 'text-slate-400', factors: { '180x': 1.62, '120x': 1.80, '60x': 2.70 } };
  
  if (score >= 740) return { label: 'Excellent (740+)', color: 'text-emerald-600', factors: { '180x': 1.14, '120x': 1.38, '60x': 2.17 } };
  if (score >= 700) return { label: 'Great (700-739)', color: 'text-emerald-500', factors: { '180x': 1.24, '120x': 1.47, '60x': 2.25 } };
  if (score >= 660) return { label: 'Good (660-699)', color: 'text-blue-500', factors: { '180x': 1.37, '120x': 1.59, '60x': 2.39 } };
  if (score >= 620) return { label: 'Fair (620-659)', color: 'text-yellow-500', factors: { '180x': 1.55, '120x': 1.74, '60x': 2.61 } };
  
  return { label: 'Challenged (<620)', color: 'text-red-500', factors: { '180x': 1.62, '120x': 1.80, '60x': 2.70 } };
};

export const calculateMonthlyInstallment = (score: number | undefined, basePrice: number = 8790, months: 60 | 120 | 180 = 180): number => {
  if (!score) return 0;
  const { factors } = getCreditRange(score);
  const factor = factors[`${months}x` as keyof CreditFactors];
  return Math.round((basePrice * factor) / 100);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};
