/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    soundManager.playClick();
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert('Để cài đặt ứng dụng: Hãy nhấn vào biểu tượng Cài đặt trên thanh địa chỉ trình duyệt của bạn.');
    }
  };

  // If already running standalone
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Đã cài đặt</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Cài đặt ứng dụng về màn hình chính điện thoại hoặc máy tính"
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition"
      >
        <Smartphone className="w-4 h-4 animate-bounce" />
        <span>Cài app vào máy</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-300 relative text-center">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Download className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-800">Cài đặt trên iPhone / iPad</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Để chơi không cần mở lại trình duyệt và tiện dùng như ứng dụng thật:
            </p>

            <div className="mt-4 text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">1</span>
                <span>Nhấn nút <strong className="text-blue-600 inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline" /> Chia sẻ (Share)</strong> ở thanh dưới trình duyệt Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">2</span>
                <span>Cuộn xuống và chọn <strong className="text-slate-900">"Thêm vào MH chính" (Add to Home Screen)</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">3</span>
                <span>Nhấn <strong className="text-emerald-600">Thêm (Add)</strong> ở góc trên bên phải là xong!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-xl shadow-md transition active:scale-98"
            >
              Đã hiểu rồi!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
