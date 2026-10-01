import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Clock,
  Loader2,
  Edit3,
  Award,
  Check,
} from 'lucide-react';
import { Perencanaan, TeacherProfile } from '../types';
import {
  extractTextFromDocx,
  extractTextFromPdf,
  parseRppTextToPerencanaan,
  enhanceImportedRPPWithAI,
} from '../utils/rppImport';

interface ImportPerencanaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  onImportSuccess: (importedPlan: Perencanaan, openInEditor?: boolean) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ImportPerencanaanModal: React.FC<ImportPerencanaanModalProps> = ({
  isOpen,
  onClose,
  profile,
  onImportSuccess,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [previewTab, setPreviewTab] = useState<'identitas' | 'langkah' | 'asesmen' | 'mendalam'>('identitas');

  // Input states
  const [pastedText, setPastedText] = useState<string>('');
  const [targetClass, setTargetClass] = useState<string>(profile.kelasAktif || 'VII-A');
  const [targetMapel, setTargetMapel] = useState<string>(profile.mataPelajaran || '');

  // Processing states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isEnhancingAI, setIsEnhancingAI] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'docx' | 'pdf' | 'text' | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [parsedPlan, setParsedPlan] = useState<Perencanaan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setPastedText('');
    setFileName('');
    setFileType(null);
    setRawExtractedText('');
    setParsedPlan(null);
    setErrorMessage('');
    setIsExtracting(false);
    setIsEnhancingAI(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processTextToPlan = (text: string, sourceName: string, type: 'docx' | 'pdf' | 'text') => {
    try {
      const plan = parseRppTextToPerencanaan(text, {
        ...profile,
        kelasAktif: targetClass,
        mataPelajaran: targetMapel || profile.mataPelajaran,
      });

      setRawExtractedText(text);
      setParsedPlan(plan);
      setFileName(sourceName);
      setFileType(type);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage('Terjadi kendala saat menganalisis struktur RPP: ' + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    setIsExtracting(true);
    setErrorMessage('');

    try {
      let extracted = '';
      if (ext === 'docx') {
        extracted = await extractTextFromDocx(file);
        processTextToPlan(extracted, file.name, 'docx');
      } else if (ext === 'pdf') {
        extracted = await extractTextFromPdf(file);
        processTextToPlan(extracted, file.name, 'pdf');
      } else {
        setErrorMessage('Format berkas tidak didukung. Harap pilih berkas berekstensi Microsoft Word (.docx) atau PDF (.pdf).');
        setIsExtracting(false);
        return;
      }

      if (!extracted.trim()) {
        setErrorMessage('Berkas tidak memuat teks yang dapat diekstrak (kemungkinan dokumen berbasis pemindaian/scan gambar murni).');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage('Gagal membaca berkas: ' + (err.message || 'Format tidak valid.'));
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Silakan tempelkan (paste) teks dokumen RPP/RPM terlebih dahulu.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage('');
    try {
      processTextToPlan(pastedText, 'Teks Tempelan (Clipboard)', 'text');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!parsedPlan || !rawExtractedText) return;

    setIsEnhancingAI(true);
    try {
      const enhanced = await enhanceImportedRPPWithAI(rawExtractedText, parsedPlan, profile);
      setParsedPlan(enhanced);
      onShowToast('success', 'Berhasil mengoptimalkan struktur RPP dengan prinsip Pembelajaran Mendalam!');
    } catch (err: any) {
      onShowToast('error', 'Gagal memproses dengan AI: ' + err.message);
    } finally {
      setIsEnhancingAI(false);
    }
  };

  const handleSaveImport = (openInEditor = false) => {
    if (!parsedPlan) return;

    onImportSuccess(parsedPlan, openInEditor);
    onShowToast(
      'success',
      `Perencanaan "${parsedPlan.judul}" berhasil diimpor ke sistem!`
    );
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-800">
                  Impor Perencanaan (RPP / RPM / Modul Ajar)
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                  Word & PDF
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Unggah berkas Microsoft Word (.docx) atau dokumen PDF (.pdf), atau tempelkan teks RPP untuk dikonversi otomatis ke format Kurikulum Terkini.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Target Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sasaran Kelas / Rombel:
              </label>
              <select
                value={targetClass}
                onChange={(e) => {
                  setTargetClass(e.target.value);
                  if (parsedPlan) {
                    setParsedPlan({
                      ...parsedPlan,
                      identitas: { ...parsedPlan.identitas, kelas: e.target.value },
                    });
                  }
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                {profile.kelasList.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran:
              </label>
              <input
                type="text"
                value={targetMapel}
                onChange={(e) => {
                  setTargetMapel(e.target.value);
                  if (parsedPlan) {
                    setParsedPlan({
                      ...parsedPlan,
                      identitas: { ...parsedPlan.identitas, mataPelajaran: e.target.value },
                    });
                  }
                }}
                placeholder="Contoh: Ilmu Pengetahuan Alam (IPA)"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Berkas (Word & PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'paste'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Salin-Tempel (Copy & Paste Teks)</span>
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/20 group"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <FileCode className="w-5 h-5 text-rose-600" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  Pilih atau Tarik Berkas RPP (Word / PDF) ke Sini
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3">
                  Mendukung format: Microsoft Word (<strong>.docx</strong>) dan dokumen <strong>.pdf</strong> (teks).
                </p>
                <button
                  type="button"
                  disabled={isExtracting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-2xs group-hover:bg-indigo-700 transition-colors inline-flex items-center space-x-1.5"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Membaca Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Dokumen RPP</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Copy Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempelkan (Paste) Teks Dokumen RPP / RPM / Modul Ajar:
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh isi teks RPP:\nMODUL AJAR IPA FASE D\nTopik / Materi: Klasifikasi Makhluk Hidup\nKelas/Semester: VII / Ganjil\nAlokasi Waktu: 2 x 40 menit\n\nA. Capaian Pembelajaran: ...\nB. Tujuan Pembelajaran: ...\nC. Langkah-langkah Pembelajaran: ...`}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim() || isExtracting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menganalisis Teks...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Ekstrak & Susun Modul</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PARSED PLAN PREVIEW */}
          {parsedPlan && (
            <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3.5">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">
                        RPP Berhasil Diekstrak & Disesuaikan
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full font-bold uppercase">
                        {fileType === 'docx' ? 'MS Word (.docx)' : fileType === 'pdf' ? 'PDF (.pdf)' : 'Teks'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sumber: <strong>{fileName}</strong> ({rawExtractedText.length.toLocaleString('id-ID')} karakter)
                    </p>
                  </div>
                </div>

                {/* AI Refine Button */}
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancingAI}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 shadow-2xs"
                >
                  {isEnhancingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Menyelaraskan dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Optimalkan dengan AI (Permendikdasmen No 13/2025)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Topic quick edit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Judul Modul Ajar / RPP:
                  </label>
                  <input
                    type="text"
                    value={parsedPlan.judul}
                    onChange={(e) => setParsedPlan({ ...parsedPlan, judul: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Topik / Materi Pokok:
                  </label>
                  <input
                    type="text"
                    value={parsedPlan.identitas.topikMateri}
                    onChange={(e) =>
                      setParsedPlan({
                        ...parsedPlan,
                        identitas: { ...parsedPlan.identitas, topikMateri: e.target.value },
                      })
                    }
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Preview Sub-tabs */}
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('identitas')}
                  className={`py-1.5 px-3 font-semibold border-b-2 transition-colors ${
                    previewTab === 'identitas'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tujuan Pembelajaran
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('langkah')}
                  className={`py-1.5 px-3 font-semibold border-b-2 transition-colors ${
                    previewTab === 'langkah'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Langkah KBM
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('asesmen')}
                  className={`py-1.5 px-3 font-semibold border-b-2 transition-colors ${
                    previewTab === 'asesmen'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Rencana Asesmen
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('mendalam')}
                  className={`py-1.5 px-3 font-semibold border-b-2 transition-colors ${
                    previewTab === 'mendalam'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Prinsip Mendalam (3 Pilar)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700 space-y-2.5 max-h-56 overflow-y-auto">
                {previewTab === 'identitas' && (
                  <>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        Capaian Pembelajaran (CP):
                      </span>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {parsedPlan.tujuanPembelajaran.capaianPembelajaran}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        Tujuan Pembelajaran (TP):
                      </span>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {parsedPlan.tujuanPembelajaran.tujuanPembelajaran}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        Dimensi Profil Lulusan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedPlan.identifikasi.dimensiProfilLulusan.map((d, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-[11px] font-medium"
                          >
                            ✓ {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {previewTab === 'langkah' && (
                  <>
                    <div>
                      <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        1. Pendahuluan ({parsedPlan.rencanaKegiatan.durasiPendahuluan}):
                      </span>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {parsedPlan.rencanaKegiatan.pendahuluan}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        2. Kegiatan Inti ({parsedPlan.rencanaKegiatan.durasiInti}):
                      </span>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {parsedPlan.rencanaKegiatan.kegiatanInti}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider mb-0.5">
                        3. Penutup ({parsedPlan.rencanaKegiatan.durasiPenutup}):
                      </span>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {parsedPlan.rencanaKegiatan.penutup}
                      </p>
                    </div>
                  </>
                )}

                {previewTab === 'asesmen' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
                        <span className="font-bold text-sky-900 block text-[11px]">Asesmen Awal:</span>
                        <p className="text-[11px] text-sky-800 mt-1">{parsedPlan.rencanaAsesmen.asesmenAwal}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="font-bold text-emerald-900 block text-[11px]">Asesmen Proses:</span>
                        <p className="text-[11px] text-emerald-800 mt-1">{parsedPlan.rencanaAsesmen.asesmenProses}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                        <span className="font-bold text-purple-900 block text-[11px]">Asesmen Akhir:</span>
                        <p className="text-[11px] text-purple-800 mt-1">{parsedPlan.rencanaAsesmen.asesmenAkhir}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Kriteria Ketercapaian (KKTP):</span>
                      <p className="text-slate-600 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {parsedPlan.rencanaAsesmen.kriteriaKetercapaian}
                      </p>
                    </div>
                  </>
                )}

                {previewTab === 'mendalam' && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                      <span className="font-bold text-indigo-950 block text-[11px]">Pilar 1: Berkesadaran (Mindful)</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{parsedPlan.prinsipPembelajaranMendalam.berkesadaran}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <span className="font-bold text-emerald-950 block text-[11px]">Pilar 2: Bermakna (Meaningful)</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{parsedPlan.prinsipPembelajaranMendalam.bermakna}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                      <span className="font-bold text-amber-950 block text-[11px]">Pilar 3: Menggembirakan (Joyful)</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{parsedPlan.prinsipPembelajaranMendalam.menggembirakan}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={!parsedPlan}
              onClick={() => handleSaveImport(false)}
              className="px-4 py-2 border border-emerald-500 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan ke Daftar</span>
            </button>

            <button
              type="button"
              disabled={!parsedPlan}
              onClick={() => handleSaveImport(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <span>Buka di Editor Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
