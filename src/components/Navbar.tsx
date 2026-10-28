/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Database, Sparkles, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenDataModal: () => void;
  onGoHome?: () => void;
  showBack?: boolean;
  backTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDataModal,
  onGoHome,
  showBack = false,
  backTitle = 'Trang chủ',
}) => {
  const [soundOn, setSoundOn] = useState(soundManager.isSoundEnabled());
  const [voiceOn, setVoiceOn] = useState(soundManager.isVoiceEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playCorrect();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    soundManager.setVoiceEnabled(next);
    if (next) {
      soundManager.speakText('Bật giọng đọc câu hỏi');
    } else {
      soundManager.stopSpeaking();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-xs px-3 sm:px-6 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Back or Brand */}
        <div className="flex items-center gap-2">
          {showBack && onGoHome ? (
            <button
              onClick={() => {
                soundManager.playClick();
                soundManager.stopSpeaking();
                onGoHome();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs sm:text-sm transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">{backTitle}</span>
            </button>
          ) : (
            <div
              onClick={() => onGoHome && onGoHome()}
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-amber-950 font-black text-lg sm:text-xl shadow-xs group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight text-blue-900 leading-tight">
                  Bé vui học Toán
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-amber-600">
                  Violympic Lớp 2 ⭐
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            className={`p-2 rounded-xl transition font-bold text-xs flex items-center justify-center ${
              soundOn
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          </button>

          {/* Voice Speech Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceOn ? 'Tắt đọc đề bằng giọng nói' : 'Bật đọc đề bằng giọng nói'}
            className={`p-2 rounded-xl transition font-bold text-xs flex items-center justify-center ${
              voiceOn
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {voiceOn ? <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          </button>

          {/* JSON Bank Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDataModal();
            }}
            title="Nhập đề JSON các vòng mới & Sao lưu"
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-black transition active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span className="hidden md:inline">Nhập/Xuất JSON</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
