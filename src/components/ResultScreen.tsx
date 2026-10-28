/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  Percent,
  Sparkles,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { PracticeSessionState, ViolympicQuestion } from '../types';
import { soundManager } from '../utils/audio';
import { formatAnswerDisplay } from '../utils/gradingEngine';

interface ResultScreenProps {
  session: PracticeSessionState;
  questions: ViolympicQuestion[];
  onRetry: () => void;
  onGoHome: () => void;
  onReviewMistakes: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  session,
  questions,
  onRetry,
  onGoHome,
  onReviewMistakes,
}) => {
  const total = session.totalAnswered || questions.length;
  const correct = session.correctCount;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Identify wrong questions from this session
  const wrongQuestions = questions.filter((q) => {
    const rec = session.answers[q.id];
    return rec && !rec.isCorrect;
  });

  useEffect(() => {
    soundManager.playVictory();
    // Confetti celebration if >= 60%
    if (accuracy >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [accuracy]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Celebration Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 text-center text-amber-950 shadow-lg border-4 border-amber-300">
        <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-3 text-4xl shadow-inner">
          {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : '💪'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {accuracy >= 90
            ? 'Xuất sắc tuyệt vời! Bé là quán quân Toán học!'
            : accuracy >= 70
            ? 'Rất giỏi! Bé đã vượt qua bài thi!'
            : 'Cố gắng lên nhé! Bé hãy xem lại các câu chưa đúng.'}
        </h2>
        <p className="text-xs sm:text-sm font-bold text-amber-900/90 mt-1">
          {session.modeName} • Violympic Lớp 2
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Questions */}
        <div className="bg-white p-4 rounded-3xl border-2 border-blue-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900">{total}</div>
          <div className="text-xs font-bold text-blue-700">Tổng số câu</div>
        </div>

        {/* Correct Questions */}
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">{correct}</div>
          <div className="text-xs font-bold text-emerald-700">Câu đúng</div>
        </div>

        {/* Accuracy */}
        <div className="bg-white p-4 rounded-3xl border-2 border-amber-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1">
            <Percent className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">{accuracy}%</div>
          <div className="text-xs font-bold text-amber-700">Chính xác</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            soundManager.playClick();
            onRetry();
          }}
          className="py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Làm lại bài thi này</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onGoHome();
          }}
          className="py-3.5 px-6 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-black text-base rounded-2xl shadow-xs transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5 text-slate-600" />
          <span>Quay về trang chủ</span>
        </button>
      </div>

      {/* List of Missed Questions to Review */}
      {wrongQuestions.length > 0 ? (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Danh Sách {wrongQuestions.length} Câu Cần Ôn Tập
              </h3>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onReviewMistakes();
              }}
              className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Vào phòng ôn tập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {wrongQuestions.map((q, idx) => {
              const userAns = session.answers[q.id]?.userAnswer;
              return (
                <div
                  key={q.id}
                  className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs sm:text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-blue-900">
                      Câu {q.question_number}: {q.knowledge_topic}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                      Chưa đúng
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 leading-snug">{q.source_text}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="bg-white/80 p-2 rounded-xl border border-rose-100">
                      <span className="text-slate-500 text-[11px] block">Đáp án bé đã chọn:</span>
                      <span className="font-bold text-rose-600">{formatAnswerDisplay(userAns)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                      <span className="text-slate-500 text-[11px] block">Đáp án đúng chuẩn:</span>
                      <span className="font-black text-emerald-700">
                        {formatAnswerDisplay(q.verified_answer)}
                      </span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="flex items-start gap-1.5 text-slate-700 pt-1">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 text-center space-y-2">
          <div className="text-3xl">🎉</div>
          <h4 className="font-black text-emerald-900 text-base">
            Tuyệt vời! Bé không làm sai câu nào cả!
          </h4>
          <p className="text-xs text-emerald-700 font-semibold">
            Bé hãy tiếp tục luyện tập các phần thi tiếp theo để giữ vững kết quả cao nhé.
          </p>
        </div>
      )}
    </div>
  );
};
