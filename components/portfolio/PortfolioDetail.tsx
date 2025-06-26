
import React, { useContext, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PortfolioContext } from '../../contexts/PortfolioContext';
import { Transaction, Holding, TransactionType, PortfolioSummary } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import TransactionFormModal from './TransactionFormModal';
import PriceUpdateModal from './PriceUpdateModal';

const PortfolioDetail: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const portfolioContext = useContext(PortfolioContext);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  // const [editingTransaction, setEditingTransaction] = useState<Omit<Transaction, 'id' | 'portfolioId'> | undefined>(undefined);
  // Editing transactions can be complex with undo/redo, for simplicity we'll focus on add/delete.
  
  const [isPriceUpdateModalOpen, setIsPriceUpdateModalOpen] = useState(false);
  const [priceUpdateTicker, setPriceUpdateTicker] = useState<string>('');
  const [currentPriceForUpdate, setCurrentPriceForUpdate] = useState<number | undefined>(undefined);
  const [currentDateForUpdate, setCurrentDateForUpdate] = useState<string | undefined>(undefined);


  if (!portfolioContext || !portfolioId) {
    return <div>Loading portfolio details...</div>;
  }

  const { getPortfolioById, addTransaction, deleteTransaction, updateHoldingPrice, getPortfolioSummary } = portfolioContext;
  const portfolio = getPortfolioById(portfolioId);
  
  // Use useMemo to recalculate summary only when portfolio data changes
  const portfolioSummary: PortfolioSummary | null = useMemo(() => {
    if (portfolio) {
      return getPortfolioSummary(portfolio.id);
    }
    return null;
  }, [portfolio, getPortfolioSummary]);


  if (!portfolio || !portfolioSummary) {
    return (
        <div className="text-center">
            <h1 className="text-xl font-semibold">Portfolio not found.</h1>
            <Link to="/portfolio" className="text-indigo-600 hover:underline">Return to Portfolios</Link>
        </div>
    );
  }

  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'portfolioId'>) => {
    addTransaction(portfolioId, txData);
  };
  
  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(portfolioId, transactionId);
    }
  };

  const openPriceUpdateModal = (holding: Holding) => {
    setPriceUpdateTicker(holding.ticker);
    setCurrentPriceForUpdate(holding.lastManuallyUpdatedPrice);
    setCurrentDateForUpdate(holding.lastPriceUpdateDate || new Date().toISOString().split('T')[0]);
    setIsPriceUpdateModalOpen(true);
  };

  const handlePriceUpdate = (ticker: string, price: number, date: string) => {
    updateHoldingPrice(portfolioId, ticker, price, date);
  };

  const formatCurrency = (value: number | undefined, minimumFractionDigits = 2) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits, maximumFractionDigits: minimumFractionDigits });
  };
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Portfolio: {portfolio.name}</h1>
        <Button variant="primary" onClick={() => setIsTxModalOpen(true)}>Add Transaction</Button>
      </div>

      {/* Portfolio Summary */}
      <Card title="Portfolio Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-sm text-gray-500">Total Market Value</p>
                <p className="text-2xl font-semibold">{formatCurrency(portfolioSummary.totalMarketValue)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Total Cost Basis</p>
                <p className="text-2xl font-semibold">{formatCurrency(portfolioSummary.totalCostBasis)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Overall Unrealized G/L</p>
                <p className={`text-2xl font-semibold ${portfolioSummary.overallUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolioSummary.overallUnrealizedGainLoss)}
                </p>
            </div>
        </div>
      </Card>

      {/* Holdings Table */}
      <Card title="Current Holdings">
        {portfolioSummary.holdings.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">No holdings in this portfolio. Add some transactions!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Ticker', 'Shares', 'Avg Cost/Share', 'Total Cost', 'Last Updated Price', 'Market Value', 'Unrealized G/L', '% of Portfolio', 'Actions'].map(header => (
                     <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {portfolioSummary.holdings.map((h: Holding) => (
                  <tr key={h.ticker}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{h.ticker}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{h.shares.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits: 4})}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(h.averageCostPerShare)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(h.totalCostBasis)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        {formatCurrency(h.lastManuallyUpdatedPrice)}
                        <span className="text-xs text-gray-500 block">
                            {h.lastPriceUpdateDate ? ` (as of ${new Date(h.lastPriceUpdateDate).toLocaleDateString()})` : '(Using Avg Cost)'}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(h.marketValue)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${h.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(h.unrealizedGainLoss)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatPercentage(h.portfolioPercentage)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <Button variant="secondary" size="sm" onClick={() => openPriceUpdateModal(h)}>Update Price</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transactions List */}
       <Card title="Transaction History">
        {portfolio.transactions.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No transactions recorded yet.</p>
        ) : (
            <div className="overflow-x-auto max-h-96"> {/* Max height with scroll */}
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            {['Date', 'Type', 'Ticker', 'Quantity', 'Price', 'Commissions', 'Total Value', 'Actions'].map(header => (
                                <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {portfolio.transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx: Transaction) => ( // Display most recent first
                            <tr key={tx.id}>
                                <td className="px-4 py-3 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className={`px-4 py-3 whitespace-nowrap font-semibold ${tx.type === TransactionType.BUY ? 'text-green-600' : 'text-red-600'}`}>{tx.type}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{tx.ticker}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{tx.quantity.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(tx.price)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(tx.commissions, 0) || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(tx.quantity * tx.price + (tx.commissions || 0) * (tx.type === TransactionType.BUY ? 1 : -1) )}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteTransaction(tx.id)}>Delete</Button>
                                    {/* Edit button can be added here later */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
       </Card>


      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
      {isPriceUpdateModalOpen && priceUpdateTicker && (
        <PriceUpdateModal
            isOpen={isPriceUpdateModalOpen}
            onClose={() => setIsPriceUpdateModalOpen(false)}
            onSubmit={handlePriceUpdate}
            ticker={priceUpdateTicker}
            currentPrice={currentPriceForUpdate}
            currentDate={currentDateForUpdate}
        />
      )}
    </div>
  );
};

export default PortfolioDetail;
    