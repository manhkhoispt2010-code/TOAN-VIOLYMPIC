/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViolympicQuestion } from '../../types';
import vong1 from './violympic_l2_vong1.json';
import vong2 from './violympic_l2_vong2_full.json';
import vong3 from './violympic_l2_vong3_full.json';
import vong4 from './violympic_l2_vong4_full.json';
import vong5 from './violympic_l2_vong5_full.json';
import vong6 from './violympic_l2_vong6_full.json';
import vong7 from './violympic_l2_vong7_full.json';
import vong8 from './violympic_l2_vong8_full.json';
import vong9 from './violympic_l2_vong9_full.json';
import vong10 from './violympic_l2_vong10_full.json';

export const ALL_10_ROUNDS_QUESTIONS: ViolympicQuestion[] = [
  ...(vong1 as unknown as ViolympicQuestion[]),
  ...(vong2 as unknown as ViolympicQuestion[]),
  ...(vong3 as unknown as ViolympicQuestion[]),
  ...(vong4 as unknown as ViolympicQuestion[]),
  ...(vong5 as unknown as ViolympicQuestion[]),
  ...(vong6 as unknown as ViolympicQuestion[]),
  ...(vong7 as unknown as ViolympicQuestion[]),
  ...(vong8 as unknown as ViolympicQuestion[]),
  ...(vong9 as unknown as ViolympicQuestion[]),
  ...(vong10 as unknown as ViolympicQuestion[]),
];

export const ROUND_QUESTIONS_MAP: Record<number, ViolympicQuestion[]> = {
  1: vong1 as unknown as ViolympicQuestion[],
  2: vong2 as unknown as ViolympicQuestion[],
  3: vong3 as unknown as ViolympicQuestion[],
  4: vong4 as unknown as ViolympicQuestion[],
  5: vong5 as unknown as ViolympicQuestion[],
  6: vong6 as unknown as ViolympicQuestion[],
  7: vong7 as unknown as ViolympicQuestion[],
  8: vong8 as unknown as ViolympicQuestion[],
  9: vong9 as unknown as ViolympicQuestion[],
  10: vong10 as unknown as ViolympicQuestion[],
};
