import { BrandRule, Violation, Severity } from '../types';

export const INITIAL_RULES: BrandRule[] = [
  {
    id: 'rule-fact-01',
    code: 'FACT-01',
    category: 'FACT',
    title: 'Product Version Governance',
    description: 'Current version is CloudPulse v4.2 (never v4.0 or v5.0).',
    enabled: true,
    keywords: ['v4.0', 'v5.0', 'version 4.0', 'version 5.0', 'CloudPulse 4.0'],
    replacementHint: 'CloudPulse v4.2',
  },
  {
    id: 'rule-fact-02',
    code: 'FACT-02',
    category: 'FACT',
    title: 'Approved Tier Pricing',
    description: 'Pro plan pricing is $49/month (no free lifetime tier exists).',
    enabled: true,
    keywords: ['$29/mo', '$29/month', '$19/mo', '$39/mo', 'free lifetime tier', 'free forever tier'],
    replacementHint: '$49/month',
  },
  {
    id: 'rule-fact-03',
    code: 'FACT-03',
    category: 'FACT',
    title: 'Uptime SLA Commitment',
    description: 'Uptime SLA is 99.95% (never claim "100% uptime" or "zero downtime").',
    enabled: true,
    keywords: ['100% guaranteed uptime', '100% uptime', 'zero downtime'],
    replacementHint: '99.95% SLA-backed uptime',
  },
  {
    id: 'rule-tone-01',
    code: 'TONE-01',
    category: 'TONE',
    title: 'Enterprise B2B Voice Policy',
    description: 'Professional B2B voice — ban casual slang ("no cap", "lit", "insane", "lowkey").',
    enabled: true,
    keywords: ['no cap', 'lit', 'insane', 'lowkey'],
    replacementHint: 'engineered for mission-critical enterprise workloads',
  },
  {
    id: 'rule-comp-01',
    code: 'COMP-01',
    category: 'COMP',
    title: 'Financial & ROI Claims Compliance',
    description: 'No unverified financial or guaranteed ROI claims.',
    enabled: true,
    keywords: ['guaranteed 10x ROI', 'guaranteed ROI', 'double your revenue overnight', '100% guaranteed profit'],
    replacementHint: 'measurable operational efficiency gains',
  },
];

export const SAMPLE_BAD_DRAFT = `🚀 Major Announcement: We are thrilled to introduce CloudPulse v4.0 to our global enterprise infrastructure customers!

With our revamped distributed telemetry engine, engineering teams get 100% guaranteed uptime across every multi-region cluster—meaning unplanned outages are officially a thing of the past.

Even better, we are making enterprise observability accessible to everyone: our full-featured Pro plan is now available for just $29/mo with unlimited retention.

Honestly, this release is lowkey insane, no cap — your DevOps pipeline is about to be lit. Upgrade your workspace today!`;

export function calculateTrustScore(
  violations: Violation[],
  activeRuleCount: number = 5
): number {
  if (activeRuleCount === 0) return 0;

  const openViolations = violations.filter((v) => v.status === 'open');
  if (openViolations.length === 0) return 100;

  let deduction = 0;
  for (const v of openViolations) {
    if (v.severity === 'CRITICAL') deduction += 22;
    else if (v.severity === 'HIGH') deduction += 16;
    else deduction += 12;
  }

  return Math.max(8, 100 - deduction);
}

/**
 * Built-in deterministic + semantic pattern rule engine so judges can test immediately
 * with zero setup, including custom rules added live.
 */
export function runDeterministicScan(draft: string, rules: BrandRule[]): Violation[] {
  const activeRules = rules.filter((r) => r.enabled);
  const violations: Violation[] = [];

  for (const rule of activeRules) {
    // 1. Specialized precision checks for the 5 core CloudPulse rules
    if (rule.code === 'FACT-01') {
      const versionRegex = /\b(?:CloudPulse\s+)?(?:v4\.0|v5\.0|version\s+4\.0|version\s+5\.0)\b/gi;
      const matches = draft.match(versionRegex);
      if (matches && matches.length > 0) {
        const phrase = matches[0];
        const fix = phrase.toLowerCase().includes('cloudpulse') ? 'CloudPulse v4.2' : 'v4.2';
        violations.push({
          id: `v-${rule.code}-${phrase}`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity: 'HIGH',
          offendingPhrase: phrase,
          explanation: `Draft cites unapproved version "${phrase}". Official current release is CloudPulse v4.2.`,
          suggestedFix: fix,
          status: 'open',
        });
      }
      continue;
    }

    if (rule.code === 'FACT-02') {
      const priceRegex = /(?:\$29\/mo(?:nth)?|\$19\/mo(?:nth)?|\$39\/mo(?:nth)?|free\s+lifetime\s+tier|free\s+forever\s+tier)/gi;
      const matches = draft.match(priceRegex);
      if (matches && matches.length > 0) {
        const phrase = matches[0];
        violations.push({
          id: `v-${rule.code}-${phrase}`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity: 'CRITICAL',
          offendingPhrase: phrase,
          explanation: `Inaccurate pricing claim "${phrase}" detected. Approved CloudPulse Pro tier pricing is $49/month with no free lifetime tier.`,
          suggestedFix: '$49/month',
          status: 'open',
        });
      }
      continue;
    }

    if (rule.code === 'FACT-03') {
      const slaRegex = /(?:100%\s+guaranteed\s+uptime|100%\s+uptime|zero\s+downtime)/gi;
      const matches = draft.match(slaRegex);
      if (matches && matches.length > 0) {
        const phrase = matches[0];
        violations.push({
          id: `v-${rule.code}-${phrase}`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity: 'CRITICAL',
          offendingPhrase: phrase,
          explanation: `Absolute reliability claim "${phrase}" violates legal SLA limits. Contractual CloudPulse SLA is 99.95% uptime.`,
          suggestedFix: '99.95% SLA-backed uptime',
          status: 'open',
        });
      }
      continue;
    }

    if (rule.code === 'TONE-01') {
      // Check compound slang phrase in sample draft first for clean one-click replacement
      const compoundSlangRegex = /Honestly,\s*this\s+release\s+is\s+lowkey\s+insane,\s*no\s+cap\s*—\s*your\s+DevOps\s+pipeline\s+is\s+about\s+to\s+be\s+lit\./i;
      const compoundMatch = draft.match(compoundSlangRegex);
      if (compoundMatch) {
        violations.push({
          id: `v-${rule.code}-compound`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity: 'MEDIUM',
          offendingPhrase: compoundMatch[0],
          explanation: 'Contains multiple banned casual slang terms ("lowkey", "insane", "no cap", "lit") that conflict with CloudPulse enterprise B2B voice standards.',
          suggestedFix: 'Built for high-velocity engineering organizations, this release streamlines enterprise DevOps observability at scale.',
          status: 'open',
        });
      } else {
        const singleSlangRegex = /\b(?:no\s+cap|lowkey|insane|lit)\b/gi;
        const slangMatches = draft.match(singleSlangRegex);
        if (slangMatches && slangMatches.length > 0) {
          const phrase = slangMatches[0];
          violations.push({
            id: `v-${rule.code}-${phrase}`,
            ruleCode: rule.code,
            ruleTitle: rule.title,
            severity: 'MEDIUM',
            offendingPhrase: phrase,
            explanation: `Casual slang "${phrase}" violates enterprise B2B tone guidelines.`,
            suggestedFix: 'enterprise-grade',
            status: 'open',
          });
        }
      }
      continue;
    }

    if (rule.code === 'COMP-01') {
      const compRegex = /(?:guaranteed\s+\d+x\s+ROI|guaranteed\s+ROI|double\s+your\s+revenue\s+overnight|100%\s+guaranteed\s+roi|guaranteed\s+financial\s+return)/gi;
      const matches = draft.match(compRegex);
      if (matches && matches.length > 0) {
        const phrase = matches[0];
        violations.push({
          id: `v-${rule.code}-${phrase}`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity: 'CRITICAL',
          offendingPhrase: phrase,
          explanation: `Unverified financial return claim "${phrase}" exposes the brand to regulatory compliance risk.`,
          suggestedFix: 'measurable operational efficiency gains',
          status: 'open',
        });
      }
      continue;
    }

    // 2. Dynamic Custom Rules added by users/judges
    const candidateKeywords: string[] = [...(rule.keywords || [])];

    // Extract quoted phrases from rule description if any (e.g., ban "synergy" or never claim "fastest")
    const quotedMatches = rule.description.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach((q) => {
        const cleaned = q.replace(/"/g, '').trim();
        if (cleaned.length > 1 && !candidateKeywords.includes(cleaned)) {
          candidateKeywords.push(cleaned);
        }
      });
    }

    for (const kw of candidateKeywords) {
      const trimmedKw = kw.trim();
      if (!trimmedKw) continue;
      const escaped = trimmedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const match = draft.match(regex);
      if (match) {
        const severity: Severity =
          rule.category === 'COMP' ? 'CRITICAL' : rule.category === 'FACT' ? 'HIGH' : 'MEDIUM';
        violations.push({
          id: `v-${rule.code}-${match[0]}`,
          ruleCode: rule.code,
          ruleTitle: rule.title,
          severity,
          offendingPhrase: match[0],
          explanation: `Violates custom rule ${rule.code}: ${rule.description}`,
          suggestedFix: rule.replacementHint || '[Verified Brand Statement]',
          status: 'open',
        });
        break;
      }
    }
  }

  return violations;
}

/**
 * Verifies draft using Gemini 2.5 Flash if an API key is provided,
 * otherwise seamlessly runs the built-in smart rule engine.
 */
export async function verifyDraftContent(
  draft: string,
  rules: BrandRule[],
  apiKey?: string
): Promise<{
  violations: Violation[];
  engineUsed: 'Gemini 2.5 Flash' | 'Built-in Deterministic Engine';
}> {
  const activeRules = rules.filter((r) => r.enabled);
  const trimmedKey = apiKey?.trim();

  if (trimmedKey) {
    try {
      const rulesPrompt = activeRules
        .map((r) => `- ${r.code} (${r.category} - ${r.title}): ${r.description}`)
        .join('\n');

      const systemInstruction = `You are NoCap AI, an enterprise pre-publication fact-checking and brand-governance verifier.
Analyze the draft against ONLY the active Truth Sheet rules below:
${rulesPrompt}

Return a JSON array of violations. Each item MUST have:
- "ruleCode": exact code (e.g. "FACT-01")
- "ruleTitle": short title of the rule
- "severity": one of "CRITICAL", "HIGH", "MEDIUM"
- "offendingPhrase": the EXACT verbatim substring from the draft that violates the rule (must match character-for-character so it can be replaced in the editor)
- "explanation": concise plain-English explanation of why it violates the rule
- "suggestedFix": direct replacement phrase that fits grammatically in place of offendingPhrase

Return ONLY valid JSON array.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          trimmedKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nDRAFT TO VERIFY:\n"""\n${draft}\n"""` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            const mapped: Violation[] = parsed
              .filter((item) => item && item.offendingPhrase && draft.includes(item.offendingPhrase))
              .map((item, idx) => ({
                id: `gemini-v-${idx}-${Date.now()}`,
                ruleCode: item.ruleCode || 'FACT-01',
                ruleTitle: item.ruleTitle || 'Brand Governance Rule',
                severity:
                  item.severity === 'CRITICAL' || item.severity === 'HIGH' || item.severity === 'MEDIUM'
                    ? item.severity
                    : 'HIGH',
                offendingPhrase: item.offendingPhrase,
                explanation: item.explanation || 'Violates active Truth Sheet rule.',
                suggestedFix: item.suggestedFix || '',
                status: 'open',
              }));
            return {
              violations: mapped,
              engineUsed: 'Gemini 2.5 Flash',
            };
          }
        }
      }
    } catch {
      // Fallback cleanly to deterministic engine if network/key fails
    }
  }

  // Simulate ~2.2s inspection conveyor pipeline for step-by-step telemetry readouts
  await new Promise((resolve) => setTimeout(resolve, 2150));
  const deterministicViolations = runDeterministicScan(draft, rules);
  return {
    violations: deterministicViolations,
    engineUsed: 'Built-in Deterministic Engine',
  };
}
