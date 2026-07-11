import { calculateTax } from './tax';
import type {
  StockEntry,
  MacroSettings,
  StockMetrics,
  PortfolioSummary,
} from './types';

export function calcStockMetrics(
  stock: StockEntry,
  macro: MacroSettings
): StockMetrics {
  const monthsHeld = Math.max(0, stock.monthsHeld);
  const yearsHeld = monthsHeld / 12;

  // Back-calculate historical USD/INR using annual depreciation compounded
  const depRate = macro.annualINRDepreciation / 100;
  const historicalUSDINR =
    depRate === 0
      ? macro.currentUSDINR
      : macro.currentUSDINR / Math.pow(1 + depRate, yearsHeld);

  const purchaseValueUSD = stock.shares * stock.purchasePriceUSD;
  const currentValueUSD = stock.shares * stock.currentPriceUSD;

  const purchaseValueINR = purchaseValueUSD * historicalUSDINR;
  const currentValueINR = currentValueUSD * macro.currentUSDINR;

  const grossGainINR = currentValueINR - purchaseValueINR;
  const grossGainPct =
    purchaseValueINR > 0 ? (grossGainINR / purchaseValueINR) * 100 : 0;

  const { taxRate, taxAmount } = calculateTax(
    grossGainINR,
    monthsHeld,
    macro.incomeSlabNew,
    macro.surcharge
  );

  const postTaxGainINR = grossGainINR - taxAmount;
  const postTaxReturnPct =
    purchaseValueINR > 0 ? (postTaxGainINR / purchaseValueINR) * 100 : 0;

  // Inflation erosion: how much more INR needed to maintain purchasing power
  const inflationErosionINR =
    purchaseValueINR * (Math.pow(1 + macro.annualInflation / 100, yearsHeld) - 1);

  const realGainINR = postTaxGainINR - inflationErosionINR;
  const realReturnPct =
    purchaseValueINR > 0 ? (realGainINR / purchaseValueINR) * 100 : 0;

  // Currency impact: gain purely from INR weakening (holding USD assets)
  const currencyImpactINR =
    purchaseValueUSD * (macro.currentUSDINR - historicalUSDINR);

  return {
    stock,
    yearsHeld,
    monthsHeld,
    classification: monthsHeld >= 24 ? 'LTCG' : 'STCG',
    historicalUSDINR,
    purchaseValueUSD,
    currentValueUSD,
    purchaseValueINR,
    currentValueINR,
    grossGainINR,
    grossGainPct,
    taxRateEffective: taxRate,
    taxAmountINR: taxAmount,
    postTaxGainINR,
    postTaxReturnPct,
    inflationErosionINR,
    realGainINR,
    realReturnPct,
    currencyImpactINR,
  };
}

export function calcPortfolioSummary(metrics: StockMetrics[]): PortfolioSummary {
  if (metrics.length === 0) {
    return {
      totalInvestedINR: 0,
      totalCurrentValueINR: 0,
      totalGrossGainINR: 0,
      totalGrossGainPct: 0,
      totalTaxINR: 0,
      totalPostTaxGainINR: 0,
      totalPostTaxReturnPct: 0,
      totalInflationErosionINR: 0,
      totalRealGainINR: 0,
      totalRealReturnPct: 0,
    };
  }

  const totalInvestedINR = metrics.reduce((s, m) => s + m.purchaseValueINR, 0);
  const totalCurrentValueINR = metrics.reduce((s, m) => s + m.currentValueINR, 0);
  const totalGrossGainINR = totalCurrentValueINR - totalInvestedINR;
  const totalGrossGainPct =
    totalInvestedINR > 0 ? (totalGrossGainINR / totalInvestedINR) * 100 : 0;
  const totalTaxINR = metrics.reduce((s, m) => s + m.taxAmountINR, 0);
  const totalPostTaxGainINR = totalGrossGainINR - totalTaxINR;
  const totalPostTaxReturnPct =
    totalInvestedINR > 0 ? (totalPostTaxGainINR / totalInvestedINR) * 100 : 0;
  const totalInflationErosionINR = metrics.reduce((s, m) => s + m.inflationErosionINR, 0);
  const totalRealGainINR = totalPostTaxGainINR - totalInflationErosionINR;
  const totalRealReturnPct =
    totalInvestedINR > 0 ? (totalRealGainINR / totalInvestedINR) * 100 : 0;

  return {
    totalInvestedINR,
    totalCurrentValueINR,
    totalGrossGainINR,
    totalGrossGainPct,
    totalTaxINR,
    totalPostTaxGainINR,
    totalPostTaxReturnPct,
    totalInflationErosionINR,
    totalRealGainINR,
    totalRealReturnPct,
  };
}
