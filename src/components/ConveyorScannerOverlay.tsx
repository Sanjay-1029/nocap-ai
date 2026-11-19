import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  FileText,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ConveyorScannerOverlayProps {
  isScanning: boolean;
  activeRuleCount: number;
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
  hasVisualAsset?: boolean;
}

const TEXT_STEP_READOUTS = [
  'Checking Product Canon (FACT-01 • CloudPulse v4.2)...',
  'Verifying SLA Claims & Tier Pricing (FACT-02 • FACT-03)...',
  'Auditing Enterprise Brand Tone & ROI Claims (TONE-01 • COMP-01)...',
];

const MULTIMODAL_STEP_READOUTS = [
  'Checking Product Canon & Embedded Visual Copy (OCR / Vision)...',
  'Auditing Brand Color Palette, Contrast & Visual Hierarchy...',
  'Verifying SLA Claims, Pricing & Legal Disclosure Visibility...',
];

export const ConveyorScannerOverlay: React.FC<ConveyorScannerOverlayProps> = ({
  isScanning,
  activeRuleCount,
  engineUsed,
  hasVisualAsset = false,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const stepReadouts = hasVisualAsset
    ? MULTIMODAL_STEP_READOUTS
    : TEXT_STEP_READOUTS;

  useEffect(() => {
    if (!isScanning) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % stepReadouts.length);
    }, 680);
    return () => clearInterval(interval);
  }, [isScanning, stepReadouts.length]);

  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.22 }}
          className="rounded-[20px] bg-[#090A0F] bg-dark-circuit text-white border border-indigo-500/40 shadow-2xl p-5 sm:p-6 relative overflow-hidden shrink-0"
        >
          {/* Ambient Glows */}
          <div className="absolute -left-20 top-0 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 bottom-0 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                AI Inspection Conveyor Pipeline Active
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                {engineUsed} • {activeRuleCount} Rules Enforced
              </span>
            </div>

            {/* Live Step Readout Pill */}
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{stepReadouts[stepIndex]}</span>
            </motion.div>
          </div>

          {/* Horizontal Conveyor Track */}
          <div className="relative z-10 mt-5 py-4">
            {/* Illuminated Conveyor Belt Rail */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-800/90 border border-white/10 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-400 to-emerald-400"
              />
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              {/* Left Stage: Incoming Raw Document Packets */}
              <div className="flex items-center justify-center md:justify-start gap-3 overflow-hidden py-1">
                {[0, 1].map((packetIdx) => (
                  <motion.div
                    key={`in-${packetIdx}`}
                    initial={{ x: -35, opacity: 0.3 }}
                    animate={{ x: [0, 28, 56], opacity: [0.4, 1, 0.2] }}
                    transition={{
                      duration: 1.3,
                      delay: packetIdx * 0.45,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900/95 border border-indigo-400/40 shadow-lg flex items-center gap-2 shrink-0"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-300 font-semibold">
                        RAW PACKET 0{packetIdx + 1}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        Ingesting Claims...
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Center Stage: Glowing NoCap AI Governance Core Processor Node */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Pulsing Outer Circuit Ring */}
                  <motion.div
                    animate={{ scale: [1, 1.16, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-emerald-500/30 blur-md"
                  />
                  <div className="relative px-5 py-3.5 rounded-2xl bg-gradient-to-br from-indigo-950 via-[#11162B] to-slate-900 border-2 border-indigo-400 shadow-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold tracking-wide text-white flex items-center gap-1.5">
                        <span>NoCap AI Governance Core</span>
                      </div>
                      <div className="text-[10px] font-mono text-indigo-300 mt-0.5">
                        Semantic &amp; Rule Matrix Audit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Stage: Stamped Verification Packets Emerging */}
              <div className="flex items-center justify-center md:justify-end gap-3 overflow-hidden py-1">
                {[0, 1].map((outIdx) => (
                  <motion.div
                    key={`out-${outIdx}`}
                    initial={{ x: -30, opacity: 0.2 }}
                    animate={{ x: [0, 26, 48], opacity: [0.2, 1, 0.4] }}
                    transition={{
                      duration: 1.3,
                      delay: 0.25 + outIdx * 0.45,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-400/50 shadow-lg flex items-center gap-2 shrink-0"
                  >
                    {outIdx === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <div>
                      <div className="text-[10px] font-mono text-emerald-200 font-semibold">
                        {outIdx === 0 ? 'STAMPED • AUDITED' : 'DIFF FLAGGED'}
                      </div>
                      <div className="text-[9px] font-mono text-emerald-400/90">
                        Truth Sheet Verified
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="relative z-10 mt-2 flex items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Scanning manuscript against canonical CloudPulse Truth Sheet...
            </span>
            <span className="text-indigo-300">
              Step {stepIndex + 1} / {stepReadouts.length}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
