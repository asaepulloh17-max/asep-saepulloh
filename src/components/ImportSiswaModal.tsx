import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Users,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  parseStudentsFromExcel,
  parseStudentsFromWord,
  parseStudentsFromPastedText,
  downloadStudentTemplateExcel,
  convertToPesertaDidik,
  ParsedStudentRow,
} from '../utils/studentImport';
import { PesertaDidik } from '../types';

interface ImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: string[];
  currentClass: string;
  onImportSuccess: (importedStudents: PesertaDidik[], replaceKelas?: string, newClasses?: string[]) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ImportSiswaModal: React.FC<ImportSiswaModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentClass,
  onImportSuccess,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [targetClass, setTargetClass] = useState<string>(currentClass || kelasList[0] || 'VII-A');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [autoAddClasses, setAutoAddClasses] = useState<boolean>(true);

  // File parsing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [detectedClasses, setDetectedClasses] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Paste text state
  const [pastedText, setPastedText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setParsedRows([]);
    setDetectedClasses([]);
    setFileName('');
    setErrorMessage('');
    setPastedText('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let res;

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        res = await parseStudentsFromExcel(file, targetClass);
      } else if (ext === 'docx') {
        res = await parseStudentsFromWord(file, targetClass);
      } else {
        setErrorMessage('Format berkas tidak didukung. Silakan gunakan format Excel (.xlsx, .xls, .csv) atau Microsoft Word (.docx).');
        setIsProcessing(false);
        return;
      }

      if (res.success && res.students.length > 0) {
        setParsedRows(res.students);
        setDetectedClasses(res.detectedClasses);
      } else {
        setErrorMessage(res.error || 'Gagal membaca data siswa dari berkas.');
        setParsedRows([]);
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan saat memproses berkas: ' + err.message);
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Silakan tempelkan (paste) teks daftar siswa terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = parseStudentsFromPastedText(pastedText, targetClass);
      if (res.success && res.students.length > 0) {
        setParsedRows(res.students);
        setDetectedClasses(res.detectedClasses);
        setFileName('Teks Tempelan (Clipboard)');
      } else {
        setErrorMessage(res.error || 'Gagal menguraikan teks daftar siswa.');
        setParsedRows([]);
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan saat menguraikan teks: ' + err.message);
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    // Convert parsed rows into PesertaDidik
    const studentsToSave = convertToPesertaDidik(parsedRows, targetClass);

    // Identify new classes to register in teacher profile
    const newClassesToRegister: string[] = [];
    if (autoAddClasses) {
      if (targetClass && !kelasList.includes(targetClass)) {
        newClassesToRegister.push(targetClass);
      }
      detectedClasses.forEach((cls) => {
        if (cls && !kelasList.includes(cls) && !newClassesToRegister.includes(cls)) {
          newClassesToRegister.push(cls);
        }
      });
    }

    onImportSuccess(
      studentsToSave,
      importMode === 'replace' ? targetClass : undefined,
      newClassesToRegister.length > 0 ? newClassesToRegister : undefined
    );

    onShowToast(
      'success',
      `Berhasil mengimpor ${studentsToSave.length} data peserta didik ke Kelas ${targetClass}!`
    );
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Impor Data Siswa (Excel & MS Word)
              </h3>
              <p className="text-xs text-slate-500">
                Unggah berkas Microsoft Excel (.xlsx/.xls/.csv) atau Microsoft Word (.docx), atau salin-tempel langsung.
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

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Target class and settings banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sasaran Kelas / Rombel:
              </label>
              <div className="flex space-x-2">
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  {kelasList.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Ketik Kelas Baru...</option>
                </select>
              </div>
              {targetClass === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Ketik nama kelas, mis: VII-C"
                  onChange={(e) => setTargetClass(e.target.value.toUpperCase())}
                  className="mt-1.5 w-full text-xs p-1.5 rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Penggabungan Data:
              </label>
              <div className="space-y-1.5 pt-0.5">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tambahkan ke data siswa yang sudah ada</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 font-medium">Ganti seluruh siswa di kelas {targetClass}</span>
                </label>
              </div>
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
              <span>Unggah Berkas (Excel & Word)</span>
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
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  Pilih atau Tarik Berkas Excel / MS Word ke sini
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3">
                  Mendukung format: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>, dan <strong>.docx</strong> (Microsoft Word).
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-2xs group-hover:bg-indigo-700 transition-colors inline-flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas Dari Komputer</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Template Download Prompt */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-indigo-950">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Belum memiliki format? Unduh format contoh Excel siap pakai.</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadStudentTemplateExcel(targetClass)}
                  className="px-2.5 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg text-[11px] font-semibold flex items-center space-x-1 shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template .XLSX</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Copy Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempelkan (Paste) Teks Tabel dari Word atau Excel:
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh tempelan dari tabel Word/Excel:\n1\t0081234567\tAhmad Fikri\tL\t${targetClass}\n2\t0087654321\tAisyah Putri\tP\t${targetClass}\n3\t0083456789\tBima Sakti\tL\t${targetClass}`}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Anda dapat membuka dokumen Word/Excel Anda, blok/salin (Ctrl+C) kolom Nama dan L/P, lalu tempelkan (Ctrl+V) langsung di kotak ini.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim() || isProcessing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Uraikan Teks Siswa</span>
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

          {/* Parsing Results / Preview */}
          {parsedRows.length > 0 && (
            <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      {parsedRows.length} Peserta Didik Siap Diimpor
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Sumber: {fileName || 'Data terurai'} • Target: Kelas {targetClass}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                    L: {parsedRows.filter((r) => r.jenisKelamin === 'L').length} | P: {parsedRows.filter((r) => r.jenisKelamin === 'P').length}
                  </span>
                </div>
              </div>

              {/* Table preview (first 8 rows) */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3 w-10">No</th>
                      <th className="py-1.5 px-3">Nama Siswa</th>
                      <th className="py-1.5 px-3 w-20">NIS / NISN</th>
                      <th className="py-1.5 px-3 w-14">L/P</th>
                      <th className="py-1.5 px-3 w-20">Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-3 text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="py-1 px-3 font-semibold text-slate-800">{row.nama}</td>
                        <td className="py-1 px-3 text-slate-500 text-[11px] font-mono">{row.nisn || row.nis || '-'}</td>
                        <td className="py-1 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.jenisKelamin === 'L'
                                ? 'bg-sky-100 text-sky-800'
                                : row.jenisKelamin === 'P'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.jenisKelamin || '-'}
                          </span>
                        </td>
                        <td className="py-1 px-3 text-slate-600 text-[11px] font-medium">{targetClass}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 8 && (
                <div className="text-center text-[11px] text-slate-500">
                  ... dan {parsedRows.length - 8} siswa lainnya akan disimpan.
                </div>
              )}
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

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Terapkan {parsedRows.length > 0 ? `(${parsedRows.length} Siswa)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
