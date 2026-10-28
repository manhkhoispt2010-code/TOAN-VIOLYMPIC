/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Download, RotateCcw, AlertTriangle, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { ViolympicQuestion } from '../types';
import {
  validateJSONData,
  exportQuestionsToJSON,
  downloadJSONFile,
  ValidationReport,
} from '../utils/jsonManager';
import { soundManager } from '../utils/audio';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestions: ViolympicQuestion[];
  onSaveQuestions: (newQuestions: ViolympicQuestion[]) => void;
  onResetToDefault: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  currentQuestions,
  onSaveQuestions,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'reset'>('import');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      // Run validation immediately
      const report = validateJSONData(content, currentQuestions);
      setValidationReport(report);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Không thể đọc tệp này. Vui lòng kiểm tra lại.' });
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleValidateManual = () => {
    soundManager.playClick();
    setStatusMessage(null);
    if (!jsonInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chọn tệp JSON hoặc dán nội dung vào ô bên dưới.' });
      return;
    }
    const report = validateJSONData(jsonInput, currentQuestions);
    setValidationReport(report);
  };

  const handleApplyImport = () => {
    soundManager.playClick();
    if (!validationReport) {
      handleValidateManual();
      return;
    }

    if (!validationReport.isValid) {
      soundManager.playIncorrect();
      setStatusMessage({
        type: 'error',
        text: `Tệp chứa ${validationReport.errors.length} lỗi. Quy định an toàn: Không ghi đè hoặc nhập dữ liệu khi tệp có lỗi để tránh mất mát câu hỏi. Vui lòng sửa các lỗi bên dưới trước khi nhập.`,
      });
      return;
    }

    if (validationReport.validQuestions.length === 0) {
      soundManager.playIncorrect();
      setStatusMessage({ type: 'error', text: 'Không tìm thấy câu hỏi hợp lệ nào trong tệp.' });
      return;
    }

    // Process questions
    let finalQuestions: ViolympicQuestion[] = [];
    if (importMode === 'replace') {
      finalQuestions = validationReport.validQuestions;
    } else {
      // Append mode: update or add by ID
      const existingMap = new Map(currentQuestions.map((q) => [q.id, q]));
      for (const newQ of validationReport.validQuestions) {
        existingMap.set(newQ.id, newQ);
      }
      finalQuestions = Array.from(existingMap.values());
    }

    onSaveQuestions(finalQuestions);
    soundManager.playVictory();
    setStatusMessage({
      type: 'success',
      text: `Đã nhập thành công ${validationReport.validQuestions.length} câu hỏi! Tổng số câu hỏi trong ngân hàng hiện tại: ${finalQuestions.length}.`,
    });
    setValidationReport(null);
    setJsonInput('');
    setFileName('');
  };

  const handleExport = () => {
    soundManager.playClick();
    const jsonStr = exportQuestionsToJSON(currentQuestions);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSONFile(`violympic_toan2_du_lieu_${dateStr}.json`, jsonStr);
    setStatusMessage({
      type: 'success',
      text: `Đã xuất ${currentQuestions.length} câu hỏi ra tệp JSON thành công! Hãy lưu giữ để sao lưu.`,
    });
  };

  const handleResetConfirm = () => {
    soundManager.playClick();
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại bộ câu hỏi mặc định ban đầu không? Mọi dữ liệu câu hỏi tự thêm sẽ được đưa về dữ liệu chuẩn sách.')) {
      onResetToDefault();
      soundManager.playCorrect();
      setStatusMessage({
        type: 'success',
        text: 'Đã khôi phục thành công bộ câu hỏi mặc định chuẩn Violympic lớp 2!',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 sm:p-5 flex items-center justify-between text-amber-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/80 rounded-xl shadow-xs">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">Quản lý Ngân hàng Câu hỏi JSON</h2>
              <p className="text-xs sm:text-sm font-semibold opacity-90">Nhập đề các vòng mới, xuất bản sao lưu hoặc khôi phục</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 text-amber-950/70 hover:text-amber-950 hover:bg-white/40 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-amber-50/50 p-2 gap-2 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-amber-100/70'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập JSON mới</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-amber-100/70'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Xuất JSON ({currentQuestions.length} câu)</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('reset');
              setStatusMessage(null);
            }}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              activeTab === 'reset'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục gốc</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 grow">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-bold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs sm:text-sm text-blue-900 leading-relaxed">
                <p className="font-extrabold flex items-center gap-1.5 mb-1 text-blue-950">
                  <CheckCircle className="w-4 h-4 text-blue-600" /> Tiêu chuẩn nhập tệp an toàn:
                </p>
                Hệ thống kiểm tra kỹ cấu trúc, mã câu hỏi trùng lặp và xác thực từng trường (`id`, `round`, `section`, `question_number`, `source_text`, `question_type`, `source_answer`...). Nếu tệp có lỗi, hệ thống sẽ từ chối và hiển thị chi tiết, <strong>không làm hỏng dữ liệu đang có</strong>.
              </div>

              {/* Upload Box */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-slate-700 font-bold text-sm"
                >
                  <Upload className="w-6 h-6 text-blue-600" />
                  <span>{fileName ? `Đã chọn: ${fileName}` : 'Chọn tệp .json từ thiết bị'}</span>
                </button>
                <button
                  onClick={handleValidateManual}
                  className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl shadow-sm transition active:scale-95 text-sm shrink-0"
                >
                  Kiểm tra cấu trúc JSON
                </button>
              </div>

              {/* Or paste JSON text */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                  Hoặc dán nội dung JSON trực tiếp:
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setValidationReport(null);
                  }}
                  placeholder='[ { "id": "V2-G3-Q01", "round": 2, "section": "game3_climbing", "question_number": 1, ... } ]'
                  rows={5}
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
                />
              </div>

              {/* Mode choice */}
              <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-700">
                <span>Chế độ nạp dữ liệu:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-blue-600"
                    />
                    <span>Bổ sung / Cập nhật</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-rose-600"
                    />
                    <span>Thay thế toàn bộ</span>
                  </label>
                </div>
              </div>

              {/* Validation Report Display */}
              {validationReport && (
                <div
                  className={`p-4 rounded-2xl border-2 space-y-3 ${
                    validationReport.isValid
                      ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-400 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                      {validationReport.isValid ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span>Dữ liệu hợp lệ ({validationReport.validQuestions.length} câu)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                          <span>Phát hiện {validationReport.errors.length} lỗi trong tệp JSON</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/80 font-bold border">
                      Tổng số mục đọc được: {validationReport.totalParsed}
                    </span>
                  </div>

                  {/* Errors list */}
                  {validationReport.errors.length > 0 && (
                    <div className="bg-white/90 p-3 rounded-xl border border-rose-200 max-h-48 overflow-y-auto space-y-1.5 text-xs text-rose-800">
                      <p className="font-extrabold text-rose-900 mb-1">Chi tiết các câu lỗi:</p>
                      {validationReport.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-1.5 pb-1 border-b border-rose-100 last:border-b-0">
                          <span className="font-black shrink-0">#{err.index} {err.id ? `[${err.id}]` : ''}:</span>
                          <span>{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Duplicates notice */}
                  {validationReport.duplicateIdsWithExisting.length > 0 && importMode === 'append' && (
                    <p className="text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      ℹ️ Có {validationReport.duplicateIdsWithExisting.length} câu trùng mã ID với câu đã có trong máy. Các câu này sẽ được cập nhật phiên bản mới nhất từ tệp tải lên.
                    </p>
                  )}

                  {/* Action to Apply */}
                  {validationReport.isValid && (
                    <button
                      onClick={handleApplyImport}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Xác nhận nạp {validationReport.validQuestions.length} câu hỏi vào máy</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Xuất Ngân Hàng Câu Hỏi</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Tải về toàn bộ <strong className="text-blue-600">{currentQuestions.length} câu hỏi</strong> hiện có dưới dạng tệp JSON chuẩn, bao gồm cả các câu bạn đã nhập thêm hoặc chỉnh sửa.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 max-w-md mx-auto space-y-1">
                <div className="flex justify-between">
                  <span>Số vòng thi hiện có:</span>
                  <span className="font-bold text-slate-900">
                    {Array.from(new Set(currentQuestions.map((q) => q.round))).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số câu leo dốc (Game 3):</span>
                  <span className="font-bold text-slate-900">
                    {currentQuestions.filter((q) => q.section.includes('climbing')).length} câu
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số câu cần rà soát:</span>
                  <span className="font-bold text-amber-700">
                    {currentQuestions.filter((q) => q.verification_status !== 'verified').length} câu
                  </span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-md transition active:scale-95 inline-flex items-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-5 h-5" />
                <span>Tải tệp JSON về máy</span>
              </button>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-800">Khôi Phục Dữ Liệu Gốc</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Đặt lại toàn bộ câu hỏi về danh sách mẫu ban đầu theo sách Violympic Toán lớp 2. Thao tác này sẽ xóa các câu hỏi mới bạn đã tự thêm vào.
                </p>
              </div>

              <button
                onClick={handleResetConfirm}
                className="py-3 px-8 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition active:scale-95 inline-flex items-center gap-2 text-sm sm:text-base"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Đồng ý khôi phục dữ liệu chuẩn</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
