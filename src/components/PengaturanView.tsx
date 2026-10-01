import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  BookOpen,
  Info,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  exportAllDataToJSON,
  importDataFromJSON,
  resetToDefaultDemoData,
  clearAllStorageData,
} from '../data/storage';
import { GoogleSheetsSyncSection } from './GoogleSheetsSyncSection';

interface PengaturanViewProps {
  onDataReload: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  onDataReload,
  onShowToast,
  onOpenGoogleSheetsModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [keepProfileInfo, setKeepProfileInfo] = useState<boolean>(true);

  const handleExportJSON = () => {
    const jsonStr = exportAllDataToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GURU_SMART_ADMIN_CADANGAN_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Berkas cadangan data (JSON) berhasil diunduh');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = importDataFromJSON(content);
        if (ok) {
          onDataReload();
          onShowToast('success', 'Data berhasil dipulihkan dari berkas cadangan');
        } else {
          onShowToast('error', 'Format berkas JSON tidak sesuai atau rusak');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmResetDemo = () => {
    resetToDefaultDemoData();
    onDataReload();
    setShowResetModal(false);
    onShowToast('info', 'Data berhasil dikembalikan ke format contoh (DEMO)');
  };

  const handleConfirmClearAll = () => {
    clearAllStorageData({ resetProfile: !keepProfileInfo });
    onDataReload();
    setShowClearModal(false);
    onShowToast('info', 'Semua data telah dikosongkan. Siap digunakan untuk administrasi baru.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="pengaturan-view-container">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pengaturan & Manajemen Data</h2>
            <p className="text-xs text-slate-500">
              Sinkronkan ke Google Sheets & AppSheet, cadangkan administrasi lokal, pulihkan data, atau tinjau regulasi kurikulum.
            </p>
          </div>
        </div>
      </div>

      {/* Google Sheets & AppSheet Integration */}
      <GoogleSheetsSyncSection
        onDataReload={onDataReload}
        onShowToast={onShowToast}
        onOpenModal={onOpenGoogleSheetsModal}
      />

      {/* Section 1: Backup & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Cadangan & Pemulihan Data Lokal</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Semua data tersimpan aman di peramban (browser) Anda. Untuk mencegah kehilangan data saat berpindah perangkat atau membersihkan riwayat web, disarankan untuk mengunduh berkas cadangan secara berkala.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/40 text-left transition-all flex items-start space-x-3 group"
          >
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Cadangkan Data (Ekspor JSON)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unduh seluruh profil, perencanaan, jurnal, dan nilai ke berkas tunggal JSON.
              </p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/40 text-left transition-all flex items-start space-x-3 group"
          >
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Pulihkan Data (Impor JSON)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unggah berkas JSON cadangan yang pernah dibuat sebelumnya.
              </p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Muat Ulang Data Contoh (DEMO)</span>
          </button>

          <button
            type="button"
            id="btn-kosongkan-semua-data"
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Kosongkan Semua Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Kosongkan Semua Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kosongkan Semua Data Administrasi?</h3>
                  <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 space-y-2 leading-relaxed">
              <p className="font-semibold">Perhatian:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                <li>Seluruh <strong>Perencanaan Pembelajaran (Modul Ajar)</strong> akan dihapus.</li>
                <li>Seluruh <strong>Jurnal Mengajar & Presensi KBM</strong> akan dihapus.</li>
                <li>Seluruh <strong>Daftar Peserta Didik & Data Nilai Asesmen</strong> akan dikosongkan.</li>
              </ul>
            </div>

            <div className="pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepProfileInfo}
                  onChange={(e) => setKeepProfileInfo(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pertahankan profil identitas guru, NIP, nama sekolah, & kepala sekolah</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-kosongkan-data"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Demo */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Muat Ulang Data Contoh (DEMO)?</h3>
                  <p className="text-[11px] text-slate-500">Kembalikan contoh administrasi IPA SMP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengisi kembali seluruh modul dengan contoh data lengkap (Perencanaan klasifikasi makhluk hidup, jurnal pertemuan, 32 siswa kelas VII-A, dan instrumen asesmen). Data kustom yang belum dicadangkan akan tertimpa.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-muat-demo"
                onClick={handleConfirmResetDemo}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Data DEMO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Landasan Kurikulum & Regulasi */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Landasan Pendidikan & Kebijakan Kurikulum Terkini</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">
              Permendikdasmen Nomor 13 Tahun 2025
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Tentang standar kompetensi lulusan, standar isi, proses, dan penilaian pada pendidikan anak usia dini, jenjang pendidikan dasar, dan jenjang pendidikan menengah. Menegaskan pentingnya penyederhanaan administrasi agar guru dapat fokus mendampingi tumbuh kembang peserta didik.
            </p>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
            <h4 className="font-bold text-indigo-950 mb-1">
              Kepmendikdasmen Nomor 126/P/2025: Pembelajaran Mendalam (Deep Learning)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <span className="font-semibold text-indigo-900 block mb-1">3 Pengalaman Belajar:</span>
                <ul className="space-y-1 text-slate-700">
                  <li>• <strong>Memahami:</strong> Membangun konsepsi dan menganalisis fakta.</li>
                  <li>• <strong>Mengaplikasi:</strong> Menerapkan dalam masalah kontekstual.</li>
                  <li>• <strong>Merefleksi:</strong> Mengambil hikmah dan merumuskan aksi nyata.</li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-indigo-900 block mb-1">3 Prinsip Pembelajaran:</span>
                <ul className="space-y-1 text-slate-700">
                  <li>• <strong>Berkesadaran (Mindful):</strong> Hadir utuh dan fokus.</li>
                  <li>• <strong>Bermakna (Meaningful):</strong> Relevan dengan kehidupan nyata.</li>
                  <li>• <strong>Menggembirakan (Joyful):</strong> Menumbuhkan rasa suka belajar.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
