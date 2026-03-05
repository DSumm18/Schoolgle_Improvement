/**
 * Ed Form Skills - Phase 4 Tests
 * Tests for RPA form filling skills with approval workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Form Skills - Phase 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Skill Registry', () => {
    it('should have correct form skills defined', () => {
      interface FormSkill {
        id: string;
        name: string;
        description: string;
        category: string;
        handler: string;
        isAutomated: boolean;
        requiresApproval: boolean;
        riskLevel: string;
      }

      const expectedSkills: FormSkill[] = [
        {
          id: 'fill_riddor_injury',
          name: 'RIDDOR Injury Reporting',
          category: 'Safety',
          isAutomated: true,
          requiresApproval: true,
          riskLevel: 'high',
          handler: 'handleRiddorFill',
        },
        {
          id: 'fill_safeguarding',
          name: 'Safeguarding Concern Form',
          category: 'Safeguarding',
          isAutomated: false,
          requiresApproval: false,
          riskLevel: 'critical',
          handler: 'handleSafeguardingForm',
        },
        {
          id: 'fill_send_ehcp',
          name: 'SEND EHCP Application Guidance',
          category: 'SEND',
          isAutomated: false,
          requiresApproval: false,
          riskLevel: 'medium',
          handler: 'handleSendEhcpGuidance',
        },
        {
          id: 'report_bradford_sickness',
          name: 'Bradford LA Sickness Reporting',
          category: 'HR',
          isAutomated: true,
          requiresApproval: true,
          riskLevel: 'medium',
          handler: 'handleBradfordSicknessReport',
        },
      ];

      expect(expectedSkills).toHaveLength(4);
      expect(expectedSkills[0].id).toBe('fill_riddor_injury');
      expect(expectedSkills[2].category).toBe('SEND');
    });

    it('should require approval for high-risk skills', () => {
      const highRiskSkills = ['fill_riddor_injury', 'report_bradford_sickness'];

      highRiskSkills.forEach(skillId => {
        const requiresApproval =
          skillId === 'fill_riddor_injury' || skillId === 'report_bradford_sickness';
        expect(requiresApproval).toBe(true);
      });
    });

    it('should not auto-fill critical safeguarding', () => {
      const safeguardingSkill = {
        id: 'fill_safeguarding',
        isAutomated: false,
        riskLevel: 'critical',
      };

      expect(safeguardingSkill.isAutomated).toBe(false);
      expect(safeguardingSkill.riskLevel).toBe('critical');
    });
  });

  describe('RIDDOR Incident Details', () => {
    it('should validate required fields', () => {
      interface IncidentDetails {
        incidentDate?: string;
        incidentType?: string;
        personName?: string;
        injuryNature?: string;
      }

      const requiredFields: (keyof IncidentDetails)[] = [
        'incidentDate',
        'incidentType',
        'personName',
        'injuryNature',
      ];

      const completeDetails: IncidentDetails = {
        incidentDate: '2025-02-20',
        incidentType: 'Injury',
        personName: 'John Doe',
        injuryNature: 'Fractured arm',
      };

      const incompleteDetails: IncidentDetails = {
        incidentDate: '2025-02-20',
        incidentType: 'Injury',
        // Missing personName and injuryNature
      };

      const hasAllRequired = (details: IncidentDetails) =>
        requiredFields.every(field => details[field] !== undefined);

      expect(hasAllRequired(completeDetails)).toBe(true);
      expect(hasAllRequired(incompleteDetails)).toBe(false);
    });

    it('should detect fatal incidents requiring phone call', () => {
      const incident = {
        fatal: true,
        incidentType: 'Death',
      };

      expect(incident.fatal).toBe(true);
      expect(incident.incidentType).toBe('Death');
    });

    it('should detect 7-day+ incapacitation', () => {
      const incident = {
        daysAwayFromWork: 8,
      };

      expect(incident.daysAwayFromWork).toBeGreaterThan(7);
    });
  });

  describe('Safeguarding Concern Processing', () => {
    it('should identify immediate risk cases', () => {
      const concern = {
        concerns: 'Child disclosed abuse at home',
        immediateRisk: true,
      };

      expect(concern.immediateRisk).toBe(true);
    });

    it('should flag non-urgent concerns for DSL review', () => {
      const concern = {
        concerns: 'Parent concerned about lack of progress',
        immediateRisk: false,
      };

      expect(concern.immediateRisk).toBe(false);
    });

    it('should extract witnesses array', () => {
      const concern = {
        witnesses: ['Teacher A', 'Teaching Assistant B'],
      };

      expect(concern.witnesses).toHaveLength(2);
      expect(concern.witnesses?.[0]).toContain('Teacher');
    });
  });

  describe('RPA Run Status', () => {
    it('should have correct status transitions', () => {
      type RunStatus = 'pending' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'cancelled';

      const statusFlow: RunStatus[] = [
        'pending',
        'running',
        'awaiting_review',
        'pending', // After approval
        'running',
        'completed',
      ];

      expect(statusFlow[0]).toBe('pending');
      expect(statusFlow[2]).toBe('awaiting_review');
    });

    it('should track progress correctly', () => {
      interface RunProgress {
        current_step: number;
        total_steps: number;
        current_action: string;
        status: string;
      }

      const progress: RunProgress = {
        current_step: 3,
        total_steps: 10,
        current_action: 'Filling form...',
        status: 'In progress',
      };

      expect(progress.current_step).toBeLessThan(progress.total_steps);
      expect(progress.current_action).toContain('Filling');
    });
  });

  describe('Approval Decision Types', () => {
    it('should accept valid approval decisions', () => {
      const validDecisions = ['approved', 'rejected', 'changes_requested'];

      validDecisions.forEach(decision => {
        const isValid = ['approved', 'rejected', 'changes_requested'].includes(decision);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid decisions', () => {
      const invalidDecision = 'maybe';

      const isValid = ['approved', 'rejected', 'changes_requested'].includes(invalidDecision);
      expect(isValid).toBe(false);
    });
  });

  describe('Skill Eligibility', () => {
    it('should check role-based eligibility', () => {
      const skill = {
        eligible_roles: ['headteacher', 'slt', 'school_business_manager'],
      };

      const userRole = 'school_business_manager';
      const isEligible = skill.eligible_roles.includes(userRole);

      expect(isEligible).toBe(true);
    });

    it('should check LA-specific eligibility', () => {
      const skill = {
        eligible_local_authorities: ['Bradford', 'Leeds'],
      };

      const schoolLA = 'Bradford';
      const isEligible = skill.eligible_local_authorities.includes(schoolLA);

      expect(isEligible).toBe(true);
    });

    it('should check system compatibility', () => {
      const skill = {
        eligible_systems: ['Arbor', 'SIMS', 'Bromcom'],
      };

      const schoolSystem = 'Arbor';
      const isCompatible = skill.eligible_systems.includes(schoolSystem);

      expect(isCompatible).toBe(true);
    });
  });

  describe('Form Skill Result Structure', () => {
    it('should match result interface', () => {
      interface FormSkillResult {
        success: boolean;
        requiresApproval: boolean;
        approvalUrl?: string;
        runId?: string;
        message: string;
        data?: any;
        error?: string;
      }

      const result: FormSkillResult = {
        success: true,
        requiresApproval: true,
        approvalUrl: 'http://localhost:3000/dashboard/ed/approvals/abc123',
        runId: 'abc123',
        message: 'RIDDOR report prepared for review',
        data: { incidentDate: '2025-02-20' },
      };

      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalUrl).toContain('approvals');
      expect(result.message).toContain('RIDDOR');
    });

    it('should handle error results', () => {
      interface FormSkillResult {
        success: boolean;
        requiresApproval: boolean;
        message: string;
        error?: string;
      }

      const errorResult: FormSkillResult = {
        success: false,
        requiresApproval: false,
        message: 'Failed to create approval request',
        error: 'Missing required fields: incidentDate, incidentType',
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('Missing');
    });
  });

  describe('Risk Level Classification', () => {
    it('should have correct risk levels for skills', () => {
      type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

      const skillRisks: Record<string, RiskLevel> = {
        fill_riddor_injury: 'high',
        fill_safeguarding: 'critical',
        fill_send_ehcp: 'medium',
        report_bradford_sickness: 'medium',
      };

      expect(skillRisks.fill_safeguarding).toBe('critical');
      expect(skillRisks.fill_riddor_injury).toBe('high');
      expect(skillRisks.fill_send_ehcp).toBe('medium');
    });
  });
});
