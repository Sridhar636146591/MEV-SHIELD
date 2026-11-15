/**
 * MEV-Optimized Trade Router
 * Finds optimal trading paths while minimizing MEV risk
 */

import { BigNumberish } from 'ethers';

export interface TradeRoute {
  path: string[];
  dexes: string[];
  expectedOutput: bigint;
  priceImpact: number;
  gasCost: bigint;
  mevRisk: number;
  splitRatio?: number[];
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

export interface DexPool {
  address: string;
  token0: Token;
  token1: Token;
  reserve0: bigint;
  reserve1: bigint;
  fee: number;
}

class TradeRouter {
  private pools: DexPool[] = [];
  
  // Major DEX addresses
  private readonly DEX_ROUTERS = {
    UNISWAP_V2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNISWAP_V3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    SUSHISWAP: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    CURVE: '0x8e96B7c2696364ac18Bd0b58D8DA9C0e0E2b2e1e',
    BALANCER: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  };

  /**
   * Find optimal route for a trade
   */
  async findOptimalRoute(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint,
    maxHops: number = 3
  ): Promise<TradeRoute[]> {
    const routes: TradeRoute[] = [];

    // Direct routes
    const directRoutes = await this.findDirectRoutes(tokenIn, tokenOut, amountIn);
    routes.push(...directRoutes);

    // Multi-hop routes
    if (maxHops > 1) {
      const multiHopRoutes = await this.findMultiHopRoutes(
        tokenIn,
        tokenOut,
        amountIn,
        maxHops
      );
      routes.push(...multiHopRoutes);
    }

    // Split routes (divide trade across multiple paths)
    const splitRoutes = await this.findSplitRoutes(
      tokenIn,
      tokenOut,
      amountIn,
      routes
    );
    routes.push(...splitRoutes);

    // Sort by best output considering gas and MEV risk
    return routes.sort((a, b) => {
      const scoreA = this.calculateRouteScore(a);
      const scoreB = this.calculateRouteScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Find direct trading routes
   */
  private async findDirectRoutes(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint
  ): Promise<TradeRoute[]> {
    const routes: TradeRoute[] = [];

    for (const [dexName, dexAddress] of Object.entries(this.DEX_ROUTERS)) {
      const pool = this.findPool(dexAddress, tokenIn, tokenOut);
      
      if (pool) {
        const output = this.calculateOutput(amountIn, pool);
        const priceImpact = this.calculatePriceImpact(amountIn, output, pool);
        const gasEstimate = this.estimateGas(dexName);
        const mevRisk = this.calculateMEVRisk(dexName, amountIn, priceImpact);

        routes.push({
          path: [tokenIn.address, tokenOut.address],
          dexes: [dexName],
          expectedOutput: output,
          priceImpact,
          gasCost: gasEstimate,
          mevRisk,
        });
      }
    }

    return routes;
  }

  /**
   * Find multi-hop routes through intermediate tokens
   */
  private async findMultiHopRoutes(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint,
    maxHops: number
  ): Promise<TradeRoute[]> {
    const routes: TradeRoute[] = [];
    const intermediateTokens = this.getCommonIntermediaries(tokenIn, tokenOut);

    for (const intermediate of intermediateTokens.slice(0, 5)) {
      const firstHop = await this.findDirectRoutes(tokenIn, intermediate, amountIn);
      
      for (const route1 of firstHop) {
        const secondHop = await this.findDirectRoutes(
          intermediate,
          tokenOut,
          route1.expectedOutput
        );

        for (const route2 of secondHop) {
          routes.push({
            path: [...route1.path, ...route2.path.slice(1)],
            dexes: [...route1.dexes, ...route2.dexes],
            expectedOutput: route2.expectedOutput,
            priceImpact: route1.priceImpact + route2.priceImpact,
            gasCost: route1.gasCost + route2.gasCost,
            mevRisk: Math.max(route1.mevRisk, route2.mevRisk),
          });
        }
      }
    }

    return routes;
  }

  /**
   * Find split routes (divide trade across multiple paths)
   */
  private async findSplitRoutes(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint,
    baseRoutes: TradeRoute[]
  ): Promise<TradeRoute[]> {
    const splitRoutes: TradeRoute[] = [];
    
    // Try splitting across top 2 routes
    const topRoutes = baseRoutes.slice(0, 2);
    if (topRoutes.length >= 2) {
      const splits = [0.3, 0.4, 0.5, 0.6, 0.7];
      
      for (const split of splits) {
        const amount1 = (amountIn * BigInt(Math.floor(split * 100))) / 100n;
        const amount2 = amountIn - amount1;

        const output1 = await this.calculateOutputForRoute(topRoutes[0], amount1);
        const output2 = await this.calculateOutputForRoute(topRoutes[1], amount2);

        splitRoutes.push({
          path: topRoutes[0].path,
          dexes: topRoutes[0].dexes,
          expectedOutput: output1 + output2,
          priceImpact: (topRoutes[0].priceImpact + topRoutes[1].priceImpact) / 2,
          gasCost: topRoutes[0].gasCost + topRoutes[1].gasCost,
          mevRisk: Math.min(topRoutes[0].mevRisk, topRoutes[1].mevRisk),
          splitRatio: [split, 1 - split],
        });
      }
    }

    return splitRoutes;
  }

  /**
   * Calculate route score (higher is better)
   */
  private calculateRouteScore(route: TradeRoute): number {
    const outputWeight = 0.5;
    const gasWeight = 0.2;
    const mevWeight = 0.3;

    const outputScore = parseFloat(route.expectedOutput.toString());
    const gasScore = 1 / parseFloat(route.gasCost.toString());
    const mevScore = 100 - route.mevRisk;

    return outputScore * outputWeight + gasScore * gasWeight + mevScore * mevWeight;
  }

  /**
   * Calculate MEV risk for a route
   */
  private calculateMEVRisk(
    dexName: string,
    amountIn: bigint,
    priceImpact: number
  ): number {
    let risk = 0;

    // Larger trades have higher MEV risk
    const amountInEth = parseFloat(amountIn.toString()) / 1e18;
    if (amountInEth > 10) risk += 20;
    if (amountInEth > 50) risk += 30;
    if (amountInEth > 100) risk += 50;

    // Higher price impact = more MEV risk
    if (priceImpact > 1) risk += 20;
    if (priceImpact > 3) risk += 30;
    if (priceImpact > 5) risk += 50;

    // Some DEXes are more MEV-prone
    const dexRiskMultiplier: Record<string, number> = {
      UNISWAP_V2: 1.2,
      UNISWAP_V3: 1.0,
      SUSHISWAP: 1.1,
      CURVE: 0.8,
      BALANCER: 0.9,
    };

    risk *= dexRiskMultiplier[dexName] || 1.0;

    return Math.min(risk, 100);
  }

  /**
   * Estimate gas cost for a DEX
   */
  private estimateGas(dexName: string): bigint {
    const gasEstimates: Record<string, number> = {
      UNISWAP_V2: 150000,
      UNISWAP_V3: 180000,
      SUSHISWAP: 150000,
      CURVE: 200000,
      BALANCER: 250000,
    };

    const gasPrice = 50000000000n; // 50 Gwei
    return BigInt(gasEstimates[dexName] || 0) * gasPrice;
  }

  /**
   * Calculate output amount for a pool
   */
  private calculateOutput(amountIn: bigint, pool: DexPool): bigint {
    const feeMultiplier = 1 - pool.fee;
    const amountInWithFee = (amountIn * BigInt(Math.floor(feeMultiplier * 1000))) / 1000n;
    
    // Constant product formula: x * y = k
    const numerator = amountInWithFee * pool.reserve1;
    const denominator = pool.reserve0 + amountInWithFee;
    
    return numerator / denominator;
  }

  /**
   * Calculate price impact
   */
  private calculatePriceImpact(
    amountIn: bigint,
    amountOut: bigint,
    pool: DexPool
  ): number {
    const spotPrice = Number(pool.reserve0) / Number(pool.reserve1);
    const executionPrice = Number(amountIn) / Number(amountOut);
    
    const impact = Math.abs((executionPrice - spotPrice) / spotPrice) * 100;

    return impact;
  }

  /**
   * Find pool for a DEX
   */
  private findPool(dexAddress: string, tokenIn: Token, tokenOut: Token): DexPool | null {
    return this.pools.find(
      pool => 
        pool.address === dexAddress &&
        ((pool.token0.address === tokenIn.address && pool.token1.address === tokenOut.address) ||
         (pool.token0.address === tokenOut.address && pool.token1.address === tokenIn.address))
    ) || null;
  }

  /**
   * Get common intermediary tokens
   */
  private getCommonIntermediaries(tokenIn: Token, tokenOut: Token): Token[] {
    const commonTokens: Token[] = [
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        decimals: 18,
      },
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
      },
      {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        decimals: 6,
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        decimals: 18,
      },
    ];

    return commonTokens.filter(
      t => t.address !== tokenIn.address && t.address !== tokenOut.address
    );
  }

  /**
   * Calculate output for a specific route
   */
  private async calculateOutputForRoute(
    route: TradeRoute,
    amountIn: bigint
  ): Promise<bigint> {
    // Simplified calculation
    const feeAdjustment = route.priceImpact / 100;
    const adjustedAmount = (amountIn * BigInt(100 - Math.floor(feeAdjustment * 100))) / 100n;
    return adjustedAmount;
  }

  /**
   * Add pool to router
   */
  addPool(pool: DexPool): void {
    this.pools.push(pool);
  }

  /**
   * TWAP execution strategy
   */
  generateTWAPStrategy(
    totalAmount: bigint,
    durationHours: number,
    currentRoute: TradeRoute
  ): Array<{ time: Date; amount: bigint }> {
    const slices = Math.max(durationHours, 4); // At least 4 slices
    const sliceAmount = totalAmount / BigInt(slices);
    const intervalMs = (durationHours * 60 * 60 * 1000) / slices;
    
    const schedule: Array<{ time: Date; amount: bigint }> = [];
    const now = new Date();

    for (let i = 0; i < slices; i++) {
      schedule.push({
        time: new Date(now.getTime() + i * intervalMs),
        amount: sliceAmount,
      });
    }

    return schedule;
  }
}

export default new TradeRouter();
