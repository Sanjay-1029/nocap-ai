import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Check,
  X,
  Upload,
  FileText,
  Search,
  BookOpen,
  ShieldCheck,
  Palette,
  FolderCheck,
  ScanText,
} from 'lucide-react';
import { BrandRule, RuleCategory } from '../types';
import { extractTextFromFile, parsePolicyTextToRules } from '../utils/fileParser';

interface TruthSheetPanelProps {
  rules: BrandRule[];
  onToggleRule: (id: string) => void;
  onSetAllRules: (enabled: boolean) => void;
  onUpdateRule: (id: string, updatedDescription: string, updatedTitle?: string) => void;
  onAddRule: (newRule: Omit<BrandRule, 'id'>) => void;
  onImportRules: (importedRules: Omit<BrandRule, 'id'>[], sourceFileName: string) => void;
  onGoToScanner: () => void;
}

type KBFilter =
  | 'ALL'
  | 'IDENTITY'
  | 'TONE'
  | 'FACT'
  | 'COMP'
  | 'VISUAL'
  | 'ASSET';

export const TruthSheetPanel: React.FC<TruthSheetPanelProps> = ({
  rules,
  onToggleRule,
  onSetAllRules,
  onUpdateRule,
  onAddRule,
  onImportRules,
  onGoToScanner,
}) => {
  const [activeFilter, setActiveFilter] = useState<KBFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<RuleCategory>('FACT');
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importedBanner, setImportedBanner] = useState<string | null>(null);
  const policyFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCount = rules.filter((r) => r.enabled).length;

  const filterTabs: { id: KBFilter; label: string }[] = [
    { id: 'ALL', label: 'All Rules' },
    { id: 'IDENTITY', label: 'Brand Identity' },
    { id: 'TONE', label: 'Tone of Voice' },
    { id: 'FACT', label: 'Approved Facts' },
    { id: 'COMP', label: 'Restricted Claims' },
    { id: 'VISUAL', label: 'Visual Guidelines' },
    { id: 'ASSET', label: 'Approved Assets' },
  ];

  const startEditing = (rule: BrandRule) => {
    setEditingId(rule.id);
    setEditTitle(rule.title);
    setEditDesc(rule.description);
  };

  const saveEdit = (id: string) => {
    if (editDesc.trim()) {
      onUpdateRule(id, editDesc.trim(), editTitle.trim() || undefined);
    }
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const existingInCat = rules.filter((r) => r.category === newCategory).length;
    const autoCode =
      newCode.trim().toUpperCase() ||
      `${newCategory}-0${existingInCat + 1}`;

    const keywords = newKeyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    onAddRule({
      code: autoCode,
      category: newCategory,
      title: newTitle.trim() || `${newCategory} Governance Rule`,
      description: newDesc.trim(),
      enabled: true,
      keywords: keywords.length > 0 ? keywords : undefined,
      replacementHint: newReplacement.trim() || undefined,
    });

    setNewCode('');
    setNewTitle('');
    setNewDesc('');
    setNewKeyword('');
    setNewReplacement('');
    setShowAddModal(false);
  };

  const handlePolicyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const rawText = await extractTextFromFile(file);
      const extractedRules = parsePolicyTextToRules(rawText, rules.length);
      if (extractedRules.length > 0) {
        onImportRules(extractedRules, file.name);
        setImportedBanner(
          `Imported ${extractedRules.length} governance rule(s) from "${file.name}"`
        );
        setTimeout(() => setImportedBanner(null), 4000);
      }
    } catch {
      setImportedBanner(`Could not parse "${file.name}". Try TXT, MD, or PDF.`);
      setTimeout(() => setImportedBanner(null), 4000);
    } finally {
      setIsImporting(false);
      if (policyFileInputRef.current) {
        policyFileInputRef.current.value = '';
      }
    }
  };

  const getCategoryBadge = (category: RuleCategory) => {
    switch (category) {
      case 'FACT':
        return { label: 'Approved Fact', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'TONE':
        return { label: 'Tone of Voice', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'COMP':
        return { label: 'Restricted Claim', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'IDENTITY':
        return { label: 'Brand Identity', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'VISUAL':
        return { label: 'Visual Guideline', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Approved Asset', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesCategory = activeFilter === 'ALL' || r.category === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.code.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BookOpen className="w-3.5 h-3.5" />
              Single Source of Truth
            </span>
            <span className="text-xs font-mono text-slate-500">
              {activeCount} of {rules.length} rules active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
            Brand Knowledge Base &amp; Governance Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage canonical product facts, tone of voice policies, restricted compliance claims, and brand assets for CloudPulse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={policyFileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx"
            onChange={handlePolicyFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isImporting}
            onClick={() => policyFileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{isImporting ? 'Parsing Policy...' : 'Import Policy (PDF/TXT)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Rule</span>
          </button>

          <button
            type="button"
            onClick={onGoToScanner}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ScanText className="w-3.5 h-3.5" />
            <span>Test in Scanner</span>
          </button>
        </div>
      </div>

      {/* Imported Policy Feedback Banner */}
      <AnimatePresence>
        {importedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              {importedBanner}
            </span>
            <button
              type="button"
              onClick={() => setImportedBanner(null)}
              className="text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs + Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Enable All / Disable All + Search */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onSetAllRules(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
            >
              Enable All
            </button>
            <button
              type="button"
              onClick={() => onSetAllRules(false)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
            >
              Disable All
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules or codes..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Supplemental Frontify-style Reference Cards when viewing Brand Identity, Visual Guidelines, or Approved Assets */}
        {(activeFilter === 'IDENTITY' ||
          activeFilter === 'VISUAL' ||
          activeFilter === 'ASSET') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Brand Identity &amp; Naming</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Always write <strong>CloudPulse</strong> in PascalCase (never &ldquo;Cloud Pulse&rdquo; or &ldquo;cloudpulse&rdquo;). Current flagship release is <strong>CloudPulse v4.2</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Visual &amp; Typography Standards</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Primary UI &amp; campaign palette: Enterprise Indigo (<code className="font-mono">#4F46E5</code>), Slate (<code className="font-mono">#0F172A</code>), and Verified Emerald (<code className="font-mono">#059669</code>).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <FolderCheck className="w-4 h-4 text-indigo-600" />
                <span>Approved Claims &amp; Assets</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Approved SLA badge: <strong>99.95% Uptime SLA</strong>. Approved Pro Tier badge: <strong>$49/month per workspace</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {filteredRules.map((rule) => {
            const isEditing = editingId === rule.id;
            const catBadge = getCategoryBadge(rule.category);

            return (
              <div
                key={rule.id}
                className={`rounded-xl border p-4 transition-all ${
                  rule.enabled
                    ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-65'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {rule.code}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${catBadge.cls}`}
                    >
                      {catBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEditing(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Clean Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleRule(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      title={rule.enabled ? 'Active (click to disable)' : 'Disabled (click to enable)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2.5 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(rule.id)}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {rule.description}
                    </p>
                    {rule.replacementHint && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Approved replacement phrasing:</span>
                        <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          &ldquo;{rule.replacementHint}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* "+ Add Rule" Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
            <motion.form
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleAddSubmit}
              className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Add New Brand Governance Rule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immediately enforced by the Content Scanner verification engine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RuleCategory)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FACT">Approved Facts (FACT)</option>
                    <option value="TONE">Tone of Voice (TONE)</option>
                    <option value="COMP">Restricted Claims (COMP)</option>
                    <option value="IDENTITY">Brand Identity</option>
                    <option value="VISUAL">Visual Guidelines</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rule Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Data Retention Policy"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rule Specification (Ground Truth)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder='e.g. Never promise "unlimited retention" — standard tier includes "90-day hot retention".'
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Banned Phrase (Optional)
                  </label>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. unlimited retention"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Suggested Replacement
                  </label>
                  <input
                    type="text"
                    value={newReplacement}
                    onChange={(e) => setNewReplacement(e.target.value)}
                    placeholder="e.g. 90-day hot retention"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  Save &amp; Activate Rule
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
