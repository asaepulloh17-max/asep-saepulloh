import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Copy,
  Edit,
  Trash2,
  Printer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Eye,
  X,
  Save,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  MonitorPlay,
  Image as ImageIcon,
  Headphones,
  Video,
  Gamepad2,
} from 'lucide-react';
import { Perencanaan, TeacherProfile, DAFTAR_DIMENSI_PROFIL_LULUSAN, MediaRecord } from '../types';
import {
  generatePerencanaanSectionWithAI,
  generateSingleFieldAI,
} from '../services/aiService';
import { PerencanaanSectionAIAssistant } from './PerencanaanSectionAIAssistant';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { ImportPerencanaanModal } from './ImportPerencanaanModal';
import { LKPDModal } from './LKPDModal';
import { MediaPembelajaranModal } from './MediaPembelajaranModal';

interface PerencanaanViewProps {
  perencanaanList: Perencanaan[];
  profile: TeacherProfile;
  onSavePerencanaan: (item: Perencanaan) => void;
  onDeletePerencanaan: (id: string) => void;
  onDuplicatePerencanaan: (id: string) => void;
  onOpenAIWithTopic?: (topic: string) => void;
  onOpenEduGeniusWithRPP?: (rppId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PerencanaanView: React.FC<PerencanaanViewProps> = ({
  perencanaanList,
  profile,
  onSavePerencanaan,
  onDeletePerencanaan,
  onDuplicatePerencanaan,
  onOpenAIWithTopic,
  onOpenEduGeniusWithRPP,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Perencanaan | null>(null);
  const [detailItem, setDetailItem] = useState<Perencanaan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [lkpdActivePlan, setLkpdActivePlan] = useState<Perencanaan | null>(null);
  const [mediaActivePlan, setMediaActivePlan] = useState<Perencanaan | null>(null);
  const [mediaModalInitialTab, setMediaModalInitialTab] = useState<'preview' | 'edit' | 'alignment' | 'studio'>('preview');

  const handleOpenMediaStudio = (plan: Perencanaan) => {
    setMediaModalInitialTab('studio');
    setMediaActivePlan(plan);
  };

  // Close detail view on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailItem) {
        setDetailItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailItem]);

  const handleOpenMediaScript = (plan: Perencanaan) => {
    setMediaModalInitialTab('preview');
    setMediaActivePlan(plan);
  };

  const handleSaveAndOpenMediaStudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.judul.trim()) {
      editingItem.judul = editingItem.identitas.topikMateri || 'Perencanaan Pembelajaran';
    }
    const itemToSave = { ...editingItem };
    onSavePerencanaan(itemToSave);
    setIsFormOpen(false);
    setEditingItem(null);
    setMediaModalInitialTab('studio');
    setMediaActivePlan(itemToSave);
    onShowToast('success', 'Rancangan RPP berhasil disimpan! Membuka Studio Produksi Media AI...');
  };

  const handleImportSuccess = (importedPlan: Perencanaan, openInEditor = false) => {
    onSavePerencanaan(importedPlan);
    if (openInEditor) {
      setEditingItem(JSON.parse(JSON.stringify(importedPlan)));
      setFormTab(1);
      setIsFormOpen(true);
    }
  };

  const handleDownloadModulPDF = async (item: Perencanaan) => {
    setIsExportingPDF(true);
    onShowToast('info', 'Sedang memproses berkas PDF Modul Ajar...');
    const filename = `Modul_Ajar_${(item.identitas.mataPelajaran || 'Mapel').replace(/\s+/g, '_')}_${item.identitas.kelas}_${(item.identitas.topikMateri || 'Topik').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Ensure detail item is active so the element is rendered in DOM
    setDetailItem(item);
    // Give DOM a frame to ensure clean render
    await new Promise((resolve) => setTimeout(resolve, 200));

    const success = await downloadElementAsPDF('dokumen-modul-ajar-detail', filename, {
      title: item.judul,
    });
    setIsExportingPDF(false);
    if (success) {
      onShowToast('success', 'Berkas PDF Modul Ajar berhasil diunduh!');
    } else {
      onShowToast('info', 'Membuka dialog cetak untuk simpan sebagai PDF.');
    }
  };

  // Active form section tab (1 through 8)
  const [formTab, setFormTab] = useState<number>(1);
  const [isGeneratingSectionAI, setIsGeneratingSectionAI] = useState<number | null>(null);
  const [singleFieldLoading, setSingleFieldLoading] = useState<string | null>(null);
  const [sectionNotes, setSectionNotes] = useState<{ [key: number]: string }>({});

  // Blank template
  const createEmptyPerencanaan = (): Perencanaan => {
    return {
      id: 'plan-' + Date.now(),
      judul: '',
      status: 'Draf',
      identitas: {
        namaSekolah: profile.namaSekolah,
        mataPelajaran: profile.mataPelajaran,
        fase: profile.fase || 'Fase D',
        kelas: profile.kelasAktif || 'VII-A',
        semester: profile.semesterAktif,
        tahunPelajaran: profile.tahunPelajaran,
        alokasiWaktu: profile.alokasiWaktuDefault || '2 x 40 menit',
        topikMateri: '',
        pertemuanKe: 1,
      },
      identifikasi: {
        kesiapanAwal: '',
        karakteristikMateri: '',
        kebutuhanBelajar: '',
        dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi'],
      },
      tujuanPembelajaran: {
        capaianPembelajaran: '',
        tujuanPembelajaran: '',
        lingkupMateri: '',
        indikatorKetercapaian: '',
      },
      desainPembelajaran: {
        praktikPedagogis: 'Pembelajaran Berbasis Masalah (PBL)',
        kemitraanPembelajaran: 'Kolaborasi teman sebaya dalam kelompok',
        lingkunganPembelajaran: 'Ruang kelas fleksibel & sumber lingkungan sekolah',
        pemanfaatanDigital: 'Media presentasi & kuis interaktif',
        modelMetode: 'Diskusi, eksplorasi kontekstual, dan refleksi terbimbing',
        sumberBelajar: 'Buku teks utama, lingkungan sekolah, LKPD mandiri',
      },
      pengalamanBelajar: {
        memahami: '',
        mengaplikasi: '',
        merefleksi: '',
      },
      prinsipPembelajaranMendalam: {
        berkesadaran: 'Pemusatan perhatian mindful check-in di awal pembelajaran.',
        bermakna: 'Mengaitkan materi dengan permasalahan nyata kehidupan siswa.',
        menggembirakan: 'Aktivitas interaktif kolaboratif yang membangkitkan rasa ingin tahu.',
      },
      rencanaKegiatan: {
        durasiPendahuluan: '10 menit',
        pendahuluan: '1. Sapaan hangat, doa bersama, dan presensi berkesadaran.\n2. Apersepsi kontekstual dan penyampaian tujuan pembelajaran.',
        durasiInti: '60 menit',
        kegiatanInti: '1. Memahami konsep melalui observasi/eksplorasi.\n2. Mengaplikasikan pemahaman dalam diskusi kelompok & LKPD.\n3. Berbagi temuan bersama rekan sekelas.',
        durasiPenutup: '10 menit',
        penutup: '1. Merefleksikan pembelajaran dan pengisian tiket keluar.\n2. Umpan balik positif dari guru dan doa penutup.',
      },
      rencanaAsesmen: {
        asesmenAwal: 'Tanya jawab diagnostik singkat di awal.',
        asesmenProses: 'Observasi keaktifan diskusi & rubrik LKPD.',
        asesmenAkhir: 'Kuis formatif singkat atau penilaian produk.',
        teknikAsesmen: 'Observasi dan tes tertulis',
        instrumenAsesmen: 'Rubrik penilaian kinerja & lembar soal',
        kriteriaKetercapaian: `Peserta didik mencapai KKTP jika memperoleh nilai minimal ${profile.kktpDefault || 75}.`,
      },
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleOpenNew = () => {
    setEditingItem(createEmptyPerencanaan());
    setFormTab(1);
    setIsGeneratingSectionAI(null);
    setSingleFieldLoading(null);
    setSectionNotes({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Perencanaan) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setFormTab(1);
    setIsGeneratingSectionAI(null);
    setSingleFieldLoading(null);
    setSectionNotes({});
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.judul.trim()) {
      editingItem.judul = editingItem.identitas.topikMateri || 'Perencanaan Pembelajaran';
    }
    onSavePerencanaan(editingItem);
    setIsFormOpen(false);
    setEditingItem(null);
    onShowToast('success', 'Dokumen perencanaan berhasil disimpan');
  };

  const handleToggleDimensi = (dim: string) => {
    if (!editingItem) return;
    const current = editingItem.identifikasi.dimensiProfilLulusan || [];
    const exists = current.includes(dim);
    const updated = exists ? current.filter((d) => d !== dim) : [...current, dim];
    setEditingItem({
      ...editingItem,
      identifikasi: { ...editingItem.identifikasi, dimensiProfilLulusan: updated },
    });
  };

  const handleGenerateSectionAI = async (sectionNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    if (!editingItem) return;

    const currentTopic = editingItem.identitas.topikMateri?.trim() || editingItem.judul?.trim();

    if (sectionNumber !== 1 && !currentTopic) {
      onShowToast('info', 'Silakan isi atau rekomendasikan Topik/Materi pada Bagian 1 terlebih dahulu.');
      setFormTab(1);
      return;
    }

    setIsGeneratingSectionAI(sectionNumber);
    try {
      const result = await generatePerencanaanSectionWithAI({
        sectionNumber,
        mapel: editingItem.identitas.mataPelajaran || profile.mataPelajaran || 'IPA',
        kelas: editingItem.identitas.kelas || profile.kelasAktif || 'VII-A',
        topik: currentTopic || 'Materi Pembelajaran Mendalam SMP Fase D',
        alokasiWaktu: editingItem.identitas.alokasiWaktu,
        kktp: profile.kktpDefault,
        catatanKhusus: sectionNotes[sectionNumber] || '',
        currentData: editingItem,
      });

      if (sectionNumber === 1) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            judul: result.judul || prev.judul,
            identitas: {
              ...prev.identitas,
              topikMateri: result.topikMateri || prev.identitas.topikMateri,
              alokasiWaktu: result.alokasiWaktu || prev.identitas.alokasiWaktu,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 1 (Identitas & Topik) berhasil dirumuskan!');
      } else if (sectionNumber === 2) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            identifikasi: {
              ...prev.identifikasi,
              kesiapanAwal: result.kesiapanAwal || prev.identifikasi.kesiapanAwal,
              karakteristikMateri: result.karakteristikMateri || prev.identifikasi.karakteristikMateri,
              kebutuhanBelajar: result.kebutuhanBelajar || prev.identifikasi.kebutuhanBelajar,
              dimensiProfilLulusan:
                result.dimensiProfilLulusan && result.dimensiProfilLulusan.length > 0
                  ? result.dimensiProfilLulusan
                  : prev.identifikasi.dimensiProfilLulusan,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 2 (Identifikasi & Kesiapan) berhasil dirumuskan!');
      } else if (sectionNumber === 3) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tujuanPembelajaran: {
              ...prev.tujuanPembelajaran,
              capaianPembelajaran: result.capaianPembelajaran || prev.tujuanPembelajaran.capaianPembelajaran,
              tujuanPembelajaran: result.tujuanPembelajaran || prev.tujuanPembelajaran.tujuanPembelajaran,
              indikatorKetercapaian: result.indikatorKetercapaian || prev.tujuanPembelajaran.indikatorKetercapaian,
              lingkupMateri: result.lingkupMateri || prev.tujuanPembelajaran.lingkupMateri,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 3 (Capaian & Tujuan) berhasil dirumuskan!');
      } else if (sectionNumber === 4) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            desainPembelajaran: {
              ...prev.desainPembelajaran,
              praktikPedagogis: result.praktikPedagogis || prev.desainPembelajaran.praktikPedagogis,
              kemitraanPembelajaran: result.kemitraanPembelajaran || prev.desainPembelajaran.kemitraanPembelajaran,
              lingkunganPembelajaran: result.lingkunganPembelajaran || prev.desainPembelajaran.lingkunganPembelajaran,
              pemanfaatanDigital: result.pemanfaatanDigital || prev.desainPembelajaran.pemanfaatanDigital,
              modelMetode: result.modelMetode || prev.desainPembelajaran.modelMetode,
              sumberBelajar: result.sumberBelajar || prev.desainPembelajaran.sumberBelajar,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 4 (Desain Pembelajaran) berhasil dirumuskan!');
      } else if (sectionNumber === 5) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pengalamanBelajar: {
              ...prev.pengalamanBelajar,
              memahami: result.memahami || prev.pengalamanBelajar.memahami,
              mengaplikasi: result.mengaplikasi || prev.pengalamanBelajar.mengaplikasi,
              merefleksi: result.merefleksi || prev.pengalamanBelajar.merefleksi,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 5 (Pengalaman Belajar) berhasil dirumuskan!');
      } else if (sectionNumber === 6) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            prinsipPembelajaranMendalam: {
              ...prev.prinsipPembelajaranMendalam,
              berkesadaran: result.berkesadaran || prev.prinsipPembelajaranMendalam.berkesadaran,
              bermakna: result.bermakna || prev.prinsipPembelajaranMendalam.bermakna,
              menggembirakan: result.menggembirakan || prev.prinsipPembelajaranMendalam.menggembirakan,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 6 (3 Pilar Prinsip Mendalam) berhasil dirumuskan!');
      } else if (sectionNumber === 7) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rencanaKegiatan: {
              ...prev.rencanaKegiatan,
              durasiPendahuluan: result.durasiPendahuluan || prev.rencanaKegiatan.durasiPendahuluan,
              pendahuluan: result.pendahuluan || prev.rencanaKegiatan.pendahuluan,
              durasiInti: result.durasiInti || prev.rencanaKegiatan.durasiInti,
              kegiatanInti: result.kegiatanInti || prev.rencanaKegiatan.kegiatanInti,
              durasiPenutup: result.durasiPenutup || prev.rencanaKegiatan.durasiPenutup,
              penutup: result.penutup || prev.rencanaKegiatan.penutup,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 7 (Rencana Langkah KBM) berhasil dirumuskan!');
      } else if (sectionNumber === 8) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rencanaAsesmen: {
              ...prev.rencanaAsesmen,
              asesmenAwal: result.asesmenAwal || prev.rencanaAsesmen.asesmenAwal,
              asesmenProses: result.asesmenProses || prev.rencanaAsesmen.asesmenProses,
              asesmenAkhir: result.asesmenAkhir || prev.rencanaAsesmen.asesmenAkhir,
              teknikAsesmen: result.teknikAsesmen || prev.rencanaAsesmen.teknikAsesmen,
              instrumenAsesmen: result.instrumenAsesmen || prev.rencanaAsesmen.instrumenAsesmen,
              kriteriaKetercapaian: result.kriteriaKetercapaian || prev.rencanaAsesmen.kriteriaKetercapaian,
            },
          };
        });
        onShowToast('success', 'Asisten AI: Bagian 8 (Rencana Asesmen & KKTP) berhasil dirumuskan!');
      }
    } catch (err: any) {
      console.error(`Error generating section ${sectionNumber} with AI:`, err);
      onShowToast('error', `Gagal merumuskan Bagian ${sectionNumber}: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setIsGeneratingSectionAI(null);
    }
  };

  const handleGenerateFieldAI = async (
    fieldKey: string,
    fieldLabel: string,
    onApply: (value: string) => void
  ) => {
    if (!editingItem) return;
    const currentTopic = editingItem.identitas.topikMateri?.trim() || editingItem.judul?.trim() || 'Materi Pokok';
    setSingleFieldLoading(fieldKey);
    try {
      const text = await generateSingleFieldAI(fieldKey, fieldLabel, {
        mapel: editingItem.identitas.mataPelajaran || profile.mataPelajaran || 'IPA',
        kelas: editingItem.identitas.kelas || profile.kelasAktif || 'VII-A',
        topik: currentTopic,
        catatan: sectionNotes[formTab] || '',
      });
      onApply(text);
      onShowToast('success', `Kolom "${fieldLabel}" berhasil dirumuskan AI!`);
    } catch (err: any) {
      console.error(`Error generating field ${fieldKey}:`, err);
      onShowToast('error', `Gagal merumuskan "${fieldLabel}".`);
    } finally {
      setSingleFieldLoading(null);
    }
  };

  // Filtered List
  const filteredList = perencanaanList.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.identitas.topikMateri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tujuanPembelajaran.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = !filterKelas || item.identitas.kelas === filterKelas;
    const matchStatus = !filterStatus || item.status === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  return (
    <div className="space-y-6" id="perencanaan-view-container">
      {/* Top action bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul, materi, atau tujuan..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Filter Kelas */}
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Kelas</option>
                {profile.kelasList.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Status</option>
                <option value="Selesai">Selesai</option>
                <option value="Draf">Draf</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setIsImportModalOpen(true)}
                id="btn-import-perencanaan"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Impor RPP (Word & PDF)</span>
              </button>

              <button
                onClick={handleOpenNew}
                id="btn-tambah-perencanaan"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Perencanaan Baru</span>
              </button>
            </div>
          </div>

      {/* List of Planning Documents */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Belum ada dokumen perencanaan ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Mulai susun modul ajar berbasis Pembelajaran Mendalam sekarang atau impor dari berkas Word/PDF yang sudah ada.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Perencanaan Pertama</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 inline-flex items-center space-x-1.5 shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>Impor RPP (Word & PDF)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((plan) => (
            <div
              key={plan.id}
              id={`plan-card-${plan.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        plan.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plan.status}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      Kelas {plan.identitas.kelas}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      P.{plan.identitas.pertemuanKe || 1} • {plan.identitas.alokasiWaktu}
                    </span>
                    {plan.isDemo && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug line-clamp-2">
                  {plan.judul}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                  {plan.tujuanPembelajaran.tujuanPembelajaran || 'Belum ada rincian tujuan pembelajaran.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {plan.identifikasi.dimensiProfilLulusan?.slice(0, 3).map((dim, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded"
                    >
                      {dim}
                    </span>
                  ))}
                  {(plan.identifikasi.dimensiProfilLulusan?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{plan.identifikasi.dimensiProfilLulusan.length - 3} lainnya
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setDetailItem(plan)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                    title="Lihat Rincian Lengkap"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                    title="Ubah / Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDuplicatePerencanaan(plan.id)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                    title="Duplikasi Dokumen"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(plan.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-50 rounded"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadModulPDF(plan)}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded flex items-center space-x-1"
                    title="Unduh Modul Ajar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailItem(plan);
                      setTimeout(() => {
                        printElementDirectly(
                          'dokumen-modul-ajar-detail',
                          `Modul_Ajar_${(plan.identitas.mataPelajaran || 'Mapel').replace(/\s+/g, '_')}_${plan.identitas.kelas}`
                        );
                      }, 200);
                    }}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded flex items-center space-x-1"
                    title="Cetak Dokumen Modul Ajar"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenEduGeniusWithRPP) {
                        onOpenEduGeniusWithRPP(plan.id);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                    title="Buka & Jalankan Media Sokratik AI (EduGenius) dengan RPP ini"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>EduGenius</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLkpdActivePlan(plan)}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-2xs"
                    title="Buka / Rancang LKPD Pembelajaran Mendalam"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                    <span>LKPD</span>
                    {plan.lkpd && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="LKPD Tersedia" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailItem(plan)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 p-1 hover:bg-indigo-50 rounded"
                  >
                    <span>Buka Detail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Konfirmasi Hapus Dokumen</h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus perencanaan pembelajaran ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePerencanaan(deleteConfirmId);
                  setDeleteConfirmId(null);
                  onShowToast('info', 'Dokumen perencanaan berhasil dihapus');
                }}
                className="px-3 py-1.5 text-xs bg-rose-600 text-white font-semibold hover:bg-rose-700 rounded-lg"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {detailItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailItem(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header: Designed to be fully responsive and keep the Close (X) button always accessible */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 no-print shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <div className="p-1.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shrink-0">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                      Detil Modul Ajar (RPP)
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded-full border border-slate-700">
                      Kelas {detailItem.identitas.kelas}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold truncate text-white" title={detailItem.judul}>
                    {detailItem.judul}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end shrink-0">
                <button
                  type="button"
                  id="btn-buka-lkpd-detail"
                  onClick={() => setLkpdActivePlan(detailItem)}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  title="Buka / Rancang Lembar Kerja Peserta Didik (LKPD)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>LKPD</span>
                </button>

                {/* Jalankan di EduGenius */}
                <button
                  type="button"
                  id="btn-jalankan-edugenius-detail"
                  onClick={() => {
                    if (onOpenEduGeniusWithRPP) {
                      onOpenEduGeniusWithRPP(detailItem.id);
                      setDetailItem(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs border border-amber-400 shrink-0"
                  title="Jalankan Media Pembelajaran Sokratik EduGenius berbasis RPP ini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                  <span>Jalankan di EduGenius</span>
                </button>

                <button
                  type="button"
                  id="btn-download-pdf-modul"
                  onClick={() => handleDownloadModulPDF(detailItem)}
                  disabled={isExportingPDF}
                  className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-60 shadow-2xs"
                  title="Unduh Berkas PDF Modul Ajar Resmi"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-print-modul"
                  onClick={() =>
                    printElementDirectly(
                      'dokumen-modul-ajar-detail',
                      `Modul_Ajar_${(detailItem.identitas.mataPelajaran || 'Mapel').replace(/\s+/g, '_')}_${detailItem.identitas.kelas}`
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
                  title="Cetak atau Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cetak</span>
                </button>

                {/* Tombol Tutup (X) yang jelas, menonjol, dan tidak akan terpotong */}
                <button
                  type="button"
                  id="btn-tutup-detil-rpp-header"
                  onClick={() => setDetailItem(null)}
                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs border border-rose-500 shrink-0 ml-1"
                  title="Tutup Detil RPP (Tekan tombol ini atau tombol Escape)"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup (X)</span>
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div
              id="dokumen-modul-ajar-detail"
              className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 bg-white print-clean"
            >
              <div className="text-center border-b pb-4 border-slate-300">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  Rencana Pelaksanaan Pembelajaran (Modul Ajar)
                </h2>
                <h3 className="text-sm font-semibold text-indigo-700">
                  Pendekatan Pembelajaran Mendalam (Deep Learning)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {detailItem.identitas.namaSekolah} • Tahun Pelajaran {detailItem.identitas.tahunPelajaran}
                </p>
              </div>

              {/* 1. Identitas */}
              <div className="border rounded-lg p-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                  I. IDENTITAS PEMBELAJARAN
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-slate-500">Mata Pelajaran:</span> <strong className="block">{detailItem.identitas.mataPelajaran}</strong></div>
                  <div><span className="text-slate-500">Fase / Kelas:</span> <strong className="block">{detailItem.identitas.fase} / {detailItem.identitas.kelas}</strong></div>
                  <div><span className="text-slate-500">Semester:</span> <strong className="block">{detailItem.identitas.semester}</strong></div>
                  <div><span className="text-slate-500">Alokasi Waktu:</span> <strong className="block">{detailItem.identitas.alokasiWaktu}</strong></div>
                  <div className="col-span-2 sm:col-span-4"><span className="text-slate-500">Topik / Materi:</span> <strong className="block">{detailItem.identitas.topikMateri}</strong></div>
                </div>
              </div>

              {/* 2. Identifikasi */}
              <div className="border rounded-lg p-3">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                  II. IDENTIFIKASI & KESIAPAN BELAJAR
                </h4>
                <div className="space-y-2">
                  <div><span className="font-semibold">Kesiapan Awal Peserta Didik:</span> <p className="text-slate-700 mt-0.5">{detailItem.identifikasi.kesiapanAwal || '-'}</p></div>
                  <div><span className="font-semibold">Karakteristik Materi:</span> <p className="text-slate-700 mt-0.5">{detailItem.identifikasi.karakteristikMateri || '-'}</p></div>
                  <div><span className="font-semibold">Kebutuhan Belajar & Diferensiasi:</span> <p className="text-slate-700 mt-0.5">{detailItem.identifikasi.kebutuhanBelajar || '-'}</p></div>
                  <div>
                    <span className="font-semibold">Dimensi Profil Lulusan:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailItem.identifikasi.dimensiProfilLulusan?.map((d, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Tujuan Pembelajaran */}
              <div className="border rounded-lg p-3">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                  III. TUJUAN PEMBELAJARAN
                </h4>
                <div className="space-y-2">
                  {detailItem.tujuanPembelajaran.capaianPembelajaran && (
                    <div><span className="font-semibold">Capaian Pembelajaran (CP):</span> <p className="text-slate-700 mt-0.5">{detailItem.tujuanPembelajaran.capaianPembelajaran}</p></div>
                  )}
                  <div><span className="font-semibold">Tujuan Pembelajaran (TP):</span> <p className="text-slate-700 mt-0.5">{detailItem.tujuanPembelajaran.tujuanPembelajaran || '-'}</p></div>
                  <div><span className="font-semibold">Indikator Ketercapaian (Bukti):</span> <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{detailItem.tujuanPembelajaran.indikatorKetercapaian || '-'}</p></div>
                </div>
              </div>

              {/* 4. Desain Pembelajaran & Pembelajaran Mendalam */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                    IV. DESAIN PEMBELAJARAN
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-500">Praktik Pedagogis:</span> <span className="font-medium text-slate-800 ml-1">{detailItem.desainPembelajaran.praktikPedagogis}</span></div>
                    <div><span className="text-slate-500">Kemitraan:</span> <span className="font-medium text-slate-800 ml-1">{detailItem.desainPembelajaran.kemitraanPembelajaran}</span></div>
                    <div><span className="text-slate-500">Lingkungan:</span> <span className="font-medium text-slate-800 ml-1">{detailItem.desainPembelajaran.lingkunganPembelajaran}</span></div>
                    <div><span className="text-slate-500">Pemanfaatan Digital:</span> <span className="font-medium text-slate-800 ml-1">{detailItem.desainPembelajaran.pemanfaatanDigital}</span></div>
                    <div><span className="text-slate-500">Sumber Belajar:</span> <span className="font-medium text-slate-800 ml-1">{detailItem.desainPembelajaran.sumberBelajar}</span></div>
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-indigo-50/40 border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-1 text-xs">
                    V. PRINSIP PEMBELAJARAN MENDALAM
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div><strong className="text-indigo-950">Berkesadaran (Mindful):</strong> <p className="text-slate-700 mt-0.5">{detailItem.prinsipPembelajaranMendalam.berkesadaran}</p></div>
                    <div><strong className="text-indigo-950">Bermakna (Meaningful):</strong> <p className="text-slate-700 mt-0.5">{detailItem.prinsipPembelajaranMendalam.bermakna}</p></div>
                    <div><strong className="text-indigo-950">Menggembirakan (Joyful):</strong> <p className="text-slate-700 mt-0.5">{detailItem.prinsipPembelajaranMendalam.menggembirakan}</p></div>
                  </div>
                </div>
              </div>

              {/* 5. Alur Pengalaman Belajar & Rencana Kegiatan */}
              <div className="border rounded-lg p-3">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                  VI. KEGIATAN PEMBELAJARAN
                </h4>
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-semibold text-slate-800 flex items-center justify-between mb-1">
                      <span>A. Pendahuluan</span>
                      <span className="text-slate-500 font-normal">{detailItem.rencanaKegiatan.durasiPendahuluan}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{detailItem.rencanaKegiatan.pendahuluan}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-semibold text-slate-800 flex items-center justify-between mb-1">
                      <span>B. Kegiatan Inti (Memahami • Mengaplikasi • Merefleksi)</span>
                      <span className="text-slate-500 font-normal">{detailItem.rencanaKegiatan.durasiInti}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{detailItem.rencanaKegiatan.kegiatanInti}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-semibold text-slate-800 flex items-center justify-between mb-1">
                      <span>C. Penutup & Refleksi</span>
                      <span className="text-slate-500 font-normal">{detailItem.rencanaKegiatan.durasiPenutup}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{detailItem.rencanaKegiatan.penutup}</p>
                  </div>
                </div>
              </div>

              {/* 6. Perencanaan Asesmen */}
              <div className="border rounded-lg p-3">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1 text-xs">
                  VII. PERENCANAAN ASESMEN & EVALUASI
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-50 rounded border">
                    <span className="font-semibold block text-slate-800">Asesmen Awal:</span>
                    <p className="text-slate-600 mt-1">{detailItem.rencanaAsesmen.asesmenAwal || '-'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border">
                    <span className="font-semibold block text-slate-800">Asesmen Proses (Formatif):</span>
                    <p className="text-slate-600 mt-1">{detailItem.rencanaAsesmen.asesmenProses || '-'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border">
                    <span className="font-semibold block text-slate-800">Asesmen Akhir (Sumatif):</span>
                    <p className="text-slate-600 mt-1">{detailItem.rencanaAsesmen.asesmenAkhir || '-'}</p>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-600">
                  <strong>Kriteria Ketercapaian:</strong> {detailItem.rencanaAsesmen.kriteriaKetercapaian}
                </div>
              </div>

              {/* 7. Media Pembelajaran Terintegrasi */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between border-b pb-1 mb-2">
                  <h4 className="font-bold text-slate-900 text-xs">
                    VIII. MEDIA PEMBELAJARAN (VISUAL, AUDIO, AUDIOVISUAL, MULTIMEDIA INTERAKTIF)
                  </h4>
                  <span className="text-[10px] text-indigo-700 font-semibold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    {(detailItem.mediaPembelajaranList?.length || 0)} Media Terpilih
                  </span>
                </div>

                {(detailItem.mediaPembelajaranList && detailItem.mediaPembelajaranList.length > 0) ? (
                  <div className="space-y-2">
                    {detailItem.mediaPembelajaranList.map((med, mIdx) => (
                      <div key={med.id || mIdx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-indigo-100 text-indigo-800">
                              {med.kategori}
                            </span>
                            <span className="text-slate-900 font-bold">{med.namaMedia}</span>
                          </div>
                          <span className="text-slate-500 font-normal text-[11px]">{med.alatBahanAplikasi}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mb-1.5">{med.deskripsiRingkas}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <div>
                            <strong>Pengalaman Belajar:</strong> {med.keselarasan?.pengalamanBelajar?.tahap || 'Memahami & Mengaplikasi'}
                          </div>
                          <div>
                            <strong>Prinsip Mendalam:</strong> Mindful, Meaningful, & Joyful
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 pt-1 border-t border-slate-200 no-print">
                          <button
                            type="button"
                            onClick={() => handleOpenMediaStudio(detailItem)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-2xs"
                          >
                            <MonitorPlay className="w-3 h-3 text-amber-300" />
                            <span>Jalankan Media (AI Live)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMediaScript(detailItem)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-medium"
                          >
                            Lihat Naskah Lengkap
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded text-slate-600 text-xs text-center">
                    Belum ada naskah media yang dirancang khusus. Klik tombol "Rancang Media Pembelajaran" untuk menyusun Media Visual, Audio, Audiovisual, atau Multimedia Interaktif berbantuan AI.
                  </div>
                )}
              </div>

              {/* Media Pembelajaran Interactive Callout Box (no-print) */}
              <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-2xs">
                    <MonitorPlay className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <span>Rancangan Media Pembelajaran Mendalam</span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-semibold">
                        {(detailItem.mediaPembelajaranList?.length || 0) > 0
                          ? `${detailItem.mediaPembelajaranList?.length} Media Tersedia`
                          : 'Siap Dirancang'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Pilihan media Visual (PPT Presentasi), Audio (Podcast Suara Nyata), Audiovisual (Video Storyboard), atau Multimedia Interaktif (Kuis Playable).
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenMediaStudio(detailItem)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    <MonitorPlay className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>🚀 Jalankan Media (AI Live)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMediaScript(detailItem)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Naskah & Cetak</span>
                  </button>
                </div>
              </div>

              {/* LKPD Callout Box in Printable/Detail View */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-lg flex items-center justify-between no-print">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-purple-600 text-white rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <span>Lembar Kerja Peserta Didik (LKPD) Pembelajaran Mendalam</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-semibold">
                        {detailItem.lkpd ? 'Tersedia' : 'Siap Disusun'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Dilengkapi stimulus fenomena nyata, 3 pengalaman (Memahami, Mengaplikasi, Merefleksi), dan rubrik formatif 4 level.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLkpdActivePlan(detailItem)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Buka & Cetak LKPD</span>
                </button>
              </div>

              {/* Lembar Pengesahan Resmi (Kepala Sekolah & Guru Mata Pelajaran) */}
              <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-2 text-xs text-slate-900 text-center gap-8">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala {detailItem.identitas.namaSekolah || profile.namaSekolah}</p>
                  <div className="h-20" />
                  <p className="font-bold underline text-slate-950">
                    {profile.kepalaSekolah?.nama || 'Kepala Sekolah'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -'}
                  </p>
                </div>

                <div>
                  <p>
                    {profile.alamatSekolah?.split(',')[0] || 'Ditetapkan di Sekolah'},{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="font-semibold">Guru Mata Pelajaran</p>
                  <div className="h-20" />
                  <p className="font-bold underline text-slate-950">{profile.namaGuru}</p>
                  <p className="text-[11px] text-slate-600">
                    {profile.nip ? `NIP. ${profile.nip}` : 'Guru Mata Pelajaran'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Footer with Close Button */}
            <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print shrink-0">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Pratinjau Modul Ajar</span>
                <span>•</span>
                <span>{detailItem.identitas.mataPelajaran} ({detailItem.identitas.fase})</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementDirectly(
                      'dokumen-modul-ajar-detail',
                      `Modul_Ajar_${(detailItem.identitas.mataPelajaran || 'Mapel').replace(/\s+/g, '_')}_${detailItem.identitas.kelas}`
                    )
                  }
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak Dokumen</span>
                </button>

                <button
                  type="button"
                  id="btn-tutup-detil-rpp-footer"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <X className="w-4 h-4 text-slate-300" />
                  <span>Tutup Pratinjau (X)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Section Form Drawer / Modal for Add / Edit */}
      {isFormOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            {/* Form Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingItem.id.startsWith('plan-demo') ? 'Ubah Perencanaan (Demo)' : 'Formulir Perencanaan Pembelajaran'}
                </h3>
                <p className="text-xs text-slate-400">
                  Lengkapi 8 komponen perencanaan terintegrasi Kurikulum Merdeka
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Section Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs px-2 py-1 gap-1">
              {[
                { id: 1, label: '1. Identitas' },
                { id: 2, label: '2. Identifikasi' },
                { id: 3, label: '3. Tujuan' },
                { id: 4, label: '4. Desain' },
                { id: 5, label: '5. Pengalaman' },
                { id: 6, label: '6. Prinsip' },
                { id: 7, label: '7. Kegiatan' },
                { id: 8, label: '8. Asesmen' },
                { id: 9, label: '9. Media Belajar' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormTab(t.id)}
                  className={`px-3 py-1.5 font-semibold rounded whitespace-nowrap transition-all ${
                    formTab === t.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Tab 1: Identitas */}
              {formTab === 1 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={1}
                    title="Asisten AI Bagian 1: Identitas & Topik Pembelajaran"
                    subtitle="Rekomendasikan judul modul ajar, topik kontekstual sesuai jenjang/Fase D, dan alokasi waktu efektif."
                    badge="Bagian 1 • Identitas"
                    isGenerating={isGeneratingSectionAI === 1}
                    notes={sectionNotes[1] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 1: val }))}
                    onGenerate={() => handleGenerateSectionAI(1)}
                    quickTags={['Topik Kontekstual', 'Alokasi 2 JP (80 Menit)', 'Alokasi 3 JP (120 Menit)', 'Fase D SMP']}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">
                          Judul Dokumen Perencanaan <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'judul'}
                          onClick={() =>
                            handleGenerateFieldAI('judul', 'Judul Dokumen', (val) =>
                              setEditingItem({ ...editingItem, judul: val })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                          title="Gunakan AI untuk merumuskan judul inspiratif"
                        >
                          {singleFieldLoading === 'judul' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'judul' ? 'Menulis...' : 'Bantu Judul'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.judul}
                        onChange={(e) => setEditingItem({ ...editingItem, judul: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Contoh: Klasifikasi Makhluk Hidup"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status Dokumen</label>
                      <select
                        value={editingItem.status}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, status: e.target.value as 'Draf' | 'Selesai' })
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="Draf">Draf (Masih Disusun)</option>
                        <option value="Selesai">Selesai (Siap Diterapkan)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Satuan Pendidikan</label>
                      <input
                        type="text"
                        value={editingItem.identitas.namaSekolah}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            identitas: { ...editingItem.identitas, namaSekolah: e.target.value },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                      <input
                        type="text"
                        value={editingItem.identitas.mataPelajaran}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            identitas: { ...editingItem.identitas, mataPelajaran: e.target.value },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                      <select
                        value={editingItem.identitas.kelas}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            identitas: { ...editingItem.identitas, kelas: e.target.value },
                          })
                        }
                        className="w-full p-2 border rounded-lg bg-white"
                      >
                        {profile.kelasList.map((k) => (
                          <option key={k} value={k}>
                            Kelas {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Alokasi Waktu</label>
                      <input
                        type="text"
                        value={editingItem.identitas.alokasiWaktu}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            identitas: { ...editingItem.identitas, alokasiWaktu: e.target.value },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder="2 x 40 menit"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Topik / Materi Pokok <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'topik'}
                        onClick={() =>
                          handleGenerateFieldAI('topikMateri', 'Topik / Materi Pokok', (val) =>
                            setEditingItem({
                              ...editingItem,
                              identitas: { ...editingItem.identitas, topikMateri: val },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        title="Gunakan AI untuk menyarankan topik kontekstual"
                      >
                        {singleFieldLoading === 'topik' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'topik' ? 'Menulis...' : 'Rekomendasi Topik'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingItem.identitas.topikMateri}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          identitas: { ...editingItem.identitas, topikMateri: e.target.value },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Misal: Ciri-ciri kehidupan dan Kunci Determinasi Sederhana"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Identifikasi */}
              {formTab === 2 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={2}
                    title="Asisten AI Bagian 2: Identifikasi & Kesiapan Belajar"
                    subtitle="Analisis kesiapan awal murid, karakteristik materi, strategi diferensiasi, & dimensi Profil Lulusan."
                    badge="Bagian 2 • Identifikasi"
                    isGenerating={isGeneratingSectionAI === 2}
                    notes={sectionNotes[2] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 2: val }))}
                    onGenerate={() => handleGenerateSectionAI(2)}
                    quickTags={['Murid Heterogen', 'Diferensiasi Konten & Proses', 'Scaffolding Bertahap', 'Profil Kritis & Mandiri']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Kesiapan Awal Peserta Didik
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'kesiapanAwal'}
                        onClick={() =>
                          handleGenerateFieldAI('kesiapanAwal', 'Kesiapan Awal Murid', (val) =>
                            setEditingItem({
                              ...editingItem,
                              identifikasi: { ...editingItem.identifikasi, kesiapanAwal: val },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'kesiapanAwal' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'kesiapanAwal' ? 'Menulis...' : 'Bantu Rumuskan (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.identifikasi.kesiapanAwal}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          identifikasi: { ...editingItem.identifikasi, kesiapanAwal: e.target.value },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Pengetahuan/keterampilan prasyarat yang dimiliki murid sebelum materi ini..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Karakteristik Materi</label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'karakteristikMateri'}
                        onClick={() =>
                          handleGenerateFieldAI('karakteristikMateri', 'Karakteristik Materi', (val) =>
                            setEditingItem({
                              ...editingItem,
                              identifikasi: { ...editingItem.identifikasi, karakteristikMateri: val },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'karakteristikMateri' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'karakteristikMateri' ? 'Menulis...' : 'Bantu Rumuskan (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.identifikasi.karakteristikMateri}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          identifikasi: {
                            ...editingItem.identifikasi,
                            karakteristikMateri: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Apakah materi bersifat konseptual, prosedural, atau berbasis observasi nyata..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Kebutuhan Belajar & Diferensiasi
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'kebutuhanBelajar'}
                        onClick={() =>
                          handleGenerateFieldAI('kebutuhanBelajar', 'Kebutuhan Belajar & Diferensiasi', (val) =>
                            setEditingItem({
                              ...editingItem,
                              identifikasi: { ...editingItem.identifikasi, kebutuhanBelajar: val },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'kebutuhanBelajar' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'kebutuhanBelajar' ? 'Menulis...' : 'Bantu Rumuskan (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.identifikasi.kebutuhanBelajar}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          identifikasi: { ...editingItem.identifikasi, kebutuhanBelajar: e.target.value },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Penyesuaian untuk peserta didik visual, kinestetik, atau yang butuh pendampingan ekstra..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700">
                        Dimensi Profil Lulusan yang Ditumbuhkan
                      </label>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {editingItem.identifikasi.dimensiProfilLulusan?.length || 0} dari {DAFTAR_DIMENSI_PROFIL_LULUSAN.length} Dimensi Dipilih
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2.5">
                      Pilih 8 Dimensi Profil Lulusan terbaru yang menjadi sasaran pembentukan karakter dan kompetensi peserta didik:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DAFTAR_DIMENSI_PROFIL_LULUSAN.map((item) => {
                        const checked = editingItem.identifikasi.dimensiProfilLulusan?.includes(item.nama);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleDimensi(item.nama)}
                            className={`p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                              checked
                                ? 'bg-indigo-50/80 border-indigo-500 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 font-bold border transition-colors ${
                                checked
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white text-slate-400'
                              }`}
                            >
                              {checked ? '✓' : item.nomor}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs ${
                                    checked ? 'text-indigo-950 font-bold' : 'text-slate-800 font-medium'
                                  }`}
                                >
                                  {item.nomor}. {item.nama}
                                </span>
                                {checked && (
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[11px] mt-0.5 leading-snug ${
                                  checked ? 'text-indigo-900/80 font-normal' : 'text-slate-500'
                                }`}
                              >
                                {item.deskripsi}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Tujuan */}
              {formTab === 3 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={3}
                    title="Asisten AI Bagian 3: Capaian & Tujuan Pembelajaran"
                    subtitle="Rumuskan rujukan CP Fase D, Tujuan Pembelajaran (TP) operasional mendalam, dan bukti ketercapaian KKTP."
                    badge="Bagian 3 • Tujuan"
                    isGenerating={isGeneratingSectionAI === 3}
                    notes={sectionNotes[3] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 3: val }))}
                    onGenerate={() => handleGenerateSectionAI(3)}
                    quickTags={['Rumusan ABCD', 'Penalaran Kritis', 'Investigasi Mandiri', 'KKTP Terukur']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Capaian Pembelajaran (CP) - Rujukan
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'capaianPembelajaran'}
                        onClick={() =>
                          handleGenerateFieldAI('capaianPembelajaran', 'Capaian Pembelajaran (CP)', (val) =>
                            setEditingItem({
                              ...editingItem,
                              tujuanPembelajaran: {
                                ...editingItem.tujuanPembelajaran,
                                capaianPembelajaran: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'capaianPembelajaran' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'capaianPembelajaran' ? 'Menulis...' : 'Bantu CP (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.tujuanPembelajaran.capaianPembelajaran}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          tujuanPembelajaran: {
                            ...editingItem.tujuanPembelajaran,
                            capaianPembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="CP Fase D yang relevan..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Tujuan Pembelajaran (TP) Operasional <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'tujuanPembelajaran'}
                        onClick={() =>
                          handleGenerateFieldAI('tujuanPembelajaran', 'Tujuan Pembelajaran (TP)', (val) =>
                            setEditingItem({
                              ...editingItem,
                              tujuanPembelajaran: {
                                ...editingItem.tujuanPembelajaran,
                                tujuanPembelajaran: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'tujuanPembelajaran' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'tujuanPembelajaran' ? 'Menulis...' : 'Bantu TP (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={editingItem.tujuanPembelajaran.tujuanPembelajaran}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          tujuanPembelajaran: {
                            ...editingItem.tujuanPembelajaran,
                            tujuanPembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Peserta didik mampu... dengan bernalar kritis dan mandiri."
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Indikator / Bukti Ketercapaian Tujuan Pembelajaran (KKTP)
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'indikatorKetercapaian'}
                        onClick={() =>
                          handleGenerateFieldAI('indikatorKetercapaian', 'Indikator KKTP', (val) =>
                            setEditingItem({
                              ...editingItem,
                              tujuanPembelajaran: {
                                ...editingItem.tujuanPembelajaran,
                                indikatorKetercapaian: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'indikatorKetercapaian' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'indikatorKetercapaian' ? 'Menulis...' : 'Bantu KKTP (AI)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.tujuanPembelajaran.indikatorKetercapaian}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          tujuanPembelajaran: {
                            ...editingItem.tujuanPembelajaran,
                            indikatorKetercapaian: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="1. Menyebutkan minimal 4 ciri makhluk hidup; 2. Menggunakan kunci determinasi dengan akurat."
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Desain Pembelajaran */}
              {formTab === 4 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={4}
                    title="Asisten AI Bagian 4: Desain & Kerangka Pembelajaran"
                    subtitle="Rancang praktik pedagogis aktif (PBL/Inkuiri), kemitraan belajar, lingkungan, serta pemanfaatan digital terarah."
                    badge="Bagian 4 • Desain"
                    isGenerating={isGeneratingSectionAI === 4}
                    notes={sectionNotes[4] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 4: val }))}
                    onGenerate={() => handleGenerateSectionAI(4)}
                    quickTags={['Model PBL', 'Inkuiri Terbimbing', 'Tutor Sebaya Empatik', 'Media Digital Interaktif']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Praktik Pedagogis</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'praktikPedagogis'}
                          onClick={() =>
                            handleGenerateFieldAI('praktikPedagogis', 'Praktik Pedagogis', (val) =>
                              setEditingItem({
                                ...editingItem,
                                desainPembelajaran: {
                                  ...editingItem.desainPembelajaran,
                                  praktikPedagogis: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'praktikPedagogis' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'praktikPedagogis' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.desainPembelajaran.praktikPedagogis}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            desainPembelajaran: {
                              ...editingItem.desainPembelajaran,
                              praktikPedagogis: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Kemitraan Pembelajaran</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'kemitraanPembelajaran'}
                          onClick={() =>
                            handleGenerateFieldAI('kemitraanPembelajaran', 'Kemitraan Belajar', (val) =>
                              setEditingItem({
                                ...editingItem,
                                desainPembelajaran: {
                                  ...editingItem.desainPembelajaran,
                                  kemitraanPembelajaran: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'kemitraanPembelajaran' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'kemitraanPembelajaran' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.desainPembelajaran.kemitraanPembelajaran}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            desainPembelajaran: {
                              ...editingItem.desainPembelajaran,
                              kemitraanPembelajaran: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Lingkungan Pembelajaran</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'lingkunganPembelajaran'}
                          onClick={() =>
                            handleGenerateFieldAI('lingkunganPembelajaran', 'Lingkungan Pembelajaran', (val) =>
                              setEditingItem({
                                ...editingItem,
                                desainPembelajaran: {
                                  ...editingItem.desainPembelajaran,
                                  lingkunganPembelajaran: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'lingkunganPembelajaran' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'lingkunganPembelajaran' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.desainPembelajaran.lingkunganPembelajaran}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            desainPembelajaran: {
                              ...editingItem.desainPembelajaran,
                              lingkunganPembelajaran: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Pemanfaatan Digital</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'pemanfaatanDigital'}
                          onClick={() =>
                            handleGenerateFieldAI('pemanfaatanDigital', 'Pemanfaatan Digital', (val) =>
                              setEditingItem({
                                ...editingItem,
                                desainPembelajaran: {
                                  ...editingItem.desainPembelajaran,
                                  pemanfaatanDigital: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'pemanfaatanDigital' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'pemanfaatanDigital' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.desainPembelajaran.pemanfaatanDigital}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            desainPembelajaran: {
                              ...editingItem.desainPembelajaran,
                              pemanfaatanDigital: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Sumber Belajar</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'sumberBelajar'}
                          onClick={() =>
                            handleGenerateFieldAI('sumberBelajar', 'Sumber Belajar', (val) =>
                              setEditingItem({
                                ...editingItem,
                                desainPembelajaran: {
                                  ...editingItem.desainPembelajaran,
                                  sumberBelajar: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'sumberBelajar' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'sumberBelajar' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.desainPembelajaran.sumberBelajar}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            desainPembelajaran: {
                              ...editingItem.desainPembelajaran,
                              sumberBelajar: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-2xs">
                            <MonitorPlay className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span>Media Pembelajaran Terintegrasi (Visual, Audio, Video, Interaktif)</span>
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded font-bold">
                                {(editingItem.mediaPembelajaranList?.length || 0)} Dirancang
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Rancang PPT visual, podcast audio, storyboard video, atau kuis interaktif yang selaras dengan TP dan Deep Learning.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenMediaStudio(editingItem)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-all"
                            title="Jalankan Media AI langsung di Studio"
                          >
                            <MonitorPlay className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>🚀 Jalankan Media (AI Live)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMediaScript(editingItem)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center space-x-1 shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Studio & Naskah</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Pengalaman Belajar */}
              {formTab === 5 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={5}
                    title="Asisten AI Bagian 5: Tiga Pengalaman Belajar Mendalam"
                    subtitle="Susun alur pengalaman berkesadaran: Memahami (eksplorasi konsep), Mengaplikasi (aksi nyata/LKPD), & Merefleksi."
                    badge="Bagian 5 • Pengalaman"
                    isGenerating={isGeneratingSectionAI === 5}
                    notes={sectionNotes[5] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 5: val }))}
                    onGenerate={() => handleGenerateSectionAI(5)}
                    quickTags={['Fenomena Nyata', 'Investigasi Terbimbing', 'LKPD Berdiferensiasi', 'Refleksi Diri']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        1. Pengalaman Memahami
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'memahami'}
                        onClick={() =>
                          handleGenerateFieldAI('memahami', 'Pengalaman Memahami', (val) =>
                            setEditingItem({
                              ...editingItem,
                              pengalamanBelajar: {
                                ...editingItem.pengalamanBelajar,
                                memahami: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'memahami' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'memahami' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Bagaimana peserta didik membangun pemahaman konsep dasar dan menganalisis fakta.
                    </p>
                    <textarea
                      rows={2}
                      value={editingItem.pengalamanBelajar.memahami}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          pengalamanBelajar: {
                            ...editingItem.pengalamanBelajar,
                            memahami: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white"
                      placeholder="Peserta didik mengamati contoh..."
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        2. Pengalaman Mengaplikasi
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'mengaplikasi'}
                        onClick={() =>
                          handleGenerateFieldAI('mengaplikasi', 'Pengalaman Mengaplikasi', (val) =>
                            setEditingItem({
                              ...editingItem,
                              pengalamanBelajar: {
                                ...editingItem.pengalamanBelajar,
                                mengaplikasi: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'mengaplikasi' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'mengaplikasi' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Bagaimana murid menerapkan konsep dalam pemecahan masalah atau pembuatan produk/karya nyata.
                    </p>
                    <textarea
                      rows={2}
                      value={editingItem.pengalamanBelajar.mengaplikasi}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          pengalamanBelajar: {
                            ...editingItem.pengalamanBelajar,
                            mengaplikasi: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white"
                      placeholder="Peserta didik dalam kelompok mempraktikkan..."
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        3. Pengalaman Merefleksi
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'merefleksi'}
                        onClick={() =>
                          handleGenerateFieldAI('merefleksi', 'Pengalaman Merefleksi', (val) =>
                            setEditingItem({
                              ...editingItem,
                              pengalamanBelajar: {
                                ...editingItem.pengalamanBelajar,
                                merefleksi: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'merefleksi' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'merefleksi' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Bagaimana murid merenungkan makna pembelajaran bagi diri dan kehidupannya.
                    </p>
                    <textarea
                      rows={2}
                      value={editingItem.pengalamanBelajar.merefleksi}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          pengalamanBelajar: {
                            ...editingItem.pengalamanBelajar,
                            merefleksi: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white"
                      placeholder="Peserta didik mengisi lembar refleksi diri..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 6: Prinsip Pembelajaran Mendalam */}
              {formTab === 6 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={6}
                    title="Asisten AI Bagian 6: Tiga Pilar Prinsip Pembelajaran Mendalam"
                    subtitle="Konkretkan integrasi Berkesadaran (Mindful check-in), Bermakna (kontekstual riil), & Menggembirakan (Joyful)."
                    badge="Bagian 6 • 3 Pilar"
                    isGenerating={isGeneratingSectionAI === 6}
                    notes={sectionNotes[6] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 6: val }))}
                    onGenerate={() => handleGenerateSectionAI(6)}
                    quickTags={['Mindful Check-in', 'Konteks Kehidupan Riil', 'Apresiasi Positif', 'Gamifikasi Ceria']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Prinsip 1: Berkesadaran (Mindful)
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'berkesadaran'}
                        onClick={() =>
                          handleGenerateFieldAI('berkesadaran', 'Prinsip Berkesadaran', (val) =>
                            setEditingItem({
                              ...editingItem,
                              prinsipPembelajaranMendalam: {
                                ...editingItem.prinsipPembelajaranMendalam,
                                berkesadaran: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'berkesadaran' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'berkesadaran' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.prinsipPembelajaranMendalam.berkesadaran}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          prinsipPembelajaranMendalam: {
                            ...editingItem.prinsipPembelajaranMendalam,
                            berkesadaran: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Aktivitas hening sejenak, pemusatan konsentrasi, atau kehadiran utuh..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Prinsip 2: Bermakna (Meaningful)
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'bermakna'}
                        onClick={() =>
                          handleGenerateFieldAI('bermakna', 'Prinsip Bermakna', (val) =>
                            setEditingItem({
                              ...editingItem,
                              prinsipPembelajaranMendalam: {
                                ...editingItem.prinsipPembelajaranMendalam,
                                bermakna: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'bermakna' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'bermakna' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.prinsipPembelajaranMendalam.bermakna}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          prinsipPembelajaranMendalam: {
                            ...editingItem.prinsipPembelajaranMendalam,
                            bermakna: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Keterkaitan langsung dengan persoalan riil di rumah, masyarakat, atau lingkungan..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Prinsip 3: Menggembirakan (Joyful)
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'menggembirakan'}
                        onClick={() =>
                          handleGenerateFieldAI('menggembirakan', 'Prinsip Menggembirakan', (val) =>
                            setEditingItem({
                              ...editingItem,
                              prinsipPembelajaranMendalam: {
                                ...editingItem.prinsipPembelajaranMendalam,
                                menggembirakan: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'menggembirakan' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'menggembirakan' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.prinsipPembelajaranMendalam.menggembirakan}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          prinsipPembelajaranMendalam: {
                            ...editingItem.prinsipPembelajaranMendalam,
                            menggembirakan: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="Unsur kuis interaktif, gerak tubuh, simulasi ceria, atau tantangan berpasangan..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 7: Rencana Kegiatan */}
              {formTab === 7 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={7}
                    title="Asisten AI Bagian 7: Rencana Kegiatan Belajar (Pendahuluan, Inti, Penutup)"
                    subtitle="Susun skenario langkah pembelajaran per alokasi waktu menit dengan integrasi mindful, meaningful, & joyful."
                    badge="Bagian 7 • Sintaks Kegiatan"
                    isGenerating={isGeneratingSectionAI === 7}
                    notes={sectionNotes[7] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 7: val }))}
                    onGenerate={() => handleGenerateSectionAI(7)}
                    quickTags={['Apersepsi Pemantik', 'Sintaks PBL Kolaboratif', 'Presentasi Ceria', 'Refleksi Bermakna']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <label className="font-bold text-slate-800">A. Kegiatan Pendahuluan</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'pendahuluan'}
                          onClick={() =>
                            handleGenerateFieldAI('pendahuluan', 'Kegiatan Pendahuluan', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaKegiatan: {
                                  ...editingItem.rencanaKegiatan,
                                  pendahuluan: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'pendahuluan' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'pendahuluan' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.rencanaKegiatan.durasiPendahuluan}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaKegiatan: {
                              ...editingItem.rencanaKegiatan,
                              durasiPendahuluan: e.target.value,
                            },
                          })
                        }
                        className="p-1 border rounded w-28 text-right"
                        placeholder="10 menit"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={editingItem.rencanaKegiatan.pendahuluan}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          rencanaKegiatan: {
                            ...editingItem.rencanaKegiatan,
                            pendahuluan: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <label className="font-bold text-slate-800">B. Kegiatan Inti</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'kegiatanInti'}
                          onClick={() =>
                            handleGenerateFieldAI('kegiatanInti', 'Kegiatan Inti', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaKegiatan: {
                                  ...editingItem.rencanaKegiatan,
                                  kegiatanInti: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'kegiatanInti' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'kegiatanInti' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.rencanaKegiatan.durasiInti}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaKegiatan: {
                              ...editingItem.rencanaKegiatan,
                              durasiInti: e.target.value,
                            },
                          })
                        }
                        className="p-1 border rounded w-28 text-right"
                        placeholder="60 menit"
                      />
                    </div>
                    <textarea
                      rows={4}
                      value={editingItem.rencanaKegiatan.kegiatanInti}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          rencanaKegiatan: {
                            ...editingItem.rencanaKegiatan,
                            kegiatanInti: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <label className="font-bold text-slate-800">C. Kegiatan Penutup</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'penutup'}
                          onClick={() =>
                            handleGenerateFieldAI('penutup', 'Kegiatan Penutup', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaKegiatan: {
                                  ...editingItem.rencanaKegiatan,
                                  penutup: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'penutup' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'penutup' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.rencanaKegiatan.durasiPenutup}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaKegiatan: {
                              ...editingItem.rencanaKegiatan,
                              durasiPenutup: e.target.value,
                            },
                          })
                        }
                        className="p-1 border rounded w-28 text-right"
                        placeholder="10 menit"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={editingItem.rencanaKegiatan.penutup}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          rencanaKegiatan: {
                            ...editingItem.rencanaKegiatan,
                            penutup: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Tab 8: Asesmen */}
              {formTab === 8 && (
                <div className="space-y-3">
                  <PerencanaanSectionAIAssistant
                    sectionNumber={8}
                    title="Asisten AI Bagian 8: Asesmen Pembelajaran & KKTP"
                    subtitle="Lengkapi rencana evaluasi menyeluruh: Asesmen Awal (diagnostik), Proses (formatif), Akhir (sumatif), teknik & instrumen rubrik."
                    badge="Bagian 8 • Asesmen"
                    isGenerating={isGeneratingSectionAI === 8}
                    notes={sectionNotes[8] || ''}
                    onNotesChange={(val) => setSectionNotes((prev) => ({ ...prev, 8: val }))}
                    onGenerate={() => handleGenerateSectionAI(8)}
                    quickTags={['Diagnostik Singkat', 'Observasi Formatif', 'Penilaian Unjuk Kerja', 'Rubrik Deskriptif']}
                    topicPlaceholderWarning={!editingItem.identitas.topikMateri?.trim()}
                    mapel={editingItem.identitas.mataPelajaran || profile.mataPelajaran}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Asesmen Awal</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'asesmenAwal'}
                          onClick={() =>
                            handleGenerateFieldAI('asesmenAwal', 'Asesmen Awal', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaAsesmen: {
                                  ...editingItem.rencanaAsesmen,
                                  asesmenAwal: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'asesmenAwal' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'asesmenAwal' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={editingItem.rencanaAsesmen.asesmenAwal}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaAsesmen: {
                              ...editingItem.rencanaAsesmen,
                              asesmenAwal: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder="Diagnostik singkat..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Asesmen Proses</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'asesmenProses'}
                          onClick={() =>
                            handleGenerateFieldAI('asesmenProses', 'Asesmen Proses', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaAsesmen: {
                                  ...editingItem.rencanaAsesmen,
                                  asesmenProses: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'asesmenProses' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'asesmenProses' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={editingItem.rencanaAsesmen.asesmenProses}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaAsesmen: {
                              ...editingItem.rencanaAsesmen,
                              asesmenProses: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder="Formatif saat pembelajaran..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Asesmen Akhir</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'asesmenAkhir'}
                          onClick={() =>
                            handleGenerateFieldAI('asesmenAkhir', 'Asesmen Akhir', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaAsesmen: {
                                  ...editingItem.rencanaAsesmen,
                                  asesmenAkhir: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'asesmenAkhir' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'asesmenAkhir' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={editingItem.rencanaAsesmen.asesmenAkhir}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaAsesmen: {
                              ...editingItem.rencanaAsesmen,
                              asesmenAkhir: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder="Sumatif / reflektif akhir..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Teknik Asesmen</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'teknikAsesmen'}
                          onClick={() =>
                            handleGenerateFieldAI('teknikAsesmen', 'Teknik Asesmen', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaAsesmen: {
                                  ...editingItem.rencanaAsesmen,
                                  teknikAsesmen: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'teknikAsesmen' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'teknikAsesmen' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.rencanaAsesmen.teknikAsesmen}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaAsesmen: {
                              ...editingItem.rencanaAsesmen,
                              teknikAsesmen: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Instrumen Asesmen</label>
                        <button
                          type="button"
                          disabled={singleFieldLoading === 'instrumenAsesmen'}
                          onClick={() =>
                            handleGenerateFieldAI('instrumenAsesmen', 'Instrumen Asesmen', (val) =>
                              setEditingItem({
                                ...editingItem,
                                rencanaAsesmen: {
                                  ...editingItem.rencanaAsesmen,
                                  instrumenAsesmen: val,
                                },
                              })
                            )
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                        >
                          {singleFieldLoading === 'instrumenAsesmen' ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{singleFieldLoading === 'instrumenAsesmen' ? 'Menulis...' : 'Bantu AI'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingItem.rencanaAsesmen.instrumenAsesmen}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            rencanaAsesmen: {
                              ...editingItem.rencanaAsesmen,
                              instrumenAsesmen: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                      </label>
                      <button
                        type="button"
                        disabled={singleFieldLoading === 'kriteriaKetercapaian'}
                        onClick={() =>
                          handleGenerateFieldAI('kriteriaKetercapaian', 'Kriteria KKTP', (val) =>
                            setEditingItem({
                              ...editingItem,
                              rencanaAsesmen: {
                                ...editingItem.rencanaAsesmen,
                                kriteriaKetercapaian: val,
                              },
                            })
                          )
                        }
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold hover:underline"
                      >
                        {singleFieldLoading === 'kriteriaKetercapaian' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{singleFieldLoading === 'kriteriaKetercapaian' ? 'Menulis...' : 'Bantu AI'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editingItem.rencanaAsesmen.kriteriaKetercapaian}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          rencanaAsesmen: {
                            ...editingItem.rencanaAsesmen,
                            kriteriaKetercapaian: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Tab 9: Media Belajar (Visual, Audio, Audiovisual, Multimedia Interaktif) */}
              {formTab === 9 && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-sm border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-600 rounded-lg text-white shadow-2xs">
                          <MonitorPlay className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                              Bagian 9 • Media Pembelajaran
                            </span>
                            <span className="text-xs text-slate-300">• Kurikulum Merdeka & Deep Learning</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">
                            Rancang Media Pembelajaran Berbasis Pembelajaran Mendalam
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMediaStudio(editingItem)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-md shrink-0"
                        >
                          <MonitorPlay className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span>🚀 Buka Studio AI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenMediaScript(editingItem)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-all border border-indigo-200 shadow-2xs shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Naskah & Penyelarasan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pilihan Kategori Media Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Media Visual */}
                    <div className="p-3.5 bg-white rounded-xl border border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                            <ImageIcon className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            Visual
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mb-1">1. Media Visual</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Slide Presentasi (PPT) 6 tayangan interaktif, Infografik edukatif hirarki, Mindmap konseptual, dan Diagram alir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                      >
                        <MonitorPlay className="w-3.5 h-3.5 text-amber-300" />
                        <span>🚀 Jalankan Slide PPT</span>
                      </button>
                    </div>

                    {/* 2. Media Audio */}
                    <div className="p-3.5 bg-white rounded-xl border border-amber-200 hover:shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                            <Headphones className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Audio
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mb-1">2. Media Audio</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Podcast edukasi dialogis 2 karakter (Host & Guru) dengan suara sintetis Bahasa Indonesia, narasi pemantik berkesadaran.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                      >
                        <Headphones className="w-3.5 h-3.5 text-amber-200" />
                        <span>🎙️ Putar Podcast Audio</span>
                      </button>
                    </div>

                    {/* 3. Media Audiovisual */}
                    <div className="p-3.5 bg-white rounded-xl border border-rose-200 hover:shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                            <Video className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            Audiovisual
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mb-1">3. Media Audiovisual</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Storyboard video 6 adegan bersuara narasi (intro, fenomena nyata, animasi konsep, panduan investigasi, refleksi).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="mt-3 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                      >
                        <Video className="w-3.5 h-3.5 text-rose-200" />
                        <span>🎬 Jalankan Video Scene</span>
                      </button>
                    </div>

                    {/* 4. Multimedia / Interaktif */}
                    <div className="p-3.5 bg-white rounded-xl border border-emerald-200 hover:shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                            <Gamepad2 className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Interaktif
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mb-1">4. Multimedia Interaktif</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Gamifikasi kuis langsung dapat dimainkan (playable quiz) dengan sound effect Web Audio, skor, streak, dan umpan balik reflektif.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>🕹️ Mainkan Kuis Interaktif</span>
                      </button>
                    </div>
                  </div>

                  {/* Daftar Media yang Sudah Ada di RPP ini */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <MonitorPlay className="w-4 h-4 text-indigo-600" />
                        <span>Media yang Terkait dengan Dokumen RPP Ini ({editingItem.mediaPembelajaranList?.length || 0})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                      >
                        <span>Kelola / Rancang Baru</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {(editingItem.mediaPembelajaranList && editingItem.mediaPembelajaranList.length > 0) ? (
                      <div className="space-y-2">
                        {editingItem.mediaPembelajaranList.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  {m.kategori}
                                </span>
                                <span className="font-bold text-slate-900 text-xs">{m.namaMedia}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-1">{m.deskripsiRingkas}</p>
                              <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                                <span>Alat: {m.alatBahanAplikasi}</span>
                                <span>•</span>
                                <span>Tahap: {m.keselarasan?.pengalamanBelajar?.tahap || 'Memahami'}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenMediaStudio(editingItem)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-2xs"
                              >
                                <MonitorPlay className="w-3.5 h-3.5 text-amber-300" />
                                <span>Jalankan Media (AI Live)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenMediaScript(editingItem)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-semibold border border-indigo-200 rounded-lg text-xs shadow-2xs"
                              >
                                Naskah & Cetak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <MonitorPlay className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                        <p className="font-semibold text-xs text-slate-700">Belum ada media pembelajaran khusus yang disimpan.</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Klik tombol <strong>"Buka Studio AI (Jalankan Media)"</strong> di atas untuk menyusun dan langsung memutar media visual, audio, video, atau interaktif.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Navigation / Submit Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex space-x-2">
                  {formTab > 1 && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab - 1)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                    >
                      Sebelumnya
                    </button>
                  )}
                  {formTab < 9 && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab + 1)}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold"
                    >
                      Lanjut ke Bagian {formTab + 1}
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {editingItem && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaStudio(editingItem)}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        title="Buka / Rancang Media Pembelajaran untuk RPP ini"
                      >
                        <MonitorPlay className="w-4 h-4 text-indigo-600" />
                        <span>Media Belajar</span>
                        {(editingItem.mediaPembelajaranList?.length || 0) > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setLkpdActivePlan(editingItem)}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        title="Buka / Rancang LKPD Pembelajaran Mendalam untuk RPP ini"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        <span>Rancang LKPD</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndOpenMediaStudio}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-md text-xs ring-1 ring-purple-300/60 transition-all hover:scale-[1.02]"
                    title="Simpan dokumen RPP ini dan langsung buka Studio Produksi Media AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Simpan & Buat Media Langsung (AI)</span>
                  </button>
                  <button
                    type="submit"
                    id="btn-simpan-perencanaan"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-2xs text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Dokumen</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Impor Perencanaan (Word & PDF) */}
      <ImportPerencanaanModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        profile={profile}
        onImportSuccess={handleImportSuccess}
        onShowToast={onShowToast}
      />

      {/* Modal LKPD Pembelajaran Mendalam */}
      {lkpdActivePlan && (
        <LKPDModal
          plan={lkpdActivePlan}
          profile={profile}
          isOpen={!!lkpdActivePlan}
          onClose={() => setLkpdActivePlan(null)}
          onSavePlan={(updatedPlan) => {
            onSavePerencanaan(updatedPlan);
            setLkpdActivePlan(updatedPlan);
            if (detailItem && detailItem.id === updatedPlan.id) {
              setDetailItem(updatedPlan);
            }
            if (editingItem && editingItem.id === updatedPlan.id) {
              setEditingItem(updatedPlan);
            }
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Modal Media Pembelajaran Mendalam (Visual, Audio, Audiovisual, Multimedia Interaktif) */}
      {mediaActivePlan && (
        <MediaPembelajaranModal
          plan={mediaActivePlan}
          profile={profile}
          isOpen={!!mediaActivePlan}
          initialTab={mediaModalInitialTab}
          onClose={() => setMediaActivePlan(null)}
          onSavePlan={(updatedPlan) => {
            onSavePerencanaan(updatedPlan);
            setMediaActivePlan(updatedPlan);
            if (detailItem && detailItem.id === updatedPlan.id) {
              setDetailItem(updatedPlan);
            }
            if (editingItem && editingItem.id === updatedPlan.id) {
              setEditingItem(updatedPlan);
            }
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
