/**
 * AI-Powered Predictive MEV Detection Engine
 * Uses machine learning to predict MEV attacks before they occur
 */

import { MempoolTransaction, MEVAttack } from '../types';

interface WalletBehaviorProfile {
  address: string;
  avgGasPrice: number;
  txFrequency: number;
  preferredDEXs: string[];
  attackSuccessRate: number;
  lastActiveBlock: number;
  riskScore: number;
}

interface MarketCondition {
  gasVolatility: number;
  liquidityDepth: number;
  timeOfDay: number;
  networkCongestion: number;
}

interface PredictionResult {
  attackProbability: number;
  predictedAttackType: 'SANDWICH' | 'FRONTRUN' | 'BACKRUN' | 'NONE';
  confidence: number;
  recommendedAction: string;
  riskFactors: string[];
}

export class AIPredictiveDetector {
  private walletProfiles: Map<string, WalletBehaviorProfile>;
  private historicalAttacks: MEVAttack[];
  private marketConditions: MarketCondition;

  constructor() {
    this.walletProfiles = new Map();
    this.historicalAttacks = [];
    this.marketConditions = {
      gasVolatility: 0,
      liquidityDepth: 0,
      timeOfDay: 0,
      networkCongestion: 0,
    };
  }

  /**
   * Build behavioral profile for a wallet address
   */
  buildWalletProfile(tx: MempoolTransaction): WalletBehaviorProfile {
    const existing = this.walletProfiles.get(tx.from);
    
    if (!existing) {
      const newProfile: WalletBehaviorProfile = {
        address: tx.from,
        avgGasPrice: parseInt(tx.gasPrice),
        txFrequency: 1,
        preferredDEXs: this.extractDEX(tx.to),
        attackSuccessRate: 0,
        lastActiveBlock: tx.blockNumber,
        riskScore: this.calculateInitialRisk(tx),
      };
      this.walletProfiles.set(tx.from, newProfile);
      return newProfile;
    }

    // Update existing profile
    existing.avgGasPrice = (existing.avgGasPrice + parseInt(tx.gasPrice)) / 2;
    existing.txFrequency += 1;
    existing.lastActiveBlock = tx.blockNumber;
    
    const dex = this.extractDEX(tx.to);
    if (dex.length > 0 && !existing.preferredDEXs.includes(dex[0])) {
      existing.preferredDEXs.push(...dex);
    }

    this.walletProfiles.set(tx.from, existing);
    return existing;
  }

  /**
   * Calculate initial risk score for a transaction
   */
  private calculateInitialRisk(tx: MempoolTransaction): number {
    let risk = 0;
    
    // High gas price indicates potential MEV bot
    const avgGasPrice = 50000000000; // 50 Gwei baseline
    if (parseInt(tx.gasPrice) > avgGasPrice * 1.5) {
      risk += 30;
    }

    // Self-transfer pattern (common in sandwich attacks)
    if (tx.from === tx.to) {
      risk += 40;
    }

    // Large value transactions
    const valueInEth = parseFloat(tx.value) / 1e18;
    if (valueInEth > 10) {
      risk += 20;
    }

    return Math.min(risk, 100);
  }

  /**
   * Extract DEX from transaction recipient
   */
  private extractDEX(address: string): string[] {
    const dexAddresses: Record<string, string[]> = {
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': ['Uniswap V2'],
      '0xE592427A0AEce92De3Edee1F18E0157C05861564': ['Uniswap V3'],
      '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': ['SushiSwap'],
      '0x881D40237659C251811CEC9c364ef91dC08D300C': ['MetaPool'],
    };
    return dexAddresses[address] || [];
  }

  /**
   * Predict if an attack will occur in the next N blocks
   */
  predictAttack(
    pendingTx: MempoolTransaction,
    mempoolState: MempoolTransaction[]
  ): PredictionResult {
    const riskFactors: string[] = [];
    let attackProbability = 0;

    // Factor 1: Wallet behavior analysis
    const profile = this.buildWalletProfile(pendingTx);
    if (profile.riskScore > 50) {
      attackProbability += 25;
      riskFactors.push('High-risk wallet behavior detected');
    }

    // Factor 2: Mempool congestion analysis
    const similarTxs = mempoolState.filter(
      (tx) => this.isSimilarTarget(tx.to, pendingTx.to)
    );
    if (similarTxs.length > 3) {
      attackProbability += 30;
      riskFactors.push('Multiple similar transactions in mempool');
    }

    // Factor 3: Gas price competition
    const higherGasTxs = mempoolState.filter(
      (tx) => parseInt(tx.gasPrice) > parseInt(pendingTx.gasPrice)
    );
    if (higherGasTxs.length > 5) {
      attackProbability += 20;
      riskFactors.push('Gas price war detected');
    }

    // Factor 4: Market conditions
    if (this.marketConditions.gasVolatility > 0.7) {
      attackProbability += 15;
      riskFactors.push('High gas volatility');
    }

    // Factor 5: Time-based patterns
    const hour = new Date().getHours();
    if (hour >= 14 && hour <= 16) { // Peak trading hours
      attackProbability += 10;
      riskFactors.push('Peak trading hours');
    }

    // Determine attack type
    let predictedAttackType: 'SANDWICH' | 'FRONTRUN' | 'BACKRUN' | 'NONE' = 'NONE';
    if (attackProbability > 60) {
      if (similarTxs.length > 5) {
        predictedAttackType = 'SANDWICH';
      } else if (higherGasTxs.length > 3) {
        predictedAttackType = 'FRONTRUN';
      } else {
        predictedAttackType = 'BACKRUN';
      }
    }

    // Generate recommendation
    let recommendedAction = 'Proceed with transaction';
    if (attackProbability > 70) {
      recommendedAction = 'HIGH RISK: Use Flashbots Protect or delay transaction';
    } else if (attackProbability > 40) {
      recommendedAction = 'MODERATE RISK: Consider reducing slippage tolerance';
    }

    return {
      attackProbability: Math.min(attackProbability, 100),
      predictedAttackType,
      confidence: this.calculateConfidence(attackProbability, riskFactors.length),
      recommendedAction,
      riskFactors,
    };
  }

  /**
   * Check if two addresses target similar contracts
   */
  private isSimilarTarget(addr1: string, addr2: string): boolean {
    if (addr1 === addr2) return true;
    
    const dexPairs = [
      ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xE592427A0AEce92De3Edee1F18E0157C05861564'],
      ['0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
    ];

    return dexPairs.some(pair => 
      (pair.includes(addr1) && pair.includes(addr2))
    );
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(probability: number, factorCount: number): number {
    const baseConfidence = Math.min(probability, 100);
    const factorBonus = Math.min(factorCount * 5, 20);
    return Math.min(baseConfidence + factorBonus, 100);
  }

  /**
   * Update market conditions
   */
  updateMarketConditions(conditions: Partial<MarketCondition>) {
    this.marketConditions = { ...this.marketConditions, ...conditions };
  }

  /**
   * Record historical attack for learning
   */
  recordAttack(attack: MEVAttack) {
    this.historicalAttacks.push(attack);
    
    // Update attacker profile
    if (!attack.attackerAddress) return;
    
    const profile = this.walletProfiles.get(attack.attackerAddress);
    if (profile) {
      profile.attackSuccessRate = 
        (profile.attackSuccessRate + 1) / (this.historicalAttacks.filter(a => a.attackerAddress === attack.attackerAddress).length + 1);
      profile.riskScore = Math.min(profile.riskScore + 5, 100);
      this.walletProfiles.set(attack.attackerAddress, profile);
    }
  }

  /**
   * Get cluster of related MEV bots
   */
  identifyBotCluster(address: string): string[] {
    const profile = this.walletProfiles.get(address);
    if (!profile) return [];

    // Find wallets with similar behavior patterns
    const clusters: string[] = [];
    this.walletProfiles.forEach((profile, addr) => {
      const similarity = this.calculateBehaviorSimilarity(profile, this.walletProfiles.get(address)!);
      if (similarity > 0.8) {
        clusters.push(addr);
      }
    });

    return clusters;
  }

  /**
   * Calculate behavioral similarity between two wallets
   */
  private calculateBehaviorSimilarity(p1: WalletBehaviorProfile, p2: WalletBehaviorProfile): number {
    let similarity = 0;

    // Gas price similarity
    const gasDiff = Math.abs(p1.avgGasPrice - p2.avgGasPrice) / Math.max(p1.avgGasPrice, p2.avgGasPrice);
    similarity += (1 - gasDiff) * 0.3;

    // DEX preference similarity
    const commonDEXs = p1.preferredDEXs.filter(d => p2.preferredDEXs.includes(d));
    similarity += (commonDEXs.length / Math.max(p1.preferredDEXs.length, p2.preferredDEXs.length)) * 0.4;

    // Activity pattern similarity
    similarity += (1 - Math.abs(p1.txFrequency - p2.txFrequency) / 100) * 0.3;

    return Math.min(similarity, 1);
  }

  /**
   * Export wallet profiles for analysis
   */
  exportProfiles(): WalletBehaviorProfile[] {
    return Array.from(this.walletProfiles.values());
  }

  /**
   * Clear old data to maintain performance
   */
  cleanup(oldBlocks: number = 1000) {
    const currentBlock = Math.max(...Array.from(this.walletProfiles.values()).map(p => p.lastActiveBlock));
    this.walletProfiles.forEach((profile, address) => {
      if (currentBlock - profile.lastActiveBlock > oldBlocks) {
        this.walletProfiles.delete(address);
      }
    });
  }
}

export default AIPredictiveDetector;
