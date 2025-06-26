
import { ValuationInputs, ValuationResults, ProjectedFinancials, BaseYearFinancials, DCFAssumptions, RelativeValuationDataInputs, EquityValueCalculationInputs } from '../types';

const defaultProjectionYears = 5;

// Helper to convert percentage input (e.g., 5 for 5%) to decimal (0.05)
const pToD = (percentage: number): number => percentage / 100;

export const calculateValuation = (inputs: ValuationInputs): ValuationResults => {
  const { baseYear, dcfAssumptions, equityValueInputs, relativeValuationInputs } = inputs;

  // --- DCF Calculation ---
  const projectedFinancials: ProjectedFinancials[] = [];
  let sumDiscountedFCFF = 0;

  // Base year ratios for projection ( D&A/Rev, Capex/Rev, NWC_Change/Rev )
  // Ensure baseYear.revenue is not zero to avoid division by zero errors.
  const baseRevenue = baseYear.revenue || 1; // Avoid division by zero, though revenue should be >0
  const daToRevenueRatio = baseYear.depreciationAndAmortization / baseRevenue;
  const capexToRevenueRatio = baseYear.capex / baseRevenue;
  const nwcChangeToRevenueRatio = baseYear.changeInNetWorkingCapital / baseRevenue;


  let currentRevenue = baseYear.revenue;

  for (let i = 0; i < (dcfAssumptions.projectionYears || defaultProjectionYears); i++) {
    const year = i + 1;
    const revenueGrowthRate = pToD(dcfAssumptions.revenueGrowthRate[i] || 0);
    const ebitMargin = pToD(dcfAssumptions.ebitMargin[i] || 0);

    const projectedRevenue = currentRevenue * (1 + revenueGrowthRate);
    const projectedEbit = projectedRevenue * ebitMargin;
    const taxOnEbit = projectedEbit * pToD(baseYear.taxRate);
    const nopat = projectedEbit - taxOnEbit;

    const projectedDA = projectedRevenue * daToRevenueRatio;
    const projectedCapex = projectedRevenue * capexToRevenueRatio;
    const projectedChangeInNWC = projectedRevenue * nwcChangeToRevenueRatio; // Simplified: NWC change scales with total revenue size

    const fcff = nopat + projectedDA - projectedCapex - projectedChangeInNWC;
    const discountFactor = Math.pow(1 + pToD(dcfAssumptions.discountRateWACC), year);
    const discountedFcff = fcff / discountFactor;

    projectedFinancials.push({
      year,
      revenue: projectedRevenue,
      ebit: projectedEbit,
      taxOnEbit,
      nopat,
      depreciationAndAmortization: projectedDA,
      capex: projectedCapex,
      changeInNetWorkingCapital: projectedChangeInNWC,
      fcff,
      discountedFcff,
    });

    sumDiscountedFCFF += discountedFcff;
    currentRevenue = projectedRevenue; // Update for next year's projection
  }

  const lastProjectedFCFF = projectedFinancials[projectedFinancials.length - 1]?.fcff || 0;
  const terminalValue = 
    (lastProjectedFCFF * (1 + pToD(dcfAssumptions.perpetualGrowthRate))) /
    (pToD(dcfAssumptions.discountRateWACC) - pToD(dcfAssumptions.perpetualGrowthRate));
  
  const presentTerminalValue = terminalValue / Math.pow(1 + pToD(dcfAssumptions.discountRateWACC), dcfAssumptions.projectionYears || defaultProjectionYears);

  const enterpriseValueDCF = sumDiscountedFCFF + presentTerminalValue;
  const equityValueDCF = enterpriseValueDCF - equityValueInputs.totalDebt + equityValueInputs.cashAndCashEquivalents;
  const intrinsicValuePerShareDCF = equityValueInputs.dilutedSharesOutstanding > 0 ? equityValueDCF / equityValueInputs.dilutedSharesOutstanding : 0;

  // --- Relative Valuation ---
  // P/E Multiple
  const impliedEquityValuePE = relativeValuationInputs.companyNetIncome * relativeValuationInputs.peerAveragePERatio;
  const impliedValuePerSharePE = equityValueInputs.dilutedSharesOutstanding > 0 ? impliedEquityValuePE / equityValueInputs.dilutedSharesOutstanding : 0;

  // EV/EBITDA Multiple
  const impliedEnterpriseValueEVEBITDA = relativeValuationInputs.companyEBITDA * relativeValuationInputs.peerAverageEVEBITDARatio;
  const impliedEquityValueEVEBITDA = impliedEnterpriseValueEVEBITDA - equityValueInputs.totalDebt + equityValueInputs.cashAndCashEquivalents;
  const impliedValuePerShareEVEBITDA = equityValueInputs.dilutedSharesOutstanding > 0 ? impliedEquityValueEVEBITDA / equityValueInputs.dilutedSharesOutstanding : 0;

  // --- Football Field Chart Data ---
  const footballFieldData = [];
  if (relativeValuationInputs.currentMarketPrice !== undefined && relativeValuationInputs.currentMarketPrice !== null) {
    footballFieldData.push({ name: 'Market Price', value: relativeValuationInputs.currentMarketPrice });
  }
  footballFieldData.push({ name: 'DCF Value', value: intrinsicValuePerShareDCF });
  footballFieldData.push({ name: 'Peer P/E Value', value: impliedValuePerSharePE });
  footballFieldData.push({ name: 'Peer EV/EBITDA Value', value: impliedValuePerShareEVEBITDA });
  
  // Sort by value for better chart readability
  footballFieldData.sort((a,b) => a.value - b.value);


  return {
    intrinsicValuePerShareDCF,
    impliedValuePerSharePE,
    impliedValuePerShareEVEBITDA,
    enterpriseValueDCF,
    equityValueDCF,
    terminalValue,
    presentTerminalValue,
    sumDiscountedFCFF,
    projectedFinancials,
    footballFieldData,
  };
};
    