import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Upload,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  ArrowRight,
  FileText,
  UserCheck,
  Image as ImageIcon,
  Cloud,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { RoleModal } from './components/RoleModal';
import { ConveyorScannerOverlay } from './components/ConveyorScannerOverlay';
import { TruthSheetPanel } from './components/TruthSheetPanel';
import { DraftEditor } from './components/DraftEditor';
import { ViolationPanel } from './components/ViolationPanel';
import { ApprovalQueue } from './components/ApprovalQueue';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import {
  INITIAL_RULES,
  SAMPLE_BAD_DRAFT,
  runDeterministicScan,
  verifyDraftContent,
  calculateTrustScore,
  applyViolationFixToDraft,
  reIndexViolationsInDraft,
} from './utils/verifier';
import {
  buildComplianceCertificate,
  downloadAuditCertificateJson,
  downloadAuditCertificatePdf,
} from './utils/auditCertificate';
import {
  parseAndValidateVisualFile,
  createSampleMarketingBannerAsset,
  runDeterministicVisualAudit,
  verifyVisualContent,
} from './utils/visualAuditor';
import {
  loadLocalWorkspaceSnapshot,
  fetchCloudWorkspaceSnapshot,
  persistAndBroadcastWorkspace,
  clearAndBroadcastWorkspaceReset,
  subscribeToWorkspaceSync,
  getSyncStatusInfo,
} from './utils/workspaceSync';
import { generateReleaseToken } from './utils/webhookGate';
import { extractTextFromFile } from './utils/fileParser';
import {
  BrandRule,
  Violation,
  AuditEvent,
  QueuedSubmission,
  NavSection,
  UserRole,
  VisualAsset,
  WebhookConfig,
  WebhookDispatchLog,
  WorkspaceSnapshot,
} from './types';

const STORAGE_KEY_API = 'nocap_ai_gemini_api_key';

const INITIAL_SAMPLE_QUEUE_ITEM: QueuedSubmission = {
  id: 'sub-demo-01',
  title: 'Q3 Enterprise Observability Security Advisory',
  submittedAt: 'Today, 14:20 UTC',
  originalDraft:
    'CloudPulse v4.0 delivers 100% guaranteed uptime for financial workloads at just $29/mo — lowkey insane performance.',
  finalDraft:
    'CloudPulse v4.2 delivers 99.95% SLA-backed uptime for financial workloads at just $49/month — engineered for mission-critical enterprise workloads.',
  initialScore: 28,
  finalScore: 100,
  engineUsed: 'Built-in Deterministic Engine',
  resolvedViolations: [
    {
      id: 'hist-1',
      ruleCode: 'FACT-01',
      ruleTitle: 'Product Version Governance',
      severity: 'HIGH',
      offendingPhrase: 'CloudPulse v4.0',
      explanation:
        'Draft cites unapproved version "CloudPulse v4.0". Official current release is CloudPulse v4.2.',
      suggestedFix: 'CloudPulse v4.2',
      status: 'fixed',
      occurrences: [
        {
          start: 0,
          end: 15,
          matchedText: 'CloudPulse v4.0',
          lineNumber: 1,
          contextSnippet: 'CloudPulse v4.0 delivers 100% guaranteed uptime...',
        },
      ],
      occurrenceCount: 1,
      appliedReplacementCount: 1,
    },
    {
      id: 'hist-2',
      ruleCode: 'FACT-03',
      ruleTitle: 'Uptime SLA Commitment',
      severity: 'CRITICAL',
      offendingPhrase: '100% guaranteed uptime',
      explanation: 'Absolute reliability claim violates legal SLA limits (99.95%).',
      suggestedFix: '99.95% SLA-backed uptime',
      status: 'fixed',
      occurrences: [
        {
          start: 25,
          end: 47,
          matchedText: '100% guaranteed uptime',
          lineNumber: 1,
          contextSnippet: 'CloudPulse v4.0 delivers 100% guaranteed uptime...',
        },
      ],
      occurrenceCount: 1,
      appliedReplacementCount: 1,
    },
    {
      id: 'hist-3',
      ruleCode: 'FACT-02',
      ruleTitle: 'Approved Tier Pricing',
      severity: 'CRITICAL',
      offendingPhrase: '$29/mo',
      explanation: 'Approved CloudPulse Pro tier pricing is $49/month.',
      suggestedFix: '$49/month',
      status: 'fixed',
      occurrences: [
        {
          start: 80,
          end: 86,
          matchedText: '$29/mo',
          lineNumber: 1,
          contextSnippet: '...for financial workloads at just $29/mo...',
        },
      ],
      occurrenceCount: 1,
      appliedReplacementCount: 1,
    },
    {
      id: 'hist-4',
      ruleCode: 'TONE-01',
      ruleTitle: 'Enterprise B2B Voice Policy',
      severity: 'MEDIUM',
      offendingPhrase: 'lowkey insane',
      explanation: 'Casual slang violates enterprise B2B tone guidelines.',
      suggestedFix: 'engineered for mission-critical enterprise workloads',
      isHumanEdited: true,
      status: 'fixed',
      occurrences: [
        {
          start: 89,
          end: 102,
          matchedText: 'lowkey insane',
          lineNumber: 1,
          contextSnippet: '...$29/mo — lowkey insane performance.',
        },
      ],
      occurrenceCount: 1,
      appliedReplacementCount: 1,
    },
  ],
  auditTrail: [
    {
      id: 'aud-1',
      timestamp: '14:18:04',
      action: 'SCAN_COMPLETED',
      ruleCode: 'SYSTEM',
      detail: 'Initial scan flagged 4 Truth Sheet violations (Trust Score: 28%).',
    },
    {
      id: 'aud-2',
      timestamp: '14:19:12',
      action: 'FIXED',
      ruleCode: 'FACT-01',
      detail: 'Replaced "CloudPulse v4.0" with verified "CloudPulse v4.2".',
    },
    {
      id: 'aud-3',
      timestamp: '14:19:28',
      action: 'FIXED',
      ruleCode: 'FACT-03',
      detail: 'Replaced "100% guaranteed uptime" with "99.95% SLA-backed uptime".',
    },
    {
      id: 'aud-4',
      timestamp: '14:19:45',
      action: 'HUMAN_EDITED_FIX',
      ruleCode: 'TONE-01',
      detail:
        'Human-Edited Fix: Replaced "lowkey insane" with custom rewrite "engineered for mission-critical enterprise workloads".',
    },
  ],
  status: 'PENDING_REVIEW',
  comments: [
    {
      id: 'cmt-1',
      author: 'Elena Rostova',
      role: 'Brand Reviewer',
      text: 'Verified SLA phrasing and pricing tier against Q3 CloudPulse Truth Sheet. Ready for final sign-off.',
      timestamp: '14:22 UTC',
    },
  ],
};

const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  endpointUrl: '',
  secretHeaderName: 'X-NoCap-Release-Token',
  autoIncludeVisualHash: true,
};

const ALL_WORKSPACE_ROLES: UserRole[] = [
  'Content Creator',
  'Brand Reviewer',
  'Compliance Admin',
];

export function App() {
  // Hydrate persisted workspace snapshot on startup (survives page refreshes & syncs across tabs)
  const initialSnapshotRef = useRef<WorkspaceSnapshot | null>(
    loadLocalWorkspaceSnapshot()
  );
  const initialSnapshot = initialSnapshotRef.current;
  const isApplyingRemoteSyncRef = useRef<boolean>(false);

  // Initial view: Dark Liquid-Mesh Landing Page (with 1-click zero-login entry into workspace)
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<NavSection>('scanner');
  const [activeRole, setActiveRole] = useState<UserRole>('Content Creator');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);

  const [hoveredViolationId, setHoveredViolationId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
    new Date().toLocaleTimeString()
  );
  const [resetToast, setResetToast] = useState<boolean>(false);
  const syncStatus = getSyncStatusInfo();

  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API) || '';
    } catch {
      return '';
    }
  });

  // Quick Walkthrough state
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [step1Done, setStep1Done] = useState<boolean>(true);
  const [step2Done, setStep2Done] = useState<boolean>(false);
  const [step3Done, setStep3Done] = useState<boolean>(false);

  const [rules, setRules] = useState<BrandRule[]>(
    () => initialSnapshot?.rules || INITIAL_RULES
  );
  const [draftTitle, setDraftTitle] = useState<string>(
    () => initialSnapshot?.draftTitle || 'CloudPulse v4.2 Global Launch Announcement'
  );
  const [originalBaselineDraft, setOriginalBaselineDraft] = useState<string>(
    () => initialSnapshot?.originalBaselineDraft || SAMPLE_BAD_DRAFT
  );
  const [draftText, setDraftText] = useState<string>(
    () => initialSnapshot?.draftText ?? SAMPLE_BAD_DRAFT
  );

  const [violations, setViolations] = useState<Violation[]>(
    () =>
      initialSnapshot?.violations ||
      runDeterministicScan(SAMPLE_BAD_DRAFT, INITIAL_RULES)
  );
  const [initialScanScore, setInitialScanScore] = useState<number>(() => {
    if (initialSnapshot && typeof initialSnapshot.initialScanScore === 'number') {
      return initialSnapshot.initialScanScore;
    }
    return calculateTrustScore(
      runDeterministicScan(SAMPLE_BAD_DRAFT, INITIAL_RULES),
      INITIAL_RULES.filter((r) => r.enabled).length
    );
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [engineUsed, setEngineUsed] = useState<
    'Gemini 2.5 Flash' | 'Built-in Deterministic Engine'
  >('Built-in Deterministic Engine');
  const [lastHighlightedFix, setLastHighlightedFix] = useState<string | null>(null);
  const [isSubmittedToast, setIsSubmittedToast] = useState<boolean>(false);
  const [headerUploadStatus, setHeaderUploadStatus] = useState<string | null>(null);
  const [visualAsset, setVisualAsset] = useState<VisualAsset | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(
    () => initialSnapshot?.webhookConfig || DEFAULT_WEBHOOK_CONFIG
  );

  const headerFileInputRef = useRef<HTMLInputElement | null>(null);
  const headerVisualInputRef = useRef<HTMLInputElement | null>(null);

  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>(
    () =>
      initialSnapshot?.auditTrail || [
        {
          id: 'init-scan-event',
          timestamp: new Date().toLocaleTimeString(),
          action: 'SCAN_COMPLETED',
          ruleCode: 'SYSTEM',
          detail: 'Pre-flight scan detected 4 brand governance & factual violations.',
        },
      ]
  );

  const [submissions, setSubmissions] = useState<QueuedSubmission[]>(
    () => initialSnapshot?.submissions || [INITIAL_SAMPLE_QUEUE_ITEM]
  );

  const applyRemoteSnapshot = (incoming: WorkspaceSnapshot) => {
    isApplyingRemoteSyncRef.current = true;
    setRules(incoming.rules);
    setDraftTitle(incoming.draftTitle);
    setOriginalBaselineDraft(incoming.originalBaselineDraft);
    setDraftText(incoming.draftText);
    setViolations(incoming.violations);
    setInitialScanScore(incoming.initialScanScore);
    setAuditTrail(incoming.auditTrail);
    setSubmissions(incoming.submissions);
    if (incoming.webhookConfig) {
      setWebhookConfig(incoming.webhookConfig);
    }
    setLastSyncedAt(new Date().toLocaleTimeString());
    setTimeout(() => {
      isApplyingRemoteSyncRef.current = false;
    }, 60);
  };

  const resetLocalStateToDemo = () => {
    isApplyingRemoteSyncRef.current = true;
    const freshViolations = runDeterministicScan(SAMPLE_BAD_DRAFT, INITIAL_RULES);
    setRules(INITIAL_RULES);
    setDraftTitle('CloudPulse v4.2 Global Launch Announcement');
    setOriginalBaselineDraft(SAMPLE_BAD_DRAFT);
    setDraftText(SAMPLE_BAD_DRAFT);
    setVisualAsset(null);
    setVisualError(null);
    setViolations(freshViolations);
    setInitialScanScore(
      calculateTrustScore(
        freshViolations,
        INITIAL_RULES.filter((r) => r.enabled).length
      )
    );
    setSubmissions([INITIAL_SAMPLE_QUEUE_ITEM]);
    setWebhookConfig(DEFAULT_WEBHOOK_CONFIG);
    setAuditTrail([
      {
        id: `demo-reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCAN_COMPLETED',
        ruleCode: 'RESET',
        detail: 'Workspace reset to clean CloudPulse v4.2 demo state.',
      },
    ]);
    setLastSyncedAt(new Date().toLocaleTimeString());
    setTimeout(() => {
      isApplyingRemoteSyncRef.current = false;
    }, 60);
  };

  const handleResetDemoWorkspace = () => {
    clearAndBroadcastWorkspaceReset();
    resetLocalStateToDemo();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 2200);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_API, apiKey);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [apiKey]);

  // Dual-layer Cloud + Cross-Tab Sync persistence effect
  useEffect(() => {
    if (isApplyingRemoteSyncRef.current) return;
    persistAndBroadcastWorkspace({
      rules,
      draftTitle,
      originalBaselineDraft,
      draftText,
      violations,
      initialScanScore,
      auditTrail,
      submissions,
      webhookConfig,
    });
    setLastSyncedAt(new Date().toLocaleTimeString());
  }, [
    rules,
    draftTitle,
    originalBaselineDraft,
    draftText,
    violations,
    initialScanScore,
    auditTrail,
    submissions,
    webhookConfig,
  ]);

  // Subscribe to BroadcastChannel + optional initial Cloud Sync pull
  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceSync(
      (incoming) => applyRemoteSnapshot(incoming),
      () => resetLocalStateToDemo()
    );

    if (syncStatus.cloudConfigured) {
      void fetchCloudWorkspaceSnapshot().then((cloudSnap) => {
        if (cloudSnap) {
          applyRemoteSnapshot(cloudSnap);
        }
      });
    }

    return unsubscribe;
  }, []);

  const activeRuleCount = rules.filter((r) => r.enabled).length;
  const openViolationCount = violations.filter((v) => v.status === 'open').length;
  const isEmptyDraft = draftText.trim().length === 0 && !visualAsset;
  const trustScore = isEmptyDraft
    ? 0
    : calculateTrustScore(violations, activeRuleCount);

  const handleLaunchWorkspace = (targetSection: NavSection = 'scanner') => {
    setActiveSection(targetSection);
    setShowLanding(false);
  };

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'Compliance Admin') {
      setActiveSection('knowledge');
    } else if (role === 'Brand Reviewer') {
      setActiveSection('approval');
    } else {
      setActiveSection('scanner');
    }
  };

  const handleToggleGuide = () => {
    setActiveSection('scanner');
    setShowGuide((prev) => !prev);
  };

  const runCombinedDeterministic = (
    targetDraft: string,
    targetRules: BrandRule[],
    targetVisual: VisualAsset | null
  ): Violation[] => {
    const textViolations = targetDraft.trim()
      ? runDeterministicScan(targetDraft, targetRules)
      : [];
    const visualViolations = targetVisual
      ? runDeterministicVisualAudit(targetVisual, targetRules)
      : [];
    return [...textViolations, ...visualViolations];
  };

  const handleScanDraft = async (
    customDraft?: string,
    customRules?: BrandRule[],
    customVisual?: VisualAsset | null
  ) => {
    if (isScanning) return;
    const targetDraft = customDraft !== undefined ? customDraft : draftText;
    const targetRules = customRules !== undefined ? customRules : rules;
    const targetVisual =
      customVisual !== undefined ? customVisual : visualAsset;

    if (!targetDraft.trim() && !targetVisual) {
      setHeaderUploadStatus('Add text or attach a visual creative before scanning.');
      setTimeout(() => setHeaderUploadStatus(null), 3000);
      return;
    }

    const activeTargetCount = targetRules.filter((r) => r.enabled).length;

    setStep1Done(true);
    setStep2Done(true);
    setIsScanning(true);

    // Ensure the Conveyor Scanning Animation runs for ~2.2 seconds
    const minDurationPromise = new Promise((resolve) => setTimeout(resolve, 2150));

    const textScanPromise = targetDraft.trim()
      ? verifyDraftContent(targetDraft, targetRules, apiKey)
      : Promise.resolve({
          violations: [] as Violation[],
          engineUsed: (apiKey.trim()
            ? 'Gemini 2.5 Flash'
            : 'Built-in Deterministic Engine') as
            | 'Gemini 2.5 Flash'
            | 'Built-in Deterministic Engine',
        });

    const visualScanPromise = targetVisual
      ? verifyVisualContent(targetVisual, targetRules, apiKey)
      : Promise.resolve({
          violations: [] as Violation[],
          engineUsed: (apiKey.trim()
            ? 'Gemini 2.5 Flash'
            : 'Built-in Deterministic Engine') as
            | 'Gemini 2.5 Flash'
            | 'Built-in Deterministic Engine',
        });

    const [textResult, visualResult] = await Promise.all([
      textScanPromise,
      visualScanPromise,
      minDurationPromise,
    ]);

    const combinedViolations = [
      ...textResult.violations,
      ...visualResult.violations,
    ];
    const resolvedEngine =
      textResult.engineUsed === 'Gemini 2.5 Flash' ||
      visualResult.engineUsed === 'Gemini 2.5 Flash'
        ? 'Gemini 2.5 Flash'
        : 'Built-in Deterministic Engine';

    setViolations(combinedViolations);
    setEngineUsed(resolvedEngine);
    const computedScore = calculateTrustScore(
      combinedViolations,
      activeTargetCount
    );
    setInitialScanScore(computedScore);
    setIsScanning(false);

    const visualNote = targetVisual
      ? ` (Text: ${textResult.violations.length}, Visual: ${visualResult.violations.length} on "${targetVisual.name}")`
      : '';

    setAuditTrail((prev) => [
      {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCAN_COMPLETED',
        ruleCode: targetVisual ? 'MULTIMODAL' : 'SCAN',
        detail: `${resolvedEngine} found ${combinedViolations.length} violation(s)${visualNote}. Trust Score: ${computedScore}%.`,
      },
      ...prev,
    ]);
  };

  const handleUploadVisual = async (file: File) => {
    setVisualError(null);
    try {
      const parsed = await parseAndValidateVisualFile(file);
      setVisualAsset(parsed);
      setStep1Done(true);
      setHeaderUploadStatus(`Visual attached: ${parsed.name}`);
      setTimeout(() => setHeaderUploadStatus(null), 3000);
      await handleScanDraft(draftText, rules, parsed);
    } catch (err) {
      setVisualError(
        err instanceof Error
          ? err.message
          : 'Could not process the uploaded visual file.'
      );
    }
  };

  const handleLoadSampleBanner = async () => {
    setVisualError(null);
    const sampleBanner = await createSampleMarketingBannerAsset();
    setVisualAsset(sampleBanner);
    setStep1Done(true);
    setHeaderUploadStatus(`Loaded sample banner: ${sampleBanner.name}`);
    setTimeout(() => setHeaderUploadStatus(null), 3000);
    await handleScanDraft(draftText, rules, sampleBanner);
  };

  const handleRemoveVisual = () => {
    setVisualAsset(null);
    setVisualError(null);
    setHoveredViolationId(null);
    setViolations((prev) => prev.filter((v) => v.source !== 'VISUAL'));
    setAuditTrail((prev) => [
      {
        id: `vis-rem-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCAN_COMPLETED',
        ruleCode: 'VISUAL',
        detail: 'Removed attached visual creative; reverted to text-only audit.',
      },
      ...prev,
    ]);
  };

  const handleLoadSampleBadDraft = () => {
    setActiveSection('scanner');
    setDraftTitle('CloudPulse v4.2 Global Launch Announcement');
    setOriginalBaselineDraft(SAMPLE_BAD_DRAFT);
    setDraftText(SAMPLE_BAD_DRAFT);
    const freshViolations = runCombinedDeterministic(
      SAMPLE_BAD_DRAFT,
      rules,
      visualAsset
    );
    setViolations(freshViolations);
    setInitialScanScore(calculateTrustScore(freshViolations, activeRuleCount));
    setStep1Done(true);
    setStep3Done(false);
    setAuditTrail((prev) => [
      {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCAN_COMPLETED',
        ruleCode: 'RESET',
        detail: 'Loaded sample launch post with repeated brand & fact violations.',
      },
      ...prev,
    ]);
  };

  const handleHeaderFileUpload = async (file: File) => {
    try {
      setHeaderUploadStatus(`Extracting ${file.name}...`);
      const extractedText = await extractTextFromFile(file);
      if (extractedText) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        setDraftTitle(cleanTitle);
        setOriginalBaselineDraft(extractedText);
        setDraftText(extractedText);
        setStep1Done(true);
        setHeaderUploadStatus(`Loaded ${file.name}`);
        await handleScanDraft(extractedText, rules, visualAsset);
        setTimeout(() => setHeaderUploadStatus(null), 3000);
      } else {
        setHeaderUploadStatus('No readable text found in file');
        setTimeout(() => setHeaderUploadStatus(null), 3000);
      }
    } catch (err) {
      setHeaderUploadStatus(
        err instanceof Error ? err.message : 'Failed to parse document'
      );
      setTimeout(() => setHeaderUploadStatus(null), 3500);
    }
  };

  const handleToggleRule = (id: string) => {
    setStep1Done(true);
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    setViolations(runCombinedDeterministic(draftText, updated, visualAsset));
  };

  const handleSetAllRules = (enabled: boolean) => {
    setStep1Done(true);
    const updated = rules.map((r) => ({ ...r, enabled }));
    setRules(updated);
    setViolations(runCombinedDeterministic(draftText, updated, visualAsset));
  };

  const handleUpdateRule = (
    id: string,
    updatedDescription: string,
    updatedTitle?: string
  ) => {
    setStep1Done(true);
    const updated = rules.map((r) =>
      r.id === id
        ? {
            ...r,
            description: updatedDescription,
            title: updatedTitle || r.title,
          }
        : r
    );
    setRules(updated);
    setViolations(runCombinedDeterministic(draftText, updated, visualAsset));
  };

  const handleAddRule = (newRule: Omit<BrandRule, 'id'>) => {
    setStep1Done(true);
    const created: BrandRule = {
      ...newRule,
      id: `custom-rule-${Date.now()}`,
    };
    const updated = [...rules, created];
    setRules(updated);

    setViolations(runCombinedDeterministic(draftText, updated, visualAsset));

    setAuditTrail((prev) => [
      {
        id: `rule-add-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'RULE_ADDED',
        ruleCode: created.code,
        detail: `Added custom governance rule: "${created.title}".`,
      },
      ...prev,
    ]);
  };

  const handleImportRules = (
    importedRules: Omit<BrandRule, 'id'>[],
    sourceFileName: string
  ) => {
    setStep1Done(true);
    const createdList: BrandRule[] = importedRules.map((r, i) => ({
      ...r,
      id: `imported-rule-${Date.now()}-${i}`,
    }));
    const updated = [...rules, ...createdList];
    setRules(updated);

    setViolations(runCombinedDeterministic(draftText, updated, visualAsset));

    setAuditTrail((prev) => [
      {
        id: `rule-import-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'RULE_ADDED',
        ruleCode: 'IMPORT',
        detail: `Imported ${createdList.length} policy rule(s) from "${sourceFileName}".`,
      },
      ...prev,
    ]);
  };

  const handleUpdateViolationFix = (violationId: string, newFixText: string) => {
    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? { ...v, suggestedFix: newFixText, isHumanEdited: true }
          : v
      )
    );
  };

  const handleApplyFix = (
    violationId: string,
    customFixText?: string,
    isHumanEdited?: boolean
  ) => {
    const target = violations.find((v) => v.id === violationId);
    if (!target || target.status !== 'open') return;

    setStep1Done(true);
    setStep2Done(true);
    setHoveredViolationId(null);

    const replacementToUse =
      customFixText !== undefined && customFixText.trim()
        ? customFixText.trim()
        : target.suggestedFix;
    const humanEditedFlag =
      Boolean(isHumanEdited) ||
      Boolean(target.isHumanEdited) ||
      replacementToUse !== target.suggestedFix;

    const isVisualFinding = target.source === 'VISUAL';

    let updatedDraft = draftText;
    let effectiveReplacedCount = 1;

    if (!isVisualFinding) {
      const { updatedDraft: nextDraft, replacedCount } = applyViolationFixToDraft(
        draftText,
        target,
        replacementToUse
      );
      updatedDraft = nextDraft;
      effectiveReplacedCount =
        replacedCount > 0 ? replacedCount : target.occurrenceCount || 1;
      setDraftText(updatedDraft);
    }

    setLastHighlightedFix(
      isVisualFinding
        ? `${target.ruleCode} visual guidance confirmed`
        : effectiveReplacedCount > 1
        ? `${replacementToUse} (${effectiveReplacedCount} occurrences)`
        : replacementToUse
    );
    setTimeout(() => setLastHighlightedFix(null), 2200);

    setViolations((prev) => {
      const marked = prev.map((v) =>
        v.id === violationId
          ? {
              ...v,
              suggestedFix: replacementToUse,
              isHumanEdited: humanEditedFlag,
              status: 'fixed' as const,
              fixedAt: new Date().toLocaleTimeString(),
              appliedReplacementCount: effectiveReplacedCount,
            }
          : v
      );
      return isVisualFinding
        ? marked
        : reIndexViolationsInDraft(updatedDraft, marked);
    });

    setAuditTrail((prev) => [
      {
        id: `fix-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: humanEditedFlag ? 'HUMAN_EDITED_FIX' : 'FIXED',
        ruleCode: target.ruleCode,
        detail: isVisualFinding
          ? `Visual Governance Remediated (${target.visualElement || 'Creative'}): "${replacementToUse}".`
          : humanEditedFlag
          ? `Human-Edited Global Fix (${effectiveReplacedCount}x): Replaced "${target.offendingPhrase}" with custom rewrite "${replacementToUse}".`
          : `Global Fix (${effectiveReplacedCount}x): Replaced "${target.offendingPhrase}" with "${replacementToUse}".`,
        beforeSnippet: target.offendingPhrase,
        afterSnippet: replacementToUse,
      },
      ...prev,
    ]);
  };

  const handleQuickFixAll = () => {
    let workingDraft = draftText;
    const openList = violations.filter((v) => v.status === 'open');
    if (openList.length === 0) return;

    setStep1Done(true);
    setStep2Done(true);
    setHoveredViolationId(null);

    const newEvents: AuditEvent[] = [];
    const replacedCountById: Record<string, number> = {};
    let totalSpansReplaced = 0;

    for (const v of openList) {
      if (v.source === 'VISUAL') {
        replacedCountById[v.id] = 1;
        totalSpansReplaced += 1;
        newEvents.push({
          id: `fix-${v.id}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: v.isHumanEdited ? 'HUMAN_EDITED_FIX' : 'FIXED',
          ruleCode: v.ruleCode,
          detail: `Visual Governance Remediated (${v.visualElement || 'Creative'}): "${v.suggestedFix}".`,
        });
      } else {
        const { updatedDraft, replacedCount } = applyViolationFixToDraft(
          workingDraft,
          v,
          v.suggestedFix
        );
        workingDraft = updatedDraft;
        const effectiveCount =
          replacedCount > 0 ? replacedCount : v.occurrenceCount || 1;
        replacedCountById[v.id] = effectiveCount;
        totalSpansReplaced += effectiveCount;

        newEvents.push({
          id: `fix-${v.id}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: v.isHumanEdited ? 'HUMAN_EDITED_FIX' : 'FIXED',
          ruleCode: v.ruleCode,
          detail: v.isHumanEdited
            ? `Human-Edited Global Fix (${effectiveCount}x): Replaced "${v.offendingPhrase}" with custom rewrite "${v.suggestedFix}".`
            : `Global Fix (${effectiveCount}x): Replaced "${v.offendingPhrase}" with "${v.suggestedFix}".`,
        });
      }
    }

    setDraftText(workingDraft);
    setLastHighlightedFix(
      `${openList.length} rules (${totalSpansReplaced} items remediated)`
    );
    setTimeout(() => setLastHighlightedFix(null), 2400);

    setViolations((prev) =>
      prev.map((v) =>
        v.status === 'open'
          ? {
              ...v,
              status: 'fixed',
              fixedAt: new Date().toLocaleTimeString(),
              appliedReplacementCount:
                replacedCountById[v.id] || v.occurrenceCount || 1,
            }
          : v
      )
    );

    setAuditTrail((prev) => [...newEvents, ...prev]);
  };

  const handleDownloadScannerCertificate = async (format: 'pdf' | 'json') => {
    const activeRules = rules.filter((r) => r.enabled);
    const cert = await buildComplianceCertificate({
      documentTitle: draftTitle.trim() || 'Untitled Campaign Manuscript',
      originalDraft: originalBaselineDraft,
      remediatedDraft: draftText,
      initialScore: initialScanScore,
      finalScore: trustScore,
      engineUsed,
      activeRules,
      violations,
      workflowStage:
        trustScore >= 100
          ? 'Content Scanner — Verified 100% Compliant'
          : 'Content Scanner — Audit Completed',
      workflowStatus: 'AUDIT_COMPLETED',
      signerRole: activeRole,
      signedOffAtUtc: new Date().toISOString(),
      auditEventCount: auditTrail.length,
      visualAsset,
    });

    if (format === 'pdf') {
      downloadAuditCertificatePdf(cert);
    } else {
      downloadAuditCertificateJson(cert);
    }

    setAuditTrail((prev) => [
      {
        id: `cert-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'APPROVED',
        ruleCode: 'CERT',
        detail: `Exported signed Compliance Audit Certificate (${format.toUpperCase()} • ${cert.certificateId}).`,
      },
      ...prev,
    ]);
  };

  const handleOverrideViolation = (violationId: string) => {
    const target = violations.find((v) => v.id === violationId);
    if (!target || target.status !== 'open') return;

    setStep1Done(true);
    setStep2Done(true);
    setHoveredViolationId(null);

    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? { ...v, status: 'overridden', fixedAt: new Date().toLocaleTimeString() }
          : v
      )
    );

    setAuditTrail((prev) => [
      {
        id: `override-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'OVERRIDDEN',
        ruleCode: target.ruleCode,
        detail: `Human reviewer overrode flag on "${target.offendingPhrase}".`,
      },
      ...prev,
    ]);
  };

  const handleSendToQueue = () => {
    if (activeRuleCount === 0 || isEmptyDraft || isSubmittedToast) return;

    setStep1Done(true);
    setStep2Done(true);
    setStep3Done(true);
    setShowGuide(false);

    const newSubmission: QueuedSubmission = {
      id: `sub-${Date.now()}`,
      title: draftTitle.trim() || 'Untitled Campaign Post',
      submittedAt: `Today, ${new Date().toLocaleTimeString()}`,
      originalDraft: originalBaselineDraft,
      finalDraft: draftText,
      initialScore: initialScanScore,
      finalScore: trustScore,
      engineUsed,
      resolvedViolations: violations,
      auditTrail,
      status: 'PENDING_REVIEW',
      comments: [],
      webhookLogs: [],
      visualAsset,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setIsSubmittedToast(true);
    setTimeout(() => {
      setIsSubmittedToast(false);
      setActiveSection('approval');
    }, 650);
  };

  const handleApproveAndPublish = async (submissionId: string) => {
    if (activeRole === 'Content Creator') return;
    const targetSub = submissions.find((s) => s.id === submissionId);
    if (!targetSub) return;

    const nowTime = new Date().toLocaleTimeString();
    const releaseToken = await generateReleaseToken(
      submissionId,
      targetSub.finalDraft,
      activeRole
    );

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'PUBLISHED',
              publishedAt: nowTime,
              approvedByRole: activeRole,
              releaseToken,
              auditTrail: [
                {
                  id: `approve-${Date.now()}`,
                  timestamp: nowTime,
                  action: 'APPROVED',
                  ruleCode: 'APPROVAL',
                  detail: `Approved by ${activeRole} (${s.finalScore}% Trust Score). Issued Release Token: ${releaseToken}.`,
                },
                ...s.auditTrail,
              ],
            }
          : s
      )
    );
    setAuditTrail((prev) => [
      {
        id: `pub-${Date.now()}`,
        timestamp: nowTime,
        action: 'APPROVED',
        ruleCode: 'PUBLISH',
        detail: `Submission approved by ${activeRole}. Publishing Gate unlocked (${releaseToken}).`,
      },
      ...prev,
    ]);
  };

  const handleUpdateWebhookUrl = (url: string) => {
    setWebhookConfig((prev) => ({ ...prev, endpointUrl: url }));
  };

  const handleRecordWebhookDispatch = (
    submissionId: string,
    log: WebhookDispatchLog
  ) => {
    const nowTime = new Date().toLocaleTimeString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              webhookLogs: [log, ...(s.webhookLogs || [])],
              auditTrail: [
                {
                  id: `wh-aud-${Date.now()}`,
                  timestamp: nowTime,
                  action: 'WEBHOOK_DISPATCHED',
                  ruleCode: 'WEBHOOK',
                  detail: `${log.mode} webhook dispatch to ${log.endpointUrl} (${log.statusText}, ${log.latencyMs}ms).`,
                },
                ...s.auditTrail,
              ],
            }
          : s
      )
    );
    setAuditTrail((prev) => [
      {
        id: `wh-global-${Date.now()}`,
        timestamp: nowTime,
        action: 'WEBHOOK_DISPATCHED',
        ruleCode: 'WEBHOOK',
        detail: `${log.mode} release webhook dispatched (${log.statusText}) with token ${log.releaseToken}.`,
      },
      ...prev,
    ]);
  };

  const handleRequestChanges = (submissionId: string, commentText: string) => {
    const nowTime = new Date().toLocaleTimeString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'CHANGES_REQUESTED',
              comments: [
                ...(s.comments || []),
                {
                  id: `cmt-${Date.now()}`,
                  author: activeRole,
                  role: 'Brand Governance',
                  text: commentText,
                  timestamp: nowTime,
                },
              ],
              auditTrail: [
                {
                  id: `req-chg-${Date.now()}`,
                  timestamp: nowTime,
                  action: 'CHANGES_REQUESTED',
                  ruleCode: 'REVIEW',
                  detail: `${activeRole} requested revisions: "${commentText}"`,
                },
                ...s.auditTrail,
              ],
            }
          : s
      )
    );
    setAuditTrail((prev) => [
      {
        id: `chg-${Date.now()}`,
        timestamp: nowTime,
        action: 'CHANGES_REQUESTED',
        ruleCode: 'REVIEW',
        detail: `${activeRole} requested changes on submission: "${commentText}"`,
      },
      ...prev,
    ]);
  };

  const handleAddComment = (submissionId: string, commentText: string) => {
    const nowTime = new Date().toLocaleTimeString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              comments: [
                ...(s.comments || []),
                {
                  id: `cmt-${Date.now()}`,
                  author: activeRole,
                  role: 'Brand Governance',
                  text: commentText,
                  timestamp: nowTime,
                },
              ],
            }
          : s
      )
    );
  };

  const pendingQueueCount = submissions.filter(
    (s) => s.status === 'PENDING_REVIEW'
  ).length;
  const allViolationsResolved =
    activeRuleCount > 0 && violations.every((v) => v.status !== 'open');

  return (
    <>
      {/* Optional Role Switcher / Sign-In Modal (Zero-Friction Judge Compliance) */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        activeRole={activeRole}
        onSelectRole={handleSelectRole}
        onEnterWorkspace={() => setShowLanding(false)}
      />

      {showLanding ? (
        <LandingPage
          activeRole={activeRole}
          activeRuleCount={activeRuleCount}
          onLaunchWorkspace={handleLaunchWorkspace}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
        />
      ) : (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 flex flex-col lg:flex-row selection:bg-indigo-600 selection:text-white">
          {/* Persistent Left Sidebar Navigation */}
          <Navbar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
            onBackToLanding={() => setShowLanding(true)}
            pendingQueueCount={pendingQueueCount}
            activeRuleCount={activeRuleCount}
            openViolationCount={openViolationCount}
            apiKey={apiKey}
            setApiKey={setApiKey}
            showGuide={showGuide}
            onToggleGuide={handleToggleGuide}
          />

          {/* Right Workspace Area */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-x-hidden">
            {/* Global Top Workspace Utility Bar: Live Cloud/Multi-Tab Sync Status + 1-Click Role Switcher + Reset Demo Workspace */}
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Left: Live Sync Indicator */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
                  title={`Persistence layer: ${syncStatus.providerName}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">{syncStatus.label}</span>
                  <span className="hidden sm:inline text-[10px] font-mono text-emerald-700/80">
                    • {lastSyncedAt}
                  </span>
                </div>

                {resetToast && (
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                    ✓ Demo workspace reset &amp; synced
                  </span>
                )}
              </div>

              {/* Center/Right: 1-Click Role Switcher Pills + Reset Demo Workspace */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className="inline-flex items-center rounded-full p-0.5 bg-slate-100 border border-slate-200"
                  role="group"
                  aria-label="Workspace Role Switcher"
                >
                  {ALL_WORKSPACE_ROLES.map((role) => {
                    const isSelected = activeRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setActiveRole(role)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleResetDemoWorkspace}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Reset all rules, drafts, visual assets, and approval queue to a clean demo state"
                >
                  <RefreshCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset Demo Workspace</span>
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeSection === 'scanner' && (
                <motion.div
                  key="scanner-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 flex-1 flex flex-col min-h-0"
                >
                  {/* Top Action Toolbar for Content Scanner */}
                  <div className="bg-white border border-slate-200/90 rounded-[20px] px-5 py-3.5 shadow-card flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Content Scanner
                          </span>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setActiveSection('knowledge')}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                              activeRuleCount === 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{activeRuleCount} Active Rules</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRoleModalOpen(true)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{activeRole}</span>
                          </button>
                          {headerUploadStatus && (
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                              {headerUploadStatus}
                            </span>
                          )}
                        </div>
                        <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                          {draftTitle || 'Untitled Campaign Manuscript'}
                        </h1>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={headerFileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHeaderFileUpload(file);
                          e.target.value = '';
                        }}
                      />

                      <input
                        ref={headerVisualInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadVisual(file);
                          e.target.value = '';
                        }}
                      />

                      <button
                        type="button"
                        onClick={handleLoadSampleBadDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sample Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => headerFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Doc</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => headerVisualInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                        title="Upload PNG, JPG, JPEG, or WEBP visual creative"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                        <span>{visualAsset ? 'Replace Visual' : 'Upload Visual (PNG/JPG/WEBP)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScanDraft()}
                        disabled={isScanning || isEmptyDraft}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        {isScanning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isScanning ? 'Scanning Conveyor...' : 'Scan Content'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Animated AI Inspection Conveyor Pipeline (triggers for ~2.2s when clicking Scan Content) */}
                  <ConveyorScannerOverlay
                    isScanning={isScanning}
                    activeRuleCount={activeRuleCount}
                    engineUsed={engineUsed}
                    hasVisualAsset={Boolean(visualAsset)}
                  />

                  {/* Optional Collapsible 3-Step Quick Walkthrough Banner */}
                  <AnimatePresence>
                    {showGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-indigo-50/70 border border-indigo-200 rounded-[20px] px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0"
                      >
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950">
                            <HelpCircle className="w-4 h-4 text-indigo-600" />
                            <span>Quick Walkthrough:</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${
                                  step1Done
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {step1Done ? <Check className="w-3 h-3" /> : '1'}
                              </span>
                              <span>1. Paste or upload draft</span>
                            </span>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${
                                  allViolationsResolved
                                    ? 'bg-emerald-600 text-white'
                                    : step2Done
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-600'
                                }`}
                              >
                                {allViolationsResolved ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  '2'
                                )}
                              </span>
                              <span>2. Scan &amp; apply or edit AI fixes</span>
                            </span>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${
                                  step3Done
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-600'
                                }`}
                              >
                                {step3Done ? <Check className="w-3 h-3" /> : '3'}
                              </span>
                              <span>3. Submit to Approval Center</span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowGuide(false)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                        >
                          <span>Dismiss</span>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Split-Screen 2-Column Workspace (lg:grid-cols-12: 7 cols Left / 5 cols Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-[calc(100vh-145px)] min-h-[600px]">
                    {/* Left Column (7 cols): Manuscript Editor & Diff View */}
                    <div className="lg:col-span-7 flex flex-col min-h-0 h-full">
                      <DraftEditor
                        draftTitle={draftTitle}
                        setDraftTitle={setDraftTitle}
                        originalDraft={originalBaselineDraft}
                        draftText={draftText}
                        setDraftText={(val) => {
                          setStep1Done(true);
                          setDraftText(val);
                        }}
                        isScanning={isScanning}
                        onScan={() => handleScanDraft()}
                        onLoadSampleDraft={handleLoadSampleBadDraft}
                        onOpenKnowledgeBase={() => setActiveSection('knowledge')}
                        violations={violations}
                        activeRuleCount={activeRuleCount}
                        hoveredViolationId={hoveredViolationId}
                        onHoverViolation={setHoveredViolationId}
                        lastHighlightedFix={lastHighlightedFix}
                        engineUsed={engineUsed}
                        visualAsset={visualAsset}
                        visualError={visualError}
                        onUploadVisual={handleUploadVisual}
                        onLoadSampleBanner={handleLoadSampleBanner}
                        onRemoveVisual={handleRemoveVisual}
                        onDismissVisualError={() => setVisualError(null)}
                      />
                    </div>

                    {/* Right Column (5 cols): AI Analysis & Remediation Inspector */}
                    <div className="lg:col-span-5 flex flex-col min-h-0 h-full">
                      <ViolationPanel
                        trustScore={trustScore}
                        activeRuleCount={activeRuleCount}
                        rules={rules}
                        violations={violations}
                        isScanning={isScanning}
                        hoveredViolationId={hoveredViolationId}
                        onHoverViolation={setHoveredViolationId}
                        onApplyFix={handleApplyFix}
                        onUpdateViolationFix={handleUpdateViolationFix}
                        onOverrideViolation={handleOverrideViolation}
                        onQuickFixAll={handleQuickFixAll}
                        onSendToQueue={handleSendToQueue}
                        onDownloadCertificate={handleDownloadScannerCertificate}
                        onOpenKnowledgeBase={() => setActiveSection('knowledge')}
                        onLoadSampleCampaign={handleLoadSampleBadDraft}
                        isEmptyDraft={isEmptyDraft}
                        isSubmittedToast={isSubmittedToast}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'dashboard' && (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 overflow-y-auto"
                >
                  <DashboardView
                    draftTitle={draftTitle}
                    submissions={submissions}
                    violations={violations}
                    rules={rules}
                    auditTrail={auditTrail}
                    activeRuleCount={activeRuleCount}
                    trustScore={trustScore}
                    engineUsed={engineUsed}
                    activeRole={activeRole}
                    onNavigate={setActiveSection}
                  />
                </motion.div>
              )}

              {activeSection === 'knowledge' && (
                <motion.div
                  key="knowledge-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 overflow-y-auto"
                >
                  <TruthSheetPanel
                    rules={rules}
                    activeRole={activeRole}
                    onSwitchRole={setActiveRole}
                    onToggleRule={handleToggleRule}
                    onSetAllRules={handleSetAllRules}
                    onUpdateRule={handleUpdateRule}
                    onAddRule={handleAddRule}
                    onImportRules={handleImportRules}
                    onGoToScanner={() => setActiveSection('scanner')}
                  />
                </motion.div>
              )}

              {activeSection === 'approval' && (
                <motion.div
                  key="approval-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 overflow-y-auto"
                >
                  <ApprovalQueue
                    submissions={submissions}
                    rules={rules}
                    activeRole={activeRole}
                    webhookConfig={webhookConfig}
                    onUpdateWebhookUrl={handleUpdateWebhookUrl}
                    onRecordWebhookDispatch={handleRecordWebhookDispatch}
                    onSwitchRole={setActiveRole}
                    onApproveAndPublish={handleApproveAndPublish}
                    onRequestChanges={handleRequestChanges}
                    onAddComment={handleAddComment}
                    onBackToStudio={() => setActiveSection('scanner')}
                    onLoadSampleCampaign={handleLoadSampleBadDraft}
                  />
                </motion.div>
              )}

              {activeSection === 'analytics' && (
                <motion.div
                  key="analytics-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 overflow-y-auto"
                >
                  <AnalyticsView
                    rules={rules}
                    violations={violations}
                    submissions={submissions}
                    onNavigate={setActiveSection}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
