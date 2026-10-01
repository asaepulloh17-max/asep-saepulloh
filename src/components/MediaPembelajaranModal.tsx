import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Edit3,
  Eye,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  Layers,
  Compass,
  Smile,
  Brain,
  Target,
  MonitorPlay,
  Image as ImageIcon,
  Headphones,
  Video,
  Gamepad2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  Perencanaan,
  MediaPembelajaranItem,
  KategoriMediaPembelajaran,
  TeacherProfile,
} from '../types';
import {
  generateMediaPembelajaranWithAI,
  generateCuratedMediaPembelajaran,
} from '../services/aiService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { MediaLiveStudio } from './MediaLiveStudio';

interface MediaPembelajaranModalProps {
  plan: Perencanaan;
  profile: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (updatedPlan: Perencanaan) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialTab?: 'preview' | 'edit' | 'alignment' | 'studio';
}

export const MediaPembelajaranModal: React.FC<MediaPembelajaranModalProps> = ({
  plan,
  profile,
  isOpen,
  onClose,
  onSavePlan,
  onShowToast,
  initialTab = 'preview',
}) => {
  // State for active media items in the plan
  const [mediaList, setMediaList] = useState<MediaPembelajaranItem[]>(() => {
    if (plan.mediaPembelajaranList && plan.mediaPembelajaranList.length > 0) {
      return plan.mediaPembelajaranList;
    }
    // Generate an initial default media item (Visual PPT)
    const initialItem = generateCuratedMediaPembelajaran({
      mapel: plan.identitas.mataPelajaran || profile.mataPelajaran,
      kelas: plan.identitas.kelas || profile.kelasAktif,
      topik: plan.identitas.topikMateri || 'Klasifikasi Makhluk Hidup',
      tujuanPembelajaran: plan.tujuanPembelajaran?.tujuanPembelajaran,
      indikatorKetercapaian: plan.tujuanPembelajaran?.indikatorKetercapaian,
      pengalamanBelajar: plan.pengalamanBelajar,
      prinsipMendalam: plan.prinsipPembelajaranMendalam,
      kategori: 'Visual',
      jenisSpesifik: 'Slide Presentasi (PPT)',
    });
    return [initialItem];
  });

  const [activeMediaId, setActiveMediaId] = useState<string>(() => {
    if (plan.mediaPembelajaranList && plan.mediaPembelajaranList.length > 0) {
      return plan.mediaPembelajaranList[0].id;
    }
    return '';
  });

  const activeMedia = mediaList.find((m) => m.id === activeMediaId) || mediaList[0];

  // Selection form states for adding/generating media
  const [selectedCategory, setSelectedCategory] = useState<KategoriMediaPembelajaran>('Visual');
  const [selectedJenis, setSelectedJenis] = useState<string>('Slide Presentasi (PPT)');
  const [customAINotes, setCustomAINotes] = useState<string>('');

  // UI state
  const [viewTab, setViewTab] = useState<'preview' | 'edit' | 'alignment' | 'studio'>(initialTab);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editableMarkdown, setEditableMarkdown] = useState<string>('');

  useEffect(() => {
    if (isOpen && initialTab) {
      setViewTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (activeMedia) {
      setEditableMarkdown(activeMedia.naskahRancanganLengkap || '');
      setSelectedCategory(activeMedia.kategori);
      setSelectedJenis(activeMedia.jenisSpesifik);
    }
  }, [activeMedia?.id]);

  useEffect(() => {
    if (mediaList.length > 0 && (!activeMediaId || !mediaList.some((m) => m.id === activeMediaId))) {
      setActiveMediaId(mediaList[0].id);
    }
  }, [mediaList, activeMediaId]);

  if (!isOpen || !activeMedia) return null;

  const mapel = plan.identitas.mataPelajaran || profile.mataPelajaran;
  const kelas = plan.identitas.kelas || profile.kelasAktif;
  const topik = plan.identitas.topikMateri || 'Materi Pokok';

  // Sub-formats per category
  const jenisOptionsMap: Record<KategoriMediaPembelajaran, string[]> = {
    Visual: ['Slide Presentasi (PPT)', 'Infografik Edukatif', 'Mindmap Konseptual', 'Diagram & Bagan Alir', 'Flashcard Digital'],
    Audio: ['Podcast Edukasi Dialogis', 'Narasi Audio Instruksional', 'Sandiwara Audio Tematik', 'Audio Pemantik Berkesadaran'],
    Audiovisual: ['Video Micro-learning Konseptual', 'Video Demonstrasi & Praktik', 'Storyboard Video Pembelajaran', 'Studi Kasus Video Nyata'],
    'Multimedia-Interaktif': ['Kuis Gamifikasi (Quizizz/Wordwall)', 'Simulasi Lab Virtual (PhET)', 'Skenario Percabangan Kasus Interaktif', 'Papan Kolaboratif Digital'],
  };

  // Change category handler
  const handleCategorySelect = (cat: KategoriMediaPembelajaran) => {
    setSelectedCategory(cat);
    const options = jenisOptionsMap[cat];
    setSelectedJenis(options[0]);
  };

  // Save changes to current active media
  const handleUpdateActiveMedia = (fields: Partial<MediaPembelajaranItem>) => {
    setMediaList((prev) =>
      prev.map((m) => (m.id === activeMedia.id ? { ...m, ...fields, updatedAt: new Date().toISOString() } : m))
    );
  };

  // Persist all media list back to Perencanaan
  const handleSaveToPlan = (customList = mediaList) => {
    const updatedPlan: Perencanaan = {
      ...plan,
      mediaPembelajaranList: customList,
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedPlan);
    onShowToast('success', 'Rancangan Media Pembelajaran berhasil disimpan ke dokumen Perencanaan (RPP)!');
  };

  // Generate / Regenerate via AI
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    onShowToast('info', `AI sedang merancang Media ${selectedCategory} (${selectedJenis}) berbasis Pembelajaran Mendalam...`);

    try {
      const generatedMedia = await generateMediaPembelajaranWithAI({
        mapel,
        kelas,
        topik,
        tujuanPembelajaran: plan.tujuanPembelajaran?.tujuanPembelajaran,
        indikatorKetercapaian: plan.tujuanPembelajaran?.indikatorKetercapaian,
        pengalamanBelajar: plan.pengalamanBelajar,
        prinsipMendalam: plan.prinsipPembelajaranMendalam,
        kategori: selectedCategory,
        jenisSpesifik: selectedJenis,
        instruksiKhusus: customAINotes,
      });

      // Update current or replace active
      const updatedList = mediaList.map((m) =>
        m.id === activeMedia.id ? { ...generatedMedia, id: activeMedia.id } : m
      );
      setMediaList(updatedList);
      setEditableMarkdown(generatedMedia.naskahRancanganLengkap);
      handleSaveToPlan(updatedList);
      setViewTab('studio');
      onShowToast('success', `Media ${selectedCategory} berhasil disusun oleh AI & siap dimainkan di Studio!`);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal memproses AI, menggunakan format kurasi sistem.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Create brand new media item
  const handleAddNewMedia = () => {
    const newItem = generateCuratedMediaPembelajaran({
      mapel,
      kelas,
      topik,
      tujuanPembelajaran: plan.tujuanPembelajaran?.tujuanPembelajaran,
      indikatorKetercapaian: plan.tujuanPembelajaran?.indikatorKetercapaian,
      pengalamanBelajar: plan.pengalamanBelajar,
      prinsipMendalam: plan.prinsipPembelajaranMendalam,
      kategori: selectedCategory,
      jenisSpesifik: selectedJenis,
    });
    const updatedList = [...mediaList, newItem];
    setMediaList(updatedList);
    setActiveMediaId(newItem.id);
    handleSaveToPlan(updatedList);
    onShowToast('success', `Media baru (${selectedCategory}) ditambahkan ke RPP!`);
  };

  // Remove media item
  const handleDeleteMedia = (idToDelete: string) => {
    if (mediaList.length <= 1) {
      onShowToast('info', 'Minimal harus ada 1 rancangan media pembelajaran dalam RPP.');
      return;
    }
    const updatedList = mediaList.filter((m) => m.id !== idToDelete);
    setMediaList(updatedList);
    setActiveMediaId(updatedList[0].id);
    handleSaveToPlan(updatedList);
    onShowToast('info', 'Media pembelajaran dihapus.');
  };

  // Copy markdown to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(editableMarkdown || activeMedia.naskahRancanganLengkap);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast('success', 'Naskah media berhasil disalin ke clipboard!');
  };

  // PDF Export & Print handlers
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    onShowToast('info', 'Menyiapkan berkas PDF Naskah Media Pembelajaran...');
    const filename = `Media_${activeMedia.kategori}_${(topik || 'Materi').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const success = await downloadElementAsPDF('dokumen-media-pembelajaran-preview', filename, {
      title: activeMedia.namaMedia,
    });
    setIsExportingPDF(false);
    if (success) {
      onShowToast('success', 'PDF Naskah Media Pembelajaran berhasil diunduh!');
    }
  };

  const handlePrint = () => {
    printElementDirectly(
      'dokumen-media-pembelajaran-preview',
      `Media_${activeMedia.kategori}_${(topik || 'Materi').replace(/[^a-zA-Z0-9]/g, '_')}`
    );
  };

  // Simple Markdown parser to clean visual rendering
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = (elements: React.ReactNode[], key: string) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-${key}`} className="my-3 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              {tableHeaders.length > 0 && (
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    {tableHeaders.map((th, i) => (
                      <th key={i} className="p-2 border-r last:border-r-0 border-slate-200">
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b last:border-b-0 border-slate-200 hover:bg-slate-50">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="p-2 align-top border-r last:border-r-0 border-slate-200 text-slate-700"
                        dangerouslySetInnerHTML={{
                          __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/<br\s*\/?>/gi, '<br/>'),
                        }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    const rendered: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        // Check if header separator
        if (cells.every((c) => /^[-:]+$/.test(c))) {
          return;
        }
        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(rendered, `idx-${index}`);
      }

      if (trimmed.startsWith('# ')) {
        rendered.push(
          <h1 key={index} className="text-base font-bold text-slate-900 border-b-2 border-indigo-500 pb-1.5 mt-4 mb-2 uppercase tracking-wide">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        rendered.push(
          <h2 key={index} className="text-sm font-bold text-indigo-900 mt-4 mb-2 pb-1 border-b border-indigo-100 flex items-center space-x-1.5">
            <span>{trimmed.replace('## ', '')}</span>
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        rendered.push(
          <h3 key={index} className="text-xs font-bold text-slate-800 mt-3 mb-1 uppercase tracking-wider text-indigo-700">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        rendered.push(
          <h4 key={index} className="text-xs font-bold text-slate-700 mt-2.5 mb-1 text-slate-800">
            {trimmed.replace('#### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        rendered.push(
          <div key={index} className="flex items-start space-x-2 py-0.5 text-xs text-slate-700 ml-2">
            <span className="text-indigo-500 font-bold">•</span>
            <span
              dangerouslySetInnerHTML={{
                __html: itemText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
          </div>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (match) {
          rendered.push(
            <div key={index} className="flex items-start space-x-2 py-0.5 text-xs text-slate-700 ml-2">
              <span className="font-bold text-indigo-600 w-4 text-right flex-shrink-0">{match[1]}.</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: match[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'),
                }}
              />
            </div>
          );
        }
      } else if (trimmed === '---') {
        rendered.push(<hr key={index} className="my-3 border-slate-200" />);
      } else if (trimmed.length > 0) {
        rendered.push(
          <p
            key={index}
            className="text-xs text-slate-700 py-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'),
            }}
          />
        );
      } else {
        rendered.push(<div key={index} className="h-1" />);
      }
    });

    if (inTable) {
      flushTable(rendered, 'final');
    }

    return rendered;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-2xs">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Media Pembelajaran Mendalam
                </span>
                <span className="text-xs text-slate-300">• {mapel}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-lg">
                {activeMedia.namaMedia || 'Rancangan Media Pembelajaran RPP/RPM'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border border-slate-700"
              title="Salin Naskah Lengkap ke Clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{isCopied ? 'Tersalin' : 'Salin Naskah'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors disabled:opacity-60 shadow-2xs"
              title="Unduh Berkas PDF Resmi Naskah Media"
            >
              {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isExportingPDF ? 'Proses PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border border-slate-700"
              title="Cetak Langsung Naskah Media"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleUpdateActiveMedia({ naskahRancanganLengkap: editableMarkdown });
                handleSaveToPlan();
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Simpan Media ke Dokumen RPP & Tutup"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Tutup</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Category Selection Tiles Bar */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pilih Kategori Media Pembelajaran:</span>
            </span>

            {/* List of items in this RPP */}
            <div className="flex items-center space-x-1 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-medium mr-1">Media RPP ini ({mediaList.length}):</span>
              {mediaList.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMediaId(m.id)}
                  className={`px-2 py-0.5 rounded-full font-semibold border flex items-center space-x-1 transition-all ${
                    activeMedia.id === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>#{idx + 1} {m.kategori}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddNewMedia}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-full font-semibold flex items-center space-x-0.5"
                title="Tambah Pilihan Media Lain ke RPP ini"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Media</span>
              </button>
            </div>
          </div>

          {/* 4 Main Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Media Visual */}
            <button
              type="button"
              onClick={() => handleCategorySelect('Visual')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'Visual'
                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <ImageIcon className="w-4 h-4" />
                </span>
                {selectedCategory === 'Visual' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">1. Media Visual</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">PPT, Infografik, Mindmap, Diagram</p>
              </div>
            </button>

            {/* 2. Media Audio */}
            <button
              type="button"
              onClick={() => handleCategorySelect('Audio')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'Audio'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Headphones className="w-4 h-4" />
                </span>
                {selectedCategory === 'Audio' && (
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">2. Media Audio</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">Podcast, Narasi, Sandiwara Radio</p>
              </div>
            </button>

            {/* 3. Media Audiovisual */}
            <button
              type="button"
              onClick={() => handleCategorySelect('Audiovisual')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'Audiovisual'
                  ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                  <Video className="w-4 h-4" />
                </span>
                {selectedCategory === 'Audiovisual' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">3. Audiovisual</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">Video Edukasi, Storyboard, Demo</p>
              </div>
            </button>

            {/* 4. Multimedia / Interaktif */}
            <button
              type="button"
              onClick={() => handleCategorySelect('Multimedia-Interaktif')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'Multimedia-Interaktif'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Gamepad2 className="w-4 h-4" />
                </span>
                {selectedCategory === 'Multimedia-Interaktif' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">4. Multimedia/Interaktif</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">Quizizz, Wordwall, Lab PhET</p>
              </div>
            </button>
          </div>

          {/* Sub-format Pills & AI Generator Toolbar */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="text-[11px] font-semibold text-slate-600">Format Spesifik:</span>
              {jenisOptionsMap[selectedCategory].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedJenis(opt)}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                    selectedJenis === opt
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewTab('studio')}
                className={`px-3 py-1 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ring-1 ring-purple-400/50 ${
                  viewTab === 'studio'
                    ? 'bg-purple-700 ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                }`}
                title="Buka Studio Produksi AI untuk menjalankan PPT, Podcast Audio, Video Simulasi, atau Kuis Interaktif"
              >
                <MonitorPlay className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>🚀 Jalankan Media (AI Live)</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isGeneratingAI ? 'Menyusun Media...' : 'Buat / Rancang Ulang (AI)'}</span>
              </button>

              {mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(activeMedia.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Hapus media ini dari RPP"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alignment Indicator Bar (Materi, TP, Indikator, Pengalaman Belajar, Pembelajaran Mendalam) */}
        <div className="bg-indigo-900/5 px-4 py-2 border-b border-indigo-100 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-y-1.5 no-print">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className="flex items-center space-x-1 font-semibold text-indigo-900">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Topik: <strong>{topik}</strong></span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center space-x-1 text-slate-700">
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>Pengalaman: <strong>Memahami & Mengaplikasi</strong></span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center space-x-1 text-slate-700">
              <Smile className="w-3.5 h-3.5 text-amber-600" />
              <span>Deep Learning: <strong>Berkesadaran, Bermakna, Menggembirakan</strong></span>
            </span>
          </div>

          {/* Sub Tab buttons (Studio vs Preview vs Edit vs Penyelarasan) */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewTab('studio')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                viewTab === 'studio'
                  ? 'bg-purple-600 text-white shadow-2xs font-bold'
                  : 'text-purple-700 hover:bg-purple-50 font-semibold'
              }`}
            >
              <MonitorPlay className="w-3 h-3 text-amber-300" />
              <span>🚀 Studio AI & Player</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('preview')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 ${
                viewTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Pratinjau Cetak</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('edit')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 ${
                viewTab === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Editor Naskah</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('alignment')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 ${
                viewTab === 'alignment' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Penyelarasan</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {/* TAB 0: STUDIO AI & LIVE MEDIA PLAYER */}
          {viewTab === 'studio' && (
            <div className="max-w-5xl mx-auto">
              <MediaLiveStudio
                media={activeMedia}
                mapel={mapel}
                kelas={kelas}
                topik={topik}
                tujuanPembelajaran={plan.tujuanPembelajaran?.tujuanPembelajaran}
                indikatorKetercapaian={plan.tujuanPembelajaran?.indikatorKetercapaian}
                pengalamanBelajar={plan.pengalamanBelajar}
                prinsipMendalam={plan.prinsipPembelajaranMendalam}
                onBackToScript={() => setViewTab('preview')}
                onShowToast={onShowToast}
              />
            </div>
          )}
          
          {/* TAB 1: PREVIEW (Printable & Exportable Document) */}
          {viewTab === 'preview' && (
            <div
              id="dokumen-media-pembelajaran-preview"
              className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 print-clean space-y-4"
            >
              {/* Header Surat Media */}
              <div className="text-center border-b pb-4 border-slate-300">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900">
                  Rancangan & Naskah Media Pembelajaran
                </h2>
                <h3 className="text-xs sm:text-sm font-semibold text-indigo-700">
                  Pendekatan Pembelajaran Mendalam (Deep Learning)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {profile.namaSekolah} • Tahun Pelajaran {plan.identitas.tahunPelajaran || profile.tahunPelajaran}
                </p>
              </div>

              {/* Tabel Identitas Media & Keselarasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Mata Pelajaran:</span>
                    <span className="text-slate-900 font-medium">{mapel}</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Kelas / Fase:</span>
                    <span className="text-slate-900">{kelas} ({plan.identitas.fase || profile.fase})</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Topik / Materi:</span>
                    <span className="text-slate-900 font-bold text-indigo-700">{topik}</span>
                  </div>
                </div>
                <div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Kategori Media:</span>
                    <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px]">
                      {activeMedia.kategori} ({activeMedia.jenisSpesifik})
                    </span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Alat / Aplikasi:</span>
                    <span className="text-slate-900">{activeMedia.alatBahanAplikasi || 'Canva / PPT / Platform Interaktif'}</span>
                  </div>
                  <div className="flex py-0.5">
                    <span className="w-32 font-semibold text-slate-600">Guru Pengampu:</span>
                    <span className="text-slate-900 font-medium">{profile.namaGuru}</span>
                  </div>
                </div>
              </div>

              {/* Formatted Markdown Content */}
              <div className="pt-2 text-slate-800 space-y-1">
                {renderMarkdown(editableMarkdown || activeMedia.naskahRancanganLengkap)}
              </div>

              {/* Signature Sheet (Print-friendly) */}
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
          )}

          {/* TAB 2: EDIT TEXTAREA (Markdown Live Editor) */}
          {viewTab === 'edit' && (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Editor Naskah Media (Markdown)</h4>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan judul slide, petunjuk narasi guru, skrip rekaman audio, butir soal interaktif, atau panduan tontonan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateActiveMedia({ naskahRancanganLengkap: editableMarkdown });
                    handleSaveToPlan();
                    setViewTab('preview');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Terapkan Perubahan</span>
                </button>
              </div>

              <textarea
                rows={22}
                value={editableMarkdown}
                onChange={(e) => setEditableMarkdown(e.target.value)}
                className="w-full p-4 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white leading-relaxed text-slate-800 shadow-inner"
                placeholder="Tuliskan naskah atau rancangan media pembelajaran dalam format Markdown..."
              />
            </div>
          )}

          {/* TAB 3: CURRICULUM & DEEP LEARNING ALIGNMENT MATRIX */}
          {viewTab === 'alignment' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Matriks Penyelarasan Kurikulum & Pembelajaran Mendalam</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Setiap media pembelajaran dirancang memiliki benang merah yang utuh dengan tujuan pembelajaran dan pengalaman belajar peserta didik.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* 1. Materi & Tujuan */}
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                    <p className="font-bold text-indigo-900 mb-1 flex items-center space-x-1">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tujuan Pembelajaran (TP)</span>
                    </p>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {plan.tujuanPembelajaran?.tujuanPembelajaran || 'Peserta didik memahami konsep secara bermakna dan menerapkannya dalam memecahkan masalah.'}
                    </p>
                  </div>

                  {/* 2. Indikator Ketercapaian */}
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                    <p className="font-bold text-purple-900 mb-1 flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Indikator KKTP</span>
                    </p>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {plan.tujuanPembelajaran?.indikatorKetercapaian || 'Mengidentifikasi komponen kunci, menganalisis hubungan konsep, dan menyajikan solusi.'}
                    </p>
                  </div>
                </div>

                {/* 3. Pengalaman Belajar (Memahami, Mengaplikasi, Merefleksi) */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Peran Media dalam Tahapan Pengalaman Belajar</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-indigo-700 block mb-1 text-[11px]">1. Memahami</span>
                      <p className="text-[11px] text-slate-600">
                        {plan.pengalamanBelajar?.memahami || 'Membangun pemahaman awal melalui visualisasi konkret atau narasi dialogis.'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-indigo-700 block mb-1 text-[11px]">2. Mengaplikasi</span>
                      <p className="text-[11px] text-slate-600">
                        {plan.pengalamanBelajar?.mengaplikasi || 'Panduan visual/interaktif selama penyelidikan LKPD dan eksperimen mandiri.'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-indigo-700 block mb-1 text-[11px]">3. Merefleksi</span>
                      <p className="text-[11px] text-slate-600">
                        {plan.pengalamanBelajar?.merefleksi || 'Pertanyaan pemantik dan umpan balik formatif untuk menyimpulkan pembelajaran.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Tiga Prinsip Deep Learning */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center space-x-1">
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    <span>Implementasi Prinsip Pembelajaran Mendalam pada Media</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/80">
                      <span className="font-bold text-amber-900 block mb-0.5 text-[11px]">Berkesadaran (Mindful)</span>
                      <p className="text-[11px] text-slate-700">
                        {activeMedia.keselarasan?.prinsipDeepLearning?.berkesadaran || 'Memusatkan perhatian penuh dan mengurangi beban kognitif berlebih.'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80">
                      <span className="font-bold text-emerald-900 block mb-0.5 text-[11px]">Bermakna (Meaningful)</span>
                      <p className="text-[11px] text-slate-700">
                        {activeMedia.keselarasan?.prinsipDeepLearning?.bermakna || 'Mengaitkan teori dengan masalah nyata yang ada di lingkungan anak.'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-sky-50/60 rounded-lg border border-sky-200/80">
                      <span className="font-bold text-sky-900 block mb-0.5 text-[11px]">Menggembirakan (Joyful)</span>
                      <p className="text-[11px] text-slate-700">
                        {activeMedia.keselarasan?.prinsipDeepLearning?.menggembirakan || 'Menyajikan tantangan interaktif yang memicu sukacita belajar kolaboratif.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
