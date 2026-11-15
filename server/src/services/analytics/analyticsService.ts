/**
 * Advanced Analytics Service - Market Intelligence & Heatmaps
 */

import { MEVAttack } from '../../types';

export interface AttackMetrics {
  totalAttacks: number;
  attacksByType: Record<string, number>;
  attacksByChain: Record<number, number>;
  totalValueAtRisk: string;
  averageSlippageLoss: number;
  successRate: number;
  topAttackers: Array<{ address: string; count: number; profit: string }>;
  hourlyTrend: Array<{ hour: number; count: number }>;
}

export interface HeatmapData {
  geographic: Array<{ region: string; intensity: number }>;
  dexRisk: Array<{ dex: string; riskLevel: number; attacks: number }>;
  timeBased: Array<{ hour: number; day: number; intensity: number }>;
}

class AnalyticsService {
  private attackHistory: MEVAttack[] = [];
  private metricsCache: AttackMetrics | null = null;

  /**
   * Record new attack for analysis
   */
  recordAttack(attack: MEVAttack) {
    this.attackHistory.push(attack);
    this.metricsCache = null; // Invalidate cache
  }

  /**
   * Get comprehensive attack metrics
   */
  getMetrics(): AttackMetrics {
    if (this.metricsCache) {
      return this.metricsCache;
    }

    const metrics: AttackMetrics = {
      totalAttacks: this.attackHistory.length,
      attacksByType: {},
      attacksByChain: {},
      totalValueAtRisk: '0',
      averageSlippageLoss: 0,
      successRate: 0,
      topAttackers: [],
      hourlyTrend: [],
    };

    // Calculate attacks by type
    this.attackHistory.forEach(attack => {
      metrics.attacksByType[attack.attackType] = 
        (metrics.attacksByType[attack.attackType] || 0) + 1;
      
      // Attacks by chain - use network property and convert to chainId number
      if (attack.network) {
        const chainId = this.parseChainId(attack.network);
        metrics.attacksByChain[chainId] = 
          (metrics.attacksByChain[chainId] || 0) + 1;
      }
    });

    // Calculate total value at risk
    const totalValue = this.attackHistory.reduce(
      (sum, attack) => sum + attack.slippageLoss,
      0
    );
    metrics.totalValueAtRisk = totalValue.toFixed(4) + ' ETH';

    // Average slippage loss
    metrics.averageSlippageLoss = totalValue / this.attackHistory.length;

    // Success rate (since we don't have 'protected' field, calculate based on detection rate)
    const detectedCount = this.attackHistory.filter(a => a.riskScore > 50).length;
    metrics.successRate = (detectedCount / this.attackHistory.length) * 100;

    // Top attackers
    const attackerMap = new Map<string, { count: number; profit: number }>();
    this.attackHistory.forEach(attack => {
      if (attack.attackerAddress) {
        const existing = attackerMap.get(attack.attackerAddress) || { count: 0, profit: 0 };
        existing.count++;
        existing.profit += attack.slippageLoss;
        attackerMap.set(attack.attackerAddress, existing);
      }
    });

    metrics.topAttackers = Array.from(attackerMap.entries())
      .map(([address, data]) => ({
        address,
        count: data.count,
        profit: data.profit.toFixed(4) + ' ETH',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly trend
    const hourMap = new Map<number, number>();
    this.attackHistory.forEach(attack => {
      const hour = new Date(attack.timestamp).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    metrics.hourlyTrend = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    this.metricsCache = metrics;
    return metrics;
  }

  /**
   * Generate heatmap data
   */
  generateHeatmap(): HeatmapData {
    const heatmap: HeatmapData = {
      geographic: [],
      dexRisk: [],
      timeBased: [],
    };

    // Geographic distribution (based on timezone inference)
    const regionMap = new Map<string, number>();
    this.attackHistory.forEach(attack => {
      const hour = new Date(attack.timestamp).getHours();
      let region = 'Unknown';
      
      if (hour >= 9 && hour <= 17) region = 'North America';
      else if (hour >= 1 && hour <= 9) region = 'Asia';
      else if (hour >= 17 && hour <= 23) region = 'Europe';
      
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });

    heatmap.geographic = Array.from(regionMap.entries())
      .map(([region, intensity]) => ({ region, intensity }));

    // DEX risk levels (using source field since targetProtocol doesn't exist)
    const dexMap = new Map<string, { attacks: number; totalVolume: number }>();
    this.attackHistory.forEach(attack => {
      const dex = attack.source || 'Unknown DEX';
      const existing = dexMap.get(dex) || { attacks: 0, totalVolume: 0 };
      existing.attacks++;
      existing.totalVolume += attack.slippageLoss;
      dexMap.set(dex, existing);
    });

    heatmap.dexRisk = Array.from(dexMap.entries())
      .map(([dex, data]) => ({
        dex,
        riskLevel: Math.min((data.attacks / 100) * 100, 100),
        attacks: data.attacks,
      }))
      .sort((a, b) => b.riskLevel - a.riskLevel);

    // Time-based patterns
    const timeMap = new Map<string, number>();
    this.attackHistory.forEach(attack => {
      const date = new Date(attack.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}-${hour}`;
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    heatmap.timeBased = Array.from(timeMap.entries())
      .map(([key, intensity]) => {
        const [day, hour] = key.split('-').map(Number);
        return { hour, day, intensity };
      });

    return heatmap;
  }

  /**
   * Generate market intelligence report
   */
  generateReport(period: 'daily' | 'weekly' | 'monthly'): object {
    const now = Date.now();
    const periodMs = period === 'daily' ? 24 * 60 * 60 * 1000 :
                     period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                     30 * 24 * 60 * 60 * 1000;

    const periodAttacks = this.attackHistory.filter(
      attack => now - new Date(attack.timestamp).getTime() < periodMs
    );

    const metrics = this.getMetrics();

    return {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAttacks: periodAttacks.length,
        uniqueAttackers: new Set(periodAttacks.map(a => a.attackerAddress || '').filter(Boolean)).size,
        totalValueAtRisk: periodAttacks.reduce((sum, a) => sum + a.slippageLoss, 0),
        averageAttacksPerDay: periodAttacks.length / (periodMs / (24 * 60 * 60 * 1000)),
      },
      trends: {
        mostCommonAttackType: Object.entries(metrics.attacksByType)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
        peakActivityHour: metrics.hourlyTrend.sort((a, b) => b.count - a.count)[0]?.hour || 0,
        highestRiskChain: Object.entries(metrics.attacksByChain)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
      },
      topThreats: metrics.topAttackers.slice(0, 5),
      recommendations: this.generateRecommendations(periodAttacks),
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(attacks: MEVAttack[]): string[] {
    const recommendations: string[] = [];

    // Check for high sandwich attack frequency
    const sandwichCount = attacks.filter(a => a.attackType === 'sandwich').length;
    if (sandwichCount > attacks.length * 0.5) {
      recommendations.push('High sandwich attack activity detected. Use Flashbots Protect for all trades.');
    }

    // Check for specific high-risk periods
    const peakHour = new Map<number, number>();
    attacks.forEach(attack => {
      const hour = new Date(attack.timestamp).getHours();
      peakHour.set(hour, (peakHour.get(hour) || 0) + 1);
    });

    const maxHour = Array.from(peakHour.entries()).sort((a, b) => b[1] - a[1])[0];
    if (maxHour && maxHour[1] > 10) {
      recommendations.push(`Avoid trading during hour ${maxHour[0]}:00 UTC when MEV activity peaks.`);
    }

    // Check for dominant attackers
    const attackerCounts = new Map<string, number>();
    attacks.forEach(attack => {
      if (attack.attackerAddress) {
        attackerCounts.set(attack.attackerAddress, (attackerCounts.get(attack.attackerAddress) || 0) + 1);
      }
    });

    const topAttacker = Array.from(attackerCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topAttacker && topAttacker[1] > 20) {
      recommendations.push(`Monitor address ${topAttacker[0]} - highly active MEV bot detected.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('MEV activity is within normal ranges. Continue using standard protection measures.');
    }

    return recommendations;
  }

  /**
   * Export analytics data
   */
  exportData(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(this.getMetrics(), null, 2);
    }

    // CSV export
    const metrics = this.getMetrics();
    let csv = 'Metric,Value\n';
    csv += `Total Attacks,${metrics.totalAttacks}\n`;
    csv += `Success Rate,${metrics.successRate}%\n`;
    csv += `Avg Slippage,${metrics.averageSlippageLoss} ETH\n`;
    
    return csv;
  }

  /**
   * Parse network string to chainId number
   */
  private parseChainId(network: string): number {
    const networkMap: Record<string, number> = {
      'ethereum': 1,
      'mainnet': 1,
      'bsc': 56,
      'polygon': 137,
      'arbitrum': 42161,
      'optimism': 10,
      'avalanche': 43114,
    };
    
    const lowerNetwork = network.toLowerCase();
    for (const [name, id] of Object.entries(networkMap)) {
      if (lowerNetwork.includes(name)) {
        return id;
      }
    }
    
    // Try to parse as number directly
    const parsed = parseInt(network);
    return isNaN(parsed) ? 1 : parsed; // Default to Ethereum mainnet
  }
}

export default new AnalyticsService();
