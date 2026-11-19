import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Wand2,
  Send,
  BookOpen,
  Info,
  X,
  FileCheck2,
  FileJson,
  Layers,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Violation, Severity, BrandRule } from '../types';

interface ViolationPanelProps {
  trustScore: number;
  activeRuleCount: number;
  rules: BrandRule[];
  violations: Violation[];
  isScanning: boolean;
  hoveredViolationId: string | null;
  onHoverViolation: (id: string | null) => void;
  onApplyFix: (
    violationId: string,
    customFixText?: string,
    isHumanEdited?: boolean
  ) => void;
  onUpdateViolationFix: (violationId: string, newFixText: string) => void;
  onOverrideViolation: (violationId: string) => void;
  onQuickFixAll: () => void;
  onSendToQueue: () => void;
  onDownloadCertificate: (format: 'pdf' | 'json') => Promise<void>;
  onOpenKnowledgeBase: () => void;
  onLoadSampleCampaign?: () => void;
  isEmptyDraft?: boolean;
  isSubmittedToast: boolean;
}

export const ViolationPanel: React.FC<ViolationPanelProps> = ({
  trustScore,
  activeRuleCount,
  rules,
  violations,
  isScanning,
  hoveredViolationId,
  onHoverViolation,
  onApplyFix,
  onUpdateViolationFix,
  onOverrideViolation,
  onQuickFixAll,
  onSendToQueue,
  onDownloadCertificate,
  onOpenKnowledgeBase,
  onLoadSampleCampaign,
  isEmptyDraft = false,
  isSubmittedToast,
}) => {
  const [editingFixId, setEditingFixId] = useState<string | null>(null);
  const [draftFixValues, setDraftFixValues] = useState<Record<string, string>>({});
  const [inspectedRuleCode, setInspectedRuleCode] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'json' | null>(null);
  const [exportedFeedback, setExportedFeedback] = useState<string | null>(null);

  const openViolations = violations.filter((v) => v.status === 'open');
  const resolvedViolations = violations.filter((v) => v.status !== 'open');

  const totalOpenSpans = openViolations.reduce(
    (sum, v) => sum + (v.occurrenceCount || v.occurrences?.length || 1),
    0
  );

  const isZeroRules = activeRuleCount === 0;
  const canSendToQueue =
    !isZeroRules && !isEmptyDraft && openViolations.length === 0;

  // Circular SVG gauge geometry
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const effectiveScore = isZeroRules ? 0 : trustScore;
  const strokeDashoffset = circumference - (effectiveScore / 100) * circumference;

  const isCompliant =
    !isZeroRules && effectiveScore >= 90 && openViolations.length === 0;

  const handleCertDownload = async (format: 'pdf' | 'json') => {
    if (exportingFormat) return;
    setExportingFormat(format);
    try {
      await onDownloadCertificate(format);
      setExportedFeedback(
        format === 'pdf'
          ? 'Signed PDF Certificate downloaded'
          : 'Machine-readable JSON Proof downloaded'
      );
      setTimeout(() => setExportedFeedback(null), 2600);
    } finally {
      setExportingFormat(null);
    }
  };

  const getScoreTheme = () => {
    if (isZeroRules) {
      return {
        stroke: '#D97706',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        text: 'text-amber-600',
        label: 'Unverified — 0 Rules Active',
      };
    }
    if (isCompliant) {
      return {
        stroke: '#059669',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'text-emerald-600',
        label: 'Verified Compliant',
      };
    }
    if (effectiveScore >= 60) {
      return {
        stroke: '#D97706',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'text-amber-600',
        label: 'Needs Remediation',
      };
    }
    return {
      stroke: '#E11D48',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      text: 'text-rose-600',
      label: 'High Governance Risk',
    };
  };

  const scoreTheme = getScoreTheme();

  const getSeverityStyle = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const startEditingFix = (v: Violation) => {
    setEditingFixId(v.id);
    setDraftFixValues((prev) => ({
      ...prev,
      [v.id]: prev[v.id] !== undefined ? prev[v.id] : v.suggestedFix,
    }));
  };

  const commitFixEdit = (v: Violation) => {
    const edited = draftFixValues[v.id];
    if (edited !== undefined && edited.trim() && edited.trim() !== v.suggestedFix) {
      onUpdateViolationFix(v.id, edited.trim());
    }
    setEditingFixId(null);
  };

  const handleApplyClick = (v: Violation) => {
    if (v.status !== 'open') return;
    const pendingEdit = draftFixValues[v.id];
    const finalFix =
      pendingEdit !== undefined && pendingEdit.trim()
        ? pendingEdit.trim()
        : v.suggestedFix;
    const wasCustomized =
      Boolean(v.isHumanEdited) || finalFix !== v.suggestedFix;
    setEditingFixId(null);
    onApplyFix(v.id, finalFix, wasCustomized);
  };

  const inspectedRule = rules.find((r) => r.code === inspectedRuleCode);

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 shadow-card flex flex-col h-full min-h-[540px] overflow-hidden">
      {/* Top Brand Trust Score Summary Header */}
      <div className="p-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular SVG Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth="6"
                  fill="transparent"
                />
                <motion.circle
                  cx="34"
                  cy="34"
                  r={radius}
                  stroke={scoreTheme.stroke}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <span className={`absolute text-sm font-bold font-mono ${scoreTheme.text}`}>
                {isZeroRules ? '--' : `${effectiveScore}%`}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Brand Trust Score
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${scoreTheme.badge}`}
                >
                  {scoreTheme.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isZeroRules
                  ? 'No active governance rules are currently enforced.'
                  : openViolations.length === 0
                  ? `Verified against ${activeRuleCount} active brand rules.`
                  : `${openViolations.length} open rule(s) • ${totalOpenSpans} total span(s) • ${resolvedViolations.length} resolved`}
              </p>
            </div>
          </div>

          {/* Top-Level Apply All Fixes Button */}
          {openViolations.length > 0 && !isZeroRules && (
            <button
              type="button"
              onClick={onQuickFixAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5 shrink-0"
              title="Apply fixes across all matching spans in the entire document"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Apply All ({totalOpenSpans})</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Rule Specification Popover Banner when "View Rule" is clicked */}
      <AnimatePresence>
        {inspectedRule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="px-5 py-3 bg-indigo-50/90 border-b border-indigo-200 text-xs flex items-start justify-between gap-3 shrink-0 overflow-hidden"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-indigo-700">
                  {inspectedRule.code}
                </span>
                <span className="font-semibold text-slate-900">
                  {inspectedRule.title}
                </span>
              </div>
              <p className="text-slate-600">{inspectedRule.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="text-indigo-700 font-semibold hover:underline"
              >
                Edit in KB
              </button>
              <button
                type="button"
                onClick={() => setInspectedRuleCode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Inspector Body */}
      <div className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
        {isScanning ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-12 w-full bg-slate-100 rounded-lg" />
                <div className="h-3 w-3/4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : isZeroRules ? (
          <div className="bg-white rounded-xl border border-amber-200 p-6 text-center space-y-3 my-4 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Unverified — 0 Rules Active
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                All brand governance rules are currently disabled. Enable at least one rule in the Brand Knowledge Base to verify content.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenKnowledgeBase}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Brand Knowledge Base</span>
            </button>
          </div>
        ) : isEmptyDraft ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3 my-4 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                No Campaign Content to Audit
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Paste text, upload a document (PDF/DOCX/TXT), attach a visual creative, or load our sample campaign to test live governance.
              </p>
            </div>
            {onLoadSampleCampaign && (
              <button
                type="button"
                onClick={onLoadSampleCampaign}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                Load Sample Campaign
              </button>
            )}
          </div>
        ) : violations.length === 0 ? (
          <div className="bg-white rounded-xl border border-emerald-200 p-6 text-center space-y-2.5 my-4 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              100% Brand &amp; Policy Compliant
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              No factual, pricing, SLA, or tone-of-voice violations were found across {activeRuleCount} active rules. Ready for signed audit certificate export.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {violations.map((v) => {
              const isResolved = v.status !== 'open';
              const isVisual = v.source === 'VISUAL';
              const isEditingThisFix = editingFixId === v.id;
              const currentFixValue =
                draftFixValues[v.id] !== undefined
                  ? draftFixValues[v.id]
                  : v.suggestedFix;
              const isHumanCustomized =
                Boolean(v.isHumanEdited) || currentFixValue.trim() !== v.suggestedFix;
              const isHovered = hoveredViolationId === v.id;

              const occCount =
                v.appliedReplacementCount ||
                v.occurrenceCount ||
                v.occurrences?.length ||
                1;
              const uniqueLines = Array.from(
                new Set((v.occurrences || []).map((o) => o.lineNumber))
              );

              return (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  onMouseEnter={() => {
                    if (!isResolved) onHoverViolation(v.id);
                  }}
                  onMouseLeave={() => onHoverViolation(null)}
                  className={`rounded-xl border p-4 transition-all bg-white ${
                    isResolved
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isHovered
                      ? isVisual
                        ? 'border-violet-400 shadow-md ring-2 ring-violet-500/15'
                        : 'border-indigo-400 shadow-md ring-2 ring-indigo-500/10'
                      : isVisual
                      ? 'border-violet-200/90 shadow-xs hover:border-violet-300'
                      : 'border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: VISUAL AUDIT / Severity Pill + Rule ID + Occurrence Badge + View Rule */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isVisual && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                          <ImageIcon className="w-2.5 h-2.5 text-violet-700" />
                          VISUAL AUDIT
                        </span>
                      )}

                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {v.status === 'overridden'
                            ? 'Ignored / Overridden'
                            : isVisual
                            ? 'Visual Remediated'
                            : v.isHumanEdited
                            ? 'Human-Edited Fix'
                            : 'Fixed'}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityStyle(
                            v.severity
                          )}`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {v.severity}
                        </span>
                      )}

                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {v.ruleCode}
                      </span>

                      {/* Occurrence Count Badge (for text spans) */}
                      {!isVisual && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : occCount > 1
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Layers className="w-2.5 h-2.5" />
                          {isResolved
                            ? `${occCount} ${occCount === 1 ? 'span' : 'spans'} remediated`
                            : `${occCount} ${occCount === 1 ? 'occurrence' : 'occurrences'} found`}
                        </span>
                      )}
                    </div>

                    {rules.some((r) => r.code === v.ruleCode) && (
                      <button
                        type="button"
                        onClick={() =>
                          setInspectedRuleCode((curr) =>
                            curr === v.ruleCode ? null : v.ruleCode
                          )
                        }
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        <span>View Rule</span>
                      </button>
                    )}
                  </div>

                  {/* Rule Title + Visual Element Reference or Indexed Line Numbers */}
                  <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900">
                      {v.ruleTitle}
                    </span>
                    {isVisual && v.visualElement ? (
                      <span className="text-[10px] font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                        {v.visualElement}
                      </span>
                    ) : uniqueLines.length > 0 ? (
                      <span className="text-[10px] font-mono text-slate-500">
                        {uniqueLines.length === 1
                          ? `Line ${uniqueLines[0]}`
                          : `Lines ${uniqueLines.join(', ')}`}
                      </span>
                    ) : null}
                  </div>

                  {/* Plain-English Explanation */}
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {v.explanation}
                  </p>

                  {/* Sampled Color Swatches (for Visual Palette Findings) */}
                  {isVisual && v.detectedColors && v.detectedColors.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Detected Swatches:
                      </span>
                      {v.detectedColors.map((hex) => (
                        <span
                          key={hex}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-700"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: hex }}
                          />
                          {hex}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Offending Phrase / Visual Element & Inline-Editable Remediation Guidance Box */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold uppercase shrink-0 ${
                          isVisual
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isVisual ? 'Visual Finding' : 'Flagged'}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {v.matchedPhrases && v.matchedPhrases.length > 1 ? (
                          v.matchedPhrases.map((phrase, idx) => (
                            <span
                              key={idx}
                              className={`font-mono break-words ${
                                isResolved
                                  ? 'line-through text-slate-400'
                                  : 'text-rose-700 font-medium'
                              }`}
                            >
                              &ldquo;{phrase}&rdquo;
                              {idx < v.matchedPhrases!.length - 1 ? ',' : ''}
                            </span>
                          ))
                        ) : (
                          <span
                            className={`font-mono break-words ${
                              isResolved
                                ? 'line-through text-slate-400'
                                : isVisual
                                ? 'text-violet-900 font-medium'
                                : 'text-rose-700 font-medium'
                            }`}
                          >
                            {isVisual ? v.offendingPhrase : `"${v.offendingPhrase}"`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Editable Suggested Fix / Actionable Visual Remediation Guidance */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold uppercase shrink-0">
                            {isVisual ? 'Remediation Guidance' : 'Suggested Fix'}
                          </span>
                          {isHumanCustomized && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Customized
                            </span>
                          )}
                        </div>

                        {!isResolved && (
                          <button
                            type="button"
                            onClick={() =>
                              isEditingThisFix ? commitFixEdit(v) : startEditingFix(v)
                            }
                            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>
                              {isEditingThisFix
                                ? 'Done'
                                : isVisual
                                ? 'Edit Note'
                                : 'Edit Rewrite'}
                            </span>
                          </button>
                        )}
                      </div>

                      {!isResolved && isEditingThisFix ? (
                        <input
                          type="text"
                          autoFocus
                          value={currentFixValue}
                          onChange={(e) =>
                            setDraftFixValues((prev) => ({
                              ...prev,
                              [v.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitFixEdit(v);
                            }
                          }}
                          className="w-full rounded-md bg-white border border-indigo-400 px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <div
                          onClick={() => {
                            if (!isResolved) startEditingFix(v);
                          }}
                          className={`font-mono text-emerald-800 font-medium break-words ${
                            !isResolved ? 'cursor-text hover:underline decoration-dotted' : ''
                          }`}
                        >
                          {isVisual ? currentFixValue : `"${currentFixValue}"`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  {!isResolved && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOverrideViolation(v.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        Ignore / Override
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyClick(v)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
                          isVisual
                            ? 'bg-violet-600 hover:bg-violet-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isVisual
                            ? 'Mark Visual Remediated'
                            : isHumanCustomized
                            ? occCount > 1
                              ? `Apply Custom Fix (All ${occCount})`
                              : 'Apply Custom Fix'
                            : occCount > 1
                            ? `Apply Fix (All ${occCount})`
                            : 'Apply Fix'}
                        </span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Footer CTAs: Download Signed Audit Certificate (PDF & JSON) + Submit to Approval Center */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-2.5 shrink-0">
        {canSendToQueue && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleCertDownload('pdf')}
                className="sm:col-span-8 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {exportingFormat === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Download Audit Certificate (PDF)</span>
              </button>

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleCertDownload('json')}
                className="sm:col-span-4 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                title="Download machine-readable JSON audit proof with SHA-256 hashes"
              >
                {exportingFormat === 'json' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>JSON Proof</span>
              </button>
            </div>
            {exportedFeedback && (
              <div className="text-[11px] font-medium text-emerald-700 text-center">
                ✓ {exportedFeedback} (SHA-256 signed)
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={!canSendToQueue || isSubmittedToast || isScanning}
          onClick={onSendToQueue}
          className={`w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            canSendToQueue && !isSubmittedToast && !isScanning
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isSubmittedToast ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-emerald-700">Opening Approval Center &amp; Publishing Gate...</span>
            </>
          ) : isEmptyDraft ? (
            <span>Add draft text or a visual asset to scan &amp; submit</span>
          ) : isZeroRules ? (
            <span>Enable at least 1 rule in Knowledge Base to submit</span>
          ) : canSendToQueue ? (
            <>
              <Send className="w-4 h-4" />
              <span>Submit to Approval Center &amp; Publishing Gate</span>
            </>
          ) : (
            <span>
              Resolve {openViolations.length} remaining{' '}
              {openViolations.length === 1 ? 'rule' : 'rules'} ({totalOpenSpans} spans) to unlock approval &amp; certificate
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
