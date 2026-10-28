/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_QUESTIONS } from '../data/defaultQuestions';
import { MistakeItem, OverallStats, PracticeSessionState, ViolympicQuestion } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'violympic_v4_questions',
  SESSION: 'violympic_v4_session',
  STATS: 'violympic_v4_stats',
  MISTAKES: 'violympic_v4_mistakes',
  ROUND_PREF: 'violympic_v4_active_round',
};

// ==========================================
// QUESTIONS REPOSITORY
// ==========================================

export function getStoredQuestions(): ViolympicQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 1105) {
      return parsed;
    }
    // Auto upgrade to the complete 1,105 questions across all 10 rounds!
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    return INITIAL_QUESTIONS;
  } catch {
    return INITIAL_QUESTIONS;
  }
}

export function saveStoredQuestions(questions: ViolympicQuestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Lỗi lưu trữ dữ liệu câu hỏi vào localStorage:', err);
  }
}

export function resetToDefaultQuestions(): ViolympicQuestion[] {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  } catch {}
  return INITIAL_QUESTIONS;
}

function getWithLegacyFallback(currentKey: string, legacyKeys: string[]): string | null {
  try {
    const current = localStorage.getItem(currentKey);
    if (current) return current;
    for (const legacyKey of legacyKeys) {
      const val = localStorage.getItem(legacyKey);
      if (val) {
        // Transparently migrate to v4 key
        localStorage.setItem(currentKey, val);
        return val;
      }
    }
  } catch {}
  return null;
}

// ==========================================
// OVERALL STATS
// ==========================================

const DEFAULT_STATS: OverallStats = {
  totalAttempted: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  roundsCompleted: 0,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  topicStats: {},
};

export function getStoredStats(): OverallStats {
  try {
    const raw = getWithLegacyFallback(STORAGE_KEYS.STATS, [
      'violympic_v3_stats',
      'violympic_v2_stats',
      'violympic_stats',
    ]);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordQuestionResult(question: ViolympicQuestion, isCorrect: boolean): OverallStats {
  const stats = getStoredStats();
  stats.totalAttempted += 1;
  if (isCorrect) {
    stats.totalCorrect += 1;
  } else {
    stats.totalIncorrect += 1;
  }

  // Topic-level breakdown
  const topic = question.knowledge_topic || 'Chung';
  if (!stats.topicStats[topic]) {
    stats.topicStats[topic] = { attempted: 0, correct: 0 };
  }
  stats.topicStats[topic].attempted += 1;
  if (isCorrect) {
    stats.topicStats[topic].correct += 1;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {}

  return stats;
}

export function resetStats(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS));
  } catch {}
}

// ==========================================
// MISTAKES & REVIEW HISTORY
// ==========================================

export function getStoredMistakes(): MistakeItem[] {
  try {
    const raw = getWithLegacyFallback(STORAGE_KEYS.MISTAKES, [
      'violympic_v3_mistakes',
      'violympic_v2_mistakes',
      'violympic_mistakes',
    ]);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMistake(
  question: ViolympicQuestion,
  wrongAnswer: string | string[] | Record<string, string>
): void {
  try {
    const mistakes = getStoredMistakes();
    const existingIdx = mistakes.findIndex((m) => m.question.id === question.id);

    if (existingIdx >= 0) {
      mistakes[existingIdx].timesWrong += 1;
      mistakes[existingIdx].wrongAnswer = wrongAnswer;
      mistakes[existingIdx].timestamp = Date.now();
      mistakes[existingIdx].question = question; // update with latest question details
    } else {
      mistakes.push({
        question,
        wrongAnswer,
        timestamp: Date.now(),
        timesWrong: 1,
      });
    }

    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  } catch {}
}

export function removeMistake(questionId: string): void {
  try {
    const mistakes = getStoredMistakes();
    const filtered = mistakes.filter((m) => m.question.id !== questionId);
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(filtered));
  } catch {}
}

export function clearAllMistakes(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.MISTAKES);
  } catch {}
}

// ==========================================
// ACTIVE SESSION PERSISTENCE
// ==========================================

export function getActiveSession(): PracticeSessionState | null {
  try {
    const raw = getWithLegacyFallback(STORAGE_KEYS.SESSION, [
      'violympic_v3_session',
      'violympic_v2_session',
      'violympic_session',
    ]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveSession(session: PracticeSessionState | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch {}
}

// ==========================================
// ACTIVE ROUND PREFERENCE
// ==========================================

export function getActiveRoundPref(): number {
  try {
    const raw = getWithLegacyFallback(STORAGE_KEYS.ROUND_PREF, [
      'violympic_v3_active_round',
      'violympic_active_round',
    ]);
    if (!raw) return 1;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 1 : num;
  } catch {
    return 1;
  }
}

export function setActiveRoundPref(round: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUND_PREF, String(round));
  } catch {}
}

