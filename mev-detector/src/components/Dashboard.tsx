import DatasetDownloadModal from './DatasetDownloadModal';
/**
 * Enhanced Dashboard Component - Complete Redesign
 * Modern, professional interface with real-time data
 */

import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  Wallet,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointerClick,
  Server,
  Globe,
  Lock,
  Award
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

function StatCard({ title, value, change, icon, trend, subtitle }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-brand-neon transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-brand-neon/20 transition-all">
          {icon}
        </div>
        <span className={`text-sm font-semibold flex items-center gap-1 ${
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {change}
          {trend === 'up' && <ArrowUpRight size={14} />}
          {trend === 'down' && <ArrowDownRight size={14} />}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

interface MEVAttack {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  amount: string;
  status: 'detected' | 'prevented' | 'pending';
  protocol: string;
}

function RecentAttacks() {
  const attacks: MEVAttack[] = [
    { id: '1', type: 'Sandwich Attack', severity: 'high', timestamp: '2 min ago', amount: '2.5 ETH', status: 'prevented', protocol: 'Uniswap V3' },
    { id: '2', type: 'Front-running', severity: 'medium', timestamp: '5 min ago', amount: '1.2 ETH', status: 'detected', protocol: 'Curve' },
    { id: '3', type: 'Liquidity Sniping', severity: 'critical', timestamp: '12 min ago', amount: '15.8 ETH', status: 'prevented', protocol: 'SushiSwap' },
    { id: '4', type: 'Back-running', severity: 'low', timestamp: '25 min ago', amount: '0.8 ETH', status: 'detected', protocol: 'Balancer' },
    { id: '5', type: 'Arbitrage', severity: 'medium', timestamp: '32 min ago', amount: '3.4 ETH', status: 'prevented', protocol: '1inch' },
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-700';
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'prevented') {
      return (
        <span className="text-green-400 bg-green-900/30 border border-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} />
          Prevented
        </span>
      );
    } else if (status === 'detected') {
      return (
        <span className="text-yellow-400 bg-yellow-900/30 border border-yellow-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertTriangle size={12} />
          Detected
        </span>
      );
    }
    return (
      <span className="text-gray-400 bg-gray-900/30 border border-gray-700 px-3 py-1 rounded-full text-xs font-medium">
        Pending
      </span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield size={20} className="text-green-400" />
          Recent MEV Attacks
        </h3>
        <button className="text-brand-neon text-sm font-medium hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {attacks.map((attack) => (
          <div key={attack.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getSeverityColor(attack.severity)}`}>
                {attack.severity.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{attack.type}</p>
                <p className="text-gray-400 text-xs flex items-center gap-2">
                  <Globe size={10} />
                  {attack.protocol} • {attack.timestamp}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-lg">{attack.amount}</p>
              <div className="mt-1">{getStatusBadge(attack.status)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkStats() {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-400" />
          Network Status
        </h3>
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-gray-700/30 rounded-xl border border-gray-600/50 hover:border-brand-neon/50 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-yellow-400" />
            <p className="text-gray-400 text-sm">Gas Price</p>
          </div>
          <p className="text-3xl font-bold text-white">28</p>
          <p className="text-sm text-gray-400 mt-1">gwei</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDownRight size={14} className="text-green-400" />
            <span className="text-green-400 text-xs font-medium">5% from last hour</span>
          </div>
        </div>
        
        <div className="p-5 bg-gray-700/30 rounded-xl border border-gray-600/50 hover:border-brand-neon/50 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Server size={16} className="text-purple-400" />
            <p className="text-gray-400 text-sm">Pending TXs</p>
          </div>
          <p className="text-3xl font-bold text-white">142,532</p>
          <p className="text-sm text-gray-400 mt-1">transactions</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">12% congestion</span>
          </div>
        </div>
        
        <div className="p-5 bg-gray-700/30 rounded-xl border border-gray-600/50 hover:border-brand-neon/50 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-red-400" />
            <p className="text-gray-400 text-sm">MEV Detected</p>
          </div>
          <p className="text-3xl font-bold text-white">1,847</p>
          <p className="text-sm text-gray-400 mt-1">opportunities</p>
          <div className="flex items-center gap-1 mt-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-red-400 text-xs font-medium">High activity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectionOverview() {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock size={20} className="text-green-400" />
          Your Protection
        </h3>
        <span className="text-xs bg-green-900/50 text-green-400 px-3 py-1 rounded-full font-medium border border-green-700">
          Active
        </span>
      </div>
      
      <div className="mb-6 p-5 bg-green-900/20 border border-green-700 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-400 font-bold text-lg mb-1">✓ Premium Protection Active</p>
            <p className="text-gray-300 text-sm">Valid until Dec 31, 2024</p>
          </div>
          <CheckCircle size={40} className="text-green-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-purple-400" />
            <p className="text-gray-400 text-xs">Protection Level</p>
          </div>
          <p className="text-2xl font-bold text-white">Premium</p>
        </div>
        
        <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick size={16} className="text-blue-400" />
            <p className="text-gray-400 text-xs">Reports Submitted</p>
          </div>
          <p className="text-2xl font-bold text-white">23</p>
        </div>
        
        <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-yellow-400" />
            <p className="text-gray-400 text-xs">Rewards Earned</p>
          </div>
          <p className="text-2xl font-bold text-white">0.45 ETH</p>
        </div>
        
        <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-cyan-400" />
            <p className="text-gray-400 text-xs">Reputation Score</p>
          </div>
          <p className="text-2xl font-bold text-white">92<span className="text-sm text-gray-400">/100</span></p>
        </div>
      </div>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const stats = [
    { 
      title: 'Total Value Protected', 
      value: '$12.5M', 
      change: '+12.5%', 
      icon: <Shield size={24} className="text-green-400" />, 
      trend: 'up' as const,
      subtitle: 'Across all protocols'
    },
    { 
      title: 'MEV Attacks Prevented', 
      value: '1,247', 
      change: '+8.2%', 
      icon: <CheckCircle size={24} className="text-blue-400" />, 
      trend: 'up' as const,
      subtitle: 'Last 30 days'
    },
    { 
      title: 'Active Users', 
      value: '8,549', 
      change: '+15.3%', 
      icon: <Wallet size={24} className="text-purple-400" />, 
      trend: 'up' as const,
      subtitle: 'Growing community'
    },
    { 
      title: 'Average Response Time', 
      value: '45ms', 
      change: '-5.1%', 
      icon: <Zap size={24} className="text-yellow-400" />, 
      trend: 'down' as const,
      subtitle: 'Lightning fast'
    },
    { 
      title: 'Sandwich Attacks', 
      value: '523', 
      change: '+3.2%', 
      icon: <Activity size={24} className="text-red-400" />, 
      trend: 'up' as const,
      subtitle: 'Blocked this week'
    },
    { 
      title: 'Front-running Attempts', 
      value: '312', 
      change: '-2.5%', 
      icon: <TrendingUp size={24} className="text-orange-400" />, 
      trend: 'down' as const,
      subtitle: 'Prevented'
    },
    { 
      title: 'Success Rate', 
      value: '98.7%', 
      change: '+1.2%', 
      icon: <BarChart3 size={24} className="text-green-400" />, 
      trend: 'up' as const,
      subtitle: 'Industry leading'
    },
    { 
      title: 'Gas Saved', 
      value: '1,234 ETH', 
      change: '+22.4%', 
      icon: <Clock size={24} className="text-cyan-400" />, 
      trend: 'up' as const,
      subtitle: 'Optimized transactions'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-neon to-green-400 bg-clip-text text-transparent mb-3">
              ⚡ MEV Detector Dashboard
            </h1>
            <p className="text-gray-400 text-lg">Real-time MEV attack detection and prevention powered by AI</p>
          </div>
          <div className="flex items-center gap-4">
            <DatasetDownloadModal variant="primary" />
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Network Status</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-green-400 font-semibold text-sm">Operational</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="flex gap-6 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-brand-neon" />
            <span>Last updated: <span className="text-white font-medium">Just now</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-blue-400" />
            <span>Chain: <span className="text-white font-medium">Ethereum Mainnet</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-green-400" />
            <span>Protection: <span className="text-white font-medium">Active</span></span>
          </div>
        </div>
      </div>

      {/* Dataset Download Card */}
      <div className="mb-8">
        <DatasetDownloadModal variant="card" />
      </div>

      {/* Stats Grid - 8 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Network Status - Full Width */}
      <div className="mb-8">
        <NetworkStats />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RecentAttacks />
        <ProtectionOverview />
      </div>

      {/* Info Banner */}
      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-900/50 rounded-lg">
            <AlertTriangle size={24} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Did You Know?</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              MEV bots can extract value in milliseconds. Our detector monitors the mempool 24/7 and alerts you 
              before malicious actors can exploit your transactions. Stay protected with real-time monitoring 
              and automatic prevention mechanisms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
