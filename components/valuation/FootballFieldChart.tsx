
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ValuationResults } from '../../types';
import Card from '../ui/Card';

interface FootballFieldChartProps {
  results: ValuationResults;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const FootballFieldChart: React.FC<FootballFieldChartProps> = ({ results }) => {
  if (!results.footballFieldData || results.footballFieldData.length === 0) {
    return <p className="text-gray-500">Not enough data to display valuation chart.</p>;
  }
  
  const data = results.footballFieldData;

  // Determine domain for XAxis to ensure all bars are visible and comparable
  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.1; // 10% padding
  const domainMin = Math.max(0, minVal - padding); // Ensure min is not negative unless values are negative
  const domainMax = maxVal + padding;


  return (
    <Card title="Valuation Summary (Football Field)" className="mt-6">
      <div style={{ width: '100%', height: 300 + data.length * 20 }}> {/* Adjust height based on number of bars */}
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 20, right: 30, left: 50, bottom: 5, // Increased left margin for longer labels
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
                type="number" 
                domain={[domainMin, domainMax]} 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={120} // Adjust width if category names are long
                interval={0} // Show all category labels
            />
            <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="value" name="Valuation per Share" barSize={30}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default FootballFieldChart;
    