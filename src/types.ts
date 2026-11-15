export type RuleCategory = 'FACT' | 'TONE' | 'COMP' | 'IDENTITY' | 'VISUAL' | 'ASSET';

export type NavSection =
  | 'dashboard'
  | 'scanner'
  | 'knowledge'
  | 'approval'
  | 'analytics';

export type UserRole =
  | 'Content Creator'
  | 'Brand Reviewer'
  | 'Compliance Manager';

export interface BrandRule {
  id: string;
  code: string;
  category: RuleCategory;
  title: string;
  description: string;
  enabled: boolean;
  keywords?: string[];
  replacementHint?: string;
}

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface Violation {
  id: string;
  ruleCode: string;
  ruleTitle: string;
  severity: Severity;
  offendingPhrase: string;
  explanation: string;
  suggestedFix: string;
  isHumanEdited?: boolean;
  status: 'open' | 'fixed' | 'overridden';
  fixedAt?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action:
    | 'FLAGGED'
    | 'FIXED'
    | 'HUMAN_EDITED_FIX'
    | 'OVERRIDDEN'
    | 'RULE_ADDED'
    | 'SCAN_COMPLETED'
    | 'CHANGES_REQUESTED'
    | 'APPROVED';
  ruleCode: string;
  detail: string;
  beforeSnippet?: string;
  afterSnippet?: string;
}

export interface ReviewerComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface QueuedSubmission {
  id: string;
  title: string;
  submittedAt: string;
  originalDraft: string;
  finalDraft: string;
  initialScore: number;
  finalScore: number;
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
  resolvedViolations: Violation[];
  auditTrail: AuditEvent[];
  status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'PUBLISHED';
  publishedAt?: string;
  comments?: ReviewerComment[];
}
