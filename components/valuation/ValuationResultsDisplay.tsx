
import React from 'react';
import { ValuationResults, ProjectedFinancials } from '../../types';
import Card from '../ui/Card';

interface ValuationResultsDisplayProps {
  results: ValuationResults;
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || isNaN(value)) return 'N/A';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const formatNumber = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
};


const ValuationResultsDisplay: React.FC<ValuationResultsDisplayProps> = ({ results }) => {
  return (
    <div className="space-y-6 mt-6">
      <Card title="Key Valuation Metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricItem label="Intrinsic Value/Share (DCF)" value={formatCurrency(results.intrinsicValuePerShareDCF)} />
          <MetricItem label="Implied Value/Share (Peer P/E)" value={formatCurrency(results.impliedValuePerSharePE)} />
          <MetricItem label="Implied Value/Share (Peer EV/EBITDA)" value={formatCurrency(results.impliedValuePerShareEVEBITDA)} />
          <MetricItem label="Enterprise Value (DCF)" value={formatCurrency(results.enterpriseValueDCF)} />
          <MetricItem label="Equity Value (DCF)" value={formatCurrency(results.equityValueDCF)} />
          <MetricItem label="Terminal Value (DCF)" value={formatCurrency(results.terminalValue)} />
          <MetricItem label="PV of Terminal Value" value={formatCurrency(results.presentTerminalValue)} />
          <MetricItem label="Sum of Discounted FCFFs" value={formatCurrency(results.sumDiscountedFCFF)} />
        </div>
      </Card>

      {results.projectedFinancials && results.projectedFinancials.length > 0 && (
        <Card title="Projected Financials (DCF Model)">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EBIT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOPAT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCFF</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discounted FCFF</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {results.projectedFinancials.map((pf: ProjectedFinancials) => (
                  <tr key={pf.year}>
                    <td className="px-3 py-2 whitespace-nowrap">{pf.year}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNumber(pf.revenue)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNumber(pf.ebit)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNumber(pf.nopat)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNumber(pf.fcff)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNumber(pf.discountedFcff)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

interface MetricItemProps {
  label: string;
  value: string;
}
const MetricItem: React.FC<MetricItemProps> = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-lg font-semibold text-gray-800">{value}</p>
  </div>
);


export default ValuationResultsDisplay;
    