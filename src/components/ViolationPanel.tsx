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
  onApplyFix: (violationId: string, customFixText?: string, isHumanEdited?: boolean) => void;
  onUpdateViolationFix: (violationId: string, newFixText: string) => void;
  onOverrideViolation: (violationId: string) => void;
  onQuickFixAll: () => void;
  onSendToQueue: () => void;
  onOpenKnowledgeBase: () => void;
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
  onOpenKnowledgeBase,
  isSubmittedToast,
}) => {
  const [editingFixId, setEditingFixId] = useState<string | null>(null);
  const [draftFixValues, setDraftFixValues] = useState<Record<string, string>>({});
  const [inspectedRuleCode, setInspectedRuleCode] = useState<string | null>(null);

  const openViolations = violations.filter((v) => v.status === 'open');
  const resolvedViolations = violations.filter((v) => v.status !== 'open');

  const isZeroRules = activeRuleCount === 0;
  const canSendToQueue = !isZeroRules && openViolations.length === 0;

  // Circular SVG gauge geometry
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const effectiveScore = isZeroRules ? 0 : trustScore;
  const strokeDashoffset = circumference - (effectiveScore / 100) * circumference;

  const isCompliant = !isZeroRules && effectiveScore >= 90 && openViolations.length === 0;

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-full min-h-[540px] overflow-hidden">
      {/* Top Brand Trust Score Summary Header */}
      <div className="p-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-4">
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
                  : `${openViolations.length} open issue(s) • ${resolvedViolations.length} resolved`}
              </p>
            </div>
          </div>

          {/* Top-Level Apply All Fixes Button */}
          {openViolations.length > 1 && !isZeroRules && (
            <button
              type="button"
              onClick={onQuickFixAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Apply All ({openViolations.length})</span>
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
        ) : violations.length === 0 ? (
          <div className="bg-white rounded-xl border border-emerald-200 p-6 text-center space-y-2.5 my-4 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              100% Brand &amp; Policy Compliant
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              No factual, pricing, SLA, or tone-of-voice violations were found across {activeRuleCount} active rules.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {violations.map((v) => {
              const isResolved = v.status !== 'open';
              const isEditingThisFix = editingFixId === v.id;
              const currentFixValue =
                draftFixValues[v.id] !== undefined
                  ? draftFixValues[v.id]
                  : v.suggestedFix;
              const isHumanCustomized =
                Boolean(v.isHumanEdited) || currentFixValue.trim() !== v.suggestedFix;
              const isHovered = hoveredViolationId === v.id;

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
                      ? 'border-indigo-400 shadow-md ring-2 ring-indigo-500/10'
                      : 'border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Severity Pill + Rule ID Badge + View Rule Link */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {v.status === 'overridden'
                            ? 'Ignored / Overridden'
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

                      <span className="text-xs font-semibold text-slate-800">
                        {v.ruleTitle}
                      </span>
                    </div>

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
                  </div>

                  {/* Plain-English Explanation */}
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {v.explanation}
                  </p>

                  {/* Offending Phrase & Inline-Editable Suggested Correction Box */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-semibold uppercase shrink-0">
                        Flagged
                      </span>
                      <span
                        className={`font-mono break-words ${
                          isResolved
                            ? 'line-through text-slate-400'
                            : 'text-rose-700 font-medium'
                        }`}
                      >
                        &ldquo;{v.offendingPhrase}&rdquo;
                      </span>
                    </div>

                    {/* Editable Suggested Fix */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold uppercase shrink-0">
                            Suggested Fix
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
                            <span>{isEditingThisFix ? 'Done' : 'Edit Rewrite'}</span>
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
                          &ldquo;{currentFixValue}&rdquo;
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
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isHumanCustomized ? 'Apply Custom Fix' : 'Apply Fix'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Footer CTA: Submit to Approval Center */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <button
          type="button"
          disabled={!canSendToQueue}
          onClick={onSendToQueue}
          className={`w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            canSendToQueue
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isSubmittedToast ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Submitted to Approval Center!</span>
            </>
          ) : isZeroRules ? (
            <span>Enable at least 1 rule in Knowledge Base to submit</span>
          ) : canSendToQueue ? (
            <>
              <Send className="w-4 h-4" />
              <span>Submit to Approval Center</span>
            </>
          ) : (
            <span>
              Resolve {openViolations.length} remaining{' '}
              {openViolations.length === 1 ? 'issue' : 'issues'} to unlock approval submission
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
