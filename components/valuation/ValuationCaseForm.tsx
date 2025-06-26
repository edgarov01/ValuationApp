
import React, { useState, useEffect, useContext, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ValuationContext } from '../../contexts/ValuationContext';
import { ValuationInputs, BaseYearFinancials, DCFAssumptions, EquityValueCalculationInputs, RelativeValuationDataInputs, ValuationCase } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import FootballFieldChart from './FootballFieldChart';
import ValuationResultsDisplay from './ValuationResultsDisplay';
import Tooltip from '../ui/Tooltip';
import { GoogleGenAI } from "@google/genai";
import { extractTextFromPdf } from '../../utils/pdfUtils';

const initialInputs: ValuationInputs = {
  baseYear: {
    revenue: 100000000, ebit: 20000000, taxRate: 21, depreciationAndAmortization: 5000000, capex: 7000000, changeInNetWorkingCapital: 2000000,
  },
  dcfAssumptions: {
    projectionYears: 5, revenueGrowthRate: [5, 5, 4, 4, 3], ebitMargin: [20, 20.5, 21, 21, 21.5], discountRateWACC: 10, perpetualGrowthRate: 2,
  },
  equityValueInputs: {
    totalDebt: 30000000, cashAndCashEquivalents: 10000000, dilutedSharesOutstanding: 50000000,
  },
  relativeValuationInputs: {
    currentMarketPrice: 5.50, companyNetIncome: 12000000, companyEBITDA: 25000000, peerAveragePERatio: 15, peerAverageEVEBITDARatio: 10,
  },
};

// Tooltip texts
const tooltips = {
  caseName: "A unique name for this valuation analysis (e.g., 'Analysis of Company X - Q4 2023').",
  pdfUpload: "Upload a 10-K or 10-Q report in PDF format. The system will attempt to extract key financial figures using AI.",
  revenue: "Total revenue for the base year (e.g., Trailing Twelve Months). Found on Income Statement.",
  ebit: "Earnings Before Interest and Taxes for the base year. Found on Income Statement.",
  taxRate: "Effective tax rate as a percentage (e.g., 21 for 21%). Derived from Income Statement (Income Tax Expense / Pre-Tax Income).",
  depreciationAndAmortization: "D&A for the base year. Found on Cash Flow Statement or Income Statement.",
  capex: "Capital Expenditures for the base year. Found on Cash Flow Statement under 'Investing Activities'.",
  changeInNetWorkingCapital: "Change in Net Working Capital (Current Assets - Current Liabilities) from prior period to current base period. Calculated from Balance Sheet or found on Cash Flow Statement.",
  revenueGrowthRate: "Projected annual revenue growth rate for the next 5 years (e.g., 5 for 5%). Based on your analysis.",
  ebitMargin: "Projected EBIT margin (EBIT / Revenue) for the next 5 years (e.g., 20 for 20%). Based on your analysis.",
  discountRateWACC: "Weighted Average Cost of Capital (WACC) as a percentage. Used to discount future cash flows. Requires separate calculation based on company's capital structure and risk.",
  perpetualGrowthRate: "Assumed growth rate of FCFF into perpetuity (e.g., 2 for 2%). Typically close to long-term inflation or GDP growth.",
  totalDebt: "Total interest-bearing debt. Found on Balance Sheet.",
  cashAndCashEquivalents: "Cash and highly liquid short-term investments. Found on Balance Sheet.",
  dilutedSharesOutstanding: "Total number of common shares outstanding, including effect of dilutive securities (options, convertibles). Found in 10-K/10-Q reports.",
  currentMarketPrice: "Current market price per share of the company (optional, for comparison).",
  companyNetIncome: "Company's Net Income (TTM). Used for P/E calculation. Found on Income Statement.",
  companyEBITDA: "Company's Earnings Before Interest, Taxes, Depreciation, and Amortization (TTM). Used for EV/EBITDA. Calculated from financials.",
  peerAveragePERatio: "Average Price-to-Earnings ratio of comparable publicly traded companies.",
  peerAverageEVEBITDARatio: "Average Enterprise Value-to-EBITDA ratio of comparable publicly traded companies."
};

interface ExtractedFinancialData {
  revenue: number | null;
  ebit: number | null;
  taxRate: number | null;
  depreciationAndAmortization: number | null;
  capex: number | null;
  changeInNetWorkingCapital: number | null;
  totalDebt: number | null;
  cashAndCashEquivalents: number | null;
  dilutedSharesOutstanding: number | null;
  companyNetIncome: number | null;
  companyEBITDA: number | null;
}


const ValuationCaseForm: React.FC = () => {
  const { caseId } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();
  const valuationContext = useContext(ValuationContext);

  const [caseName, setCaseName] = useState('');
  const [inputs, setInputs] = useState<ValuationInputs>(JSON.parse(JSON.stringify(initialInputs))); // Deep copy
  const [currentCase, setCurrentCase] = useState<ValuationCase | null>(null);
  const [formError, setFormError] = useState<string>('');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string>('');
  
  // Load existing case data if editing
  useEffect(() => {
    if (caseId && valuationContext) {
      const existingCase = valuationContext.getCaseById(caseId);
      if (existingCase) {
        setCaseName(existingCase.caseName);
        setInputs(JSON.parse(JSON.stringify(existingCase.inputs))); // Deep copy
        setCurrentCase(existingCase);
      } else {
        navigate('/valuation'); // Case not found
      }
    } else { // New case, reset to initial
        setCaseName('');
        setInputs(JSON.parse(JSON.stringify(initialInputs)));
        setCurrentCase(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, valuationContext?.getCaseById, navigate]); 

  const handleInputChange = (section: keyof ValuationInputs, field: string, value: string | number, index?: number) => {
    setInputs(prev => {
      const newInputs = JSON.parse(JSON.stringify(prev)); // Deep copy
      const numValue = typeof value === 'string' && value.trim() === '' ? 0 : parseFloat(value as string); 

      if (section === 'dcfAssumptions' && (field === 'revenueGrowthRate' || field === 'ebitMargin') && typeof index === 'number') {
        (newInputs[section][field] as number[])[index] = isNaN(numValue) ? 0 : numValue;
      } else if (section === 'relativeValuationInputs' && field === 'currentMarketPrice') {
         newInputs[section][field] = (value === '' || value === null || value === undefined) ? undefined : (isNaN(numValue) ? undefined : numValue);
      }
      else {
        (newInputs[section] as any)[field] = isNaN(numValue) ? 0 : numValue;
      }
      return newInputs;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
      setPdfMessage(''); 
    } else {
      setPdfFile(null);
    }
  };

  const handleProcessPdf = async () => {
    if (!pdfFile) {
      setPdfMessage('Please select a PDF file first.');
      return;
    }
    if (!process.env.API_KEY) {
        setPdfMessage('Error: API Key is not configured. PDF processing with AI cannot proceed.');
        setIsPdfProcessing(false);
        return;
    }

    setIsPdfProcessing(true);
    setPdfMessage('Extracting text from PDF...');

    try {
      const extractedTextFromPdf = await extractTextFromPdf(pdfFile);
      setPdfMessage('Text extracted. Querying Gemini API for financial data...');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash-preview-04-17';
      
      const prompt = `From the following financial report text, extract these figures for the most recent full reporting period (e.g., annual or TTM). Ensure all monetary values are raw numbers, without currency symbols, commas or dollar signs. If a value cannot be found or is not applicable, use null for that key.
- Total Revenue (also known as Sales or Net Sales)
- EBIT (Earnings Before Interest and Taxes)
- Effective Tax Rate (Income Tax Expense divided by Income Before Tax, expressed as a percentage, e.g., 21 for 21%)
- Depreciation and Amortization expense
- Capital Expenditures (Purchases of property, plant, and equipment)
- Change in Net Working Capital
- Total Debt (sum of short-term and long-term interest-bearing liabilities)
- Cash and Cash Equivalents
- Diluted Shares Outstanding (Weighted average number of common shares outstanding, diluted)
- Net Income (Net Earnings attributable to common shareholders for the period)
- EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization for the period)

Respond ONLY with a JSON object with the following keys. Do not add any explanatory text before or after the JSON object.
{
  "revenue": <number_or_null>,
  "ebit": <number_or_null>,
  "taxRate": <number_or_null>,
  "depreciationAndAmortization": <number_or_null>,
  "capex": <number_or_null>,
  "changeInNetWorkingCapital": <number_or_null>,
  "totalDebt": <number_or_null>,
  "cashAndCashEquivalents": <number_or_null>,
  "dilutedSharesOutstanding": <number_or_null>,
  "companyNetIncome": <number_or_null>,
  "companyEBITDA": <number_or_null>
}

Financial Report Text (first 150,000 characters):
${extractedTextFromPdf.substring(0, 150000)}
`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
         jsonStr = match[2].trim();
      }
      
      const extractedData = JSON.parse(jsonStr) as ExtractedFinancialData;

      setInputs(prev => {
        const newInputs = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid modifying previous state directly

        // Helper to safely update number fields
        const updateNumberField = (value: number | null, defaultValue: number): number => {
            return value !== null && !isNaN(Number(value)) ? Number(value) : defaultValue;
        };
        
        // Update BaseYearFinancials
        newInputs.baseYear.revenue = updateNumberField(extractedData.revenue, prev.baseYear.revenue);
        newInputs.baseYear.ebit = updateNumberField(extractedData.ebit, prev.baseYear.ebit);
        newInputs.baseYear.taxRate = updateNumberField(extractedData.taxRate, prev.baseYear.taxRate);
        newInputs.baseYear.depreciationAndAmortization = updateNumberField(extractedData.depreciationAndAmortization, prev.baseYear.depreciationAndAmortization);
        newInputs.baseYear.capex = updateNumberField(extractedData.capex, prev.baseYear.capex);
        newInputs.baseYear.changeInNetWorkingCapital = updateNumberField(extractedData.changeInNetWorkingCapital, prev.baseYear.changeInNetWorkingCapital);

        // Update EquityValueCalculationInputs
        newInputs.equityValueInputs.totalDebt = updateNumberField(extractedData.totalDebt, prev.equityValueInputs.totalDebt);
        newInputs.equityValueInputs.cashAndCashEquivalents = updateNumberField(extractedData.cashAndCashEquivalents, prev.equityValueInputs.cashAndCashEquivalents);
        newInputs.equityValueInputs.dilutedSharesOutstanding = updateNumberField(extractedData.dilutedSharesOutstanding, prev.equityValueInputs.dilutedSharesOutstanding);
        
        // Update RelativeValuationDataInputs
        newInputs.relativeValuationInputs.companyNetIncome = updateNumberField(extractedData.companyNetIncome, prev.relativeValuationInputs.companyNetIncome);
        newInputs.relativeValuationInputs.companyEBITDA = updateNumberField(extractedData.companyEBITDA, prev.relativeValuationInputs.companyEBITDA);
        
        return newInputs;
      });
      setPdfMessage("Data extracted successfully from PDF by Gemini API and pre-filled relevant fields!");

    } catch (error: any) {
      console.error("Error processing PDF or with Gemini API:", error);
      let userErrorMessage = "An error occurred during PDF processing or AI data extraction.";
      if (error && error.message) {
        userErrorMessage = error.message; 
      } else if (typeof error === 'string') {
        userErrorMessage = error;
      }
      setPdfMessage(`Error: ${userErrorMessage}. Please check console or enter data manually.`);
    } finally {
      setIsPdfProcessing(false);
      setPdfFile(null); 
      const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = ''; 
      }
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!caseName.trim()) {
        setFormError('Case Name is required.');
        return;
    }
    if (!valuationContext) {
        setFormError('Valuation context not available.');
        return;
    }

    let resultCase: ValuationCase | null = null;
    if (currentCase && caseId) { 
      resultCase = await valuationContext.updateCase(caseId, caseName, inputs);
    } else { 
      resultCase = await valuationContext.addCase(caseName, inputs);
    }
    
    if (resultCase) {
      setCurrentCase(resultCase); 
      if (!caseId && resultCase.id) { 
        navigate(`/valuation/edit/${resultCase.id}`, { replace: true });
      }
    } else {
      setFormError('Failed to save or calculate valuation. Please check inputs.');
    }
  };
  
  const renderProjectionInputs = (field: 'revenueGrowthRate' | 'ebitMargin', label: string, tooltipText: string) => {
    return (
      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} (%)
            <Tooltip text={tooltipText} />
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {inputs.dcfAssumptions[field].map((val, idx) => (
            <Input
                key={`${field}-${idx}`}
                id={`${field}-${idx}`}
                label={`Year ${idx + 1}`} 
                type="number"
                step="0.1"
                value={val}
                onChange={(e) => handleInputChange('dcfAssumptions', field, e.target.value, idx)}
            />
            ))}
        </div>
      </div>
    );
  };


  if (valuationContext?.isLoading && !isPdfProcessing) { 
    return <div className="text-center p-8">Calculating valuation... <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mt-2"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        {currentCase ? `Edit Valuation Case: ${currentCase.caseName}` : 'Create New Valuation Case'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card title="Case Information">
             <Input
                id="caseName"
                label="Case Name"
                type="text"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                tooltipText={tooltips.caseName}
                required
            />
        </Card>

        <Card title="Automated Data Extraction (from PDF via AI)">
            <p className="text-sm text-gray-600 mb-3">
                Upload a 10-K or 10-Q PDF to attempt automatic extraction of Base Year Financials, Equity Value Inputs (Debt, Cash, Shares), and Relative Valuation inputs (Net Income, EBITDA) using Gemini API.
                This feature relies on successful text extraction from the PDF. Other fields like DCF projections and peer multiples remain manual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 items-end">
                <div className="md:col-span-2">
                    <Input
                        id="pdfUpload"
                        label="Upload PDF Report"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        tooltipText={tooltips.pdfUpload}
                    />
                </div>
                <Button 
                    type="button" 
                    onClick={handleProcessPdf} 
                    isLoading={isPdfProcessing} 
                    disabled={!pdfFile || isPdfProcessing}
                    className="w-full md:w-auto"
                >
                    Extract from PDF
                </Button>
            </div>
            {pdfMessage && (
                 <p className={`mt-3 text-sm ${pdfMessage.toLowerCase().includes('error') || pdfMessage.includes('Please select') ? 'text-red-600' : 'text-green-700'}`}>
                    {pdfMessage}
                 </p>
            )}
        </Card>


        <Card title="A) Base Year Financials (TTM)">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
            <Input id="revenue" label="Revenue" type="number" value={inputs.baseYear.revenue} onChange={(e) => handleInputChange('baseYear', 'revenue', e.target.value)} tooltipText={tooltips.revenue} />
            <Input id="ebit" label="EBIT" type="number" value={inputs.baseYear.ebit} onChange={(e) => handleInputChange('baseYear', 'ebit', e.target.value)} tooltipText={tooltips.ebit} />
            <Input id="taxRate" label="Tax Rate (%)" type="number" step="0.1" value={inputs.baseYear.taxRate} onChange={(e) => handleInputChange('baseYear', 'taxRate', e.target.value)} tooltipText={tooltips.taxRate} />
            <Input id="depreciationAndAmortization" label="D&A" type="number" value={inputs.baseYear.depreciationAndAmortization} onChange={(e) => handleInputChange('baseYear', 'depreciationAndAmortization', e.target.value)} tooltipText={tooltips.depreciationAndAmortization} />
            <Input id="capex" label="Capex" type="number" value={inputs.baseYear.capex} onChange={(e) => handleInputChange('baseYear', 'capex', e.target.value)} tooltipText={tooltips.capex} />
            <Input id="changeInNetWorkingCapital" label="Change in NWC" type="number" value={inputs.baseYear.changeInNetWorkingCapital} onChange={(e) => handleInputChange('baseYear', 'changeInNetWorkingCapital', e.target.value)} tooltipText={tooltips.changeInNetWorkingCapital} />
          </div>
        </Card>

        <Card title="B) DCF Assumptions (Projections for next 5 years)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderProjectionInputs('revenueGrowthRate', 'Revenue Growth Rate', tooltips.revenueGrowthRate)}
            {renderProjectionInputs('ebitMargin', 'EBIT Margin', tooltips.ebitMargin)}
             <Input id="discountRateWACC" label="Discount Rate (WACC) (%)" type="number" step="0.1" value={inputs.dcfAssumptions.discountRateWACC} onChange={(e) => handleInputChange('dcfAssumptions', 'discountRateWACC', e.target.value)} tooltipText={tooltips.discountRateWACC} />
             <Input id="perpetualGrowthRate" label="Perpetual Growth Rate (%)" type="number" step="0.1" value={inputs.dcfAssumptions.perpetualGrowthRate} onChange={(e) => handleInputChange('dcfAssumptions', 'perpetualGrowthRate', e.target.value)} tooltipText={tooltips.perpetualGrowthRate} />
          </div>
        </Card>

        <Card title="C) Equity Value Calculation Inputs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <Input id="totalDebt" label="Total Debt" type="number" value={inputs.equityValueInputs.totalDebt} onChange={(e) => handleInputChange('equityValueInputs', 'totalDebt', e.target.value)} tooltipText={tooltips.totalDebt} />
                <Input id="cashAndCashEquivalents" label="Cash & Equivalents" type="number" value={inputs.equityValueInputs.cashAndCashEquivalents} onChange={(e) => handleInputChange('equityValueInputs', 'cashAndCashEquivalents', e.target.value)} tooltipText={tooltips.cashAndCashEquivalents} />
                <Input id="dilutedSharesOutstanding" label="Diluted Shares Outstanding" type="number" value={inputs.equityValueInputs.dilutedSharesOutstanding} onChange={(e) => handleInputChange('equityValueInputs', 'dilutedSharesOutstanding', e.target.value)} tooltipText={tooltips.dilutedSharesOutstanding} />
            </div>
        </Card>

        <Card title="D) Relative Valuation Data">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <Input id="currentMarketPrice" label="Current Market Price (Optional)" type="number" step="0.01" value={inputs.relativeValuationInputs.currentMarketPrice === null || inputs.relativeValuationInputs.currentMarketPrice === undefined ? '' : inputs.relativeValuationInputs.currentMarketPrice} onChange={(e) => handleInputChange('relativeValuationInputs', 'currentMarketPrice', e.target.value)} tooltipText={tooltips.currentMarketPrice} />
                <Input id="companyNetIncome" label="Company Net Income (TTM)" type="number" value={inputs.relativeValuationInputs.companyNetIncome} onChange={(e) => handleInputChange('relativeValuationInputs', 'companyNetIncome', e.target.value)} tooltipText={tooltips.companyNetIncome} />
                <Input id="companyEBITDA" label="Company EBITDA (TTM)" type="number" value={inputs.relativeValuationInputs.companyEBITDA} onChange={(e) => handleInputChange('relativeValuationInputs', 'companyEBITDA', e.target.value)} tooltipText={tooltips.companyEBITDA} />
                <Input id="peerAveragePERatio" label="Peer Average P/E Ratio" type="number" step="0.1" value={inputs.relativeValuationInputs.peerAveragePERatio} onChange={(e) => handleInputChange('relativeValuationInputs', 'peerAveragePERatio', e.target.value)} tooltipText={tooltips.peerAveragePERatio} />
                <Input id="peerAverageEVEBITDARatio" label="Peer Average EV/EBITDA Ratio" type="number" step="0.1" value={inputs.relativeValuationInputs.peerAverageEVEBITDARatio} onChange={(e) => handleInputChange('relativeValuationInputs', 'peerAverageEVEBITDARatio', e.target.value)} tooltipText={tooltips.peerAverageEVEBITDARatio} />
            </div>
        </Card>
        
        {formError && <p className="text-red-500 text-sm text-center py-2">{formError}</p>}

        <div className="flex justify-end space-x-3 mt-8">
            <Button type="button" variant="secondary" onClick={() => currentCase ? navigate(`/valuation/edit/${currentCase.id}`) : navigate('/valuation')}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={valuationContext?.isLoading && !isPdfProcessing}>
                {currentCase ? 'Update & Recalculate' : 'Calculate & Save Case'}
            </Button>
        </div>
      </form>

      {currentCase && currentCase.results && (
        <>
            <ValuationResultsDisplay results={currentCase.results} />
            <FootballFieldChart results={currentCase.results} />
        </>
      )}
    </div>
  );
};

export default ValuationCaseForm;
