import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Cpu,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Activity,
} from 'lucide-react';
import {
  AuditEvent,
  QueuedSubmission,
  Violation,
  NavSection,
  BrandRule,
  UserRole,
} from '../types';

interface DashboardViewProps {
  draftTitle: string;
  submissions: QueuedSubmission[];
  violations: Violation[];
  rules: BrandRule[];
  auditTrail: AuditEvent[];
  activeRuleCount: number;
  trustScore: number;
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
  activeRole: UserRole;
  onNavigate: (section: NavSection) => void;
}

const WEEKLY_PILL_BARS = [
  { day: 'S', fullDay: 'Sunday', rate: 84, docs: 18, style: 'hatched-emerald' },
  { day: 'M', fullDay: 'Monday', rate: 89, docs: 29, style: 'solid-emerald' },
  { day: 'T', fullDay: 'Tuesday', rate: 86, docs: 31, style: 'hatched-indigo' },
  { day: 'W', fullDay: 'Wednesday', rate: 93, docs: 38, style: 'solid-indigo' },
  { day: 'T', fullDay: 'Thursday', rate: 91, docs: 35, style: 'hatched-emerald' },
  { day: 'F', fullDay: 'Friday', rate: 96, docs: 44, style: 'solid-emerald' },
  { day: 'S', fullDay: 'Saturday', rate: 98, docs: 27, style: 'solid-indigo' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  draftTitle,
  submissions,
  violations,
  rules,
  auditTrail,
  activeRuleCount,
  trustScore,
  engineUsed,
  activeRole,
  onNavigate,
}) => {
  const pendingCount = submissions.filter(
    (s) => s.status === 'PENDING_REVIEW'
  ).length;
  const approvedCount =
    142 + submissions.filter((s) => s.status === 'PUBLISHED').length;
  const totalScanned = 168 + submissions.length;
  const openViolations = violations.filter((v) => v.status === 'open');
  const resolvedViolations = violations.filter((v) => v.status !== 'open');
  const totalViolationsBlocked = 44 + violations.length;

  // Semi-circular arc gauge math (180 degrees)
  const effectiveTrust = activeRuleCount === 0 ? 0 : trustScore;
  const arcRadius = 74;
  const arcCircumference = Math.PI * arcRadius;
  const arcOffset =
    arcCircumference - (effectiveTrust / 100) * arcCircumference;

  const recentTriggerList =
    violations.length > 0
      ? violations.slice(0, 4).map((v, i) => ({
          id: v.id,
          code: v.ruleCode,
          title: v.ruleTitle,
          severity: v.severity,
          phrase: v.offendingPhrase,
          status: v.status,
          time: v.fixedAt || `${i + 1}m ago`,
        }))
      : [
          {
            id: 'trig-1',
            code: 'FACT-01',
            title: 'Product Version Governance',
            severity: 'HIGH' as const,
            phrase: 'CloudPulse v4.0',
            status: 'fixed' as const,
            time: '12m ago',
          },
          {
            id: 'trig-2',
            code: 'FACT-03',
            title: 'Uptime SLA Commitment',
            severity: 'CRITICAL' as const,
            phrase: '100% guaranteed uptime',
            status: 'fixed' as const,
            time: '18m ago',
          },
          {
            id: 'trig-3',
            code: 'TONE-01',
            title: 'Enterprise B2B Voice Policy',
            severity: 'MEDIUM' as const,
            phrase: 'lowkey insane',
            status: 'fixed' as const,
            time: '24m ago',
          },
        ];

  const workflowStages = [
    {
      role: 'Creator',
      person: 'Maya Lin • Product Marketing',
      task: `Drafted "${draftTitle}" & ran AI scan`,
      status: 'Completed',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'Reviewer',
      person: 'Elena Rostova • Brand Governance',
      task:
        openViolations.length > 0
          ? `Reviewing ${openViolations.length} flagged claim(s) in Scanner`
          : 'All flagged claims remediated against Truth Sheet',
      status: openViolations.length > 0 ? 'In Progress' : 'Completed',
      tone:
        openViolations.length > 0
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'Manager',
      person: 'Marcus Vance • VP Compliance',
      task:
        pendingCount > 0
          ? `${pendingCount} submission(s) awaiting final sign-off`
          : 'All queued releases signed off & published',
      status: pendingCount > 0 ? 'Pending' : 'Completed',
      tone:
        pendingCount > 0
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F6F7F9]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Governance Dashboard
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeRole} View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Plan, inspect, and govern pre-publication enterprise claims with zero unverified releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#14532D] to-[#064E3B] hover:opacity-95 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Scan New Content</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('knowledge')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import Policy / Draft</span>
          </button>
        </div>
      </div>

      {/* ROW 1: 4 KPI Cards with top-right ↗ action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Deep Emerald-Forest Gradient Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-[20px] bg-gradient-to-br from-[#14532D] to-[#064E3B] text-white p-5 shadow-md flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100">
              Total Scanned Assets
            </span>
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="w-8 h-8 rounded-full bg-white text-[#14532D] hover:scale-105 transition-transform flex items-center justify-center shadow-xs"
              title="Open Content Scanner"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
              {totalScanned}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 font-mono font-semibold border border-emerald-300/30">
              +14.2% ↑
            </span>
            <span className="text-emerald-100/80">Increased from last month</span>
          </div>
        </motion.div>

        {/* KPI 2: White Card — Approved & Published */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.04 }}
          className="rounded-[20px] bg-white border border-slate-200/90 p-5 shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Approved &amp; Published
            </span>
            <button
              type="button"
              onClick={() => onNavigate('approval')}
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center"
              title="Open Approval Center"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {approvedCount}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
              96.4% Pass
            </span>
            <span className="text-slate-500">Zero unverified claims</span>
          </div>
        </motion.div>

        {/* KPI 3: White Card — Pending Human Review */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.08 }}
          className="rounded-[20px] bg-white border border-slate-200/90 p-5 shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Pending Human Review
            </span>
            <button
              type="button"
              onClick={() => onNavigate('approval')}
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center"
              title="Review Approval Queue"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {pendingCount}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono font-semibold border border-amber-200">
              Stage 03 Gate
            </span>
            <span className="text-slate-500">Awaiting manager sign-off</span>
          </div>
        </motion.div>

        {/* KPI 4: White Card — Violations Blocked */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.12 }}
          className="rounded-[20px] bg-white border border-slate-200/90 p-5 shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Violations Blocked
            </span>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center"
              title="Open Analytics"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {totalViolationsBlocked}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-md font-mono font-semibold border ${
                openViolations.length > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {openViolations.length} Open Now
            </span>
            <span className="text-slate-500">Intercepted pre-release</span>
          </div>
        </motion.div>
      </div>

      {/* ROW 2: 3-Column Bento Grid (Compliance Analytics, Active Draft Alert, Recent Rule Triggers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (5 cols): Compliance Analytics — Rounded Vertical Pill-Bar Chart (S M T W T F S) */}
        <div className="lg:col-span-5 rounded-[20px] bg-white border border-slate-200/90 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Compliance Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Weekly Ground-Truth pass rate (S M T W T F S)
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              +94.2% Avg
            </span>
          </div>

          {/* Rounded Vertical Pill-Bar Chart */}
          <div className="pt-8 pb-2 grid grid-cols-7 gap-3 items-end h-52">
            {WEEKLY_PILL_BARS.map((bar, idx) => {
              const isSolidEmerald = bar.style === 'solid-emerald';
              const isSolidIndigo = bar.style === 'solid-indigo';
              const isHatchedEmerald = bar.style === 'hatched-emerald';

              const pillStyle = isSolidEmerald
                ? 'bg-gradient-to-t from-[#064E3B] to-[#10B981] text-white'
                : isSolidIndigo
                ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 text-white'
                : isHatchedEmerald
                ? 'bg-hatched-emerald border border-emerald-300/80'
                : 'bg-hatched-indigo border border-indigo-300/80';

              return (
                <div
                  key={`${bar.day}-${idx}`}
                  className="flex flex-col items-center justify-end h-full gap-2 group relative"
                >
                  {/* Hover Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none shadow">
                    {bar.rate}% ({bar.docs})
                  </div>

                  <div className="w-full max-w-[38px] h-36 flex items-end justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.rate}%` }}
                      transition={{ duration: 0.45, delay: idx * 0.04 }}
                      className={`w-full rounded-full ${pillStyle} transition-transform group-hover:scale-105 shadow-xs`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                Verified Release
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                AI Remediated
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Details →
            </button>
          </div>
        </div>

        {/* Card 2 (3 cols): Active Draft Alert */}
        <div className="lg:col-span-3 rounded-[20px] bg-white border border-slate-200/90 p-6 shadow-card flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Draft Alert
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  openViolations.length > 0
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-emerald-500'
                }`}
              />
            </div>

            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                {draftTitle || 'Untitled Campaign Manuscript'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {openViolations.length > 0
                  ? `${openViolations.length} policy violation(s) flagged • Score: ${effectiveTrust}%`
                  : `All violations resolved • Score: ${effectiveTrust}%`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Open Flags:</span>
                <span className="font-mono font-bold text-rose-600">
                  {openViolations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fixes Applied:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {resolvedViolations.length}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="mt-4 w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-gradient-to-r from-[#14532D] to-[#064E3B] hover:opacity-95 text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Open Content Scanner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3 (4 cols): Recent Rule Triggers */}
        <div className="lg:col-span-4 rounded-[20px] bg-white border border-slate-200/90 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Rule Triggers
              </h2>
              <p className="text-xs text-slate-500">
                Flagged rule codes &amp; severity
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('knowledge')}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + Rule
            </button>
          </div>

          <div className="my-3 space-y-2.5 flex-1">
            {recentTriggerList.map((trig) => (
              <div
                key={trig.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shrink-0">
                    {trig.code}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">
                      {trig.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      &ldquo;{trig.phrase}&rdquo;
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      trig.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : trig.severity === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {trig.severity}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {trig.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{activeRuleCount} canonical rules enforced</span>
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Inspect All →
            </button>
          </div>
        </div>
      </div>

      {/* ROW 3: 3-Column Bento Grid (Governance Workflow Activity, Brand Trust Index, Active Governance Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (5 cols): Governance Workflow Activity */}
        <div className="lg:col-span-5 rounded-[20px] bg-white border border-slate-200/90 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Governance Workflow Activity
              </h2>
              <p className="text-xs text-slate-500">
                Creator → Reviewer → Manager pipeline status
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('approval')}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Approval Queue
            </button>
          </div>

          <div className="my-3 space-y-2.5">
            {workflowStages.map((st) => (
              <div
                key={st.role}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {st.role[0]}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {st.role}: <span className="font-medium text-slate-600">{st.person}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {st.task}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${st.tone}`}
                >
                  {st.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              {auditTrail.length} immutable audit events logged
            </span>
            <button
              type="button"
              onClick={() => onNavigate('approval')}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Open Audit Ledger →
            </button>
          </div>
        </div>

        {/* Card 2 (4 cols): Brand Trust Index — Thick Rounded Semi-Circular Arc Gauge */}
        <div className="lg:col-span-4 rounded-[20px] bg-white border border-slate-200/90 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Brand Trust Index
              </h2>
              <p className="text-xs text-slate-500">
                Real-time manuscript compliance score
              </p>
            </div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                activeRuleCount === 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : effectiveTrust >= 90
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {activeRuleCount === 0
                ? '0 Rules Active'
                : effectiveTrust >= 90
                ? 'Verified Safe'
                : 'Action Needed'}
            </span>
          </div>

          {/* Thick Semi-Circular Arc Gauge */}
          <div className="my-2 flex flex-col items-center justify-center relative">
            <svg className="w-52 h-32 overflow-visible" viewBox="0 0 180 105">
              {/* Background Track Arc */}
              <path
                d="M 16 90 A 74 74 0 0 1 164 90"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Animated Progress Arc */}
              <motion.path
                d="M 16 90 A 74 74 0 0 1 164 90"
                fill="none"
                stroke={
                  activeRuleCount === 0
                    ? '#D97706'
                    : effectiveTrust >= 90
                    ? '#059669'
                    : effectiveTrust >= 60
                    ? '#4F46E5'
                    : '#E11D48'
                }
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                initial={{ strokeDashoffset: arcCircumference }}
                animate={{ strokeDashoffset: arcOffset }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
            <div className="-mt-10 text-center">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {activeRuleCount === 0 ? '--' : `${effectiveTrust}%`}
              </div>
              <div className="text-xs font-medium text-slate-500">
                {activeRuleCount === 0
                  ? 'Unverified — 0 Rules'
                  : 'Current Draft Score'}
              </div>
            </div>
          </div>

          {/* Legend: Compliant / Remediated / Flagged */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Compliant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Remediated ({resolvedViolations.length})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Flagged ({openViolations.length})
            </span>
          </div>
        </div>

        {/* Card 3 (3 cols): Dark Textured Active Governance Engine Card */}
        <div className="lg:col-span-3 rounded-[20px] bg-[#090A0F] bg-dark-circuit text-white p-6 shadow-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Active Governance Engine
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Cpu className="w-4 h-4" />
                <span>Verification Core</span>
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {engineUsed}
              </div>
              <div className="text-[11px] text-slate-400">
                Zero-latency deterministic + LLM semantic fallback
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Truth Sheet Rules</div>
                <div className="text-lg font-extrabold font-mono text-emerald-400">
                  {activeRuleCount}/{rules.length} Active
                </div>
              </div>
              <ShieldCheck className="w-7 h-7 text-emerald-400/80" />
            </div>
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors text-center"
            >
              Launch Scanner
            </button>
            <button
              type="button"
              onClick={() => onNavigate('knowledge')}
              className="py-2.5 px-3 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
