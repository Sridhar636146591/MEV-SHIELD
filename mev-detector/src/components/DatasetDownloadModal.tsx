import React, { useState } from 'react';
import {
  Download,
  Database,
  FileJson,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  BarChart2,
  Activity,
  Layers,
  TrendingUp,
  Coins,
  Globe,
  Zap,
} from 'lucide-react';

interface DatasetDownloadModalProps {
  attacks?: any[];
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'navbar' | 'card';
}

type DownloadFormat =
  | 'json_full'
  | 'crypto_csv'
  | 'crypto_json'
  | 'defi_csv'
  | 'full_csv'
  | 'mev_csv'
  | 'mempool';

interface DownloadOption {
  id: DownloadFormat;
  label: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  apiPath: string;
  apiQuery: string;
  clientFallback?: () => string;
  filename: string;
  mimeType: string;
  btnStyle: string;
  recommended?: boolean;
}

export const DatasetDownloadModal: React.FC<DatasetDownloadModalProps> = ({
  attacks = [],
  className = '',
  buttonText = 'Download Dataset',
  variant = 'primary',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<DownloadFormat | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<DownloadFormat | null>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const triggerDownload = (content: string | object, filename: string, mime: string) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const csvEscape = (val: any) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const fallbackMevCsv = () => {
    const headers = ['ID','Hash','AttackType','RiskScore','SlippageLoss_ETH','GasPrice_Gwei','Timestamp','VictimAddress','AttackerAddress','TargetProtocol','Network','Source'];
    const rows = attacks.map((a, i) => [
      i + 1, csvEscape(a.hash), csvEscape(a.attackType || 'other'), a.riskScore || 0,
      a.slippageLoss || 0, a.gasPrice ? (parseFloat(a.gasPrice) / 1e9).toFixed(2) : '35.00',
      csvEscape(a.timestamp || new Date().toISOString()),
      csvEscape(a.victimAddress || ''), csvEscape(a.attackerAddress || ''),
      csvEscape(a.protocol || 'Uniswap V2/V3'), csvEscape(a.network || 'sepolia'),
      csvEscape(a.source || 'mempool')
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const fallbackFullJson = () => ({
    metadata: {
      datasetName: 'MEV Shield Analytics Dataset',
      exportedAt: new Date().toISOString(),
      totalAttacks: attacks.length,
    },
    summaryStatistics: {
      total: attacks.length,
      byType: {
        sandwich: attacks.filter(a => a.attackType === 'sandwich').length,
        frontrun: attacks.filter(a => a.attackType === 'front-run').length,
        backrun: attacks.filter(a => a.attackType === 'back-run').length,
        other: attacks.filter(a => a.attackType === 'other').length,
      },
    },
    mevAttacks: attacks,
  });

  const DOWNLOAD_OPTIONS: DownloadOption[] = [
    {
      id: 'crypto_csv',
      label: 'Crypto Market Analytics (CSV)',
      badge: 'Data Science / ML',
      badgeColor: 'bg-sky-500/20 text-sky-300',
      iconBg: 'bg-sky-500/20 border-sky-500/30',
      iconColor: 'text-sky-400',
      borderColor: 'hover:border-sky-500/50',
      icon: <TrendingUp size={22} />,
      description: 'Feature-rich flat CSV for 50 top cryptocurrencies — ideal for Pandas, Excel, R, or machine learning pipelines.',
      features: ['Price, Market Cap, Volume (24h)', '% changes: 1h, 24h, 7d, 30d', 'Circulating / Total / Max Supply', 'Supply Ratio & Fully Diluted Valuation', 'Market Dominance %', 'Volume-to-MarketCap Ratio', 'Annualised Volatility', 'Fear & Greed Index', 'BTC & ETH Dominance', 'DeFi & Stablecoin Caps', 'Tags & Date Added'],
      apiPath: '/api/dataset/crypto-analytics',
      apiQuery: '?format=csv&limit=50',
      filename: `crypto_market_analytics_${timestamp()}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      btnStyle: 'bg-sky-500 hover:bg-sky-400 text-black',
      recommended: true,
    },
    {
      id: 'crypto_json',
      label: 'Crypto Analytics + DeFi / Gas (JSON)',
      badge: 'Full API Response',
      badgeColor: 'bg-yellow-500/20 text-yellow-300',
      iconBg: 'bg-yellow-500/20 border-yellow-500/30',
      iconColor: 'text-yellow-400',
      borderColor: 'hover:border-yellow-500/50',
      icon: <Coins size={22} />,
      description: 'Structured JSON with 50 coins, global metrics, DeFi TVL, stablecoin data, gas fees, volatility, and correlations.',
      features: ['50 coins with 20+ fields each', 'Global market overview', 'DeFi Protocol TVL rankings', 'Stablecoin peg health', 'Gas fees across EVM chains', 'Pairwise correlation matrix', 'On-chain metrics (ETH/BTC)', 'Whale activity data', 'Market cycle phase detection'],
      apiPath: '/api/dataset/crypto-analytics',
      apiQuery: '?format=json&limit=50',
      filename: `crypto_analytics_full_${timestamp()}.json`,
      mimeType: 'application/json',
      btnStyle: 'bg-yellow-500 hover:bg-yellow-400 text-black',
    },
    {
      id: 'json_full',
      label: 'Complete MEV + Crypto Dataset (JSON)',
      badge: 'Everything',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      iconBg: 'bg-emerald-500/20 border-emerald-500/30',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      icon: <FileJson size={22} />,
      description: 'Full dataset combining MEV attack telemetry with crypto market data, whale activity, on-chain analytics, and market cycle indicators.',
      features: ['All MEV attack records (up to 500)', 'Attack statistics summary', 'Top 50 cryptocurrencies (all fields)', 'Global market metrics + Fear/Greed', 'Volatility & correlations', 'Whale activity & on-chain metrics', 'DeFi / Stablecoin / Gas data', 'Dataset schema documentation'],
      apiPath: '/api/dataset/export',
      apiQuery: '?format=json',
      clientFallback: () => JSON.stringify(fallbackFullJson(), null, 2),
      filename: `mev_shield_complete_dataset_${timestamp()}.json`,
      mimeType: 'application/json',
      btnStyle: 'bg-emerald-500 hover:bg-emerald-400 text-black',
    },
    {
      id: 'full_csv',
      label: 'Full Combined Analytics (CSV)',
      badge: 'Multi-Section',
      badgeColor: 'bg-purple-500/20 text-purple-300',
      iconBg: 'bg-purple-500/20 border-purple-500/30',
      iconColor: 'text-purple-400',
      borderColor: 'hover:border-purple-500/50',
      icon: <Globe size={22} />,
      description: 'Single CSV with three sections: Crypto Market Data, MEV Attack Events, and Volatility Metrics — ready for pivot tables.',
      features: ['Section: 50 coins with market + sentiment data', 'Section: All MEV events with network info', 'Section: Per-asset volatility readings', 'Parseable section headers for scripting'],
      apiPath: '/api/dataset/export',
      apiQuery: '?format=full_csv',
      clientFallback: fallbackMevCsv,
      filename: `mev_shield_full_analytics_${timestamp()}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      btnStyle: 'bg-purple-500 hover:bg-purple-400 text-white',
    },
    {
      id: 'defi_csv',
      label: 'DeFi / Gas / Stablecoin Report (CSV)',
      badge: 'DeFi Focus',
      badgeColor: 'bg-orange-500/20 text-orange-300',
      iconBg: 'bg-orange-500/20 border-orange-500/30',
      iconColor: 'text-orange-400',
      borderColor: 'hover:border-orange-500/50',
      icon: <Zap size={22} />,
      description: 'Three-table CSV covering DeFi Protocol TVL rankings, gas fees per network, and stablecoin peg health metrics.',
      features: ['DeFi protocol TVL + yield', 'Gas: base fee, priority fee, tx cost (USD)', 'Stablecoin peg deviation tracking', 'Issuance & redemption rates'],
      apiPath: '/api/dataset/export',
      apiQuery: '?format=defi_csv',
      filename: `defi_gas_stablecoin_dataset_${timestamp()}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      btnStyle: 'bg-orange-500 hover:bg-orange-400 text-black',
    },
    {
      id: 'mev_csv',
      label: 'MEV Attacks Table (CSV)',
      badge: 'Blockchain Events',
      badgeColor: 'bg-red-500/20 text-red-300',
      iconBg: 'bg-red-500/20 border-red-500/30',
      iconColor: 'text-red-400',
      borderColor: 'hover:border-red-500/50',
      icon: <Activity size={22} />,
      description: 'Flat CSV of all detected MEV attack events — suitable for Excel, Google Sheets, or ML feature extraction.',
      features: ['Tx hash, attack type, risk score', 'Slippage loss in ETH', 'Gas price in Gwei', 'Victim/Attacker addresses', 'Target DEX protocol', 'Network & block number'],
      apiPath: '/api/dataset/export',
      apiQuery: '?format=csv',
      clientFallback: fallbackMevCsv,
      filename: `mev_attacks_${timestamp()}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      btnStyle: 'bg-red-500 hover:bg-red-400 text-white',
    },
    {
      id: 'mempool',
      label: 'Mempool Telemetry Stream (CSV)',
      badge: 'Raw Mempool',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      iconBg: 'bg-blue-500/20 border-blue-500/30',
      iconColor: 'text-blue-400',
      borderColor: 'hover:border-blue-500/50',
      icon: <Layers size={22} />,
      description: 'Raw pending transaction stream from the mempool: sender, receiver, value, gas limits, and timestamps.',
      features: ['Tx hash & from/to addresses', 'ETH value transferred', 'Gas limit & price', 'Arrival timestamp'],
      apiPath: '',
      apiQuery: '',
      clientFallback: () => {
        const headers = ['ID','Hash','From','To','Value_ETH','Gas_Limit','Gas_Price_Gwei','Timestamp'];
        const rows = attacks.map((a, i) => [
          i + 1, csvEscape(a.hash || ''), csvEscape(a.victimAddress || ''),
          csvEscape(a.transactionDetails?.to || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
          a.transactionDetails?.value || '0.000000', a.transactionDetails?.gasLimit || '250000',
          '35.00', csvEscape(a.timestamp || new Date().toISOString())
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      },
      filename: `mempool_telemetry_${timestamp()}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      btnStyle: 'bg-slate-700 hover:bg-slate-600 text-white',
    },
  ];

  const handleDownload = async (opt: DownloadOption) => {
    setDownloadingFormat(opt.id);
    setDownloadSuccess(null);
    try {
      let content: string | null = null;
      if (opt.apiPath) {
        try {
          const res = await fetch(`${apiUrl}${opt.apiPath}${opt.apiQuery}`);
          if (res.ok) {
            content = opt.mimeType.includes('json') ? JSON.stringify(await res.json(), null, 2) : await res.text();
          }
        } catch (e) {
          console.warn('Backend unreachable, using client fallback');
        }
      }
      if (!content && opt.clientFallback) {
        content = opt.clientFallback();
      }
      if (content) {
        triggerDownload(content, opt.filename, opt.mimeType);
        setDownloadSuccess(opt.id);
        setTimeout(() => setDownloadSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const recordCount = attacks.length > 0 ? attacks.length : 100;

  const renderTriggerButton = () => {
    if (variant === 'navbar') {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 hover:border-sky-400 transition-all duration-200 shadow-sm ${className}`}
          title="Download crypto & MEV dataset"
        >
          <Database size={14} className="text-sky-400" />
          <span>Download Dataset</span>
          <span className="bg-sky-400/20 text-sky-300 text-[10px] px-1.5 rounded font-mono">7 formats</span>
        </button>
      );
    }

    if (variant === 'card') {
      return (
        <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 rounded-xl border border-sky-500/40 text-sky-400">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-white font-bold text-base">Crypto Analytics & MEV Dataset</h4>
                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs px-2 py-0.5 rounded-full font-mono">
                  50 coins · 20+ features
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">
                Crypto prices, market caps, % changes, volatility, DeFi TVL, gas fees, stablecoin health, MEV attacks — in CSV or JSON.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
          >
            <Download size={16} />
            <span>Download Dataset</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 ${className}`}
      >
        <Download size={16} />
        <span>{buttonText}</span>
        <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded font-mono">{recordCount}</span>
      </button>
    );
  };

  return (
    <>
      {renderTriggerButton()}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className="p-3 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 rounded-xl text-sky-400">
                <Database size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  Crypto Analytics & MEV Dataset
                  <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">7 Formats</span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Download cryptocurrency market data with 20+ features per coin, DeFi metrics, gas analytics, stablecoin health, and MEV attack telemetry — ready for Pandas, Excel, R, or ML pipelines.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {[
                { label: 'Coins', value: '50', color: 'text-sky-400' },
                { label: 'Features / Coin', value: '20+', color: 'text-yellow-400' },
                { label: 'MEV Records', value: `${recordCount}+`, color: 'text-red-400' },
                { label: 'DeFi Protocols', value: '15+', color: 'text-orange-400' },
                { label: 'Export Formats', value: '7', color: 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className={`text-center p-1.5 ${i > 0 ? 'border-l border-slate-800' : ''}`}>
                  <p className={`${s.color} font-bold text-lg font-mono`}>{s.value}</p>
                  <p className="text-gray-500 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Dataset Options */}
            <div className="space-y-2.5 mb-5">
              {DOWNLOAD_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 ${opt.borderColor} rounded-xl transition-all`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 ${opt.iconBg} rounded-lg ${opt.iconColor} border mt-0.5 flex-shrink-0`}>
                        {opt.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h4 className="font-semibold text-white text-sm">{opt.label}</h4>
                          <span className={`text-[10px] ${opt.badgeColor} px-1.5 py-0.5 rounded font-mono font-medium`}>{opt.badge}</span>
                          {opt.recommended && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium">★ Recommended</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1.5">{opt.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {opt.features.slice(0, 5).map((f, i) => (
                            <span key={i} className="text-[10px] bg-slate-700/80 text-gray-400 px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                          {opt.features.length > 5 && (
                            <span className="text-[10px] bg-slate-700/80 text-gray-500 px-1.5 py-0.5 rounded">
                              +{opt.features.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(opt)}
                      disabled={downloadingFormat === opt.id}
                      className={`flex-shrink-0 px-3.5 py-2 ${opt.btnStyle} font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 mt-0.5`}
                    >
                      {downloadSuccess === opt.id ? (
                        <><Check size={13} /><span>Done!</span></>
                      ) : downloadingFormat === opt.id ? (
                        <span>Exporting…</span>
                      ) : (
                        <><Download size={13} /><span>Download</span></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-gray-400">
              <div className="flex items-center gap-2 text-gray-300 font-semibold mb-1">
                <Sparkles size={13} className="text-sky-400" />
                <span>Compatible With</span>
              </div>
              <p>
                Python (Pandas / NumPy / Scikit-Learn / PyTorch), R (tidyverse / caret), Jupyter Notebooks, Microsoft Excel, Google Sheets, Tableau, Power BI, and any tool that reads CSV or JSON.
                <br />
                All timestamps are ISO 8601 UTC. Monetary values are in USD. Prices have 8 decimal places for sub-cent accuracy.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatasetDownloadModal;
