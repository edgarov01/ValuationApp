
// User Authentication
export interface User {
  id: string;
  email: string;
}

// Valuation Sandbox Module
export interface BaseYearFinancials {
  revenue: number;
  ebit: number;
  taxRate: number; // percentage, e.g., 21 for 21%
  depreciationAndAmortization: number;
  capex: number;
  changeInNetWorkingCapital: number;
}

export interface DCFAssumptions {
  projectionYears: number; // Default 5
  revenueGrowthRate: number[]; // array for 5 years, percentage e.g., 5 for 5%
  ebitMargin: number[]; // array for 5 years, percentage e.g., 15 for 15%
  discountRateWACC: number; // percentage e.g., 10 for 10%
  perpetualGrowthRate: number; // percentage e.g., 2 for 2%
}

export interface EquityValueCalculationInputs {
  totalDebt: number;
  cashAndCashEquivalents: number;
  dilutedSharesOutstanding: number;
}

export interface RelativeValuationDataInputs {
  currentMarketPrice?: number;
  companyNetIncome: number;
  companyEBITDA: number;
  peerAveragePERatio: number;
  peerAverageEVEBITDARatio: number;
}

export interface ValuationInputs {
  baseYear: BaseYearFinancials;
  dcfAssumptions: DCFAssumptions;
  equityValueInputs: EquityValueCalculationInputs;
  relativeValuationInputs: RelativeValuationDataInputs;
}

export interface ProjectedFinancials {
  year: number;
  revenue: number;
  ebit: number;
  taxOnEbit: number;
  nopat: number;
  depreciationAndAmortization: number;
  capex: number;
  changeInNetWorkingCapital: number;
  fcff: number;
  discountedFcff: number;
}

export interface ValuationResults {
  intrinsicValuePerShareDCF: number;
  impliedValuePerSharePE: number;
  impliedValuePerShareEVEBITDA: number;
  enterpriseValueDCF: number;
  equityValueDCF: number;
  terminalValue: number;
  presentTerminalValue: number;
  sumDiscountedFCFF: number;
  projectedFinancials?: ProjectedFinancials[];
  footballFieldData: { name: string; value: number }[];
}

export interface ValuationCase {
  id: string;
  userId: string;
  caseName: string;
  inputs: ValuationInputs;
  results?: ValuationResults;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Portfolio Ledger Module
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Transaction {
  id: string;
  portfolioId: string;
  type: TransactionType;
  ticker: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  price: number;
  commissions?: number;
}

export interface Holding {
  ticker: string;
  shares: number;
  averageCostPerShare: number;
  totalCostBasis: number;
  lastManuallyUpdatedPrice: number; // Default to 0 or average cost if not updated
  lastPriceUpdateDate?: string; // YYYY-MM-DD
  marketValue: number;
  unrealizedGainLoss: number;
  portfolioPercentage: number; // % of total portfolio market value
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  transactions: Transaction[];
  // For manual price updates, storing them per portfolio per ticker
  manualPrices: Record<string, { price: number; date: string }>; // ticker -> {price, date}
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  overallUnrealizedGainLoss: number;
  holdings: Holding[];
}

// Tooltip Prop type
export interface TooltipProps {
  text: string;
  children?: React.ReactNode; // Optional: if wrapping an element
}
    