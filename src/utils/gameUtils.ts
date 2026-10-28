/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViolympicQuestion } from '../types';

export function isGame1(q: ViolympicQuestion | { section: string }): boolean {
  return q.section.startsWith('game1') || q.section.includes('sorting') || q.section.includes('ordering');
}

export function isGame2(q: ViolympicQuestion | { section: string }): boolean {
  return (
    q.section.startsWith('game2') ||
    q.section.includes('zodiac') ||
    q.section.includes('treasure') ||
    q.section.includes('drop') ||
    q.section.includes('bugs') ||
    q.section.includes('peak') ||
    (q.section.includes('matching') && !q.section.startsWith('game1'))
  );
}

export function isGame3(q: ViolympicQuestion | { section: string }): boolean {
  return q.section === 'leo_doc' || q.section.startsWith('game3') || q.section.includes('climbing');
}

export function getGame1Title(round: number): string {
  // Rounds 1, 3, 5, 7, 9: Ordering / Sắp xếp
  // Rounds 2, 4, 6, 8, 10: Matching / Bức tranh bí ẩn
  if ([2, 4, 6, 8, 10].includes(round)) {
    return 'Bức tranh bí ẩn (Ghép cặp bằng nhau)';
  }
  return 'Sắp xếp thứ tự (Tăng dần)';
}

export function getGame2Title(round: number): string {
  switch (round) {
    case 1:
      return 'Bức tranh bí ẩn (Ghép cặp)';
    case 2:
    case 9:
      return '12 Con Giáp';
    case 3:
      return 'Đi tìm kho báu';
    case 4:
    case 7:
      return 'Thế giới côn trùng';
    case 5:
    case 8:
    case 10:
      return 'Đừng để điểm rơi';
    case 6:
      return 'Đỉnh núi trí tuệ';
    default:
      return 'Trò chơi toán học';
  }
}

export function getGame3Title(): string {
  return 'Leo dốc Violympic (100 câu)';
}

/**
 * Extracts candidate cards for ordering questions when options array is empty
 */
export function parseOrderingItems(q: ViolympicQuestion): string[] {
  if (q.options && q.options.length > 0) return q.options;
  // If verified_answer is a clean comma-separated list of values (e.g. V1-P1)
  if (q.verified_answer && typeof q.verified_answer === 'string') {
    const v = q.verified_answer.trim();
    if (v.includes(',') && !v.includes(';') && !v.includes('tương ứng') && !v.startsWith('Sắp xếp')) {
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  const raw = String(q.source_answer || q.verified_answer || '');
  const items: string[] = [];
  const parts = raw.includes(';') ? raw.split(';') : raw.split(',');
  for (const p of parts) {
    const clean = p.replace(/^\s*\d+[\.\)]\s*/, '').replace(/\s*\(\d+\)\s*$/, '').trim();
    if (clean) items.push(clean);
  }
  return items;
}

/**
 * Extracts paired items for matching games (10 pairs -> 20 cards)
 */
export function parseMatchingPairs(q: ViolympicQuestion): Record<string, string> {
  if (
    typeof q.verified_answer === 'object' &&
    q.verified_answer !== null &&
    !Array.isArray(q.verified_answer) &&
    Object.keys(q.verified_answer).length > 0
  ) {
    return q.verified_answer as Record<string, string>;
  }
  const raw = String(q.source_answer || '');
  const pairs: Record<string, string> = {};
  const entries = raw.split(';');
  for (const entry of entries) {
    const clean = entry.replace(/^\s*\d+[\.\)]\s*/, '').replace(/\s*\(\d+\)\s*$/, '').trim();
    if (clean.includes(' và ')) {
      const [left, right] = clean.split(' và ').map((s) => s.trim());
      if (left && right) pairs[left] = right;
    } else if (clean.includes('=')) {
      const [left, right] = clean.split('=').map((s) => s.trim());
      if (left && right) pairs[left] = right;
    }
  }
  return pairs;
}

