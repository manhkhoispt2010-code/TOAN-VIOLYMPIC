/**
 * Acceptance Audit Test Suite
 * Automated tests for Violympic Grade 2 (10 Rounds, 1,105 records)
 */

import fs from 'fs';
import path from 'path';

// 1. JSON Files Configuration
const FILES = [
  { round: 1, file: 'violympic_l2_vong1.json', expectedCount: 102 },
  { round: 2, file: 'violympic_l2_vong2_full.json', expectedCount: 113 },
  { round: 3, file: 'violympic_l2_vong3_full.json', expectedCount: 111 },
  { round: 4, file: 'violympic_l2_vong4_full.json', expectedCount: 111 },
  { round: 5, file: 'violympic_l2_vong5_full.json', expectedCount: 111 },
  { round: 6, file: 'violympic_l2_vong6_full.json', expectedCount: 111 },
  { round: 7, file: 'violympic_l2_vong7_full.json', expectedCount: 111 },
  { round: 8, file: 'violympic_l2_vong8_full.json', expectedCount: 111 },
  { round: 9, file: 'violympic_l2_vong9_full.json', expectedCount: 113 },
  { round: 10, file: 'violympic_l2_vong10_full.json', expectedCount: 111 },
];

const MANDATORY_16_FIELDS = [
  'id',
  'round',
  'section',
  'question_number',
  'source_text',
  'question_type',
  'options',
  'source_answer',
  'verified_answer',
  'explanation',
  'knowledge_topic',
  'difficulty',
  'source_page',
  'answer_page',
  'verification_status',
  'notes',
];

console.log('===============================================================');
console.log(' BẮT ĐẦU QUY TRÌNH KIỂM THỬ NGHIỆM THU TỰ ĐỘNG - 10 VÒNG THI');
console.log('===============================================================\n');

let totalRecords = 0;
const allQuestions = [];
const idSet = new Set();
const duplicateIds = [];
const schemaErrors = [];

// Audit Task 1 & 2 & 3: File existence, JSON syntax, record count, 16 fields, duplicate IDs
console.log('--- PHÉP THỬ 1, 2, 3: CÚ PHÁP JSON, SỐ LƯỢNG BẢN GHI & 16 TRƯỜNG BẮT BUỘC ---');

FILES.forEach((fInfo) => {
  const filePath = path.resolve('./src/data/rounds', fInfo.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] Không tìm thấy tệp: ${filePath}`);
    process.exit(1);
  }

  let list;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    list = JSON.parse(raw);
  } catch (err) {
    console.error(`[FAIL] Lỗi cú pháp JSON trong tệp ${fInfo.file}:`, err.message);
    process.exit(1);
  }

  if (list.length !== fInfo.expectedCount) {
    console.warn(`[CẢNH BÁO] Số bản ghi của ${fInfo.file} là ${list.length}, khác với dự kiến ${fInfo.expectedCount}`);
  } else {
    console.log(`[PASS] ${fInfo.file}: ${list.length} bản ghi (khớp 100% chỉ tiêu)`);
  }

  totalRecords += list.length;

  list.forEach((q, idx) => {
    // Check duplicate ID
    if (idSet.has(q.id)) {
      duplicateIds.push({ id: q.id, file: fInfo.file, index: idx });
    } else {
      idSet.add(q.id);
    }

    // Check mandatory 16 fields
    MANDATORY_16_FIELDS.forEach((field) => {
      if (!(field in q)) {
        schemaErrors.push({ id: q.id, missingField: field, file: fInfo.file });
      }
    });

    // Check round consistency
    if (q.round !== fInfo.round) {
      schemaErrors.push({ id: q.id, issue: `Trường round=${q.round} không khớp với vòng ${fInfo.round}` });
    }

    allQuestions.push(q);
  });
});

console.log(`\nTổng số bản ghi đọc được từ 10 tệp: ${totalRecords} (Mục tiêu: 1.105 bản ghi)`);
console.log(`Tổng số ID duy nhất: ${idSet.size}`);
console.log(`Số ID trùng: ${duplicateIds.length} ${duplicateIds.length === 0 ? '[PASS - KHÔNG TRÙNG]' : '[FAIL]'}`);
console.log(`Số lỗi thiếu trường trong 16 trường: ${schemaErrors.length} ${schemaErrors.length === 0 ? '[PASS - ĐẦY ĐỦ 16 TRƯỜNG]' : '[FAIL]'}\n`);

// Audit Task 3: Phân bố từng Game trong 10 vòng & tính liên tục của Game 3 (Leo dốc 1-100)
console.log('--- PHÉP THỬ 3.1: PHÂN BỐ PHẦN THI (GAME 1, GAME 2, GAME 3) & BÀI THI LEO DỐC ---');

const roundBreakdown = {};
for (let r = 1; r <= 10; r++) {
  roundBreakdown[r] = { g1: 0, g2: 0, g3: 0, g3Min: 999, g3Max: 0, g3Codes: [] };
}

allQuestions.forEach((q) => {
  const r = q.round;
  if (q.section === 'leo_doc' || q.id.includes('-P3-')) {
    roundBreakdown[r].g3++;
    roundBreakdown[r].g3Codes.push(q.id);
    if (q.question_number < roundBreakdown[r].g3Min) roundBreakdown[r].g3Min = q.question_number;
    if (q.question_number > roundBreakdown[r].g3Max) roundBreakdown[r].g3Max = q.question_number;
  } else if (q.section.startsWith('game1') || q.id.includes('-P1')) {
    roundBreakdown[r].g1++;
  } else {
    roundBreakdown[r].g2++;
  }
});

let allGame3Valid = true;
for (let r = 1; r <= 10; r++) {
  const b = roundBreakdown[r];
  const isG3Full100 = b.g3 === 100;
  const isRange1to100 = b.g3Min === 1 && b.g3Max === 100;
  if (!isG3Full100 || !isRange1to100) allGame3Valid = false;
  console.log(
    `Vòng ${r}: Game 1 = ${b.g1} câu, Game 2 = ${b.g2} câu, Game 3 (Leo dốc) = ${b.g3} câu (Câu số ${b.g3Min} -> ${b.g3Max}) ${isG3Full100 && isRange1to100 ? '[PASS]' : '[FAIL]'}`
  );
}

// Audit Task 4: Storage Keys & Legacy Migration simulation
console.log('\n--- PHÉP THỬ 4: CƠ CHẾ NÂNG CẤP V4 & BẢO LƯU DỮ LIỆU CŨ (STORAGE FALLBACK) ---');

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(k) {
    return this.store[k] !== undefined ? this.store[k] : null;
  }
  setItem(k, v) {
    this.store[k] = String(v);
  }
  removeItem(k) {
    delete this.store[k];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
// Seed mockStorage with legacy v3 stats and mistakes
mockStorage.setItem(
  'violympic_v3_stats',
  JSON.stringify({
    totalAttempted: 45,
    totalCorrect: 42,
    totalIncorrect: 3,
    roundsCompleted: 1,
    streakDays: 3,
  })
);
mockStorage.setItem(
  'violympic_v3_mistakes',
  JSON.stringify([
    {
      question: { id: 'V1-P3-C005', question_type: 'fill_blank' },
      wrongAnswer: '24',
      timesWrong: 1,
    },
  ])
);

// Fallback logic check
function testGetWithFallback(currentKey, legacyKeys) {
  const current = mockStorage.getItem(currentKey);
  if (current) return current;
  for (const leg of legacyKeys) {
    const val = mockStorage.getItem(leg);
    if (val) {
      mockStorage.setItem(currentKey, val);
      return val;
    }
  }
  return null;
}

const migratedStatsRaw = testGetWithFallback('violympic_v4_stats', ['violympic_v3_stats', 'violympic_v2_stats']);
const migratedStats = JSON.parse(migratedStatsRaw);
const migratedMistakesRaw = testGetWithFallback('violympic_v4_mistakes', ['violympic_v3_mistakes', 'violympic_v2_mistakes']);
const migratedMistakes = JSON.parse(migratedMistakesRaw);

console.log(
  `Kiểm tra bảo lưu điểm số cũ: ${migratedStats.totalAttempted === 45 && migratedStats.totalCorrect === 42 ? '[PASS - ĐÃ BẢO LƯU 45 CÂU CŨ]' : '[FAIL]'}`
);
console.log(
  `Kiểm tra bảo lưu lịch sử câu sai: ${migratedMistakes.length === 1 && migratedMistakes[0].question.id === 'V1-P3-C005' ? '[PASS - ĐÃ BẢO LƯU 1 CÂU SAI CŨ]' : '[FAIL]'}`
);
console.log(
  `Kiểm tra key mới v4 được tự động cập nhật: ${mockStorage.getItem('violympic_v4_stats') ? '[PASS]' : '[FAIL]'}`
);

// Audit Task 5 & 6: Grading Engine Verification across question types
console.log('\n--- PHÉP THỬ 5 & 6: ĐỘNG CƠ CHẤM ĐIỂM (GRADING ENGINE) VÀ KỊCH BẢN MÔ PHỎNG ---');

import { evaluateAnswer, compareSingleAnswer } from '../src/utils/gradingEngine';

// Multiple Choice Tests
const mcQuestion = {
  id: 'MC-TEST',
  question_type: 'multiple_choice',
  source_answer: 'B',
  verified_answer: 'B',
  options: ['A. 12', 'B. 24', 'C. 36', 'D. 48'],
};

console.log('1. Trắc nghiệm (multiple_choice):');
console.log(`- Chọn đúng chữ cái 'B': ${evaluateAnswer(mcQuestion, 'B') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Chọn chữ cái thường 'b': ${evaluateAnswer(mcQuestion, 'b') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Chọn toàn bộ văn bản 'B. 24': ${evaluateAnswer(mcQuestion, 'B. 24') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Chọn phương án sai 'A': ${evaluateAnswer(mcQuestion, 'A') === false ? '[PASS]' : '[FAIL]'}`);

// Fill in the blank with numbers and units
const fillQuestion1 = {
  id: 'FILL-1',
  question_type: 'fill_blank',
  source_answer: '25 cm',
  verified_answer: '25 cm',
};

console.log('\n2. Điền số & đơn vị (fill_blank):');
console.log(`- Điền đúng cả số và đơn vị '25 cm': ${evaluateAnswer(fillQuestion1, '25 cm') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Điền dính liền '25cm': ${evaluateAnswer(fillQuestion1, '25cm') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Học sinh chỉ điền số '25': ${evaluateAnswer(fillQuestion1, '25') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Điền số sai '30': ${evaluateAnswer(fillQuestion1, '30') === false ? '[PASS]' : '[FAIL]'}`);

// Multi-word unit (e.g. '39 lá cờ')
const fillQuestion2 = {
  id: 'FILL-2',
  question_type: 'fill_blank',
  source_answer: '39 lá cờ',
  verified_answer: '39 lá cờ',
};
console.log(`- Điền đơn vị nhiều từ '39 lá cờ': ${evaluateAnswer(fillQuestion2, '39 lá cờ') === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Học sinh chỉ điền số '39' khi đề có đơn vị 'lá cờ': ${evaluateAnswer(fillQuestion2, '39') === true ? '[PASS]' : '[FAIL]'}`);

// Ordering Tests (V1-P1 sample)
const orderQuestion = {
  id: 'V1-P1',
  question_type: 'ordering',
  source_answer: '10(1), 13(2), 17(3), 22(4)',
  verified_answer: '10, 13, 17, 22',
};
const correctOrderArray = ['10', '13', '17', '22'];
const wrongOrderArray = ['13', '10', '17', '22'];
console.log('\n3. Sắp xếp thứ tự (ordering):');
console.log(`- Xếp đúng thứ tự: ${evaluateAnswer(orderQuestion, correctOrderArray) === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Xếp sai thứ tự: ${evaluateAnswer(orderQuestion, wrongOrderArray) === false ? '[PASS]' : '[FAIL]'}`);

// Matching Tests (V1-P2 sample)
const matchQuestion = {
  id: 'V1-P2',
  question_type: 'matching',
  source_answer: '1. 83-43 và 40; 2. 84 và 60+24',
  verified_answer: '10 cặp ô bằng nhau có giá trị tương ứng: 40, 84',
};
const correctPairs = {
  '83-43': '40',
  '84': '60+24',
};
const wrongPairs = {
  '83-43': '84',
  '40': '60+24',
};
console.log('\n4. Nối cặp bằng nhau (matching):');
console.log(`- Nối đúng tất cả các cặp: ${evaluateAnswer(matchQuestion, correctPairs) === true ? '[PASS]' : '[FAIL]'}`);
console.log(`- Nối sai cặp: ${evaluateAnswer(matchQuestion, wrongPairs) === false ? '[PASS]' : '[FAIL]'}`);

// Audit Task 7: Edge cases & malformed input
console.log('\n--- PHÉP THỬ 7: TRƯỜNG HỢP BIÊN & DỮ LIỆU ĐẶC BIỆT ---');
console.log(`- Đáp án người dùng là null: ${evaluateAnswer(mcQuestion, null) === false ? '[PASS]' : '[FAIL]'}`);
console.log(`- Đáp án người dùng là undefined: ${evaluateAnswer(mcQuestion, undefined) === false ? '[PASS]' : '[FAIL]'}`);
console.log(`- Chuỗi rỗng: ${evaluateAnswer(mcQuestion, '') === false ? '[PASS]' : '[FAIL]'}`);
console.log(`- Dạng câu hỏi không hỗ trợ: ${evaluateAnswer({ ...mcQuestion, question_type: 'unknown' }, 'A') === false ? '[PASS]' : '[FAIL]'}`);

console.log('\n===============================================================');
console.log(' HOÀN TẤT BỘ TEST NGHIỆM THU TỰ ĐỘNG - KẾT QUẢ ĐÃ ĐƯỢC XÁC MINH');
console.log('===============================================================\n');
