import { Language } from '../types';

export interface ParsedAdvice {
  isList: boolean;
  points: string[];
  raw: string;
}

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function getLocalizedPointNum(n: number, lang: Language): string {
  if (lang === 'mr') {
    return String(n).replace(/\d/g, (d) => DEVANAGARI_DIGITS[parseInt(d, 10)] ?? d);
  }
  return String(n);
}

/**
 * Parses an agronomic tip or note into numbered points if it contains a list structure (e.g. 1. ... 2. ... or multiline bullets),
 * or returns it as a regular paragraph if it's continuous text.
 */
export function parseAdvicePoints(rawText?: string | null): ParsedAdvice {
  if (!rawText || typeof rawText !== 'string') {
    return { isList: false, points: [], raw: '' };
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return { isList: false, points: [], raw: '' };
  }

  // 1. Check for multiline bullet points (•, -, *)
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every((l) => /^[\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/.test(l))) {
    return {
      isList: true,
      points: lines.map((l) => l.replace(/^[\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/, '').trim()),
      raw: trimmed,
    };
  }

  // 2. Check for numbered points (both English 1., 2. and Devanagari १., २.)
  // Matches (start-of-string or whitespace) followed by digits then dot or parenthesis then whitespace.
  // This explicitly excludes decimal numbers like 1.5kg, 4-5cm, 0:52:34.
  const numRegex = /(?:^|\s+)([0-9]+|[०-९]+)[\.\)]\s+/g;
  const matches: { index: number; length: number; num: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = numRegex.exec(trimmed)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      num: match[1],
    });
  }

  if (matches.length >= 2) {
    const points: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const startIdx = matches[i].index + matches[i].length;
      const endIdx = i < matches.length - 1 ? matches[i + 1].index : trimmed.length;
      const pointContent = trimmed.substring(startIdx, endIdx).trim();
      if (pointContent) {
        points.push(pointContent);
      }
    }

    if (points.length >= 2) {
      return { isList: true, points, raw: trimmed };
    }
  }

  // 3. Check for multiline numbered lines: e.g.
  // 1. Point A
  // 2. Point B
  if (lines.length > 1 && lines.every((l) => /^([0-9]+|[०-९]+)[\.\)]\s+/.test(l))) {
    return {
      isList: true,
      points: lines.map((l) => l.replace(/^([0-9]+|[०-९]+)[\.\)]\s+/, '').trim()),
      raw: trimmed,
    };
  }

  // 4. Default: Single paragraph (current format)
  return { isList: false, points: [], raw: trimmed };
}
