import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Eye,
  Save,
  Loader2,
  FileText,
  HelpCircle,
  Layers,
  ClipboardCheck,
  UserCheck,
  FolderGit2,
} from 'lucide-react';
import { RencanaAsesmenItem, TeacherProfile } from '../types';
import {
  generateNaskahAsesmenWithAI,
  generateCuratedNaskahAsesmen,
  normalizeBentukAsesmen,
} from '../services/aiService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';

interface NaskahAsesmenModalProps {
  item: RencanaAsesmenItem;
  profile: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveNaskah: (item: RencanaAsesmenItem, naskah: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const NaskahAsesmenModal: React.FC<NaskahAsesmenModalProps> = ({
  item,
  profile,
  isOpen,
  onClose,
  onSaveNaskah,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [naskahText, setNaskahText] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Initialize or generate naskah when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      if (item.naskahAsesmen && item.naskahAsesmen.trim().length > 0) {
        setNaskahText(item.naskahAsesmen);
      } else {
        // Generate curated template instantly
        const initial = generateCuratedNaskahAsesmen({
          mapel: item.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
          kelas: item.kelas || profile.kelasAktif || 'VII',
          topik: item.topikMateri || item.judulAsesmen || 'Materi Pembelajaran',
          judulAsesmen: item.judulAsesmen,
          bentukAsesmen: item.bentukAsesmen || 'Kinerja',
          jenisAsesmen: item.jenisAsesmen,
          tujuanPembelajaran: item.tujuanPembelajaran,
          kktp: item.kktpTarget || 75,
        });
        setNaskahText(initial);
      }
    }
  }, [isOpen, item.id]);

  if (!isOpen) return null;

  const bentukNorm = normalizeBentukAsesmen(item.bentukAsesmen || 'Kinerja');

  const getBentukBadgeColor = () => {
    switch (bentukNorm) {
      case 'Kinerja':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Tes Tertulis':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Proyek':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Portofolio':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Observasi':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Diri / Antarteman':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getBentukIcon = () => {
    switch (bentukNorm) {
      case 'Kinerja':
        return <ClipboardCheck className="w-4 h-4 text-amber-600" />;
      case 'Tes Tertulis':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Proyek':
        return <FolderGit2 className="w-4 h-4 text-purple-600" />;
      case 'Portofolio':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'Observasi':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'Diri / Antarteman':
        return <HelpCircle className="w-4 h-4 text-pink-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleGenerateAI = async (customInstruction?: string) => {
    setIsGeneratingAI(true);
    onShowToast('info', `AI sedang menyusun naskah asesmen ${bentukNorm}...`);
    try {
      const generated = await generateNaskahAsesmenWithAI({
        mapel: item.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
        kelas: item.kelas || profile.kelasAktif || 'VII',
        topik: item.topikMateri || item.judulAsesmen || 'Materi Pembelajaran',
        judulAsesmen: item.judulAsesmen,
        bentukAsesmen: item.bentukAsesmen || 'Kinerja',
        jenisAsesmen: item.jenisAsesmen,
        tujuanPembelajaran: item.tujuanPembelajaran,
        kktp: item.kktpTarget || 75,
        instruksiKhusus: customInstruction || aiCustomNotes,
      });

      setNaskahText(generated);
      onShowToast('success', `Naskah asesmen ${bentukNorm} berhasil disusun AI!`);
    } catch (err) {
      onShowToast('error', 'Gagal menyusun naskah AI, menggunakan draf terkurasi.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = () => {
    onSaveNaskah(item, naskahText);
    onShowToast('success', 'Naskah asesmen berhasil disimpan ke rencana evaluasi!');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(naskahText);
    setIsCopied(true);
    onShowToast('success', 'Naskah asesmen disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrint = () => {
    printElementDirectly(
      'dokumen-naskah-asesmen-printable',
      `Naskah_Asesmen_${(item.judulAsesmen || bentukNorm).replace(/[^a-zA-Z0-9]/g, '_')}`
    );
  };

  const handleDownloadPDF = async () => {
    onShowToast('info', 'Sedang memproses unduhan berkas PDF...');
    const filename = `Naskah_Asesmen_${(item.judulAsesmen || bentukNorm).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const success = await downloadElementAsPDF('dokumen-naskah-asesmen-printable', filename, {
      title: `Naskah Asesmen: ${item.judulAsesmen}`,
    });
    if (success) {
      onShowToast('success', 'Berkas PDF naskah asesmen berhasil diunduh!');
    } else {
      onShowToast('info', 'Membuka dialog cetak browser untuk opsi simpan PDF.');
    }
  };

  // Quick focus pills per shape
  const quickPills: { [key: string]: string[] } = {
    'Kinerja': [
      'Praktik Terbimbing & Mandiri',
      'Rubrik Deskriptif 4 Level',
      'Eksperimen Alat Sederhana',
      'Pengamatan Sikap Kolaborasi',
    ],
    'Tes Tertulis': [
      '5 Soal PG HOTS & 2 Esai',
      'Stimulus Fenomena Kontekstual',
      'Soal Isian Singkat Analitis',
      'Lengkap Pembahasan Kunci Jawaban',
    ],
    'Proyek': [
      'Jadwal 3 Pekan Realistis',
      'Driving Question Menantang',
      'Pilihan Produk Poster/Prototipe',
      'Gelar Karya (Gallery Walk)',
    ],
    'Portofolio': [
      'Kurasi 4 Artefak Karya',
      'Lembar Refleksi Diri Jujur',
      'Bukti Perkembangan Belajar',
      'Kriteria Seleksi Mandiri Siswa',
    ],
    'Observasi': [
      'Fokus Penalaran Kritis & Kolaborasi',
      'Format Jurnal Catatan Anekdot',
      'Skala 1-4 Membudaya',
      'Umpan Balik Formatif Ramah',
    ],
    'Diri / Antarteman': [
      'Pertanyaan Reflektif 1-4',
      'Kartu Apresiasi Positif Teman',
      'Komitmen Belajar Berikutnya',
      'Evaluasi Tanpa Menghakimi',
    ],
  };

  // Simple clean markdown parser for preview
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = (key: number) => {
      if (inTable && tableHeader.length > 0) {
        elements.push(
          <div key={`table-${key}`} className="overflow-x-auto my-3 border border-slate-300 rounded-lg">
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="p-2 border-r border-slate-300 last:border-r-0">
                      {th.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {row.map((td, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-t border-slate-200 last:border-r-0 align-top">
                        {td.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeader = [];
        tableRows = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cols = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Separator line |:---|:---|
        if (cols.every((c) => c.replace(/[:-]/g, '').length === 0)) {
          return; // skip separator row
        }

        if (!inTable) {
          inTable = true;
          tableHeader = cols;
        } else {
          tableRows.push(cols);
        }
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide mt-4 mb-2 pb-1 border-b border-slate-300">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-sm sm:text-base font-bold text-indigo-900 mt-3.5 mb-1.5 pb-1 border-b border-indigo-100">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-xs sm:text-sm font-bold text-slate-800 mt-3 mb-1 flex items-center space-x-1.5">
            <span>{trimmed.replace('### ', '')}</span>
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-semibold text-slate-800 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h4>
        );
      } else if (trimmed === '---') {
        elements.push(<hr key={idx} className="my-3 border-slate-200" />);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemContent = trimmed.replace(/^[\*\-]\s+/, '');
        elements.push(
          <li key={idx} className="ml-5 list-disc text-[11px] text-slate-700 my-0.5 leading-relaxed">
            {formatInlineBold(itemContent)}
          </li>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className="text-[11px] text-slate-700 leading-relaxed my-1">
            {formatInlineBold(trimmed)}
          </p>
        );
      } else {
        elements.push(<div key={idx} className="h-1" />);
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  const formatInlineBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              {getBentukIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Naskah Asesmen: {item.judulAsesmen || 'Instrumen Asesmen'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBentukBadgeColor()}`}>
                  {item.bentukAsesmen || 'Kinerja'}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {item.jenisAsesmen}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {item.mataPelajaran || profile.mataPelajaran} • Kelas {item.kelas || profile.kelasAktif} • KKTP: {item.kktpTarget || 75}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Tab switchers */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition-all ${
                  activeTab === 'edit'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyText}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Salin Naskah"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Unduh PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cetak Naskah"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Assistant Banner */}
        <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-slate-50 border-b border-indigo-100 p-3 no-print">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-start space-x-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>Asisten AI Penyusun Naskah Asesmen</span>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full">
                    Bentuk: {bentukNorm}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Menyusun naskah instrumen lengkap sesuai karakteristik bentuk <strong>{bentukNorm}</strong> secara mendalam.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={aiCustomNotes}
                onChange={(e) => setAiCustomNotes(e.target.value)}
                placeholder="Fokus instruksi khusus (cth: perbanyak HOTS, rubrik kolaborasi)..."
                className="text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-white w-48 sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleGenerateAI()}
                disabled={isGeneratingAI}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 disabled:opacity-60 shadow-2xs transition-colors shrink-0"
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isGeneratingAI ? 'Menyusun...' : 'Susun AI'}</span>
              </button>
            </div>
          </div>

          {/* Quick Guidance Tags */}
          <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-1 text-[10px] text-slate-600">
            <span className="font-semibold text-indigo-700">Fokus Cepat:</span>
            {(quickPills[bentukNorm] || quickPills['Kinerja']).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setAiCustomNotes(tag);
                  handleGenerateAI(tag);
                }}
                disabled={isGeneratingAI}
                className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-slate-700 transition-colors disabled:opacity-50"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-5">
          {activeTab === 'preview' ? (
            /* PRINTABLE DOCUMENT VIEW */
            <div
              id="dokumen-naskah-asesmen-printable"
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto space-y-4 text-xs text-slate-800 print-clean"
            >
              {/* Kop & Header Resmi */}
              <div className="border-b-2 border-slate-800 pb-3 text-center">
                <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-slate-300 text-[10px] text-slate-600">
                  <span className="font-bold text-slate-900 uppercase">
                    {profile.namaSekolah || 'SEKOLAH MENENGAH PERTAMA'}
                  </span>
                  <span>Tahun Pelajaran: {profile.tahunPelajaran || '2025/2026'}</span>
                </div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
                  NASKAH INSTRUMEN ASESMEN PEMBELAJARAN
                </h1>
                <h2 className="text-xs sm:text-sm font-bold text-indigo-700 mt-0.5">
                  Bentuk Asesmen: {item.bentukAsesmen || bentukNorm} ({item.jenisAsesmen})
                </h2>
              </div>

              {/* Data Identitas Asesmen */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/60 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Mata Pelajaran:</span>
                    <span className="text-slate-900 font-medium">{item.mataPelajaran || profile.mataPelajaran}</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Kelas / Fase:</span>
                    <span className="text-slate-900 font-medium">{item.kelas || profile.kelasAktif} / Fase D</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Topik / Lingkup Materi:</span>
                    <span className="text-slate-900 font-medium">{item.topikMateri || item.judulAsesmen}</span>
                  </div>
                </div>
                <div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Guru Pengampu:</span>
                    <span className="text-slate-900 font-medium">{profile.namaGuru}</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Target KKTP:</span>
                    <span className="text-slate-900 font-bold text-indigo-700">{item.kktpTarget || 75}</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-700">Waktu Pelaksanaan:</span>
                    <span className="text-slate-900">{item.waktuPelaksanaan || 'Terjadwal'}</span>
                  </div>
                </div>
              </div>

              {/* Formatted Markdown Content */}
              <div className="pt-2 text-slate-800 space-y-1">
                {renderMarkdown(naskahText)}
              </div>

              {/* Pengesahan / Lembar Tanda Tangan */}
              <div className="pt-6 mt-6 border-t border-slate-300 grid grid-cols-2 text-center text-[11px] print-avoid-break">
                <div className="space-y-12">
                  <p className="font-semibold text-slate-700">Mengetahui,<br />Kepala Sekolah</p>
                  <div>
                    <p className="font-bold underline text-slate-900">{profile.kepalaSekolah?.nama || '...........................................'}</p>
                    <p className="text-slate-500 text-[10px]">NIP. {profile.kepalaSekolah?.nip || '...................................'}</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <p className="font-semibold text-slate-700">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    Guru Mata Pelajaran
                  </p>
                  <div>
                    <p className="font-bold underline text-slate-900">{profile.namaGuru}</p>
                    <p className="text-slate-500 text-[10px]">NIP. {profile.nip || '...................................'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT TEXTAREA VIEW */
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>
                    Anda dapat mengedit, menambah soal, atau menyempurnakan rubrik naskah secara langsung di bawah ini:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>

              <textarea
                value={naskahText}
                onChange={(e) => setNaskahText(e.target.value)}
                rows={24}
                className="w-full p-4 font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed shadow-xs"
                placeholder="Tulis atau edit naskah asesmen di sini..."
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between no-print text-xs">
          <div className="text-slate-500 text-[11px] flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Naskah tersusun secara komprehensif untuk bentuk: <strong>{bentukNorm}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Naskah Asesmen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
