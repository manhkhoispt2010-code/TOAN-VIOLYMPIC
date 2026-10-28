/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViolympicQuestion } from '../types';
import { parseOrderingItems, parseMatchingPairs } from './gameUtils';

/**
 * Normalizes user text response:
 * - Trims leading & trailing whitespace
 * - Collapses consecutive spaces into one
 * - Converts lowercase for unit comparisons (e.g. "15 CM" -> "15 cm")
 * - Handles comma vs dot for decimal/numbers if any (e.g. 15,5 vs 15.5)
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Normalizes answers with numbers and units (cm, dm, m, kg, l, lít, giờ, tuổi, quả, lá cờ, đoạn thẳng...)
 * Example:
 * "15cm" <-> "15 cm"
 * "3 dm" <-> "3dm"
 * "A. 44" <-> "44"
 */
export function normalizeNumberWithUnit(text: string): { numberPart: string; unitPart: string; fullNormalized: string } {
  let clean = normalizeString(text);
  // Strip letter prefix like "a. 44" -> "44"
  clean = clean.replace(/^[a-d]\.\s*/i, '');
  // Match number (possibly negative or with commas/dots) followed optionally by units (single or multi-word, supporting all Vietnamese diacritics)
  const match = clean.match(/^([+-]?\d+(?:[.,]\d+)?)\s*([\p{L}\s°/]*)$/u);
  if (match) {
    const num = match[1].replace(',', '.');
    const unit = match[2].trim();
    return {
      numberPart: num,
      unitPart: unit,
      fullNormalized: unit ? `${num} ${unit}` : num,
    };
  }
  return {
    numberPart: clean,
    unitPart: '',
    fullNormalized: clean,
  };
}

/**
 * Compares two answer values considering:
 * - Direct exact match
 * - Number + unit equivalence (e.g. "15cm" vs "15 cm")
 * - Number only if question prompt already specifies the unit at the end
 */
export function compareSingleAnswer(userAnswer: string, expectedAnswer: string): boolean {
  const normUser = normalizeString(userAnswer);
  const normExp = normalizeString(expectedAnswer);

  if (normUser === normExp) {
    return true;
  }

  // Parse potential numbers with units
  const parsedUser = normalizeNumberWithUnit(normUser);
  const parsedExp = normalizeNumberWithUnit(normExp);

  // If both have units, both unit and number must strictly match
  if (parsedExp.unitPart && parsedUser.unitPart) {
    return parsedUser.numberPart === parsedExp.numberPart && parsedUser.unitPart === parsedExp.unitPart;
  }

  // If expected has a unit (e.g., "15 cm", "39 lá cờ") but user entered just the number "15" / "39"
  if (parsedExp.unitPart && !parsedUser.unitPart) {
    return parsedUser.numberPart === parsedExp.numberPart;
  }

  // If expected is just number "15" and user wrote "15"
  if (!parsedExp.unitPart && !parsedUser.unitPart) {
    return parsedUser.numberPart === parsedExp.numberPart;
  }

  return false;
}

/**
 * Checks whether user response is correct for any Violympic question type.
 */
export function evaluateAnswer(
  question: ViolympicQuestion,
  userAnswer: string | string[] | Record<string, string> | undefined | null
): boolean {
  if (userAnswer === undefined || userAnswer === null) {
    return false;
  }

  // Use verified_answer if available and non-empty; fallback to source_answer
  const targetAnswer =
    question.verified_answer !== undefined && question.verified_answer !== null && question.verified_answer !== ''
      ? question.verified_answer
      : question.source_answer;

  switch (question.question_type) {
    case 'multiple_choice': {
      if (typeof userAnswer !== 'string') return false;
      const expectedStr = typeof targetAnswer === 'string' ? targetAnswer : String(targetAnswer);
      
      // Match option letter (A, B, C, D) or full text
      const u = normalizeString(userAnswer);
      const e = normalizeString(expectedStr);

      if (u === e) return true;

      // In case expected is "A" and user answer is "A. 15", or vice versa
      if (e.length === 1 && (u.startsWith(`${e}.`) || u.startsWith(`${e} `) || u.startsWith(`${e}:`))) {
        return true;
      }
      if (u.length === 1 && (e.startsWith(`${u}.`) || e.startsWith(`${u} `) || e.startsWith(`${u}:`))) {
        return true;
      }

      // Check against options text if options array provided
      if (question.options && question.options.length > 0) {
        const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
        const eIdx = letterToIndex[e] ?? -1;
        if (eIdx >= 0 && question.options[eIdx]) {
          const optText = normalizeString(question.options[eIdx]);
          if (u === optText) return true;
        }
      }

      return false;
    }

    case 'fill_in_the_blank':
    case 'fill_blank': {
      if (typeof userAnswer !== 'string') return false;
      
      // Expected can be string or array of accepted answers
      if (Array.isArray(targetAnswer)) {
        return targetAnswer.some((ans) => compareSingleAnswer(userAnswer, String(ans)));
      }
      return compareSingleAnswer(userAnswer, String(targetAnswer));
    }

    case 'ordering': {
      // Must be an array of equal length matching exact sequence
      if (!Array.isArray(userAnswer)) return false;
      
      const expectedList = parseOrderingItems(question);
      if (expectedList.length === 0) return true; // graceful fallback
      if (userAnswer.length !== expectedList.length) return false;

      for (let i = 0; i < expectedList.length; i++) {
        if (!compareSingleAnswer(String(userAnswer[i]), String(expectedList[i]))) {
          return false;
        }
      }
      return true;
    }

    case 'matching': {
      // User answer should be a mapping of { cardIdA: cardIdB, ... } or list of pairs
      if (typeof userAnswer !== 'object' || Array.isArray(userAnswer)) {
        return false;
      }

      const expectedMap = parseMatchingPairs(question);
      const userMap = userAnswer as Record<string, string>;

      const expKeys = Object.keys(expectedMap);
      if (expKeys.length === 0) return true; // graceful fallback

      // Every key in expected must map to corresponding value in user
      for (const key of expKeys) {
        const expVal = normalizeString(expectedMap[key]);
        const userVal = normalizeString(userMap[key] || '');
        // Bi-directional check: either key->val or val->key
        const reverseVal = normalizeString(userMap[expectedMap[key]] || '');
        const normKey = normalizeString(key);

        const matchesDirect = userVal === expVal;
        const matchesReverse = reverseVal === normKey;

        if (!matchesDirect && !matchesReverse) {
          return false;
        }
      }

      return true;
    }

    default:
      return false;
  }
}

/**
 * Format answer for display to young students
 */
export function formatAnswerDisplay(answer: string | string[] | Record<string, string>): string {
  if (Array.isArray(answer)) {
    return answer.join('  ➜  ');
  }
  if (typeof answer === 'object' && answer !== null) {
    return Object.entries(answer)
      .map(([k, v]) => `${k}  =  ${v}`)
      .join(' ;  ');
  }
  return String(answer);
}
