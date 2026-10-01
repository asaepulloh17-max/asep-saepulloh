import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpenCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit,
  Trash2,
  Printer,
  Eye,
  X,
  Save,
  Users,
  Filter,
  Sparkles,
  Wand2,
  Loader2,
  Download,
} from 'lucide-react';
import { JurnalMengajar, TeacherProfile, PesertaDidik, Perencanaan } from '../types';
import { generateJurnalWithAI } from '../services/aiService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { MediaPembelajaranView } from './MediaPembelajaranView';

interface PelaksanaanViewProps {
  jurnalList: JurnalMengajar[];
  profile: TeacherProfile;
  siswaList: PesertaDidik[];
  perencanaanList?: Perencanaan[];
  selectedRPPForEduGenius?: string;
  onSaveJurnal: (jurnal: JurnalMengajar) => void;
  onDeleteJurnal: (id: string) => void;
  onOpenAIWithTopic?: (topik: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialSubTab?: 'jurnal' | 'media';
  onNavigateToPerencanaan?: () => void;
}

export const PelaksanaanView: React.FC<PelaksanaanViewProps> = ({
  jurnalList,
  profile,
  siswaList,
  perencanaanList = [],
  selectedRPPForEduGenius,
  onSaveJurnal,
  onDeleteJurnal,
  onOpenAIWithTopic,
  onShowToast,
  initialSubTab = 'jurnal',
  onNavigateToPerencanaan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'jurnal' | 'media'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJurnal, setEditingJurnal] = useState<JurnalMengajar | null>(null);
  const [detailJurnal, setDetailJurnal] = useState<JurnalMengajar | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDownloadJurnalPDF = async (jurnal: JurnalMengajar) => {
    setIsExportingPDF(true);
    onShowToast('info', 'Sedang memproses berkas PDF Jurnal Pembelajaran...');
    const filename = `Jurnal_KBM_${jurnal.kelas}_Pertemuan_${jurnal.pertemuanKe}_${(jurnal.topikMateri || 'Materi').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    setDetailJurnal(jurnal);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const success = await downloadElementAsPDF('dokumen-jurnal-detail', filename, {
      title: `Jurnal KBM Pertemuan ${jurnal.pertemuanKe} - ${jurnal.kelas}`,
    });
    setIsExportingPDF(false);
    if (success) {
      onShowToast('success', 'Berkas PDF Jurnal berhasil diunduh!');
    } else {
      onShowToast('info', 'Membuka dialog cetak untuk simpan sebagai PDF.');
    }
  };

  // AI Assistant states for Pelaksanaan
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTopikMateri, setAiTopikMateri] = useState('');
  const [aiPertemuanKe, setAiPertemuanKe] = useState(jurnalList.length + 1);
  const [aiKelas, setAiKelas] = useState(profile.kelasAktif || 'VII-A');

  const createEmptyJurnal = (): JurnalMengajar => {
    const today = new Date().toISOString().split('T')[0];
    const targetClass = profile.kelasAktif || 'VII-A';
    const studentsInClass = siswaList.filter((s) => !s.kelas || s.kelas === targetClass);

    return {
      id: 'jurnal-' + Date.now(),
      tanggal: today,
      pertemuanKe: jurnalList.length + 1,
      kelas: targetClass,
      mataPelajaran: profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
      jamPelajaran: 'Jam 1-2 (07.30 - 08.50 WIB)',
      jamKe: '1-2 (07.30 - 08.50)',
      topikMateri: '',
      tujuanPembelajaran: '',
      kegiatanTerlaksana: '1. Sapaan hangat dan mindfulness check-in.\n2. Diskusi kelompok terarah.\n3. Presentasi singkat dan pengisian tiket keluar.',
      pengalamanBelajar: {
        memahami: true,
        mengaplikasi: true,
        merefleksi: true,
      },
      pengalamanTerlaksana: {
        memahami: true,
        mengaplikasi: true,
        merefleksi: true,
      },
      penerapanMendalam: {
        berkesadaran: true,
        bermakna: true,
        menggembirakan: true,
      },
      prinsipTerlaksana: {
        berkesadaran: true,
        bermakna: true,
        menggembirakan: true,
      },
      catatanKejadian: '',
      catatanKendala: '',
      kendala: '',
      tindakLanjut: '',
      solusiTindakan: '',
      kehadiran: {
        hadir: studentsInClass.length > 0 ? studentsInClass.length : 30,
        sakit: 0,
        izin: 0,
        alpa: 0,
        siswaAbsen: [],
      },
      presensi: {
        hadir: studentsInClass.length > 0 ? studentsInClass.length : 30,
        sakit: 0,
        izin: 0,
        alpa: 0,
        siswaAbsen: [],
      },
      refleksiGuru: 'Peserta didik antusias, namun perlu penekanan kembali pada pembagian peran dalam kelompok.',
      statusKetercapaian: 'Tercapai',
      status: 'Terlaksana',
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleOpenNew = () => {
    setEditingJurnal(createEmptyJurnal());
    setIsFormOpen(true);
  };

  const handleAutoDraftWithAI = async (topicToUse?: string) => {
    const topic = (topicToUse || editingJurnal?.topikMateri || aiTopikMateri || '').trim();
    if (!topic) {
      onShowToast('info', 'Ketikkan topik/materi terlebih dahulu untuk dibantu AI');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const draft = await generateJurnalWithAI({
        mapel: profile.mataPelajaran || 'IPA',
        kelas: editingJurnal?.kelas || aiKelas,
        topik: topic,
        pertemuanKe: editingJurnal?.pertemuanKe || aiPertemuanKe,
      });

      if (editingJurnal) {
        setEditingJurnal({
          ...editingJurnal,
          topikMateri: topic,
          tujuanPembelajaran: draft.tujuanPembelajaran,
          kegiatanTerlaksana: draft.kegiatanTerlaksana,
          pengalamanTerlaksana: draft.pengalamanTerlaksana,
          prinsipTerlaksana: draft.prinsipTerlaksana,
          kendala: draft.kendala,
          solusiTindakan: draft.solusiTindakan,
          refleksiGuru: draft.refleksiGuru,
          statusKetercapaian: 'Tercapai',
        });
      } else {
        const newJurnal = createEmptyJurnal();
        newJurnal.topikMateri = topic;
        newJurnal.pertemuanKe = aiPertemuanKe;
        newJurnal.kelas = aiKelas;
        newJurnal.tujuanPembelajaran = draft.tujuanPembelajaran;
        newJurnal.kegiatanTerlaksana = draft.kegiatanTerlaksana;
        newJurnal.pengalamanTerlaksana = draft.pengalamanTerlaksana;
        newJurnal.prinsipTerlaksana = draft.prinsipTerlaksana;
        newJurnal.kendala = draft.kendala;
        newJurnal.solusiTindakan = draft.solusiTindakan;
        newJurnal.refleksiGuru = draft.refleksiGuru;
        newJurnal.statusKetercapaian = 'Tercapai';
        setEditingJurnal(newJurnal);
        setIsFormOpen(true);
      }
      setIsAIModalOpen(false);
      onShowToast('success', 'Draf Jurnal Pembelajaran Mendalam berhasil dirumuskan AI!');
    } catch (e) {
      onShowToast('error', 'Gagal menyusun draf AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleOpenEdit = (item: JurnalMengajar) => {
    setEditingJurnal(JSON.parse(JSON.stringify(item)));
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJurnal) return;
    if (!editingJurnal.topikMateri.trim()) {
      onShowToast('error', 'Topik/materi pembelajaran harus diisi');
      return;
    }
    onSaveJurnal(editingJurnal);
    setIsFormOpen(false);
    setEditingJurnal(null);
    onShowToast('success', 'Jurnal Mengajar berhasil disimpan');
  };

  const filteredJurnals = jurnalList.filter((j) => {
    const matchSearch =
      j.topikMateri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.catatanKejadian && j.catatanKejadian.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchKelas = !filterKelas || j.kelas === filterKelas;
    const matchStatus = !filterStatus || j.statusKetercapaian === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  return (
    <div className="space-y-6" id="pelaksanaan-view-container">
      {/* Sub-tabs in Pelaksanaan Pembelajaran */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('jurnal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeSubTab === 'jurnal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Jurnal Mengajar (KBM)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeSubTab === 'jurnal' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {jurnalList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('media')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeSubTab === 'media'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Media Pembelajaran • EduGenius</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeSubTab === 'media' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              AI Sokratik
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'media' ? (
        <MediaPembelajaranView
          profile={profile}
          perencanaanList={perencanaanList}
          initialSelectedRPPId={selectedRPPForEduGenius}
          onShowToast={onShowToast}
          onNavigateToPerencanaan={onNavigateToPerencanaan}
        />
      ) : (
        <>
          {/* Top action bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, catatan, atau kendala..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Ketercapaian</option>
            <option value="Tercapai">Tercapai</option>
            <option value="Sebagian Tercapai">Sebagian Tercapai</option>
            <option value="Perlu Diulang">Perlu Diulang</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAiTopikMateri(editingJurnal?.topikMateri || '');
              setIsAIModalOpen(true);
            }}
            id="btn-asisten-ai-jurnal"
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Asisten AI Jurnal</span>
          </button>

          <button
            onClick={handleOpenNew}
            id="btn-tambah-jurnal"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Isi Jurnal Baru</span>
          </button>
        </div>
      </div>

      {/* Jurnal List */}
      {filteredJurnals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Belum ada jurnal mengajar tercatat</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Catat hasil tatap muka pembelajaran harian secara runtut, jujur, dan berorientasi reflektif.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Isi Jurnal Hari Ini</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJurnals.map((jurnal) => (
            <div
              key={jurnal.id}
              id={`jurnal-row-${jurnal.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap text-[11px]">
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Pertemuan {jurnal.pertemuanKe}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {jurnal.tanggal} • {jurnal.jamKe}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                    Kelas {jurnal.kelas}
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${
                      jurnal.statusKetercapaian === 'Tercapai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : jurnal.statusKetercapaian === 'Sebagian Tercapai'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {jurnal.statusKetercapaian}
                  </span>
                  {jurnal.isDemo && (
                    <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                      DEMO
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                  {jurnal.topikMateri}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-1">
                  {jurnal.kegiatanTerlaksana}
                </p>

                {/* Quick Indicators: Mindful, Meaningful, Joyful */}
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hadir: {jurnal.presensi.hadir}</span>
                    {jurnal.presensi.sakit > 0 && <span className="text-amber-600">({jurnal.presensi.sakit} S)</span>}
                    {jurnal.presensi.izin > 0 && <span className="text-blue-600">({jurnal.presensi.izin} I)</span>}
                    {jurnal.presensi.alpa > 0 && <span className="text-rose-600">({jurnal.presensi.alpa} A)</span>}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">
                    Prinsip: {[
                      jurnal.prinsipTerlaksana.berkesadaran && 'Sadar',
                      jurnal.prinsipTerlaksana.bermakna && 'Bermakna',
                      jurnal.prinsipTerlaksana.menggembirakan && 'Gembira',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => setDetailJurnal(jurnal)}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                  title="Lihat Detail Jurnal"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJurnalPDF(jurnal)}
                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                  title="Unduh PDF Jurnal"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailJurnal(jurnal);
                    setTimeout(() => {
                      printElementDirectly(
                        'dokumen-jurnal-detail',
                        `Jurnal_KBM_${jurnal.kelas}_Pertemuan_${jurnal.pertemuanKe}`
                      );
                    }, 200);
                  }}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                  title="Cetak Jurnal"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(jurnal)}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                  title="Ubah Jurnal"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(jurnal.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-50 rounded"
                  title="Hapus Jurnal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Hapus Catatan Jurnal Mengajar</h4>
            <p className="text-xs text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus catatan jurnal tatap muka ini?
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
                  onDeleteJurnal(deleteConfirmId);
                  setDeleteConfirmId(null);
                  onShowToast('info', 'Catatan jurnal berhasil dihapus');
                }}
                className="px-3 py-1.5 text-xs bg-rose-600 text-white font-semibold hover:bg-rose-700 rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Jurnal Modal */}
      {detailJurnal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold truncate max-w-sm">
                  Rincian Jurnal: {detailJurnal.topikMateri || `Pertemuan ${detailJurnal.pertemuanKe}`}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-download-pdf-jurnal"
                  onClick={() => handleDownloadJurnalPDF(detailJurnal)}
                  disabled={isExportingPDF}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-60 shadow-2xs"
                  title="Unduh Berkas PDF Jurnal Resmi"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isExportingPDF ? 'Memproses...' : 'Unduh PDF'}</span>
                </button>
                <button
                  type="button"
                  id="btn-print-jurnal"
                  onClick={() =>
                    printElementDirectly(
                      'dokumen-jurnal-detail',
                      `Jurnal_KBM_${detailJurnal.kelas}_Pertemuan_${detailJurnal.pertemuanKe}`
                    )
                  }
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
                  title="Cetak Jurnal"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailJurnal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              id="dokumen-jurnal-detail"
              className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-800 bg-white print-clean"
            >
              <div className="text-center border-b pb-3">
                <h2 className="text-sm font-bold uppercase">JURNAL PELAKSANAAN PEMBELAJARAN (TATAP MUKA)</h2>
                <p className="text-xs text-slate-500">
                  {profile.namaSekolah} • Mata Pelajaran {profile.mataPelajaran}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border">
                <div><span className="text-slate-500">Tanggal:</span> <strong className="block">{detailJurnal.tanggal}</strong></div>
                <div><span className="text-slate-500">Pertemuan Ke:</span> <strong className="block">{detailJurnal.pertemuanKe}</strong></div>
                <div><span className="text-slate-500">Kelas:</span> <strong className="block">{detailJurnal.kelas}</strong></div>
                <div><span className="text-slate-500">Jam Pelajaran:</span> <strong className="block">{detailJurnal.jamKe}</strong></div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Materi / Topik:</span>
                <p className="p-2 bg-slate-50 rounded border">{detailJurnal.topikMateri}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Tujuan Pembelajaran Terlaksana:</span>
                <p className="p-2 bg-slate-50 rounded border">{detailJurnal.tujuanPembelajaran || '-'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Aktivitas yang Benar-benar Berlangsung:</span>
                <p className="p-2 bg-slate-50 rounded border whitespace-pre-wrap">{detailJurnal.kegiatanTerlaksana}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <span className="font-bold block mb-1">Pengalaman Belajar:</span>
                  <ul className="space-y-1">
                    <li>• Memahami: {detailJurnal.pengalamanTerlaksana.memahami ? '✅ Terlaksana' : '❌ Belum'}</li>
                    <li>• Mengaplikasi: {detailJurnal.pengalamanTerlaksana.mengaplikasi ? '✅ Terlaksana' : '❌ Belum'}</li>
                    <li>• Merefleksi: {detailJurnal.pengalamanTerlaksana.merefleksi ? '✅ Terlaksana' : '❌ Belum'}</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <span className="font-bold block mb-1">Prinsip Pembelajaran Mendalam:</span>
                  <ul className="space-y-1">
                    <li>• Berkesadaran (Mindful): {detailJurnal.prinsipTerlaksana.berkesadaran ? '✅ Terlaksana' : '❌ Belum'}</li>
                    <li>• Bermakna (Meaningful): {detailJurnal.prinsipTerlaksana.bermakna ? '✅ Terlaksana' : '❌ Belum'}</li>
                    <li>• Menggembirakan (Joyful): {detailJurnal.prinsipTerlaksana.menggembirakan ? '✅ Terlaksana' : '❌ Belum'}</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="font-bold block mb-1">Rekap Presensi Siswa:</span>
                <div className="flex gap-4">
                  <span>Hadir: <strong>{detailJurnal.presensi.hadir}</strong></span>
                  <span>Sakit: <strong>{detailJurnal.presensi.sakit}</strong></span>
                  <span>Izin: <strong>{detailJurnal.presensi.izin}</strong></span>
                  <span>Tanpa Keterangan: <strong>{detailJurnal.presensi.alpa}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Kendala / Hambatan:</span>
                  <p className="p-2 bg-slate-50 rounded border">{detailJurnal.kendala || 'Tidak ada kendala berarti.'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Solusi / Tindak Nyata:</span>
                  <p className="p-2 bg-slate-50 rounded border">{detailJurnal.solusiTindakan || 'Pembelajaran berjalan lancar sesuai rencana.'}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Refleksi Singkat Guru:</span>
                <p className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded text-indigo-950 font-medium whitespace-pre-wrap">
                  {detailJurnal.refleksiGuru || 'Pembelajaran berjalan baik.'}
                </p>
              </div>

              {/* Lembar Verifikasi & Tanda Tangan Resmi (Kepala Sekolah & Guru) */}
              <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-2 text-xs text-slate-900 text-center gap-8">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala {profile.namaSekolah}</p>
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
                    {profile.alamatSekolah?.split(',')[0] || 'Tempat'},{' '}
                    {detailJurnal.tanggal
                      ? new Date(detailJurnal.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : new Date().toLocaleDateString('id-ID', {
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
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && editingJurnal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Formulir Jurnal Mengajar Harian</h3>
                <p className="text-xs text-slate-400">
                  Dokumentasikan tatap muka, kehadiran, dan refleksi pembelajaran
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

            <form onSubmit={handleSaveForm} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editingJurnal.tanggal}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, tanggal: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={editingJurnal.pertemuanKe}
                    onChange={(e) =>
                      setEditingJurnal({ ...editingJurnal, pertemuanKe: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={editingJurnal.kelas}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, kelas: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Jam Pelajaran</label>
                  <input
                    type="text"
                    value={editingJurnal.jamKe}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, jamKe: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="1-2 (07.30 - 08.50)"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Materi / Topik Tatap Muka <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Ketik topik lalu gunakan asisten AI di bawah
                  </span>
                </div>
                <input
                  type="text"
                  value={editingJurnal.topikMateri}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, topikMateri: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Klasifikasi Makhluk Hidup & Praktik Kunci Determinasi"
                  required
                />
              </div>

              {/* Asisten AI Pelaksanaan Ribbon */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-900 text-xs">
                      Asisten AI Pelaksanaan Pembelajaran
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    Pembelajaran Mendalam (3M)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Bantu susun Tujuan Pembelajaran, Kegiatan Alur 3M (Memahami, Mengaplikasi, Merefleksi), Solusi Kendala, dan Refleksi Guru berdasarkan materi di atas.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={() => handleAutoDraftWithAI()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs flex items-center space-x-1.5 transition-all shadow-2xs disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Merumuskan Draf AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Lengkapi Jurnal Ini Otomatis (AI)</span>
                      </>
                    )}
                  </button>

                  {onOpenAIWithTopic && (
                    <button
                      type="button"
                      onClick={() => onOpenAIWithTopic(editingJurnal.topikMateri || 'Jurnal Pembelajaran Mendalam')}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-md text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Konsultasi AI Terbuka</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Pembelajaran</label>
                <textarea
                  rows={2}
                  value={editingJurnal.tujuanPembelajaran}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, tujuanPembelajaran: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Tujuan spesifik yang ditargetkan tercapai hari ini..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kegiatan Pembelajaran yang Terlaksana
                </label>
                <textarea
                  rows={3}
                  value={editingJurnal.kegiatanTerlaksana}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, kegiatanTerlaksana: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="1. Pembukaan dan apersepsi...\n2. Eksplorasi praktikum...\n3. Refleksi dan penutup..."
                />
              </div>

              {/* Checklist Pengalaman & Prinsip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Pengalaman Belajar Terlaksana:</label>
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.pengalamanTerlaksana.memahami}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            pengalamanTerlaksana: {
                              ...editingJurnal.pengalamanTerlaksana,
                              memahami: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Memahami (Mengonstruksi konsep)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.pengalamanTerlaksana.mengaplikasi}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            pengalamanTerlaksana: {
                              ...editingJurnal.pengalamanTerlaksana,
                              mengaplikasi: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mengaplikasi (Penerapan/Praktik)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.pengalamanTerlaksana.merefleksi}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            pengalamanTerlaksana: {
                              ...editingJurnal.pengalamanTerlaksana,
                              merefleksi: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Merefleksi (Pemetikan makna)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Prinsip Pembelajaran Mendalam:</label>
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.prinsipTerlaksana.berkesadaran}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            prinsipTerlaksana: {
                              ...editingJurnal.prinsipTerlaksana,
                              berkesadaran: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Berkesadaran (Mindful - hadir utuh)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.prinsipTerlaksana.bermakna}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            prinsipTerlaksana: {
                              ...editingJurnal.prinsipTerlaksana,
                              bermakna: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Bermakna (Meaningful - relevan)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingJurnal.prinsipTerlaksana.menggembirakan}
                        onChange={(e) =>
                          setEditingJurnal({
                            ...editingJurnal,
                            prinsipTerlaksana: {
                              ...editingJurnal.prinsipTerlaksana,
                              menggembirakan: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Menggembirakan (Joyful - antusias)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Presensi Section */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <label className="block font-bold text-slate-800 mb-2">Presensi Kehadiran Siswa</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-600 block">Hadir</span>
                    <input
                      type="number"
                      min={0}
                      value={editingJurnal.presensi.hadir}
                      onChange={(e) =>
                        setEditingJurnal({
                          ...editingJurnal,
                          presensi: { ...editingJurnal.presensi, hadir: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-1.5 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block">Sakit</span>
                    <input
                      type="number"
                      min={0}
                      value={editingJurnal.presensi.sakit}
                      onChange={(e) =>
                        setEditingJurnal({
                          ...editingJurnal,
                          presensi: { ...editingJurnal.presensi, sakit: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-1.5 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block">Izin</span>
                    <input
                      type="number"
                      min={0}
                      value={editingJurnal.presensi.izin}
                      onChange={(e) =>
                        setEditingJurnal({
                          ...editingJurnal,
                          presensi: { ...editingJurnal.presensi, izin: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-1.5 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block">Alpa</span>
                    <input
                      type="number"
                      min={0}
                      value={editingJurnal.presensi.alpa}
                      onChange={(e) =>
                        setEditingJurnal({
                          ...editingJurnal,
                          presensi: { ...editingJurnal.presensi, alpa: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-1.5 border rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Kendala & Solusi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kendala / Hambatan Kelas</label>
                  <textarea
                    rows={2}
                    value={editingJurnal.kendala}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, kendala: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Contoh: Waktu praktikum kurang 10 menit..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Solusi / Tindakan Nyata</label>
                  <textarea
                    rows={2}
                    value={editingJurnal.solusiTindakan}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, solusiTindakan: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Contoh: Pembagian sampel dipercepat sejak awal..."
                  />
                </div>
              </div>

              {/* Refleksi Guru & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Refleksi Diri Guru</label>
                  <textarea
                    rows={2}
                    value={editingJurnal.refleksiGuru}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, refleksiGuru: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Catatan perbaikan diri untuk pertemuan berikutnya..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Ketercapaian</label>
                  <select
                    value={editingJurnal.statusKetercapaian}
                    onChange={(e) =>
                      setEditingJurnal({
                        ...editingJurnal,
                        statusKetercapaian: e.target.value as any,
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="Tercapai">Tercapai</option>
                    <option value="Sebagian Tercapai">Sebagian Tercapai</option>
                    <option value="Perlu Diulang">Perlu Diulang</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-jurnal"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Jurnal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asisten AI Buat Jurnal Baru */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Asisten AI Jurnal Mengajar</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAIModalOpen(false)}
                className="text-emerald-100 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Asisten AI akan merumuskan draf jurnal pembelajaran mendalam yang mencakup Tujuan Pembelajaran operasional, alur kegiatan 3M (Memahami, Mengaplikasi, Merefleksi), catatan kendala, dan refleksi pedagogis guru secara otomatis.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Materi / Topik Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={aiTopikMateri}
                  onChange={(e) => setAiTopikMateri(e.target.value)}
                  placeholder="Misal: Ekosistem, Jaring-jaring Makanan, dan Dampak Pencemaran"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={aiKelas}
                    onChange={(e) => setAiKelas(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white text-xs"
                  >
                    {profile.kelasList.map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={aiPertemuanKe}
                    onChange={(e) => setAiPertemuanKe(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold block">Prinsip Otomatis Terintegrasi:</span>
                <p>✓ Berkesadaran (Mindful check-in di awal pembelajaran)</p>
                <p>✓ Bermakna (Aplikasi kontekstual masalah nyata)</p>
                <p>✓ Menggembirakan (Aktivitas kolaboratif & apresiasi)</p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAIModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isGeneratingAI || !aiTopikMateri.trim()}
                  onClick={() => handleAutoDraftWithAI(aiTopikMateri)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyusun Jurnal...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Rancang & Buka Jurnal Ini</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
