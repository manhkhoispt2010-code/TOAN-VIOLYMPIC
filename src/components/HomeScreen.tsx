/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Grid,
  History,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Percent,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { OverallStats, PracticeSessionState, ViolympicQuestion } from '../types';
import { soundManager } from '../utils/audio';
import { isGame1, isGame2, isGame3, getGame1Title, getGame2Title } from '../utils/gameUtils';

interface HomeScreenProps {
  stats: OverallStats;
  questions: ViolympicQuestion[];
  mistakeCount: number;
  selectedRound: number;
  onSelectRound: (round: number) => void;
  onStartPractice: (round: number, section?: string) => void;
  onOpenGameSelect: () => void;
  onOpenMistakesReview: () => void;
  activeSession: PracticeSessionState | null;
  onResumeSession: () => void;
  onResetStats: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  questions,
  mistakeCount,
  selectedRound,
  onSelectRound,
  onStartPractice,
  onOpenGameSelect,
  onOpenMistakesReview,
  activeSession,
  onResumeSession,
  onResetStats,
}) => {
  // Available rounds in dataset
  const availableRounds = Array.from(new Set(questions.map((q) => q.round))).sort((a, b) => a - b);
  const currentRoundQuestions = questions.filter((q) => q.round === selectedRound);

  const accuracy = stats.totalAttempted > 0
    ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100)
    : 0;

  const g1Count = currentRoundQuestions.filter(isGame1).length;
  const g2Count = currentRoundQuestions.filter(isGame2).length;
  const g3Count = currentRoundQuestions.filter(isGame3).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 p-5 sm:p-7 text-white shadow-lg border-4 border-amber-300">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black tracking-wide text-amber-200 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cùng bé rinh điểm 10 Violympic</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bé vui học Toán – Violympic 2
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold leading-relaxed">
              Luyện tập bám sát đề thi chuẩn: Sắp xếp số, Ghép phép tính, Leo dốc 100 câu thử thách!
            </p>
          </div>

          {/* Interactive Mascot & Quick Launch */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-3xl p-2 border-2 border-white/40 shadow-inner flex items-center justify-center transform hover:rotate-3 transition">
              <span className="text-5xl sm:text-6xl drop-shadow-md">🐰</span>
            </div>
            <span className="mt-1 text-xs font-black text-amber-100 bg-amber-900/30 px-2 py-0.5 rounded-full">
              Bạn Thỏ Toán Học
            </span>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
      </div>

      {/* In-Progress Session Alert */}
      {activeSession && !activeSession.isCompleted && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-3xl shadow-md border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
              ⏱️
            </div>
            <div>
              <p className="text-xs font-black uppercase text-amber-100">Bài đang làm dở:</p>
              <h4 className="font-extrabold text-sm sm:text-base">
                {activeSession.modeName} (Câu {activeSession.currentIndex + 1})
              </h4>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onResumeSession();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-orange-600 hover:bg-amber-50 font-black rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <span>Tiếp tục làm ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Round Selection Tabs & Question Count Breakdown */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border-2 border-amber-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h3 className="font-black text-lg sm:text-xl text-slate-800">Chọn Vòng Thi Luyện Tập</h3>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-black text-xs sm:text-sm">
              Tổng số câu đã nạp: {currentRoundQuestions.length} câu
            </span>
          </div>
        </div>

        {/* Horizontal round selector buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {availableRounds.map((rnd) => (
            <button
              key={rnd}
              onClick={() => {
                soundManager.playClick();
                onSelectRound(rnd);
              }}
              className={`py-3 px-5 sm:px-6 rounded-2xl font-black text-base sm:text-lg transition shrink-0 flex items-center gap-2 cursor-pointer ${
                selectedRound === rnd
                  ? 'bg-blue-600 text-white shadow-md scale-102 ring-3 ring-blue-300'
                  : 'bg-slate-100 hover:bg-amber-100/70 text-slate-700'
              }`}
            >
              <span>Vòng thi số {rnd}</span>
              {selectedRound === rnd && <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full font-bold">Đang chọn</span>}
            </button>
          ))}
        </div>

        {/* Breakdown of each game in current round - Interactive Clickable Cards */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-700">
            <span className="flex items-center gap-1.5 text-blue-800">
              <span>👉</span>
              <span>Chạm vào Game để bắt đầu chơi ngay:</span>
            </span>
            <span className="text-slate-400 font-semibold hidden sm:inline">Vòng {selectedRound}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Game 1 Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onStartPractice(selectedRound, 'game1_sorting');
              }}
              title={`Chơi ngay Game 1: ${getGame1Title(selectedRound)}`}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200 active:scale-95 transition shadow-xs hover:shadow-md flex flex-col justify-between text-left cursor-pointer group ring-1 ring-amber-200"
            >
              <div className="flex items-start justify-between gap-1 w-full mb-2">
                <span className="text-2xl">🔢</span>
                <span className="font-black bg-amber-200 text-amber-950 px-2.5 py-1 rounded-xl text-xs sm:text-sm shrink-0 shadow-xs">
                  {g1Count} câu
                </span>
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-amber-950 line-clamp-1 leading-snug">
                  Game 1: {getGame1Title(selectedRound)}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs sm:text-sm font-black text-amber-800">
                  <span>Chơi Game 1</span>
                  <span className="group-hover:translate-x-1 transition text-amber-600">Bấm chơi ngay ▶</span>
                </div>
              </div>
            </button>

            {/* Game 2 Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onStartPractice(selectedRound, 'game2_matching');
              }}
              title={`Chơi ngay Game 2: ${getGame2Title(selectedRound)}`}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/70 hover:from-emerald-100 hover:to-emerald-200 active:scale-95 transition shadow-xs hover:shadow-md flex flex-col justify-between text-left cursor-pointer group ring-1 ring-emerald-200"
            >
              <div className="flex items-start justify-between gap-1 w-full mb-2">
                <span className="text-2xl">🧩</span>
                <span className="font-black bg-emerald-200 text-emerald-950 px-2.5 py-1 rounded-xl text-xs sm:text-sm shrink-0 shadow-xs">
                  {g2Count} câu
                </span>
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-emerald-950 line-clamp-1 leading-snug">
                  Game 2: {getGame2Title(selectedRound)}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs sm:text-sm font-black text-emerald-800">
                  <span>Chơi Game 2</span>
                  <span className="group-hover:translate-x-1 transition text-emerald-600">Bấm chơi ngay ▶</span>
                </div>
              </div>
            </button>

            {/* Game 3 Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onStartPractice(selectedRound, 'game3_climbing');
              }}
              title="Chơi ngay Game 3: Leo dốc 100 câu"
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/70 hover:from-blue-100 hover:to-blue-200 active:scale-95 transition shadow-xs hover:shadow-md flex flex-col justify-between text-left cursor-pointer group ring-1 ring-blue-200"
            >
              <div className="flex items-start justify-between gap-1 w-full mb-2">
                <span className="text-2xl">🧗‍♂️</span>
                <span className="font-black bg-blue-200 text-blue-950 px-2.5 py-1 rounded-xl text-xs sm:text-sm shrink-0 shadow-xs">
                  {g3Count} câu
                </span>
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-blue-950 line-clamp-1 leading-snug">
                  Game 3: Leo dốc
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs sm:text-sm font-black text-blue-800">
                  <span>Chơi Game 3</span>
                  <span className="group-hover:translate-x-1 transition text-blue-600">Bấm chơi ngay ▶</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Key Action Buttons - Large, tactile, impossible to miss on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Bắt đầu luyện tập (Game 3: 100 câu) */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartPractice(selectedRound, 'game3_climbing');
          }}
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-5 rounded-3xl shadow-md border-3 border-emerald-300 transition active:scale-98 flex flex-col justify-between text-left min-h-[140px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-3xl">🚀</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition">
              <Play className="w-5 h-5 fill-white text-white" />
            </div>
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-emerald-100 block">Game 3: Leo dốc ({g3Count} câu)</span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Bắt đầu luyện tập</h3>
          </div>
        </button>

        {/* 2. Chọn dạng bài */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenGameSelect();
          }}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-5 rounded-3xl shadow-md border-3 border-blue-300 transition active:scale-98 flex flex-col justify-between text-left min-h-[140px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-3xl">🎮</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Grid className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-blue-100 block">Sắp xếp, Ghép cặp, Leo dốc</span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Chọn dạng bài</h3>
          </div>
        </button>

        {/* 3. Ôn tập câu đã sai */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenMistakesReview();
          }}
          className={`group relative overflow-hidden p-5 rounded-3xl shadow-md border-3 transition active:scale-98 flex flex-col justify-between text-left min-h-[140px] cursor-pointer ${
            mistakeCount > 0
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-300 hover:from-amber-600 hover:to-orange-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-3xl">💡</span>
            {mistakeCount > 0 ? (
              <span className="px-3 py-1 bg-white text-orange-600 text-xs sm:text-sm font-black rounded-full shadow-xs">
                {mistakeCount} câu cần sửa
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold rounded-full">
                Chưa có câu sai
              </span>
            )}
          </div>
          <div>
            <span className={`text-xs sm:text-sm font-bold block ${mistakeCount > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
              Luyện lại đến khi đúng
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Ôn tập câu đã sai</h3>
          </div>
        </button>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg sm:text-xl font-black text-slate-800">Thành Tích Của Bé</h3>
          </div>

          {stats.totalAttempted > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bé có muốn đặt lại thống kê điểm số về 0 để làm lại từ đầu không?')) {
                  soundManager.playClick();
                  onResetStats();
                }
              }}
              title="Đặt lại thống kê"
              className="text-xs sm:text-sm text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Total attempted */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 sm:p-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
              <History className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-blue-900 leading-none">
              {stats.totalAttempted}
            </div>
            <div className="text-xs sm:text-sm font-black text-blue-700 mt-1">Câu đã làm</div>
          </div>

          {/* Correct count */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 sm:p-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-emerald-900 leading-none">
              {stats.totalCorrect}
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-700 mt-1">Câu đúng</div>
          </div>

          {/* Accuracy % */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 sm:p-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-amber-900 leading-none">
              {accuracy}%
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-700 mt-1">Chính xác</div>
          </div>
        </div>

        {/* Cheerful motivation message */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3 text-sm sm:text-base text-slate-700 font-bold">
          <span className="text-2xl">🌟</span>
          <span>
            {stats.totalAttempted === 0
              ? 'Bé hãy chọn một Game hoặc bấm "Bắt đầu luyện tập" để nhận điểm thưởng nhé!'
              : accuracy >= 80
              ? 'Thành tích rất xuất sắc! Bé tiếp tục giữ vững phong độ leo dốc điểm 10 nhé!'
              : 'Mỗi ngày làm một ít câu hỏi, bé sẽ giải toán Violympic thật nhanh và giỏi!'}
          </span>
        </div>
      </div>
    </div>
  );
};
