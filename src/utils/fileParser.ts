import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { BrandRule, RuleCategory } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extracts plain text from uploaded .pdf, .docx, .txt, or .md files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt' || ext === 'md' || ext === 'markdown' || ext === 'csv' || ext === 'json') {
    return await file.text();
  }

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return (result.value || '').trim();
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      pageTexts.push(strings.join(' '));
    }

    return pageTexts.join('\n\n').trim();
  }

  // Fallback: read as UTF-8 text
  return await file.text();
}

/**
 * Parses uploaded policy text (from PDF, TXT, MD, or DOCX) into active Truth Sheet BrandRules.
 */
export function parsePolicyTextToRules(
  rawText: string,
  startingIndex: number
): Omit<BrandRule, 'id'>[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((l) => l.length >= 12);

  const parsedRules: Omit<BrandRule, 'id'>[] = [];
  let counter = startingIndex + 1;

  for (const line of lines) {
    if (parsedRules.length >= 8) break;

    const lower = line.toLowerCase();
    let category: RuleCategory = 'FACT';
    if (
      lower.includes('tone') ||
      lower.includes('slang') ||
      lower.includes('voice') ||
      lower.includes('casual') ||
      lower.includes('word')
    ) {
      category = 'TONE';
    } else if (
      lower.includes('roi') ||
      lower.includes('financial') ||
      lower.includes('legal') ||
      lower.includes('guarantee') ||
      lower.includes('compliance') ||
      lower.includes('sla')
    ) {
      category = 'COMP';
    }

    // Extract quoted phrases if present: first quoted phrase(s) as banned keywords or replacements
    const quoted = Array.from(line.matchAll(/"([^"]+)"|'([^']+)'/g))
      .map((m) => (m[1] || m[2] || '').trim())
      .filter((s) => s.length > 1);

    const codePrefix = category;
    const code = `${codePrefix}-${String(counter).padStart(2, '0')}`;
    counter++;

    const titleWords = line
      .replace(/["'()]/g, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');

    parsedRules.push({
      code,
      category,
      title: titleWords || `${category} Policy Rule`,
      description: line,
      enabled: true,
      keywords: quoted.length > 0 ? quoted : undefined,
      replacementHint:
        quoted.length > 1 ? quoted[quoted.length - 1] : '[Verified Policy Statement]',
    });
  }

  // If the uploaded file was a single paragraph without line breaks, create 1 rule from it
  if (parsedRules.length === 0 && rawText.trim().length > 0) {
    const snippet = rawText.trim().slice(0, 220);
    parsedRules.push({
      code: `FACT-${String(startingIndex + 1).padStart(2, '0')}`,
      category: 'FACT',
      title: 'Imported Policy Directive',
      description: snippet,
      enabled: true,
    });
  }

  return parsedRules;
}
