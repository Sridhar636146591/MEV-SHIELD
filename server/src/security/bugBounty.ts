/**
 * Bug Bounty Program Configuration
 * Security vulnerability reporting and rewards
 */

export interface BugTier {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reward: number;
  description: string;
}

export interface BugReport {
  id: string;
  reporter: string;
  title: string;
  description: string;
  severity: BugTier['severity'];
  status: 'submitted' | 'triaging' | 'confirmed' | 'fixed' | 'paid';
  submittedAt: Date;
  bountyAmount?: number;
}

class BugBountyProgram {
  private tiers: BugTier[] = [
    {
      name: 'Critical',
      severity: 'critical',
      reward: 100000,
      description: 'Remote code execution, smart contract exploits, fund theft',
    },
    {
      name: 'High',
      severity: 'high',
      reward: 25000,
      description: 'Privilege escalation, data breaches, DoS attacks',
    },
    {
      name: 'Medium',
      severity: 'medium',
      reward: 5000,
      description: 'XSS, CSRF, authentication bypass',
    },
    {
      name: 'Low',
      severity: 'low',
      reward: 1000,
      description: 'Information disclosure, minor bugs, UI issues',
    },
  ];

  private reports: Map<string, BugReport> = new Map();
  private totalPool: number = 500000; // $500K total pool
  private paidOut: number = 0;

  /**
   * Submit a bug report
   */
  submitReport(
    reporter: string,
    title: string,
    description: string,
    severity: BugTier['severity']
  ): BugReport {
    const id = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: BugReport = {
      id,
      reporter,
      title,
      description,
      severity,
      status: 'submitted',
      submittedAt: new Date(),
    };

    this.reports.set(id, report);
    return report;
  }

  /**
   * Triage bug report
   */
  triageReport(reportId: string, newSeverity: BugTier['severity']): void {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

    report.severity = newSeverity;
    report.status = 'triaging';
  }

  /**
   * Confirm bug and assign bounty
   */
  confirmReport(reportId: string): void {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

    const tier = this.tiers.find(t => t.severity === report.severity);
    if (!tier) throw new Error('Invalid severity');

    report.status = 'confirmed';
    report.bountyAmount = tier.reward;
  }

  /**
   * Mark bug as fixed and pay bounty
   */
  resolveAndPay(reportId: string): void {
    const report = this.reports.get(reportId);
    if (!report || !report.bountyAmount) throw new Error('Report not found');

    if (this.paidOut + report.bountyAmount > this.totalPool) {
      throw new Error('Insufficient bounty pool');
    }

    report.status = 'paid';
    this.paidOut += report.bountyAmount;
    
    // In production: initiate crypto payment to reporter
    console.log(`Paying ${report.bountyAmount} USDC to ${report.reporter}`);
  }

  /**
   * Get program statistics
   */
  getStats(): object {
    return {
      totalPool: this.totalPool,
      paidOut: this.paidOut,
      remaining: this.totalPool - this.paidOut,
      totalReports: this.reports.size,
      byStatus: {
        submitted: Array.from(this.reports.values()).filter(r => r.status === 'submitted').length,
        triaging: Array.from(this.reports.values()).filter(r => r.status === 'triaging').length,
        confirmed: Array.from(this.reports.values()).filter(r => r.status === 'confirmed').length,
        fixed: Array.from(this.reports.values()).filter(r => r.status === 'fixed').length,
        paid: Array.from(this.reports.values()).filter(r => r.status === 'paid').length,
      },
      bySeverity: {
        critical: Array.from(this.reports.values()).filter(r => r.severity === 'critical').length,
        high: Array.from(this.reports.values()).filter(r => r.severity === 'high').length,
        medium: Array.from(this.reports.values()).filter(r => r.severity === 'medium').length,
        low: Array.from(this.reports.values()).filter(r => r.severity === 'low').length,
      },
    };
  }

  /**
   * Get all tiers
   */
  getTiers(): BugTier[] {
    return this.tiers;
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): BugReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get reports by reporter
   */
  getReportsByReporter(reporter: string): BugReport[] {
    return Array.from(this.reports.values()).filter(r => r.reporter === reporter);
  }
}

export default new BugBountyProgram();
