/**
 * 2D Mempool Monitor Component
 * Real-time transaction monitoring interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Transaction {
  hash: string;
  from: string;
  to?: string;
  value: string;
  gasPrice: string;
  gasLimit: number;
  nonce: number;
  timestamp: string;
  status: 'pending' | 'mined' | 'dropped';
  type: 'swap' | 'transfer' | 'approval' | 'contract_interaction';
  mevPotential: 'high' | 'medium' | 'low' | 'none';
}

const MempoolMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMEV, setFilterMEV] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Simulate real-time mempool data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        hash: '0x7a8b9c...3d4e5f',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f3aE',
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: '5.2 ETH',
        gasPrice: '85 gwei',
        gasLimit: 250000,
        nonce: 142,
        timestamp: '2024-03-28 10:45:23',
        status: 'pending',
        type: 'swap',
        mevPotential: 'high'
      },
      {
        hash: '0x2b3c4d...5e6f7a',
        from: '0x9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        value: '0.5 ETH',
        gasPrice: '45 gwei',
        gasLimit: 21000,
        nonce: 87,
        timestamp: '2024-03-28 10:45:18',
        status: 'pending',
        type: 'transfer',
        mevPotential: 'low'
      },
      {
        hash: '0x3c4d5e...6f7a8b',
        from: '0x8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: '0 ETH',
        gasPrice: '92 gwei',
        gasLimit: 180000,
        nonce: 234,
        timestamp: '2024-03-28 10:45:12',
        status: 'pending',
        type: 'approval',
        mevPotential: 'medium'
      },
      {
        hash: '0x4d5e6f...7a8b9c',
        from: '0x7c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
        to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        value: '12.8 ETH',
        gasPrice: '120 gwei',
        gasLimit: 350000,
        nonce: 456,
        timestamp: '2024-03-28 10:45:05',
        status: 'mined',
        type: 'contract_interaction',
        mevPotential: 'high'
      },
      {
        hash: '0x5e6f7a...8b9c0d',
        from: '0x5d7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        value: '2.3 ETH',
        gasPrice: '38 gwei',
        gasLimit: 21000,
        nonce: 98,
        timestamp: '2024-03-28 10:44:58',
        status: 'pending',
        type: 'transfer',
        mevPotential: 'none'
      },
    ];

    setTransactions(mockTransactions);
    setIsLoading(false);

    // Simulate new transactions arriving
    const interval = setInterval(() => {
      setTransactions(prev => {
        const newTx: Transaction = {
          hash: `0x${Math.random().toString(16).substr(2, 8)}...`,
          from: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: `${(Math.random() * 10).toFixed(2)} ETH`,
          gasPrice: `${Math.floor(Math.random() * 100 + 20)} gwei`,
          gasLimit: Math.floor(Math.random() * 300000 + 21000),
          nonce: Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
          status: 'pending',
          type: ['swap', 'transfer', 'approval', 'contract_interaction'][Math.floor(Math.random() * 4)] as any,
          mevPotential: ['high', 'medium', 'low', 'none'][Math.floor(Math.random() * 4)] as any
        };
        return [newTx, ...prev].slice(0, 50);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getMEVPotentialColor = (potential: string) => {
    switch(potential) {
      case 'high': return 'text-red-400 bg-red-900/30 border-red-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-800';
      case 'none': return 'text-green-400 bg-green-900/30 border-green-800';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Clock size={12} />Pending</span>;
      case 'mined':
        return <span className="text-green-400 bg-green-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} />Mined</span>;
      case 'dropped':
        return <span className="text-red-400 bg-red-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle size={12} />Dropped</span>;
      default:
        return <span className="text-gray-400 bg-gray-900/30 px-3 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterMEV !== 'all' && tx.mevPotential !== filterMEV) return false;
    if (searchTerm && !tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tx.from.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    pending: transactions.filter(t => t.status === 'pending').length,
    highMEV: transactions.filter(t => t.mevPotential === 'high').length,
    avgGasPrice: Math.round(transactions.reduce((acc, t) => acc + parseInt(t.gasPrice), 0) / transactions.length),
    totalValue: transactions.reduce((acc, t) => acc + parseFloat(t.value), 0).toFixed(2)
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-2.5 sm:gap-3">
          <Activity size={32} className="text-blue-400 sm:w-10 sm:h-10 flex-shrink-0" />
          <span>Mempool Monitor</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm">Real-time Ethereum mempool transaction monitoring</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Clock size={20} className="text-yellow-400" />
            <span className="text-green-400 text-xs sm:text-sm flex items-center gap-1">
              <TrendingUp size={12} />+12%
            </span>
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1">Pending TXs</h3>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.pending}</p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-1">In queue</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-400 text-[10px] sm:text-xs">High Risk</span>
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1">High MEV</h3>
          <p className="text-xl sm:text-3xl font-bold text-red-400">{stats.highMEV}</p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Opportunities</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Zap size={20} className="text-yellow-400" />
            <span className="text-green-400 text-xs sm:text-sm flex items-center gap-1">
              <TrendingUp size={12} />↓ 5%
            </span>
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1">Avg Gas</h3>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.avgGasPrice} <span className="text-xs sm:text-sm text-gray-400">gwei</span></p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Network avg</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <TrendingUp size={20} className="text-green-400" />
            <span className="text-green-400 text-[10px] sm:text-xs">Volume</span>
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1">TX Volume</h3>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.totalValue} <span className="text-xs sm:text-sm text-gray-400">ETH</span></p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Last 5 min</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-stretch sm:items-center flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by hash or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="swap">Swap</option>
              <option value="transfer">Transfer</option>
              <option value="approval">Approval</option>
              <option value="contract_interaction">Contract Interaction</option>
            </select>

            {/* Filter by MEV Potential */}
            <select
              value={filterMEV}
              onChange={(e) => setFilterMEV(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All MEV Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs sm:text-sm transition-all">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">From</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">To</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Gas Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">MEV Potential</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.map((tx, index) => (
                <tr key={index} className="hover:bg-gray-700/50 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400 cursor-pointer hover:underline">
                    {tx.hash}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">{tx.from}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{tx.to || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">{tx.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400 font-semibold">{tx.gasPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs capitalize">
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getMEVPotentialColor(tx.mevPotential)}`}>
                      {tx.mevPotential.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <RefreshCw size={14} className="animate-spin" />
        <span>Auto-refreshing every 3 seconds</span>
      </div>
    </div>
  );
};

export default MempoolMonitor;
