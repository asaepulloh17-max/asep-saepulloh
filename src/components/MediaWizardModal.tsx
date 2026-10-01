import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Eye,
  Edit3,
  RefreshCw,
  Download,
  Printer,
  Copy,
  Check,
  Play,
  RotateCcw,
  BookOpen,
  Volume2,
  Video,
  Gamepad2,
  Layers,
  HelpCircle,
  FileText,
  AlertCircle,
  Sparkle,
  Film,
  Send,
  Save,
  Clock,
  Compass,
} from 'lucide-react';
import {
  Perencanaan,
  TeacherProfile,
  MediaRecord,
  MediaAnalisisAI,
  MediaRekomendasiItem,
  MediaKontrolGuru,
  MediaRancanganData,
  MediaProdukData,
  KategoriMediaUtama,
  StoryboardVideoRow,
  InteractivePageItem,
  DAFTAR_DIMENSI_PROFIL_LULUSAN,
} from '../types';
import {
  analyzeMateriNeeds,
  generateMediaRecommendations,
  createMediaRancangan,
  produceMediaContent,
  reviseMediaWithAI,
  MediaInputContext,
} from '../services/aiMediaService';
import { saveMediaRecord } from '../data/storage';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { MediaLiveStudio } from './MediaLiveStudio';

interface MediaWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlans: Perencanaan[];
  initialPlan?: Perencanaan | null;
  profile: TeacherProfile;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onMediaSaved?: (savedMedia: MediaRecord) => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const WIZARD_STEPS: { step: WizardStep; label: string; desc: string }[] = [
  { step: 1, label: 'Materi', desc: 'Sumber RPP / Topik' },
  { step: 2, label: 'Analisis', desc: 'Analisis Kebutuhan AI' },
  { step: 3, label: 'Pilih Media', desc: 'Rekomendasi & Kontrol' },
  { step: 4, label: 'Rancang', desc: 'Blueprint Lengkap' },
  { step: 5, label: 'Setujui', desc: 'Validasi Guru' },
  { step: 6, label: 'Produksi', desc: 'Generasi Konten AI' },
  { step: 7, label: 'Preview', desc: 'Live Studio & Revisi' },
  { step: 8, label: 'Final', desc: 'Simpan ke Library' },
];

export const MediaWizardModal: React.FC<MediaWizardModalProps> = ({
  isOpen,
  onClose,
  availablePlans,
  initialPlan,
  profile,
  onShowToast,
  onMediaSaved,
}) => {
  // Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Selected or Custom Plan Context
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return initialPlan?.id || (availablePlans.length > 0 ? availablePlans[0].id : '');
  });

  // Manual inputs if teacher creates from scratch or edits
  const [mapel, setMapel] = useState<string>(initialPlan?.identitas.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)');
  const [kelas, setKelas] = useState<string>(initialPlan?.identitas.kelas || profile.kelasAktif || 'VII-A');
  const [fase, setFase] = useState<string>(initialPlan?.identitas.fase || profile.fase || 'Fase D');
  const [topikMateri, setTopikMateri] = useState<string>(initialPlan?.identitas.topikMateri || '');
  const [subMateri, setSubMateri] = useState<string>(initialPlan?.tujuanPembelajaran.lingkupMateri || '');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState<string>(initialPlan?.tujuanPembelajaran.tujuanPembelajaran || '');
  const [alokasiWaktu, setAlokasiWaktu] = useState<string>(initialPlan?.identitas.alokasiWaktu || '2 x 40 menit');
  const [karakteristikPesertaDidik, setKarakteristikPesertaDidik] = useState<string>(
    initialPlan?.identifikasi.kebutuhanBelajar || initialPlan?.identifikasi.kesiapanAwal || 'Butuh visualisasi konkret dan penyelidikan terpandu'
  );
  const [modelMetode, setModelMetode] = useState<string>(initialPlan?.desainPembelajaran.modelMetode || 'Problem-Based Learning');
  const [selectedDimensi, setSelectedDimensi] = useState<string[]>(
    initialPlan?.identifikasi.dimensiProfilLulusan?.length
      ? initialPlan.identifikasi.dimensiProfilLulusan
      : ['Penalaran Kritis', 'Kolaborasi']
  );

  // Step 2: AI Analysis State
  const [analisisAI, setAnalisisAI] = useState<MediaAnalisisAI | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Step 3: Recommendations & Teacher Controls State
  const [recommendations, setRecommendations] = useState<MediaRekomendasiItem[]>([]);
  const [selectedRecId, setSelectedRecId] = useState<string>('');
  const [isGeneratingRecs, setIsGeneratingRecs] = useState<boolean>(false);

  const [kontrolGuru, setKontrolGuru] = useState<MediaKontrolGuru>({
    kategori: 'Visual',
    jenisMedia: 'Slide Presentasi (PPT)',
    gayaVisual: 'Ilustrasi Edukatif Modern Kontras Bersih',
    tingkatKompleksitas: 'Menengah / Standar',
    durasi: '10 – 15 Menit',
    bahasa: 'Bahasa Indonesia komunikatif & istilah saintifik ramah SMP',
    orientasiUkuran: 'Lanskap 16:9 (Proyektor Kelas)',
    sasaranPenggunaan: 'Klasikal dengan panduan interaktif',
    instruksiKhusus: '',
  });

  // Step 4 & 5: Media Rancangan State
  const [rancangan, setRancangan] = useState<MediaRancanganData | null>(null);
  const [isDesigning, setIsDesigning] = useState<boolean>(false);
  const [isEditingRancangan, setIsEditingRancangan] = useState<boolean>(false);
  const [editableRancangan, setEditableRancangan] = useState<MediaRancanganData | null>(null);

  // Step 6: Production State
  const [produkMedia, setProdukMedia] = useState<MediaProdukData | null>(null);
  const [isProducing, setIsProducing] = useState<boolean>(false);

  // Step 7: Preview, Revision & Live Studio State
  const [activeMediaRecord, setActiveMediaRecord] = useState<MediaRecord | null>(null);
  const [previewTab, setPreviewTab] = useState<'studio' | 'naskah' | 'storyboard' | 'prompt' | 'soal'>('studio');
  const [customRevisionInput, setCustomRevisionInput] = useState<string>('');
  const [isRevising, setIsRevising] = useState<boolean>(false);

  // General UI States
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Sync when initialPlan changes or selectedPlanId changes
  useEffect(() => {
    if (selectedPlanId) {
      const plan = availablePlans.find((p) => p.id === selectedPlanId);
      if (plan) {
        setMapel(plan.identitas.mataPelajaran || profile.mataPelajaran);
        setKelas(plan.identitas.kelas || profile.kelasAktif);
        setFase(plan.identitas.fase || profile.fase || 'Fase D');
        setTopikMateri(plan.identitas.topikMateri || plan.judul);
        setSubMateri(plan.tujuanPembelajaran.lingkupMateri || '');
        setTujuanPembelajaran(plan.tujuanPembelajaran.tujuanPembelajaran || '');
        setAlokasiWaktu(plan.identitas.alokasiWaktu || '2 x 40 menit');
        setKarakteristikPesertaDidik(
          plan.identifikasi.kebutuhanBelajar || plan.identifikasi.kesiapanAwal || 'Butuh visualisasi konkret dan penyelidikan terpandu'
        );
        setModelMetode(plan.desainPembelajaran.modelMetode || 'Problem-Based Learning');
        if (plan.identifikasi.dimensiProfilLulusan?.length) {
          setSelectedDimensi(plan.identifikasi.dimensiProfilLulusan);
        }
      }
    }
  }, [selectedPlanId, availablePlans, profile]);

  if (!isOpen) return null;

  // Build current context object
  const currentContext: MediaInputContext = {
    mapel,
    kelas,
    fase,
    topikMateri: topikMateri || 'Materi Pokok Pembelajaran',
    subMateri,
    tujuanPembelajaran: tujuanPembelajaran || 'Peserta didik memahami konsep secara bermakna.',
    alokasiWaktu,
    karakteristikPesertaDidik,
    modelMetode,
    dimensiProfilLulusan: selectedDimensi,
    rppId: selectedPlanId,
    rppJudul: availablePlans.find((p) => p.id === selectedPlanId)?.judul || topikMateri,
    namaGuru: profile.namaGuru,
  };

  // HANDLER: Step 1 -> Step 2 (Run AI Analysis)
  const handleStartAnalysis = async () => {
    if (!topikMateri.trim()) {
      onShowToast('error', 'Silakan tentukan Materi Pokok terlebih dahulu.');
      return;
    }
    setIsAnalyzing(true);
    setCurrentStep(2);
    onShowToast('info', 'AI sedang menganalisis materi dan menentukan kebutuhan media...');

    try {
      const res = await analyzeMateriNeeds(currentContext);
      setAnalisisAI(res);
      onShowToast('success', 'Analisis kebutuhan media berhasil diselesaikan!');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal menganalisis materi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // HANDLER: Step 2 -> Step 3 (Generate 5 Recommendations)
  const handleProceedToRecommendations = async () => {
    if (!analisisAI) return;
    setIsGeneratingRecs(true);
    setCurrentStep(3);
    onShowToast('info', 'Menyiapkan 5 rekomendasi media pedagogis terbaik...');

    try {
      const recs = await generateMediaRecommendations(currentContext, analisisAI);
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedRecId(recs[0].id);
        applyRecommendationToControls(recs[0]);
      }
      onShowToast('success', '5 Rekomendasi media siap dipilih guru.');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal memuat rekomendasi.');
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  // Apply a recommendation to the teacher's customizable controls
  const applyRecommendationToControls = (rec: MediaRekomendasiItem) => {
    setSelectedRecId(rec.id);
    setKontrolGuru((prev) => ({
      ...prev,
      kategori: rec.kategori,
      jenisMedia: rec.jenisMedia,
      durasi: rec.durasi,
    }));
  };

  // HANDLER: Step 3 -> Step 4 (Create Media Blueprint / Rancangan)
  const handleCreateBlueprint = async () => {
    const activeRec = recommendations.find((r) => r.id === selectedRecId) || recommendations[0];
    if (!activeRec) return;

    setIsDesigning(true);
    setCurrentStep(4);
    onShowToast('info', `AI sedang menyusun Rancangan Media (${kontrolGuru.jenisMedia})...`);

    try {
      const designRes = await createMediaRancangan(currentContext, activeRec, kontrolGuru);
      setRancangan(designRes);
      setEditableRancangan(JSON.parse(JSON.stringify(designRes)));
      onShowToast('success', 'Rancangan media berhasil disusun! Silakan periksa atau sesuaikan.');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal menyusun rancangan media.');
    } finally {
      setIsDesigning(false);
    }
  };

  // HANDLER: Step 4 [SETUJUI & BUAT MEDIA] -> Step 5 -> Step 6
  const handleApproveAndProduce = async () => {
    const finalRancangan = editableRancangan || rancangan;
    if (!finalRancangan) return;

    setIsProducing(true);
    setCurrentStep(6);
    onShowToast('info', 'Rancangan telah disetujui Guru! AI sedang memproduksi konten media...');

    try {
      const product = await produceMediaContent(finalRancangan, kontrolGuru, currentContext);
      setProdukMedia(product);

      // Create new MediaRecord with 'Diproduksi' status
      const now = new Date().toISOString();
      const newRecord: MediaRecord = {
        id: 'med-' + Date.now(),
        guru: profile.namaGuru,
        mataPelajaran: mapel,
        kelasFase: `${kelas} (${fase})`,
        rppId: selectedPlanId,
        rppJudul: currentContext.rppJudul || topikMateri,
        tujuanPembelajaran,
        materiPokok: topikMateri,
        subMateri,
        alokasiWaktu,
        karakteristikPesertaDidik,
        modelMetode,
        dimensiProfilLulusan: selectedDimensi,
        kategori: kontrolGuru.kategori,
        jenisMedia: kontrolGuru.jenisMedia,
        judul: finalRancangan.judul,
        rancangan: finalRancangan,
        produkMedia: product,
        versi: 'v1.0',
        status: 'Diproduksi',
        tanggal: now.split('T')[0],
        kontrolGuru,
        analisisAI: analisisAI || undefined,
        rekomendasiList: recommendations,
        riwayatRevisi: [],
        createdAt: now,
        updatedAt: now,
      };

      setActiveMediaRecord(newRecord);
      saveMediaRecord(newRecord);
      setCurrentStep(7);
      onShowToast('success', 'Media berhasil diproduksi & siap dimainkan di Live Studio!');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal memproduksi konten media.');
    } finally {
      setIsProducing(false);
    }
  };

  // HANDLER: Step 7 AI Quick Revision
  const handleQuickRevision = async (perintah: string) => {
    if (!activeMediaRecord) return;
    setIsRevising(true);
    onShowToast('info', `AI sedang merevisi media: "${perintah}"...`);

    try {
      const revised = await reviseMediaWithAI(activeMediaRecord, perintah);
      setActiveMediaRecord(revised);
      saveMediaRecord(revised);
      onShowToast('success', `Media berhasil direvisi (${revised.versi})!`);
      setCustomRevisionInput('');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Gagal merevisi media.');
    } finally {
      setIsRevising(false);
    }
  };

  // HANDLER: Step 7 -> Step 8 (Mark Final & Save to Library)
  const handleMarkAsFinal = () => {
    if (!activeMediaRecord) return;
    const finalRecord: MediaRecord = {
      ...activeMediaRecord,
      status: 'Final',
      updatedAt: new Date().toISOString(),
    };
    setActiveMediaRecord(finalRecord);
    saveMediaRecord(finalRecord);
    if (onMediaSaved) {
      onMediaSaved(finalRecord);
    }
    setCurrentStep(8);
    onShowToast('success', 'Media Pembelajaran resmi ditandai FINAL dan tersimpan di Library Media!');
  };

  // Copy handler
  const handleCopyMarkdown = () => {
    if (activeMediaRecord?.produkMedia?.markdownLengkap) {
      navigator.clipboard.writeText(activeMediaRecord.produkMedia.markdownLengkap);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onShowToast('success', 'Naskah media berhasil disalin ke clipboard!');
    }
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    onShowToast('info', 'Menyiapkan berkas PDF Media Pembelajaran...');
    const filename = `Media_${(activeMediaRecord?.judul || 'Pembelajaran').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const success = await downloadElementAsPDF('dokumen-media-wizard-export', filename, {
      title: activeMediaRecord?.judul,
    });
    setIsExportingPDF(false);
    if (success) {
      onShowToast('success', 'Berkas PDF berhasil diunduh!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  AI Media Pembelajaran
                </span>
                <span className="text-[10px] text-indigo-200">
                  Kurikulum Merdeka & Deep Learning
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                Studio Pembuat Media dari RPP / Materi
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tutup Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar (8 Tahap Resmi) */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 sm:px-6 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[700px] text-xs">
            {WIZARD_STEPS.map((s, idx) => {
              const isPast = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center space-x-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-3 ring-indigo-200 shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <div className="leading-tight">
                      <p
                        className={`text-[11px] font-semibold whitespace-nowrap ${
                          isCurrent ? 'text-indigo-900' : isPast ? 'text-emerald-800' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[9px] text-slate-400 hidden sm:block whitespace-nowrap">{s.desc}</p>
                    </div>
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 mx-2 flex-1 transition-colors ${
                        isPast ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body Content by Current Step */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* STEP 1: MATERI */}
          {currentStep === 1 && (
            <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3">
                <Sparkle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong className="font-bold text-indigo-950">Tahap 1: Pembacaan Dokumen RPP / Materi</strong>
                  <p className="mt-1">
                    Pilih modul ajar yang sudah tersimpan atau masukkan rincian topik pembelajaran. AI akan secara otomatis
                    mengekstrak mata pelajaran, kelas/fase, tujuan pembelajaran, karakteristik murid, dan alokasi waktu untuk dianalisis.
                  </p>
                </div>
              </div>

              {/* RPP Selector */}
              {availablePlans.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih RPP / Modul Ajar Tersedia (Otomatis Baca Data):
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Buat Dari Materi Bebas / Ketik Sendiri --</option>
                    {availablePlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.judul} • Kelas {p.identitas.kelas} ({p.identitas.mataPelajaran})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Grid */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Komponen Pembelajaran yang Diambil
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={mapel}
                      onChange={(e) => setMapel(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kelas</label>
                    <input
                      type="text"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fase</label>
                    <input
                      type="text"
                      value={fase}
                      onChange={(e) => setFase(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Materi Pokok <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={topikMateri}
                      onChange={(e) => setTopikMateri(e.target.value)}
                      placeholder="Contoh: Klasifikasi Makhluk Hidup"
                      className="w-full text-xs p-2.5 rounded-lg border border-indigo-300 bg-indigo-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Submateri (Opsional)</label>
                    <input
                      type="text"
                      value={subMateri}
                      onChange={(e) => setSubMateri(e.target.value)}
                      placeholder="Contoh: Kunci Determinasi Sederhana"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tujuan Pembelajaran (TP) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={tujuanPembelajaran}
                    onChange={(e) => setTujuanPembelajaran(e.target.value)}
                    placeholder="Contoh: Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkannya melalui kunci determinasi..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Karakteristik Murid</label>
                    <input
                      type="text"
                      value={karakteristikPesertaDidik}
                      onChange={(e) => setKarakteristikPesertaDidik(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Model / Metode</label>
                    <input
                      type="text"
                      value={modelMetode}
                      onChange={(e) => setModelMetode(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 8 Dimensi Profil Lulusan Badges */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Dimensi Profil Lulusan yang Dikuatkan (8 Dimensi):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAFTAR_DIMENSI_PROFIL_LULUSAN.map((dim) => {
                      const isSelected = selectedDimensi.includes(dim.nama);
                      return (
                        <button
                          key={dim.id}
                          type="button"
                          onClick={() => {
                            setSelectedDimensi((prev) =>
                              isSelected ? prev.filter((d) => d !== dim.nama) : [...prev, dim.nama]
                            );
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {dim.nomor}. {dim.nama}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={!topikMateri.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02]"
                >
                  <span>Mulai Analisis AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANALISIS AI */}
          {currentStep === 2 && (
            <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tahap 2: Hasil Analisis AI Kebutuhan Media</h3>
                  <p className="text-xs text-slate-500">
                    Berdasarkan materi "{topikMateri}" dan profil peserta didik Kelas {kelas}.
                  </p>
                </div>
                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Analisis Ulang</span>
                </button>
              </div>

              {isAnalyzing || !analisisAI ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">AI Sedang Menganalisis Karakteristik Materi...</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Mengevaluasi tingkat abstraksi, kebutuhan visualisasi grafis, audio, demonstrasi gerak, dan interaktivitas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Abstraction Level Highlight */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tingkat Abstraksi Materi
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {analisisAI.tingkatAbstraksi}
                      </h4>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                        analisisAI.tingkatAbstraksi.includes('Tinggi')
                          ? 'bg-rose-100 text-rose-800'
                          : analisisAI.tingkatAbstraksi.includes('Sedang')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {analisisAI.tingkatAbstraksi}
                    </span>
                  </div>

                  {/* 4 Pillars Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs mb-1.5">
                        <Layers className="w-4 h-4" />
                        <span>Kebutuhan Visualisasi</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {analisisAI.kebutuhanVisualisasi}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs mb-1.5">
                        <Volume2 className="w-4 h-4" />
                        <span>Kebutuhan Audio & Narasi</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {analisisAI.kebutuhanAudio}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs mb-1.5">
                        <Video className="w-4 h-4" />
                        <span>Kebutuhan Demonstrasi Gerak</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {analisisAI.kebutuhanDemonstrasi}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs mb-1.5">
                        <Gamepad2 className="w-4 h-4" />
                        <span>Kebutuhan Interaktivitas</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {analisisAI.kebutuhanInteraktivitas}
                      </p>
                    </div>
                  </div>

                  {/* Cognitive Load & Strategy */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Manajemen Beban Kognitif (Cognitive Load Theory)</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {analisisAI.analisisBebanKognitif}
                    </p>
                    <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 font-medium">
                      <strong>Strategi Utama:</strong> {analisisAI.rekomendasiStrategi}
                    </div>
                  </div>

                  {/* Nav Buttons */}
                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Materi</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedToRecommendations}
                      disabled={isAnalyzing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02]"
                    >
                      <span>Lihat Rekomendasi Media</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PILIH MEDIA & KONTROL GURU */}
          {currentStep === 3 && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tahap 3: Rekomendasi AI & Kontrol Penuh Guru</h3>
                <p className="text-xs text-slate-500">
                  AI menyajikan maksimal 5 rekomendasi. Guru berhak memilih, menyesuaikan gaya visual, durasi, dan preferensi lainnya.
                </p>
              </div>

              {isGeneratingRecs ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
                  <h4 className="text-sm font-bold text-slate-700">Merumuskan 5 Rekomendasi Media Terpilih...</h4>
                </div>
              ) : (
                <>
                  {/* 5 Recommendation Cards */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pilihan Rekomendasi Media AI (Maksimal 5 Pilihan):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recommendations.map((rec, idx) => {
                        const isSelected = selectedRecId === rec.id;
                        return (
                          <div
                            key={rec.id}
                            onClick={() => applyRecommendationToControls(rec)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-200'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                  #{idx + 1} {rec.kategori}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {rec.durasi}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                                {rec.namaMedia}
                              </h4>

                              <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                                {rec.tujuan}
                              </p>

                              <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-100 mb-2">
                                <span className="font-semibold text-slate-800">Alasan Kesesuaian:</span> {rec.alasanKesesuaian}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Interaktivitas: <strong className="text-slate-800">{rec.tingkatInteraktivitas}</strong></span>
                              <span className="font-semibold text-indigo-600">{isSelected ? '✓ Terpilih' : 'Klik untuk Pilih'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guru Controls Section */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Kontrol Guru (Personalisasi Parameter Media)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori Media</label>
                        <select
                          value={kontrolGuru.kategori}
                          onChange={(e) => {
                            const cat = e.target.value as KategoriMediaUtama;
                            setKontrolGuru((prev) => ({
                              ...prev,
                              kategori: cat,
                              jenisMedia: cat === 'Visual' ? 'Slide Presentasi (PPT)' : cat === 'Audio' ? 'Podcast Edukasi' : cat === 'Audiovisual' ? 'Video Pembelajaran' : 'Kuis Gamifikasi',
                            }));
                          }}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Visual">Visual</option>
                          <option value="Audio">Audio</option>
                          <option value="Audiovisual">Audio Visual</option>
                          <option value="Interaktif">Interaktif</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Format Spesifik</label>
                        <input
                          type="text"
                          value={kontrolGuru.jenisMedia}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, jenisMedia: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tingkat Kompleksitas</label>
                        <select
                          value={kontrolGuru.tingkatKompleksitas}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, tingkatKompleksitas: e.target.value as any })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Dasar / Pemula">Dasar / Pemula</option>
                          <option value="Menengah / Standar">Menengah / Standar</option>
                          <option value="Mahir / HOTS Mendalam">Mahir / HOTS Mendalam</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Durasi / Panjang</label>
                        <input
                          type="text"
                          value={kontrolGuru.durasi}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, durasi: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gaya Visual</label>
                        <select
                          value={kontrolGuru.gayaVisual}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, gayaVisual: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Modern Minimalis Bersih">Modern Minimalis Bersih</option>
                          <option value="Ilustrasi Edukatif Kontras Tinggi">Ilustrasi Edukatif Kontras Tinggi</option>
                          <option value="Fotografi Realistis Kontekstual">Fotografi Realistis Kontekstual</option>
                          <option value="Komik Ceria & Menyenangkan">Komik Ceria & Menyenangkan</option>
                          <option value="Infografis Flat Sains">Infografis Flat Sains</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Orientasi & Ukuran</label>
                        <select
                          value={kontrolGuru.orientasiUkuran}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, orientasiUkuran: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Lanskap 16:9 (Proyektor Kelas)">Lanskap 16:9 (Proyektor Kelas)</option>
                          <option value="Potret 9:16 (HP / Poster A4)">Potret 9:16 (HP / Poster A4)</option>
                          <option value="Universal Flex">Universal Flex</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sasaran Penggunaan</label>
                        <select
                          value={kontrolGuru.sasaranPenggunaan}
                          onChange={(e) => setKontrolGuru({ ...kontrolGuru, sasaranPenggunaan: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Klasikal dengan panduan interaktif">Klasikal di Layar Proyektor</option>
                          <option value="Kerja Kelompok Kolaboratif">Kerja Kelompok Kolaboratif</option>
                          <option value="Penugasan Mandiri di Rumah">Penugasan Mandiri di Rumah</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Instruksi Khusus Guru (Catatan Tambahan)
                      </label>
                      <input
                        type="text"
                        value={kontrolGuru.instruksiKhusus}
                        onChange={(e) => setKontrolGuru({ ...kontrolGuru, instruksiKhusus: e.target.value })}
                        placeholder="Contoh: Tekankan pada contoh lokal di Indonesia, gunakan bahasa santai namun baku..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Nav Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Analisis</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateBlueprint}
                      disabled={isDesigning}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02]"
                    >
                      <span>Buat Rancangan Media</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4 & 5: RANCANG & PERSETUJUAN GURU */}
          {(currentStep === 4 || currentStep === 5) && (
            <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <strong className="font-bold">Prinsip Mutlak AI Media Pembelajaran:</strong>
                  <p className="mt-0.5">
                    AI <strong>tidak boleh langsung membuat media</strong> sebelum membuat rancangan dan mendapatkan
                    persetujuan guru. Silakan periksa struktur, narasi, aktivitas, dan storyboard berikut.
                  </p>
                </div>
              </div>

              {isDesigning || !rancangan ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
                  <h4 className="text-sm font-bold text-slate-700">Menyusun Cetak Biru (Rancangan) Media...</h4>
                  <p className="text-xs text-slate-400">Menata struktur urutan isi, naskah narasi, visual, dan evaluasi.</p>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        RANCANGAN {kontrolGuru.kategori}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                        {editableRancangan?.judul || rancangan.judul}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingRancangan(!isEditingRancangan)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isEditingRancangan ? 'Selesai Edit' : 'Edit Rancangan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Core Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-700 block mb-1">Tujuan Pembelajaran:</strong>
                      <p className="text-slate-600">{rancangan.tujuanPembelajaran}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-700 block mb-1">Materi & Sasaran:</strong>
                      <p className="text-slate-600">
                        {rancangan.materi} • {rancangan.sasaranPesertaDidik}
                      </p>
                    </div>
                  </div>

                  {/* Urutan Isi */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Urutan Struktur Isi Media:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(editableRancangan?.urutanIsi || rancangan.urutanIsi).map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual, Narasi & Interaksi */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-indigo-900 block mb-1">Panduan Visual:</strong>
                      <p className="text-slate-600 leading-relaxed">{rancangan.visual}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-indigo-900 block mb-1">Gaya Narasi:</strong>
                      <p className="text-slate-600 leading-relaxed">{rancangan.narasi}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-indigo-900 block mb-1">Aktivitas Peserta Didik:</strong>
                      <p className="text-slate-600 leading-relaxed">{rancangan.aktivitasInteraksi}</p>
                    </div>
                  </div>

                  {/* Storyboard Video Table (8 Kolom Resmi) */}
                  {rancangan.storyboard && rancangan.storyboard.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Film className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Tabel Storyboard 8 Kolom Resmi:
                        </h4>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <tr>
                              <th className="p-2 border-r border-slate-200 text-center w-10">No</th>
                              <th className="p-2 border-r border-slate-200 w-24">Durasi</th>
                              <th className="p-2 border-r border-slate-200 w-28">Adegan</th>
                              <th className="p-2 border-r border-slate-200">Visual</th>
                              <th className="p-2 border-r border-slate-200">Narasi</th>
                              <th className="p-2 border-r border-slate-200 w-28">Teks Layar</th>
                              <th className="p-2 border-r border-slate-200 w-24">Audio</th>
                              <th className="p-2 w-28">Interaksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rancangan.storyboard.map((row) => (
                              <tr key={row.no} className="border-b last:border-b-0 border-slate-200 hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">{row.no}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-600 font-mono text-[10px]">{row.durasi}</td>
                                <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{row.adegan}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-600">{row.visual}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-600 italic">"{row.narasi}"</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700 font-semibold text-[10px]">{row.teksLayar}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-500 text-[10px]">{row.audio}</td>
                                <td className="p-2 text-indigo-700 font-medium text-[10px]">{row.interaksi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pertanyaan Pemantik & Evaluasi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-900 block mb-1">Pertanyaan Pemantik:</strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {rancangan.pertanyaanPemantik.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                      <strong className="text-emerald-900 block mb-1">Rencana Evaluasi Formatif:</strong>
                      <p className="text-slate-700 leading-relaxed">{rancangan.evaluasi}</p>
                    </div>
                  </div>

                  {/* Wajib 3 Tombol Sesuai Perintah User: [EDIT RANCANGAN] [GANTI MEDIA] [SETUJUI & BUAT MEDIA] */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                      >
                        [GANTI MEDIA]
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingRancangan(!isEditingRancangan)}
                        className="px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-semibold flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>[EDIT RANCANGAN]</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleApproveAndProduce}
                      disabled={isProducing}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>[SETUJUI & BUAT MEDIA]</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PRODUKSI MEDIA */}
          {currentStep === 6 && (
            <div className="max-w-xl mx-auto py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                AI Sedang Memproduksi Konten Media Pembelajaran...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Menghasilkan naskah audio terperinci, desain tata visual slide PPT, prompt gambar AI resolusi tinggi,
                soal asesmen formatif, serta materi siap digunakan.
              </p>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* STEP 7: PREVIEW & REVISI DENGAN AI */}
          {currentStep === 7 && activeMediaRecord && (
            <div className="space-y-4 animate-fadeIn">
              {/* Toolbar & Status Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Play className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Status: {activeMediaRecord.status}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                        Versi: {activeMediaRecord.versi}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                      {activeMediaRecord.judul}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    title="Salin Naskah & Konten Lengkap"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin Naskah'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={isExportingPDF}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    title="Unduh Naskah Media PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={handleMarkAsFinal}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Tandai Final & Simpan ke Library</span>
                  </button>
                </div>
              </div>

              {/* Subtabs for Preview Content */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setPreviewTab('studio')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    previewTab === 'studio'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Media Live Studio (Player Interaktif)</span>
                </button>

                <button
                  onClick={() => setPreviewTab('naskah')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    previewTab === 'naskah'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Naskah & Panduan Lengkap</span>
                </button>

                <button
                  onClick={() => setPreviewTab('prompt')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    previewTab === 'prompt'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prompt Generator AI</span>
                </button>

                <button
                  onClick={() => setPreviewTab('soal')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    previewTab === 'soal'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Soal HOTS & Feedback</span>
                </button>
              </div>

              {/* Main Preview Area */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                {previewTab === 'studio' && (
                  <div className="p-3 sm:p-5">
                    {/* Convert MediaRecord to MediaPembelajaranItem for MediaLiveStudio compatibility */}
                    <MediaLiveStudio
                      media={{
                        id: activeMediaRecord.id,
                        kategori: activeMediaRecord.kategori === 'Interaktif' ? 'Multimedia-Interaktif' : activeMediaRecord.kategori,
                        jenisSpesifik: activeMediaRecord.jenisMedia,
                        namaMedia: activeMediaRecord.judul,
                        alatBahanAplikasi: activeMediaRecord.kontrolGuru?.gayaVisual || 'Media Live Studio',
                        deskripsiRingkas: activeMediaRecord.rancangan.tujuanPembelajaran,
                        keselarasan: {
                          materiPokok: activeMediaRecord.materiPokok,
                          tujuanPembelajaran: activeMediaRecord.tujuanPembelajaran,
                          indikatorKetercapaian: 'Peserta didik memahami konsep secara bermakna.',
                          pengalamanBelajar: {
                            tahap: 'Memahami',
                            deskripsiPeran: activeMediaRecord.rancangan.aktivitasInteraksi,
                          },
                          prinsipDeepLearning: {
                            berkesadaran: 'Memusatkan perhatian sadar pada materi.',
                            bermakna: 'Menghubungkan konsep dengan konteks nyata.',
                            menggembirakan: 'Interaksi aktif dan apresiasi kemajuan belajar.',
                          },
                        },
                        naskahRancanganLengkap: activeMediaRecord.produkMedia?.markdownLengkap || '',
                        slidesPPT: activeMediaRecord.produkMedia?.slidesPPT,
                        createdAt: activeMediaRecord.createdAt,
                        updatedAt: activeMediaRecord.updatedAt,
                      }}
                      mapel={activeMediaRecord.mataPelajaran}
                      kelas={activeMediaRecord.kelasFase}
                      topik={activeMediaRecord.materiPokok}
                      tujuanPembelajaran={activeMediaRecord.tujuanPembelajaran}
                      onBackToScript={() => setPreviewTab('naskah')}
                      onShowToast={onShowToast}
                    />
                  </div>
                )}

                {previewTab === 'naskah' && (
                  <div id="dokumen-media-wizard-export" className="p-6 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    <div className="border-b-2 border-indigo-600 pb-3 mb-4">
                      <h2 className="text-base font-bold text-slate-900">{activeMediaRecord.judul}</h2>
                      <p className="text-xs text-slate-500">
                        {activeMediaRecord.mataPelajaran} • {activeMediaRecord.kelasFase} • Modul: {activeMediaRecord.rppJudul}
                      </p>
                    </div>
                    {activeMediaRecord.produkMedia?.markdownLengkap || 'Belum ada konten naskah lengkap.'}
                  </div>
                )}

                {previewTab === 'prompt' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Prompt Generator Gambar AI (Canva / Midjourney / DALL-E)</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Gunakan prompt siap pakai berikut di Canva Magic Media, Leonardo, atau Midjourney untuk menghasilkan visual berkualitas tinggi:
                    </p>
                    <div className="space-y-3">
                      {(activeMediaRecord.produkMedia?.promptGambar || []).map((prompt, pIdx) => (
                        <div key={pIdx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                          <code className="text-[11px] text-slate-800 font-mono leading-relaxed select-all">
                            {prompt}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(prompt);
                              onShowToast('success', 'Prompt disalin ke clipboard!');
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded shrink-0"
                            title="Salin Prompt"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewTab === 'soal' && (
                  <div className="p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Butir Soal Formatif Interaktif (HOTS) & Umpan Balik
                    </h4>
                    <div className="space-y-3">
                      {(activeMediaRecord.produkMedia?.soalDanFeedback || []).map((q) => (
                        <div key={q.nomor} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Misi #{q.nomor}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                              Kunci: [{q.kunci}]
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium">{q.soal}</p>
                          <ul className="space-y-1 text-slate-600 pl-2">
                            {q.opsi.map((op, oIdx) => (
                              <li key={oIdx}>{op}</li>
                            ))}
                          </ul>
                          <div className="p-2 bg-indigo-50/70 rounded-lg text-indigo-900 text-[11px] border border-indigo-100">
                            <strong>Pembahasan Pedagogis:</strong> {q.pembahasan}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PANEL REVISI DENGAN AI (Perintah Standar & Custom Guru) */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-5 rounded-xl border border-indigo-200 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Revisi Cepat dengan AI (Asisten Perbaikan Guru)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ketik perintah perbaikan atau klik salah satu instruksi cepat di bawah ini. AI akan memperbarui konten media
                  dengan tetap menjaga keselarasan Tujuan Pembelajaran.
                </p>

                {/* Perintah Standar Cepat sesuai permintaan User */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Buat lebih sederhana.',
                    'Tambahkan contoh.',
                    'Kurangi teks.',
                    'Tambahkan ilustrasi.',
                    'Buat untuk kelas 7.',
                    'Buat versi 5 menit.',
                    'Tambahkan kuis.',
                    'Ubah menjadi infografis.',
                    'Ubah menjadi video.',
                    'Ubah menjadi media interaktif.',
                  ].map((cmd, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      disabled={isRevising}
                      onClick={() => handleQuickRevision(cmd)}
                      className="text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-indigo-200 rounded-lg transition-all shadow-2xs font-medium"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* Custom Revision Input */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={customRevisionInput}
                    onChange={(e) => setCustomRevisionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customRevisionInput.trim() && !isRevising) {
                        handleQuickRevision(customRevisionInput.trim());
                      }
                    }}
                    placeholder="Instruksi revisi bebas... (misal: 'Tambahkan studi kasus flora endemik Sumatera')"
                    className="flex-1 text-xs py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    disabled={!customRevisionInput.trim() || isRevising}
                    onClick={() => handleQuickRevision(customRevisionInput.trim())}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Revisi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: FINAL */}
          {currentStep === 8 && activeMediaRecord && (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Status: FINAL & DISIMPAN
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Media Pembelajaran Berhasil Disimpan ke Library!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Media telah terhubung dengan Modul Ajar "<strong>{activeMediaRecord.rppJudul}</strong>" dan tersimpan
                  pada Library Media Pembelajaran untuk digunakan kapan saja di kelas.
                </p>
              </div>

              {/* Media Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 shadow-2xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Judul Media:</span>
                  <strong className="text-slate-900">{activeMediaRecord.judul}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-indigo-700">{activeMediaRecord.kategori} • {activeMediaRecord.jenisMedia}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Versi & Tanggal:</span>
                  <span className="font-mono text-slate-700">{activeMediaRecord.versi} • {activeMediaRecord.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guru Pengampu:</span>
                  <span className="text-slate-800">{activeMediaRecord.guru}</span>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Buka Live Studio</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen PDF</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
