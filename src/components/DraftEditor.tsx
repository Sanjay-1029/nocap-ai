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
  Eye,
  Layers,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  X,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import { Violation, VisualAsset } from '../types';
import { extractTextFromFile } from '../utils/fileParser';
import { findAllPhraseOccurrences } from '../utils/verifier';
import { formatFileSize } from '../utils/visualAuditor';

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
  visualAsset: VisualAsset | null;
  visualError: string | null;
  onUploadVisual: (file: File) => void;
  onLoadSampleBanner: () => void;
  onRemoveVisual: () => void;
  onDismissVisualError: () => void;
}

interface HighlightSegment {
  start: number;
  end: number;
  ruleCode: string;
  violationId: string;
  occurrenceIndex: number;
  isFocused: boolean;
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
  visualAsset,
  visualError,
  onUploadVisual,
  onLoadSampleBanner,
  onRemoveVisual,
  onDismissVisualError,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'diff'>('editor');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const visualInputRef = useRef<HTMLInputElement | null>(null);

  const openViolations = violations.filter((v) => v.status === 'open');
  const openTextViolations = openViolations.filter((v) => v.source !== 'VISUAL');
  const openVisualViolations = openViolations.filter((v) => v.source === 'VISUAL');
  const resolvedViolations = violations.filter((v) => v.status === 'fixed');
  const hoveredViolation = openViolations.find((v) => v.id === hoveredViolationId);
  const isHoveringVisualViolation = hoveredViolation?.source === 'VISUAL';

  const totalOpenTextOccurrences = openTextViolations.reduce(
    (sum, v) => sum + (v.occurrenceCount || v.occurrences?.length || 1),
    0
  );

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
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImageLike =
      file.type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);

    if (isImageLike) {
      onUploadVisual(file);
    } else {
      await handleFileUpload(file);
    }
  };

  // Build non-overlapping highlight segments across the full manuscript (TEXT violations only)
  const buildHighlightedNodes = (targetViolations: Violation[], focusedId: string | null) => {
    const rawSegments: HighlightSegment[] = [];

    for (const v of targetViolations) {
      if (v.source === 'VISUAL') continue;
      const phrases =
        v.matchedPhrases && v.matchedPhrases.length > 0
          ? v.matchedPhrases
          : [v.offendingPhrase];
      const liveOccurrences = findAllPhraseOccurrences(draftText, phrases);
      liveOccurrences.forEach((occ, idx) => {
        rawSegments.push({
          start: occ.start,
          end: occ.end,
          ruleCode: v.ruleCode,
          violationId: v.id,
          occurrenceIndex: idx + 1,
          isFocused: focusedId ? v.id === focusedId : true,
        });
      });
    }

    rawSegments.sort(
      (a, b) =>
        a.start - b.start ||
        Number(b.isFocused) - Number(a.isFocused) ||
        b.end - a.end
    );

    const segments: HighlightSegment[] = [];
    for (const seg of rawSegments) {
      const prev = segments[segments.length - 1];
      if (!prev || seg.start >= prev.end) {
        segments.push(seg);
      }
    }

    if (segments.length === 0) {
      return <span>{draftText}</span>;
    }

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    segments.forEach((seg, idx) => {
      if (seg.start > cursor) {
        nodes.push(
          <span key={`txt-${idx}`}>{draftText.slice(cursor, seg.start)}</span>
        );
      }
      const matched = draftText.slice(seg.start, seg.end);
      nodes.push(
        <mark
          key={`hl-${seg.violationId}-${idx}`}
          onMouseEnter={() => onHoverViolation(seg.violationId)}
          onMouseLeave={() => onHoverViolation(null)}
          className={`rounded px-1 py-0.5 font-semibold transition-all cursor-pointer inline-flex items-baseline gap-1 align-baseline ${
            seg.isFocused
              ? 'bg-rose-200/95 text-rose-950 ring-2 ring-rose-500/60 underline decoration-rose-600 decoration-2 underline-offset-2'
              : 'bg-amber-100/80 text-amber-950 border border-amber-300/80'
          }`}
          title={`${seg.ruleCode} — Occurrence #${seg.occurrenceIndex}`}
        >
          <span>{matched}</span>
          <span
            className={`text-[9px] font-mono px-1 rounded leading-tight ${
              seg.isFocused
                ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {seg.ruleCode} #{seg.occurrenceIndex}
          </span>
        </mark>
      );
      cursor = seg.end;
    });

    if (cursor < draftText.length) {
      nodes.push(<span key="txt-tail">{draftText.slice(cursor)}</span>);
    }

    return nodes;
  };

  // Render multi-occurrence hover spotlight bar at bottom of editor (for text violations)
  const renderHoveredSentenceHighlight = () => {
    if (!hoveredViolation || hoveredViolation.source === 'VISUAL') return null;

    const phrases =
      hoveredViolation.matchedPhrases && hoveredViolation.matchedPhrases.length > 0
        ? hoveredViolation.matchedPhrases
        : [hoveredViolation.offendingPhrase];
    const liveOccurrences = findAllPhraseOccurrences(draftText, phrases);
    if (liveOccurrences.length === 0) return null;

    const uniqueLines = Array.from(
      new Set(liveOccurrences.map((o) => o.lineNumber))
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.16 }}
        className="px-4 py-2.5 bg-rose-50/95 border-t border-rose-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-semibold shrink-0">
            {hoveredViolation.ruleCode}
          </span>
          <span className="font-semibold text-rose-900">
            {liveOccurrences.length}{' '}
            {liveOccurrences.length === 1 ? 'occurrence' : 'occurrences'} highlighted
            simultaneously
          </span>
          <span className="text-[11px] font-mono text-rose-700 bg-white/80 px-2 py-0.5 rounded border border-rose-200">
            {uniqueLines.length === 1
              ? `Line ${uniqueLines[0]}`
              : `Lines ${uniqueLines.join(', ')}`}
          </span>
        </div>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          Global Fix: &ldquo;{hoveredViolation.suggestedFix}&rdquo;
        </span>
      </motion.div>
    );
  };

  // Show live simultaneous highlighted manuscript whenever user hovers a TEXT violation card OR picks Span Preview
  const showLiveSpanHighlights =
    viewMode === 'preview' ||
    (viewMode === 'editor' &&
      Boolean(hoveredViolation) &&
      hoveredViolation?.source !== 'VISUAL');

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`bg-white rounded-[20px] border transition-all shadow-card flex flex-col h-full min-h-[540px] overflow-hidden ${
        isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
      }`}
    >
      {/* Hidden Visual Input */}
      <input
        ref={visualInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUploadVisual(f);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Top Manuscript Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
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
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
              {visualAsset && (
                <>
                  <span>•</span>
                  <span className="font-mono text-violet-700 font-medium">
                    +1 Visual ({visualAsset.format})
                  </span>
                </>
              )}
              <span>•</span>
              <span className="font-mono text-slate-600">{engineUsed}</span>
            </div>
          </div>
        </div>

        {/* Right Controls: Editor / Span Preview / Diff + Doc Upload + Visual Upload */}
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
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Span Preview</span>
              {totalOpenTextOccurrences > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-100 text-rose-700">
                  {totalOpenTextOccurrences}
                </span>
              )}
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
              <span>Diff</span>
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
            <span>{isExtractingFile ? 'Extracting...' : 'Doc'}</span>
          </button>

          <button
            type="button"
            onClick={() => visualInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 shadow-xs transition-colors flex items-center gap-1.5"
            title="Upload PNG, JPG, JPEG, or WEBP marketing creative for visual brand audit"
          >
            <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
            <span>{visualAsset ? 'Replace Visual' : 'Add Visual'}</span>
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

      {/* Graceful Non-Blocking Visual Error Banner (Invalid format or >10MB) */}
      <AnimatePresence>
        {visualError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-800 shrink-0 overflow-hidden"
          >
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{visualError}</span>
            </span>
            <button
              type="button"
              onClick={onDismissVisualError}
              className="p-1 rounded hover:bg-rose-100 text-rose-600 shrink-0"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Document Indicator Banner */}
      {uploadedFileName && (
        <div className="px-5 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-800 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Loaded document: <strong className="font-mono">{uploadedFileName}</strong>
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

      {/* Visual Asset Preview Card (when creative is attached) OR Slim Multimodal Prompt Bar */}
      {visualAsset ? (
        <div
          className={`px-5 py-3 border-b transition-all shrink-0 ${
            isHoveringVisualViolation
              ? 'bg-violet-50/90 border-violet-300 ring-2 ring-inset ring-violet-500/30'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Thumbnail Preview */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-24 h-14 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shrink-0 group shadow-xs"
                title="Click to inspect full creative"
              >
                <img
                  src={visualAsset.dataUrl}
                  alt={visualAsset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Metadata & Sampled Dominant Palette */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-100 text-violet-800 border border-violet-200">
                    <ImageIcon className="w-2.5 h-2.5" />
                    VISUAL CREATIVE
                  </span>
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[240px]">
                    {visualAsset.name}
                  </span>
                  {openVisualViolations.length > 0 && (
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                      {openVisualViolations.length} visual flag(s)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-mono text-slate-500 mt-1">
                  <span>{visualAsset.format}</span>
                  <span>•</span>
                  <span>
                    {visualAsset.width}×{visualAsset.height}px
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(visualAsset.sizeBytes)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-slate-400">Palette:</span>
                    {visualAsset.dominantColors.map((hex) => (
                      <span
                        key={hex}
                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] text-slate-700"
                        title={`Sampled dominant color ${hex}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        {hex}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Replace / Remove Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => visualInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3 text-violet-600" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={onRemoveVisual}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {isHoveringVisualViolation && hoveredViolation && (
            <div className="mt-2 pt-2 border-t border-violet-200 text-[11px] text-violet-900 flex items-center justify-between gap-2">
              <span>
                Inspecting <strong>{hoveredViolation.visualElement || 'Visual Region'}</strong>:{' '}
                {hoveredViolation.offendingPhrase}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-violet-600 text-white shrink-0">
                {hoveredViolation.ruleCode}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-2 bg-violet-50/40 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>
              <strong>Multimodal Visual Governance:</strong> Drop or attach a banner/slide creative (
              <code className="font-mono text-[11px]">PNG / JPG / WEBP</code>, max 10MB) to audit copy, palette &amp; disclosures.
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadSampleBanner}
              className="text-[11px] font-semibold text-violet-700 bg-white hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md transition-colors"
            >
              Load Sample Banner
            </button>
            <button
              type="button"
              onClick={() => visualInputRef.current?.click()}
              className="text-[11px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1 rounded-md transition-colors"
            >
              Upload Visual
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Editable Textarea, Simultaneous Multi-Span Highlight Preview, or Diff View */}
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
                Remediated:{' '}
                <strong className="font-mono">&ldquo;{lastHighlightedFix}&rdquo;</strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'diff' ? (
          <div className="flex-1 p-5 bg-slate-50/60 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-semibold text-rose-700">
                    Original Draft (Pre-Verification)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Baseline</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
                  {originalDraft}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-semibold text-emerald-700">
                    Current Remediated Draft
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600">
                    {resolvedViolations.length} rule(s) remediated
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {draftText}
                </p>
              </div>
            </div>
          </div>
        ) : showLiveSpanHighlights ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
            <div className="px-6 py-2 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                {hoveredViolation && hoveredViolation.source !== 'VISUAL' ? (
                  <span>
                    Highlighting all matching spans for{' '}
                    <strong className="font-mono text-rose-700">
                      {hoveredViolation.ruleCode}
                    </strong>{' '}
                    across paragraphs, headings, lists &amp; tables
                  </span>
                ) : (
                  <span>
                    Annotated Span Preview — showing all{' '}
                    <strong className="font-mono text-slate-900">
                      {totalOpenTextOccurrences}
                    </strong>{' '}
                    flagged text spans across the document
                  </span>
                )}
              </span>
              {viewMode === 'preview' && (
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Back to Editor
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto text-[15px] leading-7 text-slate-800 whitespace-pre-wrap font-sans">
              {hoveredViolation && hoveredViolation.source !== 'VISUAL'
                ? buildHighlightedNodes([hoveredViolation], hoveredViolation.id)
                : buildHighlightedNodes(openTextViolations, hoveredViolationId)}
            </div>
          </div>
        ) : (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            disabled={isScanning}
            spellCheck={false}
            placeholder="Paste, compose, or drag & drop a document (.pdf, .docx, .txt, .md) or visual banner (.png, .jpg, .webp) to verify against your Brand Knowledge Base..."
            className="w-full flex-1 p-6 bg-white text-slate-800 text-[15px] leading-7 focus:outline-none resize-none font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-y-auto"
          />
        )}

        {/* Inline Hover Multi-Occurrence Spotlight Bar */}
        <AnimatePresence>{renderHoveredSentenceHighlight()}</AnimatePresence>

        {/* Interactive Flagged Spans Footer Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {openViolations.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Flags ({totalOpenTextOccurrences} text
                {openVisualViolations.length > 0
                  ? ` + ${openVisualViolations.length} visual`
                  : ''}
                ):
              </span>
              {openViolations.map((v) => {
                const isHovered = hoveredViolationId === v.id;
                const isVisual = v.source === 'VISUAL';
                const occCount = v.occurrenceCount || v.occurrences?.length || 1;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onMouseEnter={() => onHoverViolation(v.id)}
                    onMouseLeave={() => onHoverViolation(null)}
                    className={`text-xs font-mono px-2 py-0.5 rounded-md border transition-all inline-flex items-center gap-1.5 ${
                      isVisual
                        ? isHovered
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                        : isHovered
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {isVisual && <ImageIcon className="w-3 h-3" />}
                    <span className="max-w-[180px] truncate">
                      {v.ruleCode}: {isVisual ? v.visualElement || v.ruleTitle : `"${v.offendingPhrase}"`}
                    </span>
                    {!isVisual && occCount > 1 && (
                      <span
                        className={`text-[10px] px-1 rounded font-bold ${
                          isHovered
                            ? 'bg-white/25 text-white'
                            : 'bg-rose-200/80 text-rose-900'
                        }`}
                      >
                        ×{occCount}
                      </span>
                    )}
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
              <span>All text &amp; visual assets align with active CloudPulse brand governance rules.</span>
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

      {/* Fullscreen Visual Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && visualAsset && (
          <div
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold">{visualAsset.name}</span>
                  <span className="text-slate-400">
                    ({visualAsset.width}×{visualAsset.height}px • {visualAsset.format} •{' '}
                    {formatFileSize(visualAsset.sizeBytes)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={visualAsset.dataUrl}
                  alt={visualAsset.name}
                  className="max-w-full max-h-[68vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
