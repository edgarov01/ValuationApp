
import { Transaction, Holding, PortfolioSummary, TransactionType } from '../types';

interface TickerAggregates {
  totalQuantityBought: number;
  totalCostOfBuys: number;
  totalQuantitySold: number;
}

export const calculatePortfolioSummary = (
  transactions: Transaction[],
  manualPrices: Record<string, { price: number; date: string }>
): PortfolioSummary => {
  const holdingsMap = new Map<string, Holding>();
  const tickerAggregates = new Map<string, TickerAggregates>();

  // Aggregate buys and sells
  for (const tx of transactions) {
    const existingAgg = tickerAggregates.get(tx.ticker) || {
      totalQuantityBought: 0,
      totalCostOfBuys: 0,
      totalQuantitySold: 0,
    };

    if (tx.type === TransactionType.BUY) {
      existingAgg.totalQuantityBought += tx.quantity;
      existingAgg.totalCostOfBuys += tx.quantity * tx.price + (tx.commissions || 0);
    } else if (tx.type === TransactionType.SELL) {
      existingAgg.totalQuantitySold += tx.quantity;
      // Note: Sell commissions reduce proceeds but don't typically affect cost basis calculation for remaining shares.
      // For simplicity here, we focus on cost basis of shares held.
    }
    tickerAggregates.set(tx.ticker, existingAgg);
  }
  
  let totalPortfolioMarketValue = 0;
  let totalPortfolioCostBasis = 0;

  // Calculate holdings
  for (const [ticker, agg] of tickerAggregates.entries()) {
    const currentShares = agg.totalQuantityBought - agg.totalQuantitySold;

    if (currentShares > 0) {
      const averageCostPerShare = agg.totalQuantityBought > 0 ? agg.totalCostOfBuys / agg.totalQuantityBought : 0;
      const totalCostBasis = currentShares * averageCostPerShare;
      
      const manualPriceInfo = manualPrices[ticker];
      const lastManuallyUpdatedPrice = manualPriceInfo ? manualPriceInfo.price : averageCostPerShare; // Default to avg cost if no manual update
      const lastPriceUpdateDate = manualPriceInfo ? manualPriceInfo.date : undefined;

      const marketValue = currentShares * lastManuallyUpdatedPrice;
      const unrealizedGainLoss = marketValue - totalCostBasis;

      holdingsMap.set(ticker, {
        ticker,
        shares: currentShares,
        averageCostPerShare,
        totalCostBasis,
        lastManuallyUpdatedPrice,
        lastPriceUpdateDate,
        marketValue,
        unrealizedGainLoss,
        portfolioPercentage: 0, // Will calculate later
      });

      totalPortfolioMarketValue += marketValue;
      totalPortfolioCostBasis += totalCostBasis;
    }
  }

  const holdings: Holding[] = Array.from(holdingsMap.values()).map(h => ({
    ...h,
    portfolioPercentage: totalPortfolioMarketValue > 0 ? (h.marketValue / totalPortfolioMarketValue) * 100 : 0,
  }));
  
  holdings.sort((a,b) => b.marketValue - a.marketValue); // Sort by market value desc

  return {
    holdings,
    totalMarketValue: totalPortfolioMarketValue,
    totalCostBasis: totalPortfolioCostBasis,
    overallUnrealizedGainLoss: totalPortfolioMarketValue - totalPortfolioCostBasis,
  };
};
    