/**
 * Telegram Bot for MEV Detector
 * Provides real-time alerts and commands via Telegram
 */

import { Telegraf, Context } from 'telegraf';

interface MEVDContext extends Context {
  session?: {
    userId: string;
    preferences: UserPreferences;
  };
}

interface UserPreferences {
  alertThreshold: number;
  trackedAddresses: string[];
  notificationsEnabled: boolean;
}

class MEVTelegramBot {
  private bot: Telegraf<MEVDContext>;
  private userSessions: Map<string, UserPreferences> = new Map();

  constructor(token: string) {
    this.bot = new Telegraf<MEVDContext>(token);
    this.initializeCommands();
    this.initializeHandlers();
  }

  /**
   * Initialize bot commands
   */
  private initializeCommands() {
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        '👋 Welcome to MEV Detector Bot!\n\n' +
        'I can help you:\n' +
        '• Check transaction risk /check <txHash>\n' +
        '• Set price alerts /alert <token>\n' +
        '• View mempool stats /status\n' +
        '• Protect transactions /protect\n' +
        '• View leaderboard /leaderboard\n' +
        '• Get help /help\n\n' +
        'Let\'s protect your trades from MEV! 🛡️'
      );
    });

    this.bot.command('check', async (ctx) => {
      const txHash = ctx.message?.text.split(' ')[1];
      
      if (!txHash) {
        await ctx.reply('❌ Please provide a transaction hash\nUsage: /check <txHash>');
        return;
      }

      await ctx.reply('🔍 Analyzing transaction...');
      
      try {
        // Call backend API to analyze transaction
        const analysis = await this.analyzeTransaction(txHash);
        
        const riskEmoji = analysis.riskScore > 70 ? '🔴' : analysis.riskScore > 40 ? '🟡' : '🟢';
        
        await ctx.reply(
          `${riskEmoji} Transaction Analysis\n\n` +
          `Hash: \`${txHash}\`\n` +
          `Risk Score: ${analysis.riskScore}%\n` +
          `Attack Type: ${analysis.attackType || 'None'}\n` +
          `Slippage Impact: ${analysis.slippageImpact} ETH\n\n` +
          `Recommendation: ${analysis.recommendation}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await ctx.reply('❌ Error analyzing transaction. Please try again.');
      }
    });

    this.bot.command('alert', async (ctx) => {
      const parts = ctx.message?.text.split(' ');
      const token = parts?.[1];
      const threshold = parts?.[2];

      if (!token) {
        await ctx.reply('❌ Usage: /alert <TOKEN> [threshold]\nExample: /alert ETH 5');
        return;
      }

      const prefs = this.getUserPreferences(ctx.from?.id.toString() || 'default');
      prefs.trackedAddresses.push(token.toUpperCase());
      prefs.alertThreshold = threshold ? parseFloat(threshold) : 5;
      
      this.saveUserPreferences(ctx.from?.id.toString() || 'default', prefs);
      
      await ctx.reply(`✅ Alert set for ${token.toUpperCase()}\nWill notify when price changes by ${prefs.alertThreshold}%`);
    });

    this.bot.command('status', async (ctx) => {
      try {
        const stats = await this.getMempoolStats();
        
        await ctx.reply(
          '📊 Mempool Status\n\n' +
          `Pending Transactions: ${stats.pendingTxCount.toLocaleString()}\n` +
          `Gas Price: ${stats.gasPrice} Gwei\n` +
          `Network Congestion: ${stats.congestionLevel}\n\n` +
          `Active MEV Bots: ${stats.activeBots}\n` +
          `Attacks Detected (24h): ${stats.attacksDetected}`
        );
      } catch (error) {
        await ctx.reply('❌ Error fetching status');
      }
    });

    this.bot.command('protect', async (ctx) => {
      await ctx.reply(
        '🛡️ Flashbots Protection\n\n' +
        'To protect your transaction:\n\n' +
        '1. Use our RPC endpoint:\n' +
        '`https://rpc.mevdetector.com/flashbots`\n\n' +
        '2. Or use the web interface:\n' +
        'https://mevdetector.com/protect\n\n' +
        'Your transaction will be sent privately, avoiding MEV bots! ✅'
      );
    });

    this.bot.command('leaderboard', async (ctx) => {
      const leaderboard = await this.getLeaderboard();
      
      let message = '🏆 Top MEV Detectors (Weekly)\n\n';
      leaderboard.topDetectors.slice(0, 5).forEach((user: { username: string; points: number }, i: number) => {
        message += `${i + 1}. ${user.username} - ${user.points} pts\n`;
      });
      
      await ctx.reply(message);
    });

    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '📖 MEV Detector Bot Help\n\n' +
        'Available Commands:\n' +
        '/start - Start the bot\n' +
        '/check <txHash> - Analyze transaction risk\n' +
        '/alert <TOKEN> - Set price alert\n' +
        '/status - View mempool statistics\n' +
        '/protect - Get Flashbots protection info\n' +
        '/leaderboard - View community rankings\n' +
        '/help - Show this help message\n\n' +
        'Need more help? Visit https://mevdetector.com/support'
      );
    });
  }

  /**
   * Initialize message handlers
   */
  private initializeHandlers() {
    // Handle text messages
    this.bot.on('text', async (ctx) => {
      const text = ctx.message?.text;
      
      // Auto-detect transaction hashes
      if (text?.match(/0x[a-fA-F0-9]{64}/)) {
        const txHash = text.match(/0x[a-fA-F0-9]{64}/)?.[0];
        await ctx.reply('🔍 I detected a transaction hash. Use /check to analyze it:');
        await ctx.reply(`/check ${txHash}`);
      }
    });

    // Handle inline queries (commented out due to type issues)
    // this.bot.on('inline_query', async (ctx) => {
    //   const query = ctx.inlineQuery.query;
    //   
    //   const match = query.match(/0x[a-fA-F0-9]{64}/);
    //   if (match) {
    //     const txHash = match[0];
    //     const analysis = await this.analyzeTransaction(txHash);
    //     
    //     await ctx.answerInlineQuery([
    //       {
    //         type: 'article',
    //         id: txHash,
    //         title: `MEV Risk: ${analysis.riskScore}%`,
    //         description: analysis.recommendation,
    //       },
    //     ]);
    //   }
    // });
  }

  /**
   * Analyze transaction (calls backend API)
   */
  private async analyzeTransaction(txHash: string): Promise<any> {
    // Simulated API call
    return {
      riskScore: Math.floor(Math.random() * 100),
      attackType: Math.random() > 0.5 ? 'SANDWICH' : null,
      slippageImpact: (Math.random() * 2).toFixed(4),
      recommendation: Math.random() > 0.5 
        ? 'HIGH RISK: Use Flashbots Protect' 
        : 'Low risk, proceed with caution',
    };
  }

  /**
   * Get mempool statistics
   */
  private async getMempoolStats(): Promise<any> {
    // Simulated stats
    return {
      pendingTxCount: 152847,
      gasPrice: 45,
      congestionLevel: 'High',
      activeBots: 234,
      attacksDetected: 1247,
    };
  }

  /**
   * Get leaderboard data
   */
  private async getLeaderboard(): Promise<any> {
    return {
      topDetectors: [
        { username: '@crypto_whale', points: 15420 },
        { username: '@defi_hunter', points: 12350 },
        { username: '@mev_slayer', points: 10890 },
        { username: '@alpha_seeker', points: 9540 },
        { username: '@block_watcher', points: 8720 },
      ],
    };
  }

  /**
   * Get user preferences
   */
  private getUserPreferences(userId: string): UserPreferences {
    return this.userSessions.get(userId) || {
      alertThreshold: 5,
      trackedAddresses: [],
      notificationsEnabled: true,
    };
  }

  /**
   * Save user preferences
   */
  private saveUserPreferences(userId: string, prefs: UserPreferences): void {
    this.userSessions.set(userId, prefs);
  }

  /**
   * Format analysis message
   */
  private formatAnalysisMessage(txHash: string, analysis: any): string {
    const riskEmoji = analysis.riskScore > 70 ? '🔴' : analysis.riskScore > 40 ? '🟡' : '🟢';
    
    return (
      `${riskEmoji} MEV Analysis for Transaction\n\n` +
      `Hash: ${txHash}\n` +
      `Risk Score: ${analysis.riskScore}%\n` +
      `Attack Type: ${analysis.attackType || 'None'}\n` +
      `Slippage: ${analysis.slippageImpact} ETH\n\n` +
      `💡 ${analysis.recommendation}`
    );
  }

  /**
   * Send push notification to user
   */
  async sendNotification(userId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(userId, message);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Start the bot
   */
  launch(): void {
    this.bot.launch();
    console.log('🤖 Telegram bot started');

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  /**
   * Stop the bot
   */
  stop(): void {
    this.bot.stop('Manual stop');
    console.log('Telegram bot stopped');
  }
}

// Export singleton instance
export default MEVTelegramBot;
