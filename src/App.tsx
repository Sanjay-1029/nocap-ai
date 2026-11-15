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
} from './utils/verifier';
import { extractTextFromFile } from './utils/fileParser';
import {
  BrandRule,
  Violation,
  AuditEvent,
  QueuedSubmission,
  NavSection,
  UserRole,
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

export function App() {
  // Initial view: Dark Liquid-Mesh Landing Page (with 1-click zero-login entry into workspace)
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<NavSection>('scanner');
  const [activeRole, setActiveRole] = useState<UserRole>('Content Creator');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);

  const [hoveredViolationId, setHoveredViolationId] = useState<string | null>(null);

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

  const [rules, setRules] = useState<BrandRule[]>(INITIAL_RULES);
  const [draftTitle, setDraftTitle] = useState<string>(
    'CloudPulse v4.2 Global Launch Announcement'
  );
  const [originalBaselineDraft, setOriginalBaselineDraft] =
    useState<string>(SAMPLE_BAD_DRAFT);
  const [draftText, setDraftText] = useState<string>(SAMPLE_BAD_DRAFT);

  const [violations, setViolations] = useState<Violation[]>(() =>
    runDeterministicScan(SAMPLE_BAD_DRAFT, INITIAL_RULES)
  );
  const [initialScanScore, setInitialScanScore] = useState<number>(() =>
    calculateTrustScore(
      runDeterministicScan(SAMPLE_BAD_DRAFT, INITIAL_RULES),
      INITIAL_RULES.filter((r) => r.enabled).length
    )
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [engineUsed, setEngineUsed] = useState<
    'Gemini 2.5 Flash' | 'Built-in Deterministic Engine'
  >('Built-in Deterministic Engine');
  const [lastHighlightedFix, setLastHighlightedFix] = useState<string | null>(null);
  const [isSubmittedToast, setIsSubmittedToast] = useState<boolean>(false);
  const [headerUploadStatus, setHeaderUploadStatus] = useState<string | null>(null);

  const headerFileInputRef = useRef<HTMLInputElement | null>(null);

  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([
    {
      id: 'init-scan-event',
      timestamp: new Date().toLocaleTimeString(),
      action: 'SCAN_COMPLETED',
      ruleCode: 'SYSTEM',
      detail: 'Pre-flight scan detected 4 brand governance & factual violations.',
    },
  ]);

  const [submissions, setSubmissions] = useState<QueuedSubmission[]>([
    INITIAL_SAMPLE_QUEUE_ITEM,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_API, apiKey);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [apiKey]);

  const activeRuleCount = rules.filter((r) => r.enabled).length;
  const openViolationCount = violations.filter((v) => v.status === 'open').length;
  const trustScore = calculateTrustScore(violations, activeRuleCount);

  const handleLaunchWorkspace = (targetSection: NavSection = 'scanner') => {
    setActiveSection(targetSection);
    setShowLanding(false);
  };

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'Compliance Manager') {
      setActiveSection('dashboard');
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

  const handleScanDraft = async (customDraft?: string, customRules?: BrandRule[]) => {
    const targetDraft = customDraft !== undefined ? customDraft : draftText;
    const targetRules = customRules !== undefined ? customRules : rules;
    const activeTargetCount = targetRules.filter((r) => r.enabled).length;

    setStep1Done(true);
    setStep2Done(true);
    setIsScanning(true);

    // Ensure the Conveyor Scanning Animation runs for ~2.2 seconds
    const minDurationPromise = new Promise((resolve) => setTimeout(resolve, 2150));
    const [result] = await Promise.all([
      verifyDraftContent(targetDraft, targetRules, apiKey),
      minDurationPromise,
    ]);

    setViolations(result.violations);
    setEngineUsed(result.engineUsed);
    const computedScore = calculateTrustScore(result.violations, activeTargetCount);
    setInitialScanScore(computedScore);
    setIsScanning(false);

    setAuditTrail((prev) => [
      {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCAN_COMPLETED',
        ruleCode: 'SCAN',
        detail: `${result.engineUsed} found ${result.violations.length} violation(s). Trust Score: ${computedScore}%.`,
      },
      ...prev,
    ]);
  };

  const handleLoadSampleBadDraft = () => {
    setActiveSection('scanner');
    setDraftTitle('CloudPulse v4.2 Global Launch Announcement');
    setOriginalBaselineDraft(SAMPLE_BAD_DRAFT);
    setDraftText(SAMPLE_BAD_DRAFT);
    const freshViolations = runDeterministicScan(SAMPLE_BAD_DRAFT, rules);
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
        detail: 'Loaded sample launch post with 4 intentional brand & fact violations.',
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
        await handleScanDraft(extractedText, rules);
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
    const updatedViolations = runDeterministicScan(draftText, updated);
    setViolations(updatedViolations);
  };

  const handleSetAllRules = (enabled: boolean) => {
    setStep1Done(true);
    const updated = rules.map((r) => ({ ...r, enabled }));
    setRules(updated);
    const updatedViolations = runDeterministicScan(draftText, updated);
    setViolations(updatedViolations);
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
    const updatedViolations = runDeterministicScan(draftText, updated);
    setViolations(updatedViolations);
  };

  const handleAddRule = (newRule: Omit<BrandRule, 'id'>) => {
    setStep1Done(true);
    const created: BrandRule = {
      ...newRule,
      id: `custom-rule-${Date.now()}`,
    };
    const updated = [...rules, created];
    setRules(updated);

    const updatedViolations = runDeterministicScan(draftText, updated);
    setViolations(updatedViolations);

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

    const updatedViolations = runDeterministicScan(draftText, updated);
    setViolations(updatedViolations);

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

    const escapedPhrase = target.offendingPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceRegex = new RegExp(escapedPhrase, 'i');
    const updatedDraft = draftText.replace(replaceRegex, replacementToUse);

    setDraftText(updatedDraft);
    setLastHighlightedFix(replacementToUse);
    setTimeout(() => setLastHighlightedFix(null), 2200);

    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? {
              ...v,
              suggestedFix: replacementToUse,
              isHumanEdited: humanEditedFlag,
              status: 'fixed',
              fixedAt: new Date().toLocaleTimeString(),
            }
          : v
      )
    );

    setAuditTrail((prev) => [
      {
        id: `fix-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: humanEditedFlag ? 'HUMAN_EDITED_FIX' : 'FIXED',
        ruleCode: target.ruleCode,
        detail: humanEditedFlag
          ? `Human-Edited Fix: Replaced "${target.offendingPhrase}" with custom rewrite "${replacementToUse}".`
          : `Replaced "${target.offendingPhrase}" with "${replacementToUse}".`,
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

    for (const v of openList) {
      const escapedPhrase = v.offendingPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaceRegex = new RegExp(escapedPhrase, 'i');
      workingDraft = workingDraft.replace(replaceRegex, v.suggestedFix);
      newEvents.push({
        id: `fix-${v.id}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: v.isHumanEdited ? 'HUMAN_EDITED_FIX' : 'FIXED',
        ruleCode: v.ruleCode,
        detail: v.isHumanEdited
          ? `Human-Edited Fix: Replaced "${v.offendingPhrase}" with custom rewrite "${v.suggestedFix}".`
          : `Replaced "${v.offendingPhrase}" with "${v.suggestedFix}".`,
      });
    }

    setDraftText(workingDraft);
    setLastHighlightedFix(`${openList.length} verified fixes`);
    setTimeout(() => setLastHighlightedFix(null), 2400);

    setViolations((prev) =>
      prev.map((v) =>
        v.status === 'open'
          ? { ...v, status: 'fixed', fixedAt: new Date().toLocaleTimeString() }
          : v
      )
    );

    setAuditTrail((prev) => [...newEvents, ...prev]);
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
    if (activeRuleCount === 0) return;

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
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setIsSubmittedToast(true);
    setTimeout(() => {
      setIsSubmittedToast(false);
      setActiveSection('approval');
    }, 650);
  };

  const handleApproveAndPublish = (submissionId: string) => {
    const nowTime = new Date().toLocaleTimeString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'PUBLISHED',
              publishedAt: nowTime,
              auditTrail: [
                {
                  id: `approve-${Date.now()}`,
                  timestamp: nowTime,
                  action: 'APPROVED',
                  ruleCode: 'APPROVAL',
                  detail: `Approved & published by ${activeRole} (${s.finalScore}% Trust Score).`,
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
        detail: `Submission approved by ${activeRole} and cleared for external release.`,
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

                      <button
                        type="button"
                        onClick={handleLoadSampleBadDraft}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Load Sample Bad Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => headerFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload File (PDF / DOCX / TXT / MD)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScanDraft()}
                        disabled={isScanning}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isScanning ? 'Scanning Conveyor...' : 'Scan Content'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Animated AI Inspection Conveyor Pipeline (triggers for ~2.2s when clicking Scan Content) */}
                  <ConveyorScannerOverlay
                    isScanning={isScanning}
                    activeRuleCount={activeRuleCount}
                    engineUsed={engineUsed}
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
                        onOpenKnowledgeBase={() => setActiveSection('knowledge')}
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
                    onApproveAndPublish={handleApproveAndPublish}
                    onRequestChanges={handleRequestChanges}
                    onAddComment={handleAddComment}
                    onBackToStudio={() => setActiveSection('scanner')}
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
