import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AttackDetector from './components/AttackDetector';
import MempoolMonitor from './components/MempoolMonitor';
import Charts from './components/Charts';
import AIChat from './components/AIChat';
import EmailAlerts from './components/EmailAlerts';
import RiskHeatmap from './components/RiskHeatmap';
import Education from './components/Education';
import Rewards from './components/Rewards';
import LiveFeed from './components/LiveFeed';
import Simulator from './components/Simulator';
import FlashbotsProtection from './components/FlashbotsProtection';
import WeeklyReport from './components/WeeklyReport';
import CryptoMarketTrends from './components/CryptoMarketTrends';
import MetaMaskButton from './components/MetaMaskButton';

function App() {
  const [mevData, setMevData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchMevData = async () => {
      try {
        setLoading(true);
        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
        const response = await fetch(`${apiUrl}/api/attacks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
          setMevData(result.data);
        } else {
          setMevData([]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch MEV data: ' + err.message);
        setMevData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMevData();
    const interval = setInterval(fetchMevData, 5000);
    return () => clearInterval(interval);
  }, []);

  const list = mevData.slice(0, 10);
  const stats = {
    totalAttacks: mevData.length,
    avgRisk: Math.round(mevData.reduce((sum, item) => sum + (parseFloat(item.riskScore) || 0), 0) / mevData.length || 0),
    totalSlippage: mevData.reduce((sum, item) => sum + (parseFloat(item.slippageLoss) || 0), 0),
    protected: Math.floor(mevData.length * 0.6)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-white/10 px-6 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-brand-neon bg-clip-text text-transparent">
                ⚡ MEV Detector
              </h1>
              <p className="mt-1 text-slate-400 text-sm">Real-time Ethereum MEV Protection & Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <MetaMaskButton />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'attacks', label: 'Attacks', icon: '🛡️' },
              { id: 'mempool', label: 'Mempool', icon: '⚡' },
              { id: 'charts', label: 'Charts', icon: '📈' },
              { id: 'heatmap', label: 'Risk Map', icon: '🔥' },
              { id: 'alerts', label: 'Alerts', icon: '📧' },
              { id: 'education', label: 'Learn', icon: '📚' },
              { id: 'rewards', label: 'Rewards', icon: '🏆' },
              { id: 'market', label: 'Market', icon: '💹' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-neon text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

        {/* Attacks Tab */}
        {activeTab === 'attacks' && (
          <AttackDetector />
        )}

        {/* Mempool Tab */}
        {activeTab === 'mempool' && (
          <MempoolMonitor />
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="min-h-screen">
            <Charts />
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <RiskHeatmap data={mevData} />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <EmailAlerts />
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <Education />
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <Rewards userAddress="0x742d...8Qf2c" />
          </div>
        )}

        {/* Market Trends Tab */}
        {activeTab === 'market' && (
          <div className="min-h-screen">
            <CryptoMarketTrends />
          </div>
        )}

      </main>

      {/* AI Chat Widget */}
      <AIChat />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>⚡ MEV Detector - Protecting Ethereum users from Maximal Extractable Value attacks</p>
          <p className="mt-2">Built with Flashbots | Alchemy | Ethers.js</p>
        </div>
      </footer>
    </div>
  );
}

export default App;