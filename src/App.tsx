/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { GameSelectScreen } from './components/GameSelectScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { ReviewMistakesScreen } from './components/ReviewMistakesScreen';
import { DataManagementModal } from './components/DataManagementModal';
import {
  ViolympicQuestion,
  PracticeSessionState,
  OverallStats,
  MistakeItem,
} from './types';
import {
  getStoredQuestions,
  saveStoredQuestions,
  resetToDefaultQuestions,
  getStoredStats,
  recordQuestionResult,
  resetStats,
  getStoredMistakes,
  saveMistake,
  removeMistake,
  clearAllMistakes,
  getActiveSession,
  saveActiveSession,
} from './utils/storage';
import { useOnlineStatus } from './utils/useOnlineStatus';
import { soundManager } from './utils/audio';
import { WifiOff } from 'lucide-react';
import { isGame1, isGame2, isGame3, getGame1Title, getGame2Title } from './utils/gameUtils';

type Screen = 'home' | 'game_select' | 'practice' | 'result' | 'review_mistakes';

export default function App() {
  const isOnline = useOnlineStatus();

  // Primary state
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [questions, setQuestions] = useState<ViolympicQuestion[]>(() => getStoredQuestions());
  const [stats, setStats] = useState<OverallStats>(() => getStoredStats());
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => getStoredMistakes());
  const [activeSession, setActiveSession] = useState<PracticeSessionState | null>(() => getActiveSession());
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [activePracticeQuestions, setActivePracticeQuestions] = useState<ViolympicQuestion[]>([]);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  // Sync questions & mistakes to storage when updated
  const handleSaveQuestions = (newQuestions: ViolympicQuestion[]) => {
    setQuestions(newQuestions);
    saveStoredQuestions(newQuestions);
  };

  const handleResetToDefault = () => {
    const defaults = resetToDefaultQuestions();
    setQuestions(defaults);
    setActiveSession(null);
    saveActiveSession(null);
  };

  const handleResetStats = () => {
    resetStats();
    setStats(getStoredStats());
  };

  // Launch a new or specific practice session
  const handleStartPractice = (round: number, sectionOrTopic: string = 'game3_climbing', filterTopic?: string) => {
    let filtered = questions.filter((q) => q.round === round);

    let modeTitle = `Vòng ${round} - Game 3: Leo dốc (100 câu)`;

    if (sectionOrTopic.startsWith('game1') || sectionOrTopic.includes('sorting') || sectionOrTopic.includes('ordering')) {
      filtered = filtered.filter(isGame1);
      modeTitle = `Vòng ${round} - Game 1: ${getGame1Title(round)}`;
    } else if (
      sectionOrTopic.startsWith('game2') ||
      sectionOrTopic.includes('matching') ||
      sectionOrTopic.includes('zodiac') ||
      sectionOrTopic.includes('treasure') ||
      sectionOrTopic.includes('drop') ||
      sectionOrTopic.includes('bugs') ||
      sectionOrTopic.includes('peak')
    ) {
      filtered = filtered.filter(isGame2);
      modeTitle = `Vòng ${round} - Game 2: ${getGame2Title(round)}`;
    } else if (sectionOrTopic.startsWith('game3') || sectionOrTopic === 'leo_doc' || sectionOrTopic.includes('climbing')) {
      filtered = filtered.filter(isGame3);
      modeTitle = `Vòng ${round} - Game 3: Leo dốc (100 câu)`;
    } else if (sectionOrTopic === 'topic' && filterTopic) {
      filtered = filtered.filter((q) => q.knowledge_topic === filterTopic);
      modeTitle = `Vòng ${round} - Chuyên đề: ${filterTopic}`;
    }

    if (filtered.length === 0) {
      alert(`Chưa có câu hỏi nào trong phần thi này ở Vòng ${round}. Bạn có thể thêm câu hỏi bằng chức năng Nhập JSON!`);
      return;
    }

    // Sort questions by question_number
    filtered.sort((a, b) => a.question_number - b.question_number);

    const newSession: PracticeSessionState = {
      round,
      section: sectionOrTopic || 'all',
      modeName: modeTitle,
      currentIndex: 0,
      answers: {},
      score: 0,
      totalAnswered: 0,
      correctCount: 0,
      isCompleted: false,
      startTime: Date.now(),
    };

    setActivePracticeQuestions(filtered);
    setActiveSession(newSession);
    saveActiveSession(newSession);
    setCurrentScreen('practice');
  };

  // Resume unfinished session
  const handleResumeSession = () => {
    if (!activeSession) return;
    let filtered = questions.filter((q) => q.round === activeSession.round);

    if (activeSession.section === 'game1_sorting') {
      filtered = filtered.filter((q) => q.section.includes('sorting') || q.section === 'game1_sorting');
    } else if (activeSession.section === 'game2_matching') {
      filtered = filtered.filter((q) => q.section.includes('matching') || q.section === 'game2_matching');
    } else if (activeSession.section === 'game3_climbing' || activeSession.section === 'all') {
      filtered = filtered.filter((q) => q.section.includes('climbing') || q.section === 'game3_climbing');
    }

    filtered.sort((a, b) => a.question_number - b.question_number);

    if (filtered.length === 0) {
      filtered = questions;
    }

    setActivePracticeQuestions(filtered);
    setCurrentScreen('practice');
  };

  // Start dedicated review of mistake questions
  const handleStartReviewQuiz = (mistakeQuestions: ViolympicQuestion[]) => {
    if (mistakeQuestions.length === 0) return;

    const reviewSession: PracticeSessionState = {
      round: 0,
      section: 'mistakes_review',
      modeName: 'Ôn tập câu đã làm sai',
      currentIndex: 0,
      answers: {},
      score: 0,
      totalAnswered: 0,
      correctCount: 0,
      isCompleted: false,
      startTime: Date.now(),
    };

    setActivePracticeQuestions(mistakeQuestions);
    setActiveSession(reviewSession);
    saveActiveSession(reviewSession);
    setCurrentScreen('practice');
  };

  // Question Answered Callbacks
  const handleRecordResult = (question: ViolympicQuestion, isCorrect: boolean) => {
    const updatedStats = recordQuestionResult(question, isCorrect);
    setStats(updatedStats);

    // If answering in review mode and got it right, remove from mistakes list
    if (isCorrect) {
      removeMistake(question.id);
      setMistakes(getStoredMistakes());
    }
  };

  const handleRecordMistake = (question: ViolympicQuestion, wrongAnswer: any) => {
    saveMistake(question, wrongAnswer);
    setMistakes(getStoredMistakes());
  };

  const handleUpdateSession = (updated: PracticeSessionState) => {
    setActiveSession(updated);
    saveActiveSession(updated);
  };

  const handleFinishSession = (finalSession: PracticeSessionState) => {
    setActiveSession(finalSession);
    saveActiveSession(null); // Clear active in-progress state so home doesn't show resume alert
    setCurrentScreen('result');
  };

  const handleRetryCurrentSession = () => {
    if (!activeSession) return;
    const restarted: PracticeSessionState = {
      ...activeSession,
      currentIndex: 0,
      answers: {},
      score: 0,
      totalAnswered: 0,
      correctCount: 0,
      isCompleted: false,
      startTime: Date.now(),
    };
    setActiveSession(restarted);
    saveActiveSession(restarted);
    setCurrentScreen('practice');
  };

  const handleRemoveSingleMistake = (questionId: string) => {
    removeMistake(questionId);
    setMistakes(getStoredMistakes());
  };

  const handleClearAllMistakes = () => {
    clearAllMistakes();
    setMistakes([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50/40 to-amber-50/30 flex flex-col font-['Nunito',sans-serif]">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-black py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Đang ở chế độ ngoại tuyến (Offline) — Bé vẫn có thể luyện tập bình thường!</span>
        </div>
      )}

      {/* Main Top Navbar */}
      <Navbar
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onGoHome={() => {
          soundManager.stopSpeaking();
          setCurrentScreen('home');
        }}
        showBack={currentScreen !== 'home'}
        backTitle={currentScreen === 'game_select' ? 'Trang chủ' : 'Quay lại'}
      />

      {/* Screen Views */}
      <main className="flex-1 pb-10">
        {currentScreen === 'home' && (
          <HomeScreen
            stats={stats}
            questions={questions}
            mistakeCount={mistakes.length}
            selectedRound={selectedRound}
            onSelectRound={(rnd) => setSelectedRound(rnd)}
            onStartPractice={(rnd, section) => handleStartPractice(rnd, section)}
            onOpenGameSelect={() => setCurrentScreen('game_select')}
            onOpenMistakesReview={() => setCurrentScreen('review_mistakes')}
            activeSession={activeSession}
            onResumeSession={handleResumeSession}
            onResetStats={handleResetStats}
          />
        )}

        {currentScreen === 'game_select' && (
          <GameSelectScreen
            round={selectedRound}
            questions={questions}
            onSelectGame={(section, filterTopic) => handleStartPractice(selectedRound, section, filterTopic)}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'practice' && activeSession && (
          <PracticeScreen
            questions={activePracticeQuestions}
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onRecordResult={handleRecordResult}
            onRecordMistake={handleRecordMistake}
            onFinishSession={handleFinishSession}
            onExit={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'result' && activeSession && (
          <ResultScreen
            session={activeSession}
            questions={activePracticeQuestions}
            onRetry={handleRetryCurrentSession}
            onGoHome={() => setCurrentScreen('home')}
            onReviewMistakes={() => {
              const wrongOnes = activePracticeQuestions.filter(
                (q) => activeSession.answers[q.id] && !activeSession.answers[q.id].isCorrect
              );
              if (wrongOnes.length > 0) {
                handleStartReviewQuiz(wrongOnes);
              } else {
                setCurrentScreen('review_mistakes');
              }
            }}
          />
        )}

        {currentScreen === 'review_mistakes' && (
          <ReviewMistakesScreen
            mistakes={mistakes}
            onStartReviewQuiz={handleStartReviewQuiz}
            onRemoveMistake={handleRemoveSingleMistake}
            onClearAllMistakes={handleClearAllMistakes}
            onBack={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {/* JSON Bank / Data Management Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentQuestions={questions}
        onSaveQuestions={handleSaveQuestions}
        onResetToDefault={handleResetToDefault}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 font-bold border-t border-amber-200/50 bg-white/50">
        Bé vui học Toán – Violympic Lớp 2 • Đồng hành cùng học sinh tiểu học
      </footer>
    </div>
  );
}
