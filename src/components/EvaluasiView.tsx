import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  FileCheck2,
  TrendingUp,
  HeartHandshake,
  Sparkles,
  Plus,
  Save,
  Search,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Printer,
  ChevronRight,
  Filter,
  Wand2,
  Loader2,
  BrainCircuit,
  MessageSquareQuote,
  FileText,
  ClipboardCheck,
  FolderGit2,
  Layers,
  UserCheck,
  HelpCircle,
  Eye,
  Clock,
  Sliders,
  Check,
  BarChart3,
} from 'lucide-react';
import {
  RencanaAsesmenItem,
  NilaiSiswa,
  PesertaDidik,
  TindakLanjutData,
  RefleksiEvaluasiData,
  TeacherProfile,
} from '../types';
import {
  generateRubrikAsesmenWithAI,
  generateBatchStudentFeedbackWithAI,
  generateTindakLanjutWithAI,
  generateRefleksiEvaluasiWithAI,
  generateNaskahAsesmenWithAI,
  generateCuratedNaskahAsesmen,
  normalizeBentukAsesmen,
} from '../services/aiService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { NaskahAsesmenModal } from './NaskahAsesmenModal';
import { EvaluasiVisualisasiNilai } from './EvaluasiVisualisasiNilai';

interface EvaluasiViewProps {
  asesmenList: RencanaAsesmenItem[];
  nilaiList: NilaiSiswa[];
  siswaList: PesertaDidik[];
  tindakLanjutList: TindakLanjutData[];
  refleksiList: RefleksiEvaluasiData[];
  profile: TeacherProfile;
  onSaveAsesmen: (item: RencanaAsesmenItem) => void;
  onDeleteAsesmen: (id: string) => void;
  onSaveNilaiBatch: (items: NilaiSiswa[]) => void;
  onSaveTindakLanjut: (item: TindakLanjutData) => void;
  onSaveRefleksi: (item: RefleksiEvaluasiData) => void;
  onAddSiswa: (siswa: PesertaDidik) => void;
  onOpenAIWithTopic?: (topik: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type EvaluasiSubTab = 'rencana' | 'input' | 'analisis' | 'tindak_lanjut' | 'refleksi';

export const EvaluasiView: React.FC<EvaluasiViewProps> = ({
  asesmenList,
  nilaiList,
  siswaList,
  tindakLanjutList,
  refleksiList,
  profile,
  onSaveAsesmen,
  onDeleteAsesmen,
  onSaveNilaiBatch,
  onSaveTindakLanjut,
  onSaveRefleksi,
  onAddSiswa,
  onOpenAIWithTopic,
  onShowToast,
}) => {
  const [subTab, setSubTab] = useState<EvaluasiSubTab>('rencana');
  const [selectedKelas, setSelectedKelas] = useState(profile.kelasAktif || 'VII-A');
  const [selectedAsesmenId, setSelectedAsesmenId] = useState<string>(
    asesmenList[0]?.id || ''
  );

  // Form states for Rencana Asesmen
  const [isAsesmenModalOpen, setIsAsesmenModalOpen] = useState(false);
  const [editingAsesmen, setEditingAsesmen] = useState<RencanaAsesmenItem | null>(null);

  // Input Nilai working state
  const [editableGrades, setEditableGrades] = useState<{ [siswaId: string]: { nilai: number; catatan: string } }>({});
  const [kktpThreshold, setKktpThreshold] = useState<number>(profile.kktpDefault || 75);

  // Add new student state
  const [isAddSiswaOpen, setIsAddSiswaOpen] = useState(false);
  const [newNamaSiswa, setNewNamaSiswa] = useState('');
  const [newNisSiswa, setNewNisSiswa] = useState('');

  // Naskah Asesmen modal and form state
  const [selectedNaskahItem, setSelectedNaskahItem] = useState<RencanaAsesmenItem | null>(null);
  const [isNaskahModalOpen, setIsNaskahModalOpen] = useState(false);
  const [isGeneratingNaskahInForm, setIsGeneratingNaskahInForm] = useState(false);
  const [showNaskahEditorInForm, setShowNaskahEditorInForm] = useState(false);

  // AI Assistant states for Evaluasi
  const [isGeneratingRubrikAI, setIsGeneratingRubrikAI] = useState(false);
  const [isGeneratingFeedbackAI, setIsGeneratingFeedbackAI] = useState(false);
  const [isGeneratingTLAI, setIsGeneratingTLAI] = useState(false);
  const [isGeneratingRefleksiAI, setIsGeneratingRefleksiAI] = useState(false);
  const [classDiagnosis, setClassDiagnosis] = useState<string | null>(null);
  const [isDiagnosingClass, setIsDiagnosingClass] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleDownloadEvaluasiPDF = async (
    targetId: string,
    filename: string,
    title?: string
  ) => {
    setExportingId(targetId);
    onShowToast('info', 'Sedang memproses berkas PDF Dokumen Evaluasi...');
    const success = await downloadElementAsPDF(targetId, filename, { title });
    setExportingId(null);
    if (success) {
      onShowToast('success', 'Berkas PDF Dokumen Evaluasi berhasil diunduh!');
    } else {
      onShowToast('info', 'Membuka dialog cetak untuk simpan sebagai PDF.');
    }
  };

  // Active Asesmen
  const activeAsesmen = asesmenList.find((a) => a.id === selectedAsesmenId) || asesmenList[0];

  // Students for selected class
  const classStudents = useMemo(() => {
    return siswaList.filter((s) => !s.kelas || s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Synchronize working grades when active asesmen or class changes
  React.useEffect(() => {
    if (!activeAsesmen) return;
    const map: { [siswaId: string]: { nilai: number; catatan: string } } = {};
    classStudents.forEach((s) => {
      const existing = nilaiList.find(
        (n) => n.asesmenId === activeAsesmen.id && n.siswaId === s.id
      );
      map[s.id] = {
        nilai: existing ? existing.nilaiAngka : 75,
        catatan: existing ? existing.catatanDeskripsi : 'Menunjukkan capaian yang baik.',
      };
    });
    setEditableGrades(map);
  }, [activeAsesmen?.id, selectedKelas, classStudents, nilaiList]);

  // Calculations for Analisis
  const stats = useMemo(() => {
    if (!activeAsesmen || classStudents.length === 0) {
      return { total: 0, tuntas: 0, belumTuntas: 0, rataRata: 0, tertinggi: 0, terendah: 0, persentase: 0 };
    }
    const scores = classStudents.map((s) => editableGrades[s.id]?.nilai ?? 75);
    const total = scores.length;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const rataRata = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    const tuntas = scores.filter((val) => val >= kktpThreshold).length;
    const belumTuntas = total - tuntas;
    const tertinggi = total > 0 ? Math.max(...scores) : 0;
    const terendah = total > 0 ? Math.min(...scores) : 0;
    const persentase = total > 0 ? Math.round((tuntas / total) * 100) : 0;

    return { total, tuntas, belumTuntas, rataRata, tertinggi, terendah, persentase };
  }, [editableGrades, classStudents, activeAsesmen, kktpThreshold]);

  // Handle Save All Grades
  const handleSaveGrades = () => {
    if (!activeAsesmen) return;
    const now = new Date().toISOString();
    const batch: NilaiSiswa[] = classStudents.map((s) => {
      const gradeInfo = editableGrades[s.id] || { nilai: 75, catatan: '' };
      return {
        id: `nilai-${activeAsesmen.id}-${s.id}`,
        asesmenId: activeAsesmen.id,
        siswaId: s.id,
        namaSiswa: s.nama,
        nisn: s.nisn,
        kelas: selectedKelas,
        nilaiAngka: gradeInfo.nilai,
        catatanDeskripsi: gradeInfo.catatan,
        statusKetercapaian: gradeInfo.nilai >= kktpThreshold ? 'Tercapai' : 'Belum Tercapai',
        updatedAt: now,
      };
    });

    onSaveNilaiBatch(batch);
    onShowToast('success', `Berhasil menyimpan nilai untuk ${batch.length} peserta didik`);
  };

  // Quick Add Student
  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNamaSiswa.trim()) return;
    const newStudent: PesertaDidik = {
      id: 'siswa-' + Date.now(),
      nama: newNamaSiswa.trim(),
      nisn: newNisSiswa.trim() || '00' + Math.floor(10000000 + Math.random() * 90000000),
      kelas: selectedKelas,
    };
    onAddSiswa(newStudent);
    setNewNamaSiswa('');
    setNewNisSiswa('');
    setIsAddSiswaOpen(false);
    onShowToast('success', `Siswa ${newStudent.nama} berhasil ditambahkan ke kelas ${selectedKelas}`);
  };

  // CSV Importer for Students
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      let count = 0;
      lines.slice(1).forEach((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts[0]) {
          onAddSiswa({
            id: 'siswa-' + Date.now() + '-' + count,
            nama: parts[0],
            nisn: parts[1] || '00' + Math.floor(10000000 + Math.random() * 90000000),
            kelas: parts[2] || selectedKelas,
          });
          count++;
        }
      });
      onShowToast('success', `Berhasil mengimpor ${count} siswa dari CSV`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // AI Handler 1: Generate Rubrik & KKTP
  const handleGenerateRubrikAI = async () => {
    if (!editingAsesmen) return;
    const topic = (editingAsesmen.judulAsesmen || '').trim() || 'Asesmen Pembelajaran SMP';
    setIsGeneratingRubrikAI(true);
    try {
      const rubrik = await generateRubrikAsesmenWithAI({
        mapel: profile.mataPelajaran || 'IPA',
        kelas: selectedKelas,
        topik: topic,
        jenisAsesmen: editingAsesmen.jenisAsesmen,
        kktp: kktpThreshold,
      });

      setEditingAsesmen({
        ...editingAsesmen,
        tujuanPembelajaran: rubrik.tujuanPembelajaran || editingAsesmen.tujuanPembelajaran,
        teknikAsesmen: rubrik.teknikAsesmen || editingAsesmen.teknikAsesmen,
        instrumenAsesmen: rubrik.instrumenAsesmen || editingAsesmen.instrumenAsesmen,
        kriteriaKetercapaian: {
          baruBerkembang: rubrik.kriteriaKetercapaian?.baruBerkembang || editingAsesmen.kriteriaKetercapaian.baruBerkembang,
          layak: rubrik.kriteriaKetercapaian?.layak || editingAsesmen.kriteriaKetercapaian.layak,
          cakap: rubrik.kriteriaKetercapaian?.cakap || editingAsesmen.kriteriaKetercapaian.cakap,
          mahir: rubrik.kriteriaKetercapaian?.mahir || editingAsesmen.kriteriaKetercapaian.mahir,
        },
      });
      onShowToast('success', 'Rubrik & Kriteria KKTP berhasil dirumuskan AI!');
    } catch (e) {
      onShowToast('error', 'Gagal merumuskan rubrik AI');
    } finally {
      setIsGeneratingRubrikAI(false);
    }
  };

  // AI Handler 1B: Generate Naskah Asesmen sesuai Bentuk Pilihan Guru
  const handleGenerateNaskahInForm = async (customInstruction?: string) => {
    if (!editingAsesmen) return;
    setIsGeneratingNaskahInForm(true);
    const bentuk = editingAsesmen.bentukAsesmen || 'Kinerja';
    const topic = (editingAsesmen.topikMateri || editingAsesmen.judulAsesmen || '').trim() || 'Materi Pembelajaran';
    onShowToast('info', `AI sedang menyusun naskah instrumen asesmen (${bentuk})...`);

    try {
      const generatedNaskah = await generateNaskahAsesmenWithAI({
        mapel: editingAsesmen.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
        kelas: editingAsesmen.kelas || selectedKelas,
        topik: topic,
        judulAsesmen: editingAsesmen.judulAsesmen,
        bentukAsesmen: bentuk,
        jenisAsesmen: editingAsesmen.jenisAsesmen,
        jumlahSoal: editingAsesmen.jumlahSoal || (editingAsesmen.jenisAsesmen === 'Sumatif' ? 25 : 10),
        tujuanPembelajaran: editingAsesmen.tujuanPembelajaran,
        kktp: kktpThreshold,
        instruksiKhusus: customInstruction,
      });

      setEditingAsesmen({
        ...editingAsesmen,
        naskahAsesmen: generatedNaskah,
      });
      onShowToast('success', `Naskah asesmen ${bentuk} berhasil disusun AI!`);
    } catch (err) {
      onShowToast('error', 'Gagal menyusun naskah asesmen AI, menggunakan draf terkurasi.');
    } finally {
      setIsGeneratingNaskahInForm(false);
    }
  };

  const handleSaveNaskahFromModal = (targetItem: RencanaAsesmenItem, naskah: string) => {
    const updated: RencanaAsesmenItem = {
      ...targetItem,
      naskahAsesmen: naskah,
      updatedAt: new Date().toISOString(),
    };
    onSaveAsesmen(updated);
    if (editingAsesmen && editingAsesmen.id === targetItem.id) {
      setEditingAsesmen(updated);
    }
    if (selectedNaskahItem && selectedNaskahItem.id === targetItem.id) {
      setSelectedNaskahItem(updated);
    }
  };

  // Helper for question composition in Tes Tertulis
  const getKomposisiSoal = (totalQ: number) => {
    let pg = 7;
    let isian = 2;
    let uraian = 1;
    if (totalQ === 5) {
      pg = 3;
      isian = 0;
      uraian = 2;
    } else if (totalQ === 10) {
      pg = 7;
      isian = 2;
      uraian = 1;
    } else if (totalQ === 15) {
      pg = 10;
      isian = 3;
      uraian = 2;
    } else if (totalQ === 20) {
      pg = 15;
      isian = 3;
      uraian = 2;
    } else if (totalQ === 25) {
      pg = 20;
      isian = 3;
      uraian = 2;
    } else if (totalQ === 30) {
      pg = 25;
      isian = 3;
      uraian = 2;
    } else {
      uraian = Math.max(1, Math.round(totalQ * 0.15));
      isian = Math.max(0, Math.round(totalQ * 0.15));
      pg = totalQ - uraian - isian;
    }
    const waktu = totalQ <= 5 ? 30 : totalQ <= 10 ? 45 : totalQ <= 15 ? 60 : totalQ <= 20 ? 75 : totalQ <= 25 ? 80 : 90;
    return { pg, isian, uraian, waktu };
  };

  const handleUpdateJumlahSoal = (count: number) => {
    if (!editingAsesmen) return;
    const clamped = Math.max(5, Math.min(30, count));
    const comp = getKomposisiSoal(clamped);
    const newCurated = generateCuratedNaskahAsesmen({
      mapel: editingAsesmen.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
      kelas: editingAsesmen.kelas || selectedKelas,
      topik: (editingAsesmen.topikMateri || editingAsesmen.judulAsesmen || '').trim() || 'Materi Pembelajaran',
      judulAsesmen: editingAsesmen.judulAsesmen,
      bentukAsesmen: 'Tes Tertulis',
      jenisAsesmen: editingAsesmen.jenisAsesmen,
      tujuanPembelajaran: editingAsesmen.tujuanPembelajaran,
      jumlahSoal: clamped,
      kktp: kktpThreshold,
    });
    setEditingAsesmen({
      ...editingAsesmen,
      jumlahSoal: clamped,
      teknikAsesmen: `Tes Tertulis (${clamped} Butir Soal: ${comp.pg} PG + ${comp.isian} Isian + ${comp.uraian} Uraian)`,
      naskahAsesmen: newCurated,
    });
    onShowToast('info', `Pilihan jumlah soal: ${clamped} butir (${editingAsesmen.jenisAsesmen}). Naskah dan kunci jawaban diperbarui.`);
  };

  // AI Handler 2: Generate Batch Student Feedback
  const handleGenerateBatchStudentFeedback = async () => {
    if (!activeAsesmen || classStudents.length === 0) return;
    setIsGeneratingFeedbackAI(true);
    try {
      const studentInput = classStudents.map((s) => ({
        id: s.id,
        nama: s.nama,
        nilai: editableGrades[s.id]?.nilai ?? 75,
      }));

      const feedbackMap = await generateBatchStudentFeedbackWithAI(
        studentInput,
        activeAsesmen.topikMateri || activeAsesmen.judulAsesmen,
        kktpThreshold
      );

      setEditableGrades((prev) => {
        const next = { ...prev };
        Object.entries(feedbackMap).forEach(([sId, note]) => {
          if (next[sId]) {
            next[sId] = {
              ...next[sId],
              catatan: note,
            };
          }
        });
        return next;
      });
      onShowToast('success', 'Catatan deskripsi kemajuan belajar untuk semua siswa berhasil ditulis AI!');
    } catch (e) {
      onShowToast('error', 'Gagal menyusun catatan AI');
    } finally {
      setIsGeneratingFeedbackAI(false);
    }
  };

  // AI Handler 3: Generate Tindak Lanjut (Remedial & Pengayaan)
  const handleGenerateTLAI = async () => {
    if (!activeAsesmen) return;
    setIsGeneratingTLAI(true);
    try {
      const remedialNames = activeTindakLanjut.programRemedial.daftarSiswa;
      const pengayaanNames = activeTindakLanjut.programPengayaan.daftarSiswa;

      const tlDraft = await generateTindakLanjutWithAI({
        topik: activeAsesmen.topikMateri || activeAsesmen.judulAsesmen,
        kelas: selectedKelas,
        kktpTarget: kktpThreshold,
        remedialStudents: remedialNames,
        pengayaanStudents: pengayaanNames,
      });

      const updated: TindakLanjutData = {
        ...activeTindakLanjut,
        programRemedial: {
          ...activeTindakLanjut.programRemedial,
          materiPengulangan: tlDraft.programRemedial?.materiPengulangan || activeTindakLanjut.programRemedial.materiPengulangan,
          bentukKegiatan: tlDraft.programRemedial?.bentukKegiatan || activeTindakLanjut.programRemedial.bentukKegiatan,
          jadwalPelaksanaan: tlDraft.programRemedial?.jadwalPelaksanaan || activeTindakLanjut.programRemedial.jadwalPelaksanaan,
        },
        programPengayaan: {
          ...activeTindakLanjut.programPengayaan,
          materiPengayaan: tlDraft.programPengayaan?.materiPengayaan || activeTindakLanjut.programPengayaan.materiPengayaan,
          bentukKegiatan: tlDraft.programPengayaan?.bentukKegiatan || activeTindakLanjut.programPengayaan.bentukKegiatan,
          jadwalPelaksanaan: tlDraft.programPengayaan?.jadwalPelaksanaan || activeTindakLanjut.programPengayaan.jadwalPelaksanaan,
        },
        catatanHasil: tlDraft.catatanHasil || activeTindakLanjut.catatanHasil,
      };

      onSaveTindakLanjut(updated);
      onShowToast('success', 'Program Remedial & Pengayaan berhasil dirancang AI!');
    } catch (e) {
      onShowToast('error', 'Gagal merancang tindak lanjut AI');
    } finally {
      setIsGeneratingTLAI(false);
    }
  };

  // AI Handler 4: Generate Refleksi Evaluasi Guru
  const handleGenerateRefleksiAI = async () => {
    if (!activeAsesmen) return;
    setIsGeneratingRefleksiAI(true);
    try {
      const refDraft = await generateRefleksiEvaluasiWithAI({
        topik: activeAsesmen.topikMateri || activeAsesmen.judulAsesmen,
        kelas: selectedKelas,
        persentaseTuntas: stats.persentase,
        rataRata: stats.rataRata,
        totalSiswa: stats.total,
      });

      const updated: RefleksiEvaluasiData = {
        ...activeRefleksi,
        apaYangBerjalanEfektif: refDraft.apaYangBerjalanEfektif || activeRefleksi.apaYangBerjalanEfektif,
        apaYangBelumBerhasil: refDraft.apaYangBelumBerhasil || activeRefleksi.apaYangBelumBerhasil,
        responPesertaDidik: refDraft.responPesertaDidik || activeRefleksi.responPesertaDidik,
        rencanaPerbaikan: refDraft.rencanaPerbaikan || activeRefleksi.rencanaPerbaikan,
      };

      onSaveRefleksi(updated);
      onShowToast('success', 'Refleksi evaluasi pembelajaran berhasil disusun AI!');
    } catch (e) {
      onShowToast('error', 'Gagal merumuskan refleksi AI');
    } finally {
      setIsGeneratingRefleksiAI(false);
    }
  };

  // AI Handler 5: Class Diagnosis with Gemini
  const handleDiagnoseClassWithAI = async () => {
    if (!activeAsesmen) return;
    setIsDiagnosingClass(true);
    try {
      const prompt = `Sebagai pakar asesmen Kurikulum Merdeka SMP dan Pembelajaran Mendalam (Deep Learning), berikan diagnosis pedagogis kelas yang ramah, konstruktif, dan komprehensif:

Mata Pelajaran: ${profile.mataPelajaran || 'IPA'}
Kelas: ${selectedKelas}
Topik/Asesmen: ${activeAsesmen.topikMateri || activeAsesmen.judulAsesmen}
Ambang Target KKTP: ${kktpThreshold}
Total Siswa Dinilai: ${stats.total} orang
Rata-rata Kelas: ${stats.rataRata} (Skala 100)
Ketuntasan Klasikal: ${stats.persentase}% (${stats.tuntas} tuntas, ${stats.belumTuntas} perlu bimbingan penguatan)
Rentang Nilai: ${stats.terendah} s.d. ${stats.tertinggi}

Format Output Rapi:
1. DIAGNOSIS KEKUATAN BELAJAR KELAS (apa yang sudah dikuasai dengan baik dan menyenangkan)
2. IDENTIFIKASI MISKONSEPSI & TITIK LEMAH (mengapa beberapa siswa belum tuntas secara bermakna)
3. 3 LANGKAH DIFERENSIASI PEDAGOGIS GURU (aksi konkret berkesadaran untuk siklus tatap muka berikutnya)`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, topicContext: 'Evaluasi Pembelajaran SMP' }),
      });
      const data = await res.json();
      const finalDiagnosis = data.result || data.text || 'Diagnosis pedagogis kelas berhasil dianalisis.';
      setClassDiagnosis(finalDiagnosis);
      onShowToast('success', 'Diagnosis pedagogis kelas berhasil dirumuskan AI!');
    } catch (e) {
      onShowToast('error', 'Gagal memproses diagnosis AI');
    } finally {
      setIsDiagnosingClass(false);
    }
  };

  // Tindak Lanjut Active Item
  const activeTindakLanjut =
    tindakLanjutList.find((t) => t.asesmenId === activeAsesmen?.id) || {
      id: 'tl-' + Date.now(),
      asesmenId: activeAsesmen?.id || '',
      topikMateri: activeAsesmen?.topikMateri || '',
      kelas: selectedKelas,
      kktpTarget: kktpThreshold,
      programRemedial: {
        daftarSiswa: classStudents
          .filter((s) => (editableGrades[s.id]?.nilai ?? 75) < kktpThreshold)
          .map((s) => s.nama),
        materiPengulangan: 'Konsep dasar yang belum tuntas dikuasai',
        bentukKegiatan: 'Bimbingan kelompok terfokus dan pendampingan tutor sebaya',
        jadwalPelaksanaan: 'Kamis sepulang sekolah (14.00 - 14.45)',
      },
      programPengayaan: {
        daftarSiswa: classStudents
          .filter((s) => (editableGrades[s.id]?.nilai ?? 75) >= 90)
          .map((s) => s.nama),
        materiPengayaan: 'Eksplorasi studi kasus nyata dan penugasan proyek kreatif',
        bentukKegiatan: 'Pemberian proyek mandiri dan pembuatan media informasi edukatif',
        jadwalPelaksanaan: 'Penugasan mandiri terstruktur selama 1 pekan',
      },
      catatanHasil: 'Semua peserta didik remedial mendapatkan penanganan bertahap tanpa diskriminasi.',
      updatedAt: new Date().toISOString(),
    };

  // Refleksi Active Item
  const activeRefleksi =
    refleksiList.find((r) => r.asesmenId === activeAsesmen?.id) || {
      id: 'ref-' + Date.now(),
      asesmenId: activeAsesmen?.id || '',
      topikMateri: activeAsesmen?.topikMateri || '',
      kelas: selectedKelas,
      apaYangBerjalanEfektif: 'Kegiatan praktikum dan diskusi kelompok terbukti meningkatkan pemahaman konseptual.',
      apaYangBelumBerhasil: 'Sebagian siswa masih ragu saat merumuskan kesimpulan analisis secara mandiri.',
      responPesertaDidik: 'Sangat positif dan antusias saat mencoba alat dan bahan nyata.',
      rencanaPerbaikan: 'Menambahkan panduan scaffolding bertahap untuk penarikan kesimpulan logis.',
      updatedAt: new Date().toISOString(),
    };

  const renderLembarPengesahanEvaluasi = (
    judulDokumen: string,
    targetContainerId: string = 'evaluasi-view-container',
    defaultFilename: string = `Dokumen_Evaluasi_${judulDokumen.replace(/\s+/g, '_')}`
  ) => {
    const isExporting = exportingId === targetContainerId;
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pengesahan Dokumen {judulDokumen}
            </h4>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto no-print">
            <button
              type="button"
              id={`btn-unduh-pdf-${targetContainerId}`}
              disabled={isExporting}
              onClick={() =>
                handleDownloadEvaluasiPDF(
                  targetContainerId,
                  `${defaultFilename}.pdf`,
                  `Dokumen ${judulDokumen}`
                )
              }
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-60 shadow-2xs"
              title="Unduh Dokumen Format PDF Resmi"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isExporting ? 'Memproses...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              id={`btn-cetak-pdf-${targetContainerId}`}
              onClick={() => printElementDirectly(targetContainerId, defaultFilename)}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              title="Cetak Dokumen"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs text-slate-800 pt-2">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-semibold text-slate-900">Kepala {profile.namaSekolah}</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-950">
              {profile.kepalaSekolah?.nama || 'Kepala Sekolah'}
            </p>
            <p className="text-[11px] text-slate-600">
              {profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -'}
            </p>
          </div>

          <div>
            <p className="text-slate-500">
              {profile.alamatSekolah?.split(',')[0] || 'Ditetapkan di Sekolah'},{' '}
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="font-semibold text-slate-900">Guru Mata Pelajaran</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-950">{profile.namaGuru}</p>
            <p className="text-[11px] text-slate-600">
              {profile.nip ? `NIP. ${profile.nip}` : 'Guru Mata Pelajaran'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="evaluasi-view-container">
      {/* Top Navigation Strip for Evaluasi Sub-Tabs */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'rencana' as EvaluasiSubTab, label: '1. Rencana Asesmen', icon: BookOpen },
            { id: 'input' as EvaluasiSubTab, label: '2. Input Nilai Siswa', icon: FileCheck2 },
            { id: 'analisis' as EvaluasiSubTab, label: '3. Analisis & Visualisasi Nilai', icon: BarChart3 },
            { id: 'tindak_lanjut' as EvaluasiSubTab, label: '4. Tindak Lanjut (Remedial & Pengayaan)', icon: HeartHandshake },
            { id: 'refleksi' as EvaluasiSubTab, label: '5. Refleksi Pembelajaran', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Class & Assessment filter selectors */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-500 mr-1.5 font-medium">Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              {profile.kelasList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs max-w-[200px]">
            <span className="text-slate-500 mr-1.5 font-medium">Asesmen:</span>
            <select
              value={selectedAsesmenId}
              onChange={(e) => setSelectedAsesmenId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden truncate"
            >
              {asesmenList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.judulAsesmen}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB 1: RENCANA ASESMEN */}
      {/* ============================================================ */}
      {subTab === 'rencana' && (
        <div className="space-y-4 print-clean" id="dokumen-evaluasi-rencana-asesmen">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rencana Asesmen Pembelajaran</h3>
              <p className="text-xs text-slate-500">
                Penyusunan instrumen asesmen formatif dan sumatif dengan kriteria KKTP terukur
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenAIWithTopic && (
                <button
                  type="button"
                  onClick={() => onOpenAIWithTopic(activeAsesmen?.topikMateri || activeAsesmen?.judulAsesmen || 'Asesmen Pembelajaran SMP')}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                  <span>Asisten AI Asesmen</span>
                </button>
              )}
              <button
                onClick={() => {
                  const initialNaskah = generateCuratedNaskahAsesmen({
                    mapel: profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
                    kelas: selectedKelas,
                    topik: 'Materi Pembelajaran',
                    judulAsesmen: 'Asesmen Formatif Tes Tertulis',
                    bentukAsesmen: 'Tes Tertulis',
                    jenisAsesmen: 'Formatif',
                    jumlahSoal: 10,
                    kktp: kktpThreshold,
                  });
                  setEditingAsesmen({
                    id: 'asm-' + Date.now(),
                    judulAsesmen: '',
                    jenisAsesmen: 'Formatif',
                    bentukAsesmen: 'Tes Tertulis',
                    jumlahSoal: 10,
                    teknikAsesmen: 'Tes Tertulis (10 Butir Soal: 7 PG + 2 Isian + 1 Uraian)',
                    instrumenAsesmen: 'Lembar Soal & Pedoman Penskoran',
                    tujuanPembelajaran: '',
                    topikMateri: '',
                    kelas: selectedKelas,
                    waktuPelaksanaan: 'Pertemuan 1',
                    naskahAsesmen: initialNaskah,
                    kriteriaKetercapaian: {
                      baruBerkembang: 'Menunjukkan pemahaman dasar kurang dari 60%.',
                      layak: 'Memahami konsep dengan bimbingan (60-74%).',
                      cakap: 'Menguasai materi dan mampu menerapkan secara mandiri (75-89%).',
                      mahir: 'Mampu menganalisis, mencipta, dan menalar kritis (>90%).',
                    },
                  });
                  setIsAsesmenModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rencana Asesmen</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asesmenList.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                  item.id === selectedAsesmenId
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.jenisAsesmen === 'Formatif'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.jenisAsesmen}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {item.bentukAsesmen}
                    </span>
                    {item.jumlahSoal && normalizeBentukAsesmen(item.bentukAsesmen) === 'Tes Tertulis' && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {item.jumlahSoal} Butir Soal
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      Kelas {item.kelas || selectedKelas}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNaskahItem(item);
                        setIsNaskahModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                      title="Buka Naskah Asesmen Lengkap"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadEvaluasiPDF(
                          `dokumen-asesmen-rubrik-${item.id}`,
                          `Instrumen_Rubrik_${(item.judulAsesmen || 'Asesmen').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                          `Rubrik Asesmen: ${item.judulAsesmen}`
                        );
                      }}
                      className="p-1 text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-50"
                      title="Unduh Rubrik PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        printElementDirectly(
                          `dokumen-asesmen-rubrik-${item.id}`,
                          `Rubrik_${item.judulAsesmen}`
                        )
                      }
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                      title="Cetak Rubrik"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAsesmen(JSON.parse(JSON.stringify(item)));
                        setIsAsesmenModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {asesmenList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteAsesmen(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div id={`dokumen-asesmen-rubrik-${item.id}`} className="print-clean">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{item.judulAsesmen}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {item.tujuanPembelajaran || 'Tujuan pembelajaran belum dirinci.'}
                  </p>

                  {/* KKTP preview */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1 mb-3">
                    <span className="font-semibold text-slate-700 block">Kriteria Capaian (KKTP):</span>
                    <div className="text-slate-600">
                      <strong>Cakap (Target):</strong> {item.kriteriaKetercapaian.cakap}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs no-print">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-[11px]">{item.waktuPelaksanaan}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNaskahItem(item);
                        setIsNaskahModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                      title="Lihat / Cetak Naskah Asesmen"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Naskah Asesmen</span>
                      {item.naskahAsesmen ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Naskah Tersedia"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" title="Draf Otomatis"></span>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsesmenId(item.id);
                      setSubTab('input');
                      onShowToast('info', `Asesmen "${item.judulAsesmen}" dipilih untuk input nilai`);
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <span>Input Nilai Ini</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pengesahan Rencana Asesmen */}
          {renderLembarPengesahanEvaluasi(
            'Rencana Asesmen Pembelajaran',
            'dokumen-evaluasi-rencana-asesmen',
            `Rencana_Asesmen_${selectedKelas}`
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: INPUT NILAI SISWA */}
      {/* ============================================================ */}
      {subTab === 'input' && (
        <div className="space-y-4 print-clean" id="dokumen-evaluasi-daftar-nilai">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Input & Rekap Nilai: {activeAsesmen?.judulAsesmen || 'Asesmen'}
                </h3>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  Kelas {selectedKelas}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ambang KKTP: <strong>{kktpThreshold}</strong> • Total {classStudents.length} peserta didik
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2 no-print">
              {/* Add Student Button */}
              <button
                type="button"
                onClick={() => setIsAddSiswaOpen(true)}
                className="px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>

              {/* Import CSV */}
              <label className="px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor CSV</span>
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>

              {/* Unduh PDF Nilai */}
              <button
                type="button"
                disabled={exportingId === 'dokumen-evaluasi-daftar-nilai'}
                onClick={() =>
                  handleDownloadEvaluasiPDF(
                    'dokumen-evaluasi-daftar-nilai',
                    `Daftar_Nilai_${selectedKelas}_${(activeAsesmen?.judulAsesmen || 'Asesmen').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                    `Daftar Nilai Siswa Kelas ${selectedKelas}`
                  )
                }
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                title="Unduh Lembar Nilai Siswa PDF"
              >
                {exportingId === 'dokumen-evaluasi-daftar-nilai' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Unduh PDF Nilai</span>
              </button>

              {/* Cetak Nilai */}
              <button
                type="button"
                onClick={() =>
                  printElementDirectly(
                    'dokumen-evaluasi-daftar-nilai',
                    `Daftar_Nilai_${selectedKelas}`
                  )
                }
                className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1"
                title="Cetak Lembar Nilai"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cetak Nilai</span>
              </button>

              {/* AI Batch Student Feedback Button */}
              <button
                type="button"
                disabled={isGeneratingFeedbackAI}
                onClick={handleGenerateBatchStudentFeedback}
                id="btn-tulis-catatan-ai"
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
              >
                {isGeneratingFeedbackAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menulis Catatan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Tulis Catatan Deskripsi Siswa (AI)</span>
                  </>
                )}
              </button>

              {/* Quick Jump to Visualisasi Grafik Recharts */}
              <button
                type="button"
                onClick={() => setSubTab('analisis')}
                id="btn-lihat-grafik-nilai"
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="Buka grafik batang distribusi nilai Recharts"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Visualisasi Grafik</span>
              </button>

              {/* Save Grades Button */}
              <button
                type="button"
                onClick={handleSaveGrades}
                id="btn-simpan-nilai"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Nilai</span>
              </button>
            </div>
          </div>

          {/* Student Grade Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 w-28">NISN</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Nama Peserta Didik</th>
                    <th className="py-2.5 px-3 w-28 text-center">Nilai (0-100)</th>
                    <th className="py-2.5 px-3 w-32 text-center">Status KKTP</th>
                    <th className="py-2.5 px-3">Catatan / Deskripsi Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((siswa, idx) => {
                    const gradeVal = editableGrades[siswa.id]?.nilai ?? 75;
                    const descVal = editableGrades[siswa.id]?.catatan ?? '';
                    const isTuntas = gradeVal >= kktpThreshold;

                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {siswa.nisn || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {siswa.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={gradeVal}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                              setEditableGrades((prev) => ({
                                ...prev,
                                [siswa.id]: {
                                  nilai: val,
                                  catatan: prev[siswa.id]?.catatan || '',
                                },
                              }));
                            }}
                            className={`w-20 text-center font-bold p-1 rounded border text-xs focus:ring-2 focus:ring-indigo-500 ${
                              isTuntas
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                : 'border-rose-300 bg-rose-50 text-rose-900'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTuntas
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isTuntas ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{isTuntas ? 'Tuntas' : 'Perlu Penguatan'}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={descVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditableGrades((prev) => ({
                                ...prev,
                                [siswa.id]: {
                                  nilai: prev[siswa.id]?.nilai ?? 75,
                                  catatan: val,
                                },
                              }));
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                            placeholder="Deskripsi pencapaian kompetensi siswa..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pengesahan Daftar Nilai Evaluasi Siswa */}
          {renderLembarPengesahanEvaluasi(
            'Daftar Nilai Siswa',
            'dokumen-evaluasi-daftar-nilai',
            `Daftar_Nilai_${selectedKelas}_${(activeAsesmen?.judulAsesmen || 'Asesmen').replace(/[^a-zA-Z0-9]/g, '_')}`
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: ANALISIS HASIL BELAJAR */}
      {/* ============================================================ */}
      {subTab === 'analisis' && (
        <div className="space-y-4 print-clean" id="dokumen-evaluasi-analisis">
          {/* Recharts Data Visualization Component */}
          <EvaluasiVisualisasiNilai
            profile={profile}
            asesmenList={asesmenList}
            nilaiList={nilaiList}
            siswaList={siswaList}
            selectedKelas={selectedKelas}
            onSelectKelas={setSelectedKelas}
            kktpThreshold={kktpThreshold}
            onUpdateKktp={setKktpThreshold}
            onShowToast={onShowToast}
          />

          {/* Header & Threshold Adjuster */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ringkasan Analisis Ketercapaian Hasil Belajar</h3>
              <p className="text-xs text-slate-500">
                Statistik objektif pencapaian kompetensi kelas {selectedKelas} pada materi {activeAsesmen?.topikMateri}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Ubah Ambang KKTP:</span>
              <input
                type="number"
                min={50}
                max={100}
                value={kktpThreshold}
                onChange={(e) => setKktpThreshold(parseInt(e.target.value, 10) || 75)}
                className="w-16 p-1 text-center font-bold text-xs border rounded bg-white"
              />
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">Rata-Rata Kelas</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.rataRata}</div>
              <span className="text-[11px] text-slate-400">Dari skala 100</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">Ketuntasan Klasikal</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.persentase}%</div>
              <span className="text-[11px] text-emerald-700 font-semibold">{stats.tuntas} dari {stats.total} siswa</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">Perlu Penguatan (Remedial)</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.belumTuntas}</div>
              <span className="text-[11px] text-slate-400">Di bawah ambang {kktpThreshold}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">Rentang Skor</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.terendah} - {stats.tertinggi}</div>
              <span className="text-[11px] text-slate-400">Min s.d. Maks</span>
            </div>
          </div>

          {/* Qualitative Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Materi yang Sudah Dikuasai Mayoritas</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                Peserta didik sebagian besar telah mampu memahami konsep dasar, menyebutkan karakteristik utama, dan mengikuti langkah kerja penyelidikan dengan runtut.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Area yang Masih Memerlukan Penguatan</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                Beberapa peserta didik masih menghadapi kendala saat mengonversi data observasi menjadi kesimpulan konseptual tertulis dan menjawab soal studi kasus penalaran analitis.
              </p>
            </div>
          </div>

          {/* AI Pedagogical Diagnosis Section */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white p-5 rounded-xl border border-indigo-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">
                    Diagnosis Pedagogis Kelas & Rekomendasi Siklus Guru (AI)
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Analisis cerdas pola penguasaan kelas berdasarkan ketuntasan {stats.persentase}% dan nilai rata-rata {stats.rataRata}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onOpenAIWithTopic && (
                  <button
                    type="button"
                    onClick={() => onOpenAIWithTopic(`Analisis Hasil Belajar ${activeAsesmen?.topikMateri || activeAsesmen?.judulAsesmen || ''} Kelas ${selectedKelas}`)}
                    className="px-3 py-1.5 border border-indigo-300 text-indigo-700 hover:bg-indigo-100/50 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Diskusi di Asisten AI</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isDiagnosingClass}
                  onClick={handleDiagnoseClassWithAI}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
                >
                  {isDiagnosingClass ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendiagnosis AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Buat Diagnosis Pedagogis AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {classDiagnosis ? (
              <div className="bg-white/90 p-4 rounded-lg border border-indigo-100 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {classDiagnosis}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-indigo-200 text-center text-xs text-indigo-600/80 bg-white/50">
                Klik tombol "Buat Diagnosis Pedagogis AI" untuk mendapatkan sintesis menyeluruh: kekuatan kelas, titik rawan miskonsepsi, serta 3 langkah diferensiasi pembelajaran berikutnya.
              </div>
            )}
          </div>

          {/* Pengesahan Dokumen Analisis Evaluasi */}
          {renderLembarPengesahanEvaluasi(
            'Analisis Ketuntasan Belajar',
            'dokumen-evaluasi-analisis',
            `Analisis_Ketuntasan_${selectedKelas}`
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: TINDAK LANJUT (REMEDIAL & PENGAYAAN) */}
      {/* ============================================================ */}
      {subTab === 'tindak_lanjut' && (
        <div className="space-y-4 print-clean" id="dokumen-evaluasi-tindak-lanjut">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Program Tindak Lanjut Pembelajaran</h3>
              <p className="text-xs text-slate-500">
                Rancangan intervensi ramah peserta didik tanpa stigmatisasi negatif (Remedial & Pengayaan)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isGeneratingTLAI}
                onClick={handleGenerateTLAI}
                id="btn-ai-tindak-lanjut"
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
              >
                {isGeneratingTLAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Merancang Program AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Rancang Remedial & Pengayaan (AI)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onSaveTindakLanjut(activeTindakLanjut);
                  onShowToast('success', 'Rencana tindak lanjut berhasil disimpan');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tindak Lanjut</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Program Remedial */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Program Penguatan (Remedial)</span>
                </h4>
                <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                  {activeTindakLanjut.programRemedial.daftarSiswa.length} Siswa Terdata
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Peserta Didik Bimbingan:</span>
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded border min-h-[40px]">
                  {activeTindakLanjut.programRemedial.daftarSiswa.length > 0 ? (
                    activeTindakLanjut.programRemedial.daftarSiswa.map((nama, idx) => (
                      <span key={idx} className="bg-white text-slate-800 border px-2 py-0.5 rounded text-[11px] font-medium">
                        {nama}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Semua siswa telah mencapai ambang KKTP</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Materi yang Diulang / Diperkuat:</span>
                <input
                  type="text"
                  value={activeTindakLanjut.programRemedial.materiPengulangan}
                  onChange={(e) => {
                    activeTindakLanjut.programRemedial.materiPengulangan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Bentuk Kegiatan:</span>
                <textarea
                  rows={2}
                  value={activeTindakLanjut.programRemedial.bentukKegiatan}
                  onChange={(e) => {
                    activeTindakLanjut.programRemedial.bentukKegiatan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Jadwal & Waktu:</span>
                <input
                  type="text"
                  value={activeTindakLanjut.programRemedial.jadwalPelaksanaan}
                  onChange={(e) => {
                    activeTindakLanjut.programRemedial.jadwalPelaksanaan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Program Pengayaan */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Program Pengayaan (Enrichment)</span>
                </h4>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                  {activeTindakLanjut.programPengayaan.daftarSiswa.length} Siswa Terdata
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Peserta Didik Pengayaan:</span>
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded border min-h-[40px]">
                  {activeTindakLanjut.programPengayaan.daftarSiswa.length > 0 ? (
                    activeTindakLanjut.programPengayaan.daftarSiswa.map((nama, idx) => (
                      <span key={idx} className="bg-white text-slate-800 border px-2 py-0.5 rounded text-[11px] font-medium">
                        {nama}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Belum ada siswa dengan nilai istimewa</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Materi / Tantangan Pengayaan:</span>
                <input
                  type="text"
                  value={activeTindakLanjut.programPengayaan.materiPengayaan}
                  onChange={(e) => {
                    activeTindakLanjut.programPengayaan.materiPengayaan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Bentuk Aktivitas Kreatif:</span>
                <textarea
                  rows={2}
                  value={activeTindakLanjut.programPengayaan.bentukKegiatan}
                  onChange={(e) => {
                    activeTindakLanjut.programPengayaan.bentukKegiatan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Jadwal & Ketentuan:</span>
                <input
                  type="text"
                  value={activeTindakLanjut.programPengayaan.jadwalPelaksanaan}
                  onChange={(e) => {
                    activeTindakLanjut.programPengayaan.jadwalPelaksanaan = e.target.value;
                  }}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Pengesahan Dokumen Program Tindak Lanjut */}
          {renderLembarPengesahanEvaluasi(
            'Program Remedial & Pengayaan',
            'dokumen-evaluasi-tindak-lanjut',
            `Program_Remedial_Pengayaan_${selectedKelas}`
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 5: REFLEKSI PEMBELAJARAN */}
      {/* ============================================================ */}
      {subTab === 'refleksi' && (
        <div className="space-y-4 print-clean" id="dokumen-evaluasi-refleksi">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Refleksi Siklus Evaluasi Pembelajaran</h3>
              <p className="text-xs text-slate-500">
                Pencatatan reflektif guru untuk pengembangan profesional berkelanjutan (Berkesadaran & Bermakna)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isGeneratingRefleksiAI}
                onClick={handleGenerateRefleksiAI}
                id="btn-ai-refleksi"
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
              >
                {isGeneratingRefleksiAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyusun Refleksi AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Bantu Tulis Refleksi Evaluasi (AI)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onSaveRefleksi(activeRefleksi);
                  onShowToast('success', 'Catatan refleksi pembelajaran berhasil disimpan');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Refleksi</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Apa hal yang paling berjalan efektif dalam siklus pembelajaran ini?
              </label>
              <textarea
                rows={3}
                value={activeRefleksi.apaYangBerjalanEfektif}
                onChange={(e) => {
                  activeRefleksi.apaYangBerjalanEfektif = e.target.value;
                }}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Apa yang belum berhasil optimal atau menjadi titik tantangan terbesar?
              </label>
              <textarea
                rows={3}
                value={activeRefleksi.apaYangBelumBerhasil}
                onChange={(e) => {
                  activeRefleksi.apaYangBelumBerhasil = e.target.value;
                }}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                3. Bagaimana respon dan keterlibatan emosional peserta didik (sukacita & antusiasme)?
              </label>
              <textarea
                rows={3}
                value={activeRefleksi.responPesertaDidik}
                onChange={(e) => {
                  activeRefleksi.responPesertaDidik = e.target.value;
                }}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                4. Rencana perbaikan konkret untuk pertemuan pembelajaran berikutnya:
              </label>
              <textarea
                rows={3}
                value={activeRefleksi.rencanaPerbaikan}
                onChange={(e) => {
                  activeRefleksi.rencanaPerbaikan = e.target.value;
                }}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pengesahan Dokumen Refleksi Evaluasi */}
          {renderLembarPengesahanEvaluasi(
            'Refleksi Evaluasi Pembelajaran',
            'dokumen-evaluasi-refleksi',
            `Refleksi_Pembelajaran_${selectedKelas}`
          )}
        </div>
      )}

      {/* Modal Add Student */}
      {isAddSiswaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Tambah Peserta Didik Baru</h4>
            <p className="text-xs text-slate-500 mb-3">Tambahkan murid baru ke dalam daftar kelas {selectedKelas}</p>
            <form onSubmit={handleAddNewStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={newNamaSiswa}
                  onChange={(e) => setNewNamaSiswa(e.target.value)}
                  placeholder="Misal: Siti Nurhaliza"
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">NISN (Opsional)</label>
                <input
                  type="text"
                  value={newNisSiswa}
                  onChange={(e) => setNewNisSiswa(e.target.value)}
                  placeholder="0087654321"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddSiswaOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Rencana Asesmen */}
      {isAsesmenModalOpen && editingAsesmen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Formulir Rencana Asesmen</h3>
              <button onClick={() => setIsAsesmenModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveAsesmen(editingAsesmen);
                setIsAsesmenModalOpen(false);
                setEditingAsesmen(null);
                onShowToast('success', 'Rencana asesmen berhasil disimpan');
              }}
              className="p-5 overflow-y-auto flex-1 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Judul Asesmen / Lingkup Materi <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={editingAsesmen.judulAsesmen}
                  onChange={(e) => setEditingAsesmen({ ...editingAsesmen, judulAsesmen: e.target.value })}
                  placeholder="Contoh: Asesmen Formatif Klasifikasi Makhluk Hidup"
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {/* Asisten AI Rubrik & KKTP */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-950 text-xs">
                      Asisten AI Rubrik & KKTP
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                    Kurikulum Merdeka
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  AI akan merumuskan Tujuan Pembelajaran operasional, teknik & instrumen asesmen, serta interval deskripsi kriteria ketercapaian (Baru Berkembang, Layak, Cakap, Mahir).
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingRubrikAI}
                    onClick={handleGenerateRubrikAI}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-xs flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
                  >
                    {isGeneratingRubrikAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyusun Rubrik AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Rumuskan Rubrik & Interval KKTP (AI)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jenis Asesmen</label>
                  <select
                    value={editingAsesmen.jenisAsesmen}
                    onChange={(e) => {
                      const newJenis = e.target.value as any;
                      const defaultQ = newJenis === 'Sumatif'
                        ? (editingAsesmen.jumlahSoal && editingAsesmen.jumlahSoal >= 20 ? editingAsesmen.jumlahSoal : 25)
                        : (editingAsesmen.jumlahSoal && editingAsesmen.jumlahSoal <= 15 ? editingAsesmen.jumlahSoal : 10);
                      const comp = getKomposisiSoal(defaultQ);
                      const newCurated = generateCuratedNaskahAsesmen({
                        mapel: editingAsesmen.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
                        kelas: editingAsesmen.kelas || selectedKelas,
                        topik: (editingAsesmen.topikMateri || editingAsesmen.judulAsesmen || '').trim() || 'Materi Pembelajaran',
                        judulAsesmen: editingAsesmen.judulAsesmen,
                        bentukAsesmen: editingAsesmen.bentukAsesmen || 'Tes Tertulis',
                        jenisAsesmen: newJenis,
                        jumlahSoal: defaultQ,
                        tujuanPembelajaran: editingAsesmen.tujuanPembelajaran,
                        kktp: kktpThreshold,
                      });
                      setEditingAsesmen({
                        ...editingAsesmen,
                        jenisAsesmen: newJenis,
                        jumlahSoal: defaultQ,
                        teknikAsesmen: `Tes Tertulis (${defaultQ} Butir Soal: ${comp.pg} PG + ${comp.isian} Isian + ${comp.uraian} Uraian)`,
                        naskahAsesmen: newCurated,
                      });
                      onShowToast(
                        'info',
                        `Jenis asesmen: ${newJenis}. Rekomendasi: ${
                          newJenis === 'Sumatif' ? '20, 25, atau 30 soal' : '5, 10, atau 15 soal'
                        } (disetel ${defaultQ} butir).`
                      );
                    }}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="Formatif">Formatif (Selama Proses)</option>
                    <option value="Sumatif">Sumatif (Akhir Lingkup Materi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bentuk Asesmen</label>
                  <select
                    value={editingAsesmen.bentukAsesmen}
                    onChange={(e) => {
                      const newBentuk = e.target.value;
                      const defaultQ = editingAsesmen.jumlahSoal || (editingAsesmen.jenisAsesmen === 'Sumatif' ? 25 : 10);
                      const comp = getKomposisiSoal(defaultQ);
                      const newCurated = generateCuratedNaskahAsesmen({
                        mapel: editingAsesmen.mataPelajaran || profile.mataPelajaran || 'Ilmu Pengetahuan Alam (IPA)',
                        kelas: editingAsesmen.kelas || selectedKelas,
                        topik: (editingAsesmen.topikMateri || editingAsesmen.judulAsesmen || '').trim() || 'Materi Pembelajaran',
                        judulAsesmen: editingAsesmen.judulAsesmen,
                        bentukAsesmen: newBentuk,
                        jenisAsesmen: editingAsesmen.jenisAsesmen,
                        jumlahSoal: defaultQ,
                        tujuanPembelajaran: editingAsesmen.tujuanPembelajaran,
                        kktp: kktpThreshold,
                      });
                      setEditingAsesmen({
                        ...editingAsesmen,
                        bentukAsesmen: newBentuk,
                        jumlahSoal: defaultQ,
                        teknikAsesmen: normalizeBentukAsesmen(newBentuk) === 'Tes Tertulis'
                          ? `Tes Tertulis (${defaultQ} Butir Soal: ${comp.pg} PG + ${comp.isian} Isian + ${comp.uraian} Uraian)`
                          : editingAsesmen.teknikAsesmen,
                        naskahAsesmen: newCurated,
                      });
                      onShowToast('info', `Bentuk asesmen: ${newBentuk}. Naskah instrumen disesuaikan.`);
                    }}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="Kinerja">Kinerja / Praktik</option>
                    <option value="Tes Tertulis">Tes Tulis (Tes Tertulis)</option>
                    <option value="Proyek">Proyek</option>
                    <option value="Portofolio">Portofolio</option>
                    <option value="Observasi">Observasi</option>
                    <option value="Diri / Antarteman">Penilaian Diri / Teman</option>
                  </select>
                </div>
              </div>

              {/* Opsi Jumlah Soal Khusus Tes Tertulis / Tes Tulis */}
              {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Tes Tertulis' && (() => {
                const currentCount = editingAsesmen.jumlahSoal || (editingAsesmen.jenisAsesmen === 'Sumatif' ? 25 : 10);
                const isFormatif = editingAsesmen.jenisAsesmen === 'Formatif';
                const comp = getKomposisiSoal(currentCount);

                const presetOptions = [
                  {
                    count: 5,
                    title: '5 Soal',
                    subtitle: 'Kuis Singkat',
                    rekomendasi: isFormatif ? 'Formatif Cepat' : 'Sumatif Singkat',
                    isRecommended: isFormatif,
                    desc: '3 PG HOTS + 2 Uraian',
                    waktu: '25-30 Mnt',
                  },
                  {
                    count: 10,
                    title: '10 Soal',
                    subtitle: 'Formatif Standar',
                    rekomendasi: isFormatif ? '⭐ Rekomendasi Formatif' : 'Sumatif Ringkas',
                    isRecommended: isFormatif,
                    desc: '7 PG HOTS + 2 Isian + 1 Uraian',
                    waktu: '40-45 Mnt',
                  },
                  {
                    count: 15,
                    title: '15 Soal',
                    subtitle: 'Formatif Mendalam',
                    rekomendasi: isFormatif ? 'Formatif Mendalam' : 'Sumatif Submateri',
                    isRecommended: true,
                    desc: '10 PG HOTS + 3 Isian + 2 Uraian',
                    waktu: '50-60 Mnt',
                  },
                  {
                    count: 20,
                    title: '20 Soal',
                    subtitle: 'Sumatif Penilaian Harian',
                    rekomendasi: !isFormatif ? 'Sumatif PH / Unit' : 'Formatif Lanjutan',
                    isRecommended: !isFormatif,
                    desc: '15 PG HOTS + 3 Isian + 2 Uraian',
                    waktu: '60-75 Mnt',
                  },
                  {
                    count: 25,
                    title: '25 Soal',
                    subtitle: 'Sumatif Akhir Bab',
                    rekomendasi: !isFormatif ? '⭐ Rekomendasi Sumatif' : 'Formatif Lengkap',
                    isRecommended: !isFormatif,
                    desc: '20 PG HOTS + 3 Isian + 2 Uraian',
                    waktu: '75-80 Mnt',
                  },
                  {
                    count: 30,
                    title: '30 Soal',
                    subtitle: 'Sumatif Komprehensif',
                    rekomendasi: !isFormatif ? 'Sumatif Lengkap / SAS' : 'Formatif Maksimal',
                    isRecommended: !isFormatif,
                    desc: '25 PG HOTS + 3 Isian + 2 Uraian',
                    waktu: '90 Mnt',
                  },
                ];

                return (
                  <div className="p-4 bg-gradient-to-br from-amber-50/90 via-indigo-50/70 to-purple-50/70 border-2 border-amber-300 rounded-xl space-y-3.5 shadow-sm animate-in fade-in duration-200">
                    {/* Header & Badges */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        <span>Pilihan Jumlah Butir Soal (Tes Tulis):</span>
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs border ${
                            isFormatif
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-purple-100 text-purple-900 border-purple-300'
                          }`}
                        >
                          Mode: {editingAsesmen.jenisAsesmen}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500 text-slate-950 shadow-2xs">
                          Terpilih: {currentCount} Butir Soal
                        </span>
                      </div>
                    </div>

                    {/* Contextual Guidance Notice */}
                    <div
                      className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start space-x-2 ${
                        isFormatif
                          ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                          : 'bg-purple-50/90 border-purple-200 text-purple-950'
                      }`}
                    >
                      <span className="text-sm shrink-0">{isFormatif ? '💡' : '🏆'}</span>
                      <div className="flex-1">
                        <strong className="font-semibold block mb-0.5">
                          {isFormatif
                            ? 'Panduan Asesmen Formatif (Tes Tulis):'
                            : 'Panduan Asesmen Sumatif (Tes Tulis):'}
                        </strong>
                        <span>
                          {isFormatif
                            ? 'Asesmen Formatif bertujuan memantau proses belajar dan diagnosis kesulitan secara cepat. Pilihan soal yang sangat memadai adalah 5, 10, atau 15 Butir Soal agar efektif, tidak membebani murid, dan umpan balik segera didapat. Pilihan 20 hingga 30 butir soal tetap tersedia jika diperlukan.'
                            : 'Asesmen Sumatif bertujuan mengukur pencapaian kompetensi akhir peserta didik pada materi ini. Pilihan soal yang sangat memadai adalah 20, 25, atau 30 Butir Soal (atau 15 Soal untuk lingkup materi ringkas) dengan stimulus wacana kontekstual HOTS dan rubrik penskoran terstandar.'}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Pilihan Cepat 5, 10, 15, 20, 25, s.d. 30 Soal */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Pilihan Cepat Jumlah Soal (5, 10, 15, 20, 25, s.d. 30):</span>
                        <span className="text-[10px] font-normal text-slate-500">Klik salah satu untuk langsung memilih</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {presetOptions.map((opt) => {
                          const isSelected = currentCount === opt.count;
                          return (
                            <button
                              key={opt.count}
                              type="button"
                              onClick={() => handleUpdateJumlahSoal(opt.count)}
                              className={`p-2.5 rounded-xl font-bold transition-all flex flex-col items-center justify-between text-left relative border shadow-2xs group ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 scale-[1.03] shadow-md z-10'
                                  : 'bg-white hover:bg-amber-50/80 text-slate-700 border-slate-200 hover:border-amber-300 hover:shadow-xs'
                              }`}
                            >
                              {opt.isRecommended && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold mb-1 w-full text-center truncate ${
                                    isSelected
                                      ? 'bg-slate-950 text-amber-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                                  }`}
                                >
                                  {opt.rekomendasi}
                                </span>
                              )}
                              <div className="flex items-center space-x-1 my-0.5">
                                <span className="text-xl sm:text-2xl font-black tracking-tight">{opt.count}</span>
                                <span className="text-[11px] font-bold opacity-90">Soal</span>
                              </div>
                              <span className="text-[10px] font-medium opacity-85 text-center leading-tight mb-1">
                                {opt.desc}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center space-x-1 ${
                                  isSelected
                                    ? 'bg-amber-600 text-slate-950'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>~{opt.waktu}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pengaturan Fleksibel Slider & Stepper 5 sampai 30 */}
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-800">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Atur Jumlah Soal Fleksibel (5 s/d 30 Soal):</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateJumlahSoal(Math.max(5, currentCount - 1))}
                          disabled={currentCount <= 5}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold shadow-2xs"
                          title="Kurangi 1 Soal"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min={5}
                          max={30}
                          step={1}
                          value={currentCount}
                          onChange={(e) => handleUpdateJumlahSoal(Number(e.target.value))}
                          className="w-24 sm:w-36 accent-amber-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateJumlahSoal(Math.min(30, currentCount + 1))}
                          disabled={currentCount >= 30}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold shadow-2xs"
                          title="Tambah 1 Soal"
                        >
                          +
                        </button>
                        <div className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs min-w-[55px] text-center border border-amber-600 shadow-2xs">
                          {currentCount} Soal
                        </div>
                      </div>
                    </div>

                    {/* Live Rincian Format Soal & Estimasi Waktu */}
                    <div className="bg-white/95 p-3 rounded-xl border border-amber-300/80 text-[11px] text-slate-800 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-900 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Rincian Format Soal ({currentCount} Butir):</span>
                        </span>
                        <span className="font-semibold text-indigo-700 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Estimasi Pengerjaan: ~{comp.waktu} Menit</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Pilihan Ganda HOTS</span>
                          <strong className="text-slate-900 font-bold">{comp.pg} Butir Soal</strong>
                          <span className="text-[10px] text-slate-500 block">(A, B, C, D + Alasan Ilmiah)</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Isian Singkat Analitis</span>
                          <strong className="text-slate-900 font-bold">{comp.isian} Butir Soal</strong>
                          <span className="text-[10px] text-slate-500 block">(Konsep sebab-akibat)</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Uraian Pemecahan Masalah</span>
                          <strong className="text-slate-900 font-bold">{comp.uraian} Butir Soal</strong>
                          <span className="text-[10px] text-slate-500 block">(Studi kasus kontekstual)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-semibold mb-1">Tujuan Pembelajaran</label>
                <textarea
                  rows={2}
                  value={editingAsesmen.tujuanPembelajaran}
                  onChange={(e) => setEditingAsesmen({ ...editingAsesmen, tujuanPembelajaran: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Kriteria Cakap (Target KKTP)</label>
                <textarea
                  rows={2}
                  value={editingAsesmen.kriteriaKetercapaian.cakap}
                  onChange={(e) =>
                    setEditingAsesmen({
                      ...editingAsesmen,
                      kriteriaKetercapaian: {
                        ...editingAsesmen.kriteriaKetercapaian,
                        cakap: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Asisten AI Penyusun Naskah Asesmen Sesuai Bentuk Pilihan */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 border border-indigo-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span>Naskah Instrumen Asesmen</span>
                        <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">
                          {editingAsesmen.bentukAsesmen || 'Kinerja'}
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-600">
                        Disusun spesifik sesuai bentuk pilihan: {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNaskahItem(editingAsesmen);
                        setIsNaskahModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
                      title="Buka Layar Penuh & Cetak PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Layar Penuh / Cetak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNaskahEditorInForm(!showNaskahEditorInForm)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      {showNaskahEditorInForm ? 'Tutup Editor' : 'Edit Teks Naskah'}
                    </button>
                  </div>
                </div>

                {/* Deskripsi ringkas karakteristik bentuk */}
                <div className="p-2 bg-white/80 rounded-lg border border-indigo-100 text-[11px] text-slate-700">
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Kinerja' && (
                    <span>📌 <strong>Kinerja / Praktik:</strong> Memuat skenario unjuk kerja, petunjuk peserta didik, langkah praktikum, alat & bahan, serta rubrik observasi 4 tingkatan.</span>
                  )}
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Tes Tertulis' && (
                    <span>📌 <strong>Tes Tulis:</strong> Memuat kisi-kisi, stimulus wacana kontekstual, soal Pilihan Ganda Beralasan HOTS, soal isian analitis, soal uraian, serta kunci jawaban dan pedoman penskoran.</span>
                  )}
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Proyek' && (
                    <span>📌 <strong>Proyek:</strong> Memuat panduan investigasi kelompok, pertanyaan pemandu (driving question), 4 tahapan proyek, jadwal, dan rubrik karya multidimensi.</span>
                  )}
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Portofolio' && (
                    <span>📌 <strong>Portofolio:</strong> Memuat panduan kurasi 4 artefak karya, lembar refleksi metakognitif mandiri siswa, serta rubrik evaluasi perkembangan belajar.</span>
                  )}
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Observasi' && (
                    <span>📌 <strong>Observasi:</strong> Memuat indikator perilaku bernalar kritis, gotong royong, kemandirian, dan tanggung jawab, lembar ceklis skala 1-4, serta jurnal anekdot.</span>
                  )}
                  {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Diri / Antarteman' && (
                    <span>📌 <strong>Penilaian Diri / Teman:</strong> Memuat lembar refleksi diri (skala 1-4), evaluasi tim antarteman yang saling memajukan, serta kartu apresiasi sahabat.</span>
                  )}
                </div>

                {/* AI Generation action & quick pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingNaskahInForm}
                    onClick={() => handleGenerateNaskahInForm()}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-50"
                  >
                    {isGeneratingNaskahInForm ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyusun Naskah AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Susun Naskah Asesmen (AI)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-1 flex-wrap gap-1 text-[10px]">
                    <span className="font-semibold text-indigo-900">Fokus:</span>
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Kinerja' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Praktik alat sederhana & rubrik 4 tingkatan')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Praktik Sederhana
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Fokus ketelitian prosedur & keselamatan kerja')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Ketelitian Prosedur
                        </button>
                      </>
                    )}
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Tes Tertulis' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('5 Soal Pilihan Ganda HOTS beralasan dan 2 Soal Uraian Studi Kasus')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + 5 PG HOTS & 2 Esai
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Stimulus fenomena kontekstual lingkungan sekitar')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Stimulus Kontekstual
                        </button>
                      </>
                    )}
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Proyek' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Panduan proyek 3 pekan dengan produk infografik atau prototipe')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Panduan 3 Pekan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Driving question menantang pemecahan masalah nyata')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Driving Question
                        </button>
                      </>
                    )}
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Portofolio' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Kurasi 4 karya artefak belajar dan lembar refleksi metakognitif')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Kurasi 4 Artefak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Lembar refleksi kemajuan belajar siswa')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Refleksi Kemajuan
                        </button>
                      </>
                    )}
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Observasi' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Fokus pada nalar kritis, gotong royong, dan catatan anekdot')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + 4 Dimensi Sikap
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Format catatan jurnal anekdot guru')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Catatan Anekdot
                        </button>
                      </>
                    )}
                    {normalizeBentukAsesmen(editingAsesmen.bentukAsesmen) === 'Diri / Antarteman' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Pernyataan refleksi diri 1-4 dan kartu apresiasi antarteman')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Refleksi 1-4 & Apresiasi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateNaskahInForm('Umpan balik konstruktif antarteman kelompok')}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700"
                        >
                          + Umpan Balik Tim
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Textarea Editor */}
                {showNaskahEditorInForm && (
                  <div className="pt-2">
                    <label className="block font-semibold mb-1 text-[11px] text-slate-700">
                      Isi Naskah Asesmen (Markdown):
                    </label>
                    <textarea
                      rows={8}
                      value={editingAsesmen.naskahAsesmen || ''}
                      onChange={(e) =>
                        setEditingAsesmen({
                          ...editingAsesmen,
                          naskahAsesmen: e.target.value,
                        })
                      }
                      placeholder="Naskah asesmen akan tampil di sini..."
                      className="w-full p-2.5 font-mono text-[11px] border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAsesmenModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">
                  Simpan Asesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Naskah Asesmen Siap Cetak & PDF */}
      {isNaskahModalOpen && selectedNaskahItem && (
        <NaskahAsesmenModal
          item={selectedNaskahItem}
          profile={profile}
          isOpen={isNaskahModalOpen}
          onClose={() => {
            setIsNaskahModalOpen(false);
            setSelectedNaskahItem(null);
          }}
          onSaveNaskah={handleSaveNaskahFromModal}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
