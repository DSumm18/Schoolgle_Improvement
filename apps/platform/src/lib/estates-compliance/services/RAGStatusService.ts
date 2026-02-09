/**
 * RAGStatusService - Calculate Red/Amber/Green compliance status
 *
 * This service aggregates data from various sources to determine
 * the overall compliance status and per-domain status.
 */

import { TaskService } from './TaskService';
import { AssetService } from './AssetService';
import { HelpdeskService } from './HelpdeskService';
import type { ComplianceDomain } from '@/types/estates-compliance';

/**
 * Status level for RAG reporting
 */
export type RAGStatus = 'red' | 'amber' | 'green';

/**
 * Domain-specific status
 */
export interface DomainStatus {
  domain: ComplianceDomain;
  status: RAGStatus;
  score: number;
  issues: string[];
  lastUpdated: string;
}

/**
 * Overall RAG status
 */
export interface RAGReport {
  overall: RAGStatus;
  overallScore: number;
  domains: DomainStatus[];
  summary: {
    totalDomains: number;
    redDomains: number;
    amberDomains: number;
    greenDomains: number;
  };
  generatedAt: string;
}

/**
 * Service class for calculating RAG status
 */
export class RAGStatusService {
  /**
   * Calculate the RAG score for a specific domain
   */
  static async calculateDomainStatus(
    organizationId: string,
    domain: ComplianceDomain
  ): Promise<DomainStatus> {
    const issues: string[] = [];
    let score = 100;

    // Get tasks for this domain
    const tasksResult = await TaskService.list(organizationId, { domain }, { page: 1, pageSize: 1000 });

    // Deduct points for overdue tasks
    const overdueTasks = tasksResult.data.filter(t => {
      if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false;
      return new Date(t.due_date) < new Date();
    });

    if (overdueTasks.length > 0) {
      score -= overdueTasks.length * 10;
      issues.push(`${overdueTasks.length} overdue task(s)`);
    }

    // Deduct points for pending high-priority tasks
    const pendingCriticalTasks = tasksResult.data.filter(
      t => t.status === 'pending' && t.priority === 'critical'
    );

    if (pendingCriticalTasks.length > 0) {
      score -= pendingCriticalTasks.length * 5;
      issues.push(`${pendingCriticalTasks.length} pending critical task(s)`);
    }

    // Get assets for this domain
    const assetsResult = await AssetService.list(organizationId, { compliance_domains: [domain] }, { page: 1, pageSize: 1000 });

    // Check for assets requiring inspection
    const needsInspection = assetsResult.data.filter(a => a.status === 'requires_inspection');

    if (needsInspection.length > 0) {
      score -= needsInspection.length * 5;
      issues.push(`${needsInspection.length} asset(s) require inspection`);
    }

    // Get open helpdesk tickets for this domain
    const ticketsResult = await HelpdeskService.list(organizationId, { status: 'open' }, { page: 1, pageSize: 1000 });
    const domainTickets = ticketsResult.data.filter(t => t.category === domain);

    if (domainTickets.length > 5) {
      score -= (domainTickets.length - 5) * 2;
      issues.push(`${domainTickets.length} open helpdesk ticket(s)`);
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine status based on score
    let status: RAGStatus;
    if (score >= 85) {
      status = 'green';
    } else if (score >= 60) {
      status = 'amber';
    } else {
      status = 'red';
    }

    return {
      domain,
      status,
      score,
      issues,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate the overall RAG status for an organization
   */
  static async calculateOverallStatus(organizationId: string): Promise<RAGReport> {
    const domains: ComplianceDomain[] = [
      'legionella',
      'fire',
      'asbestos',
      'electrical',
      'gas',
      'water',
      'mechanical',
    ];

    const domainStatuses = await Promise.all(
      domains.map(domain => this.calculateDomainStatus(organizationId, domain))
    );

    // Calculate overall score (average of all domains)
    const totalScore = domainStatuses.reduce((sum, d) => sum + d.score, 0);
    const overallScore = Math.round(totalScore / domainStatuses.length);

    // Determine overall status
    let overall: RAGStatus;
    if (overallScore >= 85) {
      overall = 'green';
    } else if (overallScore >= 60) {
      overall = 'amber';
    } else {
      overall = 'red';
    }

    const summary = {
      totalDomains: domainStatuses.length,
      redDomains: domainStatuses.filter(d => d.status === 'red').length,
      amberDomains: domainStatuses.filter(d => d.status === 'amber').length,
      greenDomains: domainStatuses.filter(d => d.status === 'green').length,
    };

    return {
      overall,
      overallScore,
      domains: domainStatuses,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get a simplified RAG status for quick display
   */
  static async getQuickStatus(organizationId: string): Promise<{
    overall: RAGStatus;
    score: number;
    domains: Array<{ name: string; status: RAGStatus }>;
  }> {
    const fullReport = await this.calculateOverallStatus(organizationId);

    return {
      overall: fullReport.overall,
      score: fullReport.overallScore,
      domains: fullReport.domains.map(d => ({
        name: d.domain,
        status: d.status,
      })),
    };
  }

  /**
   * Check if a domain requires attention
   */
  static async requiresAttention(organizationId: string, domain: ComplianceDomain): Promise<boolean> {
    const status = await this.calculateDomainStatus(organizationId, domain);
    return status.status !== 'green';
  }

  /**
   * Get all domains that require attention
   */
  static async getDomainsRequiringAttention(organizationId: string): Promise<ComplianceDomain[]> {
    const report = await this.calculateOverallStatus(organizationId);

    return report.domains
      .filter(d => d.status !== 'green')
      .map(d => d.domain);
  }
}
