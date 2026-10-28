/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViolympicQuestion, QuestionType, VerificationStatus } from '../types';

export interface ValidationErrorItem {
  index: number;
  id?: string;
  field?: string;
  reason: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalParsed: number;
  validQuestions: ViolympicQuestion[];
  errors: ValidationErrorItem[];
  duplicateIdsInFile: string[];
  duplicateIdsWithExisting: string[];
}

const VALID_QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'fill_in_the_blank', 'ordering', 'matching'];
const VALID_VERIFICATION_STATUSES: VerificationStatus[] = ['verified', 'needs_review', 'pending_verification'];

/**
 * Validates a single question object against the schema
 */
export function validateQuestionSchema(
  raw: unknown,
  index: number
): { valid: boolean; question?: ViolympicQuestion; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      valid: false,
      errors: [{ index, reason: 'Mục dữ liệu không phải là một đối tượng JSON hợp lệ (phải là {}).' }],
    };
  }

  const item = raw as Record<string, unknown>;

  // Check id
  if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
    errors.push({ index, field: 'id', reason: 'Thiếu hoặc sai định dạng trường `id` (phải là chuỗi ký tự không rỗng).' });
  }

  // Check round
  if (typeof item.round !== 'number' || isNaN(item.round) || item.round < 1) {
    errors.push({ index, id: String(item.id || ''), field: 'round', reason: 'Trường `round` phải là số nguyên dương (ví dụ: 1, 2...).' });
  }

  // Check section
  if (!item.section || typeof item.section !== 'string' || item.section.trim() === '') {
    errors.push({ index, id: String(item.id || ''), field: 'section', reason: 'Thiếu trường `section` (ví dụ: "game1_sorting", "game2_matching", "game3_climbing").' });
  }

  // Check question_number
  if (typeof item.question_number !== 'number' || isNaN(item.question_number) || item.question_number < 1) {
    errors.push({ index, id: String(item.id || ''), field: 'question_number', reason: 'Trường `question_number` phải là số nguyên dương.' });
  }

  // Check source_text
  if (!item.source_text || typeof item.source_text !== 'string' || item.source_text.trim() === '') {
    errors.push({ index, id: String(item.id || ''), field: 'source_text', reason: 'Thiếu nội dung đề bài `source_text`.' });
  }

  // Check question_type
  if (!item.question_type || !VALID_QUESTION_TYPES.includes(item.question_type as QuestionType)) {
    errors.push({
      index,
      id: String(item.id || ''),
      field: 'question_type',
      reason: `Trường \`question_type\` không hợp lệ. Phải là một trong: ${VALID_QUESTION_TYPES.join(', ')}.`,
    });
  }

  // Check source_answer & verified_answer
  if (item.source_answer === undefined || item.source_answer === null) {
    errors.push({ index, id: String(item.id || ''), field: 'source_answer', reason: 'Thiếu trường đáp án gốc `source_answer`.' });
  }

  // Verification status
  let vStatus: VerificationStatus = 'verified';
  if (item.verification_status !== undefined) {
    if (!VALID_VERIFICATION_STATUSES.includes(item.verification_status as VerificationStatus)) {
      errors.push({
        index,
        id: String(item.id || ''),
        field: 'verification_status',
        reason: `Trạng thái \`verification_status\` không hợp lệ. Phải là: ${VALID_VERIFICATION_STATUSES.join(', ')}.`,
      });
    } else {
      vStatus = item.verification_status as VerificationStatus;
    }
  }

  // Options validation for multiple choice
  if (item.question_type === 'multiple_choice') {
    if (!Array.isArray(item.options) || item.options.length < 2) {
      errors.push({
        index,
        id: String(item.id || ''),
        field: 'options',
        reason: 'Câu trắc nghiệm (`multiple_choice`) bắt buộc phải có mảng `options` gồm ít nhất 2 phương án lựa chọn.',
      });
    }
  }

  // Check knowledge_topic
  const knowledgeTopic = typeof item.knowledge_topic === 'string' && item.knowledge_topic.trim() !== ''
    ? item.knowledge_topic.trim()
    : 'Toán tổng hợp';

  const difficulty = (item.difficulty === 'easy' || item.difficulty === 'medium' || item.difficulty === 'hard')
    ? item.difficulty
    : 'medium';

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const validQuestion: ViolympicQuestion = {
    id: String(item.id).trim(),
    round: Number(item.round),
    section: String(item.section).trim(),
    question_number: Number(item.question_number),
    source_text: String(item.source_text),
    question_type: item.question_type as QuestionType,
    options: Array.isArray(item.options) ? item.options.map(String) : undefined,
    source_answer: item.source_answer as any,
    verified_answer: item.verified_answer !== undefined ? (item.verified_answer as any) : (item.source_answer as any),
    explanation: typeof item.explanation === 'string' ? item.explanation : undefined,
    knowledge_topic: knowledgeTopic,
    difficulty,
    source_page: item.source_page as number | string | undefined,
    answer_page: item.answer_page as number | string | undefined,
    verification_status: vStatus,
    notes: typeof item.notes === 'string' ? item.notes : undefined,
  };

  return { valid: true, question: validQuestion, errors: [] };
}

/**
 * Validates full JSON string or parsed array, checking schema and duplicates
 */
export function validateJSONData(
  jsonString: string,
  existingQuestions: ViolympicQuestion[] = []
): ValidationReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      totalParsed: 0,
      validQuestions: [],
      errors: [{ index: 0, reason: `Lỗi cú pháp JSON: ${err?.message || 'Cú pháp không hợp lệ'}` }],
      duplicateIdsInFile: [],
      duplicateIdsWithExisting: [],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      isValid: false,
      totalParsed: 0,
      validQuestions: [],
      errors: [{ index: 0, reason: 'Tệp JSON phải chứa một mảng danh sách các câu hỏi `[...]` ở cấp cao nhất.' }],
      duplicateIdsInFile: [],
      duplicateIdsWithExisting: [],
    };
  }

  const errors: ValidationErrorItem[] = [];
  const validQuestions: ViolympicQuestion[] = [];
  const seenIdsInFile = new Set<string>();
  const duplicateIdsInFile: string[] = [];
  const existingIdSet = new Set(existingQuestions.map((q) => q.id));
  const duplicateIdsWithExisting: string[] = [];

  parsed.forEach((rawItem, idx) => {
    const res = validateQuestionSchema(rawItem, idx + 1);
    if (!res.valid) {
      errors.push(...res.errors);
    } else if (res.question) {
      const qId = res.question.id;
      if (seenIdsInFile.has(qId)) {
        duplicateIdsInFile.push(qId);
        errors.push({
          index: idx + 1,
          id: qId,
          field: 'id',
          reason: `Mã câu hỏi "${qId}" bị trùng lặp bên trong chính tệp tải lên.`,
        });
      } else {
        seenIdsInFile.add(qId);
        if (existingIdSet.has(qId)) {
          duplicateIdsWithExisting.push(qId);
        }
        validQuestions.push(res.question);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    totalParsed: parsed.length,
    validQuestions,
    errors,
    duplicateIdsInFile: Array.from(new Set(duplicateIdsInFile)),
    duplicateIdsWithExisting: Array.from(new Set(duplicateIdsWithExisting)),
  };
}

/**
 * Exports question list to downloadable JSON string
 */
export function exportQuestionsToJSON(questions: ViolympicQuestion[]): string {
  return JSON.stringify(questions, null, 2);
}

/**
 * Triggers browser file download
 */
export function downloadJSONFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
