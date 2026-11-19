import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ScanText,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  KeyRound,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  Home,
} from 'lucide-react';
import { NavSection, UserRole } from '../types';

interface NavbarProps {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  onOpenRoleModal: () => void;
  onBackToLanding: () => void;
  pendingQueueCount: number;
  activeRuleCount: number;
  openViolationCount: number;
  apiKey: string;
  setApiKey: (key: string) => void;
  showGuide: boolean;
  onToggleGuide: () => void;
}

const ALL_ROLES: UserRole[] = [
  'Content Creator',
  'Brand Reviewer',
  'Compliance Admin',
];

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  activeRole,
  setActiveRole,
  onOpenRoleModal,
  onBackToLanding,
  pendingQueueCount,
  activeRuleCount,
  openViolationCount,
  apiKey,
  setApiKey,
  showGuide,
  onToggleGuide,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const hasCustomKey = apiKey.trim().length > 5;

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeTone?: 'indigo' | 'amber' | 'rose' | 'slate';
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'scanner',
      label: 'Content Scanner',
      icon: <ScanText className="w-4 h-4" />,
      badge: openViolationCount > 0 ? openViolationCount : undefined,
      badgeTone: 'rose',
    },
    {
      id: 'knowledge',
      label: 'Brand Knowledge Base',
      icon: <BookOpen className="w-4 h-4" />,
      badge: `${activeRuleCount}`,
      badgeTone: activeRuleCount === 0 ? 'rose' : 'slate',
    },
    {
      id: 'approval',
      label: 'Approval Center',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingQueueCount > 0 ? pendingQueueCount : undefined,
      badgeTone: 'amber',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const getBadgeStyle = (
    tone?: 'indigo' | 'amber' | 'rose' | 'slate',
    isActive?: boolean
  ) => {
    if (isActive) {
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
    switch (tone) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 w-[250px] select-none">
      {/* Top Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveSection('dashboard');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#14532D] to-[#064E3B] group-hover:opacity-95 transition-opacity flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                NoCap AI
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Brand Governance Studio
            </p>
          </div>
        </button>

        {mobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Role Switcher Dropdown (1-Click Perspective Switcher for Judges) */}
      <div className="px-3 pt-3 pb-1 relative">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center justify-between">
          <span>Active Persona</span>
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="text-indigo-600 hover:underline font-medium normal-case"
          >
            Role Details
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRoleDropdownOpen((p) => !p)}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="text-left truncate">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {activeRole}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                CloudPulse Enterprise v4.2
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              roleDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {roleDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-3 right-3 mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5"
            >
              {ALL_ROLES.map((r) => {
                const isSelected = r === activeRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#14532D] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={isActive ? 'text-emerald-300' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-full border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/25'
                      : getBadgeStyle(item.badgeTone, isActive)
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onBackToLanding();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Landing Hero Overview</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sidebar Utilities */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/60 shrink-0">
        {/* Gemini API Key Status Pill */}
        <button
          type="button"
          onClick={() => setShowKeyModal(true)}
          className="w-full px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound
              className={`w-3.5 h-3.5 shrink-0 ${
                hasCustomKey ? 'text-emerald-600' : 'text-indigo-600'
              }`}
            />
            <div className="truncate">
              <div className="text-xs font-medium text-slate-700 truncate">
                Gemini API Key
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {hasCustomKey ? 'Gemini 2.5 Flash Active' : 'Smart Fallback Active'}
              </div>
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              hasCustomKey ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
          />
        </button>

        {/* ? Quick Walkthrough Trigger */}
        <button
          type="button"
          onClick={() => {
            onToggleGuide();
            setMobileMenuOpen(false);
          }}
          className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
            showGuide
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quick Walkthrough</span>
          </span>
          <span className="text-[10px] font-mono opacity-80">
            {showGuide ? 'Active' : '3 Steps'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar (250px) */}
      <aside className="hidden lg:block w-[250px] shrink-0 h-screen sticky top-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Top Header Bar */}
      <div className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#14532D] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">NoCap AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
          >
            <UserCheck className="w-3 h-3" />
            <span>{activeRole.split(' ')[1]}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('approval')}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 flex items-center gap-1.5"
          >
            <span>Queue</span>
            {pendingQueueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800">
                {pendingQueueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
            />
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ duration: 0.18 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[250px] lg:hidden"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clean Enterprise Modal for Gemini API Key */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-white rounded-[20px] border border-slate-200 shadow-xl p-6"
            >
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      AI Verification Engine Configuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gemini 2.5 Flash API or Built-in Deterministic Engine
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide an optional <strong>Gemini 2.5 Flash</strong> API key for live semantic LLM verification. If left blank, NoCap AI automatically uses the built-in deterministic rule engine so you can test with zero setup.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Gemini API Key (stored locally in browser)
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/15">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-transparent text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      {showKeyText ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Active Engine:
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {hasCustomKey ? 'Gemini 2.5 Flash API' : 'Built-in Smart Engine'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Clear Key
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  Save &amp; Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
