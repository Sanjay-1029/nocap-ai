import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  PenTool,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onEnterWorkspace: () => void;
}

const ROLE_OPTIONS: {
  role: UserRole;
  badge: string;
  description: string;
  permissions: string[];
  icon: React.ReactNode;
}[] = [
  {
    role: 'Content Creator',
    badge: 'Stage 01 • Authoring',
    description:
      'Draft campaign copy, upload PDF/DOCX manuscripts, run the AI Conveyor Scanner, and customize suggested rewrites before submission.',
    permissions: ['Upload & edit drafts', 'Customize AI fixes', 'Submit to Approval Center'],
    icon: <PenTool className="w-5 h-5 text-indigo-600" />,
  },
  {
    role: 'Brand Reviewer',
    badge: 'Stage 02 • Policy Audit',
    description:
      'Inspect side-by-side audit diffs, verify AI vs. Human-Edited remediations, request revisions, or grant human sign-off approval.',
    permissions: ['Audit Before/After diffs', 'Request revisions', 'Grant sign-off approval'],
    icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
  },
  {
    role: 'Compliance Admin',
    badge: 'Stage 03 • Governance & Release',
    description:
      'Edit canonical Brand Truth Sheet rules, configure outbound Webhook endpoints, and issue cryptographic publishing release tokens.',
    permissions: ['Edit Truth Sheet rules', 'Configure Webhook endpoints', 'Issue rel_... release tokens'],
    icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
  },
];

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  onSelectRole,
  onEnterWorkspace,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl bg-white rounded-[20px] border border-slate-200 shadow-2xl overflow-hidden text-slate-900"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      Workspace Role Switcher &amp; Instant Access
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Zero Login Wall
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Select any enterprise persona to test role perspectives—or enter immediately with 1 click.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Cards */}
            <div className="p-6 space-y-3 bg-[#F6F7F9]">
              {ROLE_OPTIONS.map((item) => {
                const isSelected = activeRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      onSelectRole(item.role);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/15 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {item.role}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {item.badge}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                              Active Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          {item.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              ✓ {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onEnterWorkspace();
                  onClose();
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                Continue as Guest (No Credentials Required)
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onEnterWorkspace();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>Enter Workspace as {activeRole}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
