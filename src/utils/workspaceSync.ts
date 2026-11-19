import { WorkspaceSnapshot } from '../types';

export const WORKSPACE_STORAGE_KEY = 'nocap_ai_workspace_v3';
const BROADCAST_CHANNEL_NAME = 'nocap_ai_workspace_sync_v3';
const WORKSPACE_SCHEMA_VERSION = 3;

export const CURRENT_TAB_ID = `tab-${Math.random().toString(36).slice(2, 9)}`;

export interface SyncStatusInfo {
  mode: 'CLOUD_SYNC' | 'MULTI_TAB_SYNC';
  label: string;
  providerName: string;
  cloudConfigured: boolean;
}

interface CloudEnvConfig {
  url: string;
  key: string;
  provider: 'supabase' | 'firebase' | 'custom' | null;
}

function getCloudEnvConfig(): CloudEnvConfig {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env;
  const url = (env?.VITE_CLOUD_SYNC_URL || '').trim().replace(/\/+$/, '');
  const key = (env?.VITE_CLOUD_SYNC_KEY || '').trim();

  if (!url) {
    return { url: '', key: '', provider: null };
  }

  const lower = url.toLowerCase();
  if (lower.includes('supabase.co') || lower.includes('supabase.in')) {
    return { url, key, provider: 'supabase' };
  }
  if (lower.includes('firebaseio.com') || lower.includes('firebasedatabase.app')) {
    return { url, key, provider: 'firebase' };
  }
  return { url, key, provider: 'custom' };
}

export function getSyncStatusInfo(): SyncStatusInfo {
  const cfg = getCloudEnvConfig();
  if (cfg.url) {
    const providerName =
      cfg.provider === 'supabase'
        ? 'Supabase Cloud'
        : cfg.provider === 'firebase'
        ? 'Firebase Realtime'
        : 'Cloud REST Sync';
    return {
      mode: 'CLOUD_SYNC',
      label: 'Synced • Cloud Ready',
      providerName,
      cloudConfigured: true,
    };
  }

  return {
    mode: 'MULTI_TAB_SYNC',
    label: 'Live Multi-Tab Sync',
    providerName: 'BroadcastChannel + Local Store',
    cloudConfigured: false,
  };
}

/**
 * Strips heavy raw image dataUrls from submissions only if needed to fit browser storage quotas safely.
 */
function sanitizeForStorage(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    submissions: snapshot.submissions.map((sub) => {
      if (!sub.visualAsset) return sub;
      // Keep thumbnail metadata if small (< 220 KB), otherwise strip heavy base64 for localStorage safety
      if (sub.visualAsset.dataUrl.length > 220_000) {
        return {
          ...sub,
          visualAsset: {
            ...sub.visualAsset,
            base64Data: sub.visualAsset.base64Data.slice(0, 64),
          },
        };
      }
      return sub;
    }),
  };
}

/**
 * Loads persisted workspace state from localStorage (synchronous instant hydration on reload).
 */
export function loadLocalWorkspaceSnapshot(): WorkspaceSnapshot | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSnapshot>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.rules) ||
      typeof parsed.draftText !== 'string' ||
      !Array.isArray(parsed.submissions)
    ) {
      return null;
    }
    return {
      version: parsed.version || WORKSPACE_SCHEMA_VERSION,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      updatedByTabId: parsed.updatedByTabId || 'persisted',
      rules: parsed.rules,
      draftTitle: parsed.draftTitle || 'CloudPulse v4.2 Global Launch Announcement',
      originalBaselineDraft: parsed.originalBaselineDraft ?? parsed.draftText,
      draftText: parsed.draftText,
      violations: Array.isArray(parsed.violations) ? parsed.violations : [],
      initialScanScore:
        typeof parsed.initialScanScore === 'number' ? parsed.initialScanScore : 100,
      auditTrail: Array.isArray(parsed.auditTrail) ? parsed.auditTrail : [],
      submissions: parsed.submissions,
      webhookConfig: parsed.webhookConfig || {
        endpointUrl: '',
        secretHeaderName: 'X-NoCap-Release-Token',
        autoIncludeVisualHash: true,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Fetches latest workspace snapshot from optional Supabase/Firebase cloud backend if configured.
 */
export async function fetchCloudWorkspaceSnapshot(): Promise<WorkspaceSnapshot | null> {
  const cfg = getCloudEnvConfig();
  if (!cfg.url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    if (cfg.provider === 'firebase') {
      const endpoint = cfg.key
        ? `${cfg.url}/nocap_workspace.json?auth=${encodeURIComponent(cfg.key)}`
        : `${cfg.url}/nocap_workspace.json`;
      const res = await fetch(endpoint, { signal: controller.signal });
      if (!res.ok) return null;
      const data = await res.json();
      return data && Array.isArray(data.rules) ? (data as WorkspaceSnapshot) : null;
    }

    if (cfg.provider === 'supabase') {
      const endpoint = `${cfg.url}/rest/v1/nocap_workspaces?id=eq.default&select=payload`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const rows = await res.json();
      const payload = Array.isArray(rows) ? rows[0]?.payload : null;
      return payload && Array.isArray(payload.rules)
        ? (payload as WorkspaceSnapshot)
        : null;
    }

    const res = await fetch(`${cfg.url}/workspace`, {
      headers: cfg.key ? { Authorization: `Bearer ${cfg.key}` } : undefined,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && Array.isArray(data.rules) ? (data as WorkspaceSnapshot) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Pushes workspace snapshot to optional external Supabase/Firebase backend (non-blocking).
 */
async function pushCloudWorkspaceSnapshot(snapshot: WorkspaceSnapshot): Promise<boolean> {
  const cfg = getCloudEnvConfig();
  if (!cfg.url) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    if (cfg.provider === 'firebase') {
      const endpoint = cfg.key
        ? `${cfg.url}/nocap_workspace.json?auth=${encodeURIComponent(cfg.key)}`
        : `${cfg.url}/nocap_workspace.json`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
        signal: controller.signal,
      });
      return res.ok;
    }

    if (cfg.provider === 'supabase') {
      const endpoint = `${cfg.url}/rest/v1/nocap_workspaces`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: 'default',
          updated_at: snapshot.updatedAt,
          payload: snapshot,
        }),
        signal: controller.signal,
      });
      return res.ok;
    }

    const res = await fetch(`${cfg.url}/workspace`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify(snapshot),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

let sharedChannel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return sharedChannel;
}

/**
 * Saves workspace state locally, broadcasts immediately to all open tabs,
 * and asynchronously syncs to optional cloud credentials if configured.
 */
export function persistAndBroadcastWorkspace(
  snapshot: Omit<WorkspaceSnapshot, 'version' | 'updatedAt' | 'updatedByTabId'>
): WorkspaceSnapshot {
  const fullSnapshot: WorkspaceSnapshot = {
    ...snapshot,
    version: WORKSPACE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    updatedByTabId: CURRENT_TAB_ID,
  };

  const safeSnapshot = sanitizeForStorage(fullSnapshot);

  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(safeSnapshot));
  } catch {
    // Fallback if storage quota is very tight: strip visualAsset from queued submissions
    try {
      const slimSnapshot: WorkspaceSnapshot = {
        ...safeSnapshot,
        submissions: safeSnapshot.submissions.map((s) => ({
          ...s,
          visualAsset: undefined,
        })),
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(slimSnapshot));
    } catch {
      // Ignore storage errors in privacy-locked browsers
    }
  }

  try {
    getChannel()?.postMessage({
      type: 'WORKSPACE_SYNC',
      snapshot: safeSnapshot,
    });
  } catch {
    // Ignore broadcast errors
  }

  // Fire-and-forget cloud sync if configured via .env
  void pushCloudWorkspaceSnapshot(safeSnapshot);

  return safeSnapshot;
}

/**
 * Clears local workspace storage and notifies all other tabs to reset to clean demo state.
 */
export function clearAndBroadcastWorkspaceReset(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // Ignore
  }
  try {
    getChannel()?.postMessage({
      type: 'WORKSPACE_RESET',
      senderTabId: CURRENT_TAB_ID,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Ignore
  }
}

/**
 * Subscribes to live cross-tab workspace updates (BroadcastChannel + storage event fallback).
 */
export function subscribeToWorkspaceSync(
  onRemoteUpdate: (snapshot: WorkspaceSnapshot) => void,
  onRemoteReset: () => void
): () => void {
  const channel = getChannel();

  const handleChannelMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'WORKSPACE_SYNC' && msg.snapshot) {
      const incoming = msg.snapshot as WorkspaceSnapshot;
      if (incoming.updatedByTabId !== CURRENT_TAB_ID) {
        onRemoteUpdate(incoming);
      }
    } else if (msg.type === 'WORKSPACE_RESET' && msg.senderTabId !== CURRENT_TAB_ID) {
      onRemoteReset();
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== WORKSPACE_STORAGE_KEY) return;
    if (!event.newValue) {
      onRemoteReset();
      return;
    }
    try {
      const incoming = JSON.parse(event.newValue) as WorkspaceSnapshot;
      if (incoming && incoming.updatedByTabId !== CURRENT_TAB_ID) {
        onRemoteUpdate(incoming);
      }
    } catch {
      // Ignore malformed JSON
    }
  };

  channel?.addEventListener('message', handleChannelMessage);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    channel?.removeEventListener('message', handleChannelMessage);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}
