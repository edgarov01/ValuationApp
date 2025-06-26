
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ValuationContext } from '../../contexts/ValuationContext';
import { PortfolioContext } from '../../contexts/PortfolioContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

const DashboardPage: React.FC = () => {
  const authContext = useContext(AuthContext);
  const valuationContext = useContext(ValuationContext);
  const portfolioContext = useContext(PortfolioContext);

  if (!authContext || !authContext.user || !valuationContext || !portfolioContext) {
    return <div>Loading dashboard data...</div>;
  }

  const { user } = authContext;
  const { valuationCases } = valuationContext;
  const { portfolios } = portfolioContext;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.email}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valuation Cases Overview */}
        <Card title="Valuation Sandbox">
          <p className="text-gray-600 mb-4">
            You have {valuationCases.length} saved valuation case{valuationCases.length === 1 ? '' : 's'}.
          </p>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {valuationCases.length > 0 ? (
              valuationCases.slice(0, 5).map(vc => (
                <Link key={vc.id} to={`/valuation/edit/${vc.id}`} className="block p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-indigo-600">
                  {vc.caseName} <span className="text-xs text-gray-500">- Updated: {new Date(vc.updatedAt).toLocaleDateString()}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No valuation cases yet.</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link to="/valuation/new">
              <Button variant="primary">New Valuation Case</Button>
            </Link>
            <Link to="/valuation">
              <Button variant="secondary">View All Cases</Button>
            </Link>
          </div>
        </Card>

        {/* Portfolio Ledger Overview */}
        <Card title="Portfolio Ledger">
          <p className="text-gray-600 mb-4">
            You have {portfolios.length} portfolio{portfolios.length === 1 ? '' : 's'}.
          </p>
           <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {portfolios.length > 0 ? (
              portfolios.slice(0,5).map(p => (
                <Link key={p.id} to={`/portfolio/${p.id}`} className="block p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-indigo-600">
                  {p.name} <span className="text-xs text-gray-500">- {p.transactions.length} transaction(s)</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No portfolios yet.</p>
            )}
          </div>
          <div className="flex space-x-3">
             <Link to="/portfolio"> {/* This will take to portfolio list where they can create one */}
                <Button variant="primary">Manage Portfolios</Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card title="Getting Started">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Valuation Sandbox:</strong> Create valuation cases by manually inputting financial data from company reports (10-K, 10-Q). The app calculates intrinsic value using DCF and relative valuation methods.</li>
            <li><strong>Portfolio Ledger:</strong> Manually log your stock transactions (buy/sell) and update market prices to track your portfolio's performance.</li>
            <li><strong>Data Privacy:</strong> All data you enter is stored locally in your browser and is not shared.</li>
            <li><strong>Educational Tool:</strong> Use this sandbox to experiment with different assumptions and understand financial modeling concepts.</li>
        </ul>
      </Card>

    </div>
  );
};

export default DashboardPage;
    