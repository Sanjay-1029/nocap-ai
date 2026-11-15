import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingDown,
  CheckCircle2,
  ShieldAlert,
  Users,
  ScanText,
  ArrowUpRight,
} from 'lucide-react';
import { BrandRule, QueuedSubmission, Violation, NavSection } from '../types';

interface AnalyticsViewProps {
  rules: BrandRule[];
  violations: Violation[];
  submissions: QueuedSubmission[];
  onNavigate: (section: NavSection) => void;
}

const MONTHLY_VIOLATION_TRENDS = [
  { month: 'Jun', total: 64, resolved: 61 },
  { month: 'Jul', total: 58, resolved: 56 },
  { month: 'Aug', total: 49, resolved: 48 },
  { month: 'Sep', total: 41, resolved: 40 },
  { month: 'Oct', total: 33, resolved: 33 },
  { month: 'Nov', total: 24, resolved: 24 },
];

const MOST_TRIGGERED_RULES = [
  {
    code: 'TONE-01',
    title: 'Enterprise B2B Voice Policy',
    category: 'Tone of Voice',
    triggers: 48,
    percent: 34,
    color: 'bg-indigo-600',
  },
  {
    code: 'FACT-03',
    title: 'Uptime SLA Commitment (99.95%)',
    category: 'Approved Facts',
    triggers: 37,
    percent: 26,
    color: 'bg-rose-600',
  },
  {
    code: 'FACT-02',
    title: 'Approved Tier Pricing ($49/mo)',
    category: 'Approved Facts',
    triggers: 29,
    percent: 21,
    color: 'bg-amber-500',
  },
  {
    code: 'FACT-01',
    title: 'Product Version Governance (v4.2)',
    category: 'Approved Facts',
    triggers: 18,
    percent: 13,
    color: 'bg-indigo-500',
  },
  {
    code: 'COMP-01',
    title: 'Financial & ROI Claims Compliance',
    category: 'Restricted Claims',
    triggers: 9,
    percent: 6,
    color: 'bg-emerald-600',
  },
];

const TEAM_COMPLIANCE = [
  {
    team: 'Product Marketing',
    scannedAssets: 64,
    firstPassScore: 86,
    finalApprovalRate: 100,
    topFlag: 'FACT-01 (Version)',
  },
  {
    team: 'Social & Growth',
    scannedAssets: 52,
    firstPassScore: 74,
    finalApprovalRate: 98,
    topFlag: 'TONE-01 (Casual Slang)',
  },
  {
    team: 'Enterprise Sales Enablement',
    scannedAssets: 38,
    firstPassScore: 89,
    finalApprovalRate: 100,
    topFlag: 'FACT-03 (Uptime SLA)',
  },
  {
    team: 'Executive Communications',
    scannedAssets: 29,
    firstPassScore: 95,
    finalApprovalRate: 100,
    topFlag: 'COMP-01 (ROI Claims)',
  },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  rules,
  violations,
  submissions,
  onNavigate,
}) => {
  const activeRules = rules.filter((r) => r.enabled).length;
  const publishedCount = submissions.filter((s) => s.status === 'PUBLISHED').length;
  const approvalRate = (96.8 + publishedCount * 0.2).toFixed(1);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BarChart3 className="w-3.5 h-3.5" />
              Governance Telemetry
            </span>
            <span className="text-xs font-mono text-slate-500">
              {activeRules} active rules monitored
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
            Brand Governance &amp; Compliance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track frequent brand violations, monthly risk reduction trends, rule trigger distribution, and team compliance performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('scanner')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
        >
          <ScanText className="w-3.5 h-3.5" />
          <span>Verify New Content</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Post-Remediation Approval Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {approvalRate}%
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +3.4% vs Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Percentage of scanned manuscripts reaching 100% Brand Trust before publication.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Monthly Violation Reduction
            </span>
            <TrendingDown className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono text-slate-900">
              -62.5%
            </span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              64 → 24 / mo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Decline in pre-publication policy flags over the last 6 months.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Most Frequent Violation Category
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono text-slate-900">
              Approved Facts
            </span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              60% of flags ({violations.length} active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Driven primarily by SLA commitments (`FACT-03`) and tier pricing (`FACT-02`).
          </p>
        </div>
      </div>

      {/* Middle Row: Monthly Violation Trends + Most Triggered Brand Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Violation Trends (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Monthly Violation Trends (6-Month Window)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total pre-publication violations detected and remediated prior to release
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Jun – Nov</span>
          </div>

          <div className="pt-6 pb-2 grid grid-cols-6 gap-3 items-end h-56">
            {MONTHLY_VIOLATION_TRENDS.map((m) => {
              const heightPct = Math.round((m.total / 70) * 100);
              return (
                <div
                  key={m.month}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {m.total}
                  </span>
                  <div className="w-full max-w-[44px] bg-slate-100 rounded-t-lg h-36 flex items-end p-0.5 border border-slate-200/70">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="w-full rounded-t-md bg-indigo-600"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>100% of critical flags intercepted before publication.</span>
            <span className="font-mono text-emerald-700 font-semibold">0 Escaped Defects</span>
          </div>
        </div>

        {/* Most Triggered Brand Rules (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Most Triggered Brand Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of flagged claims by canonical rule ID
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('knowledge')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Configure Rules
            </button>
          </div>

          <div className="py-4 space-y-3.5">
            {MOST_TRIGGERED_RULES.map((item) => (
              <div key={item.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {item.code}
                    </span>
                    <span className="font-medium text-slate-800">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-mono text-slate-600">
                    {item.triggers} flags ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Team Compliance Performance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Team Compliance Performance
              </h2>
              <p className="text-xs text-slate-500">
                First-pass Brand Trust scores and final approval rates across enterprise departments
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Department / Team</th>
                <th className="py-3 px-3">Scanned Assets</th>
                <th className="py-3 px-3">Avg First-Pass Trust</th>
                <th className="py-3 px-3">Final Approval Rate</th>
                <th className="py-3 px-3">Most Common Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {TEAM_COMPLIANCE.map((row) => (
                <tr key={row.team} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {row.team}
                  </td>
                  <td className="py-3 px-3 font-mono">{row.scannedAssets}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        row.firstPassScore >= 85
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {row.firstPassScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-semibold text-emerald-700">
                      {row.finalApprovalRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {row.topFlag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
