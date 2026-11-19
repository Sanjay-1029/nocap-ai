import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Send,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Copy,
  Check,
  Loader2,
  Terminal,
  ShieldAlert,
  Play,
} from 'lucide-react';
import {
  BrandRule,
  QueuedSubmission,
  UserRole,
  WebhookConfig,
  WebhookDispatchLog,
} from '../types';
import {
  evaluatePublishingGate,
  validateWebhookUrl,
  dispatchComplianceWebhook,
} from '../utils/webhookGate';

interface PublishingGatePanelProps {
  submission: QueuedSubmission;
  activeRules: BrandRule[];
  activeRole: UserRole;
  webhookConfig: WebhookConfig;
  onUpdateWebhookUrl: (url: string) => void;
  onRecordWebhookDispatch: (submissionId: string, log: WebhookDispatchLog) => void;
  onSwitchRole: (role: UserRole) => void;
}

export const PublishingGatePanel: React.FC<PublishingGatePanelProps> = ({
  submission,
  activeRules,
  activeRole,
  webhookConfig,
  onUpdateWebhookUrl,
  onRecordWebhookDispatch,
  onSwitchRole,
}) => {
  const [isDispatching, setIsDispatching] = useState<'LIVE' | 'SIMULATED' | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(
    submission.webhookLogs?.[0]?.id || null
  );

  const gate = evaluatePublishingGate(submission, activeRules.length);
  const isComplianceAdmin = activeRole === 'Compliance Admin';
  const releaseToken =
    submission.releaseToken ||
    `rel_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_pending`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(releaseToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1600);
  };

  const handleDispatch = async (mode: 'LIVE' | 'SIMULATED') => {
    if (!gate.unlocked || !isComplianceAdmin || isDispatching) return;

    if (mode === 'LIVE') {
      const check = validateWebhookUrl(webhookConfig.endpointUrl);
      if (!check.valid) {
        setUrlError(check.error || 'Invalid webhook URL');
        return;
      }
    }

    setUrlError(null);
    setIsDispatching(mode);
    try {
      const log = await dispatchComplianceWebhook({
        mode,
        endpointUrl: webhookConfig.endpointUrl,
        submission,
        releaseToken,
        activeRules,
        approverRole: activeRole,
      });
      onRecordWebhookDispatch(submission.id, log);
      setExpandedLogId(log.id);
    } finally {
      setIsDispatching(null);
    }
  };

  const logs = submission.webhookLogs || [];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-all ${
        gate.unlocked
          ? 'bg-white border-emerald-200 shadow-xs'
          : 'bg-slate-50/90 border-amber-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              gate.unlocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {gate.unlocked ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Publishing Gate &amp; Outbound Webhook Dispatch
              </h4>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  gate.unlocked
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {gate.unlocked ? 'UNLOCKED • READY TO SHIP' : 'LOCKED • GATE ENFORCED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requires 100% Brand Trust Score AND human reviewer/admin sign-off before releasing downstream.
            </p>
          </div>
        </div>

        {/* Cryptographic Release Token Pill (shown when unlocked) */}
        {gate.unlocked && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-700">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[190px]" title={releaseToken}>
              {releaseToken}
            </span>
            <button
              type="button"
              onClick={handleCopyToken}
              className="ml-1 text-slate-400 hover:text-white transition-colors"
              title="Copy Release Token"
            >
              {copiedToken ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* LOCKED STATE: Clear Blocking Reasons */}
      {!gate.unlocked ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {gate.blockingReasons.map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Blocked: {reason}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500">
              Complete all remediation items and grant human approval above to issue a cryptographic Release Token (<code className="font-mono">rel_...</code>) and unlock outbound dispatch.
            </p>
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Webhook Dispatch Locked</span>
            </button>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE: Role-gated Compliance Admin Webhook Configuration & Dispatch */
        <div className="space-y-3.5">
          {!isComplianceAdmin && (
            <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Viewing as <strong>{activeRole}</strong>. Outbound webhook endpoints &amp; release dispatches require <strong>Compliance Admin</strong> privileges.
                </span>
              </span>
              <button
                type="button"
                onClick={() => onSwitchRole('Compliance Admin')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0"
              >
                Switch to Compliance Admin
              </button>
            </div>
          )}

          {/* Webhook Endpoint Configuration + Dispatch Actions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
              <Webhook className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="url"
                disabled={!isComplianceAdmin || isDispatching !== null}
                value={webhookConfig.endpointUrl}
                onChange={(e) => {
                  setUrlError(null);
                  onUpdateWebhookUrl(e.target.value);
                }}
                placeholder="https://hooks.slack.com/services/... or custom CMS webhook URL"
                className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!isComplianceAdmin || isDispatching !== null}
                onClick={() => handleDispatch('LIVE')}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDispatching === 'LIVE' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Dispatch Live Webhook</span>
              </button>

              <button
                type="button"
                disabled={!isComplianceAdmin || isDispatching !== null}
                onClick={() => handleDispatch('SIMULATED')}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Simulate a production HTTP POST delivery with full headers, JSON payload, and 200 OK response log"
              >
                {isDispatching === 'SIMULATED' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Simulate Production Webhook Delivery</span>
              </button>
            </div>
          </div>

          {urlError && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {urlError}
            </p>
          )}

          {/* HTTP Dispatch Log Console */}
          {logs.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-600" />
                  Webhook Delivery Telemetry ({logs.length})
                </span>
                <span>Click an entry to inspect headers &amp; JSON payload</span>
              </div>

              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-800 bg-[#0B0F19] text-slate-200 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLogId((curr) => (curr === log.id ? null : log.id))
                      }
                      className="w-full px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.success
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          }`}
                        >
                          POST {log.statusText}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          {log.mode}
                        </span>
                        <span className="text-slate-300 truncate max-w-[300px]">
                          {log.endpointUrl}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-400">
                        <span className="text-emerald-400">{log.latencyMs}ms</span>
                        <span>{log.dispatchedAtUtc}</span>
                        {log.success && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-800 px-3.5 py-3 space-y-3 text-[11px] font-mono overflow-hidden"
                        >
                          <div>
                            <div className="text-indigo-400 font-semibold mb-1">
                              HTTP REQUEST HEADERS:
                            </div>
                            <pre className="p-2.5 rounded-lg bg-slate-950/90 text-slate-300 overflow-x-auto leading-relaxed">
                              {Object.entries(log.requestHeaders)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join('\n')}
                            </pre>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <div className="text-amber-300 font-semibold mb-1">
                                JSON COMPLIANCE PAYLOAD:
                              </div>
                              <pre className="p-2.5 rounded-lg bg-slate-950/90 text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                                {JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="text-emerald-400 font-semibold mb-1">
                                RESPONSE ({log.statusText}):
                              </div>
                              <pre className="p-2.5 rounded-lg bg-slate-950/90 text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
                                {log.responseBody}
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
