import type { IncomeSlabNew, SurchargeLevel } from './types';

const CESS = 0.04;
const LTCG_BASE_RATE = 0.125; // 12.5% Finance Act 2024

// New Tax Regime FY 2025-26 slab rates
const SLAB_RATES_NEW: Record<IncomeSlabNew, number> = {
  nil: 0,
  '5': 0.05,
  '10': 0.10,
  '15': 0.15,
  '20': 0.20,
  '25': 0.25,
  '30': 0.30,
};

const SURCHARGE_RATES: Record<SurchargeLevel, number> = {
  '0': 0,
  '10': 0.10,
  '15': 0.15,
  '25': 0.25,
};

export function getSTCGEffectiveRate(slab: IncomeSlabNew, surcharge: SurchargeLevel): number {
  const base = SLAB_RATES_NEW[slab];
  const sur = SURCHARGE_RATES[surcharge];
  const baseTaxOnUnit = base;
  const surchargeOnUnit = baseTaxOnUnit * sur;
  const cessOnUnit = (baseTaxOnUnit + surchargeOnUnit) * CESS;
  return baseTaxOnUnit + surchargeOnUnit + cessOnUnit;
}

export function getLTCGEffectiveRate(surcharge: SurchargeLevel): number {
  const sur = SURCHARGE_RATES[surcharge];
  const baseTax = LTCG_BASE_RATE;
  const surchargeAmt = baseTax * sur;
  const cess = (baseTax + surchargeAmt) * CESS;
  return baseTax + surchargeAmt + cess;
}

export function calculateTax(
  grossGainINR: number,
  monthsHeld: number,
  slab: IncomeSlabNew,
  surcharge: SurchargeLevel
): { taxRate: number; taxAmount: number } {
  if (grossGainINR <= 0) {
    return { taxRate: 0, taxAmount: 0 };
  }

  const isLTCG = monthsHeld >= 24;

  const taxRate = isLTCG
    ? getLTCGEffectiveRate(surcharge)
    : getSTCGEffectiveRate(slab, surcharge);

  return {
    taxRate,
    taxAmount: grossGainINR * taxRate,
  };
}

export const SLAB_LABELS: Record<IncomeSlabNew, string> = {
  nil: '0% (₹0–₹4L)',
  '5': '5% (₹4L–₹8L)',
  '10': '10% (₹8L–₹12L)',
  '15': '15% (₹12L–₹16L)',
  '20': '20% (₹16L–₹20L)',
  '25': '25% (₹20L–₹24L)',
  '30': '30% (>₹24L)',
};

export const SURCHARGE_LABELS: Record<SurchargeLevel, string> = {
  '0': '0% (Total income ≤₹50L)',
  '10': '10% (₹50L–₹1Cr)',
  '15': '15% (₹1Cr–₹2Cr)',
  '25': '25% (>₹2Cr)',
};
