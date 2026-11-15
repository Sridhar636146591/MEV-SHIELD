/**
 * Charts Component for Analytics Dashboard
 * Clean, performant 2D implementation
 */

import React from 'react';
import { Bar, Line, Pie } from 'recharts';
import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
}

function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="label" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend />
        <Bar dataKey="value" fill="#10B981">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || '#10B981'} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: number[];
  color?: string;
}

function LineChart({ data, color = '#3B82F6' }: LineChartProps) {
  const chartData = data.map((value, index) => ({
    index,
    value
  }));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="index" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
}

function PieChart({ data }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

interface ChartsSceneProps {
  chartType: 'bar' | 'line' | 'pie';
  data?: any;
}

function ChartsScene({ chartType, data }: ChartsSceneProps) {
  return (
    <div className="w-full h-full p-4">
      {chartType === 'bar' && data && <BarChart data={data} />}
      {chartType === 'line' && data && <LineChart data={data} />}
      {chartType === 'pie' && data && <PieChart data={data} />}
    </div>
  );
}

const Charts: React.FC = () => {
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'pie'>('bar');
  
  const barData = [
    { label: 'Mon', value: 65, color: '#10B981' },
    { label: 'Tue', value: 78, color: '#3B82F6' },
    { label: 'Wed', value: 90, color: '#8B5CF6' },
    { label: 'Thu', value: 81, color: '#EF4444' },
    { label: 'Fri', value: 96, color: '#F59E0B' },
    { label: 'Sat', value: 72, color: '#06b6d4' },
    { label: 'Sun', value: 85, color: '#ec4899' },
  ];
  
  const lineData = [10, 25, 18, 40, 35, 60, 45, 75, 50, 90];
  
  const pieData = [
    { label: 'Arbitrage', value: 45, color: '#10B981' },
    { label: 'Sandwich', value: 30, color: '#EF4444' },
    { label: 'Front-running', value: 15, color: '#3B82F6' },
    { label: 'Liquidation', value: 10, color: '#8B5CF6' },
  ];
  
  const data = chartType === 'bar' ? barData : chartType === 'line' ? lineData : pieData;
  
  return (
    <div className="w-full h-[80vh] relative bg-gray-900 p-6">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <h2 className="text-2xl font-bold text-white mb-2">MEV Analytics Dashboard</h2>
      </div>
      <ChartsScene chartType={chartType} data={data} />
      
      {/* Chart Type Selector */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        <button 
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded-lg font-semibold ${chartType === 'bar' ? 'bg-green-500' : 'bg-slate-700'}`}
        >
          Bar
        </button>
        <button 
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded-lg font-semibold ${chartType === 'line' ? 'bg-blue-500' : 'bg-slate-700'}`}
        >
          Line
        </button>
        <button 
          onClick={() => setChartType('pie')}
          className={`px-4 py-2 rounded-lg font-semibold ${chartType === 'pie' ? 'bg-purple-500' : 'bg-slate-700'}`}
        >
          Pie
        </button>
      </div>
    </div>
  );
};

export default Charts;
