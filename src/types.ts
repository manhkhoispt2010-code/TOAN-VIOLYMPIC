/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType =
  | 'multiple_choice'    // Trắc nghiệm (chọn 1 phương án)
  | 'fill_in_the_blank'  // Điền đáp án / số / số có đơn vị
  | 'fill_blank'         // Điền số / từ
  | 'ordering'           // Sắp xếp các số / phép tính theo thứ tự
  | 'matching';          // Ghép cặp phép tính với kết quả

export type VerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'pending_verification'
  | 'unverified';

export interface ViolympicQuestion {
  id: string;
  round: number;
  section: string;
  question_number: number;
  source_text: string;
  question_type: QuestionType | string;
  options?: string[];
  source_answer: string | string[] | Record<string, string>;
  verified_answer: string | string[] | Record<string, string>;
  explanation?: string;
  knowledge_topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'co_ban' | 'trung_binh' | 'nang_cao' | string;
  source_page?: number | string | null;
  answer_page?: number | string | null;
  verification_status: VerificationStatus | string;
  notes?: string | null;
}

export interface UserAnswerRecord {
  questionId: string;
  userAnswer: string | string[] | Record<string, string>;
  isCorrect: boolean;
  timestamp: number;
  timeSpentSeconds: number;
}

export interface PracticeSessionState {
  round: number;
  section: string;
  modeName: string;
  currentIndex: number;
  answers: Record<string, UserAnswerRecord>;
  score: number;
  totalAnswered: number;
  correctCount: number;
  isCompleted: boolean;
  startTime: number;
}

export interface OverallStats {
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  roundsCompleted: number;
  streakDays: number;
  lastActiveDate: string;
  topicStats: Record<string, { attempted: number; correct: number }>;
}

export interface MistakeItem {
  question: ViolympicQuestion;
  wrongAnswer: string | string[] | Record<string, string>;
  timestamp: number;
  timesWrong: number;
}
