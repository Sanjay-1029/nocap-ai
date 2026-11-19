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
  | 'Compliance Admin';

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

export interface ViolationOccurrence {
  start: number;
  end: number;
  matchedText: string;
  lineNumber: number;
  contextSnippet: string;
}

export interface VisualAsset {
  id: string;
  name: string;
  mimeType: string;
  format: string;
  sizeBytes: number;
  width: number;
  height: number;
  dataUrl: string;
  base64Data: string;
  dominantColors: string[];
  avgLuminance: number;
  contrastRatioEstimate: number;
}

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
  /** Distinguishes text manuscript findings from multimodal Gemini Vision / visual audits */
  source?: 'TEXT' | 'VISUAL';
  /** Specific visual element reference for VISUAL findings */
  visualElement?: string;
  /** Sampled hex palette swatches associated with a visual finding */
  detectedColors?: string[];
  /** All indexed span occurrences across body paragraphs, headings, lists, and tables */
  occurrences: ViolationOccurrence[];
  /** Total number of matching occurrences indexed in the document */
  occurrenceCount: number;
  /** Distinct surface strings matched across the document (longest-first for safe global replacement) */
  matchedPhrases?: string[];
  /** Number of spans replaced when remediated */
  appliedReplacementCount?: number;
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
    | 'APPROVED'
    | 'WEBHOOK_DISPATCHED';
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

export interface WebhookDispatchLog {
  id: string;
  dispatchedAtUtc: string;
  mode: 'LIVE' | 'SIMULATED';
  endpointUrl: string;
  releaseToken: string;
  certificateId: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  requestPayload: Record<string, unknown>;
  responseBody: string;
  success: boolean;
}

export interface WebhookConfig {
  endpointUrl: string;
  secretHeaderName: string;
  autoIncludeVisualHash: boolean;
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
  approvedByRole?: UserRole;
  releaseToken?: string;
  webhookLogs?: WebhookDispatchLog[];
  comments?: ReviewerComment[];
  visualAsset?: VisualAsset | null;
}

export interface ComplianceCertificateData {
  certificateId: string;
  issuedAtUtc: string;
  platform: string;
  documentTitle: string;
  verificationEngine: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
  cryptographicProof: {
    algorithm: 'SHA-256';
    originalDraftSha256: string;
    remediatedDraftSha256: string;
    visualAssetSha256?: string;
    certificateDigestSha256: string;
  };
  trustScore: {
    initialScore: number;
    finalScore: number;
    improvementDelta: number;
    complianceStatus: 'VERIFIED_COMPLIANT' | 'APPROVED_AND_PUBLISHED' | 'AUDIT_COMPLETED';
  };
  visualAudit?: {
    included: boolean;
    assetName: string;
    format: string;
    dimensions: string;
    fileSizeBytes: number;
    dominantColors: string[];
    findingsCount: number;
    remediatedCount: number;
  };
  activeRulesEvaluated: {
    code: string;
    category: RuleCategory;
    title: string;
    description: string;
  }[];
  violationsRemediated: {
    ruleCode: string;
    ruleTitle: string;
    source: 'TEXT' | 'VISUAL';
    visualElement?: string;
    severity: Severity;
    occurrenceCount: number;
    lines: number[];
    before: string;
    after: string;
    resolutionType: 'AI_FIX' | 'HUMAN_EDITED_FIX' | 'HUMAN_OVERRIDDEN';
  }[];
  approvalWorkflow: {
    stage: string;
    status: string;
    signerRole: UserRole;
    signedOffAtUtc: string | null;
    reviewerComments: ReviewerComment[];
    auditEventCount: number;
  };
}

export interface WorkspaceSnapshot {
  version: number;
  updatedAt: string;
  updatedByTabId: string;
  rules: BrandRule[];
  draftTitle: string;
  originalBaselineDraft: string;
  draftText: string;
  violations: Violation[];
  initialScanScore: number;
  auditTrail: AuditEvent[];
  submissions: QueuedSubmission[];
  webhookConfig: WebhookConfig;
}
