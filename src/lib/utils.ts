import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtINR(amount: number): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1e7) {
    formatted = '₹' + (abs / 1e7).toFixed(2) + 'Cr';
  } else if (abs >= 1e5) {
    formatted = '₹' + (abs / 1e5).toFixed(2) + 'L';
  } else {
    formatted = '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return amount < 0 ? '-' + formatted : formatted;
}

export function fmtUSD(amount: number): string {
  return '$' + Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtPct(pct: number): string {
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
}

export function gainColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}
