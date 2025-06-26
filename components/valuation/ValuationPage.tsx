
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ValuationContext } from '../../contexts/ValuationContext';
import { ValuationCase } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ValuationPage: React.FC = () => {
  const valuationContext = useContext(ValuationContext);

  if (!valuationContext) {
    return <div>Loading valuation data...</div>;
  }

  const { valuationCases, deleteCase, isLoading } = valuationContext;

  const handleDelete = (caseId: string) => {
    if (window.confirm('Are you sure you want to delete this valuation case?')) {
      deleteCase(caseId);
    }
  };
  
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Valuation Sandbox Cases</h1>
        <Link to="/valuation/new">
          <Button variant="primary">Create New Valuation Case</Button>
        </Link>
      </div>

      {isLoading && <p>Loading cases...</p>}
      {!isLoading && valuationCases.length === 0 && (
        <Card>
          <p className="text-gray-600 text-center py-8">
            No valuation cases found. Get started by creating a new one!
          </p>
        </Card>
      )}

      {!isLoading && valuationCases.length > 0 && (
        <div className="space-y-4">
          {valuationCases.map((vc: ValuationCase) => (
            <Card key={vc.id} title={vc.caseName}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div><strong>DCF Value:</strong> {formatCurrency(vc.results?.intrinsicValuePerShareDCF)}</div>
                    <div><strong>P/E Value:</strong> {formatCurrency(vc.results?.impliedValuePerSharePE)}</div>
                    <div><strong>EV/EBITDA Value:</strong> {formatCurrency(vc.results?.impliedValuePerShareEVEBITDA)}</div>
                    <div><strong>Created:</strong> {new Date(vc.createdAt).toLocaleDateString()}</div>
                    <div><strong>Updated:</strong> {new Date(vc.updatedAt).toLocaleDateString()}</div>
                </div>
              <div className="flex space-x-3 justify-end">
                <Link to={`/valuation/edit/${vc.id}`}>
                  <Button variant="secondary" size="sm">Edit / View Results</Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleDelete(vc.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValuationPage;
    