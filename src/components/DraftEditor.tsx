import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  RotateCcw,
  FileText,
  Sparkles,
  GitCompare,
  Edit3,
  BookOpen,
} from 'lucide-react';
import { Violation } from '../types';
import { extractTextFromFile } from '../utils/fileParser';

interface DraftEditorProps {
  draftTitle: string;
  setDraftTitle: (title: string) => void;
  originalDraft: string;
  draftText: string;
  setDraftText: (text: string) => void;
  isScanning: boolean;
  onScan: () => void;
  onLoadSampleDraft: () => void;
  onOpenKnowledgeBase: () => void;
  violations: Violation[];
  activeRuleCount: number;
  hoveredViolationId: string | null;
  onHoverViolation: (id: string | null) => void;
  lastHighlightedFix: string | null;
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  draftTitle,
  setDraftTitle,
  originalDraft,
  draftText,
  setDraftText,
  isScanning,
  onScan,
  onLoadSampleDraft,
  onOpenKnowledgeBase,
  violations,
  activeRuleCount,
  hoveredViolationId,
  onHoverViolation,
  lastHighlightedFix,
  engineUsed,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'diff'>('editor');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openViolations = violations.filter((v) => v.status === 'open');
  const resolvedViolations = violations.filter((v) => v.status === 'fixed');
  const hoveredViolation = openViolations.find((v) => v.id === hoveredViolationId);

  const wordCount = draftText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = draftText.length;

  const handleFileUpload = async (file: File) => {
    setIsExtractingFile(true);
    try {
      const extractedText = await extractTextFromFile(file);
      if (extractedText.trim()) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        setDraftTitle(cleanTitle);
        setDraftText(extractedText);
        setUploadedFileName(file.name);
        setViewMode('editor');
      }
    } catch {
      setUploadedFileName(`Error reading ${file.name}`);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  // Render inline spotlight bar when hovering a violation card on the right
  const renderHoveredSentenceHighlight = () => {
    if (!hoveredViolation) return null;
    const phrase = hoveredViolation.offendingPhrase;
    const idx = draftText.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) return null;

    const start = Math.max(0, idx - 60);
    const end = Math.min(draftText.length, idx + phrase.length + 60);
    const prefix = (start > 0 ? '…' : '') + draftText.slice(start, idx);
    const matchText = draftText.slice(idx, idx + phrase.length);
    const suffix =
      draftText.slice(idx + phrase.length, end) +
      (end < draftText.length ? '…' : '');

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.16 }}
        className="px-4 py-2.5 bg-rose-50/90 border-t border-rose-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-semibold shrink-0">
            {hoveredViolation.ruleCode}
          </span>
          <span className="text-slate-700 truncate">
            {prefix}
            <mark className="bg-rose-200/80 text-rose-950 font-semibold px-1 py-0.5 rounded underline decoration-rose-600 decoration-2 underline-offset-2 mx-0.5">
              {matchText}
            </mark>
            {suffix}
          </span>
        </div>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          Suggested: &ldquo;{hoveredViolation.suggestedFix}&rdquo;
        </span>
      </motion.div>
    );
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`bg-white rounded-xl border transition-all shadow-card flex flex-col h-full min-h-[540px] overflow-hidden ${
        isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
      }`}
    >
      {/* Top Manuscript Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Untitled Campaign Document..."
              className="w-full text-sm font-semibold text-slate-900 bg-transparent focus:outline-none focus:text-indigo-600 truncate"
            />
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
              <span>•</span>
              <span className="font-mono text-slate-600">{engineUsed}</span>
            </div>
          </div>
        </div>

        {/* Right Controls: Editor vs. Before/After Diff Toggle + Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'diff'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3 h-3" />
              <span>Before / After Diff</span>
              {resolvedViolations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-700">
                  {resolvedViolations.length}
                </span>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
            title="Upload PDF, DOCX, TXT, or Markdown file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExtractingFile ? 'Extracting...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Scanning Progress Shimmer Bar */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-1 w-full bg-indigo-100 overflow-hidden shrink-0"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="h-full w-1/2 bg-indigo-600"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded File Indicator Banner */}
      {uploadedFileName && (
        <div className="px-5 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-800 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Loaded from file: <strong className="font-mono">{uploadedFileName}</strong>
          </span>
          <button
            type="button"
            onClick={() => setUploadedFileName(null)}
            className="text-[11px] text-indigo-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area: Notion-like Manuscript Editor OR Before/After Diff View */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Applied Fix Toast */}
        <AnimatePresence>
          {lastHighlightedFix && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 right-4 z-20 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Applied fix: <strong className="font-mono">&ldquo;{lastHighlightedFix}&rdquo;</strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'editor' ? (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            disabled={isScanning}
            spellCheck={false}
            placeholder="Paste, compose, or drag & drop a document (.pdf, .docx, .txt, .md) to verify against your Brand Knowledge Base..."
            className="w-full flex-1 p-6 bg-white text-slate-800 text-[15px] leading-7 focus:outline-none resize-none font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-y-auto"
          />
        ) : (
          <div className="flex-1 p-5 bg-slate-50/60 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-rose-200 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-semibold text-rose-700">
                    Original Draft (Pre-Verification)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Baseline</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {originalDraft}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-semibold text-emerald-700">
                    Current Remediated Draft
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600">
                    {resolvedViolations.length} fix(es) applied
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {draftText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inline Hover Sentence Spotlight */}
        <AnimatePresence>{renderHoveredSentenceHighlight()}</AnimatePresence>

        {/* Interactive Flagged Spans Footer Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {openViolations.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Flagged claims:
              </span>
              {openViolations.map((v) => {
                const isHovered = hoveredViolationId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onMouseEnter={() => onHoverViolation(v.id)}
                    onMouseLeave={() => onHoverViolation(null)}
                    className={`text-xs font-mono px-2 py-0.5 rounded-md border transition-all ${
                      isHovered
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {v.ruleCode}: &ldquo;{v.offendingPhrase}&rdquo;
                  </button>
                );
              })}
            </div>
          ) : activeRuleCount === 0 ? (
            <div className="flex items-center justify-between w-full text-xs text-amber-700">
              <span>0 active rules enforced — enable rules in Brand Knowledge Base.</span>
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Knowledge Base
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All statements align with active CloudPulse brand governance rules.</span>
            </div>
          )}

          {/* Bottom Quick Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                setUploadedFileName(null);
                onLoadSampleDraft();
              }}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample</span>
            </button>
            <button
              type="button"
              disabled={isScanning}
              onClick={onScan}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isScanning ? 'Scanning...' : 'Re-Scan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
