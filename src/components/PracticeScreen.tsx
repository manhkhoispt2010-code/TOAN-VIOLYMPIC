/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Lightbulb,
  Check,
  X,
} from 'lucide-react';
import {
  PracticeSessionState,
  ViolympicQuestion,
  UserAnswerRecord,
} from '../types';
import { evaluateAnswer, formatAnswerDisplay } from '../utils/gradingEngine';
import { soundManager } from '../utils/audio';
import { parseOrderingItems, parseMatchingPairs } from '../utils/gameUtils';

interface PracticeScreenProps {
  questions: ViolympicQuestion[];
  session: PracticeSessionState;
  onUpdateSession: (updated: PracticeSessionState) => void;
  onRecordResult: (question: ViolympicQuestion, isCorrect: boolean) => void;
  onRecordMistake: (question: ViolympicQuestion, wrongAnswer: any) => void;
  onFinishSession: (finalSession: PracticeSessionState) => void;
  onExit: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  questions,
  session,
  onUpdateSession,
  onRecordResult,
  onRecordMistake,
  onFinishSession,
  onExit,
}) => {
  const currentIndex = session.currentIndex;
  const currentQuestion = questions[currentIndex];

  // Local state for the current question's interactive input
  const existingRecord: UserAnswerRecord | undefined = session.answers[currentQuestion?.id];
  const [currentInput, setCurrentInput] = useState<any>(
    existingRecord ? existingRecord.userAnswer : ''
  );
  const [isChecked, setIsChecked] = useState<boolean>(!!existingRecord);
  const [isCorrect, setIsCorrect] = useState<boolean>(existingRecord ? existingRecord.isCorrect : false);

  // Matching game state: selected first card
  const [matchingSelectedCard, setMatchingSelectedCard] = useState<string | null>(null);
  const [guideHint, setGuideHint] = useState<string | null>(null);

  // Child-friendly accessibility states
  const [fontSizeLevel, setFontSizeLevel] = useState<'large' | 'extralarge'>('large');
  const [speechRate, setSpeechRateState] = useState<number>(() => soundManager.getSpeechRate());

  // Sync state when question index changes
  useEffect(() => {
    if (!currentQuestion) return;
    const rec = session.answers[currentQuestion.id];
    if (rec) {
      setCurrentInput(rec.userAnswer);
      setIsChecked(true);
      setIsCorrect(rec.isCorrect);
    } else {
      if (currentQuestion.question_type === 'ordering') {
        setCurrentInput([]);
      } else if (currentQuestion.question_type === 'matching') {
        setCurrentInput({});
      } else {
        setCurrentInput('');
      }
      setIsChecked(false);
      setIsCorrect(false);
    }
    setMatchingSelectedCard(null);
    setGuideHint(null);

    // Speak question if voice is enabled
    if (soundManager.isVoiceEnabled()) {
      soundManager.speakText(currentQuestion.source_text);
    }

    return () => {
      soundManager.stopSpeaking();
    };
  }, [currentIndex, currentQuestion?.id]);

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
        <p className="font-bold text-slate-700">Không tìm thấy câu hỏi nào trong phần này.</p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Check Answer Handler
  const handleCheck = () => {
    soundManager.playClick();
    if (isChecked) return;

    // Validate inputs per question type with friendly guidance
    if (currentQuestion.question_type === 'multiple_choice') {
      if (!currentInput || String(currentInput).trim() === '') {
        setGuideHint('Bé hãy chạm vào một đáp án A, B, C hoặc D trước khi bấm kiểm tra nhé! 💡');
        soundManager.playIncorrect();
        return;
      }
    } else if (currentQuestion.question_type === 'fill_in_the_blank' || currentQuestion.question_type === 'fill_blank') {
      if (!currentInput || String(currentInput).trim() === '') {
        setGuideHint('Bé hãy bấm các phím số bên dưới để điền đáp án nhé! ✏️');
        soundManager.playIncorrect();
        return;
      }
    } else if (currentQuestion.question_type === 'ordering') {
      const neededCount = parseOrderingItems(currentQuestion).length;
      const currentCount = Array.isArray(currentInput) ? currentInput.length : 0;
      if (neededCount > 0 && currentCount < neededCount) {
        setGuideHint(`Bé mới xếp được ${currentCount}/${neededCount} thẻ. Bé hãy chọn nốt các thẻ còn lại nhé! 🔢`);
        soundManager.playIncorrect();
        return;
      }
    } else if (currentQuestion.question_type === 'matching') {
      const expCount = Object.keys(parseMatchingPairs(currentQuestion)).length;
      const userPairCount =
        typeof currentInput === 'object' && !Array.isArray(currentInput) && currentInput !== null
          ? Object.keys(currentInput).length
          : 0;
      if (expCount > 0 && userPairCount < expCount) {
        setGuideHint(`Bé mới nối được ${userPairCount}/${expCount} cặp. Bé hãy chạm thẻ để ghép đủ tất cả các cặp nhé! 🔗`);
        soundManager.playIncorrect();
        return;
      }
    }

    setGuideHint(null);
    const correct = evaluateAnswer(currentQuestion, currentInput);
    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
      onRecordMistake(currentQuestion, currentInput);
    }

    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      userAnswer: currentInput,
      isCorrect: correct,
      timestamp: Date.now(),
      timeSpentSeconds: 0,
    };

    const updatedAnswers = {
      ...session.answers,
      [currentQuestion.id]: record,
    };

    const newCorrectCount = Object.values(updatedAnswers).filter((r) => r.isCorrect).length;
    const newTotalAnswered = Object.keys(updatedAnswers).length;
    const newScore = newCorrectCount * 10;

    const updatedSession: PracticeSessionState = {
      ...session,
      answers: updatedAnswers,
      correctCount: newCorrectCount,
      totalAnswered: newTotalAnswered,
      score: newScore,
    };

    onUpdateSession(updatedSession);
    onRecordResult(currentQuestion, correct);
  };

  // Next Question Handler
  const handleNext = () => {
    soundManager.playClick();
    soundManager.stopSpeaking();

    if (currentIndex < questions.length - 1) {
      const nextSession: PracticeSessionState = {
        ...session,
        currentIndex: currentIndex + 1,
      };
      onUpdateSession(nextSession);
    } else {
      const finishedSession: PracticeSessionState = {
        ...session,
        isCompleted: true,
      };
      onFinishSession(finishedSession);
    }
  };

  // Previous Question Handler
  const handlePrev = () => {
    soundManager.playClick();
    soundManager.stopSpeaking();
    if (currentIndex > 0) {
      const prevSession: PracticeSessionState = {
        ...session,
        currentIndex: currentIndex - 1,
      };
      onUpdateSession(prevSession);
    }
  };

  const handleSpeakQuestion = () => {
    soundManager.playClick();
    soundManager.speakText(currentQuestion.source_text);
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const renderInteractiveArea = () => {
    switch (currentQuestion.question_type) {
      case 'multiple_choice': {
        const options = currentQuestion.options || ['A', 'B', 'C', 'D'];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {options.map((option, idx) => {
              const letter = letters[idx] || String(idx + 1);
              const isSelected = currentInput === option || currentInput === letter;

              let buttonStyle = 'bg-white border-2 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer shadow-xs hover:shadow-sm';
              if (isSelected && !isChecked) {
                buttonStyle = 'bg-blue-50 border-3 border-blue-600 text-blue-950 shadow-md ring-2 ring-blue-200';
              } else if (isChecked) {
                const isThisTheCorrectAnswer = evaluateAnswer(currentQuestion, option) || evaluateAnswer(currentQuestion, letter);
                if (isThisTheCorrectAnswer) {
                  buttonStyle = 'bg-emerald-50 border-3 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-200';
                } else if (isSelected && !isCorrect) {
                  buttonStyle = 'bg-rose-50 border-3 border-rose-400 text-rose-950 opacity-90 ring-2 ring-rose-200';
                } else {
                  buttonStyle = 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isChecked}
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentInput(option);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 text-left transition active:scale-98 min-h-[72px] sm:min-h-[82px] cursor-pointer ${buttonStyle}`}
                >
                  <span
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-xs ${
                      isSelected
                        ? isChecked
                          ? isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className={`${fontSizeLevel === 'extralarge' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black leading-snug`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'fill_in_the_blank':
      case 'fill_blank': {
        const quickKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        const unitKeys = ['cm', 'dm', 'kg', 'l'];
        const symbolKeys = ['<', '>', '='];

        const handleKeypadPress = (val: string) => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput((prev: string) => (prev ? `${prev}${val}` : val));
        };

        const handleBackspace = () => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput((prev: string) => (prev ? prev.slice(0, -1).trim() : ''));
        };

        const handleClear = () => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput('');
        };

        const handleAddUnit = (u: string) => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput((prev: string) => {
            const trimmed = (prev || '').trim();
            if (trimmed.endsWith(u)) return trimmed;
            return trimmed ? `${trimmed} ${u}` : u;
          });
        };

        return (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <span className="font-black text-base sm:text-lg text-slate-800">Đáp án của bé:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`relative min-w-[200px] max-w-[300px] p-3.5 sm:p-4 rounded-2xl border-4 text-center font-black text-3xl sm:text-4xl tracking-wider shadow-inner ${
                    isChecked
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-rose-50 border-rose-400 text-rose-700'
                      : 'bg-white border-amber-400 text-blue-950'
                  }`}
                >
                  {currentInput ? currentInput : <span className="text-slate-300 font-semibold text-xl">Bấm số dưới</span>}
                </div>
                {!isChecked && currentInput && (
                  <button
                    onClick={handleClear}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs sm:text-sm transition cursor-pointer"
                  >
                    Xóa hết
                  </button>
                )}
              </div>
            </div>

            {!isChecked && (
              <div className="bg-amber-50/80 p-4 rounded-3xl border-2 border-amber-300 max-w-md mx-auto space-y-2.5 shadow-sm">
                <div className="grid grid-cols-5 gap-2">
                  {quickKeys.map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleKeypadPress(digit)}
                      className="py-3.5 sm:py-4 bg-white hover:bg-amber-100 text-slate-900 font-black text-2xl sm:text-3xl rounded-2xl shadow-xs border-2 border-amber-200 active:scale-95 transition cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {unitKeys.map((u) => (
                    <button
                      key={u}
                      onClick={() => handleAddUnit(u)}
                      className="py-3 sm:py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-black text-base sm:text-lg rounded-2xl border-2 border-blue-200 active:scale-95 transition cursor-pointer"
                    >
                      {u}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {symbolKeys.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleKeypadPress(s)}
                      className="py-3 sm:py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-black text-xl sm:text-2xl rounded-2xl border-2 border-purple-200 active:scale-95 transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={handleBackspace}
                    title="Xóa ký tự vừa gõ"
                    className="py-3 sm:py-3.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-black text-xl sm:text-2xl rounded-2xl border-2 border-rose-300 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'ordering': {
        const candidateItems: string[] = parseOrderingItems(currentQuestion);
        const chosenItems: string[] = Array.isArray(currentInput) ? currentInput : [];

        const handlePickItem = (item: string) => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput([...chosenItems, item]);
        };

        const handleRemoveItem = (indexToRemove: number) => {
          if (isChecked) return;
          soundManager.playClick();
          const copy = [...chosenItems];
          copy.splice(indexToRemove, 1);
          setCurrentInput(copy);
        };

        const handleResetOrder = () => {
          if (isChecked) return;
          soundManager.playClick();
          setCurrentInput([]);
        };

        const remainingItems = [...candidateItems];
        chosenItems.forEach((c) => {
          const idx = remainingItems.indexOf(c);
          if (idx >= 0) remainingItems.splice(idx, 1);
        });

        return (
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <span className="text-sm sm:text-base font-black text-slate-700">
                Thứ tự bé đã xếp ({chosenItems.length}/{candidateItems.length}):
              </span>
            </div>

            <div className="min-h-[78px] p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 flex flex-wrap items-center justify-center gap-2.5">
              {chosenItems.length === 0 ? (
                <span className="text-sm sm:text-base text-amber-800 font-bold italic text-center">
                  👉 Chạm các thẻ bên dưới theo thứ tự từ bé đến lớn hoặc theo đề bài
                </span>
              ) : (
                chosenItems.map((val, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRemoveItem(idx)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-base sm:text-xl shadow-md cursor-pointer hover:bg-rose-600 transition"
                    title="Chạm để gỡ khỏi vị trí"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/25 text-xs sm:text-sm flex items-center justify-center font-black">
                      {idx + 1}
                    </span>
                    <span>{val}</span>
                    {!isChecked && <span className="text-xs opacity-75">✕</span>}
                  </div>
                ))
              )}
            </div>

            {!isChecked && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase">
                    Các thẻ số / phép tính cần chọn:
                  </span>
                  {chosenItems.length > 0 && (
                    <button
                      onClick={handleResetOrder}
                      className="text-xs sm:text-sm text-rose-600 font-black hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xếp lại từ đầu</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center">
                  {remainingItems.length === 0 ? (
                    <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-4 py-2 rounded-2xl border border-emerald-300 shadow-xs">
                      ✓ Bé đã chọn đủ tất cả các thẻ! Hãy bấm "Kiểm tra" nhé.
                    </span>
                  ) : (
                    remainingItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePickItem(item)}
                        className="px-5 py-3 bg-white hover:bg-amber-100 text-slate-900 font-black text-lg sm:text-2xl rounded-2xl border-2 border-amber-300 shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        {item}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'matching': {
        const userPairs: Record<string, string> =
          typeof currentInput === 'object' && !Array.isArray(currentInput) ? currentInput : {};

        const parsedPairs = parseMatchingPairs(currentQuestion);
        const allCards: string[] = currentQuestion.options && currentQuestion.options.length > 0
          ? currentQuestion.options
          : [
              ...Object.keys(parsedPairs),
              ...Object.values(parsedPairs),
            ];

        const uniqueCards = Array.from(new Set(allCards));

        const getPartner = (card: string) => {
          if (userPairs[card]) return userPairs[card];
          const revKey = Object.keys(userPairs).find((k) => userPairs[k] === card);
          return revKey || null;
        };

        const handleCardClick = (card: string) => {
          if (isChecked) return;
          soundManager.playClick();

          const partner = getPartner(card);
          if (partner) {
            const newPairs = { ...userPairs };
            delete newPairs[card];
            delete newPairs[partner];
            setCurrentInput(newPairs);
            setMatchingSelectedCard(null);
            return;
          }

          if (!matchingSelectedCard) {
            setMatchingSelectedCard(card);
          } else {
            if (matchingSelectedCard === card) {
              setMatchingSelectedCard(null);
            } else {
              const newPairs = {
                ...userPairs,
                [matchingSelectedCard]: card,
              };
              setCurrentInput(newPairs);
              setMatchingSelectedCard(null);
              soundManager.playMatch();
            }
          }
        };

        const pairColors = [
          'bg-emerald-100 border-emerald-400 text-emerald-950',
          'bg-blue-100 border-blue-400 text-blue-950',
          'bg-purple-100 border-purple-400 text-purple-950',
          'bg-pink-100 border-pink-400 text-pink-950',
          'bg-amber-100 border-amber-400 text-amber-950',
        ];

        return (
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm sm:text-base font-black text-slate-700">
              👉 Chạm thẻ thứ nhất, sau đó chạm thẻ thứ hai để nối cặp với nhau:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uniqueCards.map((card, idx) => {
                const partner = getPartner(card);
                const isSelected = matchingSelectedCard === card;

                let cardStyle = 'bg-white border-2 border-slate-200 text-slate-900 hover:border-amber-400';
                if (isSelected) {
                  cardStyle = 'bg-amber-300 border-3 border-amber-500 text-amber-950 font-black scale-102 ring-3 ring-amber-200 shadow-md';
                } else if (partner) {
                  const pairKeys = Object.keys(userPairs);
                  const pIdx = pairKeys.indexOf(card) >= 0 ? pairKeys.indexOf(card) : pairKeys.indexOf(partner);
                  const colorClass = pairColors[(pIdx >= 0 ? pIdx : 0) % pairColors.length];
                  cardStyle = `${colorClass} border-3 font-black shadow-xs`;
                }

                return (
                  <button
                    key={idx}
                    disabled={isChecked}
                    onClick={() => handleCardClick(card)}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition min-h-[84px] sm:min-h-[96px] cursor-pointer active:scale-95 shadow-xs ${cardStyle}`}
                  >
                    <span className="text-lg sm:text-2xl font-black leading-snug">{card}</span>
                    {partner && (
                      <span className="text-xs sm:text-sm font-black opacity-85 mt-1.5 bg-white/60 px-2 py-0.5 rounded-lg">
                        🔗 Nối với: {partner}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!isChecked && Object.keys(userPairs).length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentInput({});
                    setMatchingSelectedCard(null);
                  }}
                  className="text-xs sm:text-sm text-rose-600 font-black hover:underline flex items-center gap-1 cursor-pointer p-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa hết các cặp nối</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-3 sm:py-5 space-y-4">
      {/* Top Header & Progress */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border-2 border-amber-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              soundManager.stopSpeaking();
              onExit();
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold text-xs p-1 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tạm dừng</span>
          </button>

          <div className="text-center">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
              {session.modeName}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-blue-900">
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Leo Dốc Mountain Progress Track */}
        <div className="relative pt-1">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className="absolute -top-3 transform -translate-x-1/2 transition-all duration-300 pointer-events-none"
            style={{ left: `${Math.max(4, Math.min(96, progressPercent))}%` }}
          >
            <div className="w-7 h-7 bg-amber-400 text-amber-950 rounded-full border-2 border-white shadow-md flex items-center justify-center text-sm">
              🐰
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border-3 border-amber-300 space-y-5">
        {/* Verification Warning Badge if needs_review */}
        {currentQuestion.verification_status !== 'verified' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-950">
                ⚠️ Câu hỏi đang được đối chiếu từ nguồn sách
              </p>
              {currentQuestion.notes && (
                <p className="mt-0.5 font-medium">{currentQuestion.notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Question Topic & Read Aloud Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-base">
              {currentIndex + 1}
            </span>
            <span className="text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
              {currentQuestion.id}
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-500">
              {currentQuestion.knowledge_topic}
            </span>
          </div>

          {/* Child & Parent Accessibility Controls: Speed, Font Size, Read Aloud */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Speed toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                const nextRate = speechRate === 1.15 ? 1.3 : speechRate === 1.3 ? 1.0 : 1.15;
                soundManager.setSpeechRate(nextRate);
                setSpeechRateState(nextRate);
                soundManager.speakText(`Tốc độ ${nextRate}x`);
              }}
              title="Đổi tốc độ đọc đề: 1.0x, 1.15x (nhanh), 1.3x (rất nhanh)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs sm:text-sm transition active:scale-95 cursor-pointer shadow-xs border border-amber-200"
            >
              <span>⚡ {speechRate}x</span>
            </button>

            {/* Font size toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                setFontSizeLevel((prev) => (prev === 'large' ? 'extralarge' : 'large'));
              }}
              title="Phóng to cỡ chữ cho bé"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-xs sm:text-sm transition active:scale-95 cursor-pointer shadow-xs border border-sky-200"
            >
              <span>🔍 Chữ {fontSizeLevel === 'large' ? 'To' : 'Cực to'}</span>
            </button>

            {/* Read aloud button */}
            <button
              onClick={handleSpeakQuestion}
              title="Đọc to câu hỏi bằng tiếng Việt"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 fill-white" />
              <span>Nghe đọc đề</span>
            </button>
          </div>
        </div>

        {/* Source Text Question Body - Large, prominent, clear for 2nd graders */}
        <div
          className={`${
            fontSizeLevel === 'extralarge' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
          } font-black text-slate-900 leading-relaxed tracking-tight whitespace-pre-line py-1`}
        >
          {currentQuestion.source_text}
        </div>

        {/* Interactive Answering Form */}
        {renderInteractiveArea()}

        {/* Feedback Section (Shown AFTER clicking "Kiểm tra") */}
        {isChecked && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border-3 space-y-3 animate-in fade-in duration-200 ${
              isCorrect
                ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950 shadow-sm'
                : 'bg-rose-50/95 border-rose-400 text-rose-950 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
              )}
              <h4 className="text-lg sm:text-2xl font-black">
                {isCorrect ? 'Chính xác! Bé làm rất giỏi! 🎉' : 'Chưa đúng rồi! Bé cùng xem đáp án nhé:'}
              </h4>
            </div>

            {!isCorrect && (
              <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl border-2 border-rose-200 text-base sm:text-lg">
                <span className="font-black text-slate-700">Đáp án đúng là: </span>
                <span className="font-black text-emerald-700 text-xl sm:text-2xl ml-1">
                  {formatAnswerDisplay(currentQuestion.verified_answer)}
                </span>
              </div>
            )}

            {currentQuestion.explanation && (
              <div className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed bg-white/80 p-3.5 rounded-xl border border-black/5">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-slate-800">Lời giải chi tiết: </span>
                  <span className="font-bold text-slate-700">{currentQuestion.explanation}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gentle Inline Guide Hint */}
        {guideHint && (
          <div className="bg-amber-100/90 border-2 border-amber-300 text-amber-950 p-3.5 rounded-2xl flex items-center gap-3 text-sm sm:text-base font-black shadow-sm animate-in fade-in duration-150">
            <span className="text-2xl">🐰</span>
            <div className="leading-snug">{guideHint}</div>
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-black text-sm sm:text-base flex items-center gap-1.5 transition ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden xs:inline">Câu trước</span>
          </button>

          {!isChecked ? (
            <button
              onClick={handleCheck}
              className="flex-1 py-3.5 sm:py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Kiểm tra đáp án</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 sm:py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer animate-bounce-short"
            >
              <span>{currentIndex === questions.length - 1 ? 'Hoàn thành bài thi' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
