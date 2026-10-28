/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowUpDown, GitMerge, Mountain, Sparkles, Layers } from 'lucide-react';
import { ViolympicQuestion } from '../types';
import { soundManager } from '../utils/audio';
import { isGame1, isGame2, isGame3, getGame1Title, getGame2Title } from '../utils/gameUtils';

interface GameSelectScreenProps {
  round: number;
  questions: ViolympicQuestion[];
  onSelectGame: (section: string, filterTopic?: string) => void;
  onBack: () => void;
}

export const GameSelectScreen: React.FC<GameSelectScreenProps> = ({
  round,
  questions,
  onSelectGame,
  onBack,
}) => {
  const roundQuestions = questions.filter((q) => q.round === round);

  const game1Questions = roundQuestions.filter(isGame1);
  const game2Questions = roundQuestions.filter(isGame2);
  const game3Questions = roundQuestions.filter(isGame3);

  // Topics in current round
  const topics = Array.from(new Set(roundQuestions.map((q) => q.knowledge_topic))).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>
        <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
          Vòng thi số {round}
        </div>
      </div>

      {/* Screen Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Chọn Dạng Bài Thi Violympic
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-600">
          Ba phần thi chính thức theo đúng cấu trúc vòng thi Violympic Toán lớp 2
        </p>
      </div>

      {/* 3 Main Games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Game 1: Sắp xếp số */}
        <div
          onClick={() => {
            soundManager.playClick();
            onSelectGame('game1_sorting');
          }}
          className="bg-white rounded-3xl p-5 border-3 border-amber-300 hover:border-amber-400 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group active:scale-98"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-amber-950 flex items-center justify-center font-black text-2xl shadow-sm mb-4 group-hover:scale-105 transition">
              <ArrowUpDown className="w-7 h-7" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-black rounded-full mb-2">
              Phần thi số 1
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1.5">Game 1: {getGame1Title(round)}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Phần thi đầu tiên của Vòng {round}: giải quyết các bài toán sắp xếp hoặc tìm cặp giá trị tương ứng.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {game1Questions.length} câu hỏi
            </span>
            <span className="text-xs font-black text-amber-600 group-hover:translate-x-1 transition">
              Chơi ngay ➔
            </span>
          </div>
        </div>

        {/* Game 2: Ghép cặp / Trò chơi chuyên đề */}
        <div
          onClick={() => {
            soundManager.playClick();
            onSelectGame('game2_matching');
          }}
          className="bg-white rounded-3xl p-5 border-3 border-emerald-300 hover:border-emerald-400 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group active:scale-98"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-sm mb-4 group-hover:scale-105 transition">
              <GitMerge className="w-7 h-7" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full mb-2">
              Phần thi số 2
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1.5">Game 2: {getGame2Title(round)}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Thử thách tư duy nhanh theo dạng bài đặc trưng của Vòng thi số {round}.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {game2Questions.length} câu hỏi
            </span>
            <span className="text-xs font-black text-emerald-600 group-hover:translate-x-1 transition">
              Chơi ngay ➔
            </span>
          </div>
        </div>

        {/* Game 3: Leo dốc 100 câu */}
        <div
          onClick={() => {
            soundManager.playClick();
            onSelectGame('game3_climbing');
          }}
          className="bg-white rounded-3xl p-5 border-3 border-blue-400 hover:border-blue-500 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group active:scale-98"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm mb-4 group-hover:scale-105 transition">
              <Mountain className="w-7 h-7" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black rounded-full mb-2">
              Phần thi số 3 • Đỉnh cao
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1.5">Game 3: Leo Dốc</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Vượt qua 100 câu hỏi thử thách đa dạng từ câu 1 đến câu 100 để leo lên đỉnh núi!
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {game3Questions.length} câu hỏi (Đầy đủ 100 câu)
            </span>
            <span className="text-xs font-black text-blue-600 group-hover:translate-x-1 transition">
              Leo núi ngay ➔
            </span>
          </div>
        </div>
      </div>

      {/* Luyện tập theo chuyên đề */}
      {topics.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-800">Luyện Tập Chuyên Sâu Theo Chủ Đề</h3>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Bé muốn rèn luyện kỹ hơn phần nào? Hãy bấm chọn chủ đề bên dưới nhé:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {topics.map((topic) => {
              const count = roundQuestions.filter((q) => q.knowledge_topic === topic).length;
              return (
                <button
                  key={topic}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectGame('topic', topic);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{topic}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white text-slate-600 font-black">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
