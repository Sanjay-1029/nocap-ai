import { jsPDF } from 'jspdf';
import {
  BrandRule,
  ComplianceCertificateData,
  ReviewerComment,
  UserRole,
  Violation,
  VisualAsset,
} from '../types';

/**
 * Pure-JS SHA-256 fallback (used only if Web Crypto API crypto.subtle is unavailable).
 */
function sha256FallbackHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const W = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        ((W[i - 15] >>> 7) | (W[i - 15] << 25)) ^
        ((W[i - 15] >>> 18) | (W[i - 15] << 14)) ^
        (W[i - 15] >>> 3);
      const s1 =
        ((W[i - 2] >>> 17) | (W[i - 2] << 15)) ^
        ((W[i - 2] >>> 19) | (W[i - 2] << 13)) ^
        (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Computes a SHA-256 hex digest using the browser Web Crypto API (`crypto.subtle.digest`).
 */
export async function computeSha256Hex(text: string): Promise<string> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.digest === 'function'
    ) {
      const data = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fall back to deterministic pure-JS SHA-256
  }
  return sha256FallbackHex(text);
}

export interface BuildCertificateParams {
  documentTitle: string;
  originalDraft: string;
  remediatedDraft: string;
  initialScore: number;
  finalScore: number;
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
  activeRules: BrandRule[];
  violations: Violation[];
  workflowStage: string;
  workflowStatus: string;
  signerRole: UserRole;
  signedOffAtUtc?: string | null;
  reviewerComments?: ReviewerComment[];
  auditEventCount: number;
  visualAsset?: VisualAsset | null;
}

export async function buildComplianceCertificate(
  params: BuildCertificateParams
): Promise<ComplianceCertificateData> {
  const issuedAtUtc = new Date().toISOString();
  const dateCompact = issuedAtUtc.slice(0, 10).replace(/-/g, '');

  const [originalDraftSha256, remediatedDraftSha256, visualAssetSha256] =
    await Promise.all([
      computeSha256Hex(params.originalDraft),
      computeSha256Hex(params.remediatedDraft),
      params.visualAsset?.base64Data
        ? computeSha256Hex(params.visualAsset.base64Data)
        : Promise.resolve(undefined),
    ]);

  const shortNonce = remediatedDraftSha256.slice(0, 6).toUpperCase();
  const certificateId = `NOCAP-CERT-${dateCompact}-${shortNonce}`;

  const canonicalSignatureInput = JSON.stringify({
    certificateId,
    issuedAtUtc,
    originalDraftSha256,
    remediatedDraftSha256,
    visualAssetSha256,
    initialScore: params.initialScore,
    finalScore: params.finalScore,
    signerRole: params.signerRole,
    workflowStatus: params.workflowStatus,
  });
  const certificateDigestSha256 = await computeSha256Hex(
    canonicalSignatureInput
  );

  const complianceStatus =
    params.workflowStatus === 'PUBLISHED'
      ? 'APPROVED_AND_PUBLISHED'
      : params.finalScore >= 100
      ? 'VERIFIED_COMPLIANT'
      : 'AUDIT_COMPLETED';

  const visualFindings = params.violations.filter((v) => v.source === 'VISUAL');

  return {
    certificateId,
    issuedAtUtc,
    platform: 'NoCap AI Enterprise Brand Governance Platform v2.5',
    documentTitle: params.documentTitle || 'Untitled Campaign Manuscript',
    verificationEngine: params.engineUsed,
    cryptographicProof: {
      algorithm: 'SHA-256',
      originalDraftSha256,
      remediatedDraftSha256,
      ...(visualAssetSha256 ? { visualAssetSha256 } : {}),
      certificateDigestSha256,
    },
    trustScore: {
      initialScore: params.initialScore,
      finalScore: params.finalScore,
      improvementDelta: Math.max(0, params.finalScore - params.initialScore),
      complianceStatus,
    },
    ...(params.visualAsset
      ? {
          visualAudit: {
            included: true,
            assetName: params.visualAsset.name,
            format: params.visualAsset.format,
            dimensions: `${params.visualAsset.width}x${params.visualAsset.height}px`,
            fileSizeBytes: params.visualAsset.sizeBytes,
            dominantColors: params.visualAsset.dominantColors,
            findingsCount: visualFindings.length,
            remediatedCount: visualFindings.filter((v) => v.status !== 'open')
              .length,
          },
        }
      : {}),
    activeRulesEvaluated: params.activeRules.map((r) => ({
      code: r.code,
      category: r.category,
      title: r.title,
      description: r.description,
    })),
    violationsRemediated: params.violations.map((v) => ({
      ruleCode: v.ruleCode,
      ruleTitle: v.ruleTitle,
      source: v.source === 'VISUAL' ? 'VISUAL' : 'TEXT',
      ...(v.visualElement ? { visualElement: v.visualElement } : {}),
      severity: v.severity,
      occurrenceCount:
        v.appliedReplacementCount ||
        v.occurrenceCount ||
        v.occurrences?.length ||
        1,
      lines: Array.from(
        new Set((v.occurrences || []).map((o) => o.lineNumber))
      ),
      before:
        v.matchedPhrases && v.matchedPhrases.length > 1
          ? v.matchedPhrases.join(' | ')
          : v.offendingPhrase,
      after:
        v.status === 'overridden'
          ? '[Retained via Logged Human Override]'
          : v.suggestedFix,
      resolutionType:
        v.status === 'overridden'
          ? 'HUMAN_OVERRIDDEN'
          : v.isHumanEdited
          ? 'HUMAN_EDITED_FIX'
          : 'AI_FIX',
    })),
    approvalWorkflow: {
      stage: params.workflowStage,
      status: params.workflowStatus,
      signerRole: params.signerRole,
      signedOffAtUtc: params.signedOffAtUtc ?? null,
      reviewerComments: params.reviewerComments || [],
      auditEventCount: params.auditEventCount,
    },
  };
}

function makeSafeFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slug || 'nocap-audit';
}

/**
 * Downloads a machine-readable JSON Compliance Audit Certificate.
 */
export function downloadAuditCertificateJson(
  cert: ComplianceCertificateData
): void {
  const jsonText = JSON.stringify(cert, null, 2);
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${makeSafeFilename(cert.documentTitle)}-${cert.certificateId.toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a signed executive PDF Compliance Audit Certificate using jsPDF.
 */
export function downloadAuditCertificatePdf(
  cert: ComplianceCertificateData
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 46;
    }
  };

  // 1. Dark Obsidian / Emerald Header Banner
  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 108, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 104, pageWidth, 4, 'F');

  doc.setTextColor(16, 185, 129);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('NOCAP AI // SIGNED PRE-PUBLICATION COMPLIANCE AUDIT CERTIFICATE', margin, 32);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(cert.documentTitle, contentWidth - 140);
  doc.text(titleLines.slice(0, 2), margin, 56);

  doc.setTextColor(148, 163, 184);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Certificate ID: ${cert.certificateId}`, margin, 86);
  doc.text(`Issued (UTC):   ${cert.issuedAtUtc}`, margin + 235, 86);

  // Verified Status Pill (top right)
  doc.setFillColor(20, 83, 45);
  doc.roundedRect(pageWidth - margin - 128, 36, 128, 34, 6, 6, 'F');
  doc.setTextColor(167, 243, 208);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('TRUST SCORE', pageWidth - margin - 64, 49, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(
    `${cert.trustScore.initialScore}% -> ${cert.trustScore.finalScore}%`,
    pageWidth - margin - 64,
    63,
    { align: 'center' }
  );

  y = 128;

  // 2. Executive Metrics Strip
  const colW = (contentWidth - 24) / 3;
  const metricBoxes = [
    {
      label: 'VERIFICATION ENGINE',
      value: cert.verificationEngine,
      sub: `${cert.activeRulesEvaluated.length} Active Rules Evaluated`,
    },
    {
      label: 'COMPLIANCE STATUS',
      value: cert.trustScore.complianceStatus.replace(/_/g, ' '),
      sub: `+${cert.trustScore.improvementDelta}% Trust Score Gain`,
    },
    {
      label: 'WORKFLOW SIGN-OFF',
      value: cert.approvalWorkflow.signerRole,
      sub: `Stage: ${cert.approvalWorkflow.stage}`,
    },
  ];

  metricBoxes.forEach((box, idx) => {
    const x = margin + idx * (colW + 12);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, colW, 56, 6, 6, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(box.label, x + 10, y + 16);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(box.value, colW - 20)[0], x + 10, y + 32);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(box.sub, colW - 20)[0], x + 10, y + 46);
  });

  y += 74;

  // 3. Cryptographic Integrity Proof (SHA-256)
  const cryptoBoxHeight = cert.cryptographicProof.visualAssetSha256 ? 110 : 92;
  ensureSpace(cryptoBoxHeight + 16);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, cryptoBoxHeight, 6, 6, 'FD');

  doc.setTextColor(79, 70, 229);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('CRYPTOGRAPHIC INTEGRITY PROOF (WEB CRYPTO SHA-256)', margin + 12, y + 18);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Original Draft SHA-256:    ${cert.cryptographicProof.originalDraftSha256}`,
    margin + 12,
    y + 38
  );
  doc.text(
    `Remediated Text SHA-256:   ${cert.cryptographicProof.remediatedDraftSha256}`,
    margin + 12,
    y + 56
  );
  let digestY = y + 74;
  if (cert.cryptographicProof.visualAssetSha256) {
    doc.setTextColor(109, 40, 217);
    doc.text(
      `Visual Creative SHA-256:   ${cert.cryptographicProof.visualAssetSha256}`,
      margin + 12,
      y + 74
    );
    digestY = y + 92;
  }
  doc.setTextColor(5, 150, 105);
  doc.text(
    `Certificate Digest Proof:  ${cert.cryptographicProof.certificateDigestSha256}`,
    margin + 12,
    digestY
  );

  y += cryptoBoxHeight + 18;

  // 3b. Optional Multimodal Visual & Layout Governance Summary
  if (cert.visualAudit?.included) {
    ensureSpace(78);
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(196, 181, 253);
    doc.roundedRect(margin, y, contentWidth, 64, 6, 6, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(109, 40, 217);
    doc.text('MULTIMODAL VISUAL & LAYOUT BRAND AUDIT', margin + 12, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Asset: ${cert.visualAudit.assetName}  |  Format: ${cert.visualAudit.format}  |  Dimensions: ${cert.visualAudit.dimensions}`,
      margin + 12,
      y + 34
    );
    doc.text(
      `Sampled Palette: ${cert.visualAudit.dominantColors.join(', ')}  |  Visual Findings Remediated: ${cert.visualAudit.remediatedCount}/${cert.visualAudit.findingsCount}`,
      margin + 12,
      y + 50
    );

    y += 80;
  }

  // 4. Remediated Violations Ledger (Before -> After)
  ensureSpace(60);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Violations Remediated (${cert.violationsRemediated.length} Rule Flag(s))`,
    margin,
    y
  );
  y += 14;

  if (cert.violationsRemediated.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text(
      'Zero brand, factual, visual, or compliance violations detected on initial scan.',
      margin,
      y + 8
    );
    y += 24;
  } else {
    for (const v of cert.violationsRemediated) {
      const isVisual = v.source === 'VISUAL';
      const prefixLabel = isVisual
        ? `Visual Element (${v.visualElement || 'Creative'}): "${v.before}"`
        : `Before (${v.occurrenceCount}x${v.lines.length ? ` • Lines ${v.lines.join(', ')}` : ''}): "${v.before}"`;
      const beforeLines = doc.splitTextToSize(prefixLabel, contentWidth - 24);
      const afterLines = doc.splitTextToSize(
        `${isVisual ? 'Guidance' : 'After'}  (${v.resolutionType.replace(/_/g, ' ')}): "${v.after}"`,
        contentWidth - 24
      );
      const boxHeight = 26 + (beforeLines.length + afterLines.length) * 11 + 10;
      ensureSpace(boxHeight + 8);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(isVisual ? 196 : 226, isVisual ? 181 : 232, isVisual ? 253 : 240);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 5, 5, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isVisual ? 109 : 15, isVisual ? 40 : 23, isVisual ? 217 : 42);
      doc.text(
        `${isVisual ? '[VISUAL AUDIT] ' : ''}[${v.ruleCode}] ${v.ruleTitle} — ${v.severity}`,
        margin + 10,
        y + 16
      );

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(190, 18, 60);
      doc.text(beforeLines, margin + 10, y + 30);

      const afterY = y + 30 + beforeLines.length * 11 + 3;
      doc.setTextColor(5, 150, 105);
      doc.text(afterLines, margin + 10, afterY);

      y += boxHeight + 8;
    }
  }

  y += 8;

  // 5. Active Truth Sheet Rules Evaluated
  ensureSpace(60);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Active Truth Sheet Rules Evaluated (${cert.activeRulesEvaluated.length})`,
    margin,
    y
  );
  y += 14;

  for (const r of cert.activeRulesEvaluated) {
    const descLines = doc.splitTextToSize(
      `${r.code} (${r.category}) — ${r.title}: ${r.description}`,
      contentWidth - 16
    );
    const rowH = descLines.length * 11 + 10;
    ensureSpace(rowH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, rowH, 4, 4, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    doc.text(descLines, margin + 8, y + 12);
    y += rowH + 4;
  }

  y += 10;

  // 6. Approval Workflow & Human Sign-Off Metadata
  ensureSpace(72);
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, 64, 6, 6, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text('HUMAN-IN-THE-LOOP APPROVAL & SIGN-OFF METADATA', margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Workflow Stage: ${cert.approvalWorkflow.stage}   |   Status: ${cert.approvalWorkflow.status}`,
    margin + 12,
    y + 34
  );
  doc.text(
    `Authorized Persona: ${cert.approvalWorkflow.signerRole}   |   Signed Off (UTC): ${cert.approvalWorkflow.signedOffAtUtc || cert.issuedAtUtc}   |   Audit Events: ${cert.approvalWorkflow.auditEventCount}`,
    margin + 12,
    y + 50
  );

  // Footer across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by ${cert.platform} • ${cert.certificateId} • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  doc.save(
    `${makeSafeFilename(cert.documentTitle)}-${cert.certificateId.toLowerCase()}.pdf`
  );
}
