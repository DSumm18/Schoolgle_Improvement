// ============================================================================
// TEACHER ANALYTICS
// Data processing and analytics for teacher dashboard
// ============================================================================

import {
  PupilProfile,
  SkillSnapshot,
  QuestRun,
  TeacherJudgement,
  ClassHeatmap,
  PupilProgress,
} from '../types';

// ============================================================================
// PUPIL CARDS
// ============================================================================

export interface PupilCard {
  pupilId: string;
  pupilName?: string;
  strengths: string[];
  misconceptions: string[];
  nextSteps: string[];
  scaffoldRecommendation: string;
  evidenceCoverage: number;
  lastQuestDate?: Date;
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

export function generatePupilCard(
  pupilProfile: PupilProfile,
  skillSnapshots: SkillSnapshot[],
  questRuns: QuestRun[]
): PupilCard {
  // Get skills with data
  const skillsWithData = skillSnapshots.filter((s) => s.confidence !== 'insufficient_data');

  // Identify strengths (high confidence, good scores)
  const strengths = skillsWithData
    .filter((s) => s.confidence === 'high' && (s.concept_score || 0) >= 80)
    .map((s) => formatSkillName(s.skill));

  // Identify misconceptions
  const misconceptions = skillsWithData
    .flatMap((s) => s.misconceptions)
    .filter((m, i, arr) => arr.indexOf(m) === i); // Unique

  // Calculate next steps based on weak areas
  const weakAreas = skillsWithData.filter(
    (s) => (s.concept_score || 0) < 60 || s.transfer_gap === true
  );
  const nextSteps = weakAreas.map((s) => {
    const scaffold = recommendScaffold(s, pupilProfile);
    return `Work on ${formatSkillName(s.skill)} (${scaffold})`;
  });

  // Recommend scaffold based on performance
  const scaffoldRecommendation = recommendOverallScaffold(pupilProfile, questRuns);

  // Calculate evidence coverage
  const totalSkills = skillSnapshots.length;
  const skillsWithEvidence = skillSnapshots.filter((s) => s.evidence_coverage >= 70).length;
  const evidenceCoverage = totalSkills > 0 ? (skillsWithEvidence / totalSkills) * 100 : 0;

  // Calculate average score
  const avgScore =
    questRuns.length > 0
      ? questRuns.reduce((sum, run) => sum + run.total_score, 0) / questRuns.length
      : 0;

  // Determine trend
  const recentScores = questRuns.slice(-5).map((r) => r.total_score);
  const trend = calculateTrend(recentScores);

  // Last quest date
  const lastQuestDate = questRuns.length > 0 ? questRuns[questRuns.length - 1].completed_at : undefined;

  return {
    pupilId: pupilProfile.id,
    pupilName: pupilProfile.display_name,
    strengths,
    misconceptions,
    nextSteps,
    scaffoldRecommendation,
    evidenceCoverage,
    lastQuestDate,
    averageScore: Math.round(avgScore),
    trend,
  };
}

// ============================================================================
// CLASS HEATMAP
// ============================================================================

export function generateClassHeatmap(
  pupilProfiles: PupilProfile[],
  skillSnapshots: SkillSnapshot[]
): ClassHeatmap {
  const pupils = pupilProfiles.map((profile) => {
    const pupilSkills = skillSnapshots.filter((s) => s.pupil_id === profile.id);
    const totalScore =
      pupilSkills.length > 0
        ? pupilSkills.reduce((sum, s) => sum + (s.concept_score || 0), 0) / pupilSkills.length
        : 0;

    return {
      pupil_id: profile.id,
      pupil_name: profile.display_name,
      skills: pupilSkills,
      last_quest: undefined,
      total_quests_completed: 0,
      average_score: Math.round(totalScore),
    };
  });

  // Get unique skills
  const skills = Array.from(
    new Set(skillSnapshots.map((s) => s.skill))
  ).sort();

  // Create data matrix
  const data: Record<string, number> = {};
  skillSnapshots.forEach((snapshot) => {
    const key = `${snapshot.pupil_id}_${snapshot.skill}`;
    data[key] = snapshot.concept_score || 0;
  });

  return {
    pupils,
    skills,
    data,
  };
}

// ============================================================================
// EVIDENCE COVERAGE WARNINGS
// ============================================================================

export interface EvidenceWarning {
  type: 'pupil' | 'skill' | 'cohort';
  message: string;
  severity: 'low' | 'medium' | 'high';
  affectedEntities: string[];
  suggestedAction: string;
}

export function generateEvidenceWarnings(
  pupilProfiles: PupilProfile[],
  skillSnapshots: SkillSnapshot[],
  questRuns: QuestRun[]
): EvidenceWarning[] {
  const warnings: EvidenceWarning[] = [];

  // Check pupils with insufficient evidence
  const pupilsWithLowCoverage = pupilProfiles.filter((profile) => {
    const pupilSnapshots = skillSnapshots.filter((s) => s.pupil_id === profile.id);
    const avgCoverage =
      pupilSnapshots.length > 0
        ? pupilSnapshots.reduce((sum, s) => sum + s.evidence_coverage, 0) / pupilSnapshots.length
        : 0;
    return avgCoverage < 50;
  });

  if (pupilsWithLowCoverage.length > 0) {
    warnings.push({
      type: 'pupil',
      message: `${pupilsWithLowCoverage.length} pupil(s) with insufficient evidence (< 50% coverage)`,
      severity: 'high',
      affectedEntities: pupilsWithLowCoverage.map((p) => p.display_name || p.id),
      suggestedAction: 'Assign quests to increase evidence coverage',
    });
  }

  // Check skills with low data
  const skillCoverage = new Map<string, { total: number; withEvidence: number }>();
  skillSnapshots.forEach((snapshot) => {
    const current = skillCoverage.get(snapshot.skill) || { total: 0, withEvidence: 0 };
    current.total++;
    if (snapshot.evidence_coverage >= 70) {
      current.withEvidence++;
    }
    skillCoverage.set(snapshot.skill, current);
  });

  skillCoverage.forEach((coverage, skill) => {
    const percentage = (coverage.withEvidence / coverage.total) * 100;
    if (percentage < 50) {
      warnings.push({
        type: 'skill',
        message: `${formatSkillName(skill)} - Low evidence coverage (${Math.round(percentage)}%)`,
        severity: 'medium',
        affectedEntities: [skill],
        suggestedAction: 'Assign quests targeting this skill',
      });
    }
  });

  // Check SEND cohort
  const sendPupils = pupilProfiles.filter((p) => p.send_status !== 'none');
  if (sendPupils.length > 0) {
    const sendSnapshots = skillSnapshots.filter((s) =>
      sendPupils.some((p) => p.id === s.pupil_id)
    );
    const avgSendCoverage =
      sendSnapshots.length > 0
        ? sendSnapshots.reduce((sum, s) => sum + s.evidence_coverage, 0) / sendSnapshots.length
        : 0;

    if (avgSendCoverage < 50) {
      warnings.push({
        type: 'cohort',
        message: `SEND cohort has low evidence coverage (${Math.round(avgSendCoverage)}%)`,
        severity: 'high',
        affectedEntities: ['SEND'],
        suggestedAction: 'Ensure SEND pupils are engaged with appropriate quests',
      });
    }
  }

  // Check EAL cohort
  const ealPupils = pupilProfiles.filter((p) => p.eal_status);
  if (ealPupils.length > 0) {
    const ealSnapshots = skillSnapshots.filter((s) =>
      ealPupils.some((p) => p.id === s.pupil_id)
    );
    const avgEalCoverage =
      ealSnapshots.length > 0
        ? ealSnapshots.reduce((sum, s) => sum + s.evidence_coverage, 0) / ealSnapshots.length
        : 0;

    if (avgEalCoverage < 50) {
      warnings.push({
        type: 'cohort',
        message: `EAL cohort has low evidence coverage (${Math.round(avgEalCoverage)}%)`,
        severity: 'medium',
        affectedEntities: ['EAL'],
        suggestedAction: 'Consider language-lite scaffolds for EAL pupils',
      });
    }
  }

  return warnings;
}

// ============================================================================
// CALIBRATION DATA
// ============================================================================

export interface CalibrationEntry {
  pupilId: string;
  pupilName?: string;
  teacherJudgement: string;
  schoolgleAssessment: string;
  moderation?: string;
  status: 'agreement' | 'calibration_required' | 'moderated';
  skill: string;
  confidence: string;
}

export function generateCalibrationData(
  teacherJudgements: TeacherJudgement[],
  skillSnapshots: SkillSnapshot[],
  pupilProfiles: PupilProfile[]
): CalibrationEntry[] {
  const entries: CalibrationEntry[] = [];

  teacherJudgements.forEach((judgement) => {
    const pupil = pupilProfiles.find((p) => p.id === judgement.pupil_id);
    const skillKey = `${judgement.subject.toLowerCase()}_${judgement.topic.toLowerCase()}_${judgement.skill.toLowerCase()}`;
    const snapshot = skillSnapshots.find((s) => s.pupil_id === judgement.pupil_id && s.skill === skillKey);

    if (snapshot && snapshot.confidence !== 'insufficient_data') {
      const schoolgleScore = snapshot.concept_score || 0;
      const schoolgleJudgement = scoreToJudgement(schoolgleScore);

      const status =
        judgement.judgement === schoolgleJudgement ? 'agreement' : 'calibration_required';

      entries.push({
        pupilId: judgement.pupil_id,
        pupilName: pupil?.display_name,
        teacherJudgement: judgement.judgement,
        schoolgleAssessment: schoolgleJudgement,
        status,
        skill: judgement.skill,
        confidence: snapshot.confidence,
      });
    }
  });

  return entries;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatSkillName(skill: string): string {
  return skill
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function recommendScaffold(snapshot: SkillSnapshot, profile: PupilProfile): string {
  if (profile.send_status !== 'none') {
    return 'Try visual-first or motor-friendly';
  }
  if (profile.eal_status) {
    return 'Try language-lite scaffold';
  }
  if (snapshot.trend === 'declining') {
    return 'Consider step-by-step scaffold';
  }
  return 'Standard scaffold appropriate';
}

function recommendOverallScaffold(profile: PupilProfile, questRuns: QuestRun[]): string {
  const recentScaffolds = questRuns.slice(-5).map((r) => r.scaffold_used);
  const avgScore =
    questRuns.length > 0
      ? questRuns.reduce((sum, r) => sum + r.total_score, 0) / questRuns.length
      : 100;

  if (profile.send_status !== 'none') {
    return 'visual_first';
  }
  if (profile.eal_status) {
    return 'language_lite';
  }
  if (avgScore < 60) {
    return 'step_by_step';
  }
  if (avgScore > 85) {
    return 'stretch';
  }
  return 'standard';
}

function calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (scores.length < 3) return 'unknown';

  const recent = scores.slice(-3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const older = scores.slice(0, -3);
  const avgOlder = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : avgRecent;

  if (avgRecent > avgOlder + 10) return 'improving';
  if (avgRecent < avgOlder - 10) return 'declining';
  return 'stable';
}

function scoreToJudgement(score: number): string {
  if (score >= 85) return 'stretch';
  if (score >= 70) return 'secure';
  if (score >= 50) return 'developing';
  return 'emerging';
}
