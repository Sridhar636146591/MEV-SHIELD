import React, { useState, useEffect } from 'react';

interface Widget {
  id: string;
  type: 'stats' | 'chart' | 'feed' | 'alerts';
  title: string;
  data: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface UserPreferences {
  theme: 'dark' | 'light';
  language: string;
  riskTolerance: 'low' | 'medium' | 'high';
  favoriteDEXes: string[];
  notifications: boolean;
}

const PersonalizedDashboard = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    language: 'en',
    riskTolerance: 'medium',
    favoriteDEXes: ['Uniswap', 'SushiSwap'],
    notifications: true,
  });

  const availableWidgets: Omit<Widget, 'position' | 'size'>[] = [
    { id: 'portfolio_value', type: 'stats', title: 'Portfolio Value', data: {} },
    { id: 'pnl_chart', type: 'chart', title: 'P&L Over Time', data: {} },
    { id: 'recent_activity', type: 'feed', title: 'Recent Activity', data: {} },
    { id: 'risk_alerts', type: 'alerts', title: 'Risk Alerts', data: {} },
    { id: 'gas_tracker', type: 'stats', title: 'Gas Tracker', data: {} },
    { id: 'top_tokens', type: 'chart', title: 'Top Performing Tokens', data: {} },
  ];

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('dashboard_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    // Load saved widgets
    const savedWidgets = localStorage.getItem('dashboard_widgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // Default layout
      setWidgets([
        { ...availableWidgets[0], position: { x: 0, y: 0 }, size: { width: 2, height: 1 } },
        { ...availableWidgets[3], position: { x: 2, y: 0 }, size: { width: 2, height: 1 } },
        { ...availableWidgets[1], position: { x: 0, y: 1 }, size: { width: 4, height: 2 } },
      ]);
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('dashboard_preferences', JSON.stringify(preferences));
  };

  const saveWidgets = () => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
  };

  const addWidget = (widget: Omit<Widget, 'position' | 'size'>) => {
    const newWidget: Widget = {
      ...widget,
      position: { x: widgets.length * 2, y: 0 },
      size: { width: 2, height: 1 },
    };
    setWidgets([...widgets, newWidget]);
    saveWidgets();
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    saveWidgets();
  };

  const moveWidget = (id: string, newPos: { x: number; y: number }) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, position: newPos } : w
    ));
    saveWidgets();
  };

  const resizeWidget = (id: string, newSize: { width: number; height: number }) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, size: newSize } : w
    ));
    saveWidgets();
  };

  return (
    <div className={`min-h-screen ${preferences.theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-brand-neon to-purple-600 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
            >
              {isEditing ? 'Done' : 'Edit Layout'}
            </button>
            
            <button
              onClick={() => setPreferences({ ...preferences, theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
              className="px-4 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
            >
              {preferences.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Add Widget Panel */}
        {isEditing && (
          <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Add Widget</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {availableWidgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget)}
                  className="p-4 bg-slate-700 rounded-lg text-white hover:bg-brand-neon transition-all"
                >
                  + {widget.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgets.map(widget => (
            <div
              key={widget.id}
              className={`relative bg-slate-800 rounded-xl border border-slate-700 p-6 transition-all hover:border-brand-neon`}
              style={{
                gridColumn: `span ${widget.size.width}`,
                gridRow: `span ${widget.size.height}`,
              }}
            >
              {/* Widget Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
                
                {isEditing && (
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Widget Content */}
              <div className="text-slate-300">
                {widget.type === 'stats' && (
                  <div className="text-3xl font-bold text-brand-neon">$125,432.50</div>
                )}
                
                {widget.type === 'chart' && (
                  <div className="h-40 bg-slate-700/50 rounded-lg flex items-center justify-center">
                    📈 Chart Placeholder
                  </div>
                )}
                
                {widget.type === 'feed' && (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>Transaction #{i}</span>
                        <span className="text-green-400">+$1,234</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {widget.type === 'alerts' && (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                      ⚠️ High MEV risk detected
                    </div>
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                      ⚡ Gas spike alert
                    </div>
                  </div>
                )}
              </div>

              {/* Resize Handle (Edit Mode) */}
              {isEditing && (
                <div className="absolute bottom-2 right-2 cursor-se-resize text-slate-500 hover:text-white">
                  ⤡
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-brand-neon/20 to-purple-600/20 p-6 rounded-xl border border-brand-neon/30">
            <div className="text-slate-400 text-sm mb-2">Total Protected</div>
            <div className="text-4xl font-bold text-white">$2,847,392</div>
            <div className="text-green-400 text-sm mt-2">↑ 23% this week</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-500/30">
            <div className="text-slate-400 text-sm mb-2">Attacks Prevented</div>
            <div className="text-4xl font-bold text-white">1,247</div>
            <div className="text-blue-400 text-sm mt-2">Last 30 days</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-500/30">
            <div className="text-slate-400 text-sm mb-2">Gas Saved</div>
            <div className="text-4xl font-bold text-white">45.8 ETH</div>
            <div className="text-orange-400 text-sm mt-2">~$82,450 USD</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedDashboard;
