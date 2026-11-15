import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState({
    topDetectors: [],
    topProtectors: [],
    topContributors: [],
    userRank: null,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/leaderboard?timeframe=${timeframe}`);
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (user, index) => (
    <div key={user.address} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all">
      <div className="flex items-center space-x-4">
        <div className={`text-2xl font-bold ${index < 3 ? 'text-brand-neon' : 'text-slate-400'}`}>
          #{index + 1}
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-neon to-purple-600 flex items-center justify-center text-white font-bold">
          {user.address.slice(2, 6)}
        </div>
        <div>
          <div className="font-semibold text-white">{user.ens || `User_${user.address.slice(0, 6)}`}</div>
          <div className="text-sm text-slate-400">{user.address.slice(0, 10)}...{user.address.slice(-8)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-brand-neon">{user.points.toLocaleString()}</div>
        <div className="text-sm text-slate-400">{user.badges?.length || 0} badges</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🏆 Community Leaderboards</h1>
          <p className="text-xl text-slate-300">Compete with others and earn rewards for protecting the ecosystem</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center mb-8 space-x-4">
          {['daily', 'weekly', 'monthly', 'alltime'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-brand-neon text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Total Participants</div>
            <div className="text-4xl font-bold text-white">12,847</div>
            <div className="text-green-400 text-sm mt-2">↑ 1,234 this week</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Prize Pool</div>
            <div className="text-4xl font-bold text-brand-neon">$50,000</div>
            <div className="text-slate-400 text-sm mt-2">Distributed monthly</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Your Rank</div>
            <div className="text-4xl font-bold text-purple-400">#1,337</div>
            <div className="text-slate-400 text-sm mt-2">Top 10%</div>
          </div>
        </div>

        {/* Leaderboard Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Detectors */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">🔍 Top Detectors</h2>
              <p className="text-slate-400 text-sm">Users who detected the most MEV attacks</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center text-slate-400 py-8">Loading...</div>
              ) : (
                leaderboardData.topDetectors.map((user, index) => renderRow(user, index))
              )}
            </div>
          </div>

          {/* Top Protectors */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">🛡️ Top Protectors</h2>
              <p className="text-slate-400 text-sm">Users who protected the most transactions</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center text-slate-400 py-8">Loading...</div>
              ) : (
                leaderboardData.topProtectors.map((user, index) => renderRow(user, index))
              )}
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="mt-8 bg-gradient-to-r from-brand-neon/20 to-purple-600/20 rounded-xl p-8 border border-brand-neon/30">
          <h2 className="text-3xl font-bold text-white mb-4">🎁 Earn Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-brand-neon mb-2">Detection Rewards</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• 10 points per attack detected</li>
                <li>• 50 points bonus for rare attacks</li>
                <li>• 100 points for new pattern discovery</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">Protection Rewards</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• 5 points per protected transaction</li>
                <li>• 25 points for successful save</li>
                <li>• Monthly prizes for top protectors</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">Community Rewards</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• 20 points for verified reports</li>
                <li>• 15 points for helpful votes</li>
                <li>• 50 points for referral bonuses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
