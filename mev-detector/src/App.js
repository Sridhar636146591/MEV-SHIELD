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
import CryptoMarketTrends from './components/CryptoMarketTrends';
import MetaMaskButton from './components/MetaMaskButton';
import DatasetDownloadModal from './components/DatasetDownloadModal';

function App() {
  const [mevData, setMevData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const fetchMevData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
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

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Overview' },
    { id: 'attacks', label: 'Attacks', icon: '🛡️', shortLabel: 'Attacks' },
    { id: 'mempool', label: 'Mempool', icon: '⚡', shortLabel: 'Mempool' },
    { id: 'charts', label: 'Charts', icon: '📈', shortLabel: 'Charts' },
    { id: 'market', label: 'Market', icon: '💹', shortLabel: 'Market' },
    { id: 'heatmap', label: 'Risk Map', icon: '🔥', shortLabel: 'Risk Map' },
    { id: 'alerts', label: 'Alerts', icon: '📧', shortLabel: 'Alerts' },
    { id: 'education', label: 'Learn', icon: '📚', shortLabel: 'Learn' },
    { id: 'rewards', label: 'Rewards', icon: '🏆', shortLabel: 'Rewards' }
  ];

  const primaryMobileTabs = navTabs.slice(0, 4);
  const moreMobileTabs = navTabs.slice(4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col selection:bg-brand-neon selection:text-black">
      {/* Responsive Sticky Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Top Brand & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-2 sm:mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-brand-neon bg-clip-text text-transparent flex items-center gap-1.5 tracking-tight">
                  <span>⚡</span>
                  <span>MEV Detector</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">
                  Real-time Ethereum Threat Intelligence & Slippage Protection
                </p>
              </div>

              {/* Status indicator on mobile */}
              <div className="flex items-center gap-1.5 sm:hidden bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-[10px] text-emerald-300 font-mono font-semibold">Live</span>
              </div>
            </div>

            {/* Header Right Action Items */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <DatasetDownloadModal attacks={mevData} variant="navbar" />
              <MetaMaskButton />
            </div>
          </div>

          {/* Desktop / Tablet Scrollable Tabs Bar */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar touch-pan-x -mx-1 px-1">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMoreMenu(false);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-400 to-brand-neon text-black shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content (with bottom padding for mobile navigation bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'attacks' && <AttackDetector />}
        {activeTab === 'mempool' && <MempoolMonitor />}
        {activeTab === 'charts' && (
          <div className="min-h-screen">
            <Charts />
          </div>
        )}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <RiskHeatmap data={mevData} />
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <EmailAlerts />
          </div>
        )}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <Education />
          </div>
        )}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <Rewards userAddress="0x742d...8Qf2c" />
          </div>
        )}
        {activeTab === 'market' && (
          <div className="min-h-screen">
            <CryptoMarketTrends />
          </div>
        )}
      </main>

      {/* Floating AI Chat Assistant */}
      <AIChat />

      {/* Mobile Bottom Navigation Bar (Visible only on screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 shadow-2xl safe-area-pb">
        <div className="grid grid-cols-5 gap-1 text-center">
          {primaryMobileTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-400 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
              <span className="text-[10px] tracking-tight">{tab.shortLabel}</span>
              {activeTab === tab.id && (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-0.5 shadow-sm shadow-emerald-400" />
              )}
            </button>
          ))}

          {/* More Menu Toggle Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              showMoreMenu || moreMobileTabs.some(t => t.id === activeTab)
                ? 'text-emerald-400 font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">⋯</span>
            <span className="text-[10px] tracking-tight">More</span>
            {(showMoreMenu || moreMobileTabs.some(t => t.id === activeTab)) && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-0.5 shadow-sm shadow-emerald-400" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile "More" Drawer / Sheet */}
      {showMoreMenu && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 pb-8 shadow-2xl space-y-3 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Explore More Modules</span>
              </h4>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {moreMobileTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-gray-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{tab.label}</p>
                    <p className="text-[10px] text-gray-400">View section</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Responsive Footer */}
      <footer className="border-t border-white/10 bg-slate-950/70 px-4 sm:px-6 py-6 sm:py-8 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-xs sm:text-sm">
          <p className="font-medium text-slate-300">
            ⚡ MEV Detector - Real-time Threat Intelligence & Non-Custodial MEV Protection
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            Supported Protocols: Flashbots Protect · Uniswap V2/V3 · Curve · Balancer · 1inch
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
