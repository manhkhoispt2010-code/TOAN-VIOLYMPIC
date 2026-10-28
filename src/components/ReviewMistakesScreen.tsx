/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Play,
  Trash2,
  CheckCircle,
  Lightbulb,
  Sparkles,
  AlertCircle,
  BookmarkX,
} from 'lucide-react';
import { MistakeItem, ViolympicQuestion } from '../types';
import { soundManager } from '../utils/audio';
import { formatAnswerDisplay } from '../utils/gradingEngine';

interface ReviewMistakesScreenProps {
  mistakes: MistakeItem[];
  onStartReviewQuiz: (questions: ViolympicQuestion[]) => void;
  onRemoveMistake: (questionId: string) => void;
  onClearAllMistakes: () => void;
  onBack: () => void;
}

export const ReviewMistakesScreen: React.FC<ReviewMistakesScreenProps> = ({
  mistakes,
  onStartReviewQuiz,
  onRemoveMistake,
  onClearAllMistakes,
  onBack,
}) => {
  const handleStartQuiz = () => {
    soundManager.playClick();
    const questionsToPractice = mistakes.map((m) => m.question);
    onStartReviewQuiz(questionsToPractice);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>

        {mistakes.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Bé có muốn xóa hết danh sách câu đã sai không?')) {
                soundManager.playClick();
                onClearAllMistakes();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa danh sách</span>
          </button>
        )}
      </div>

      {/* Title Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sổ tay ôn tập</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Các Câu Hỏi Cần Ôn Lại
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-600">
          Luyện tập lại các câu đã từng làm sai giúp bé nhớ lâu và không bị nhầm lẫn
        </p>
      </div>

      {/* Main Content */}
      {mistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border-3 border-amber-300 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
            🌟
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Tuyệt vời! Không có câu hỏi nào bị sai!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
              Bé đã làm đúng tất cả các câu hỏi hoặc đã ôn tập thành thạo. Hãy tiếp tục làm các phần thi mới nhé!
            </p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-95 inline-flex items-center gap-2"
          >
            <span>Về trang chủ chọn bài mới</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Action Button to Practice all mistakes */}
          <button
            onClick={handleStartQuiz}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base sm:text-lg rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Luyện tập ngay {mistakes.length} câu này</span>
          </button>

          {/* List of Questions with Explanation */}
          <div className="space-y-3">
            {mistakes.map((item) => {
              const q = item.question;
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-xs">
                        Vòng {q.round}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {q.knowledge_topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Sai {item.timesWrong} lần
                      </span>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onRemoveMistake(q.id);
                        }}
                        title="Đã hiểu câu này, xóa khỏi sổ tay"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {q.source_text}
                  </p>

                  {/* Answers review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <span className="text-slate-500 block mb-0.5">Câu trả lời sai:</span>
                      <span className="font-black text-rose-700">
                        {formatAnswerDisplay(item.wrongAnswer)}
                      </span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-slate-500 block mb-0.5">Đáp án đúng chuẩn:</span>
                      <span className="font-black text-emerald-800">
                        {formatAnswerDisplay(q.verified_answer)}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-950">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Hướng dẫn giải: </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
