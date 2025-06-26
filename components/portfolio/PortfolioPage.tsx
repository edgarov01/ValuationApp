
import React, { useContext, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PortfolioContext } from '../../contexts/PortfolioContext';
import { Portfolio } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const PortfolioPage: React.FC = () => {
  const portfolioContext = useContext(PortfolioContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [formError, setFormError] = useState('');

  if (!portfolioContext) {
    return <div>Loading portfolio data...</div>;
  }

  const { portfolios, addPortfolio, deletePortfolio, getPortfolioSummary } = portfolioContext;

  const handleCreatePortfolio = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newPortfolioName.trim()) {
      setFormError('Portfolio name cannot be empty.');
      return;
    }
    const created = addPortfolio(newPortfolioName);
    if (created) {
      setNewPortfolioName('');
      setIsModalOpen(false);
    } else {
      setFormError('Failed to create portfolio. Please try again.');
    }
  };
  
  const handleDeletePortfolio = (portfolioId: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio and all its transactions? This action cannot be undone.')) {
      deletePortfolio(portfolioId);
    }
  };
  
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">My Portfolios</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>Create New Portfolio</Button>
      </div>

      {portfolios.length === 0 && (
        <Card>
          <p className="text-gray-600 text-center py-8">
            No portfolios found. Create one to start tracking your investments!
          </p>
        </Card>
      )}

      {portfolios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((p: Portfolio) => {
            const summary = getPortfolioSummary(p.id);
            return (
              <Card key={p.id} title={p.name} className="flex flex-col justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created: {new Date(p.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 mb-3">Transactions: {p.transactions.length}</p>
                  {summary && (
                    <div className="space-y-1 text-sm mb-4">
                        <p><strong>Total Value:</strong> {formatCurrency(summary.totalMarketValue)}</p>
                        <p><strong>Total Cost:</strong> {formatCurrency(summary.totalCostBasis)}</p>
                        <p className={summary.overallUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            <strong>Unrealized G/L:</strong> {formatCurrency(summary.overallUnrealizedGainLoss)}
                        </p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 justify-end mt-auto">
                  <Link to={`/portfolio/${p.id}`}>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => handleDeletePortfolio(p.id)}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Portfolio">
        <form onSubmit={handleCreatePortfolio} className="space-y-4">
          <Input
            id="newPortfolioName"
            label="Portfolio Name"
            type="text"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            required
            placeholder="e.g., Tech Stocks, Retirement Fund"
          />
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PortfolioPage;
    