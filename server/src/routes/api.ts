/**
 * API Routes
 * Main API endpoints for MEV detection and protection
 */

import express, { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Transaction } from 'ethers';
import mempoolMonitor from '../services/mempoolMonitor';
import alchemyService from '../services/alchemyService';
import flashbotsService from '../services/flashbotsService';
import mevDetector from '../utils/mevDetector';
import emailAlertService from '../services/emailAlertService';
import {
  ApiResponse,
  MEVAttack,
  UserProfile,
  AnalyticsOverview,
  PaymentPlan,
  PaymentIntent,
  AttackStatistics,
  DexPoolSnapshot,
  PoolVolatilitySample,
  TradeIntent,
  SlippageRecommendation,
  BundleSimulationRequest,
  BundleOptimizationRequest,
  PushPlatform,
  PushRegistration,
} from '../types';
import pushNotificationService from '../services/pushNotificationService';
import cryptoMarketService from '../services/cryptoMarketService';
import config from '../config';

const router = Router();

const userProfiles = new Map<string, UserProfile>();
const addressIndex = new Map<string, string>();

const normalizeAddress = (address?: string): string => {
  if (address && typeof address === 'string' && address.trim().length > 0) {
    const hashed = createHash('sha256').update(address.toLowerCase()).digest('hex').slice(0, 40);
    return `0x${hashed}`;
  }
  return `0x${randomBytes(20).toString('hex')}`;
};

const defaultAlertsState = () => ({
  sandwich: false,
  frontrun: false,
  backrun: false,
  highGas: false,
  highSlippage: false,
});

const recalcLevel = (profile: UserProfile) => {
  profile.level = Math.max(1, 1 + Math.floor(profile.points / 1000));
};

const paymentPlans: PaymentPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    description: 'Core Ethereum MEV monitoring and alerts',
    priceUsd: 0,
    currency: 'USD',
    features: ['Real-time attack detection', 'Anonymous profile tracking', 'Flashbots protection simulation'],
  },
];

const paymentIntents: PaymentIntent[] = [];

const createAnonymousProfile = (address?: string): UserProfile => {
  const id = randomUUID();
  const alias = `anon-${id.split('-')[0]}`;
  const normalizedAddress = normalizeAddress(address || alias);
  const now = new Date().toISOString();
  const existingId = addressIndex.get(normalizedAddress);
  if (existingId) {
    const existingProfile = userProfiles.get(existingId);
    if (existingProfile) {
      existingProfile.lastActiveAt = now;
      return existingProfile;
    }
  }
  const profile: UserProfile = {
    id,
    address: normalizedAddress,
    alias,
    points: 0,
    level: 1,
    badges: ['early-access'],
    createdAt: now,
    protectedTransactions: 0,
    lastActiveAt: now,
    alerts: defaultAlertsState(),
  };
  recalcLevel(profile);
  userProfiles.set(id, profile);
  addressIndex.set(normalizedAddress, id);
  return profile;
};

const getProfileById = (profileId: string): UserProfile | undefined => userProfiles.get(profileId);

const getProfileByAddress = (address?: string): UserProfile => {
  const normalized = normalizeAddress(address);
  const profileId = addressIndex.get(normalized);
  if (profileId) {
    const existing = userProfiles.get(profileId);
    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      return existing;
    }
  }
  return createAnonymousProfile(address);
};

const summarizeProfiles = (): { total: number; active: number; averagePoints: number; totalProtected: number } => {
  const profiles = Array.from(userProfiles.values());
  const total = profiles.length;
  if (total === 0) {
    return { total: 0, active: 0, averagePoints: 0, totalProtected: 0 };
  }
  const now = Date.now();
  const active = profiles.filter((p) => now - new Date(p.lastActiveAt).getTime() < 1000 * 60 * 10).length;
  const averagePoints = profiles.reduce((sum, p) => sum + p.points, 0) / total;
  const totalProtected = profiles.reduce((sum, p) => sum + p.protectedTransactions, 0);
  return { total, active, averagePoints, totalProtected };
};

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MEV Detector API is running',
    timestamp: new Date().toISOString(),
    status: mempoolMonitor.isActive() ? 'monitoring' : 'idle',
  });
});

/**
 * GET /api/attacks
 * Get recent detected MEV attacks
 */
router.get('/attacks', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const attacks = mempoolMonitor.getRecentAttacks(limit);

  res.json({
    success: true,
    data: attacks,
    count: attacks.length,
    timestamp: new Date().toISOString(),
  } as ApiResponse<MEVAttack[]>);
});

/**
 * GET /api/attacks/:id
 * Get attack details by ID or hash
 */
router.get('/attacks/:id', (req: Request, res: Response) => {
  const attacks = mempoolMonitor.getRecentAttacks(100);
  const found = attacks.find((a) => a.hash === req.params.id || (a as any).id === req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, error: 'Attack not found' });
  }
  res.json({ success: true, data: found });
});

/**
 * GET /api/mempool/transactions
 * Get recent pending mempool transactions
 */
router.get('/mempool/transactions', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const txs = await alchemyService.getPendingTransactions(limit);
  res.json({
    success: true,
    data: txs,
    count: txs.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/mempool/scan
 * Trigger manual scan of mempool
 */
router.post('/mempool/scan', async (req: Request, res: Response) => {
  const txs = await alchemyService.getPendingTransactions(25);
  res.json({
    success: true,
    message: `Scanned ${txs.length} mempool transactions`,
    scannedCount: txs.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/attacks/statistics
 * Get MEV attack statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = mempoolMonitor.getAttackStatistics();
  const byType = (stats as any).byType || { sandwich: 0, 'front-run': 0, 'back-run': 0, other: 0 };
  res.json({
    success: true,
    data: {
      todayAttacks: stats.totalDetected || 0,
      avgRiskScore: stats.averageRiskScore || 0,
      totalSlippage: stats.totalSlippageLoss || 0,
      protectedUsers: userProfiles.size || 24,
      attackTypes: {
        sandwich: byType['sandwich'] || 0,
        frontRun: byType['front-run'] || 0,
        backRun: byType['back-run'] || 0,
        other: byType['other'] || 0,
      },
      timeline: [
        { hour: '00:00', attacks: 0 },
        { hour: '04:00', attacks: 0 },
        { hour: '08:00', attacks: 0 },
        { hour: '12:00', attacks: 0 },
        { hour: '16:00', attacks: 0 },
        { hour: '20:00', attacks: stats.totalDetected || 0 },
      ],
      raw: stats,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/attacks/statistics', (req: Request, res: Response) => {
  const stats = mempoolMonitor.getAttackStatistics();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/gas-prices
 * Get current gas prices
 */
router.get('/gas-prices', async (req: Request, res: Response) => {
  try {
    const gasPrices = await alchemyService.getGasPrices();

    res.json({
      success: true,
      data: gasPrices,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analyze-transaction
 * Analyze a specific transaction for MEV risk
 */
router.post('/analyze-transaction', (req: Request, res: Response) => {
  try {
    const { txHash, from, to, value, gasPrice } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'txHash is required',
      });
    }

    const mockTx = {
      hash: txHash,
      from: from || '0x' + Math.random().toString(16).slice(2),
      to: to || '0x' + Math.random().toString(16).slice(2),
      value: value || '0',
      gasPrice: gasPrice || '50000000000',
      gasLimit: '21000',
      nonce: 0,
      blockNumber: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const context = {
      pendingTransactions: 50,
      detectedPattern: 'sandwich' as const,
    };

    const analysis = mevDetector.analyzeTransaction(mockTx, context);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/protect-transaction
 * Submit transaction for Flashbots protection
 */
router.post('/protect-transaction', async (req: Request, res: Response) => {
  try {
    const { txHex, simulateOnly, fast, privacyPreferences } = req.body;

    if (!txHex || typeof txHex !== 'string' || !txHex.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'txHex (0x-prefixed) is required',
      });
    }

    let parsedTx: Transaction;
    try {
      parsedTx = Transaction.from(txHex);
    } catch (parseErr: any) {
      return res.status(400).json({
        success: false,
        error: `Invalid transaction hex: ${parseErr?.message || 'unable to decode'}`,
      });
    }

    if (simulateOnly) {
      const simulation = await flashbotsService.simulateProtection({
        value: parsedTx.value?.toString(),
        gasPrice: parsedTx.gasPrice?.toString(),
        gasLimit: parsedTx.gasLimit?.toString(),
        maxFeePerGas: parsedTx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: parsedTx.maxPriorityFeePerGas?.toString(),
      });
      return res.json({
        success: true,
        data: simulation,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await flashbotsService.submitPrivateTransaction(txHex, {
      fast,
      privacyPreferences,
    });

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bundle/:bundleHash/status
 * Get bundle execution status
 */
router.get('/bundle/:bundleHash/status', async (req: Request, res: Response) => {
  try {
    const status = await flashbotsService.getBundleStatus(req.params.bundleHash);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found',
      });
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bundles/simulate
 * Simulate MEV bundle profitability using Flashbots builder API
 */
router.post('/bundles/simulate', async (req: Request, res: Response) => {
  try {
    const payload: BundleSimulationRequest = req.body;

    if (!payload || !Array.isArray(payload.transactions) || payload.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    if (typeof payload.targetBlock !== 'number' || payload.targetBlock <= 0) {
      return res.status(400).json({ success: false, error: 'targetBlock must be positive number' });
    }

    const result = await flashbotsService.simulateBundle(payload);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bundles/optimize
 * Simulate and recommend optimizations for MEV bundles
 */
router.post('/bundles/optimize', async (req: Request, res: Response) => {
  try {
    const payload: BundleOptimizationRequest = req.body;

    if (!payload || !Array.isArray(payload.transactions) || payload.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    if (typeof payload.targetBlock !== 'number' || payload.targetBlock <= 0) {
      return res.status(400).json({ success: false, error: 'targetBlock must be positive number' });
    }

    const result = await flashbotsService.optimizeBundle(payload);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/mobile/push-token
 * Register Expo push token for mobile alerts
 */
router.post('/mobile/push-token', (req: Request, res: Response) => {
  try {
    const { token, platform, address, label } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'token is required' });
    }
    const normalized = typeof platform === 'string' ? (platform.toLowerCase() as PushPlatform) : undefined;
    const validPlatforms: PushPlatform[] = ['ios', 'android', 'web'];
    if (!normalized || !validPlatforms.includes(normalized)) {
      return res.status(400).json({ success: false, error: 'platform must be ios, android, or web' });
    }
    const stored = pushNotificationService.registerToken(token, {
      platform: normalized,
      address: typeof address === 'string' ? address : undefined,
      label: typeof label === 'string' ? label : undefined,
    });
    const registration: PushRegistration = {
      token,
      platform: normalized,
      address: stored.address,
      label: stored.label,
      registeredAt: stored.updatedAt,
    };
    res.json({
      success: true,
      data: registration,
      timestamp: new Date().toISOString(),
    } as ApiResponse<PushRegistration>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mobile/push-token', (req: Request, res: Response) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'token is required' });
  }
  const removed = pushNotificationService.unregisterToken(token);
  res.json({
    success: true,
    data: { removed },
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/alerts/subscribe
 * Subscribe user to email alerts
 */
router.post('/alerts/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, alerts } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    const subscriber = await emailAlertService.subscribe(email, alerts || {});

    res.json({
      success: true,
      message: 'Successfully subscribed to alerts',
      data: subscriber,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/alerts/send-test
 * Send test email alert
 */
router.post('/alerts/send-test', async (req: Request, res: Response) => {
  try {
    const { email, testAttack } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    const sent = await emailAlertService.sendTestEmail(email, testAttack);

    if (!sent) {
      return res.status(503).json({
        success: false,
        error: 'Email service unavailable',
      });
    }

    res.json({
      success: true,
      message: 'Test alert email sent successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/status
 * Get overall system status
 */
router.get('/status', (req: Request, res: Response) => {
  const stats = mempoolMonitor.getAttackStatistics();

  res.json({
    success: true,
    data: {
      monitoring: mempoolMonitor.isActive(),
      recentAttacks: mempoolMonitor.getRecentAttacks(5),
      statistics: stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});


/**
 * GET /api/dataset/export
 * GET /api/dataset/download
 * Export complete MEV detection and market telemetry dataset in JSON or CSV format
 * Supports: format=json | format=csv | format=crypto_csv | format=defi_csv | format=full_csv
 */
router.get(['/dataset/export', '/dataset/download'], async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string)?.toLowerCase() || 'json';
    const attacks = mempoolMonitor.getRecentAttacks(500);
    const stats = mempoolMonitor.getAttackStatistics();

    // Gather all market data in parallel
    let marketMetrics: any = null;
    let cryptoListings: any[] = [];
    let volatilityData: any[] = [];
    let correlationData: any[] = [];
    let fearGreedIndex: number = 50;
    let gasFeeData: any[] = [];
    let defiMetrics: any[] = [];
    let stablecoinData: any[] = [];
    let whaleData: any = null;
    let onChainEth: any = null;
    let onChainBtc: any = null;
    let miningBtc: any = null;
    let marketCycle: any = null;

    try {
      const settled = await Promise.allSettled([
        cryptoMarketService.getGlobalMetrics(),
        cryptoMarketService.getCryptocurrencyListings(50),
        cryptoMarketService.getVolatilityData(['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'MATIC', 'DOT']),
        cryptoMarketService.getCorrelationData(['BTC', 'ETH', 'BNB', 'SOL']),
        cryptoMarketService.getFearGreedIndex(),
        cryptoMarketService.getGasFeeData(),
        cryptoMarketService.getDeFiMetrics(),
        cryptoMarketService.getStablecoinData(),
        cryptoMarketService.getWhaleActivityData('ETH'),
        cryptoMarketService.getOnChainData('ETH'),
        cryptoMarketService.getOnChainData('BTC'),
        cryptoMarketService.getMiningMetrics('BTC'),
        cryptoMarketService.getMarketCycleData(),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));
      marketMetrics   = settled[0];
      cryptoListings  = (settled[1] as any[]) || [];
      volatilityData  = (settled[2] as any[]) || [];
      correlationData = (settled[3] as any[]) || [];
      fearGreedIndex  = (settled[4] as number) ?? 50;
      gasFeeData      = (settled[5] as any[]) || [];
      defiMetrics     = (settled[6] as any[]) || [];
      stablecoinData  = (settled[7] as any[]) || [];
      whaleData       = settled[8];
      onChainEth      = settled[9];
      onChainBtc      = settled[10];
      miningBtc       = settled[11];
      marketCycle     = settled[12];
    } catch (e) {
      // partial data is fine
    }

    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // ── CSV: MEV Attacks ──────────────────────────────────────────────────────
    if (format === 'csv') {
      const headers = [
        'id','hash','attackType','riskScore','slippageLoss_ETH','gasPrice_Gwei',
        'timestamp','victimAddress','attackerAddress','targetProtocol',
        'network','source','blockNumber'
      ];
      const rows = attacks.map((a: any, idx: number) => {
        const gasGwei = a.gasPrice ? (parseFloat(a.gasPrice) / 1e9).toFixed(2) : '0.00';
        const target = a.transactionDetails?.to || a.protocol || 'Uniswap V2/V3';
        return [
          idx + 1, csvEscape(a.hash), csvEscape(a.attackType || 'other'),
          a.riskScore || 0, a.slippageLoss || 0, gasGwei,
          csvEscape(a.timestamp || new Date().toISOString()),
          csvEscape(a.victimAddress || a.transactionDetails?.from || ''),
          csvEscape(a.attackerAddress || ''), csvEscape(target),
          csvEscape(a.network || config.network), csvEscape(a.source || 'mempool'),
          a.blockNumber || ''
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="mev_attacks_${Date.now()}.csv"`);
      return res.send(csv);
    }

    // ── CSV: Crypto Listings (rich analytics) ─────────────────────────────────
    if (format === 'crypto_csv') {
      const headers = [
        'rank','name','symbol','slug','cmcRank','numMarketPairs',
        'price_USD','marketCap_USD','volume24h_USD',
        'percentChange1h','percentChange24h','percentChange7d','percentChange30d',
        'circulatingSupply','totalSupply','maxSupply',
        'fullyDilutedValuation','dominance_pct',
        'tags','dateAdded','lastUpdated'
      ];
      const totalMcap = marketMetrics?.totalMarketCap || 1;
      const rows = (cryptoListings || []).map((c: any, idx: number) => {
        const q = c.quote?.USD || {};
        const fdv = c.maxSupply ? q.price * c.maxSupply : '';
        const dominance = ((q.marketCap / totalMcap) * 100).toFixed(4);
        return [
          idx + 1, csvEscape(c.name), csvEscape(c.symbol), csvEscape(c.slug),
          c.cmcRank, c.numMarketPairs,
          (q.price || 0).toFixed(8), (q.marketCap || 0).toFixed(2),
          (q.volume24h || 0).toFixed(2),
          (q.percentChange1h || 0).toFixed(4), (q.percentChange24h || 0).toFixed(4),
          (q.percentChange7d || 0).toFixed(4), (q.percentChange30d || 0).toFixed(4),
          c.circulatingSupply || '', c.totalSupply || '', c.maxSupply || '',
          fdv !== '' ? Number(fdv).toFixed(2) : '',
          dominance,
          csvEscape((c.tags || []).join('|')),
          csvEscape(c.dateAdded), csvEscape(q.lastUpdated)
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="crypto_analytics_dataset_${Date.now()}.csv"`);
      return res.send(csv);
    }

    // ── CSV: DeFi & Gas & Stablecoin metrics ──────────────────────────────────
    if (format === 'defi_csv') {
      const defiHeaders = ['protocol','tvl_USD','rank','yield_pct','timestamp'];
      const defiRows = (defiMetrics || []).map((d: any) => [
        csvEscape(d.protocol), (d.tvl || 0).toFixed(2), d.rank,
        (d.yield || 0).toFixed(4), csvEscape(d.timestamp)
      ].join(','));

      const stableHeaders = ['name','symbol','marketCap_USD','pegStatus','issuanceRate','redemptionRate','timestamp'];
      const stableRows = (stablecoinData || []).map((s: any) => [
        csvEscape(s.name), csvEscape(s.symbol), (s.marketCap || 0).toFixed(2),
        (s.pegStatus || 1).toFixed(6), s.issuanceRate || 0, s.redemptionRate || 0,
        csvEscape(s.timestamp)
      ].join(','));

      const gasHeaders = ['network','baseFee_Gwei','priorityFee_Gwei','avgTxCost_USD','timestamp'];
      const gasRows = (gasFeeData || []).map((g: any) => [
        csvEscape(g.network), g.baseFee || 0, g.priorityFee || 0,
        (g.avgTxCost || 0).toFixed(4), csvEscape(g.timestamp)
      ].join(','));

      const csv = [
        '# DeFi Protocol TVL',
        defiHeaders.join(','),
        ...defiRows,
        '',
        '# Stablecoin Metrics',
        stableHeaders.join(','),
        ...stableRows,
        '',
        '# Gas Fee Data by Network',
        gasHeaders.join(','),
        ...gasRows,
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="defi_gas_stablecoin_dataset_${Date.now()}.csv"`);
      return res.send(csv);
    }

    // ── CSV: Full combined (all sections) ─────────────────────────────────────
    if (format === 'full_csv') {
      const totalMcap = marketMetrics?.totalMarketCap || 1;
      const cryptoHeaders = [
        'section','rank','name','symbol','price_USD','marketCap_USD','volume24h_USD',
        'pct1h','pct24h','pct7d','pct30d','circulatingSupply','maxSupply',
        'dominance_pct','fearGreedIndex','btcDominance','ethDominance','tags'
      ];
      const cryptoRows = (cryptoListings || []).map((c: any, idx: number) => {
        const q = c.quote?.USD || {};
        const dominance = ((q.marketCap / totalMcap) * 100).toFixed(4);
        return [
          'crypto', idx + 1, csvEscape(c.name), csvEscape(c.symbol),
          (q.price || 0).toFixed(8), (q.marketCap || 0).toFixed(2), (q.volume24h || 0).toFixed(2),
          (q.percentChange1h || 0).toFixed(4), (q.percentChange24h || 0).toFixed(4),
          (q.percentChange7d || 0).toFixed(4), (q.percentChange30d || 0).toFixed(4),
          c.circulatingSupply || '', c.maxSupply || '',
          dominance, fearGreedIndex || 50,
          (marketMetrics?.bitcoinDominance || 0).toFixed(2),
          (marketMetrics?.ethereumDominance || 0).toFixed(2),
          csvEscape((c.tags || []).join('|'))
        ].join(',');
      });

      const attackHeaders = [
        'section','id','hash','attackType','riskScore','slippageLoss_ETH',
        'gasPrice_Gwei','timestamp','network','blockNumber'
      ];
      const attackRows = attacks.map((a: any, idx: number) => {
        const gasGwei = a.gasPrice ? (parseFloat(a.gasPrice) / 1e9).toFixed(2) : '0.00';
        return [
          'mev_attack', idx + 1, csvEscape(a.hash), csvEscape(a.attackType || 'other'),
          a.riskScore || 0, a.slippageLoss || 0, gasGwei,
          csvEscape(a.timestamp || new Date().toISOString()),
          csvEscape(a.network || config.network), a.blockNumber || ''
        ].join(',');
      });

      const volatilityRows = (volatilityData || []).map((v: any) => [
        'volatility', '', '', csvEscape(v.symbol), '', '', '',
        csvEscape(v.period), v.volatility?.toFixed(4) || '', csvEscape(v.timestamp)
      ].join(','));

      const csv = [
        '# MEV Shield Full Analytics Dataset',
        `# Exported: ${new Date().toISOString()}`,
        '',
        '# SECTION: Cryptocurrency Market Data',
        cryptoHeaders.join(','),
        ...cryptoRows,
        '',
        '# SECTION: MEV Attack Events',
        attackHeaders.join(','),
        ...attackRows,
        '',
        '# SECTION: Volatility Metrics',
        'section,,,symbol,,,,period,volatility,timestamp',
        ...volatilityRows,
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="mev_shield_full_analytics_${Date.now()}.csv"`);
      return res.send(csv);
    }

    // ── JSON: Complete Dataset (all data, all features) ───────────────────────
    const totalMcap = marketMetrics?.totalMarketCap || 1;
    const enrichedListings = (cryptoListings || []).map((c: any, idx: number) => {
      const q = c.quote?.USD || {};
      return {
        rank: idx + 1,
        cmcRank: c.cmcRank,
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        slug: c.slug,
        // Pricing
        price_USD: q.price || 0,
        marketCap_USD: q.marketCap || 0,
        fullyDilutedValuation_USD: c.maxSupply ? (q.price || 0) * c.maxSupply : null,
        volume24h_USD: q.volume24h || 0,
        volumeToMarketCapRatio: q.marketCap ? ((q.volume24h || 0) / q.marketCap) : null,
        // Performance
        percentChange1h: q.percentChange1h || 0,
        percentChange24h: q.percentChange24h || 0,
        percentChange7d: q.percentChange7d || 0,
        percentChange30d: q.percentChange30d || 0,
        // Supply
        circulatingSupply: c.circulatingSupply || null,
        totalSupply: c.totalSupply || null,
        maxSupply: c.maxSupply || null,
        supplyRatio: c.maxSupply ? (c.circulatingSupply / c.maxSupply) : null,
        numMarketPairs: c.numMarketPairs,
        // Market share
        marketDominance_pct: ((q.marketCap || 0) / totalMcap * 100),
        // Metadata
        tags: c.tags || [],
        platform: c.platform,
        dateAdded: c.dateAdded,
        lastUpdated: q.lastUpdated,
      };
    });

    const completeDataset = {
      metadata: {
        datasetName: 'MEV Shield Crypto Analytics & MEV Dataset',
        description: 'Comprehensive cryptocurrency market dataset with pricing, supply, performance, DeFi, stablecoins, gas fees, on-chain metrics, whale activity, market cycle indicators, and MEV attack telemetry. Suitable for quantitative analysis, ML/AI training, and academic research.',
        exportedAt: new Date().toISOString(),
        network: config.network,
        version: '2.0.0',
        schema: {
          cryptocurrencies: '50 coins – price, market cap, volume, % changes (1h/24h/7d/30d), supply data, dominance, FDV, tags',
          globalMarket: 'Total market cap, volume, BTC/ETH dominance, DeFi & stablecoin metrics',
          fearGreedIndex: '0–100 sentiment index (0=extreme fear, 100=extreme greed)',
          volatility: 'Annualised volatility per coin per period',
          correlations: 'Pairwise Pearson correlations between major assets',
          gasFees: 'Base fee, priority fee, avg tx cost across EVM networks',
          defi: 'Protocol TVL rankings, yield, timestamp',
          stablecoins: 'Major stablecoin market caps and peg deviation',
          onChain: 'Active addresses, tx count, exchange flows',
          whaleActivity: 'Large tx count, whale wallet estimates, total whale volume',
          miningMetrics: 'Hash rate, difficulty, pool distribution for PoW coins',
          marketCycle: 'Bull/bear/accumulation/distribution phase classification with confidence',
          mevAttacks: 'All detected MEV events – sandwich, front-run, back-run; hashes, risk scores, slippage losses',
          mevSummary: 'Aggregate MEV statistics, attack type distribution, total ETH lost',
        },
        counts: {
          cryptocurrencies: enrichedListings.length,
          mevAttacks: attacks.length,
          defiProtocols: (defiMetrics || []).length,
          stablecoins: (stablecoinData || []).length,
          volatilityEntries: (volatilityData || []).length,
          correlationPairs: (correlationData || []).length,
          gasFeeNetworks: (gasFeeData || []).length,
        },
        systemStatus: {
          mempoolMonitoring: mempoolMonitor.isActive(),
          uptimeSeconds: Math.round(process.uptime()),
        },
      },

      // ── Global Market Overview ───────────────────────────────────────────────
      globalMarketMetrics: marketMetrics ? {
        ...marketMetrics,
        fearGreedIndex: fearGreedIndex,
        fearGreedLabel: fearGreedIndex >= 75 ? 'Extreme Greed'
          : fearGreedIndex >= 55 ? 'Greed'
          : fearGreedIndex >= 45 ? 'Neutral'
          : fearGreedIndex >= 25 ? 'Fear'
          : 'Extreme Fear',
        marketCycle: marketCycle,
      } : null,

      // ── Cryptocurrency Listings (feature-rich) ───────────────────────────────
      cryptocurrencies: enrichedListings,

      // ── Volatility & Correlation ─────────────────────────────────────────────
      volatilityMetrics: volatilityData || [],
      correlationMatrix: correlationData || [],

      // ── On-Chain & Blockchain Analytics ─────────────────────────────────────
      onChainMetrics: {
        ETH: onChainEth,
        BTC: onChainBtc,
      },

      // ── Whale Activity ───────────────────────────────────────────────────────
      whaleActivity: whaleData,

      // ── Mining / PoW Metrics ─────────────────────────────────────────────────
      miningMetrics: {
        BTC: miningBtc,
      },

      // ── Gas Fees across Networks ─────────────────────────────────────────────
      gasFeeData: gasFeeData || [],

      // ── DeFi Ecosystem ───────────────────────────────────────────────────────
      defiProtocols: defiMetrics || [],

      // ── Stablecoins ──────────────────────────────────────────────────────────
      stablecoins: stablecoinData || [],

      // ── MEV Attack Events ────────────────────────────────────────────────────
      mevSummaryStatistics: stats,
      mevAttacks: attacks,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mev_shield_analytics_dataset_v2_${Date.now()}.json"`);
    return res.json(completeDataset);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dataset/crypto-analytics
 * Purpose-built crypto analytics CSV for data science / ML / research
 * ?limit=50 - number of coins (default 50, max 100)
 */
router.get('/dataset/crypto-analytics', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const format = (req.query.format as string)?.toLowerCase() || 'csv';

    const [listings, globalMetrics, fearGreed, volatility, correlations, defi, stables, gas] = await Promise.allSettled([
      cryptoMarketService.getCryptocurrencyListings(limit),
      cryptoMarketService.getGlobalMetrics(),
      cryptoMarketService.getFearGreedIndex(),
      cryptoMarketService.getVolatilityData(['BTC','ETH','BNB','SOL','ADA','AVAX','MATIC','DOT','LINK','UNI']),
      cryptoMarketService.getCorrelationData(['BTC','ETH','BNB','SOL','ADA']),
      cryptoMarketService.getDeFiMetrics(),
      cryptoMarketService.getStablecoinData(),
      cryptoMarketService.getGasFeeData(),
    ]).then(r => r.map(x => x.status === 'fulfilled' ? x.value : null));

    const coins: any[] = (listings as any) || [];
    const metrics: any = globalMetrics as any;
    const fgi: number = (fearGreed as any) || 50;
    const vol: any[] = (volatility as any) || [];
    const totalMcap = metrics?.totalMarketCap || 1;

    // Build volatility lookup by symbol
    const volLookup: Record<string, number> = {};
    vol.forEach((v: any) => { if (v) volLookup[v.symbol] = v.volatility; });

    if (format === 'json') {
      const enriched = coins.map((c: any, idx: number) => {
        const q = c.quote?.USD || {};
        return {
          rank: idx + 1, name: c.name, symbol: c.symbol, slug: c.slug,
          price_USD: q.price, marketCap_USD: q.marketCap,
          volume24h_USD: q.volume24h, fullyDilutedValuation_USD: c.maxSupply ? q.price * c.maxSupply : null,
          pct1h: q.percentChange1h, pct24h: q.percentChange24h,
          pct7d: q.percentChange7d, pct30d: q.percentChange30d,
          circulatingSupply: c.circulatingSupply, totalSupply: c.totalSupply, maxSupply: c.maxSupply,
          supplyRatio: c.maxSupply ? c.circulatingSupply / c.maxSupply : null,
          marketDominance_pct: (q.marketCap / totalMcap) * 100,
          volumeToMarketCapRatio: q.marketCap ? q.volume24h / q.marketCap : null,
          volatility_annualised: volLookup[c.symbol] || null,
          fearGreedIndex: fgi,
          btcDominance_pct: metrics?.bitcoinDominance,
          ethDominance_pct: metrics?.ethereumDominance,
          totalMarketCap_USD: metrics?.totalMarketCap,
          defiMarketCap_USD: metrics?.defiMarketCap,
          stablecoinMarketCap_USD: metrics?.stablecoinMarketCap,
          numMarketPairs: c.numMarketPairs,
          tags: c.tags, dateAdded: c.dateAdded, lastUpdated: q.lastUpdated,
        };
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="crypto_analytics_${Date.now()}.json"`);
      return res.json({ metadata: { exportedAt: new Date().toISOString(), count: enriched.length, fearGreedIndex: fgi, globalMarketCap_USD: metrics?.totalMarketCap }, cryptocurrencies: enriched, volatilityMetrics: vol, correlationPairs: correlations, defiProtocols: defi, stablecoins: stables, gasFees: gas });
    }

    // Default: flat CSV with all analytics features per coin
    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'rank','name','symbol','slug',
      'price_USD','marketCap_USD','volume24h_USD','fullyDilutedValuation_USD',
      'pct_change_1h','pct_change_24h','pct_change_7d','pct_change_30d',
      'circulatingSupply','totalSupply','maxSupply','supplyRatio',
      'marketDominance_pct','volumeToMarketCapRatio',
      'volatility_annualised',
      'fearGreedIndex','fearGreedLabel',
      'btcDominance_pct','ethDominance_pct',
      'totalMarketCap_USD','defiMarketCap_USD','stablecoinMarketCap_USD',
      'numMarketPairs','tags','dateAdded','lastUpdated'
    ];

    const fgiLabel = fgi >= 75 ? 'Extreme Greed' : fgi >= 55 ? 'Greed' : fgi >= 45 ? 'Neutral' : fgi >= 25 ? 'Fear' : 'Extreme Fear';

    const rows = coins.map((c: any, idx: number) => {
      const q = c.quote?.USD || {};
      const supplyRatio = c.maxSupply ? (c.circulatingSupply / c.maxSupply).toFixed(6) : '';
      const fdv = c.maxSupply ? (q.price * c.maxSupply).toFixed(2) : '';
      const dominance = ((q.marketCap / totalMcap) * 100).toFixed(6);
      const vtmr = q.marketCap ? (q.volume24h / q.marketCap).toFixed(6) : '';
      const vol24 = volLookup[c.symbol] ? volLookup[c.symbol].toFixed(6) : '';

      return [
        idx + 1, csvEscape(c.name), csvEscape(c.symbol), csvEscape(c.slug),
        (q.price || 0).toFixed(8), (q.marketCap || 0).toFixed(2), (q.volume24h || 0).toFixed(2), fdv,
        (q.percentChange1h || 0).toFixed(6), (q.percentChange24h || 0).toFixed(6),
        (q.percentChange7d || 0).toFixed(6), (q.percentChange30d || 0).toFixed(6),
        c.circulatingSupply || '', c.totalSupply || '', c.maxSupply || '', supplyRatio,
        dominance, vtmr, vol24,
        fgi, csvEscape(fgiLabel),
        (metrics?.bitcoinDominance || 0).toFixed(4), (metrics?.ethereumDominance || 0).toFixed(4),
        (metrics?.totalMarketCap || 0).toFixed(2), (metrics?.defiMarketCap || 0).toFixed(2), (metrics?.stablecoinMarketCap || 0).toFixed(2),
        c.numMarketPairs || '',
        csvEscape((c.tags || []).join('|')),
        csvEscape(c.dateAdded), csvEscape(q.lastUpdated)
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="crypto_analytics_dataset_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

/**
 * GET /api/what-was-built
 * Return the contents of WHAT_WAS_BUILT.txt for display in the frontend
 */
router.get('/what-was-built', (req: Request, res: Response) => {
  try {
    const filePath = path.resolve(__dirname, '../../../WHAT_WAS_BUILT.txt');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'WHAT_WAS_BUILT.txt not found' });
    }

    const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
    // Return as plain text (frontend will render/format it)
    res.type('text/plain').send(content);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/attacks/trigger-mock
 * Trigger a synthetic attack event (for testing & frontend development)
 */
router.post('/attacks/trigger-mock', (req: Request, res: Response) => {
  try {
    const attack = {
      id: `mock-${Date.now()}`,
      hash: `0x${Math.random().toString(16).slice(2, 12)}`,
      attackType: req.body.attackType || 'sandwich',
      riskScore: req.body.riskScore || Math.floor(50 + Math.random() * 50),
      slippageLoss: req.body.slippageLoss || parseFloat((Math.random() * 5).toFixed(4)),
      gasPrice: req.body.gasPrice || 120,
      from: req.body.from || '0x' + Math.random().toString(16).slice(2, 42),
      to: req.body.to || '0x' + Math.random().toString(16).slice(2, 42),
      timestamp: Date.now(),
      meta: { mocked: true },
    };

    try {
      const mempoolMonitor = require('../services/mempoolMonitor').default;
      // Add to mempool monitor
      mempoolMonitor.addMockAttack(attack);
      
      // Also emit to alchemyMempoolListener if it's active
      if (mempoolMonitor.isActive()) {
        const alchemyMempoolListener = require('../services/alchemyMempoolListener').default;
        alchemyMempoolListener.detectedAttacks.push(attack);
        alchemyMempoolListener.emit('attack-detected', attack);
      }
    } catch (e) {
      console.warn('Could not add mock attack to mempoolMonitor:', e);
    }

    res.json({ success: true, data: attack, message: 'Mock attack triggered' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/slippage/recommendation', (req: Request, res: Response) => {
  try {
    const { pools, volatility, trade } = req.body || {};

    const parsedPools: DexPoolSnapshot[] = Array.isArray(pools)
      ? pools
          .map((pool: any) => ({
            address: typeof pool?.address === 'string' ? pool.address : 'unknown',
            baseAsset: typeof pool?.baseAsset === 'string' ? pool.baseAsset : '',
            quoteAsset: typeof pool?.quoteAsset === 'string' ? pool.quoteAsset : '',
            baseReserve: Number(pool?.baseReserve ?? 0),
            quoteReserve: Number(pool?.quoteReserve ?? 0),
            feeBps: pool?.feeBps !== undefined ? Number(pool.feeBps) : undefined,
            lastUpdated: Number(pool?.lastUpdated ?? Math.floor(Date.now() / 1000)),
          }))
          .filter(
            (pool: DexPoolSnapshot) =>
              pool.address.length > 0 &&
              pool.baseAsset.length > 0 &&
              pool.quoteAsset.length > 0 &&
              Number.isFinite(pool.baseReserve) &&
              Number.isFinite(pool.quoteReserve) &&
              pool.baseReserve >= 0 &&
              pool.quoteReserve >= 0
          )
      : [];

    const parsedVolatility: PoolVolatilitySample[] = Array.isArray(volatility)
      ? volatility
          .map((sample: any) => ({
            timestamp: Number(sample?.timestamp ?? Math.floor(Date.now() / 1000)),
            price: Number(sample?.price ?? 0),
          }))
          .filter(
            (sample: PoolVolatilitySample) =>
              Number.isFinite(sample.timestamp) &&
              Number.isFinite(sample.price) &&
              sample.timestamp > 0 &&
              sample.price > 0
          )
      : [];

    const tradeIntent: TradeIntent | null =
      trade && typeof trade === 'object'
        ? {
            tokenIn: String(trade.tokenIn || ''),
            tokenOut: String(trade.tokenOut || ''),
            amountIn: Number(trade.amountIn ?? 0),
            side: trade.side === 'sell' ? 'sell' : 'buy',
          }
        : null;

    if (!tradeIntent || !tradeIntent.tokenIn || !tradeIntent.tokenOut || !Number.isFinite(tradeIntent.amountIn)) {
      return res.status(400).json({ success: false, error: 'Valid trade intent is required.' });
    }

    const recommendation: SlippageRecommendation = mevDetector.recommendSlippageSettings(
      parsedPools,
      parsedVolatility,
      tradeIntent
    );

    res.json({
      success: true,
      data: {
        recommendation,
        metadata: {
          poolsAnalyzed: parsedPools.length,
          volatilitySamples: parsedVolatility.length,
          tradeIntent,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/simulate', async (req: Request, res: Response) => {
  try {
  const { from, to, value, gasPrice, gasLimit, data, network } = req.body;

    // Build a mock transaction object compatible with mevDetector
    const mockTx = {
      hash: `0x${Math.random().toString(16).slice(2, 18)}`,
      from: from || '0x' + Math.random().toString(16).slice(2, 42),
      to: to || '0x' + Math.random().toString(16).slice(2, 42),
      value: value ? (BigInt(Math.floor(parseFloat(value) * 1e18))).toString() : '0',
      gasPrice: gasPrice ? (BigInt(Math.floor(parseFloat(gasPrice) * 1e9))).toString() : '50000000000',
      gasLimit: gasLimit || '21000',
      nonce: 0,
      blockNumber: 0,
      timestamp: Math.floor(Date.now() / 1000),
      data: data || '0x',
    };

    // Get current mempool stats if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mempoolMonitor = require('../services/mempoolMonitor').default;
    const pending = mempoolMonitor.isActive() ? mempoolMonitor.getAttackStatistics().totalDetected : 0;

    const context = {
      pendingTransactions: pending,
      detectedPattern: 'other',
      network: network || 'sepolia',
    };

    const analysis = mevDetector.analyzeTransaction(mockTx, context);

    // Get Flashbots protection simulation estimate
    const flashbotsService = require('../services/flashbotsService').default;
    const protection = await flashbotsService.simulateProtection({ value: mockTx.value, gasPrice: mockTx.gasPrice, gasLimit: mockTx.gasLimit });

    // Estimate MEV profit roughly as fraction of slippage
    const mevProfit = parseFloat((analysis.slippageLoss * (0.1 + Math.random() * 0.4)).toFixed(4));

    res.json({
      success: true,
      data: {
        analysis,
        mevProfit,
        protection,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/weekly
 * Return a mock weekly trend report (attacks over time) for email/in-app
 */
router.get('/reports/weekly', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const ts = now - (6 - i) * 24 * 60 * 60 * 1000;
      return {
        day: new Date(ts).toISOString().slice(0, 10),
        attacks: Math.floor(Math.random() * 50),
        avgRisk: Math.floor(Math.random() * 60),
        totalSlippage: parseFloat((Math.random() * 200).toFixed(2)),
      };
    });

    res.json({ success: true, data: { days, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/crypto/global-metrics
 * Get global cryptocurrency market metrics
 */
router.get('/crypto/global-metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await cryptoMarketService.getGlobalMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/listings
 * Get cryptocurrency listings with filters
 */
router.get('/crypto/listings', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const sort = (req.query.sort as string) || 'market_cap';
    const sortDir = (req.query.sort_dir as string) || 'desc';
    
    const listings = await cryptoMarketService.getCryptocurrencyListings(limit, sort, sortDir);
    
    res.json({
      success: true,
      data: listings,
      count: listings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/historical
 * Get historical data for a cryptocurrency
 */
router.get('/crypto/historical', async (req: Request, res: Response) => {
  try {
    const { symbol, time_start, time_end, interval } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }
    
    const timeStart = (time_start as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days ago
    const timeEnd = (time_end as string) || new Date().toISOString();
    const intervalStr = (interval as string) || 'daily';
    
    const historicalData = await cryptoMarketService.getHistoricalData(
      symbol.toUpperCase(),
      timeStart,
      timeEnd,
      intervalStr
    );
    
    res.json({
      success: true,
      data: historicalData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/indicators
 * Get technical indicators for a cryptocurrency
 */
router.get('/crypto/indicators', async (req: Request, res: Response) => {
  try {
    const { symbol, indicator, period } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }
    
    if (!indicator || typeof indicator !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'indicator is required',
      });
    }
    
    const indicators = await cryptoMarketService.getTechnicalIndicators(
      symbol.toUpperCase(),
      indicator,
      period ? parseInt(period as string) : undefined
    );
    
    res.json({
      success: true,
      data: indicators,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/trending
 * Get trending cryptocurrencies
 */
router.get('/crypto/trending', async (req: Request, res: Response) => {
  try {
    const coin = (req.query.coin as string) || '';
    const trending = await cryptoMarketService.getTrendingCoins(coin);
    
    res.json({
      success: true,
      data: trending,
      count: trending.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/fear-greed
 * Get Fear & Greed Index
 */
router.get('/crypto/fear-greed', async (req: Request, res: Response) => {
  try {
    const index = await cryptoMarketService.getFearGreedIndex();
    
    res.json({
      success: true,
      data: {
        index,
        label: index >= 90 ? 'Extreme Greed' : 
              index >= 75 ? 'Greed' : 
              index >= 50 ? 'Neutral' : 
              index >= 25 ? 'Fear' : 
              'Extreme Fear',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/etf-flows
 * Get ETF flow data
 */
router.get('/crypto/etf-flows', async (req: Request, res: Response) => {
  try {
    const etfData = await cryptoMarketService.getETFData();
    
    res.json({
      success: true,
      data: etfData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/gas-fees
 * Get gas fee data for different networks
 */
router.get('/crypto/gas-fees', async (req: Request, res: Response) => {
  try {
    const gasFeeData = await cryptoMarketService.getGasFeeData();
    
    res.json({
      success: true,
      data: gasFeeData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/volatility
 * Get volatility data for specified cryptocurrencies
 */
router.get('/crypto/volatility', async (req: Request, res: Response) => {
  try {
    const symbols = (req.query.symbols as string)?.split(',') || ['BTC', 'ETH'];
    const volatilityData = await cryptoMarketService.getVolatilityData(symbols);
    
    res.json({
      success: true,
      data: volatilityData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/correlations
 * Get correlation data for specified assets
 */
router.get('/crypto/correlations', async (req: Request, res: Response) => {
  try {
    const assets = (req.query.assets as string)?.split(',') || ['BTC', 'ETH', 'SOL'];
    const correlationData = await cryptoMarketService.getCorrelationData(assets);
    
    res.json({
      success: true,
      data: correlationData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/market-cycle
 * Get market cycle data
 */
router.get('/crypto/market-cycle', async (req: Request, res: Response) => {
  try {
    const marketCycleData = await cryptoMarketService.getMarketCycleData();
    
    res.json({
      success: true,
      data: marketCycleData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/on-chain
 * Get on-chain analytics data for a specific cryptocurrency
 */
router.get('/crypto/on-chain', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    const onChainData = await cryptoMarketService.getOnChainData(symbol.toUpperCase());
    
    res.json({
      success: true,
      data: onChainData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/whale-activity
 * Get whale activity data for a specific cryptocurrency
 */
router.get('/crypto/whale-activity', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    const whaleActivityData = await cryptoMarketService.getWhaleActivityData(symbol.toUpperCase());
    
    res.json({
      success: true,
      data: whaleActivityData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/stablecoins
 * Get stablecoin data
 */
router.get('/crypto/stablecoins', async (req: Request, res: Response) => {
  try {
    const stablecoinData = await cryptoMarketService.getStablecoinData();
    
    res.json({
      success: true,
      data: stablecoinData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/defi-metrics
 * Get DeFi metrics
 */
router.get('/crypto/defi-metrics', async (req: Request, res: Response) => {
  try {
    const defiMetrics = await cryptoMarketService.getDeFiMetrics();
    
    res.json({
      success: true,
      data: defiMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/mining-metrics
 * Get mining metrics for a specific cryptocurrency
 */
router.get('/crypto/mining-metrics', async (req: Request, res: Response) => {
  try {
    const coin = (req.query.coin as string) || 'BTC';
    const miningMetrics = await cryptoMarketService.getMiningMetrics(coin.toUpperCase());
    
    res.json({
      success: true,
      data: miningMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});