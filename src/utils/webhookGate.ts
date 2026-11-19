import {
  BrandRule,
  QueuedSubmission,
  UserRole,
  WebhookDispatchLog,
} from '../types';
import { computeSha256Hex } from './auditCertificate';

export interface PublishingGateEvaluation {
  unlocked: boolean;
  blockingReasons: string[];
}

/**
 * Evaluates the strict pre-publication compliance gate:
 * External publishing / webhook dispatch remains LOCKED until:
 * 1) Active Brand Truth Sheet rules > 0
 * 2) Brand Trust Score === 100% (0 open violations)
 * 3) Human approval sign-off has been granted (status === 'PUBLISHED')
 */
export function evaluatePublishingGate(
  submission: QueuedSubmission,
  activeRuleCount: number
): PublishingGateEvaluation {
  const blockingReasons: string[] = [];

  if (activeRuleCount === 0) {
    blockingReasons.push('0 active Brand Truth Sheet rules enforced');
  }

  const unresolvedCount = submission.resolvedViolations.filter(
    (v) => v.status === 'open'
  ).length;
  if (unresolvedCount > 0) {
    blockingReasons.push(
      `${unresolvedCount} unresolved violation${unresolvedCount === 1 ? '' : 's'} remaining`
    );
  }

  if (submission.finalScore < 100) {
    blockingReasons.push(
      `Brand Trust Score is ${submission.finalScore}% (100% required)`
    );
  }

  if (submission.status === 'CHANGES_REQUESTED') {
    blockingReasons.push('Revisions requested — awaiting creator resubmission & sign-off');
  } else if (submission.status !== 'PUBLISHED') {
    blockingReasons.push('Awaiting Brand Reviewer / Compliance Admin sign-off');
  }

  return {
    unlocked: blockingReasons.length === 0,
    blockingReasons,
  };
}

/**
 * Generates a cryptographic Release Token (`rel_YYYYMMDD_<16-hex>`) using Web Crypto SHA-256.
 */
export async function generateReleaseToken(
  submissionId: string,
  finalDraft: string,
  approverRole: UserRole
): Promise<string> {
  const issuedIso = new Date().toISOString();
  const datePart = issuedIso.slice(0, 10).replace(/-/g, '');
  const digest = await computeSha256Hex(
    `${submissionId}|${finalDraft}|${approverRole}|${issuedIso}`
  );
  return `rel_${datePart}_${digest.slice(0, 16)}`;
}

export function validateWebhookUrl(rawUrl: string): { valid: boolean; error?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Enter a valid HTTPS webhook endpoint URL.' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Webhook URL must begin with https:// or http://' };
    }
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Example: https://hooks.slack.com/services/...',
    };
  }
}

export async function buildWebhookCompliancePayload(params: {
  submission: QueuedSubmission;
  releaseToken: string;
  activeRules: BrandRule[];
  approverRole: UserRole;
}): Promise<{
  certificateId: string;
  sha256Hash: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
}> {
  const timestampUtc = new Date().toISOString();
  const dateCompact = timestampUtc.slice(0, 10).replace(/-/g, '');
  const sha256Hash = await computeSha256Hex(params.submission.finalDraft);
  const visualHash = params.submission.visualAsset?.base64Data
    ? await computeSha256Hex(params.submission.visualAsset.base64Data)
    : undefined;
  const certificateId = `NOCAP-CERT-${dateCompact}-${sha256Hash.slice(0, 6).toUpperCase()}`;

  const payload: Record<string, unknown> = {
    event: 'nocap.content.approved_release',
    release_token: params.releaseToken,
    certificate_id: certificateId,
    document_title: params.submission.title,
    final_text: params.submission.finalDraft,
    brand_trust_score: params.submission.finalScore,
    initial_trust_score: params.submission.initialScore,
    sha256_hash: sha256Hash,
    ...(visualHash ? { visual_asset_sha256: visualHash } : {}),
    approver_role: params.submission.approvedByRole || params.approverRole,
    verification_engine: params.submission.engineUsed,
    active_rules_count: params.activeRules.length,
    remediated_flags_count: params.submission.resolvedViolations.length,
    timestamp_utc: timestampUtc,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-NoCap-Event': 'nocap.content.approved_release',
    'X-NoCap-Release-Token': params.releaseToken,
    'X-NoCap-Certificate-ID': certificateId,
    'X-NoCap-Signature-SHA256': sha256Hash,
  };

  return { certificateId, sha256Hash, headers, payload };
}

/**
 * Dispatches either a live HTTP POST webhook (with 8s AbortController timeout)
 * OR a built-in realistic "Simulate Production Webhook Delivery" returning exact request/response telemetry.
 */
export async function dispatchComplianceWebhook(params: {
  mode: 'LIVE' | 'SIMULATED';
  endpointUrl: string;
  submission: QueuedSubmission;
  releaseToken: string;
  activeRules: BrandRule[];
  approverRole: UserRole;
}): Promise<WebhookDispatchLog> {
  const startMs = Date.now();
  const targetUrl =
    params.mode === 'SIMULATED'
      ? params.endpointUrl.trim() ||
        'https://api.cloudpulse-cms.example.com/v2/webhooks/nocap-release-gate'
      : params.endpointUrl.trim();

  const { certificateId, headers, payload } = await buildWebhookCompliancePayload({
    submission: params.submission,
    releaseToken: params.releaseToken,
    activeRules: params.activeRules,
    approverRole: params.approverRole,
  });

  if (params.mode === 'SIMULATED') {
    await new Promise((resolve) => setTimeout(resolve, 620));
    const latencyMs = Math.max(94, Date.now() - startMs);
    const simulatedResponse = JSON.stringify(
      {
        ok: true,
        status: 'ACCEPTED_FOR_PUBLICATION',
        delivery_id: `dlv_${Date.now().toString(36)}`,
        verified_release_token: params.releaseToken,
        certificate_id: certificateId,
        received_at_utc: new Date().toISOString(),
      },
      null,
      2
    );

    return {
      id: `wh-${Date.now()}`,
      dispatchedAtUtc: new Date().toISOString(),
      mode: 'SIMULATED',
      endpointUrl: targetUrl,
      releaseToken: params.releaseToken,
      certificateId,
      statusCode: 200,
      statusText: '200 OK',
      latencyMs,
      requestHeaders: headers,
      requestPayload: payload,
      responseBody: simulatedResponse,
      success: true,
    };
  }

  // Live HTTP POST dispatch with 8-second AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startMs;
    const bodyText = await res.text().catch(() => '');

    return {
      id: `wh-${Date.now()}`,
      dispatchedAtUtc: new Date().toISOString(),
      mode: 'LIVE',
      endpointUrl: targetUrl,
      releaseToken: params.releaseToken,
      certificateId,
      statusCode: res.status,
      statusText: `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Error')}`,
      latencyMs,
      requestHeaders: headers,
      requestPayload: payload,
      responseBody:
        bodyText.trim() ||
        JSON.stringify({ ok: res.ok, status: res.status }, null, 2),
      success: res.ok,
    };
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      id: `wh-${Date.now()}`,
      dispatchedAtUtc: new Date().toISOString(),
      mode: 'LIVE',
      endpointUrl: targetUrl,
      releaseToken: params.releaseToken,
      certificateId,
      statusCode: 0,
      statusText: isTimeout ? 'TIMEOUT (8s)' : 'NETWORK / CORS BLOCKED',
      latencyMs,
      requestHeaders: headers,
      requestPayload: payload,
      responseBody: isTimeout
        ? 'Request timed out after 8000ms. Verify endpoint availability or use Simulate Production Webhook Delivery.'
        : 'Browser CORS policy or network error prevented direct response inspection. For browser demos, use "Simulate Production Webhook Delivery" or a CORS-enabled webhook receiver (e.g., webhook.site).',
      success: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
