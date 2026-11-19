import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  MessageSquare,
  History,
  ArrowRight,
  RotateCcw,
  Send,
  ScanText,
  UserCheck,
  Download,
  Award,
  FileCheck2,
  FileJson,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  BrandRule,
  QueuedSubmission,
  UserRole,
  WebhookConfig,
  WebhookDispatchLog,
} from '../types';
import {
  buildComplianceCertificate,
  downloadAuditCertificateJson,
  downloadAuditCertificatePdf,
} from '../utils/auditCertificate';
import { PublishingGatePanel } from './PublishingGatePanel';

interface ApprovalQueueProps {
  submissions: QueuedSubmission[];
  rules: BrandRule[];
  activeRole: UserRole;
  webhookConfig: WebhookConfig;
  onUpdateWebhookUrl: (url: string) => void;
  onRecordWebhookDispatch: (submissionId: string, log: WebhookDispatchLog) => void;
  onSwitchRole: (role: UserRole) => void;
  onApproveAndPublish: (submissionId: string) => Promise<void> | void;
  onRequestChanges: (submissionId: string, commentText: string) => void;
  onAddComment: (submissionId: string, commentText: string) => void;
  onBackToStudio: () => void;
  onLoadSampleCampaign: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  submissions,
  rules,
  activeRole,
  webhookConfig,
  onUpdateWebhookUrl,
  onRecordWebhookDispatch,
  onSwitchRole,
  onApproveAndPublish,
  onRequestChanges,
  onAddComment,
  onBackToStudio,
  onLoadSampleCampaign,
}) => {
  const canReviewOrApprove =
    activeRole === 'Brand Reviewer' || activeRole === 'Compliance Admin';
  const activeRules = rules.filter((r) => r.enabled);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);
  const [certStatusById, setCertStatusById] = useState<Record<string, string>>({});
  const [stampedId, setStampedId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    submissions[0]?.id || null
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleDownloadPacketCertificate = async (
    sub: QueuedSubmission,
    format: 'pdf' | 'json'
  ) => {
    const key = `${sub.id}-${format}`;
    setCertStatusById((prev) => ({ ...prev, [key]: 'generating' }));
    try {
      const activeRules = rules.filter((r) => r.enabled);
      const workflowStage =
        sub.status === 'PUBLISHED'
          ? 'Manager Sign-Off Completed'
          : sub.status === 'CHANGES_REQUESTED'
          ? 'Reviewer Revision Requested'
          : 'Reviewer Audit (Pending Manager Sign-Off)';

      const cert = await buildComplianceCertificate({
        documentTitle: sub.title,
        originalDraft: sub.originalDraft,
        remediatedDraft: sub.finalDraft,
        initialScore: sub.initialScore,
        finalScore: sub.finalScore,
        engineUsed: sub.engineUsed,
        activeRules,
        violations: sub.resolvedViolations,
        workflowStage,
        workflowStatus: sub.status,
        signerRole: activeRole,
        signedOffAtUtc: sub.publishedAt ? new Date().toISOString() : null,
        reviewerComments: sub.comments,
        auditEventCount: sub.auditTrail.length,
        visualAsset: sub.visualAsset ?? null,
      });

      if (format === 'pdf') {
        downloadAuditCertificatePdf(cert);
      } else {
        downloadAuditCertificateJson(cert);
      }

      setCertStatusById((prev) => ({ ...prev, [key]: 'done' }));
      setTimeout(() => {
        setCertStatusById((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 2200);
    } catch {
      setCertStatusById((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCopyFinal = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportTxt = (sub: QueuedSubmission) => {
    const fileContent = [
      `NOCAP AI — VERIFIED ENTERPRISE RELEASE CERTIFICATE`,
      `Title: ${sub.title}`,
      `Status: ${sub.status}`,
      `Initial Brand Trust Score: ${sub.initialScore}%`,
      `Verified Brand Trust Score: ${sub.finalScore}%`,
      `Engine: ${sub.engineUsed}`,
      `========================================================`,
      ``,
      `APPROVED REMEDIATED TEXT:`,
      sub.finalDraft,
      ``,
      `========================================================`,
      `AUDIT TRAIL (${sub.auditTrail.length} EVENTS):`,
      ...sub.auditTrail.map(
        (ev) => `[${ev.timestamp}] ${ev.ruleCode} (${ev.action}): ${ev.detail}`
      ),
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${safeName || 'verified-release'}-approved.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedId(sub.id);
    setTimeout(() => setExportedId(null), 2000);
  };

  const handleApproveClick = async (id: string) => {
    if (!canReviewOrApprove || approvingId) return;
    setApprovingId(id);
    try {
      await onApproveAndPublish(id);
      setStampedId(id);
      setTimeout(() => setStampedId(null), 2400);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCommentSubmit = (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;
    onAddComment(id, text);
    setCommentInputs((prev) => ({ ...prev, [id]: '' }));
  };

  const handleRequestChangesClick = (id: string) => {
    const text =
      commentInputs[id]?.trim() ||
      'Please review tone and verify regional pricing footnote before release.';
    onRequestChanges(id, text);
    setCommentInputs((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Page Header */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <UserCheck className="w-3.5 h-3.5" />
              Human-in-the-Loop Sign-Off
            </span>
            <span className="text-xs font-mono text-slate-500">
              {submissions.length} total submission(s)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
            Approval Center &amp; Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inspect side-by-side Original vs. Remediated drafts, review AI vs. Human-Edited fixes, add reviewer notes, and sign off for publication.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToStudio}
          className="px-4 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-2"
        >
          <ScanText className="w-3.5 h-3.5" />
          <span>Open Content Scanner</span>
        </button>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center shadow-card space-y-4">
          <ShieldCheck className="w-10 h-10 text-indigo-600 mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              No Submissions in Approval Queue
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Verify a draft in the Content Scanner, apply fixes, and click &ldquo;Submit to Approval Center&rdquo; — or load a sample campaign immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onLoadSampleCampaign}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Load Sample Campaign
            </button>
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Go to Content Scanner
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => {
            const isPublished = sub.status === 'PUBLISHED';
            const isChangesRequested = sub.status === 'CHANGES_REQUESTED';
            const isHistoryOpen = expandedHistoryId === sub.id;
            const isJustStamped = stampedId === sub.id;

            return (
              <motion.article
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-[20px] border border-slate-200 shadow-card overflow-hidden relative"
              >
                {/* Celebratory Verified Stamp Animation Overlay */}
                <AnimatePresence>
                  {isJustStamped && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.5, rotate: -12 }}
                      animate={{ opacity: 1, scale: 1, rotate: -6 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                      className="absolute top-6 right-8 z-30 pointer-events-none px-5 py-2.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/95 text-emerald-800 shadow-xl flex items-center gap-2"
                    >
                      <Award className="w-5 h-5 text-emerald-600" />
                      <div className="font-mono font-extrabold text-xs uppercase tracking-wider">
                        STAMPED • VERIFIED FOR RELEASE
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submission Header + 3-Stage Pipeline */}
                <div className="p-6 border-b border-slate-200 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved &amp; Published
                          </span>
                        ) : isChangesRequested ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            Changes Requested
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Manager Sign-Off
                          </span>
                        )}

                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {sub.engineUsed}
                        </span>
                        <span className="text-xs text-slate-400">
                          Submitted {sub.submittedAt}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 mt-2">
                        {sub.title}
                      </h2>
                    </div>

                    {/* Score Progression Badge */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-right">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Initial Score
                        </span>
                        <span className="text-sm font-mono font-bold text-rose-600">
                          {sub.initialScore}%
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Verified Score
                        </span>
                        <span className="text-sm font-mono font-bold text-emerald-600">
                          {sub.finalScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual 3-Stage Pipeline: Creator -> Reviewer -> Manager */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Stage 1: Creator */}
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            1. Creator Remediation
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {sub.resolvedViolations.length} issue(s) resolved
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700">
                        {sub.submittedAt}
                      </span>
                    </div>

                    {/* Stage 2: Reviewer */}
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            2. Reviewer Audit
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Truth Sheet v4.2 Verified
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700">
                        100% Pass
                      </span>
                    </div>

                    {/* Stage 3: Manager Sign-Off */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isPublished
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : isChangesRequested
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-amber-200 bg-amber-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isPublished
                              ? 'bg-emerald-600 text-white'
                              : isChangesRequested
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isPublished ? <Check className="w-3.5 h-3.5" /> : '3'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            3. Manager Approval
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isPublished
                              ? `Signed off ${sub.publishedAt}`
                              : isChangesRequested
                              ? 'Revision requested'
                              : 'Awaiting final sign-off'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {isPublished ? 'Published' : 'Stage 3'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Original vs. Remediated Comparison */}
                <div className="p-6 space-y-5 bg-slate-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Original vs. Remediated Comparison
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId((curr) =>
                            curr === sub.id ? null : sub.id
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isHistoryOpen ? 'Hide Audit History' : 'View Audit History'} (
                          {sub.auditTrail.length})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyFinal(sub.id, sub.finalDraft)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5"
                      >
                        {copiedId === sub.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied Text!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Approved Text</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportTxt(sub)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 shadow-xs flex items-center gap-1.5"
                      >
                        {exportedId === sub.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Exported .TXT!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Export .TXT</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={certStatusById[`${sub.id}-pdf`] === 'generating'}
                        onClick={() => handleDownloadPacketCertificate(sub, 'pdf')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                        title="Download signed PDF Compliance Audit Certificate with SHA-256 hashes"
                      >
                        {certStatusById[`${sub.id}-pdf`] === 'generating' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : certStatusById[`${sub.id}-pdf`] === 'done' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>
                          {certStatusById[`${sub.id}-pdf`] === 'done'
                            ? 'PDF Certificate Saved!'
                            : 'Download Audit Certificate'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={certStatusById[`${sub.id}-json`] === 'generating'}
                        onClick={() => handleDownloadPacketCertificate(sub, 'json')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                        title="Download machine-readable JSON Audit Proof"
                      >
                        {certStatusById[`${sub.id}-json`] === 'generating' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : certStatusById[`${sub.id}-json`] === 'done' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>
                          {certStatusById[`${sub.id}-json`] === 'done'
                            ? 'JSON Saved!'
                            : 'JSON Proof'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Original Draft */}
                    <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs">
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <span className="text-xs font-semibold text-rose-700">
                          Original Draft (Pre-Governance)
                        </span>
                        <span className="text-[11px] font-mono text-rose-600">
                          {sub.resolvedViolations.length} violation(s) flagged
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {sub.originalDraft}
                      </p>
                    </div>

                    {/* Remediated Draft */}
                    <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <span className="text-xs font-semibold text-emerald-700">
                          Remediated Draft (Truth-Sheet Verified)
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600">
                          100% Compliant
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                        {sub.finalDraft}
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Version & Audit History + Phrase Remediations */}
                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden"
                      >
                        {/* Phrase-Level Remediations */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                            Applied Phrase Remediations ({sub.resolvedViolations.length})
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {sub.resolvedViolations.map((v) => (
                              <div
                                key={v.id}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-semibold text-slate-800">
                                    {v.ruleCode} • {v.ruleTitle}
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                      v.isHumanEdited
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {v.status === 'overridden'
                                      ? 'Overridden'
                                      : v.isHumanEdited
                                      ? 'Human-Edited Fix'
                                      : 'AI Fix Applied'}
                                  </span>
                                </div>
                                <div className="font-mono text-rose-600 line-through">
                                  - &ldquo;{v.offendingPhrase}&rdquo;
                                </div>
                                {v.status === 'fixed' && (
                                  <div className="font-mono text-emerald-700 font-medium">
                                    + &ldquo;{v.suggestedFix}&rdquo;
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Immutable Audit Trail */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                            Governance Audit Log ({sub.auditTrail.length} Events)
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {sub.auditTrail.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                    {ev.ruleCode}
                                  </span>
                                  <span className="text-slate-700">{ev.detail}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {ev.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reviewer Comments & Sign-Off Controls */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    {sub.comments && sub.comments.length > 0 && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        {sub.comments.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">
                                {c.author}
                              </span>{' '}
                              <span className="text-slate-400">({c.role}):</span>{' '}
                              <span className="text-slate-700">{c.text}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {c.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={commentInputs[sub.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommentSubmit(sub.id);
                            }
                          }}
                          placeholder="Add a reviewer comment or sign-off note..."
                          className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommentSubmit(sub.id)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                        >
                          Post Note
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {!isPublished && !canReviewOrApprove ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reviewer sign-off required</span>
                            <button
                              type="button"
                              onClick={() => onSwitchRole('Brand Reviewer')}
                              className="font-semibold text-indigo-700 hover:underline ml-1"
                            >
                              Switch to Brand Reviewer
                            </button>
                          </div>
                        ) : (
                          <>
                            {!isPublished && (
                              <button
                                type="button"
                                disabled={approvingId !== null}
                                onClick={() => handleRequestChangesClick(sub.id)}
                                className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Request Changes</span>
                              </button>
                            )}

                            {isPublished ? (
                              <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>
                                  Approved by {sub.approvedByRole || 'Reviewer'} ({sub.publishedAt})
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={approvingId !== null}
                                onClick={() => handleApproveClick(sub.id)}
                                className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                              >
                                {approvingId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Approve &amp; Sign Off</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outbound Webhook Publishing Gate (Strict 100% Score + Human Sign-Off Enforcement) */}
                  <PublishingGatePanel
                    submission={sub}
                    activeRules={activeRules}
                    activeRole={activeRole}
                    webhookConfig={webhookConfig}
                    onUpdateWebhookUrl={onUpdateWebhookUrl}
                    onRecordWebhookDispatch={onRecordWebhookDispatch}
                    onSwitchRole={onSwitchRole}
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
};
