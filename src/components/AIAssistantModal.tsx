import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  FileSpreadsheet,
  Layers,
  HeartHandshake,
  Info,
} from 'lucide-react';
import { AITaskType, requestAIAssistant } from '../services/aiService';
import { TeacherProfile } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  initialTopic?: string;
  onApplyResult?: (text: string, taskType: AITaskType) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialTopic = '',
  onApplyResult,
  onShowToast,
}) => {
  const [taskType, setTaskType] = useState<AITaskType>('tujuan_pembelajaran');
  const [mapel, setMapel] = useState(profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)');
  const [kelas, setKelas] = useState(profile.kelasAktif || 'VII-A');
  const [topik, setTopik] = useState(initialTopic || 'Ciri-Ciri Makhluk Hidup & Keanekaragaman Hayati');
  const [konteks, setKonteks] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [modelBadge, setModelBadge] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const taskOptions: { id: AITaskType; label: string; icon: any; desc: string }[] = [
    {
      id: 'tujuan_pembelajaran',
      label: 'Tujuan Pembelajaran (TP)',
      icon: BookOpen,
      desc: 'Rumuskan TP operasional & bukti ketercapaian',
    },
    {
      id: 'aktivitas_mendalam',
      label: 'Aktivitas Mendalam',
      icon: Lightbulb,
      desc: '3 Pengalaman (Pahami, Aplikasikan, Refleksi) & 3 Prinsip (Sadar, Bermakna, Gembira)',
    },
    {
      id: 'pertanyaan_pemantik',
      label: 'Pertanyaan Pemantik',
      icon: HelpCircle,
      desc: 'Pertanyaan kontekstual memancing nalar kritis siswa SMP',
    },
    {
      id: 'asesmen_formatif',
      label: 'Asesmen Formatif',
      icon: Layers,
      desc: 'Ide asesmen formatif ramah siswa tanpa tekanan nilai',
    },
    {
      id: 'rubrik_penilaian',
      label: 'Rubrik / Kriteria KKTP',
      icon: FileSpreadsheet,
      desc: 'Skala capaian deskriptif: Baru Berkembang s.d. Mahir',
    },
    {
      id: 'refleksi_guru',
      label: 'Refleksi Diri Guru',
      icon: Sparkles,
      desc: 'Pertanyaan evaluasi kualitas proses dan keterlibatan',
    },
    {
      id: 'tindak_lanjut',
      label: 'Rencana Tindak Lanjut',
      icon: HeartHandshake,
      desc: 'Strategi remedial bermakna dan tantangan pengayaan',
    },
  ];

  const handleGenerate = async () => {
    if (!topik.trim()) {
      onShowToast('error', 'Silakan isi topik/materi terlebih dahulu');
      return;
    }

    setLoading(true);
    setIsEditing(false);
    try {
      const resp = await requestAIAssistant({
        taskType,
        mapel,
        kelas,
        topik,
        konteksTambahan: konteks,
        kktp: profile.kktpDefault || 75,
      });

      setResultText(resp.text);
      setModelBadge(resp.modelLabel);
      onShowToast('success', 'Rancangan rekomendasi pembelajaran berhasil dibuat!');
    } catch (err: any) {
      onShowToast('error', 'Gagal memproses rekomendasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    onShowToast('success', 'Teks berhasil disalin ke papan klip');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyResult && resultText) {
      onApplyResult(resultText, taskType);
      onShowToast('success', 'Hasil diterapkan ke dalam formulir administrasi');
      onClose();
    }
  };

  return (
    <div
      id="ai-assistant-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/30 rounded-lg border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                AI Asisten Administrasi Guru SMP
              </h2>
              <p className="text-xs text-indigo-200">
                Penyusun rancangan berbasis Pembelajaran Mendalam (Deep Learning)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Form Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                1. Pilih Jenis Rekomendasi
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {taskOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = taskType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTaskType(opt.id)}
                      className={`text-left p-2 rounded-lg border transition-all text-xs flex items-start space-x-2.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="leading-tight">{opt.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Mis. IPA"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Mis. VII-A"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topik / Materi Pembelajaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Mis. Wujud Zat dan Model Partikel"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konteks / Catatan Tambahan (Opsional)
              </label>
              <textarea
                value={konteks}
                onChange={(e) => setKonteks(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Mis. Karakteristik siswa suka praktik langsung, sekolah memiliki laboratorium IPA dan taman botani..."
              />
            </div>

            <button
              id="btn-generate-ai"
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Sedang Merumuskan...' : 'Hasilkan Rancangan'}</span>
            </button>

            {/* Disclaimer badge */}
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-tight">
                Semua hasil merupakan alat bantu perancangan. Guru memiliki wewenang penuh untuk memeriksa, merevisi, dan menyesuaikan isi sesuai kondisi nyata peserta didik.
              </p>
            </div>
          </div>

          {/* Right Column: Output & Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700">Hasil Rancangan</span>
                {modelBadge && (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {modelBadge}
                  </span>
                )}
              </div>
              {resultText && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 text-[11px]"
                  >
                    {isEditing ? 'Selesai Edit' : 'Edit Hasil'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="p-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50"
                    title="Regenerasi"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-xs">Menyusun rekomendasi pembelajaran mendalam...</p>
                </div>
              ) : resultText ? (
                isEditing ? (
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    className="w-full h-80 text-xs p-3 font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans select-text">
                    {resultText}
                  </div>
                )
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center px-6">
                  <Sparkles className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Belum ada rancangan yang dibuat</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Pilih jenis rekomendasi dan klik tombol &quot;Hasilkan Rancangan&quot; untuk menyusun panduan pembelajaran terintegrasi.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom bar inside output */}
            {resultText && onApplyResult && (
              <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Gunakan Hasil di Formulir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
