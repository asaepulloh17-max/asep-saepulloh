/**
 * GURU SMART ADMIN - Data Models & Interfaces
 * Designed according to Permendikdasmen No. 13 Tahun 2025 & Kepmendikdasmen No. 126/P/2025
 */

export interface TeacherProfile {
  id?: string;
  namaGuru: string;
  nip: string;
  nuptk?: string;
  mataPelajaran: string;
  namaSekolah: string;
  npsn?: string;
  logoSekolahUrl?: string;
  alamatSekolah: string;
  tahunPelajaran: string;
  semesterAktif: 'Ganjil' | 'Genap';
  fase: string;
  kelasList: string[];
  kelasAktif: string;
  kktpDefault: number;
  alokasiWaktuDefault?: string;
  updatedAt?: string;
  kepalaSekolah: {
    nama: string;
    nip: string;
  };
}

export interface IdentitasPembelajaran {
  namaSekolah: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  semester: 'Ganjil' | 'Genap';
  tahunPelajaran: string;
  alokasiWaktu: string;
  topikMateri: string;
  pertemuanKe?: number;
}

export interface LKPDRubrikItem {
  aspek: string;
  baruBerkembang: string;
  layak: string;
  cakap: string;
  mahir: string;
}

export interface LKPDData {
  id: string;
  perencanaId: string;
  judulLKPD: string;
  topikMateri: string;
  alokasiWaktu: string;
  petunjukUmum: string;
  aktivitasMindfulAwal: string; // Pembiasaan Berkesadaran awal
  faseMemahami: {
    stimulusWacana: string; // Teks stimulus fenomena / studi kasus nyata
    pertanyaanEksplorasi: string[]; // 2-3 pertanyaan analitis & pemantik konsep
  };
  faseMengaplikasi: {
    langkahKerja: string[]; // Langkah kerja investigasi / eksperimen / penugasan
    alatBahan: string[]; // Alat dan bahan
    tabelPengamatan: {
      judulTabel: string;
      kolom: string[];
      barisPanduan?: string[];
    };
    tugasPemecahanMasalah: string; // Instruksi tantangan masalah nyata (HOTS)
  };
  faseMerefleksi: {
    pertanyaanRefleksi: string[]; // Pertanyaan refleksi proses & perasaan belajar (Joyful)
    kesimpulanBersama: string; // Panduan penarikan kesimpulan
    rencanaAksiNyata: string; // Komitmen tindak lanjut kontekstual
  };
  rubrikPenilaian: LKPDRubrikItem[];
  catatanGuru?: string;
  updatedAt: string;
}

export type KategoriMediaPembelajaran =
  | 'Visual'
  | 'Audio'
  | 'Audiovisual'
  | 'Multimedia-Interaktif';

export type KategoriMediaUtama =
  | 'Audio'
  | 'Visual'
  | 'Audiovisual'
  | 'Interaktif';

export interface SlidePPTItem {
  nomorSlide: number;
  judulSlide: string;
  poinMateri: string[];
  visualPrompt: string; // Deskripsi rancangan grafis/diagram/gambar slide
  catatanGuru: string;  // Naskah narasi penjelasan lisan guru
}

export interface SceneVideoItem {
  sceneKe: number;
  durasi: string;
  visualScene: string; // Tampilan video (animasi, demonstrasi, grafis)
  audioNarasi: string; // Suara pengisi narasi atau dialog
  teksDiLayar: string; // On-screen text & teks penjelas
}

// 8 Kolom Storyboard Video Resmi
export interface StoryboardVideoRow {
  no: number;
  durasi: string;
  adegan: string;
  visual: string;
  narasi: string;
  teksLayar: string;
  audio: string;
  interaksi: string;
}

// Struktur Halaman Media Interaktif
export interface InteractivePageItem {
  noHalaman: number;
  judulHalaman: string;
  tipeAktivitas: 'Eksplorasi Konsep' | 'Kuis HOTS' | 'Matching / Drag & Drop' | 'Simulasi Kasus' | 'Refleksi Diri';
  instruksi: string;
  pertanyaan?: string;
  opsiJawaban?: { label: string; teks: string; isBenar: boolean; feedback: string }[];
  umpanBalikBenar?: string;
  umpanBalikSalah?: string;
  navigasi: string;
}

// Analisis AI Kebutuhan Media
export interface MediaAnalisisAI {
  karakteristikMateri: string;
  tingkatAbstraksi: 'Rendah (Konkret)' | 'Sedang' | 'Tinggi (Abstrak)';
  kebutuhanVisualisasi: string;
  kebutuhanAudio: string;
  kebutuhanDemonstrasi: string;
  kebutuhanInteraktivitas: string;
  analisisBebanKognitif: string;
  rekomendasiStrategi: string;
}

// 5 Rekomendasi Media dari AI
export interface MediaRekomendasiItem {
  id: string;
  namaMedia: string;
  kategori: KategoriMediaUtama;
  jenisMedia: string; // narasi, podcast, infografis, video animasi, kuis, simulasi, dll.
  tujuan: string;
  alasanKesesuaian: string;
  durasi: string;
  tingkatInteraktivitas: 'Rendah' | 'Sedang' | 'Tinggi' | 'Eksploratif';
  outputYangDibuat: string;
  kecocokanProfilLulusan?: string[];
}

// Kontrol Guru terhadap Media
export interface MediaKontrolGuru {
  jenisMedia: string;
  kategori: KategoriMediaUtama;
  gayaVisual: string;
  tingkatKompleksitas: 'Dasar / Pemula' | 'Menengah / Standar' | 'Mahir / HOTS Mendalam';
  durasi: string;
  bahasa: string;
  orientasiUkuran: string;
  sasaranPenggunaan: string;
  instruksiKhusus: string;
}

// Rancangan Media (Sebelum Produksi)
export interface MediaRancanganData {
  judul: string;
  tujuanPembelajaran: string;
  materi: string;
  subMateri?: string;
  sasaranPesertaDidik: string;
  strukturMedia: string;
  urutanIsi: string[];
  visual: string;
  narasi: string;
  aktivitasInteraksi: string;
  pertanyaanPemantik: string[];
  evaluasi: string;
  durasi: string;
  storyboard?: StoryboardVideoRow[];
  strukturInteraktif?: InteractivePageItem[];
}

// Konten Hasil Produksi Media
export interface MediaProdukData {
  naskahAudio?: string;
  desainVisual?: string;
  promptGambar?: string[];
  scriptVideo?: string;
  storyboardText?: string;
  subtitle?: string;
  strukturMediaInteraktifText?: string;
  soalDanFeedback?: { nomor: number; soal: string; opsi: string[]; kunci: string; pembahasan: string }[];
  materiSiapGunakan: string;
  markdownLengkap: string;
  slidesPPT?: SlidePPTItem[];
}

export type MediaLibraryStatus =
  | 'Draft'
  | 'Rancangan'
  | 'Disetujui'
  | 'Diproduksi'
  | 'Revisi'
  | 'Final';

// Data Model Library Media Lengkap
export interface MediaRecord {
  id: string;
  guru: string;
  mataPelajaran: string;
  kelasFase: string;
  rppId?: string;
  rppJudul: string;
  tujuanPembelajaran: string;
  materiPokok: string;
  subMateri?: string;
  alokasiWaktu?: string;
  karakteristikPesertaDidik?: string;
  modelMetode?: string;
  dimensiProfilLulusan?: string[];
  kategori: KategoriMediaUtama;
  jenisMedia: string;
  judul: string;
  rancangan: MediaRancanganData;
  produkMedia?: MediaProdukData;
  versi: string;
  status: MediaLibraryStatus;
  tanggal: string;
  fileLink?: string;
  kontrolGuru?: MediaKontrolGuru;
  analisisAI?: MediaAnalisisAI;
  rekomendasiList?: MediaRekomendasiItem[];
  riwayatRevisi?: { perintah: string; waktu: string; versi: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaPembelajaranItem {
  id: string;
  kategori: KategoriMediaPembelajaran;
  jenisSpesifik: string; // e.g. "PPT Presentasi", "Infografik", "Mindmap", "Podcast Edukasi", "Video Pembelajaran", "Kuis Gamifikasi", "Simulasi PhET"
  namaMedia: string;
  alatBahanAplikasi: string; // e.g. "Canva, PPT, CapCut, Audacity, Quizizz, PhET Interactive"
  deskripsiRingkas: string;

  // Penyelarasan Kurikulum Merdeka & Pembelajaran Mendalam
  keselarasan: {
    materiPokok: string;
    tujuanPembelajaran: string;
    indikatorKetercapaian: string;
    pengalamanBelajar: {
      tahap: 'Memahami' | 'Mengaplikasi' | 'Merefleksi' | 'Semua Tahap';
      deskripsiPeran: string;
    };
    prinsipDeepLearning: {
      berkesadaran: string; // Mindful focus & atensi
      bermakna: string;     // Meaningful context & dunia nyata
      menggembirakan: string; // Joyful & kolaboratif
    };
  };

  // Naskah & panduan teknis operasional
  naskahRancanganLengkap: string; // Konten Markdown lengkap siap cetak/unduh
  slidesPPT?: SlidePPTItem[];
  storyboard?: SceneVideoItem[];

  createdAt: string;
  updatedAt: string;
}

export interface Perencanaan {
  id: string;
  judul: string;
  status: 'Draf' | 'Siap Ajar' | 'Selesai';
  identitas: IdentitasPembelajaran;
  identifikasi: {
    kesiapanAwal: string;
    karakteristikMateri: string;
    kebutuhanBelajar: string;
    dimensiProfilLulusan: string[];
  };
  tujuanPembelajaran: {
    capaianPembelajaran: string;
    tujuanPembelajaran: string;
    indikatorKetercapaian: string;
    lingkupMateri?: string;
  };
  kerangkaPembelajaran?: {
    praktikPedagogis: string;
    kemitraanPembelajaran: string;
    lingkunganPembelajaran: string;
    pemanfaatanDigital: string;
    modelMetode: string;
    sumberBelajar: string;
  };
  desainPembelajaran: {
    praktikPedagogis: string;
    kemitraanPembelajaran: string;
    lingkunganPembelajaran: string;
    pemanfaatanDigital: string;
    modelMetode: string;
    sumberBelajar: string;
  };
  pengalamanBelajar: {
    memahami: string;
    mengaplikasi: string;
    merefleksi: string;
  };
  prinsipPembelajaranMendalam: {
    berkesadaran: string;
    bermakna: string;
    menggembirakan: string;
  };
  rencanaKegiatan: {
    pendahuluan: string;
    durasiPendahuluan: string;
    kegiatanInti: string;
    durasiInti: string;
    penutup: string;
    durasiPenutup: string;
  };
  rencanaAsesmen: {
    asesmenAwal: string;
    asesmenProses: string;
    asesmenAkhir: string;
    teknikAsesmen: string;
    instrumenAsesmen: string;
    kriteriaKetercapaian: string;
  };
  pemahamanBermakna?: string;
  pertanyaanPemantik?: string[];
  lkpd?: LKPDData;
  mediaPembelajaranList?: MediaPembelajaranItem[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JurnalMengajar {
  id: string;
  perencanaId?: string;
  pertemuanKe: number;
  tanggal: string;
  kelas: string;
  mataPelajaran: string;
  jamPelajaran: string;
  jamKe?: string;
  topikMateri: string;
  tujuanPembelajaran: string;
  kegiatanTerlaksana: string;
  pengalamanBelajar: {
    memahami: boolean;
    mengaplikasi: boolean;
    merefleksi: boolean;
    catatan?: string;
  };
  pengalamanTerlaksana: {
    memahami: boolean;
    mengaplikasi: boolean;
    merefleksi: boolean;
  };
  penerapanMendalam: {
    berkesadaran: boolean;
    bermakna: boolean;
    menggembirakan: boolean;
    catatan?: string;
  };
  prinsipTerlaksana: {
    berkesadaran: boolean;
    bermakna: boolean;
    menggembirakan: boolean;
  };
  kehadiran: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    siswaAbsen?: string[];
  };
  presensi: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    siswaAbsen?: string[];
  };
  catatanKendala: string;
  kendala?: string;
  catatanKejadian?: string;
  tindakLanjut: string;
  solusiTindakan?: string;
  refleksiGuru: string;
  statusKetercapaian: string;
  status: 'Terlaksana' | 'Ditunda' | 'Diganti' | 'Draf';
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PesertaDidik {
  id: string;
  nis?: string;
  nisn?: string;
  nama: string;
  kelas: string;
  jenisKelamin?: 'L' | 'P';
  isDemo?: boolean;
}

export interface RencanaAsesmenItem {
  id: string;
  perencanaId?: string;
  mataPelajaran?: string;
  judulAsesmen: string;
  topikMateri?: string;
  kelas: string;
  tujuanPembelajaran: string;
  jenisAsesmen: 'Diagnostik/Awal' | 'Formatif' | 'Sumatif';
  bentukAsesmen?: 'Kinerja' | 'Tes Tertulis' | 'Proyek' | 'Portofolio' | 'Observasi' | 'Diri / Antarteman' | string;
  jumlahSoal?: number; // Pilihan butir soal untuk tes tertulis (5, 10, 15, 20, 25, 30)
  teknikAsesmen: string;
  instrumenAsesmen?: string;
  instrumen?: string;
  kriteriaKeberhasilan?: string;
  kriteriaKetercapaian: {
    baruBerkembang: string;
    layak: string;
    cakap: string;
    mahir: string;
  };
  waktuPelaksanaan: string;
  kktpTarget?: number;
  naskahAsesmen?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NilaiSiswa {
  id: string;
  asesmenId: string;
  siswaId: string;
  namaSiswa: string;
  nisn?: string;
  kelas: string;
  nilaiAngka: number;
  catatanDeskripsi: string;
  statusKetercapaian: 'Tercapai' | 'Belum Terpenuhi' | 'Belum Tercapai';
  nilai?: number;
  catatanGuru?: string;
  statusTercapai?: boolean;
  isDemo?: boolean;
  updatedAt: string;
}

export interface TindakLanjutData {
  id: string;
  asesmenId: string;
  topikMateri: string;
  kelas: string;
  kktpTarget: number;
  programRemedial: {
    daftarSiswa: string[];
    materiPengulangan: string;
    bentukKegiatan: string;
    jadwalPelaksanaan: string;
  };
  programPengayaan: {
    daftarSiswa: string[];
    materiPengayaan: string;
    bentukKegiatan: string;
    jadwalPelaksanaan: string;
  };
  catatanHasil: string;
  updatedAt: string;
}

export interface RefleksiEvaluasiData {
  id: string;
  asesmenId: string;
  topikMateri: string;
  kelas: string;
  apaYangBerjalanEfektif: string;
  apaYangBelumBerhasil: string;
  responPesertaDidik: string;
  rencanaPerbaikan: string;
  updatedAt: string;
}

export interface TindakLanjutRecord {
  id: string;
  asesmenId?: string;
  siswaId?: string;
  namaSiswa: string;
  kelas: string;
  tipeTindakLanjut: 'Remedial' | 'Pengayaan' | 'Pendampingan Khusus';
  topikMateri: string;
  strategiPerbaikan: string;
  jadwal: string;
  status: 'Direncanakan' | 'Sedang Berlangsung' | 'Selesai';
  catatanHasil: string;
  nilaiAkhir?: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefleksiPembelajaranRecord {
  id: string;
  jurnalId?: string;
  perencanaId?: string;
  kelas: string;
  mataPelajaran: string;
  tanggal: string;
  topikMateri: string;
  apaYangBerjalanBaik: string;
  apaYangBelumBerjalanBaik: string;
  bagaimanaKeterlibatanSiswa: string;
  apakahPembelajaranBermakna: string;
  apaBuktiPemahamanSiswa: string;
  apaYangPerluDiperbaiki: string;
  rencanaBerikutnya: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'profil'
  | 'perencanaan'
  | 'pelaksanaan'
  | 'media-pembelajaran'
  | 'evaluasi'
  | 'laporan'
  | 'pengaturan';

/**
 * EduGenius - Multimodal Socratic Interactive Media Data Models
 */
export interface EduGeniusInteractiveOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  explanation?: string;
  nextClue?: string;
}

export interface EduGeniusInteractiveElement {
  type: 'quiz' | 'scenarios';
  questionOrPrompt: string;
  options: EduGeniusInteractiveOption[];
}

export interface EduGeniusVisualRecommendation {
  title: string;
  description: string;
  promptText: string;
  layoutDescription?: string;
}

export interface EduGeniusMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  image?: {
    url: string;
    mimeType: string;
    caption?: string;
    analysis?: string;
  };
  audioIntonation?: string; // e.g. "(dengan nada ceria dan ramah)"
  visualRecommendation?: EduGeniusVisualRecommendation;
  interactiveElement?: EduGeniusInteractiveElement;
  difficultyLevel?: 'dasar' | 'menengah' | 'mahir';
  selectedOptionId?: string;
  isAudioPlaying?: boolean;
}

export interface EduGeniusRPPContext {
  rppId: string;
  topikMateri: string;
  mataPelajaran: string;
  kelas: string;
  fase: string;
  alokasiWaktu?: string;
  tujuanPembelajaran: string;
  indikatorKetercapaian?: string;
  pemahamanBermakna?: string;
  pertanyaanPemantik?: string[];
  pengalamanBelajar?: {
    memahami?: string;
    mengaplikasi?: string;
    merefleksi?: string;
  };
  rencanaAsesmen?: {
    asesmenAwal?: string;
    asesmenProses?: string;
    asesmenAkhir?: string;
  };
  profilLulusan?: string[];
}

export interface EduGeniusSession {
  id: string;
  mapel: string;
  kelas: string;
  topik: string;
  level: 'dasar' | 'menengah' | 'mahir';
  rppContext?: EduGeniusRPPContext;
  messages: EduGeniusMessage[];
  createdAt: string;
  updatedAt: string;
}

export type EvaluasiSubTab =
  | 'rencana'
  | 'nilai'
  | 'analisis'
  | 'tindak-lanjut'
  | 'refleksi';

/**
 * 8 Dimensi Profil Lulusan Terbaru
 */
export interface DimensiProfilLulusanItem {
  nomor: number;
  id: string;
  nama: string;
  deskripsi: string;
}

export const DAFTAR_DIMENSI_PROFIL_LULUSAN: DimensiProfilLulusanItem[] = [
  {
    nomor: 1,
    id: 'keimanan-ketakwaan',
    nama: 'Keimanan dan Ketakwaan',
    deskripsi: 'Memiliki akhlak mulia dan menjalankan ajaran agama.',
  },
  {
    nomor: 2,
    id: 'kewargaan',
    nama: 'Kewargaan',
    deskripsi: 'Cinta tanah air dan bertanggung jawab terhadap lingkungan sosial.',
  },
  {
    nomor: 3,
    id: 'penalaran-kritis',
    nama: 'Penalaran Kritis',
    deskripsi: 'Berpikir logis dan menganalisis informasi untuk pemecahan masalah.',
  },
  {
    nomor: 4,
    id: 'kreativitas',
    nama: 'Kreativitas',
    deskripsi: 'Menghasilkan ide orisinal dan solusi inovatif.',
  },
  {
    nomor: 5,
    id: 'kolaborasi',
    nama: 'Kolaborasi',
    deskripsi: 'Bekerja sama secara efektif dan bergotong-royong.',
  },
  {
    nomor: 6,
    id: 'kemandirian',
    nama: 'Kemandirian',
    deskripsi: 'Berinisiatif dan bertanggung jawab atas proses belajar sendiri.',
  },
  {
    nomor: 7,
    id: 'kesehatan',
    nama: 'Kesehatan',
    deskripsi: 'Menjaga kebugaran fisik serta kesejahteraan mental (well-being).',
  },
  {
    nomor: 8,
    id: 'komunikasi',
    nama: 'Komunikasi',
    deskripsi: 'Menyampaikan informasi secara efektif baik lisan maupun tulis.',
  },
];

export const DIMENSI_PROFIL_NAMES = DAFTAR_DIMENSI_PROFIL_LULUSAN.map((d) => d.nama);

export function normalizeDimensiProfilName(dim: string): string {
  if (!dim) return '';
  const trimmed = dim.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('iman') || lower.includes('takwa') || lower.includes('akhlak')) {
    return 'Keimanan dan Ketakwaan';
  }
  if (lower.includes('kebinekaan') || lower.includes('warga') || lower.includes('tanah air')) {
    return 'Kewargaan';
  }
  if (lower.includes('nalar') || lower.includes('kritis') || lower.includes('logis')) {
    return 'Penalaran Kritis';
  }
  if (lower.includes('kreatif') || lower.includes('kreativitas') || lower.includes('inovasi')) {
    return 'Kreativitas';
  }
  if (lower.includes('gotong') || lower.includes('royong') || lower.includes('kolaborasi') || lower.includes('kerja sama')) {
    return 'Kolaborasi';
  }
  if (lower.includes('mandiri') || lower.includes('kemandirian') || lower.includes('inisiatif')) {
    return 'Kemandirian';
  }
  if (lower.includes('sehat') || lower.includes('kesehatan') || lower.includes('kebugaran') || lower.includes('mental') || lower.includes('well-being')) {
    return 'Kesehatan';
  }
  if (lower.includes('komunikasi') || lower.includes('lisan') || lower.includes('bicara') || lower.includes('presentasi')) {
    return 'Komunikasi';
  }

  // Exact match if already one of the 8
  const found = DAFTAR_DIMENSI_PROFIL_LULUSAN.find(
    (d) => d.nama.toLowerCase() === lower
  );
  if (found) return found.nama;

  return trimmed;
}

