/**
 * 2D Attack Detector Component
 * Clean table-based MEV attack detection interface
 */

import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw,
  Eye,
  Trash2,
  Download
} from 'lucide-react';

interface Attack {
  id: string;
  type: 'Sandwich' | 'Front-running' | 'Back-running' | 'Liquidity Sniping';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  blockNumber: number;
  victim: string;
  attacker?: string;
  amount: string;
  gasPrice: string;
  status: 'detected' | 'prevented' | 'analyzing' | 'false_positive';
  profit?: string;
}

const AttackDetector: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sample data - in production, this would come from backend/blockchain
  const attacks: Attack[] = [
    {
      id: '1',
      type: 'Sandwich',
      severity: 'critical',
      timestamp: '2024-03-28 10:45:23',
      blockNumber: 19523847,
      victim: '0x742d...8f3a',
      attacker: '0x8b3c...2e1f',
      amount: '15.8 ETH',
      gasPrice: '85 gwei',
      status: 'prevented',
      profit: '2.3 ETH'
    },
    {
      id: '2',
      type: 'Front-running',
      severity: 'high',
      timestamp: '2024-03-28 10:42:15',
      blockNumber: 19523841,
      victim: '0x9a2b...4c7d',
      amount: '8.2 ETH',
      gasPrice: '72 gwei',
      status: 'detected'
    },
    {
      id: '3',
      type: 'Liquidity Sniping',
      severity: 'high',
      timestamp: '2024-03-28 10:38:47',
      blockNumber: 19523835,
      victim: '0x3f8e...9b2c',
      attacker: '0x7c4d...5a8b',
      amount: '25.0 ETH',
      gasPrice: '95 gwei',
      status: 'analyzing',
      profit: '5.7 ETH'
    },
    {
      id: '4',
      type: 'Back-running',
      severity: 'medium',
      timestamp: '2024-03-28 10:35:12',
      blockNumber: 19523829,
      victim: '0x5d7a...3e9f',
      amount: '3.5 ETH',
      gasPrice: '45 gwei',
      status: 'detected',
      profit: '0.8 ETH'
    },
    {
      id: '5',
      type: 'Sandwich',
      severity: 'low',
      timestamp: '2024-03-28 10:30:56',
      blockNumber: 19523820,
      victim: '0x2c9b...7f4e',
      amount: '1.2 ETH',
      gasPrice: '38 gwei',
      status: 'false_positive'
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-800';
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-800';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'prevented':
        return <span className="text-green-400 bg-green-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} />Prevented</span>;
      case 'detected':
        return <span className="text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><AlertTriangle size={12} />Detected</span>;
      case 'analyzing':
        return <span className="text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><RefreshCw size={12} className="animate-spin" />Analyzing</span>;
      case 'false_positive':
        return <span className="text-gray-400 bg-gray-900/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle size={12} />False Positive</span>;
      default:
        return <span className="text-gray-400 bg-gray-900/30 px-3 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  const filteredAttacks = attacks.filter(attack => {
    if (filterSeverity !== 'all' && attack.severity !== filterSeverity) return false;
    if (filterType !== 'all' && attack.type !== filterType) return false;
    if (searchTerm && !attack.id.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !attack.victim.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: attacks.length,
    prevented: attacks.filter(a => a.status === 'prevented').length,
    detected: attacks.filter(a => a.status === 'detected').length,
    analyzing: attacks.filter(a => a.status === 'analyzing').length,
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-2.5 sm:gap-3">
          <Shield size={32} className="text-green-400 sm:w-10 sm:h-10 flex-shrink-0" />
          <span>MEV Attack Detector</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm">Real-time detection and prevention of MEV attacks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Attacks</h3>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Last 24 hours</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Prevented</h3>
          <p className="text-xl sm:text-3xl font-bold text-green-400">{stats.prevented}</p>
          <p className="text-green-500 text-[10px] sm:text-xs mt-1">{((stats.prevented / stats.total) * 100).toFixed(1)}% success</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Detected</h3>
          <p className="text-xl sm:text-3xl font-bold text-yellow-400">{stats.detected}</p>
          <p className="text-yellow-500 text-[10px] sm:text-xs mt-1">Pending review</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3.5 sm:p-6 border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Analyzing</h3>
          <p className="text-xl sm:text-3xl font-bold text-blue-400">{stats.analyzing}</p>
          <p className="text-blue-500 text-[10px] sm:text-xs mt-1">In progress</p>
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
                placeholder="Search by ID or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter by Severity */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Front-running">Front-running</option>
              <option value="Back-running">Back-running</option>
              <option value="Liquidity Sniping">Liquidity Sniping</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs sm:text-sm transition-all">
              <RefreshCw size={14} />
              Refresh
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs sm:text-sm transition-all">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Attacks Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Victim</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Gas Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAttacks.map((attack) => (
                <tr key={attack.id} className="hover:bg-gray-700/50 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">#{attack.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{attack.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(attack.severity)}`}>
                      {attack.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{attack.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">{attack.victim}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">{attack.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{attack.gasPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(attack.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="text-blue-400 hover:text-blue-300 transition-all" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button className="text-red-400 hover:text-red-300 transition-all" title="Mark as False Positive">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6 flex items-center justify-between">
        <p className="text-gray-400 text-sm">Showing {filteredAttacks.length} of {attacks.length} attacks</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttackDetector;
