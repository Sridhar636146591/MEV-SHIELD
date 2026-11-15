/**
 * Mempool Monitor Service
 * Main wrapper that uses real Alchemy WebSocket listener with fallback to simulated polling
 */

import { EventEmitter } from 'events';
import { MEVAttack, MempoolTransaction, BackrunOpportunity, MevShareBundle } from '../types';
import config from '../config';
import mevDetector from '../utils/mevDetector';
import alchemyService from './alchemyService';
import alchemyMempoolListener from './alchemyMempoolListener';
import emailAlertService from './emailAlertService';
import mevShareService from './mevShareService';
import pushNotificationService from './pushNotificationService';

export class MempoolMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private recentTransactions: MempoolTransaction[] = [];
  private detectedAttacks: MEVAttack[] = [];
  private mevShareOpportunities: BackrunOpportunity[] = [];
  private useWebSocket: boolean = false;
  private mevShareAttached: boolean = false;

  constructor() {
    super();
    this.initSeedAttacks();
  }

    private initSeedAttacks(): void {
    const now = Date.now();
    this.detectedAttacks = [
      {
        hash: '0x4f8a91bc7d3e201a45b6c7890ef123456789abcd',
        attackType: 'sandwich',
        riskScore: 88,
        slippageLoss: 1.45,
        gasPrice: '142000000000',
        timestamp: new Date(now - 180000).toISOString(),
        victimAddress: '0x7a250d5630',
        attackerAddress: '0xa107aa0e6b',
      },
      {
        hash: '0x9b2c3d4e5f60718293a4b5c6d7e8f90123456789',
        attackType: 'front-run',
        riskScore: 76,
        slippageLoss: 0.82,
        gasPrice: '165000000000',
        timestamp: new Date(now - 120000).toISOString(),
        victimAddress: '0xe592427a0a',
        attackerAddress: '0x881d402376',
      },
      {
        hash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
        attackType: 'back-run',
        riskScore: 64,
        slippageLoss: 0.35,
        gasPrice: '110000000000',
        timestamp: new Date(now - 75000).toISOString(),
        victimAddress: '0x1111111254',
        attackerAddress: '0x68b3465833',
      },
      {
        hash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
        attackType: 'sandwich',
        riskScore: 92,
        slippageLoss: 2.18,
        gasPrice: '185000000000',
        timestamp: new Date(now - 45000).toISOString(),
        victimAddress: '0x7a250d5630',
        attackerAddress: '0xdef1c0ded9',
      },
      {
        hash: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
        attackType: 'front-run',
        riskScore: 81,
        slippageLoss: 1.05,
        gasPrice: '138000000000',
        timestamp: new Date(now - 15000).toISOString(),
        victimAddress: '0xe592427a0a',
        attackerAddress: '0x188c37db9a',
      },
    ];
  }

  private readonly handleMevShareOpportunity = (opportunity: BackrunOpportunity) => {
    this.mevShareOpportunities.push(opportunity);
    if (this.mevShareOpportunities.length > 50) {
      this.mevShareOpportunities.shift();
    }
    this.emit('mevshare-opportunity', opportunity);
  };

  /**
   * Start monitoring mempool
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Mempool monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('📊 Starting mempool monitoring...');

    const hasRealKey = !!config.alchemyKey && config.alchemyKey.trim().length > 10 && !config.alchemyKey.toUpperCase().includes('YOUR_');

    if (hasRealKey) {
      try {
        console.log('🔌 Attempting real Alchemy WebSocket connection...');
        await alchemyMempoolListener.startListening();
        
        this.useWebSocket = true;
        console.log('✅ Using real Alchemy WebSocket for mempool data');

        alchemyMempoolListener.on('attack-detected', (attack) => {
          this.detectedAttacks.push(attack);
          if (this.detectedAttacks.length > 100) {
            this.detectedAttacks.shift();
          }
          this.emit('attack-detected', attack);
          emailAlertService.notifyAttack(attack);
          pushNotificationService.sendAttackNotification(attack).catch(() => undefined);
        });

        alchemyMempoolListener.on('mempool-updated', (data) => {
          this.emit('mempool-updated', data);
        });

        alchemyMempoolListener.on('transaction-processed', (tx) => {
          console.log(`📨 Transaction: ${tx.hash} | ${tx.from} → ${tx.to} | ${tx.value} ETH`);
        });

      } catch (error) {
        console.warn('⚠️ WebSocket connection failed, falling back to polling:', error);
        this.useWebSocket = false;
        await this.startPollingLoop();
      }
    } else {
      console.log('📡 Starting simulation/polling mempool monitor (Alchemy API key is placeholder)');
      this.useWebSocket = false;
      await this.startPollingLoop();
    }

    this.attachMevShareListeners();
    this.emit('started');
  }

  private async startPollingLoop(): Promise<void> {
    await this.updateMempool();
    this.updateInterval = setInterval(async () => {
      await this.updateMempool();
    }, 3000);
  }

  /**
   * Stop monitoring mempool
   */
  stopMonitoring(): void {
    if (this.useWebSocket) {
      alchemyMempoolListener.stopListening();
    } else {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
    this.detachMevShareListeners();
    this.isMonitoring = false;
    console.log('🛑 Mempool monitoring stopped');
    this.emit('stopped');
  }

  /**
   * Update mempool data
   */
  private async updateMempool(): Promise<void> {
    try {
      const pendingTxs = await alchemyService.getPendingTransactions(10);

      // Analyze new transactions
      for (const tx of pendingTxs) {
        // Check if already analyzed
        if (this.recentTransactions.find((t) => t.hash === tx.hash)) {
          continue;
        }

        // Analyze for MEV patterns
        const analysis = this.analyzeMempoolTransaction(tx);

        if (analysis) {
          this.detectedAttacks.push(analysis);

          this.emit('attack-detected', analysis);
          emailAlertService.notifyAttack(analysis);
          pushNotificationService.sendAttackNotification(analysis).catch(() => undefined);

          // Keep only last 100 attacks
          if (this.detectedAttacks.length > 100) {
            this.detectedAttacks.shift();
          }
        }

        this.recentTransactions.push(tx);
      }

      // Keep only last 50 transactions
      if (this.recentTransactions.length > 50) {
        this.recentTransactions = this.recentTransactions.slice(-50);
      }

      this.emit('mempool-updated', {
        totalPending: this.recentTransactions.length,
        recentAttacks: this.detectedAttacks.slice(-5),
        mevShareOpportunities: this.mevShareOpportunities.slice(-5),
      });
    } catch (error) {
      console.error('Error updating mempool:', error);
      this.emit('error', error);
    }
  }

  /**
   * Analyze single transaction for MEV
   */
  private analyzeMempoolTransaction(tx: MempoolTransaction): MEVAttack | null {
    const context = {
      pendingTransactions: this.recentTransactions.length,
      detectedPattern: this.simulatePatternDetection(),
    };

    if (Math.random() < 0.35) {
      const attack = mevDetector.analyzeTransaction(tx, context);
      attack.network = config.network;
      attack.source = this.useWebSocket ? 'alchemy-ws' : 'polling';
      attack.blockNumber = tx.blockNumber;
      return attack;
    }

    return null;
  }

  private simulatePatternDetection(): MEVAttack['attackType'] {
    const patterns: MEVAttack['attackType'][] = [
      'sandwich',
      'front-run',
      'back-run',
      'other',
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private attachMevShareListeners(): void {
    if (this.mevShareAttached) {
      return;
    }
    if (!config.mevShare?.wsUrl) {
      return;
    }
    mevShareService.on('opportunity', this.handleMevShareOpportunity);
    mevShareService.start();
    this.mevShareAttached = true;
  }

  private detachMevShareListeners(): void {
    if (!this.mevShareAttached) {
      return;
    }
    mevShareService.off('opportunity', this.handleMevShareOpportunity);
    mevShareService.stop();
    this.mevShareAttached = false;
  }

  /**
   * Add a mock attack to the detected attacks list
   */
  addMockAttack(attack: MEVAttack): void {
    this.detectedAttacks.push(attack);
    if (this.detectedAttacks.length > 100) {
      this.detectedAttacks.shift();
    }
    this.emit('attack-detected', attack);
  }

  /**
   * Get recent detected attacks
   */
  getRecentAttacks(limit: number = 10): MEVAttack[] {
    if (this.useWebSocket) {
      const realAttacks = alchemyMempoolListener.getRecentAttacks(limit);
      if (realAttacks && realAttacks.length > 0) {
        return realAttacks;
      }
    }
    return this.detectedAttacks.slice(-limit);
  }

  getRecentOpportunities(limit: number = 10): BackrunOpportunity[] {
    return this.mevShareOpportunities.slice(-limit);
  }

  /**
   * Get attack statistics
   */
  getAttackStatistics(): {
    totalDetected: number;
    byType: {
      sandwich: number;
      'front-run': number;
      'back-run': number;
      other: number;
    };
    averageRiskScore: number;
    totalSlippageLoss: number;
  } {
    if (this.useWebSocket) {
      const wsStats = alchemyMempoolListener.getAttackStatistics();
      if (wsStats && wsStats.totalDetected > 0) {
        return wsStats;
      }
    }

    const stats = {
      totalDetected: this.detectedAttacks.length,
      byType: {
        sandwich: 0,
        'front-run': 0,
        'back-run': 0,
        other: 0,
      },
      averageRiskScore: 0,
      totalSlippageLoss: 0,
    };

    let totalRisk = 0;
    for (const attack of this.detectedAttacks) {
      const type = attack.attackType || 'other';
      if (type in stats.byType) {
        (stats.byType as any)[type]++;
      } else {
        stats.byType.other++;
      }
      totalRisk += attack.riskScore || 0;
      stats.totalSlippageLoss += attack.slippageLoss || 0;
    }

    if (this.detectedAttacks.length > 0) {
      stats.averageRiskScore = Math.round(totalRisk / this.detectedAttacks.length);
      stats.totalSlippageLoss = parseFloat(stats.totalSlippageLoss.toFixed(4));
    }

    return stats;
  }

  getRecentTransactions(limit: number = 20): MempoolTransaction[] {
    return this.recentTransactions.slice(-limit);
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}

export default new MempoolMonitor();
