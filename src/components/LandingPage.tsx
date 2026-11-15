import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  FileText,
  Cpu,
  Lock,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { UserRole, NavSection } from '../types';

interface LandingPageProps {
  activeRole: UserRole;
  activeRuleCount: number;
  onLaunchWorkspace: (targetSection?: NavSection) => void;
  onOpenRoleModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  activeRole,
  activeRuleCount,
  onLaunchWorkspace,
  onOpenRoleModal,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-white relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Animated Violet / Indigo Organic Liquid-Mesh Silk Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Radial Mesh Glows */}
        <motion.div
          animate={{
            scale: [1, 1.14, 1],
            opacity: [0.35, 0.52, 0.35],
            x: [0, 35, 0],
            y: [0, -25, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-36 -left-36 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-indigo-600/35 via-violet-600/25 to-transparent blur-[130px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.28, 0.45, 0.28],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-violet-600/30 via-indigo-500/20 to-emerald-500/10 blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.36, 0.2],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/3 w-[620px] h-[420px] rounded-full bg-gradient-to-t from-indigo-700/25 via-purple-600/15 to-transparent blur-[130px]"
        />

        {/* Undulating Liquid Silk Wave SVG Mesh */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="silkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="silkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#090A0F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <motion.path
            animate={{
              d: [
                'M-100,260 C320,120 620,440 1020,240 C1260,120 1420,280 1560,220 L1560,900 L-100,900 Z',
                'M-100,300 C280,410 680,140 1060,310 C1280,400 1410,190 1560,260 L1560,900 L-100,900 Z',
                'M-100,260 C320,120 620,440 1020,240 C1260,120 1420,280 1560,220 L1560,900 L-100,900 Z',
              ],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            fill="url(#silkGrad1)"
            opacity="0.22"
          />

          <motion.path
            animate={{
              d: [
                'M-100,450 C260,310 590,580 980,390 C1220,280 1390,460 1560,370',
                'M-100,390 C310,540 650,280 1020,450 C1250,530 1400,330 1560,410',
                'M-100,450 C260,310 590,580 980,390 C1220,280 1390,460 1560,370',
              ],
            }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
            stroke="url(#silkGrad1)"
            strokeWidth="2"
            fill="none"
          />

          <motion.path
            animate={{
              d: [
                'M-100,560 C360,690 710,360 1120,540 C1310,620 1440,460 1560,510',
                'M-100,510 C320,380 740,660 1080,480 C1290,380 1420,560 1560,470',
                'M-100,560 C360,690 710,360 1120,540 C1310,620 1440,460 1560,510',
              ],
            }}
            transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
            stroke="url(#silkGrad2)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Subtle Architectural Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Top Glass Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#090A0F]/75 border-b border-white/10">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  NoCap AI
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Enterprise v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Pre-Publication Brand &amp; Claim Governance
              </p>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('governance-engine')}
              className="hover:text-white transition-colors"
            >
              Governance Engine
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('trust-safety')}
              className="hover:text-white transition-colors"
            >
              Trust &amp; Safety
            </button>
          </nav>

          {/* Top-Right Pills: Workspace Sign In + Launch Studio */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenRoleModal}
              className="px-4 py-2 rounded-full text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace Sign In</span>
              <span className="hidden sm:inline text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                {activeRole.split(' ')[1]}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onLaunchWorkspace('dashboard')}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#090A0F] hover:bg-indigo-50 transition-all shadow-lg shadow-white/10 flex items-center gap-1.5"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Centerpiece */}
      <section className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-xs text-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero Hallucinations • Ground-Truth Canon Enforced • Human Sign-Off</span>
          </motion.div>

          {/* Bold Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] text-white"
          >
            Govern Every Word{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
              Before It Ships
            </span>
          </motion.h1>

          {/* Concise Value Proposition */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed"
          >
            NoCap AI inspects marketing campaigns, release advisories, and enterprise documents against your canonical Brand Truth Sheet in real time—catching unapproved versions, SLA overpromises, and tone violations before publication.
          </motion.p>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <button
              type="button"
              onClick={() => onLaunchWorkspace('dashboard')}
              className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[#090A0F] hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 group"
            >
              <span>Launch Live Demo Workspace — No Login Required</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onLaunchWorkspace('scanner')}
              className="px-5 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/30 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Jump to Content Scanner</span>
            </button>

            <button
              type="button"
              onClick={onOpenRoleModal}
              className="px-5 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-300" />
              <span>Role Sign-In ({activeRole})</span>
            </button>
          </motion.div>
        </div>

        {/* 2 Floating Translucent Glass Telemetry Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Telemetry Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-[20px] bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 shadow-2xl relative overflow-hidden group hover:border-indigo-400/40 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-400/25">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Live Semantic + Deterministic Verification
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
                  99.4%
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  Ground-Truth Accuracy
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Powered by Gemini 2.5 Flash &amp; deterministic rule-matching across {activeRuleCount} active CloudPulse policies.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                FACT-01 • FACT-02 • FACT-03 • TONE-01 • COMP-01
              </span>
              <span>Latency: &lt;1.2s</span>
            </div>
          </motion.div>

          {/* Telemetry Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="rounded-[20px] bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 shadow-2xl relative overflow-hidden group hover:border-emerald-400/40 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-400/25">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Audit-Ready Compliance Gate
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
                  Zero
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  Unverified Claims Published
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Every flagged version number, pricing tier, or SLA promise requires inline remediation or logged human sign-off.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-indigo-300">
                3-Stage Pipeline: Creator → Reviewer → Manager
              </span>
              <span className="text-emerald-400">100% Traceable</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Below the Fold: Crisp 3-Step Visual Showcase */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 py-16 border-t border-white/10"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
            End-to-End Governance Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Three Steps from Raw Draft to Verified Release
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Engineered for high-velocity marketing, product, and compliance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 01 */}
          <div className="rounded-[20px] bg-white/[0.04] border border-white/10 p-6 hover:bg-white/[0.06] transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  01 INGEST DRAFT &amp; POLICY
                </span>
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Upload Manuscripts &amp; Brand Canon
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Drop in `.pdf`, `.docx`, `.txt`, or `.md` drafts and maintain your live Truth Sheet of approved product versions (`v4.2`), pricing (`$49/mo`), SLAs (`99.95%`), and tone standards.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300 font-mono">
              <span>PDF • DOCX • Markdown</span>
              <span>Live Rule Toggles</span>
            </div>
          </div>

          {/* Step 02 */}
          <div className="rounded-[20px] bg-white/[0.04] border border-white/10 p-6 hover:bg-white/[0.06] transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                  02 AI CONVEYOR AUDIT
                </span>
                <Cpu className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Explainable Inspection &amp; Editable Fixes
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Watch the AI Governance Core inspect every sentence against active rules, spotlighting offending phrases alongside inline-editable suggested rewrites.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-violet-300 font-mono">
              <span>Gemini 2.5 Flash + Fallback</span>
              <span>Human-Editable Fixes</span>
            </div>
          </div>

          {/* Step 03 */}
          <div className="rounded-[20px] bg-white/[0.04] border border-white/10 p-6 hover:bg-white/[0.06] transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  03 HUMAN SIGN-OFF
                </span>
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Multi-Role Approval &amp; Audit Ledger
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Compare Original vs. Remediated drafts side-by-side in the Approval Center, log reviewer comments, request revisions, or stamp final approval for publication.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300 font-mono">
              <span>Creator → Reviewer → Manager</span>
              <span>Immutable Audit Trail</span>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Engine & Trust & Safety Section */}
      <section
        id="governance-engine"
        className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 py-12 border-t border-white/10"
      >
        <div
          id="trust-safety"
          className="rounded-[24px] bg-gradient-to-br from-indigo-950/60 via-[#0E1324] to-emerald-950/30 border border-white/15 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>RESPONSIBLE AI &amp; ZERO-FRICTION EVALUATION</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to test the full Enterprise Governance Suite?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore the Executive Bento Dashboard, test the AI Conveyor Content Scanner with sample or uploaded documents, customize rules in the Brand Knowledge Base, and sign off in the Approval Center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenRoleModal}
              className="px-5 py-3 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-indigo-300" />
              <span>Switch Role ({activeRole})</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchWorkspace('dashboard')}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-white text-[#090A0F] hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
            >
              <span>Enter Live Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
