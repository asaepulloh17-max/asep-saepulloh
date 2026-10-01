import {
  Perencanaan,
  JurnalMengajar,
  RencanaAsesmenItem,
  TindakLanjutData,
  RefleksiEvaluasiData,
  LKPDData,
  TeacherProfile,
  MediaPembelajaranItem,
  KategoriMediaPembelajaran,
} from '../types';

export type AITaskType =
  | 'tujuan_pembelajaran'
  | 'aktivitas_mendalam'
  | 'pertanyaan_pemantik'
  | 'asesmen_formatif'
  | 'rubrik_penilaian'
  | 'refleksi_guru'
  | 'analisis_hasil_belajar'
  | 'tindak_lanjut'
  | 'perencanaan_lengkap'
  | 'jurnal_lengkap';

export interface AIRequestPayload {
  taskType: AITaskType;
  mapel: string;
  kelas: string;
  topik: string;
  konteksTambahan?: string;
  kktp?: number;
  dataTambahan?: any;
}

export interface AIResponseResult {
  text: string;
  isRealAI: boolean;
  modelLabel: string;
  catatan: string;
}

// Call backend server Gemini API
async function callServerAI(prompt: string, systemInstruction?: string): Promise<{ text: string; isReal: boolean; model?: string } | null> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return { text: data.text, isReal: !data.isFallback, model: data.model };
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
  return null;
}

function extractJSON<T>(text: string): T | null {
  try {
    // Try directly parsing
    return JSON.parse(text);
  } catch {
    // Try finding ```json ... ``` block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // continue
      }
    }
    // Try finding { ... } boundary
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch {
        // ignore
      }
    }
  }
  return null;
}

// Generic assistant query
export async function requestAIAssistant(payload: AIRequestPayload): Promise<AIResponseResult> {
  const prompt = buildPrompt(payload);
  const result = await callServerAI(prompt);

  if (result && result.text) {
    return {
      text: result.text,
      isRealAI: result.isReal,
      modelLabel: result.model ? `Gemini (${result.model})` : 'Gemini AI (Server-Side)',
      catatan: 'Hasil dirancang oleh AI Gemini berdasarkan pendekatan Pembelajaran Mendalam.',
    };
  }

  // Graceful standard pedagogical generator fallback
  const fallbackText = generateCuratedPedagogicalTemplate(payload);
  return {
    text: fallbackText,
    isRealAI: false,
    modelLabel: 'Template Terstandar Pembelajaran Mendalam (Mode Terkurasi)',
    catatan: 'Hasil dirumuskan menggunakan kerangka kurikulum standar. Guru dapat memeriksa dan menyesuaikan sesuai konteks kelas.',
  };
}

// ============================================================================
// 1. ASISTEN AI UNTUK PERENCANAAN PEMBELAJARAN (MODUL AJAR / RPP)
// ============================================================================

/**
 * Regulatory Hierarchy Helpers according to national standards
 */
export function isPendidikanAgama(mapel: string = ''): boolean {
  const m = mapel.toLowerCase();
  return (
    m.includes('agama') ||
    m.includes('pai') ||
    m.includes('islam') ||
    m.includes('kristen') ||
    m.includes('katolik') ||
    m.includes('hindu') ||
    m.includes('buddha') ||
    m.includes('khonghucu')
  );
}

export function getRegulatoryHierarchy(mapel: string = '') {
  const isAgama = isPendidikanAgama(mapel);
  const cpRef = isAgama
    ? 'Keputusan Kepala Badan Kebijakan Pengembangan Sumber Daya Manusia Pendidikan dan Kebudayaan (Kepka BKPDM) / Kepala Badan Pendidikan Dasar & Menengah Nomor 020 Tahun 2026 (Revisi terbatas atas No. 046/H/KR/2025)'
    : 'Keputusan Kepala BSKAP No. 046/H/KR/2025';

  const promptGuidance = `
HIERARKI REGULASI SEBAGAI RUJUKAN PEDOMAN INTERNAL AI:
1. Standar Kompetensi Lulusan (SKL) - Permendikdasmen No. 10 Tahun 2025 (Goal akhir kompetensi murid, karakter holistik, dan dimensi profil kelulusan).
2. Standar Isi - Permendikdasmen No. 12 Tahun 2025 (Ruang lingkup materi pokok esensial, mendalam, menghindari kurikulum padat hafalan).
3. Capaian Pembelajaran (CP) - ${cpRef} (Target kompetensi per fase/elemen). ${
    isAgama
      ? 'Catatan Khusus: Mapel Pendidikan Agama merujuk Kepka BKPDM / Kabadan Dikdasmen No. 020 Tahun 2026 sebagai revisi terbatas resmi dari 046/H/KR/2025.'
      : ''
  }
4. Standar Proses - Permendikdasmen No. 1 Tahun 2026 (Mekanisme penyusunan yang fleksibel, jelas, sederhana, interaktif, menyenangkan, menantang, berpusat pada murid, serta mengutamakan asesmen formatif).
5. Pembelajaran Mendalam - Permendikdasmen No. 13 Tahun 2025 & Kepmendikdasmen No. 126/P/2025 (3 Pengalaman: Memahami, Mengaplikasi, Merefleksi; 3 Pilar: Berkesadaran, Bermakna, Menggembirakan).

ATURAN PENTING OUTPUT DOKUMEN (WAJIB DIPATUHI):
- Regulasi dan dasar hukum di atas HANYA sebagai acuan internal Anda dalam mengukur standar kualitas, kedalaman materi, orientasi kompetensi, dan instrumen asesmen.
- JANGAN PERNAH menuliskan, mencantumkan, atau menyebutkan nomor regulasi, nomor surat keputusan, nama peraturan, atau pasal (seperti 'Permendikdasmen No. ...', 'BSKAP No. ...', 'Kepka BKPDM No. ...', 'Kepmendikdasmen No. ...') di dalam kalimat hasil output dokumen (RPP, RPM, LKPD, rubrik, tujuan pembelajaran, atau kegiatan).
- Tuliskan isi dokumen secara bersih, substansial, profesional, dan langsung berfokus pada materi dan kegiatan nyata bagi guru dan siswa.
`;

  return {
    isAgama,
    skl: 'Standar Kompetensi Lulusan (SKL) - Permendikdasmen No. 10 Tahun 2025',
    standarIsi: 'Standar Isi - Permendikdasmen No. 12 Tahun 2025',
    cp: cpRef,
    standarProses: 'Standar Proses - Permendikdasmen No. 1 Tahun 2026',
    promptGuidance,
  };
}

export interface GeneratePerencanaanParams {
  mapel: string;
  kelas: string;
  topik: string;
  alokasiWaktu?: string;
  kktp?: number;
}

export async function generatePerencanaanWithAI(
  params: GeneratePerencanaanParams
): Promise<Partial<Perencanaan>> {
  const reg = getRegulatoryHierarchy(params.mapel);
  const prompt = `Anda adalah pakar perancang modul ajar Kurikulum Merdeka SMP Fase D.
${reg.promptGuidance}

Topik/Materi: ${params.topik}
Mata Pelajaran: ${params.mapel}
Kelas: ${params.kelas}
Alokasi Waktu: ${params.alokasiWaktu || '2 x 40 menit (1 Pertemuan)'}
KKTP Target: ${params.kktp || 75}

PANDUAN PENYUSUNAN SESUAI HIERARKI REGULASI:
- SKL Permendikdasmen No. 10/2025: Rumuskan dimensi profil kelulusan yang terarah pada goal akhir kompetensi murid dari 8 Dimensi Profil Lulusan (1. Keimanan dan Ketakwaan, 2. Kewargaan, 3. Penalaran Kritis, 4. Kreativitas, 5. Kolaborasi, 6. Kemandirian, 7. Kesehatan, 8. Komunikasi).
- Standar Isi Permendikdasmen No. 12/2025: Fokuskan lingkup materi pada konsep esensial yang bermakna.
- Capaian Pembelajaran: ${reg.cp} sebagai target kompetensi per fase/elemen.
- Standar Proses Permendikdasmen No. 1/2026: Desain proses fleksibel, interaktif, berpusat pada murid, dan utamakan asesmen formatif.

Buatkan draf Perencanaan Pembelajaran terstruktur dan mendalam dalam format JSON murni TANPA teks pengantar lain.
Gunakan skema JSON berikut:
{
  "judul": "Modul Ajar: [Judul Pembelajaran Menarik]",
  "identifikasi": {
    "kesiapanAwal": "Deskripsi kesiapan awal peserta didik terkait materi ini",
    "karakteristikMateri": "Kontekstual, membutuhkan eksplorasi dan diskusi pemecahan masalah",
    "kebutuhanBelajar": "Variasi media visual, bimbingan kelompok bertahap, dan pengayaan aplikatif",
    "dimensiProfilLulusan": ["Penalaran Kritis", "Kolaborasi", "Kemandirian"]
  },
  "tujuanPembelajaran": {
    "capaianPembelajaran": "Peserta didik memahami konsep dasar dan penerapan ${params.topik}...",
    "tujuanPembelajaran": "1. Peserta didik mampu mengidentifikasi dan memahami konsep ${params.topik} secara kritis.\\n2. Peserta didik mampu mengaplikasikan prosedur penyelidikan secara kolaboratif.\\n3. Peserta didik mampu merefleksikan manfaat pembelajaran dalam kehidupan sehari-hari.",
    "indikatorKetercapaian": "Kriteria ketercapaian dan bukti pemahaman terukur",
    "lingkupMateri": "${params.topik}"
  },
  "desainPembelajaran": {
    "praktikPedagogis": "Pembelajaran Berbasis Masalah (Problem Based Learning) dan inkuiri terbimbing",
    "kemitraanPembelajaran": "Diskusi kelompok heterogen & tutor sebaya",
    "lingkunganPembelajaran": "Ruang kelas kolaboratif, laboratorium, atau lingkungan sekolah",
    "pemanfaatanDigital": "Media presentasi interaktif dan kuis digital formatif",
    "modelMetode": "Diskusi kelompok, observasi langsung, presentasi galeri belajar",
    "sumberBelajar": "Buku teks utama, lembar kerja peserta didik (LKPD), bahan lingkungan nyata"
  },
  "pengalamanBelajar": {
    "memahami": "Mengamati fenomena kontekstual, membaca modul terarah, dan menganalisis fakta inti konsep ${params.topik}.",
    "mengaplikasi": "Melakukan eksperimen sederhana/diskusi studi kasus dan menyusun solusi nyata bersama kelompok.",
    "merefleksi": "Menyimpulkan intisari pembelajaran, mengisi tiket keluar reflektif, dan merumuskan komitmen tindakan."
  },
  "prinsipPembelajaranMendalam": {
    "berkesadaran": "Jeda hening mindful check-in di awal untuk memusatkan fokus dan kesiapan belajar.",
    "bermakna": "Mengaitkan konsep ${params.topik} dengan permasalahan nyata yang dialami siswa di rumah/lingkungan.",
    "menggembirakan": "Aktivitas tantangan interaktif yang memicu rasa ingin tahu, antusiasme, dan apresiasi positif."
  },
  "rencanaKegiatan": {
    "durasiPendahuluan": "10 menit",
    "pendahuluan": "1. Sapaan ramah, doa bersama, dan presensi berkesadaran.\\n2. Apersepsi kontekstual dan pertanyaan pemantik seputar ${params.topik}.\\n3. Menyampaikan tujuan belajar dan kriteria keberhasilan.",
    "durasiInti": "60 menit",
    "kegiatanInti": "1. Tahap Memahami (20 menit): Observasi materi pemantik dan diskusi awal berpasangan.\\n2. Tahap Mengaplikasi (30 menit): Penyelidikan kelompok menggunakan LKPD kontekstual dengan pendampingan guru.\\n3. Tahap Berbagi & Merefleksi (10 menit): Galeri presentasi singkat antar kelompok.",
    "durasiPenutup": "10 menit",
    "penutup": "1. Siswa merangkum simpulan pembelajaran dipandu guru.\\n2. Mengisi tiket keluar reflektif.\\n3. Umpan balik apresiatif dan doa penutup."
  },
  "rencanaAsesmen": {
    "asesmenAwal": "Tanya jawab diagnostik pemahaman awal ${params.topik}",
    "asesmenProses": "Observasi keaktifan diskusi dan rubrik kinerja LKPD",
    "asesmenAkhir": "Tes formatif pemahaman konsep dan lembar refleksi mandiri",
    "teknikAsesmen": "Observasi kinerja, tes tertulis, dan penilaian portofolio",
    "instrumenAsesmen": "Lembar observasi profil, rubrik penilaian, dan butir soal kuis",
    "kriteriaKetercapaian": "Peserta didik mencapai KKTP jika mencapai skor minimal ${params.kktp || 75} pada rubrik ketercapaian."
  }
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<Partial<Perencanaan>>(res.text);
    if (parsed && parsed.judul && parsed.tujuanPembelajaran) {
      return parsed;
    }
  }

  // Fallback template
  return {
    judul: `Modul Ajar: Pembelajaran Mendalam ${params.topik}`,
    identifikasi: {
      kesiapanAwal: `Sebagian peserta didik telah memiliki gambaran umum mengenai fenomena seputar ${params.topik}, namun memerlukan penguatan konsep mendalam.`,
      karakteristikMateri: 'Konseptual dan kontekstual, membutuhkan visualisasi serta penyelidikan terarah.',
      kebutuhanBelajar: 'Pendampingan berjenjang (scaffolding), media infografis, dan aktivitas interaktif.',
      dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'],
    },
    tujuanPembelajaran: {
      capaianPembelajaran: `Peserta didik mampu memahami, menganalisis, dan mengaplikasikan konsep ${params.topik} dalam kehidupan sehari-hari dengan bernalar kritis.`,
      tujuanPembelajaran: `1. Peserta didik dapat menganalisis konsep inti ${params.topik} secara logis dan runtut.\n2. Peserta didik dapat mempraktikkan penyelidikan dan pemecahan masalah kontekstual secara gotong royong.\n3. Peserta didik mampu merefleksikan nilai kebermaknaan pembelajaran bagi diri dan lingkungan.`,
      indikatorKetercapaian: `Ketepatan analisis konsep, partisipasi aktif kerja tim, dan ketuntasan tugas LKPD minimal skor ${params.kktp || 75}.`,
      lingkupMateri: params.topik,
    },
    desainPembelajaran: {
      praktikPedagogis: 'Pembelajaran Berbasis Masalah (Problem-Based Learning) terpadu inkuiri kontekstual.',
      kemitraanPembelajaran: 'Kerja kelompok heterogen dan saling berbagi peran (tutor sebaya).',
      lingkunganPembelajaran: 'Ruang kelas dinamis dan ramah anak, akses lingkungan sekitar sekolah.',
      pemanfaatanDigital: 'Media slide presentasi, kuis interaktif, dan lembar kerja digital mandiri.',
      modelMetode: 'Observasi, diskusi terarah, studi kasus, presentasi dan refleksi terbimbing.',
      sumberBelajar: 'Buku teks utama Kemendikbudristek, lembar kerja terstruktur, lingkungan sekitar.',
    },
    pengalamanBelajar: {
      memahami: `Mengamati fenomena nyata, merumuskan rasa ingin tahu, dan mengonstruksi pemahaman konsep ${params.topik}.`,
      mengaplikasi: `Menerapkan konsep dalam diskusi studi kasus, melakukan simulasi terarah, dan menyusun laporan kelompok.`,
      merefleksi: `Meninjau kembali proses belajar, mengidentifikasi kekuatan dan kendala diri, serta merumuskan makna pembelajaran.`,
    },
    prinsipPembelajaranMendalam: {
      berkesadaran: 'Pemusatan perhatian mindful check-in di awal agar peserta didik hadir utuh dalam proses belajar.',
      bermakna: `Menghubungkan konsep ${params.topik} langsung dengan pengalaman nyata siswa di lingkungan sekitar.`,
      menggembirakan: 'Menciptakan suasana belajar kolaboratif yang interaktif, apresiatif, dan tanpa rasa takut salah.',
    },
    rencanaKegiatan: {
      durasiPendahuluan: '10 menit',
      pendahuluan: `1. Sapaan hangat guru, doa bersama, dan presensi berkesadaran.\n2. Apersepsi kontekstual dan pertanyaan pemantik seputar ${params.topik}.\n3. Penyampaian tujuan belajar dan kriteria keberhasilan bersama.`,
      durasiInti: '60 menit',
      kegiatanInti: `1. Tahap Memahami (20 menit): Eksplorasi konsep terarah dan identifikasi masalah pokok.\n2. Tahap Mengaplikasi (30 menit): Penyelidikan kelompok menyelesaikan LKPD berbasis studi kasus kontekstual.\n3. Tahap Berbagi (10 menit): Galeri presentasi kilat antar kelompok dengan umpan balik konstruktif.`,
      durasiPenutup: '10 menit',
      penutup: `1. Guru memandu peserta didik menyimpulkan esensi pembelajaran.\n2. Pengisian tiket keluar reflektif mandiri.\n3. Apresiasi keberhasilan kelas dan doa penutup.`,
    },
    rencanaAsesmen: {
      asesmenAwal: `Tanya jawab pemantik diagnostik seputar ${params.topik}`,
      asesmenProses: 'Observasi keaktifan diskusi dan rubrik unjuk kerja LKPD',
      asesmenAkhir: 'Kuis formatif singkat pemahaman materi dan asesmen diri',
      teknikAsesmen: 'Observasi, penugasan unjuk kerja, dan tes tertulis singkat',
      instrumenAsesmen: 'Rubrik penilaian kinerja kelompok dan lembar kuis',
      kriteriaKetercapaian: `Peserta didik mencapai KKTP jika memperoleh nilai minimal ${params.kktp || 75}.`,
    },
  };
}

// ============================================================================
// 1.B ASISTEN AI UNTUK SETIAP BAGIAN DARI 8 BAGIAN PERENCANAAN
// ============================================================================
export interface PerencanaanSectionParams {
  sectionNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  mapel: string;
  kelas: string;
  topik: string;
  alokasiWaktu?: string;
  kktp?: number;
  catatanKhusus?: string;
  currentData?: Partial<Perencanaan>;
}

export interface Section1IdentitasResult {
  judul: string;
  topikMateri: string;
  alokasiWaktu: string;
  ringkasanFokus?: string;
}

export interface Section2IdentifikasiResult {
  kesiapanAwal: string;
  karakteristikMateri: string;
  kebutuhanBelajar: string;
  dimensiProfilLulusan: string[];
}

export interface Section3TujuanResult {
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  indikatorKetercapaian: string;
  lingkupMateri: string;
}

export interface Section4DesainResult {
  praktikPedagogis: string;
  kemitraanPembelajaran: string;
  lingkunganPembelajaran: string;
  pemanfaatanDigital: string;
  modelMetode: string;
  sumberBelajar: string;
}

export interface Section5PengalamanResult {
  memahami: string;
  mengaplikasi: string;
  merefleksi: string;
}

export interface Section6PrinsipResult {
  berkesadaran: string;
  bermakna: string;
  menggembirakan: string;
}

export interface Section7KegiatanResult {
  durasiPendahuluan: string;
  pendahuluan: string;
  durasiInti: string;
  kegiatanInti: string;
  durasiPenutup: string;
  penutup: string;
}

export interface Section8AsesmenResult {
  asesmenAwal: string;
  asesmenProses: string;
  asesmenAkhir: string;
  teknikAsesmen: string;
  instrumenAsesmen: string;
  kriteriaKetercapaian: string;
}

export async function generatePerencanaanSectionWithAI(
  params: PerencanaanSectionParams
): Promise<any> {
  const { sectionNumber, mapel, kelas, topik, alokasiWaktu, kktp, catatanKhusus } = params;
  const currentTopic = topik || 'Materi Pembelajaran Mendalam Fase D';
  const reg = getRegulatoryHierarchy(mapel);

  if (sectionNumber === 1) {
    const prompt = `Anda adalah pakar perancang modul ajar Kurikulum Merdeka SMP Fase D.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_1 (identitas_perencanaan).
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik/Materi: ${currentTopic}
Alokasi Waktu: ${alokasiWaktu || '2 x 40 menit'}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

Perhatikan Standar Isi (Permendikdasmen No. 12 Tahun 2025) dalam menentukan ruang lingkup materi esensial dan Standar Proses (Permendikdasmen No. 1 Tahun 2026) untuk alokasi waktu yang fleksibel dan terstruktur.
Rumuskan identitas pembelajaran yang ideal dalam format JSON murni:
{
  "judul": "Modul Ajar: [Judul Pembelajaran Menarik & Terstruktur]",
  "topikMateri": "${currentTopic}",
  "alokasiWaktu": "${alokasiWaktu || '2 x 40 menit'}",
  "ringkasanFokus": "Deskripsi singkat fokus pembelajaran esensial dan bermakna"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section1IdentitasResult>(res.text);
      if (parsed && parsed.judul) return parsed;
    }

    return {
      judul: `Modul Ajar: Pembelajaran Mendalam ${currentTopic}`,
      topikMateri: currentTopic,
      alokasiWaktu: alokasiWaktu || '2 x 40 menit',
      ringkasanFokus: `Fokus pada pendalaman konsep esensial dan aplikasi kontekstual materi secara mendalam.`,
    };
  }

  if (sectionNumber === 2) {
    const prompt = `Anda adalah konsultan pedagogis Kurikulum Merdeka SMP Fase D.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_2 (identifikasi_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

Rujukan Utama Pedagogis:
- Standar Kompetensi Lulusan (SKL Permendikdasmen No. 10/2025): Rumuskan dimensi profil lulusan dari 8 Dimensi Profil Lulusan baru (Keimanan dan Ketakwaan, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi).
- Standar Proses: Pembelajaran berpusat pada murid melalui pemetaan kesiapan dan scaffolding berjenjang.

Rumuskan analisis identifikasi dan kesiapan belajar peserta didik dalam format JSON murni:
{
  "kesiapanAwal": "Analisis pengetahuan/keterampilan prasyarat yang dimiliki peserta didik sebelum materi ini",
  "karakteristikMateri": "Karakteristik materi (konseptual/prosedural/aplikatif) esensial dan mendalam",
  "kebutuhanBelajar": "Strategi diferensiasi (konten/proses/produk) dan scaffolding bertahap untuk kelompok peserta didik yang beragam",
  "dimensiProfilLulusan": ["Penalaran Kritis", "Kolaborasi", "Kemandirian"]
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section2IdentifikasiResult>(res.text);
      if (parsed && parsed.kesiapanAwal) return parsed;
    }

    return {
      kesiapanAwal: `Sebagian peserta didik telah mengenali fenomena dasar ${currentTopic}, namun memerlukan penguatan konsep analitis dan keterkaitan sistematis.`,
      karakteristikMateri: `Materi bersifat konseptual dan aplikatif yang memerlukan penyelidikan terbimbing.`,
      kebutuhanBelajar: `Pendampingan berjenjang (scaffolding), penyediaan kartu panduan visual bagi yang butuh bantuan ekstra, dan tantangan analisis mandiri bagi yang cepat tuntas.`,
      dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'],
    };
  }

  if (sectionNumber === 3) {
    const prompt = `Anda adalah pakar perumusan tujuan pembelajaran Kurikulum Merdeka SMP Fase D.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_3 (tujuan_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Target KKTP: ${kktp || 75}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

RUJUKAN UTAMA PEDAGOGIS:
1. Capaian Pembelajaran: Rumuskan target kompetensi fase D yang relevan.
2. Standar Isi: Ruang lingkup materi pokok esensial, mendalam, dan aplikatif.
3. Standar Kompetensi Lulusan: Orientasi tujuan pembelajaran pada penguasaan kompetensi akhir peserta didik.

Rumuskan Capaian & Tujuan Pembelajaran operasional mendalam dalam format JSON murni:
{
  "capaianPembelajaran": "Deskripsi target kompetensi Capaian Pembelajaran Fase D yang relevan dengan ${currentTopic}",
  "tujuanPembelajaran": "1. Peserta didik mampu mengidentifikasi dan memahami konsep esensial...\\n2. Peserta didik mampu menganalisis dan mengaplikasikan... secara kolaboratif.\\n3. Peserta didik mampu merefleksikan makna pembelajaran bagi diri dan lingkungan.",
  "indikatorKetercapaian": "Bukti terukur ketercapaian tujuan pembelajaran (KKTP)",
  "lingkupMateri": "${currentTopic}"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section3TujuanResult>(res.text);
      if (parsed && parsed.tujuanPembelajaran) return parsed;
    }

    return {
      capaianPembelajaran: reg.isAgama
        ? `Peserta didik mampu memahami nilai-nilai esensial ajaran agama, menghayati, dan mengamalkannya dalam kehidupan bermasyarakat sehari-hari.`
        : `Peserta didik mampu memahami, menganalisis, dan merefleksikan konsep ${currentTopic} secara kritis dan mendalam.`,
      tujuanPembelajaran: `1. Peserta didik mampu menganalisis konsep kunci ${currentTopic} secara kritis dan mendalam.\n2. Peserta didik mampu melakukan penyelidikan kelompok secara gotong royong dan memecahkan studi kasus terstruktur.\n3. Peserta didik mampu merefleksikan proses belajar serta mengaitkan manfaat materi dengan kehidupan nyata.`,
      indikatorKetercapaian: `Keaktifan dalam penyelidikan kelompok, ketepatan analisis lembar kerja, dan capaian asesmen memenuhi kriteria ketuntasan (skor minimal ${kktp || 75}).`,
      lingkupMateri: currentTopic,
    };
  }

  if (sectionNumber === 4) {
    const prompt = `Anda adalah perancang desain pembelajaran inovatif Kurikulum Merdeka SMP.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_4 (desain_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

Rancang kerangka desain pedagogis dan kemitraan dalam format JSON murni:
{
  "praktikPedagogis": "Pembelajaran Berbasis Masalah (Problem Based Learning) / Inkuiri Terbimbing yang interaktif & menantang",
  "kemitraanPembelajaran": "Kolaborasi kelompok heterogen dan pendampingan tutor sebaya yang suportif",
  "lingkunganPembelajaran": "Ruang kelas kolaboratif, perpustakaan, atau sudut observasi lingkungan sekolah",
  "pemanfaatanDigital": "Media presentasi interaktif, kuis digital formatif, atau LKPD interaktif",
  "modelMetode": "Eksplorasi konsep, diskusi pemecahan masalah, dan presentasi kelompok",
  "sumberBelajar": "Buku teks utama Kemendikbudristek Fase D, LKPD kontekstual, dan objek lingkungan sekitar"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section4DesainResult>(res.text);
      if (parsed && parsed.praktikPedagogis) return parsed;
    }

    return {
      praktikPedagogis: 'Pembelajaran Berbasis Masalah (Problem Based Learning) dan inkuiri terbimbing yang berpusat pada murid',
      kemitraanPembelajaran: 'Kolaborasi kelompok heterogen dan pendampingan tutor sebaya yang suportif',
      lingkunganPembelajaran: 'Ruang kelas interaktif, sudut eksplorasi materi, dan lingkungan sekolah nyata',
      pemanfaatanDigital: 'Media pembelajaran visual interaktif dan instrumen asesmen formatif digital',
      modelMetode: 'Eksplorasi konsep pemantik, diskusi pemecahan masalah terstruktur, dan presentasi galeri belajar',
      sumberBelajar: 'Buku teks utama Fase D, lembar kerja peserta didik (LKPD) kontekstual, dan fenomena lingkungan sekitar',
    };
  }

  if (sectionNumber === 5) {
    const prompt = `Anda adalah pakar pendekatan Pembelajaran Mendalam (Permendikdasmen No 13/2025 & Kepmendikdasmen No 126/P/2025).
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_5 (pengalaman_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

Perhatikan Standar Proses (Permendikdasmen No. 1 Tahun 2026) agar alur pengalaman belajar interaktif, menantang, dan berpusat pada murid.
Rumuskan 3 pengalaman belajar mendalam (Memahami, Mengaplikasi, Merefleksi) dalam format JSON murni:
{
  "memahami": "Aktivitas bagaimana siswa membangun pemahaman konsep esensial secara kritis melalui stimulus nyata",
  "mengaplikasi": "Aktivitas bagaimana siswa mempraktikkan konsep dalam investigasi kelompok dan pemecahan masalah nyata",
  "merefleksi": "Aktivitas bagaimana siswa merenungkan proses belajar, mengidentifikasi pembelajaran bermakna, dan merumuskan komitmen diri"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section5PengalamanResult>(res.text);
      if (parsed && parsed.memahami) return parsed;
    }

    return {
      memahami: `Peserta didik mengamati fenomena kontekstual seputar ${currentTopic}, mengajukan pertanyaan pemantik, berdiskusi berpasangan, dan mengidentifikasi konsep kunci materi.`,
      mengaplikasi: `Peserta didik bekerja sama dalam kelompok heterogen untuk menganalisis studi kasus/eksperimen berbasis LKPD kontekstual dan merumuskan solusi nyata.`,
      merefleksi: `Peserta didik mengevaluasi jalannya penyelidikan, mengungkapkan umpan balik apresiatif, mengisi tiket keluar berkesadaran, serta menyimpulkan hikmah materi.`,
    };
  }

  if (sectionNumber === 6) {
    const prompt = `Anda adalah pakar penerapan Prinsip Pembelajaran Mendalam (Permendikdasmen No 13/2025 & Standar Proses Permendikdasmen No 1/2026).
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_6 (prinsip_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

Tuliskan implementasi 3 pilar prinsip mendalam dalam format JSON murni:
{
  "berkesadaran": "Aktivitas mindful check-in di awal, pemusatan fokus, dan refleksi diri berkesadaran",
  "bermakna": "Keterkaitan langsung konsep dengan masalah riil peserta didik dan lingkungan hidup sesuai Standar Isi No. 12/2025",
  "menggembirakan": "Aktivitas interaktif kolaboratif, gamifikasi/kuis ceria, dan apresiasi positif antar siswa sesuai Standar Proses No. 1/2026"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section6PrinsipResult>(res.text);
      if (parsed && parsed.berkesadaran) return parsed;
    }

    return {
      berkesadaran: `Memulai sesi KBM dengan jeda hening sejenak (mindful check-in / teknik nafas sadar) untuk mengondisikan kesiapan emosional dan fokus penuh siswa sebelum mempelajari ${currentTopic}.`,
      bermakna: `Menghubungkan konsep ${currentTopic} dengan contoh konkret di lingkungan sekolah dan tempat tinggal siswa agar materi terasa penting dan berguna bagi kehidupan mereka.`,
      menggembirakan: `Menyajikan tantangan kelompok berbasis apresiasi dan permainan edukatif yang menumbuhkan rasa ingin tahu tanpa menimbulkan intimidasi atau rasa takut salah.`,
    };
  }

  if (sectionNumber === 7) {
    const prompt = `Anda adalah perancang skenario kegiatan pembelajaran Kurikulum Merdeka SMP.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_7 (kegiatan_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Alokasi Waktu: ${alokasiWaktu || '2 x 40 menit'}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

RUJUKAN STANDAR PROSES (Permendikdasmen No. 1 Tahun 2026):
- Langkah KBM harus fleksibel, jelas, sederhana, interaktif, menyenangkan, menantang, serta berpusat pada murid.
- Sisipkan asesmen formatif terpadu dan umpan balik berkelanjutan di sela-sela kegiatan inti.

Susun rencana langkah KBM (Pendahuluan, Inti sesuai sintaks mendalam, Penutup) dalam format JSON murni:
{
  "durasiPendahuluan": "10 menit",
  "pendahuluan": "1. Salam hangat, presensi berkesadaran, doa.\\n2. Apersepsi dan pertanyaan pemantik kontekstual...\\n3. Penyampaian tujuan dan alur KBM.",
  "durasiInti": "60 menit",
  "kegiatanInti": "1. Tahap Memahami (20 mnt): Eksplorasi stimulus kontekstual & asesmen awal...\\n2. Tahap Mengaplikasi (30 mnt): Penyelidikan kelompok & asesmen formatif berkala...\\n3. Tahap Berbagi & Merefleksi (10 mnt): Galeri presentasi & umpan balik sebaya...",
  "durasiPenutup": "10 menit",
  "penutup": "1. Perumusan kesimpulan bersama...\\n2. Pengisian tiket keluar refleksi diri...\\n3. Apresiasi kelas dan doa penutup."
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section7KegiatanResult>(res.text);
      if (parsed && parsed.kegiatanInti) return parsed;
    }

    return {
      durasiPendahuluan: '10 menit',
      pendahuluan: `1. Salam hangat, doa bersama, dan presensi berkesadaran (mindful check-in).\n2. Apersepsi kontekstual melalui pertanyaan pemantik seputar ${currentTopic}.\n3. Penyampaian tujuan pembelajaran, indikator keberhasilan, dan skenario kolaborasi.`,
      durasiInti: '60 menit',
      kegiatanInti: `1. Tahap Memahami (20 menit): Eksplorasi materi pemantik, identifikasi masalah, dan diskusi berpasangan.\n2. Tahap Mengaplikasi (30 menit): Penyelidikan kelompok menggunakan LKPD kontekstual dengan pendampingan berjenjang guru serta asesmen formatif berkala.\n3. Tahap Berbagi & Refleksi (10 menit): Presentasi kilat antar kelompok dengan umpan balik apresiatif.`,
      durasiPenutup: '10 menit',
      penutup: `1. Bersama peserta didik merumuskan intisari dan kesimpulan pembelajaran.\n2. Pengisian tiket keluar refleksi diri (3 hal dipahami, 1 hal perlu penguatan).\n3. Apresiasi atas kolaborasi kelas dan doa penutup.`,
    };
  }

  if (sectionNumber === 8) {
    const prompt = `Anda adalah spesialis asesmen pembelajaran Kurikulum Merdeka SMP Fase D.
${reg.promptGuidance}
PERMINTAAN: perencanaan_bagian_8 (asesmen_perencanaan).
Topik/Materi: ${currentTopic}
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Target KKTP: ${kktp || 75}
${catatanKhusus ? `Instruksi khusus guru: ${catatanKhusus}` : ''}

RUJUKAN STANDAR PROSES (Permendikdasmen No. 1 Tahun 2026):
- Mengutamakan ASESMEN FORMATIF sebagai bagian integral dari proses KBM untuk perbaikan pembelajaran berkelanjutan (bukan semata-mata menguji di akhir).
- Sediakan asesmen awal (diagnostik kesiapan), asesmen proses (formatif observasi & performa), asesmen akhir (sumatif/reflektif), serta kriteria KKTP yang jelas.

Rancang rencana asesmen terpadu dalam format JSON murni:
{
  "asesmenAwal": "Deskripsi asesmen diagnostik singkat di awal KBM untuk memetakan kesiapan awal",
  "asesmenProses": "Deskripsi asesmen formatif selama proses KBM (observasi rubrik keaktifan, performa LKPD, umpan balik sebaya)",
  "asesmenAkhir": "Deskripsi asesmen sumatif / reflektif di akhir pembelajaran untuk mengukur ketercapaian tujuan",
  "teknikAsesmen": "Observasi kinerja kolaboratif, tes pemahaman konsep, dan penilaian portofolio produk",
  "instrumenAsesmen": "Rubrik penilaian kinerja kelompok berjenjang dan lembar observasi profil lulusan",
  "kriteriaKetercapaian": "Kriteria ketuntasan peserta didik mencapai KKTP (skor minimal ${kktp || 75})"
}`;

    const res = await callServerAI(prompt);
    if (res && res.text) {
      const parsed = extractJSON<Section8AsesmenResult>(res.text);
      if (parsed && parsed.asesmenProses) return parsed;
    }

    return {
      asesmenAwal: `Tanya jawab pemantik diagnostik non-tes untuk mendeteksi pemahaman awal peserta didik seputar ${currentTopic}.`,
      asesmenProses: `Asesmen formatif terpadu mengamati keaktifan diskusi kelompok, gotong royong, dan ketuntasan pengisian LKPD secara berkelanjutan sesuai Standar Proses No. 1/2026.`,
      asesmenAkhir: `Kuis formatif singkat pemahaman konsep dan lembar refleksi diri berkesadaran.`,
      teknikAsesmen: 'Observasi unjuk kerja, penugasan portofolio LKPD, dan tes tertulis singkat',
      instrumenAsesmen: 'Rubrik penilaian skala bertingkat 4 capaian dan lembar ceklis Profil Pelajar',
      kriteriaKetercapaian: `Peserta didik mencapai KKTP jika memperoleh nilai minimal ${kktp || 75} dan menunjukkan kemampuan minimal pada kategori Cakap.`,
    };
  }

  throw new Error(`Section number ${sectionNumber} tidak dikenali.`);
}

export async function generateSingleFieldAI(
  fieldName: string,
  fieldLabel: string,
  context: { mapel: string; kelas: string; topik: string; catatan?: string }
): Promise<string> {
  const prompt = `Anda adalah asisten pedagogis Kurikulum Merdeka SMP Fase D (Permendikdasmen No 13/2025).
Bantulah guru menyusun/menyempurnakan isi untuk kolom: "${fieldLabel}" (${fieldName}).
Mata Pelajaran: ${context.mapel}
Kelas: ${context.kelas}
Topik/Materi: ${context.topik}
${context.catatan ? `Instruksi khusus guru: ${context.catatan}` : ''}

Tuliskan teks yang profesional, aplikatif, padat, dan langsung siap dipakai di dokumen perencanaan pembelajaran tanpa basa-basi pengantar:`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    return res.text.trim();
  }
  return `Pengembangan terstruktur untuk ${fieldLabel} pada materi ${context.topik} yang kontekstual dan mendalam.`;
}

// ============================================================================
// 2. ASISTEN AI UNTUK PELAKSANAAN PEMBELAJARAN (JURNAL MENGAJAR HARIAN)
// ============================================================================
export interface GenerateJurnalParams {
  mapel: string;
  kelas: string;
  topik: string;
  pertemuanKe?: number;
}

export interface JurnalAIDraft {
  tujuanPembelajaran: string;
  kegiatanTerlaksana: string;
  pengalamanTerlaksana: { memahami: boolean; mengaplikasi: boolean; merefleksi: boolean };
  prinsipTerlaksana: { berkesadaran: boolean; bermakna: boolean; menggembirakan: boolean };
  kendala: string;
  solusiTindakan: string;
  refleksiGuru: string;
}

export async function generateJurnalWithAI(
  params: GenerateJurnalParams
): Promise<JurnalAIDraft> {
  const prompt = `Anda adalah asisten administrasi guru SMP.
Topik/Materi: ${params.topik}
Mata Pelajaran: ${params.mapel}
Kelas: ${params.kelas}
Pertemuan Ke: ${params.pertemuanKe || 1}

Buatkan draf dokumentasi Jurnal Mengajar Harian pembelajaran mendalam dalam format JSON murni TANPA teks pengantar lain:
{
  "tujuanPembelajaran": "Tujuan spesifik yang dituntaskan pada tatap muka ini",
  "kegiatanTerlaksana": "1. Pendahuluan: Apersepsi mindful...\\n2. Kegiatan Inti: Eksplorasi materi ${params.topik}, kerja kelompok LKPD, dan diskusi...\\n3. Penutup: Refleksi dan tiket keluar...",
  "pengalamanTerlaksana": { "memahami": true, "mengaplikasi": true, "merefleksi": true },
  "prinsipTerlaksana": { "berkesadaran": true, "bermakna": true, "menggembirakan": true },
  "kendala": "Tantangan umum kelas (misal: manajemen waktu diskusi kelompok agak ketat atau beberapa siswa ragu berpendapat)",
  "solusiTindakan": "Tindakan guru mengatasi kendala tersebut secara cepat dan mendidik",
  "refleksiGuru": "Refleksi pedagogis guru mengenai suasana belajar, tingkat pemahaman peserta didik, dan rencana perbaikan pertemuan depan"
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<JurnalAIDraft>(res.text);
    if (parsed && parsed.kegiatanTerlaksana) {
      return {
        tujuanPembelajaran: parsed.tujuanPembelajaran || '',
        kegiatanTerlaksana: parsed.kegiatanTerlaksana || '',
        pengalamanTerlaksana: parsed.pengalamanTerlaksana || { memahami: true, mengaplikasi: true, merefleksi: true },
        prinsipTerlaksana: parsed.prinsipTerlaksana || { berkesadaran: true, bermakna: true, menggembirakan: true },
        kendala: parsed.kendala || '',
        solusiTindakan: parsed.solusiTindakan || '',
        refleksiGuru: parsed.refleksiGuru || '',
      };
    }
  }

  // Fallback
  return {
    tujuanPembelajaran: `Peserta didik mampu memahami konsep esensial ${params.topik} dan mengaplikasikannya dalam diskusi kelompok secara aktif.`,
    kegiatanTerlaksana: `1. Pendahuluan: Pembukaan hangat, doa, presensi berkesadaran, dan apersepsi visual seputar ${params.topik}.\n2. Kegiatan Inti: Peserta didik mengamati bahan ajar, menyelesaikan LKPD kolaboratif dalam kelompok heterogen, dan mempresentasikan hasil temuan.\n3. Penutup: Siswa bersama guru menarik benang merah simpulan pembelajaran dan mengisi tiket keluar refleksi.`,
    pengalamanTerlaksana: { memahami: true, mengaplikasi: true, merefleksi: true },
    prinsipTerlaksana: { berkesadaran: true, bermakna: true, menggembirakan: true },
    kendala: 'Waktu kegiatan diskusi kelompok sedikit melebihi target karena antusiasme siswa menyampaikan argumen cukup tinggi.',
    solusiTindakan: 'Guru membatasi waktu bicara per kelompok dengan penanda visual timer dan menugaskan pencatat waktu di tiap kelompok.',
    refleksiGuru: `Pembelajaran ${params.topik} berlangsung sangat menggembirakan dan interaktif. Lebih dari 85% siswa terlibat aktif mengemukakan pendapat. Pertemuan berikutnya perlu diberikan tantangan kontekstual lanjutan.`,
  };
}

// ============================================================================
// 3. ASISTEN AI UNTUK EVALUASI PEMBELAJARAN
// ============================================================================

// 3A. Rubrik Asesmen & KKTP
export interface GenerateRubrikParams {
  mapel: string;
  kelas: string;
  topik: string;
  jenisAsesmen?: string;
  kktp?: number;
}

export async function generateRubrikAsesmenWithAI(
  params: GenerateRubrikParams
): Promise<Partial<RencanaAsesmenItem>> {
  const prompt = `Anda adalah pakar evaluasi pembelajaran Kurikulum Merdeka SMP.
Mata Pelajaran: ${params.mapel}
Kelas: ${params.kelas}
Topik: ${params.topik}
Jenis Asesmen: ${params.jenisAsesmen || 'Formatif'}
KKTP: ${params.kktp || 75}

Rancang draf instrumen asesmen dan kriteria ketercapaian (KKTP) dalam format JSON murni:
{
  "judulAsesmen": "Asesmen [Jenis]: ${params.topik}",
  "tujuanPembelajaran": "Mengukur pemahaman konsep dan keterampilan aplikasi peserta didik pada materi ${params.topik}",
  "teknikAsesmen": "Tes Tertulis / Unjuk Kerja Portofolio",
  "instrumenAsesmen": "Lembar Soal Analisis / Rubrik Penilaian Kinerja",
  "kriteriaKetercapaian": {
    "baruBerkembang": "Belum mampu menjelaskan konsep dasar dan membutuhkan bimbingan intensif.",
    "layak": "Mampu menjelaskan konsep dasar secara sederhana dengan sedikit pendampingan.",
    "cakap": "Mampu menjelaskan dan mengaplikasikan konsep ${params.topik} secara mandiri dan tepat (Mencapai KKTP).",
    "mahir": "Mampu menganalisis, menyelesaikan masalah kompleks, dan membagikan penalaran kritis secara terstruktur."
  }
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<Partial<RencanaAsesmenItem>>(res.text);
    if (parsed && parsed.judulAsesmen) {
      return parsed;
    }
  }

  return {
    judulAsesmen: `Asesmen ${params.jenisAsesmen || 'Formatif'}: ${params.topik}`,
    tujuanPembelajaran: `Mengukur ketuntasan kompetensi peserta didik dalam memahami dan mengaplikasikan konsep ${params.topik}.`,
    teknikAsesmen: params.jenisAsesmen === 'Sumatif' ? 'Tes Tertulis & Analisis Kasus' : 'Observasi Kinerja & LKPD',
    instrumenAsesmen: 'Rubrik Skala Capaian Kinerja & Lembar Soal Berbobot',
    kriteriaKetercapaian: {
      baruBerkembang: `Belum menguasai konsep dasar ${params.topik} (<60). Memerlukan bimbingan tutor sebaya/guru.`,
      layak: `Menguasai konsep dasar ${params.topik} dengan bimbingan berkala (60-74).`,
      cakap: `Mampu menjelaskan dan mempraktikkan konsep ${params.topik} secara mandiri dan tepat (75-89, Memenuhi KKTP).`,
      mahir: `Sangat menguasai konsep ${params.topik} secara mendalam dan mampu menyelesaikan studi kasus kompleks (90-100).`,
    },
  };
}

// 3B. Catatan Deskripsi Siswa Otomatis Berdasarkan Nilai
export interface StudentScoreItem {
  id: string;
  nama: string;
  nilai: number;
}

export async function generateBatchStudentFeedbackWithAI(
  students: StudentScoreItem[],
  topik: string,
  kktp: number
): Promise<{ [studentId: string]: string }> {
  const result: { [studentId: string]: string } = {};

  // For high quality and speed, prompt AI with batch of students or use refined rule-based generator
  const prompt = `Anda adalah guru SMP yang bijak dan berempati dalam menulis deskripsi capaian rapor Kurikulum Merdeka.
Materi: ${topik}
KKTP: ${kktp}
Daftar nilai peserta didik:
${students.map((s, idx) => `${idx + 1}. ID: ${s.id}, Nama: ${s.nama}, Nilai: ${s.nilai}`).join('\n')}

Tuliskan catatan deskriptif capaian kompetensi singkat (1-2 kalimat mendidik, positif, tidak menghakimi, menyebutkan nama siswa dan materi) untuk masing-masing siswa.
Format output WAJIB JSON murni berupa objek pasangan ID siswa ke string catatan:
{
  "${students[0]?.id || 'id1'}": "Catatan...",
  "${students[1]?.id || 'id2'}": "Catatan..."
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<{ [id: string]: string }>(res.text);
    if (parsed && typeof parsed === 'object') {
      students.forEach((s) => {
        if (parsed[s.id]) {
          result[s.id] = parsed[s.id];
        }
      });
      if (Object.keys(result).length >= Math.floor(students.length / 2)) {
        return result;
      }
    }
  }

  // Fallback high-quality pedagogical remarks
  students.forEach((s) => {
    if (s.nilai >= 90) {
      result[s.id] = `Sangat mahir menguasai materi ${topik} serta mampu menunjukkan penalaran kritis dan membantu rekan sebaya secara mandiri.`;
    } else if (s.nilai >= kktp) {
      result[s.id] = `Menunjukkan pemahaman yang baik pada konsep ${topik} dan telah mencapai kriteria ketuntasan secara konsisten.`;
    } else if (s.nilai >= 60) {
      result[s.id] = `Telah memahami sebagian konsep dasar ${topik}, namun memerlukan sedikit bimbingan pada langkah aplikasi pemecahan masalah.`;
    } else {
      result[s.id] = `Memerlukan pendampingan belajar khusus dan latihan terbimbing untuk menguatkan pemahaman konsep awal ${topik}.`;
    }
  });

  return result;
}

// 3C. Program Tindak Lanjut (Remedial & Pengayaan)
export interface GenerateTindakLanjutParams {
  topik: string;
  kelas: string;
  kktpTarget: number;
  remedialStudents: string[];
  pengayaanStudents: string[];
}

export async function generateTindakLanjutWithAI(
  params: GenerateTindakLanjutParams
): Promise<Partial<TindakLanjutData>> {
  const prompt = `Anda adalah konsultan pendidikan Kurikulum Merdeka.
Materi: ${params.topik}
Kelas: ${params.kelas}
KKTP: ${params.kktpTarget}
Siswa Remedial: ${params.remedialStudents.join(', ') || '3 peserta didik'}
Siswa Pengayaan: ${params.pengayaanStudents.join(', ') || '4 peserta didik'}

Susunlah program tindak lanjut bermakna dalam format JSON murni:
{
  "programRemedial": {
    "materiPengulangan": "Fokus penguraian miskonsepsi pada materi ${params.topik}",
    "bentukKegiatan": "Bimbingan kelompok kecil dan tutor sebaya dengan media visual/konkret",
    "jadwalPelaksanaan": "Jumat pekan ini sepulang sekolah (30-40 menit)"
  },
  "programPengayaan": {
    "materiPengayaan": "Pendalaman konsep dan aplikasi tingkat lanjut materi ${params.topik}",
    "bentukKegiatan": "Tantangan proyek mini/infografis kontekstual mandiri",
    "jadwalPelaksanaan": "Pekan depan secara fleksibel"
  },
  "catatanHasil": "Catatan target ketercapaian dan harapan perbaikan hasil belajar"
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<Partial<TindakLanjutData>>(res.text);
    if (parsed && parsed.programRemedial && parsed.programPengayaan) {
      return parsed;
    }
  }

  // Fallback
  return {
    programRemedial: {
      daftarSiswa: params.remedialStudents,
      materiPengulangan: `Penguatan konsep dasar dan latihan terarah identifikasi karakteristik pada ${params.topik}.`,
      bentukKegiatan: 'Bimbingan kelompok kecil dengan bantuan lembar kerja visual dan pendampingan tutor sebaya.',
      jadwalPelaksanaan: 'Jumat sore (13.00 - 13.45 WIB)',
    },
    programPengayaan: {
      daftarSiswa: params.pengayaanStudents,
      materiPengayaan: `Eksplorasi studi kasus nyata dan perancangan media infografis edukatif seputar ${params.topik}.`,
      bentukKegiatan: 'Proyek eksplorasi mandiri atau berpasangan untuk memecahkan tantangan kontekstual.',
      jadwalPelaksanaan: 'Pekan berjalan (waktu luang terarah)',
    },
    catatanHasil: `Diharapkan seluruh peserta didik remedial dapat mencapai batas tuntas KKTP ${params.kktpTarget}, sementara peserta didik pengayaan dapat mengasah nalar kritis tingkat tinggi.`,
  };
}

// 3D. Refleksi Evaluasi Pembelajaran
export interface GenerateRefleksiEvaluasiParams {
  topik: string;
  kelas: string;
  rataRata?: number;
  persentaseTuntas?: number;
  totalSiswa?: number;
}

export async function generateRefleksiEvaluasiWithAI(
  params: GenerateRefleksiEvaluasiParams
): Promise<Partial<RefleksiEvaluasiData>> {
  const prompt = `Anda adalah guru SMP reflektif berbasis Pembelajaran Mendalam.
Topik Pembelajaran: ${params.topik}
Kelas: ${params.kelas}
Rata-rata Nilai: ${params.rataRata || 78}
Persentase Tuntas: ${params.persentaseTuntas || 85}%
Total Peserta Didik: ${params.totalSiswa || 30}

Susunlah refleksi evaluasi hasil asesmen yang jujur, mendalam, dan solutif dalam format JSON murni:
{
  "apaYangBerjalanEfektif": "Aspek pembelajaran yang terbukti sangat efektif bagi siswa...",
  "apaYangBelumBerhasil": "Kendala atau bagian materi yang masih sulit dipahami sebagian siswa...",
  "responPesertaDidik": "Tingkat antusiasme dan respons emosional siswa selama asesmen...",
  "rencanaPerbaikan": "Langkah konkret guru untuk menyempurnakan siklus pembelajaran berikutnya..."
}`;

  const res = await callServerAI(prompt);
  if (res && res.text) {
    const parsed = extractJSON<Partial<RefleksiEvaluasiData>>(res.text);
    if (parsed && parsed.apaYangBerjalanEfektif) {
      return parsed;
    }
  }

  // Fallback
  return {
    apaYangBerjalanEfektif: `Aktivitas pengamatan langsung dan diskusi kelompok pada materi ${params.topik} berhasil membangkitkan keaktifan kelas. Siswa merasa nyaman mengeksplorasi jawaban tanpa takut salah.`,
    apaYangBelumBerhasil: `Beberapa peserta didik masih mengalami kesulitan saat menghubungkan hasil analisis ke dalam kesimpulan tertulis yang runtut karena keterbatasan kosakata ilmiah.`,
    responPesertaDidik: `Peserta didik sangat antusias (tercapai ${params.persentaseTuntas || 85}% ketuntasan). Mereka merasa kegiatan belajar menyenangkan dan tidak membebani secara mental.`,
    rencanaPerbaikan: `Pada siklus berikutnya, guru akan menyediakan panduan pertanyaan pemandu (scaffolding prompts) dan kartu istilah bergambar untuk mempermudah perumusan simpulan.`,
  };
}

// Helper prompt builder for general requests
function buildPrompt(p: AIRequestPayload): string {
  const reg = getRegulatoryHierarchy(p.mapel);
  const base = `Mata Pelajaran: ${p.mapel}
Fase: Fase D (SMP/MTs)
Kelas: ${p.kelas}
Topik/Materi: ${p.topik}
Konteks Pembelajaran: ${p.konteksTambahan || 'Peserta didik kelas reguler dengan keragaman gaya belajar dan minat.'}
${reg.promptGuidance}
`;

  switch (p.taskType) {
    case 'tujuan_pembelajaran':
      return `${base}
Tugas: Susunlah 2-3 rumusan Tujuan Pembelajaran (TP) yang mencakup kompetensi, lingkup materi esensial (sesuai Standar Isi Permendikdasmen No. 12/2025 & CP ${reg.isAgama ? 'Kepka BKPDM No. 020/2026' : 'BSKAP No. 046/H/KR/2025'}), serta bukti ketercapaian (indikator). Pastikan berprinsip operasional, terukur, dan berorientasi pada goal akhir Standar Kompetensi Lulusan (Permendikdasmen No. 10/2025).`;

    case 'aktivitas_mendalam':
      return `${base}
Tugas: Rancang ide kegiatan pembelajaran mendalam sesuai Standar Proses (Permendikdasmen No. 1 Tahun 2026) dan Kepmendikdasmen No 126/P/2025 yang mengintegrasikan:
1. Tiga pengalaman belajar: Memahami, Mengaplikasi, dan Merefleksi.
2. Tiga prinsip: Berkesadaran (mindful), Bermakna (meaningful), dan Menggembirakan (joyful).
Sertakan langkah konkret pendahuluan, inti yang interaktif dan menantang berpusat pada murid, serta penutup beserta perkiraan durasi.`;

    case 'pertanyaan_pemantik':
      return `${base}
Tugas: Buatlah 3-4 pertanyaan pemantik yang kontekstual dengan kehidupan sehari-hari anak usia SMP (remaja), memancing rasa ingin tahu, dan tidak dapat dijawab hanya dengan ya/tidak atau definisi hafalan.`;

    case 'asesmen_formatif':
      return `${base}
Tugas: Sesuai Standar Proses Permendikdasmen No. 1 Tahun 2026 yang mengutamakan asesmen formatif, rancang 3 ide asesmen formatif terpadu (selama proses KBM) yang bervariasi (kinerja, observasi teman sebaya, atau tiket keluar) yang langsung memberikan umpan balik bermakna tanpa membebani siswa dengan kecemasan nilai angka.`;

    case 'rubrik_penilaian':
      return `${base}
Tugas: Buatlah draf rubrik atau kriteria penilaian (KKTP) berbasis skala deskriptif (Baru Berkembang, Layak, Cakap, Mahir) untuk topik ini agar guru dapat menilai secara adil dan transparan.`;

    case 'refleksi_guru':
      return `${base}
Tugas: Susun panduan pertanyaan refleksi diri guru yang mendalam mengenai efektivitas proses, keterlibatan peserta didik, kebermaknaan materi, dan identifikasi perbaikan pertemuan selanjutnya.`;

    case 'analisis_hasil_belajar':
      return `${base}
Data Asesmen: KKTP target ${p.kktp || 75}.
Data Peserta Didik: ${JSON.stringify(p.dataTambahan || {})}
Tugas: Berikan analisis deskriptif hasil belajar secara objektif. Identifikasi kekuatan materi yang sudah dipahami siswa dan area materi yang masih memerlukan penguatan. Ingat: jangan membuat vonis mutlak, jadikan sebagai alat bantu refleksi guru.`;

    case 'tindak_lanjut':
      return `${base}
Tugas: Rancang strategi tindak lanjut yang konstruktif:
1. Program penguatan (remedial/tutor sebaya) bagi siswa yang membutuhkan bantuan tanpa stigmatisasi negatif.
2. Program pengayaan kreatif bagi siswa yang telah melampaui kriteria.`;

    default:
      return `${base}\nTugas: Rancang rancangan administrasi pembelajaran yang terstruktur.`;
  }
}

function generateCuratedPedagogicalTemplate(p: AIRequestPayload): string {
  const topik = p.topik || 'Materi Pokok Pembelajaran';
  const mapel = p.mapel || 'Mata Pelajaran';
  const kelas = p.kelas || 'VII';

  switch (p.taskType) {
    case 'tujuan_pembelajaran':
      return `### Rancangan Tujuan Pembelajaran (Fase D - ${kelas})
**Mata Pelajaran:** ${mapel}
**Topik:** ${topik}

1. **Tujuan Pembelajaran 1 (Memahami):**
   Peserta didik mampu menganalisis konsep dasar dan prinsip utama terkait ${topik} melalui pengamatan fenomena nyata di lingkungan sekitar dengan bernalar kritis.
   * *Bukti Ketercapaian:* Mampu menjelaskan minimal 3 karakteristik utama dengan kata-kata sendiri tanpa menghafal teks kaku.

2. **Tujuan Pembelajaran 2 (Mengaplikasi):**
   Peserta didik mampu menerapkan konsep ${topik} dalam menyelesaikan studi kasus kontekstual atau menghasilkan karya/model simulasi sederhana secara kolaboratif.
   * *Bukti Ketercapaian:* Menyelesaikan lembar kerja penyelidikan kelompok dengan akurasi langkah kerja dan kesimpulan logis.

3. **Tujuan Pembelajaran 3 (Merefleksi):**
   Peserta didik mampu merefleksikan keterkaitan konsep ${topik} dengan tanggung jawab sosial atau pelestarian lingkungan serta merumuskan aksi nyata berskala kecil.`;

    case 'aktivitas_mendalam':
      return `### Rancangan Kegiatan Pembelajaran Mendalam (Kepmendikdasmen No 126/P/2025)
**Topik:** ${topik} | **Kelas:** ${kelas}

#### A. Integrasi Prinsip Pembelajaran Mendalam:
- **Berkesadaran (Mindful):** Mengawali pembelajaran dengan jeda hening 2 menit (menyadari pernapasan dan niat belajar) agar peserta didik hadir utuh secara fisik dan mental.
- **Bermakna (Meaningful):** Mengaitkan ${topik} dengan persoalan yang dialami siswa dalam kehidupan sehari-hari di rumah atau lingkungan sekolah.
- **Menggembirakan (Joyful):** Menyisipkan aktivitas tantangan kelompok interaktif atau permainan edukatif yang memicu tawa dan antusiasme sehat.

#### B. Tahapan Alur Pengalaman Belajar:
1. **Pendahuluan (10 Menit):**
   - Sapaan hangat, doa bersama, dan presensi berkesadaran.
   - Apersepsi pemantik: Menampilkan visual/benda konkret tentang ${topik}.
   - Menyepakati tujuan belajar dan kriteria keberhasilan bersama siswa.

2. **Kegiatan Inti (60 Menit):**
   - **Tahap 1: Memahami (20 Menit)** — Eksplorasi konsep terarah, mengamati bahan ajar interaktif, berdiskusi berpasangan (Think-Pair-Share).
   - **Tahap 2: Mengaplikasi (30 Menit)** — Praktik kolaboratif dalam kelompok kecil menyelesaikan misi penyelidikan nyata tentang ${topik}. Guru memberikan bimbingan terdiferensiasi.
   - **Tahap 3: Berbagi Hasil (10 Menit)** — Perwakilan kelompok berbagi temuan dengan teknik galeri berjalan (gallery walk) atau presentasi kilat 2 menit.

3. **Penutup & Merefleksi (10 Menit):**
   - Guru memandu siswa merangkum pembelajaran.
   - Pengisian tiket keluar (Exit Ticket) 1 menit: *"Hari ini saya paling terkesan saat..."* dan *"Satu hal yang masih ingin saya pelajari lebih lanjut..."*.
   - Apresiasi usaha seluruh siswa dan doa penutup.`;

    case 'pertanyaan_pemantik':
      return `### Pertanyaan Pemantik Kontekstual (${topik})
1. *"Pernahkah kalian mengamati kejadian di sekitar rumah yang berkaitan dengan ${topik}? Mengapa hal itu bisa terjadi menurut dugaan awal kalian?"*
2. *"Jika konsep ${topik} tidak diterapkan dalam kehidupan modern, apa dampak paling nyata yang akan kita rasakan setiap hari?"*
3. *"Bagaimana kita bisa membuktikan bahwa pemahaman kita tentang ${topik} benar-benar bermanfaat bagi keluarga atau teman kita?"*
4. *"Apa perbedaan pandangan kalian mengenai ${topik} sebelum dan sesudah melihat fakta/eksperimen tadi?"*`;

    case 'asesmen_formatif':
      return `### Ide Asesmen Formatif Ramah Peserta Didik
1. **Tiket Keluar Reflektif (Exit Slip - 3 Menit):**
   Peserta didik menuliskan pada secarik kertas kecil:
   - 1 konsep ${topik} yang paling dipahami hari ini.
   - 1 pertanyaan atau hal yang masih membingungkan.
   *Fungsi:* Guru segera mengetahui materi mana yang perlu diulang pada pertemuan berikutnya tanpa memberi beban nilai angka.

2. **Rubrik Observasi Partisipasi (Peer-Scaffolding):**
   Guru mengamati dinamika kelompok dengan ceklis sederhana:
   - Keaktifan berargumen santun dan menghargai pendapat rekan.
   - Keterampilan menggunakan alat/sumber belajar terkait ${topik}.

3. **Kuis Interaktif Cepat "Cek Pemahaman" (5 Butir Soal Reflektif):**
   Menggunakan kartu warna atau media interaktif untuk mendeteksi miskonsepsi umum secara langsung.`;

    case 'rubrik_penilaian':
      return `### Draf Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
**Topik:** ${topik}

| Kriteria / Indikator | Baru Berkembang (0-60) | Layak (61-74) | Cakap (75-89) [Target KKTP] | Mahir (90-100) |
|---|---|---|---|---|
| **Pemahaman Konsep** | Mampu menyebutkan sebagian istilah tetapi belum menjelaskan maknanya. | Mampu menjelaskan konsep dasar dengan bimbingan berkala. | Mampu menjelaskan konsep ${topik} secara mandiri dan tepat. | Mampu menganalisis dan mengaitkan konsep dengan fenomena baru secara mendalam. |
| **Penerapan / Praktik** | Belum mampu menerapkan langkah pemecahan masalah. | Menerapkan langkah dengan bimbingan rekan/guru. | Menerapkan prosedur pemecahan masalah ${topik} dengan benar dan runtut. | Menyelesaikan masalah secara kreatif dengan alternatif solusi yang efektif. |
| **Refleksi & Sikap** | Pasif dalam refleksi diri. | Menjawab pertanyaan refleksi secara singkat. | Mengungkapkan refleksi diri secara jujur dan relevan. | Merumuskan rencana perbaikan diri dan menunjukkan inisiatif tindak lanjut nyata. |`;

    case 'refleksi_guru':
      return `### Panduan Refleksi Diri Guru Pembelajaran Mendalam
1. **Keberhasilan:** Bagian mana dari pembelajaran ${topik} yang paling membangkitkan binar mata dan rasa ingin tahu peserta didik?
2. **Keterlibatan:** Apakah seluruh siswa (termasuk yang pendiam) mendapatkan ruang aman untuk berekspresi dan berpendapat?
3. **Kebermaknaan:** Apakah peserta didik benar-benar memahami manfaat ${topik} ini untuk kehidupannya, atau hanya menyelesaikan tugas lembar kerja?
4. **Kendala Waktu & Teknis:** Apakah alokasi waktu pada tahap kegiatan inti sudah proporsional untuk eksplorasi mandiri?
5. **Rencana Perbaikan:** Apa satu penyesuaian konkret yang akan saya lakukan pada pertemuan berikutnya?`;

    case 'analisis_hasil_belajar':
      return `### Catatan Analisis Hasil Belajar
- **Karakteristik Pencapaian:** Mayoritas siswa telah menunjukkan penguasaan yang baik pada pemahaman konsep umum ${topik}.
- **Tantangan yang Teridentifikasi:** Kesulitan umumnya terletak pada aspek analisis penalaran lanjutan atau transfer konsep ke dalam konteks soal cerita/aplikasi baru.
- **Rekomendasi Edukatif:** Hindari melabeli siswa dengan istilah gagal. Gunakan data asesmen ini sebagai umpan balik pengajaran guru untuk memperkuat analogi visual dan latihan terbimbing.`;

    case 'tindak_lanjut':
      return `### Rekomendasi Program Tindak Lanjut Terarah
1. **Program Pendampingan / Penguatan (Remedial):**
   - **Fokus:** Mengurai miskonsepsi dasar pada ${topik}.
   - **Metode:** Tutor sebaya atau bantuan grafis/peta konsep sederhana dalam kelompok kecil santai (15-20 menit di luar jam pelajaran atau saat jam mandiri).
   - **Prinsip:** Tidak memberikan tes berulang yang sama persis, melainkan mengubah pendekatan penjelasan agar lebih mudah dipahami.

2. **Program Pengayaan (Enrichment):**
   - **Fokus:** Mengembangkan daya cipta dan penalaran kritis.
   - **Aktivitas:** Menantang peserta didik membuat infografik mini, video 1 menit, atau studi kasus pemecahan masalah lingkungan terkait ${topik}.`;

    default:
      return `### Rekomendasi Administrasi Guru SMP
Silakan pilih jenis tugas bantuan pada panel AI untuk menghasilkan rancangan pembelajaran mendalam yang terintegrasi.`;
  }
}

/**
 * Generates a comprehensive default LKPD structure based on RPP/RPM
 */
export function createCuratedDefaultLKPD(plan: Perencanaan, profile: TeacherProfile): LKPDData {
  const topik = plan.identitas.topikMateri || 'Topik Pembelajaran';
  const mapel = plan.identitas.mataPelajaran || profile.mataPelajaran;
  const alokasi = plan.identitas.alokasiWaktu || '2 x 40 menit';

  return {
    id: 'lkpd-' + plan.id + '-' + Date.now(),
    perencanaId: plan.id,
    judulLKPD: `Lembar Kerja Peserta Didik (LKPD): Investigasi Kolaboratif ${topik}`,
    topikMateri: topik,
    alokasiWaktu: alokasi,
    petunjukUmum: `1. Bentuk kelompok heterogen beranggotakan 4-5 orang dan bagi peran secara adil (Ketua tim, Notulen, Peneliti/Pengumpul Data, Presenter).\n2. Berdoalah sebelum memulai kegiatan dan baca setiap instruksi dengan cermat.\n3. Saling menyimak pendapat teman dengan empati dan aktif berpartisipasi dalam setiap tahap penugasan.`,
    aktivitasMindfulAwal:
      plan.prinsipPembelajaranMendalam?.berkesadaran ||
      `Latihan Hening Sejenak (Mindful Breathing): Duduk tegak dengan rileks, pejamkan mata atau arahkan pandangan ke bawah. Tarik napas dalam secara perlahan selama 4 detik, tahan 2 detik, lalu hembuskan perlahan selama 4 detik (ulangi 3 kali). Sadari kehadiran utuh Anda di kelas dan tetapkan niat untuk belajar dengan penuh rasa ingin tahu serta saling menghargai teman sekelompok.`,
    faseMemahami: {
      stimulusWacana: `Perhatikan fenomena nyata berikut ini:\nDalam kehidupan sehari-hari, kita sering menjumpai peristiwa yang berhubungan erat dengan konsep ${topik}. Cobalah amati kondisi di sekitar lingkungan sekolah maupun tempat tinggal Anda terkait hal ini. Banyak permasalahan timbul ketika kita belum memahami konsep dasarnya secara tepat. Bacalah sumber belajar dan perhatikan contoh kasus yang diberikan oleh guru untuk menggali fakta-fakta penting.`,
      pertanyaanEksplorasi: [
        `Berdasarkan stimulus di atas dan pengalaman Anda, apa persoalan utama atau fenomena menarik yang dapat Anda identifikasi terkait konsep ${topik}?`,
        `Jelaskan mengapa pemahaman mengenai ${topik} sangat penting dan bermakna bagi kehidupan kita sehari-hari!`,
        `Tuliskan dugaan/hipotesis awal atau ide solusi kelompok Anda sebelum memulai penyelidikan!`
      ],
    },
    faseMengaplikasi: {
      langkahKerja: [
        `Siapkan alat, bahan, dan lembar referensi modul ajar yang telah disediakan guru.`,
        `Lakukan pengamatan, simulasi, atau telaah data sesuai arahan topik ${topik}.`,
        `Catat setiap data, fakta, atau karakteristik penting yang Anda temukan ke dalam Tabel Pengamatan berikut.`,
        `Diskusikan perbedaan temuan antar-anggota kelompok dan rumuskan solusi/jawaban bersama dengan bernalar kritis.`
      ],
      alatBahan: [
        `Buku teks peserta didik & modul ajar ${mapel}`,
        `Lembar Kerja Peserta Didik (LKPD)`,
        `Alat tulis, penggaris, dan spidol warna`,
        `Media penunjang / gawai digital (jika ada materi penunjang daring)`
      ],
      tabelPengamatan: {
        judulTabel: `Tabel 1. Lembar Pengumpulan Fakta & Analisis Investigasi ${topik}`,
        kolom: [
          'No',
          'Objek / Aspek yang Diamati',
          'Hasil Pengamatan / Data Temuan',
          'Analisis Hubungan Konsep',
          'Keterangan & Catatan Tim'
        ],
        barisPanduan: [
          'Aspek pengamatan ke-1 yang relevan dengan indikator pembelajaran.',
          'Aspek pengamatan ke-2 yang relevan dengan indikator pembelajaran.',
          'Aspek pengamatan ke-3 yang relevan dengan indikator pembelajaran.'
        ],
      },
      tugasPemecahanMasalah: `Tantangan Aplikatif (HOTS):\nJika kelompok Anda diminta memberikan rekomendasi atau solusi kreatif berbasis konsep ${topik} untuk menyelesaikan persoalan nyata di sekolah/masyarakat, langkah konkret apa yang akan Anda rancang? Sertakan alasan logis dan bukti pendukung dari data hasil penyelidikan Anda!`,
    },
    faseMerefleksi: {
      pertanyaanRefleksi: [
        `Wawasan atau hal baru apa yang paling berharga dan bermakna yang Anda dan tim pahami hari ini?`,
        `Bagian mana dari aktivitas ini yang paling menantang dan menyenangkan (joyful) untuk dikerjakan bersama?`,
        `Bagaimana peran dan kontribusi Anda dalam membantu keberhasilan kerja tim hari ini? Apa yang ingin Anda perbaiki pada pertemuan berikutnya?`
      ],
      kesimpulanBersama: `Berdasarkan seluruh alur pengamatan dan diskusi kelompok, simpulkan dengan bahasa Anda sendiri intisari konsep ${topik} yang telah Anda buktikan hari ini!`,
      rencanaAksiNyata: `Tuliskan 1 tindakan positif atau kebiasaan nyata yang akan Anda terapkan dalam kehidupan sehari-hari setelah mempelajari ${topik}!`,
    },
    rubrikPenilaian: [
      {
        aspek: 'Pemahaman Konsep & Eksplorasi (Fase Memahami)',
        baruBerkembang: 'Hanya menyebutkan kembali fakta tanpa pemahaman makna konsep.',
        layak: 'Menjelaskan konsep dasar dengan bantuan bimbingan guru.',
        cakap: 'Menjelaskan konsep secara runtut, tepat, dan mengaitkan dengan fakta stimulus.',
        mahir: 'Menganalisis konsep secara komprehensif, kritis, dan memberikan contoh baru yang orisinal.'
      },
      {
        aspek: 'Penyelidikan & Analisis Data (Fase Mengaplikasi)',
        baruBerkembang: 'Data pengamatan belum lengkap dan analisis belum terarah.',
        layak: 'Mengisi data dengan cukup lengkap namun analisis masih dangkal.',
        cakap: 'Data pengamatan akurat, sistematis, dan analisis pemecahan masalah logis.',
        mahir: 'Data pengamatan sangat rinci, analisis kritis tajam, serta solusi aplikatif kreatif.'
      },
      {
        aspek: 'Kolaborasi & Pembiasaan Mindful-Joyful',
        baruBerkembang: 'Kurang terlibat dalam kelompok dan mudah terdistraksi.',
        layak: 'Terlibat dalam tugas namun masih perlu diingatkan peran dalam tim.',
        cakap: 'Bekerja sama secara aktif, saling menyimak, dan fokus berkesadaran.',
        mahir: 'Menunjukkan inisiatif tinggi, suportif, mengapresiasi rekan tim, dan antusias gembira.'
      },
      {
        aspek: 'Refleksi & Aksi Nyata (Fase Merefleksi)',
        baruBerkembang: 'Refleksi masih sangat singkat dan belum menunjukkan komitmen nyata.',
        layak: 'Menjawab pertanyaan refleksi secara umum.',
        cakap: 'Merefleksikan proses belajar secara jujur dan merumuskan kesimpulan tepat.',
        mahir: 'Refleksi sangat mendalam, kesimpulan komprehensif, dan aksi nyata terukur.'
      }
    ],
    catatanGuru: `Guru memberikan umpan balik formatif kualitatif secara berkelanjutan selama murid berproses, mengapresiasi penalaran kritis dan kerja sama kelompok.`,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a comprehensive Deep Learning LKPD using Gemini AI, aligned with:
 * - 4-Tier Regulatory Hierarchy (Permendikdasmen 10/2025, 12/2025, BSKAP 046/2025 or BKPDM 020/2026, Permendikdasmen 1/2026)
 * - Kepmendikdasmen No 126/P/2025 (Deep Learning 3 Pilar & 3 Pengalaman Belajar)
 * - Connected strictly with RPP Tujuan, Indikator, Desain & Sintaks Kegiatan
 */
export async function generateLKPDWithAI(
  plan: Perencanaan,
  profile: TeacherProfile,
  customNotes?: string
): Promise<LKPDData> {
  const mapel = plan.identitas.mataPelajaran || profile.mataPelajaran;
  const reg = getRegulatoryHierarchy(mapel);
  const fallback = createCuratedDefaultLKPD(plan, profile);

  const prompt = `Anda adalah pakar kurikulum dan perancang Lembar Kerja Peserta Didik (LKPD) Pembelajaran Mendalam (Deep Learning) jenjang SMP/MTs Fase D.
${reg.promptGuidance}

PANDUAN PENYUSUNAN LKPD:
Berdasarkan dokumen Rencana Pelaksanaan Pembelajaran (RPP/RPM) berikut, susunlah Lembar Kerja Peserta Didik (LKPD) yang komprehensif, menantang bernalar kritis (HOTS), bermakna kontekstual, menyenangkan (joyful), dan terintegrasi penuh dengan:
1. Pijakan Tujuan Pembelajaran & Indikator Ketercapaian (KKTP).
2. Tiga Pengalaman Belajar: Memahami, Mengaplikasi, dan Merefleksi.
3. Tiga Prinsip Pembelajaran Mendalam: Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful).
4. Desain Pembelajaran & Sintaks Kegiatan (Pendahuluan, Inti, Penutup).
5. Asesmen formatif terpadu dengan rubrik 4 kriteria deskriptif (Baru Berkembang, Layak, Cakap, Mahir).

DATA PERENCANAAN (RPP/RPM):
- Satuan Pendidikan: ${plan.identitas.namaSekolah || profile.namaSekolah}
- Mata Pelajaran: ${mapel}
- Fase/Kelas: ${plan.identitas.fase || 'Fase D'} / Kelas ${plan.identitas.kelas}
- Alokasi Waktu: ${plan.identitas.alokasiWaktu}
- Topik/Materi Pokok: ${plan.identitas.topikMateri}
- Judul RPP: ${plan.judul}
- Capaian Pembelajaran: ${plan.tujuanPembelajaran.capaianPembelajaran}
- Tujuan Pembelajaran (TP): ${plan.tujuanPembelajaran.tujuanPembelajaran}
- Indikator Ketercapaian (KKTP): ${plan.tujuanPembelajaran.indikatorKetercapaian}
- Model/Metode & Praktik Pedagogis: ${plan.desainPembelajaran.modelMetode} (${plan.desainPembelajaran.praktikPedagogis})
- Kemitraan & Lingkungan: ${plan.desainPembelajaran.kemitraanPembelajaran} | ${plan.desainPembelajaran.lingkunganPembelajaran}
- Pemanfaatan Digital: ${plan.desainPembelajaran.pemanfaatanDigital}
- Rincian Pengalaman Belajar RPP:
  * Memahami: ${plan.pengalamanBelajar.memahami}
  * Mengaplikasi: ${plan.pengalamanBelajar.mengaplikasi}
  * Merefleksi: ${plan.pengalamanBelajar.merefleksi}
- Penerapan 3 Prinsip RPP:
  * Berkesadaran: ${plan.prinsipPembelajaranMendalam.berkesadaran}
  * Bermakna: ${plan.prinsipPembelajaranMendalam.bermakna}
  * Menggembirakan: ${plan.prinsipPembelajaranMendalam.menggembirakan}
- Sintaks Kegiatan Belajar RPP:
  * Pendahuluan: ${plan.rencanaKegiatan.pendahuluan}
  * Inti: ${plan.rencanaKegiatan.kegiatanInti}
  * Penutup: ${plan.rencanaKegiatan.penutup}
- Catatan / Instruksi Khusus Guru: ${customNotes || 'Buat aktivitas kontekstual, memancing rasa ingin tahu, kolaboratif tim heterogen, dan solusi nyata.'}

Kembalikan HANYA format JSON valid murni (tanpa teks pembuka atau penutup) dengan struktur persis berikut:
{
  "judulLKPD": "Lembar Kerja Peserta Didik: ...",
  "topikMateri": "${plan.identitas.topikMateri}",
  "alokasiWaktu": "${plan.identitas.alokasiWaktu}",
  "petunjukUmum": "1. ...\\n2. ...\\n3. ...",
  "aktivitasMindfulAwal": "Aktivitas pembiasaan hening sejenak / kesadaran penuh 1-2 menit sebelum memulai belajar...",
  "faseMemahami": {
    "stimulusWacana": "Teks cerita/studi kasus fenomena nyata kontekstual 2-3 paragraf...",
    "pertanyaanEksplorasi": [
      "Pertanyaan 1...",
      "Pertanyaan 2...",
      "Pertanyaan 3..."
    ]
  },
  "faseMengaplikasi": {
    "langkahKerja": [
      "Langkah 1...",
      "Langkah 2...",
      "Langkah 3...",
      "Langkah 4..."
    ],
    "alatBahan": [
      "Alat/bahan 1",
      "Alat/bahan 2"
    ],
    "tabelPengamatan": {
      "judulTabel": "Tabel 1. ...",
      "kolom": ["No", "Objek Pengamatan", "Karakteristik / Hasil Data", "Analisis Konsep", "Catatan"],
      "barisPanduan": ["Panduan baris 1...", "Panduan baris 2..."]
    },
    "tugasPemecahanMasalah": "Instruksi tantangan masalah nyata tingkat tinggi (HOTS) yang harus dipecahkan tim..."
  },
  "faseMerefleksi": {
    "pertanyaanRefleksi": [
      "Pertanyaan refleksi 1 (wawasan baru)...",
      "Pertanyaan refleksi 2 (pengalaman joyful/menantang)...",
      "Pertanyaan refleksi 3 (kontribusi diri)..."
    ],
    "kesimpulanBersama": "Panduan penarikan kesimpulan konsep...",
    "rencanaAksiNyata": "Rencana tindakan konkret dalam kehidupan sehari-hari..."
  },
  "rubrikPenilaian": [
    {
      "aspek": "Pemahaman Konsep (Fase Memahami)",
      "baruBerkembang": "...",
      "layak": "...",
      "cakap": "...",
      "mahir": "..."
    },
    {
      "aspek": "Penyelidikan & Analisis Data (Fase Mengaplikasi)",
      "baruBerkembang": "...",
      "layak": "...",
      "cakap": "...",
      "mahir": "..."
    },
    {
      "aspek": "Kolaborasi & Mindful-Joyful",
      "baruBerkembang": "...",
      "layak": "...",
      "cakap": "...",
      "mahir": "..."
    },
    {
      "aspek": "Refleksi & Aksi Nyata (Fase Merefleksi)",
      "baruBerkembang": "...",
      "layak": "...",
      "cakap": "...",
      "mahir": "..."
    }
  ],
  "catatanGuru": "..."
}`;

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        let jsonStr = data.text;
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonStr = match[1];
        }
        const parsed = JSON.parse(jsonStr);

        return {
          id: 'lkpd-' + plan.id + '-' + Date.now(),
          perencanaId: plan.id,
          judulLKPD: parsed.judulLKPD || fallback.judulLKPD,
          topikMateri: parsed.topikMateri || fallback.topikMateri,
          alokasiWaktu: parsed.alokasiWaktu || fallback.alokasiWaktu,
          petunjukUmum: parsed.petunjukUmum || fallback.petunjukUmum,
          aktivitasMindfulAwal: parsed.aktivitasMindfulAwal || fallback.aktivitasMindfulAwal,
          faseMemahami: {
            stimulusWacana: parsed.faseMemahami?.stimulusWacana || fallback.faseMemahami.stimulusWacana,
            pertanyaanEksplorasi: Array.isArray(parsed.faseMemahami?.pertanyaanEksplorasi) && parsed.faseMemahami.pertanyaanEksplorasi.length > 0
              ? parsed.faseMemahami.pertanyaanEksplorasi
              : fallback.faseMemahami.pertanyaanEksplorasi,
          },
          faseMengaplikasi: {
            langkahKerja: Array.isArray(parsed.faseMengaplikasi?.langkahKerja) && parsed.faseMengaplikasi.langkahKerja.length > 0
              ? parsed.faseMengaplikasi.langkahKerja
              : fallback.faseMengaplikasi.langkahKerja,
            alatBahan: Array.isArray(parsed.faseMengaplikasi?.alatBahan) && parsed.faseMengaplikasi.alatBahan.length > 0
              ? parsed.faseMengaplikasi.alatBahan
              : fallback.faseMengaplikasi.alatBahan,
            tabelPengamatan: {
              judulTabel: parsed.faseMengaplikasi?.tabelPengamatan?.judulTabel || fallback.faseMengaplikasi.tabelPengamatan.judulTabel,
              kolom: Array.isArray(parsed.faseMengaplikasi?.tabelPengamatan?.kolom) && parsed.faseMengaplikasi.tabelPengamatan.kolom.length > 0
                ? parsed.faseMengaplikasi.tabelPengamatan.kolom
                : fallback.faseMengaplikasi.tabelPengamatan.kolom,
              barisPanduan: Array.isArray(parsed.faseMengaplikasi?.tabelPengamatan?.barisPanduan)
                ? parsed.faseMengaplikasi.tabelPengamatan.barisPanduan
                : fallback.faseMengaplikasi.tabelPengamatan.barisPanduan,
            },
            tugasPemecahanMasalah: parsed.faseMengaplikasi?.tugasPemecahanMasalah || fallback.faseMengaplikasi.tugasPemecahanMasalah,
          },
          faseMerefleksi: {
            pertanyaanRefleksi: Array.isArray(parsed.faseMerefleksi?.pertanyaanRefleksi) && parsed.faseMerefleksi.pertanyaanRefleksi.length > 0
              ? parsed.faseMerefleksi.pertanyaanRefleksi
              : fallback.faseMerefleksi.pertanyaanRefleksi,
            kesimpulanBersama: parsed.faseMerefleksi?.kesimpulanBersama || fallback.faseMerefleksi.kesimpulanBersama,
            rencanaAksiNyata: parsed.faseMerefleksi?.rencanaAksiNyata || fallback.faseMerefleksi.rencanaAksiNyata,
          },
          rubrikPenilaian: Array.isArray(parsed.rubrikPenilaian) && parsed.rubrikPenilaian.length > 0
            ? parsed.rubrikPenilaian
            : fallback.rubrikPenilaian,
          catatanGuru: parsed.catatanGuru || fallback.catatanGuru,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('AI generation for LKPD encountered error, returning curated fallback:', err);
  }

  return fallback;
}

// ============================================================================
// 6. PENYUSUN NASKAH ASESMEN PEMBELAJARAN SESUAI BENTUK PILIHAN GURU
// ============================================================================
export interface GenerateNaskahParams {
  mapel: string;
  kelas: string;
  topik: string;
  judulAsesmen?: string;
  bentukAsesmen: string; // 'Kinerja' | 'Tes Tertulis' | 'Proyek' | 'Portofolio' | 'Observasi' | 'Diri / Antarteman' | string
  jenisAsesmen?: string; // 'Formatif' | 'Sumatif' | string
  tujuanPembelajaran?: string;
  jumlahSoal?: number; // Pilihan jumlah butir soal tes tertulis: 5, 10, 15, 20, 25, 30
  kktp?: number;
  instruksiKhusus?: string;
}

export function normalizeBentukAsesmen(bentuk: string = ''): 'Kinerja' | 'Tes Tertulis' | 'Proyek' | 'Portofolio' | 'Observasi' | 'Diri / Antarteman' {
  const b = bentuk.toLowerCase();
  if (b.includes('kinerja') || b.includes('praktik') || b.includes('unjuk')) return 'Kinerja';
  if (b.includes('tulis') || b.includes('tes') || b.includes('tertulis') || b.includes('soal')) return 'Tes Tertulis';
  if (b.includes('proyek') || b.includes('project')) return 'Proyek';
  if (b.includes('porto') || b.includes('dokumen') || b.includes('karya')) return 'Portofolio';
  if (b.includes('observasi') || b.includes('pengamatan')) return 'Observasi';
  if (b.includes('diri') || b.includes('teman') || b.includes('sejawat') || b.includes('peer')) return 'Diri / Antarteman';
  return 'Kinerja';
}

export function generateCuratedNaskahAsesmen(params: GenerateNaskahParams): string {
  const norm = normalizeBentukAsesmen(params.bentukAsesmen);
  const topik = params.topik || 'Materi Pembelajaran';
  const mapel = params.mapel || 'Mata Pelajaran';
  const kelas = params.kelas || 'Fase D / SMP';
  const targetKktp = params.kktp || 75;
  const tp = params.tujuanPembelajaran || `Peserta didik mampu memahami dan mengaplikasikan konsep ${topik} secara mendalam dan kontekstual.`;

  if (norm === 'Kinerja') {
    return `# NASKAH INSTRUMEN ASESMEN KINERJA & PRAKTIK
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Materi:** ${topik}
**Tujuan Pembelajaran:** ${tp}
**Target KKTP:** ${targetKktp}

---

### A. PETUNJUK PELAKSANAAN BAGI PESERTA DIDIK
1. Bacalah skenario tugas dan instruksi kerja berikut dengan cermat sebelum memulai.
2. Bekerjalah secara kolaboratif bersama kelompok dengan tetap menunjukkan kontribusi aktif perorangan.
3. Gunakan peralatan kerja dan sumber belajar yang telah disiapkan secara aman dan bertanggung jawab.
4. Catat setiap tahapan hasil pengamatan atau demonstrasi pada format lembar kerja kinerja yang tersedia.
5. Siapkan diri untuk mempresentasikan atau mendemonstrasikan hasil unjuk kerja di hadapan pendidik/rekan kelas.

---

### B. SKENARIO TUGAS PRAKTIK / UNJUK KERJA
Peserta didik dihadapkan pada studi kasus nyata tentang **${topik}**. Kelompok diminta merancang, menguji, dan mendemonstrasikan prosedur pemecahan masalah atau penyelidikan ilmiah mengenai fenomena tersebut.
* **Tugas Inti:** Lakukan demonstrasi/pengujian bertahap untuk membuktikan keterkaitan konsep ${topik} dengan kondisi riil di lingkungan sekitar.
* **Waktu Pengerjaan:** 2 x 40 menit (1 pertemuan praktikum terpadu).

---

### C. ALAT, BAHAN, DAN MEDIA PRAKTIK
1. Lembar Kerja Praktik Siswa (LKPD) & Panduan Operasional
2. Perangkat/spesimen pengujian terkait ${topik}
3. Alat ukur / instrumen pencatat data pengamatan
4. Format tabel kompilasi data dan alat tulis

---

### D. LANGKAH KERJA PRAKTIK
1. **Persiapan:** Memeriksa kelengkapan alat, membaca prosedur keselamatan, dan membagi peran kerja dalam kelompok secara berkesadaran (mindful).
2. **Pelaksanaan Praktik:** Melakukan pengujian/demonstrasi bertahap sesuai langkah kerja, mengamati fenomena, dan mengulang langkah bila terdapat keraguan data.
3. **Pencatatan & Analisis:** Menuliskan data hasil percobaan ke dalam tabel, mendiskusikan keteraturan pola atau anomali data, dan mengaitkannya dengan teori konsep esensial.
4. **Penyimpulan:** Menarik kesimpulan berbasis bukti nyata (evidence-based conclusion) untuk menjawab pertanyaan pemantik praktik.

---

### E. FORMAT LEMBAR PENGAMATAN KINERJA SISWA
| No | Nama Peserta Didik | Persiapan Alat & Peran (1-4) | Ketepatan Prosedur Praktik (1-4) | Analisis Data & Solusi (1-4) | Komunikasi Hasil (1-4) | Skor Total | Kategori Capaian |
|:--:|:-------------------|:----------------------------:|:--------------------------------:|:----------------------------:|:----------------------:|:----------:|:----------------:|
| 1  | ................... |                              |                                  |                              |                        |            |                  |
| 2  | ................... |                              |                                  |                              |                        |            |                  |
| 3  | ................... |                              |                                  |                              |                        |            |                  |

---

### F. RUBRIK PENILAIAN KINERJA (4 TINGKATAN INTERVAL)
1. **Baru Berkembang (Skor 1 / < 60):** Peserta didik belum dapat mengikuti langkah kerja tanpa pendampingan penuh dari guru, data pengamatan belum lengkap.
2. **Layak (Skor 2 / 60 - 74):** Mampu mengikuti langkah kerja praktik dengan sedikit arahan, mencatat sebagian besar data, namun analisis masih memerlukan bantuan pemantik.
3. **Cakap (Skor 3 / 75 - 89 / Memenuhi Target KKTP):** Melaksanakan langkah kerja praktik secara mandiri, cermat, aman, mencatat data akurat, dan merumuskan kesimpulan logis.
4. **Mahir (Skor 4 / 90 - 100):** Menunjukkan ketepatan prosedur yang luar biasa, mampu menjelaskan logika di balik setiap langkah, mengidentifikasi faktor kesalahan, serta membimbing rekan tim.`;
  }

  if (norm === 'Tes Tertulis') {
    const totalQ = (params.jumlahSoal && params.jumlahSoal >= 5 && params.jumlahSoal <= 50)
      ? params.jumlahSoal
      : (params.jumlahSoal || (params.jenisAsesmen === 'Sumatif' ? 25 : 10));
    const waktuMenit = totalQ <= 5 ? 30 : totalQ <= 10 ? 45 : totalQ <= 15 ? 60 : totalQ <= 20 ? 75 : totalQ <= 25 ? 80 : 90;

    let pgCount = 7;
    let isianCount = 2;
    let uraianCount = 1;

    if (totalQ === 5) {
      pgCount = 3;
      isianCount = 0;
      uraianCount = 2;
    } else if (totalQ === 10) {
      pgCount = 7;
      isianCount = 2;
      uraianCount = 1;
    } else if (totalQ === 15) {
      pgCount = 10;
      isianCount = 3;
      uraianCount = 2;
    } else if (totalQ === 20) {
      pgCount = 15;
      isianCount = 3;
      uraianCount = 2;
    } else if (totalQ === 25) {
      pgCount = 20;
      isianCount = 3;
      uraianCount = 2;
    } else if (totalQ === 30) {
      pgCount = 25;
      isianCount = 3;
      uraianCount = 2;
    } else {
      uraianCount = Math.max(1, Math.round(totalQ * 0.15));
      isianCount = Math.max(0, Math.round(totalQ * 0.15));
      pgCount = totalQ - uraianCount - isianCount;
    }

    // Question Bank templates for PG
    const pgTemplates = [
      {
        tanya: `Karakteristik utama yang membedakan konsep dasar ${topik} dari fenomena lainnya adalah...`,
        a: `Terjadi secara spontan tanpa dipengaruhi faktor lingkungan sekitar`,
        b: `Memiliki keteraturan pola yang dapat dibuktikan berdasarkan bukti saintifik nyata`,
        c: `Hanya dapat berlangsung dalam kondisi buatan laboratorium`,
        d: `Tidak memiliki pengaruh langsung terhadap aktivitas manusia sehari-hari`,
        kunci: 'B',
        alasan: `Konsep dasar ${topik} selalu didasari bukti saintifik terukur dan observabel.`,
        level: 'C2 - Pemahaman Konsep',
      },
      {
        tanya: `Jika terjadi perubahan kondisi awal pada ${topik}, langkah ilmiah paling tepat untuk menguji hipotesis adalah...`,
        a: `Menarik kesimpulan langsung tanpa verifikasi data kelompok kontrol`,
        b: `Membandingkan kondisi perlakuan dengan variabel kontrol secara objektif`,
        c: `Mengubah seluruh variabel percobaan secara serempak tanpa kontrol`,
        d: `Mengabaikan anomali data yang tidak sesuai dengan dugaan semula`,
        kunci: 'B',
        alasan: `Pengujian hipotesis saintifik menuntut kontrol variabel yang ketat dan objektif.`,
        level: 'C3 - Aplikasi Konseptual',
      },
      {
        tanya: `Pernyataan: "Penerapan konsep ${topik} yang tepat mampu meminimalkan dampak negatif dan memaksimalkan efisiensi proses kerja." Argumen pendukung terkuat adalah...`,
        a: `Konsep ini telah digunakan secara turun-temurun tanpa perubahan`,
        b: `Analisis mendalam memungkinkan setiap variabel dioptimalkan sesuai kebutuhan nyata`,
        c: `Biaya pelaksanaannya selalu lebih rendah daripada metode konvensional`,
        d: `Tidak membutuhkan evaluasi berkala selama masa implementasi`,
        kunci: 'B',
        alasan: `Optimasi berbasis data dan bukti adalah landasan nalar kritis analitis.`,
        level: 'C4 - Analisis Kritis',
      },
      {
        tanya: `Dalam ekosistem atau sistem kerja ${topik}, faktor yang paling berpotensi memicu kegagalan sistem adalah...`,
        a: `Keseimbangan input dan output energi yang terpelihara secara stabil`,
        b: `Gangguan atau terputusnya salah satu mata rantai komponen fungsional utama`,
        c: `Adanya variasi perlakuan yang terkontrol dengan baik`,
        d: `Peningkatan pengawasan mutu secara berkala oleh pelaku sistem`,
        kunci: 'B',
        alasan: `Kerusakan pada salah satu simpul sistem berdampak sistemik pada keseluruhan proses.`,
        level: 'C4 - Analisis Sistem',
      },
      {
        tanya: `Dua kelompok peserta didik menguji ${topik} dengan metode berbeda. Kelompok A menggunakan data kuantitatif, Kelompok B hanya perkiraan visual. Kesimpulan paling valid diperoleh...`,
        a: `Kelompok B karena lebih cepat dan efisien tanpa alat ukur`,
        b: `Kelompok A karena didukung instrumen pengukuran yang terstandar dan terverifikasi`,
        c: `Kedua kelompok sama-sama valid tanpa perlu dibandingkan`,
        d: `Tidak ada kelompok yang valid karena metodenya berbeda`,
        kunci: 'B',
        alasan: `Data kuantitatif berbasis instrumen valid memberikan bukti empiris yang dapat dipertanggungjawabkan.`,
        level: 'C4 - Evaluasi Bukti',
      },
      {
        tanya: `Pemanfaatan prinsip ${topik} dalam teknologi ramah lingkungan bertujuan utama untuk...`,
        a: `Meningkatkan penggunaan bahan baku tak terbarukan secara cepat`,
        b: `Mereduksi jejak karbon dan menjaga keberlanjutan sumber daya alam`,
        c: `Menghilangkan peran tenaga manusia seutuhnya dari ekosistem kerja`,
        d: `Mempercepat waktu produksi tanpa memperhatikan keselamatan kerja`,
        kunci: 'B',
        alasan: `Tujuan inti sains dan teknologi berwawasan lingkungan adalah keberlanjutan bumi.`,
        level: 'C3 - Penerapan Kontekstual',
      },
      {
        tanya: `Ketika mengomunikasikan hasil investigasi tentang ${topik} kepada masyarakat umum, etika ilmiah yang wajib dipatuhi adalah...`,
        a: `Mengubah data agar terkesan spektakuler dan menarik perhatian`,
        b: `Menyajikan data secara jujur, transparan, dan dapat diuji ulang`,
        c: `Merahasiakan metode agar tidak ditiru oleh pihak lain`,
        d: `Menolak saran perbaikan dari rekan sejawat atau penelaah`,
        kunci: 'B',
        alasan: `Integritas dan kejujuran data adalah pilar utama etika saintifik.`,
        level: 'C2 - Pemahaman Etika',
      },
      {
        tanya: `Perhatikan grafik tren perubahan pada materi ${topik}. Bila kurva menunjukkan kenaikan tajam pada fase awal lalu mendatar, kesimpulan logisnya adalah...`,
        a: `Reaksi atau proses telah mencapai titik jenuh / kesetimbangan dinamis`,
        b: `Sistem mengalami kerusakan total dan berhenti beroperasi`,
        c: `Alat ukur yang digunakan mengalami penurunan akurasi`,
        d: `Kondisi lingkungan tidak lagi memengaruhi proses yang berjalan`,
        kunci: 'A',
        alasan: `Kurva mendatar (plateau) menunjukkan tercapainya kapasitas maksimal atau kesetimbangan.`,
        level: 'C4 - Interpretasi Grafik',
      },
      {
        tanya: `Tindakan mitigasi yang paling efektif untuk mencegah miskonsepsi saat mempelajari ${topik} adalah...`,
        a: `Menghafal definisi buku tanpa mempraktikkan pengamatan langsung`,
        b: `Melakukan konfirmasi konsep melalui eksperimen terpandu dan diskusi sokratik`,
        c: `Menghindari pertanyaan kritis yang berbeda dari pandangan umum`,
        d: `Hanya mengandalkan satu sumber informasi tanpa perbandingan`,
        kunci: 'B',
        alasan: `Konfirmasi konsep lewat penyelidikan empiris mematahkan miskonsepsi secara kokoh.`,
        level: 'C3 - Metakognisi Belajar',
      },
      {
        tanya: `Hubungan timbal balik antara konsep ${topik} dan kesejahteraan masyarakat tercermin pada...`,
        a: `Penyalahgunaan sumber daya alam demi keuntungan sekelompok pihak`,
        b: `Inovasi lokal berbasis kearifan yang menjaga harmoni alam dan sosial`,
        c: `Pengabaian kearifan lokal demi modernisasi instan tanpa kajian`,
        d: `Ketergantungan penuh pada produk impor tanpa kemandirian bangsa`,
        kunci: 'B',
        alasan: `Harmoni sains dan kearifan lokal mewujudkan profil pelajar yang beriman dan bertakwa.`,
        level: 'C4 - Sintesis Sosiosainstifik',
      },
      // Extended questions for 15, 20, 25, 30 items
      {
        tanya: `Salah satu indikator keberhasilan penyelidikan terbimbing pada materi ${topik} adalah...`,
        a: `Hasil eksperimen harus persis dengan buku walau data di lapangan berbeda`,
        b: `Mampu menjelaskan alasan ilmiah di balik kesesuaian atau perbedaan data riil`,
        c: `Eksperimen diselesaikan paling awal tanpa perlu mencatat proses`,
        d: `Menyerahkan seluruh analisis kepada ketua kelompok saja`,
        kunci: 'B',
        alasan: `Bernalar kritis berarti mampu menganalisis alasan ilmiah dari variasi data nyata.`,
        level: 'C3 - Analisis Proses',
      },
      {
        tanya: `Jika variabel bebas dalam pengujian ${topik} dinaikkan sebesar dua kali lipat, prediksi ilmiah yang dapat diuji adalah...`,
        a: `Laju reaksi atau keluaran sistem akan merespons secara terukur sesuai hukum keteraturan`,
        b: `Sistem pasti meledak tanpa perlu dilakukan pengujian`,
        c: `Tidak akan ada perubahan apapun karena sistem kebal terhadap variabel`,
        d: `Data pengamatan sebelumnya harus dihapus seluruhnya`,
        kunci: 'A',
        alasan: `Prediksi ilmiah selalu didasarkan pada perumusan hubungan sebab-akibat yang terukur.`,
        level: 'C4 - Prediksi Berbasis Bukti',
      },
      {
        tanya: `Dalam menyusun laporan hasil asesmen ${topik}, bagian yang memuat refleksi keterbatasan penelitian adalah...`,
        a: `Judul dan Abstrak`,
        b: `Diskusi dan Rekomendasi Perbaikan`,
        c: `Daftar Hadir Siswa`,
        d: `Halaman Pengesahan`,
        kunci: 'B',
        alasan: `Refleksi keterbatasan metodologis termuat pada bagian pembahasan dan rekomendasi.`,
        level: 'C2 - Struktur Ilmiah',
      },
      {
        tanya: `Peran kolaborasi gotong royong dalam menganalisis fenomena ${topik} terbukti meningkatkan...`,
        a: `Persaingan tidak sehat antaranggota kelompok`,
        b: `Kekayaan sudut pandang solusi dan ketajaman verifikasi data`,
        c: `Waktu pengerjaan menjadi terhambat tanpa arah`,
        d: `Ketergantungan siswa aktif kepada siswa pasif`,
        kunci: 'B',
        alasan: `Kemitraan belajar memperkaya perspektif dan melatih empati kognitif.`,
        level: 'C2 - Kemitraan Belajar',
      },
      {
        tanya: `Ketika terjadi anomali data saat praktikum ${topik}, sikap saintifik yang paling terpuji adalah...`,
        a: `Memanipulasi angka agar terlihat sempurna di mata guru`,
        b: `Mencatat anomali apa adanya dan mendiskusikan kemungkinan penyebabnya`,
        c: `Menyalahkan teman sekelompok atas kesalahan yang terjadi`,
        d: `Merobek lembar kerja dan menggantinya dengan salinan kelompok lain`,
        kunci: 'B',
        alasan: `Kejujuran intelektual adalah fondasi karakter pelajar berkesadaran moral.`,
        level: 'C3 - Karakter Saintifik',
      },
      {
        tanya: `Penerapan skala prioritas dalam investigasi ${topik} bertujuan untuk...`,
        a: `Menyelesaikan masalah yang paling krusial dan berdampak luas terlebih dahulu`,
        b: `Mengerjakan bagian yang termudah saja dan meninggalkan yang sulit`,
        c: `Menghindari tugas yang memerlukan keterlibatan banyak pihak`,
        d: `Mempercepat waktu tanpa memperhatikan kedalaman pemahaman`,
        kunci: 'A',
        alasan: `Skala prioritas memaksimalkan efisiensi pemecahan masalah kompleks.`,
        level: 'C4 - Pengambilan Keputusan',
      },
      {
        tanya: `Instrumen asesmen yang paling tepat untuk mengukur keterampilan bernalar kritis siswa pada ${topik} adalah...`,
        a: `Soal hafalan istilah tanpa stimulus kontekstual`,
        b: `Tugas analisis studi kasus berbasis data nyata dan grafik fenomena`,
        c: `Mencocokkan tanggal bersejarah tanpa konteks materi`,
        d: `Tes kecepatan menulis tanpa memperhatikan isi argumen`,
        kunci: 'B',
        alasan: `Studi kasus menantang peserta didik mengonstruksi argumen berbasis bukti.`,
        level: 'C4 - Evaluasi Asesmen',
      },
      {
        tanya: `Konsep ${topik} membantu peserta didik menyadari bahwa alam semesta...`,
        a: `Berjalan secara acak tanpa aturan yang dapat dipelajari`,
        b: `Diciptakan dengan keteraturan dan keseimbangan sempurna oleh Tuhan YME`,
        c: `Dapat dieksploitasi tanpa batas demi kepentingan pribadi`,
        d: `Tidak membutuhkan kepedulian atau pemeliharaan dari manusia`,
        kunci: 'B',
        alasan: `Pembelajaran mendalam menumbuhkan keimanan, ketakwaan, dan kesadaran kosmis.`,
        level: 'C2 - Kesadaran Spiritual & Holistik',
      },
      {
        tanya: `Pemanfaatan media digital (simulasi virtual) pada materi ${topik} paling bermanfaat untuk...`,
        a: `Menggantikan interaksi sosial di dalam kelas seutuhnya`,
        b: `Memvisualisasikan konsep abstrak yang sulit diamati langsung secara mikroskopis`,
        c: `Menghabiskan kuota internet sekolah tanpa tujuan belajar`,
        d: `Menghindari kegiatan praktikum nyata yang aman dilakukan`,
        kunci: 'B',
        alasan: `Media digital berfungsi mengonversi abstraksi menjadi representasi visual konkret.`,
        level: 'C3 - Literasi Digital',
      },
      {
        tanya: `Kriteria utama sebuah kesimpulan ilmiah yang bermakna pada materi ${topik} adalah...`,
        a: `Panjang kalimatnya melebihi lima halaman kertas`,
        b: `Menjawab langsung tujuan pembelajaran dan didukung oleh bukti data valid`,
        c: `Menggunakan kata-kata yang rumit agar terdengar berwibawa`,
        d: `Berisi opini pribadi tanpa keterkaitan dengan data pengamatan`,
        kunci: 'B',
        alasan: `Kesimpulan efektif wajib menjawab rumusan masalah secara presisi berbasis bukti.`,
        level: 'C4 - Penarikan Kesimpulan',
      },
      {
        tanya: `Dalam konteks profil pelajar Pancasila, kemandirian saat mengerjakan tes ${topik} ditunjukkan dengan...`,
        a: `Mengandalkan bisikan jawaban dari rekan di sebelah`,
        b: `Percaya pada kemampuan analisis sendiri dan mengelola waktu secara terencana`,
        c: `Menyerah lebih awal ketika menemui soal bertingkat penalaran tinggi`,
        d: `Mencari kunci jawaban di internet secara sembunyi-sembunyi`,
        kunci: 'B',
        alasan: `Kemandirian belajar melahirkan integritas dan ketangguhan pribadi.`,
        level: 'C3 - Karakter Mandiri',
      },
      {
        tanya: `Strategi terbaik saat menghadapi soal uraian studi kasus ${topik} adalah...`,
        a: `Menuliskan jawaban sesingkat mungkin dalam satu kata`,
        b: `Mengidentifikasi pokok masalah, menguraikan bukti konsep, dan merumuskan solusi logis`,
        c: `Menulis ulang stimulus tanpa memberikan solusi atau analisis`,
        d: `Mengosongkan lembar jawaban jika belum yakin 100%`,
        kunci: 'B',
        alasan: `Sistematika pemecahan masalah menuntut alur identifikasi-analisis-solusi.`,
        level: 'C4 - Strategi Pemecahan Masalah',
      },
      {
        tanya: `Keterkaitan antara asesmen formatif dan sumatif pada materi ${topik} adalah...`,
        a: `Formatif memperbaiki proses belajar, sumatif mengukur capaian akhir kompetensi`,
        b: `Keduanya sama sekali tidak memiliki hubungan dalam pembelajaran`,
        c: `Formatif hanya untuk mencari kesalahan siswa tanpa umpan balik`,
        d: `Sumatif dilaksanakan setiap hari tanpa perlu asesmen proses`,
        kunci: 'A',
        alasan: `Formatif berfungsi sebagai as/for learning, sedangkan sumatif sebagai of learning.`,
        level: 'C2 - Prinsip Asesmen',
      },
      {
        tanya: `Dampak jangka panjang dari penguasaan konsep ${topik} bagi siswa adalah...`,
        a: `Hanya sekadar mendapatkan nilai rapor yang tinggi`,
        b: `Mampu mengambil keputusan bijak berbasis nalar kritis dalam kehidupan bermasyarakat`,
        c: `Lupa materi setelah ujian akhir semester selesai`,
        d: `Menolak mempelajari ilmu lain di luar materi tersebut`,
        kunci: 'B',
        alasan: `Pembelajaran bermakna membekali kecakapan hidup (life skills) sepanjang hayat.`,
        level: 'C4 - Pembelajaran Bermakna',
      },
      {
        tanya: `Refleksi di akhir pembelajaran ${topik} memberikan manfaat utama berupa...`,
        a: `Mengetahui kelebihan, kekurangan diri, dan merencanakan tindak lanjut belajar`,
        b: `Memperpanjang waktu istirahat sebelum jam pulang`,
        c: `Membandingkan kelemahan teman untuk direndahkan`,
        d: `Mengabaikan materi yang belum dipahami seutuhnya`,
        kunci: 'A',
        alasan: `Refleksi metakognitif melatih kesadaran diri (mindfulness) untuk perbaikan berkelanjutan.`,
        level: 'C3 - Refleksi Berkesadaran',
      },
    ];

    // Build PG questions string
    let pgQuestionsMarkdown = '';
    let kunciPGMarkdown = '';
    const actualPGCount = pgCount;

    for (let i = 0; i < actualPGCount; i++) {
      const baseQ = pgTemplates[i % pgTemplates.length];
      const q = i < pgTemplates.length
        ? baseQ
        : {
            ...baseQ,
            tanya: `(Analisis Lanjutan ${i + 1}) ` + baseQ.tanya,
            level: `C4 - Analisis Lanjutan Butir ${i + 1}`,
          };
      const no = i + 1;
      pgQuestionsMarkdown += `**Soal ${no} (${q.level}):**\n${q.tanya}\n* A. ${q.a}\n* B. ${q.b}\n* C. ${q.c}\n* D. ${q.d}\n* **Tuliskan Alasan Ilmiah Anda:** ............................................................\n\n`;
      kunciPGMarkdown += `* **Soal ${no}:** Kunci **${q.kunci}**. Alasan: ${q.alasan} (Skor: Pilihan 5 + Alasan 5 = 10 Poin)\n`;
    }

    // Build Isian questions string
    let isianQuestionsMarkdown = '';
    let kunciIsianMarkdown = '';
    let currentNo = actualPGCount + 1;

    if (isianCount > 0) {
      isianQuestionsMarkdown += `#### BAGIAN II: SOAL ISIAN SINGKAT ANALITIS (Bobot: 15 Poin per Soal)\n\n`;
      const isianPrompts = [
        `Jelaskan secara singkat hubungan sebab-akibat yang terjadi apabila prinsip utama ${topik} tidak diterapkan secara tepat pada situasi nyata!`,
        `Sebutkan dua indikator utama yang menunjukkan bahwa penerapan materi ${topik} telah berhasil mencapai target yang diharapkan!`,
        `Identifikasi satu faktor pendukung utama yang mempercepat keberhasilan proses ${topik} di lingkungan sekitar!`,
      ];
      for (let j = 0; j < isianCount; j++) {
        const no = currentNo++;
        const pText = isianPrompts[j % isianPrompts.length];
        isianQuestionsMarkdown += `**Soal ${no}:**\n${pText}\n* **Jawaban:** .......................................................................................\n\n`;
        kunciIsianMarkdown += `* **Soal ${no}:** Menjelaskan konsep secara runtut, tepat, dan relevan dengan konteks materi. (Skor max: 15 Poin)\n`;
      }
    }

    // Build Uraian questions string
    let uraianQuestionsMarkdown = '';
    let kunciUraianMarkdown = '';

    if (uraianCount > 0) {
      uraianQuestionsMarkdown += `#### BAGIAN ${isianCount > 0 ? 'III' : 'II'}: SOAL URAIAN PEMECAHAN MASALAH / HOTS (Bobot: 20-30 Poin per Soal)\n\n`;
      const uraianPrompts = [
        `Sebuah lingkungan masyarakat mengalami permasalahan yang berkaitan erat dengan konsep **${topik}**. Sebagai peserta didik yang telah mempelajari materi ini:\n1. Identifikasi faktor-faktor kunci penyebab timbulnya permasalahan tersebut!\n2. Rancanglah satu gagasan solusi konkret dan dapat diterapkan secara bertahap oleh masyarakat!\n3. Uraikan bagaimana Anda mengukur efektivitas dari solusi yang Anda tawarkan tersebut!`,
        `Berdasarkan data studi kasus mengenai fenomena **${topik}**, analisislah dampak positif dan negatif yang timbul dalam jangka panjang, serta berikan rekomendasi aksi nyata berbasis kearifan lokal!`,
      ];
      for (let k = 0; k < uraianCount; k++) {
        const no = currentNo++;
        const uText = uraianPrompts[k % uraianPrompts.length];
        uraianQuestionsMarkdown += `**Soal ${no} (Studi Kasus Kontekstual HOTS):**\n${uText}\n* **Ruang Jawaban:** .................................................................................\n\n`;
        kunciUraianMarkdown += `* **Soal ${no}:** Identifikasi masalah (10 poin) + Desain solusi konkret (10 poin) + Pengukuran efektivitas (10 poin). (Skor max: 30 Poin)\n`;
      }
    }

    return `# NASKAH INSTRUMEN TES TERTULIS
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Materi:** ${topik}
**Tujuan Pembelajaran:** ${tp}
**Jenis Asesmen:** ${params.jenisAsesmen || 'Formatif'}
**Bentuk Asesmen:** Tes Tertulis (${totalQ} Butir Soal)
**Komposisi Soal:** ${actualPGCount} Pilihan Ganda HOTS + ${isianCount} Isian Singkat + ${uraianCount} Uraian Kasus
**Target Ketuntasan (KKTP):** ${targetKktp}
**Waktu Pengerjaan:** ${waktuMenit} Menit

---

### A. PETUNJUK PENGERJAAN
1. Berdoalah sebelum mulai mengerjakan soal asesmen tertulis ini.
2. Tuliskan identitas nama lengkap, kelas, dan nomor presensi pada lembar jawaban yang tersedia.
3. Bacalah stimulus teks wacana kontekstual dan pertanyaan dengan teliti sebelum menentukan jawaban.
4. Kerjakan soal secara mandiri, jujur, percaya diri, dan utamakan kemampuan bernalar kritis Anda.

---

### B. KISI-KISI SINGKAT TES TERTULIS (${totalQ} SOAL)
* **Stimulus:** Wacana kontekstual fenomena ${topik} dalam kehidupan sehari-hari peserta didik.
* **Tingkat Kognitif:** Bergradasi dari C2 (Pemahaman), C3 (Aplikasi), hingga C4 (Analisis & Evaluasi HOTS).
* **Struktur Butir:**
  - Bagian I: ${actualPGCount} Soal Pilihan Ganda Beralasan (Bobot per butir: Pilihan 5 Poin, Alasan Ilmiah 5 Poin = 10 Poin).
  ${isianCount > 0 ? `- Bagian II: ${isianCount} Soal Isian Singkat Analitis (Bobot 15 Poin per butir).\n` : ''}  - Bagian ${isianCount > 0 ? 'III' : 'II'}: ${uraianCount} Soal Uraian Pemecahan Masalah HOTS (Bobot 30 Poin per butir).

---

### C. BUTIR SOAL TES TERTULIS

#### BAGIAN I: SOAL PILIHAN GANDA BERALASAN (${actualPGCount} Butir Soal)
*Petunjuk Khusus:* Pilihlah salah satu jawaban yang paling tepat (A, B, C, atau D), kemudian tuliskan alasan ilmiah logis yang mendasari pilihan Anda pada kolom yang disediakan!

**Wacana Pengantar:**
Dalam kehidupan sehari-hari, fenomena ${topik} sering kali kita temui saat mengamati lingkungan sekitar. Pemahaman mengenai konsep ini membantu kita menjelaskan mengapa suatu proses dapat terjadi secara teratur dan apa dampaknya bagi kehidupan manusia serta lingkungan.

${pgQuestionsMarkdown}---

${isianQuestionsMarkdown}---

${uraianQuestionsMarkdown}---

### D. KUNCI JAWABAN & PEDOMAN PENSKORAN (${totalQ} SOAL)
${kunciPGMarkdown}
${kunciIsianMarkdown}
${kunciUraianMarkdown}

* **Perhitungan Nilai Akhir (Skala 100):**
  $$\\text{Nilai Akhir} = \\left( \\frac{\\text{Total Skor Perolehan}}{\\text{Total Skor Maksimal}} \\right) \\times 100$$
* **Kriteria Ketercapaian Tujuan Pembelajaran (KKTP):**
  - Peserta didik dinyatakan **TUNTAS (Cakap/Mahir)** apabila Nilai Akhir $\\ge$ ${targetKktp}.
  - Peserta didik dengan Nilai < ${targetKktp} mendapatkan bimbingan remedial pada indikator yang belum tercapai.`;
  }

  if (norm === 'Proyek') {
    return `# PANDUAN PENUGASAN & INSTRUMEN ASESMEN PROYEK
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Tema Proyek:** ${topik}
**Tujuan Pembelajaran:** ${tp}
**Target KKTP:** ${targetKktp}
**Durasi Pelaksanaan:** 2 - 3 Pekan (Terjadwal)

---

### A. DESKRIPSI & PERTANYAAN PEMANDU PROYEK (DRIVING QUESTION)
Dalam proyek ini, peserta didik berkolaborasi dalam kelompok (4-5 orang) untuk menginvestigasi fenomena nyata di sekitar mereka terkait materi **${topik}**.
* **Pertanyaan Pemandu:** *"Bagaimana kita dapat menerapkan pemahaman tentang ${topik} untuk merancang karya/solusi nyata yang bermanfaat bagi lingkungan sekolah atau masyarakat sekitar?"*

---

### B. TAHAPAN PELAKSANAAN PROYEK
1. **Tahap 1: Perencanaan & Perumusan Masalah (Pekan 1)**
   - Pembagian peran anggota kelompok (Ketua, Pencatat Data, Peneliti Lapangan, Perancang Media).
   - Menentukan fokus masalah dan membuat jadwal aksi kelompok.
   - Konsultasi rancangan awal kepada guru pembimbing.
2. **Tahap 2: Investigasi & Pengumpulan Bukti (Pekan 2)**
   - Melakukan observasi, eksperimen mini, atau wawancara narasumber terkait ${topik}.
   - Mengolah data hasil investigasi dan mendiskusikan alternatif solusi.
3. **Tahap 3: Pembuatan Produk & Prototipe Solusi (Pekan 2-3)**
   - Menyusun produk akhir proyek (pilihan produk: Laporan Mini Riset, Infografik Poster Edukatif, Prototipe Alat Sederhana, atau Video Pendek Inspiratif).
4. **Tahap 4: Presentasi Karya & Refleksi Bersama (Pekan 3)**
   - Melakukan gelar karya (gallery walk) di kelas atau presentasi kelompok.
   - Menanggapi pertanyaan dari rekan tim lain dan menerima umpan balik apresiatif.

---

### C. LEMBAR RENCANA AKSI KELOMPOK
* **Nama Kelompok:** ..................................................................
* **Anggota Tim & Peran:**
  1. ............................................ (Koordinator Kelompok)
  2. ............................................ (Dokumentasi & Riset)
  3. ............................................ (Penyusun Produk/Karya)
  4. ............................................ (Juru Bicara/Presenter)
* **Bentuk Produk yang Dipilih:** [  ] Poster Infografik   [  ] Prototipe/Model   [  ] Video Edukasi   [  ] Laporan Investigasi

---

### D. RUBRIK PENILAIAN PROYEK MULTIDIMENSI
| Dimensi Penilaian | Baru Berkembang (1) | Layak (2) | Cakap / Target KKTP (3) | Mahir (4) | Skor (1-4) |
|:------------------|:--------------------|:----------|:------------------------|:----------|:----------:|
| **1. Perencanaan & Kolaborasi** | Perencanaan tidak terstruktur, peran anggota tidak terbagi jelas | Ada rencana kerja namun pembagian peran belum merata | Rencana kerja jelas, pembagian tugas adil, komunikasi tim berjalan baik | Rencana kerja sangat matang, proaktif, kolaborasi inklusif dan saling mendukung | .......... |
| **2. Proses Investigasi & Bukti** | Data minim, tidak ada bukti penyelidikan konseptual | Pengumpulan data cukup namun kurang mendalam | Data lengkap, relevan dengan materi ${topik}, analisis runtut | Investigasi mendalam, menyertakan data pembanding akurat dan nalar kritis tinggi | .......... |
| **3. Kualitas Produk Akhir** | Produk belum selesai atau kurang relevan dengan topik | Produk selesai namun informasi masih bersifat umum/dasar | Produk informatif, rapi, memuat solusi nyata dan berbasis materi | Produk sangat kreatif, bernilai estetis tinggi, aplikatif, dan berdampak nyata | .......... |
| **4. Presentasi & Refleksi** | Tidak siap presentasi, kesulitan menjawab pertanyaan | Presentasi kaku, membaca teks, respon terhadap tanya jawab terbatas | Presentasi komunikatif, percaya diri, mampu menjelaskan logika materi | Presentasi sangat memikat, interaktif, argumentasi ilmiah kuat, refleksi matang | .......... |

* **Total Skor:** (Jumlah Skor / 16) x 100.
* **Kategori Tuntas:** Skor Total >= ${targetKktp}.`;
  }

  if (norm === 'Portofolio') {
    return `# PANDUAN PENYUSUNAN & INSTRUMEN PENILAIAN PORTOFOLIO BELAJAR
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Lingkup Materi:** ${topik}
**Tujuan Pembelajaran:** ${tp}
**Target KKTP:** ${targetKktp}

---

### A. TUJUAN PENILAIAN PORTOFOLIO
Penilaian portofolio bertujuan mendokumentasikan rekam jejak perkembangan kompetensi, pemikiran mendalam, dan refleksi diri peserta didik dalam menguasai topik **${topik}** selama satu rentang pembelajaran.

---

### B. ARTEFAK BELAJAR YANG WAJIB DIKURASI
Setiap peserta didik menyusun satu bundel map portofolio (fisik atau digital) yang memuat minimal 4 dokumen artefak:
1. **Draf Awal / Lembar Kerja Perdana:** Bukti pemahaman awal materi sebelum revisi.
2. **Karya Hasil Perbaikan Berdasarkan Umpan Balik:** Menunjukkan respons positif murid terhadap masukan guru atau rekan sebaya.
3. **Karya Terbaik Pilihan Siswa:** Satu produk, ringkasan peta konsep, atau tugas unjuk kerja yang paling dibanggakan oleh peserta didik.
4. **Lembar Refleksi Metakognitif Siswa:** Uraian jujur mengenai proses belajar yang telah dilalui.

---

### C. LEMBAR REFLEKSI DIRI SISWA ATAS PORTOFOLIO (DIISI PESERTA DIDIK)
* **Nama Peserta Didik:** ..............................................................
* **Kelas / No. Presensi:** ............................................................
1. *Dari seluruh dokumen dalam portofolio ini, karya mana yang paling kamu banggakan? Jelaskan alasannya!*
   Jawaban: ............................................................................
2. *Kesulitan apa yang paling menantang saat mempelajari ${topik}, dan bagaimana caramu mengatasinya?*
   Jawaban: ............................................................................
3. *Perubahan atau kemajuan kemampuan apa yang paling nyata kamu rasakan sejak awal hingga akhir materi ini?*
   Jawaban: ............................................................................
4. *Apa target belajarmu selanjutnya untuk semakin memperdalam materi ini?*
   Jawaban: ............................................................................

---

### D. RUBRIK PENILAIAN PORTOFOLIO BELAJAR OLEH GURU
| Aspek Kriteria | Baru Berkembang (1) | Layak (2) | Cakap (3) [Target KKTP] | Mahir (4) |
|:---------------|:--------------------|:----------|:------------------------|:----------|
| **Kelengkapan Dokumen** | Kurang dari 2 artefak terlampir | Memuat 3 artefak, sebagian belum tertata rapi | Memuat lengkap 4 artefak sesuai ketentuan | Lengkap 4 artefak ditambah bukti pengayaan mandiri |
| **Bukti Kemajuan Belajar** | Tidak terlihat perbedaan kualitas antara draf awal dan akhir | Terlihat perbaikan minor, pemahaman konsep mulai tampak | Terlihat perkembangan jelas pada ketepatan konsep materi | Menunjukkan lonjakan kualitas yang signifikan dan kemandirian belajar |
| **Kedalaman Refleksi Diri** | Refleksi sangat singkat atau hanya satu kata | Refleksi normatif tanpa menguraikan pengalaman pribadi | Refleksi jujur, menyadari kelebihan dan area perbaikan | Refleksi sangat mendalam, analitis, dan memiliki rencana aksi mandiri |
| **Kerapian & Sistematika** | Dokumen tidak berurutan, tidak ada identitas | Dokumen tersusun sederhana | Dokumen rapi, bersampul, berurutan sesuai tanggal | Penyajian sangat estetis, kreatif, terstruktur sangat baik |

* **Pedoman Penskoran:** Nilai Portofolio = (Total Skor / 16) x 100 (Ketuntasan jika >= ${targetKktp}).`;
  }

  if (norm === 'Observasi') {
    return `# PANDUAN & LEMBAR OBSERVASI PROSES PEMBELAJARAN
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Materi:** ${topik}
**Tujuan Pembelajaran:** ${tp}
**Waktu Pengamatan:** Selama Proses KBM Berlangsung (Formatif)

---

### A. TUJUAN & PETUNJUK OBSERVASI BAGI GURU
Lembar observasi ini dirancang untuk merekam perilaku operasional, keterampilan proses bernalar, dan dimensi profil peserta didik secara berkelanjutan dan tanpa menghakimi.
1. Amati interaksi peserta didik saat berdiskusi, bekerja dalam kelompok, atau memecahkan masalah terkait **${topik}**.
2. Berikan skor (1 - 4) pada indikator perilaku operasional yang tampak.
3. Catat peristiwa penting (anekdot positif atau hal yang butuh bimbingan) pada kolom catatan deskriptif.

---

### B. INDIKATOR PERILAKU OPERASIONAL YANG DIAMATI
1. **Penalaran Kritis:** Mengajukan pertanyaan pemantik, berani menguji argumen, mengaitkan konsep ${topik} dengan logika sebab-akibat.
2. **Kolaborasi:** Berbagi peran dalam tim, aktif mendengarkan pendapat rekan, membantu anggota tim yang tertinggal.
3. **Kemandirian & Kegigihan:** Menunjukkan inisiatif belajar, fokus pengerjaan tugas, tidak mudah menyerah saat menemui kesulitan konseptual.
4. **Kejujuran & Tanggung Jawab:** Mencatat data apa adanya, mengembalikan alat belajar dalam kondisi baik, menghargai keberagaman ide.

---

### C. LEMBAR REKAP OBSERVASI KELAS
| No | Nama Peserta Didik | Penalaran Kritis (1-4) | Kolaborasi (1-4) | Kemandirian (1-4) | Tanggung Jawab (1-4) | Rata-rata Skor | Catatan Khusus Guru (Anekdot / Tindak Lanjut) |
|:--:|:-------------------|:------------------:|:-------------------:|:-------------------:|:--------------------:|:--------------:|:----------------------------------------------|
| 1  | ................... |                    |                     |                     |                      |                |                                               |
| 2  | ................... |                    |                     |                     |                      |                |                                               |
| 3  | ................... |                    |                     |                     |                      |                |                                               |
| 4  | ................... |                    |                     |                     |                      |                |                                               |
| 5  | ................... |                    |                     |                     |                      |                |                                               |

---

### D. DESKRIPSI TINGKAT CAPAIAN PERILAKU
* **Skor 1 (Belum Tampak):** Peserta didik pasif, belum menunjukkan inisiatif perilaku yang diharapkan, membutuhkan dorongan berkala.
* **Skor 2 (Mulai Tampak):** Mulai memperlihatkan perilaku bila diingatkan guru atau dipancing oleh rekan kelompoknya.
* **Skor 3 (Berkembang Sesuai Harapan / Target KKTP):** Konsisten menunjukkan perilaku secara wajar, mandiri, dan berkesinambungan.
* **Skor 4 (Membudaya / Sangat Baik):** Perilaku telah menjadi kebiasaan alami, menjadi teladan positif, dan menginspirasi teman sebayanya.`;
  }

  // Diri / Antarteman
  return `# INSTRUMEN ASESMEN PENILAIAN DIRI & REKAN SEJAWAT (SELF & PEER ASSESSMENT)
**Mata Pelajaran:** ${mapel}
**Kelas / Semester:** ${kelas}
**Topik / Materi:** ${topik}
**Tujuan Pembelajaran:** ${tp}

---

### PETUNJUK UMUM
Instrumen ini bertujuan membantu kita saling bercermin dan saling menyemangati dalam belajar. Isilah dengan jujur, objektif, dan berniat saling memajukan. Tidak ada hukuman atas jawaban yang jujur.

---

### BAGIAN I: PENILAIAN DIRI SENDIRI (SELF-ASSESSMENT)
**Nama Peserta Didik:** ...............................................................
*Berikan tanda centang (✓) pada kolom yang paling menggambarkan dirimu saat mempelajari materi **${topik}**:*

| No | Pernyataan Refleksi Diri | Sangat Setuju (4) | Setuju (3) | Kurang Setuju (2) | Tidak Setuju (1) |
|:--:|:-------------------------|:-----------------:|:----------:|:-----------------:|:----------------:|
| 1  | Saya memahami ide pokok dan konsep utama dari materi ${topik}. | [  ] | [  ] | [  ] | [  ] |
| 2  | Saya berani mengajukan pertanyaan ketika ada penjelasan yang belum saya pahami. | [  ] | [  ] | [  ] | [  ] |
| 3  | Saya aktif memberikan masukan dan menyelesaikan bagian tugas yang menjadi tanggung jawab saya. | [  ] | [  ] | [  ] | [  ] |
| 4  | Saya mendengarkan pendapat rekan kelompok dengan tenang dan menghargai perbedaan pandangan. | [  ] | [  ] | [  ] | [  ] |
| 5  | Saya dapat menghubungkan materi ini dengan hal-hal nyata dalam kehidupan sehari-hari saya. | [  ] | [  ] | [  ] | [  ] |

* **Refleksi Pribadi Singkat:** *"Hal yang paling membuat saya senang dalam pembelajaran ini adalah ............................................................."*
* **Komitmen Belajar Saya Selanjutnya:** *"Saya akan meningkatkan kemampuan saya pada bagian ............................................................."*

---

### BAGIAN II: PENILAIAN REKAN SEJAWAT (PEER ASSESSMENT)
**Nama Penilai:** .......................................... **Nama Teman yang Dinilai:** ..........................................

| No | Sikap & Kontribusi Teman Saya dalam Kelompok | Selalu (4) | Sering (3) | Kadang-kadang (2) | Belum Terlihat (1) |
|:--:|:---------------------------------------------|:----------:|:----------:|:-----------------:|:------------------:|
| 1  | Teman saya bersemangat dan tepat waktu dalam menyelesaikan tugas bersama. | [  ] | [  ] | [  ] | [  ] |
| 2  | Teman saya mau berbagi ide dan membantu rekan yang membutuhkan penjelasan. | [  ] | [  ] | [  ] | [  ] |
| 3  | Teman saya bertutur kata santun dan menghargai masukan dari anggota kelompok. | [  ] | [  ] | [  ] | [  ] |
| 4  | Teman saya fokus pada penyelesaian masalah materi ${topik} tanpa teralihkan hal lain. | [  ] | [  ] | [  ] | [  ] |

---

### BAGIAN III: KARTU APRESIASI & PESAN SAHABAT
1. **Hal Paling Hebat yang Telah Ditunjukkan oleh Rekan Saya:**
   *"Terima kasih kawan, kamu sangat hebat ketika ............................................................."*
2. **Saran Penyemangat agar Rekan Saya Semakin Bersinar:**
   *"Akan semakin keren lagi jika ke depan kamu ............................................................."*`;
}

export async function generateNaskahAsesmenWithAI(params: GenerateNaskahParams): Promise<string> {
  const norm = normalizeBentukAsesmen(params.bentukAsesmen);
  const totalQ = (params.jumlahSoal && params.jumlahSoal >= 5 && params.jumlahSoal <= 50)
    ? params.jumlahSoal
    : (params.jumlahSoal || (params.jenisAsesmen === 'Sumatif' ? 25 : 10));

  const prompt = `Anda adalah pakar instrumen asesmen pembelajaran Kurikulum Merdeka SMP dan Pembelajaran Mendalam (Deep Learning).
Susunlah sebuah NASKAH INSTRUMEN ASESMEN LENGKAP, SIAP CETAK & SIAP PAKAI untuk guru dan peserta didik SMP Fase D.

PARAMETER ASESMEN:
- Mata Pelajaran: ${params.mapel}
- Kelas: ${params.kelas}
- Topik / Materi: ${params.topik}
- Judul Asesmen: ${params.judulAsesmen || `Asesmen ${params.bentukAsesmen}: ${params.topik}`}
- Bentuk Asesmen Pilihan: ${norm} (${params.bentukAsesmen})
- Jenis Asesmen: ${params.jenisAsesmen || 'Formatif'}
${norm === 'Tes Tertulis' ? `- Target Jumlah Soal: TEPAT ${totalQ} BUTIR SOAL (${params.jenisAsesmen === 'Sumatif' ? 'Asesmen Sumatif' : 'Asesmen Formatif'})\n` : ''}- Tujuan Pembelajaran: ${params.tujuanPembelajaran || `Memahami dan menerapkan konsep esensial ${params.topik}`}
- Target Kriteria Ketercapaian (KKTP): ${params.kktp || 75}
${params.instruksiKhusus ? `- Instruksi Khusus Guru: ${params.instruksiKhusus}` : ''}

PANDUAN STRUKTUR KHUSUS SESUAI BENTUK ASESMEN:
1. JIKA KINERJA:
   - Skenario unjuk kerja nyata kontekstual
   - Petunjuk pengerjaan bagi siswa
   - Alat, bahan, dan media
   - Langkah operasional unjuk kerja / eksperimen / demonstrasi
   - Format tabel lembar pengamatan unjuk kerja siswa
   - Rubrik penilaian kinerja 4 tingkatan (Baru Berkembang, Layak, Cakap/Target KKTP, Mahir) dengan deskriptor perilaku konkret.
2. JIKA TES TERTULIS:
   - Petunjuk pengerjaan bagi siswa
   - Kisi-kisi singkat (indikator & level kognitif C2-C4 HOTS)
   - Stimulus wacana kontekstual fenomena nyata
   - TEPAT ${totalQ} Butir Soal terstruktur:
     * Pilihan Ganda Beralasan HOTS (A, B, C, D + kolom alasan penalaran ilmiah)
     * Isian Singkat Analitis
     * Soal Uraian Pemecahan Masalah HOTS
   - Kunci Jawaban Lengkap & Pembahasan Analitis untuk seluruh butir soal
   - Pedoman Penskoran & Rumus Nilai Akhir (Skala 100).
3. JIKA PROYEK:
   - Deskripsi proyek & Pertanyaan Pemandu (Driving Question)
   - Petunjuk penugasan kelompok & pembagian peran tim
   - 4 Tahapan Proyek (Perencanaan, Investigasi Lapangan/Eksperimen, Pembuatan Produk, Presentasi/Gelar Karya)
   - Batas waktu dan pilihan output karya nyata
   - Rubrik penilaian proyek komprehensif (Perencanaan, Proses/Investigasi, Kualitas Produk, Presentasi).
4. JIKA PORTOFOLIO:
   - Tujuan kurasi portofolio & daftar artefak wajib yang dikurasi (draf awal, draf revisi, karya terbaik, lembar refleksi)
   - Petunjuk penyusunan dan sistematika berkas portofolio bagi murid
   - Kriteria pemilihan karya terbaik oleh siswa
   - Lembar refleksi diri siswa atas portofolionya (pertanyaan metakognitif)
   - Rubrik penilaian portofolio oleh guru (Kelengkapan, Bukti Kemajuan Belajar, Kedalaman Refleksi, Kerapian).
5. JIKA OBSERVASI:
   - Konteks & fokus pengamatan guru (selama KBM berlangsung)
   - Petunjuk pengamatan bagi guru/observer
   - Indikator perilaku operasional konkret (Penalaran Kritis, Kolaborasi, Kemandirian, Tanggung Jawab)
   - Lembar tabel ceklis & skala pengamatan (1-4)
   - Format catatan jurnal anekdot & rekomendasi umpan balik formatif.
6. JIKA PENILAIAN DIRI / TEMAN (SELF/PEER ASSESSMENT):
   - Petunjuk pengisian yang ramah, bersahabat, dan jujur
   - Bagian I: Lembar Refleksi Diri Sendiri (5-6 pernyataan likert 1-4 + komitmen perbaikan)
   - Bagian II: Lembar Penilaian Teman Sejawat (sikap kerja tim & kontribusi)
   - Bagian III: Kartu Apresiasi & Saran Penyemangat Sahabat.

ATURAN PENTING:
- DILARANG mencantumkan nomor regulasi, nomor surat keputusan, nama peraturan, atau pasal (seperti 'Permendikdasmen No. ...', 'BSKAP No. ...', 'Kepka BKPDM No. ...') ke dalam teks naskah.
- Naskah harus langsung ditulis dalam format Markdown bersih, profesional, elegan, menggunakan heading, bullet points, dan tabel yang terstruktur rapi sehingga langsung siap dicetak atau diunduh sebagai dokumen asesmen.`;

  try {
    const res = await callServerAI(prompt);
    if (res && res.text && res.text.trim().length > 100) {
      return res.text.trim();
    }
  } catch (err) {
    console.warn('AI call for Naskah Asesmen failed, using curated fallback:', err);
  }

  return generateCuratedNaskahAsesmen(params);
}

// ==========================================
// MEDIA PEMBELAJARAN GENERATOR (BAGIAN 1 PERENCANAAN)
// ==========================================

export interface GenerateMediaRequest {
  mapel: string;
  kelas: string;
  topik: string;
  tujuanPembelajaran?: string;
  indikatorKetercapaian?: string;
  pengalamanBelajar?: {
    memahami?: string;
    mengaplikasi?: string;
    merefleksi?: string;
  };
  prinsipMendalam?: {
    berkesadaran?: string;
    bermakna?: string;
    menggembirakan?: string;
  };
  kategori: KategoriMediaPembelajaran;
  jenisSpesifik?: string;
  instruksiKhusus?: string;
}

export function generateCuratedMediaPembelajaran(params: GenerateMediaRequest): MediaPembelajaranItem {
  const {
    mapel,
    kelas,
    topik,
    tujuanPembelajaran,
    indikatorKetercapaian,
    pengalamanBelajar,
    prinsipMendalam,
    kategori,
    jenisSpesifik,
  } = params;

  const topicName = topik || 'Materi Pokok Pembelajaran';
  const tpText = tujuanPembelajaran || `Peserta didik mampu memahami dan menerapkan konsep ${topicName} dalam kehidupan nyata dengan bernalar kritis.`;
  const kktpText = indikatorKetercapaian || `Peserta didik mampu mengidentifikasi komponen kunci, menganalisis hubungan konsep, dan menyajikan solusi terkait ${topicName}.`;

  const id = 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  if (kategori === 'Visual') {
    const isPPT = (jenisSpesifik || '').toLowerCase().includes('ppt') || !jenisSpesifik;
    const isMindmap = (jenisSpesifik || '').toLowerCase().includes('mindmap');
    const isDiagram = (jenisSpesifik || '').toLowerCase().includes('diagram');

    const jenis = isMindmap ? 'Mindmap Visual' : isDiagram ? 'Diagram & Bagan Alir' : isPPT ? 'Slide Presentasi (PPT)' : 'Infografik Edukatif';
    const namaMedia = `${jenis}: Eksplorasi Konsep ${topicName}`;
    const tools = isPPT ? 'PowerPoint / Canva / Google Slides' : isMindmap ? 'Canva / GitMind / Kertas Gambar Plano' : 'Canva / Piktochart / Poster Visual';

    const markdownText = `# RANCANGAN MEDIA VISUAL: ${jenis.toUpperCase()}
**Mata Pelajaran:** ${mapel}  
**Kelas / Fase:** ${kelas} (Fase D SMP)  
**Topik Pembelajaran:** ${topicName}  
**Aplikasi / Format Rekomendasi:** ${tools}  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** ${tpText}
- **Indikator Ketercapaian (KKTP):** ${kktpText}
- **Peran dalam Pengalaman Belajar:** 
  - *Tahap Memahami:* Memberikan visualisasi konkret terhadap konsep abstrak sehingga mengurangi beban kognitif murid.
  - *Tahap Mengaplikasi:* Menjadi panduan visual saat berdiskusi, menganalisis data, dan memecahkan tantangan studi kasus.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Tampilan visual bersih, kontras teratur, dan minim distraksi untuk memusatkan atensi murid.
  - **Bermakna (Meaningful):** Menggunakan foto/ilustrasi kontekstual dari lingkungan nyata sekitar murid.
  - **Menggembirakan (Joyful):** Warna estetis, tipografi segar, dan elemen infografis interaktif yang memicu rasa ingin tahu.

---

### II. STRUKTUR & KONTEN RINCI MEDIA VISUAL

${isPPT ? `#### RANCANGAN SLIDE BY SLIDE (PRESENTASI AKTIF)

**Slide 1: Judul & Sasaran Capaian Pembelajaran**
- **Teks Judul:** Eksplorasi Mendalam: ${topicName}
- **Sub-judul:** Membangun Pemahaman Konseptual, Menalar Bukti, & Bertindak Nyata
- **Sasaran Utama (TP):** ${tpText}
- **Visual Prompt:** Foto fenomena autentik ${topicName} resolusi tinggi di lingkungan sekitar yang memancing rasa penasaran siswa.
- **Catatan Guru (Narasi Pembuka):** "Selamat pagi anak-anak hebat! Hari ini kita akan menjelajahi materi '${topicName}'. Target utama kita bersama adalah: ${tpText}. Mari kita buka hati dan pikiran kita untuk belajar secara berkesadaran."

**Slide 2: Pertanyaan Pemandu (Driving Question) & Indikator Capaian**
- **Poin Utama:**
  - Pertanyaan Kunci: Mengapa konsep ${topicName} ini sangat penting dalam memahami dunia di sekitar kita?
  - Indikator Target (KKTP): ${kktpText}
  - Alur Belajar: Menemukan fenomena → Menganalisis bukti data → Merumuskan kesimpulan bersama.
- **Visual Prompt:** Diagram alur misi bertingkat dengan ilustrasi petualang sains dan peta eksplorasi.
- **Catatan Guru:** "Perhatikan tantangan belajar hari ini. Kita tidak sekadar menghafal definisi, melainkan membuktikan bagaimana konsep ${topicName} ini bekerja nyata di sekitar kita."

**Slide 3: Peta Konsep Esensial & Karakteristik ${topicName}**
- **Poin Utama:**
  - Definisi esensial dan struktur pembentuk ${topicName}.
  - Ciri-ciri utama dan pola keteraturan yang menghubungkan konsep satu dengan lainnya.
  - Perbandingan antara kondisi normal dengan anomali fenomena.
- **Visual Prompt:** Bagan infografis visual terstruktur (hierarki konsep atau Venn Diagram) dengan pewarnaan kontras yang memudahkan fokus mata siswa.
- **Catatan Guru:** "Cermati bagan ini. Di sinilah letak inti dari ${topicName}. Bagaimana bagian pertama mempengaruhi bagian berikutnya? Mari kita diskusikan bersama."

**Slide 4: Studi Kasus Kontekstual di Lingkungan Sekitar**
- **Poin Utama:**
  - Fenomena riil di sekitar kita yang berkaitan langsung dengan ${topicName}.
  - Pengamatan data empiris: Apa bukti yang terlihat dan apa dampak yang dirasakan masyarakat?
  - Pertanyaan nalar: Mengapa fenomena tersebut bisa terjadi?
- **Visual Prompt:** Foto perbandingan berdampingan (Before - After) atau infografik kasus lingkungan nyata.
- **Catatan Guru:** "Lihat kasus nyata ini. Hubungkan dengan konsep ${topicName} yang baru saja kita bahas. Apa faktor kunci yang menjadi penyebab utamanya?"

**Slide 5: Panduan Investigasi Terbimbing (Hands-on Mindset)**
- **Poin Utama:**
  - Misi Kelompok: Menguji data spesimen / studi kasus pada LKPD.
  - Langkah 1: Klasifikasikan dan catat data kunci terkait ${topicName}.
  - Langkah 2: Diskusikan pola keteraturan dan uji kesesuaian dengan hipotesis awal.
  - Langkah 3: Siapkan 1 argumen terbaik kelompok untuk dipresentasikan.
- **Visual Prompt:** Ceklis visual 3 langkah penyelidikan dilengkapi timer jam pasir (alokasi waktu 15 menit).
- **Catatan Guru:** "Bekerjalah dengan saling mendengarkan secara mindful. Setiap anggota memiliki peran penting dalam kelompok untuk membuktikan konsep ini."

**Slide 6: Refleksi Bermakna & Komitmen Aksi Nyata**
- **Poin Utama:**
  - Pertanyaan Refleksi Diri: Apa wawasan baru tentang ${topicName} yang paling mengubah cara pandangmu hari ini?
  - Kebermaknaan: Bagaimana pemahaman ini membantumu menjadi pribadi yang lebih bertanggung jawab terhadap lingkungan?
  - Komitmen Aksi: Satu tindakan konkret yang akan kulakukan mulai hari ini.
- **Visual Prompt:** Ilustrasi bola lampu menyala berpadu dengan tangan siswa yang saling berkolaborasi menjaga bumi.
- **Catatan Guru:** "Mari hening 1 menit. Renungkan satu pelajaran paling berharga dari ${topicName} hari ini, dan tuliskan dalam tiket keluar (exit ticket) kalian."` : `#### RANCANGAN STRUKTUR INFOGRAFIK / MINDMAP

**1. Header Utama:**
- Judul Besar: **PETA EKSPLORASI: ${topicName.toUpperCase()}**
- Tagline: Menemukan Makna, Menghubungkan Konsep, Mengubah Aksi.

**2. Kuadran 1 (Kiri Atas) - Pondasi Konsep:**
- Definisi kunci dalam 2 kalimat lugas dan mudah dipahami anak usia SMP.
- Ikon grafis representatif dan contoh analogi sederhana.

**3. Kuadran 2 (Kanan Atas) - Mekanisme & Proses Alur:**
- Diagram langkah berurutan (1 → 2 → 3 → 4) dengan panah terarah.
- Penjelasan singkat pada setiap simpul proses.

**4. Kuadran 3 (Kiri Bawah) - Aplikasi di Dunia Nyata:**
- 3 contoh konkret pemanfaatan dalam kehidupan sehari-hari murid.
- Fakta menarik (*Did you know?*) yang menggugah rasa takjub.

**5. Kuadran 4 (Kanan Bawah) - Tantangan Berpikir Kritis:**
- Pertanyaan reflektif: *"Bagaimana jika komponen X ditiadakan? Apa yang akan terjadi?"*
- Ruang catatan eksplorasi mandiri peserta didik.`}

---

### III. PANDUAN IMPLEMENTASI GURU
1. **Penyajian:** Tampilkan media visual saat fase apersepsi untuk membangkitkan rasa ingin tahu, lalu jadikan rujukan visual menetap selama diskusi kelompok.
2. **Diferensiasi Pembelajaran:** Untuk murid dengan kecenderungan visual, bagikan cetakan kartu ringkasan visual atau QR Code slide materi.
3. **Evaluasi Formatif:** Minta murid menunjuk bagian slide/diagram yang paling menantang dan menjelaskan kembali dengan bahasa mereka sendiri.`;

    return {
      id,
      kategori: 'Visual',
      jenisSpesifik: jenis,
      namaMedia,
      alatBahanAplikasi: tools,
      deskripsiRingkas: `Media visual berbasis ${jenis} yang dirancang khusus untuk memvisualisasikan materi ${topicName} secara bertahap, memfasilitasi pemahaman mindful, dan menguatkan daya nalar kritis peserta didik.`,
      keselarasan: {
        materiPokok: topicName,
        tujuanPembelajaran: tpText,
        indikatorKetercapaian: kktpText,
        pengalamanBelajar: {
          tahap: 'Memahami',
          deskripsiPeran: 'Memberikan jembatan kognitif dari fenomena konkret menuju konsep abstrak melalui infografis dan visualisasi hierarki yang terstruktur.',
        },
        prinsipDeepLearning: {
          berkesadaran: 'Mengurangi beban visual (anti-clutter) dan menuntun fokus pandang murid pada ide kunci esensial.',
          bermakna: 'Menghadirkan contoh visual kasus nyata yang lekat dengan keseharian siswa SMP.',
          menggembirakan: 'Desain estetis, komunikatif, dan memancing diskusi interaktif antarmurid.',
        },
      },
      naskahRancanganLengkap: markdownText,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (kategori === 'Audio') {
    const jenis = jenisSpesifik || 'Podcast Edukasi Dialogis';
    const namaMedia = `Audio Pembelajaran: ${topicName} - Suara Alam & Sains`;
    const tools = 'Perekam Suara HP / Audacity / Canva Audio / WhatsApp Group Belajar';

    const markdownText = `# RANCANGAN MEDIA AUDIO: ${jenis.toUpperCase()}
**Mata Pelajaran:** ${mapel}  
**Kelas / Fase:** ${kelas} (Fase D SMP)  
**Topik Pembelajaran:** ${topicName}  
**Format:** Rekaman Audio Narasi Dialogis / Podcast Edukasi  
**Durasi Perkiraan:** 5 – 7 Menit  
**Aplikasi Produksi:** ${tools}  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** ${tpText}
- **Indikator Ketercapaian (KKTP):** ${kktpText}
- **Peran dalam Pengalaman Belajar:**
  - *Menyimak Aktif (Auditory Learning):* Melatih konsentrasi, imajinasi spasial, dan pemaknaan mendalam tanpa distraksi layar.
  - *Diferensiasi Akses:* Sangat ramah bagi peserta didik gaya belajar auditori serta dapat diputar ulang secara fleksibel.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Pembiasaan hening dan menyimak penuh (*mindful listening*) dengan pemandu suara yang ramah.
  - **Bermakna (Meaningful):** Cerita dialogis berbasis rasa penasaran dua sahabat yang membedah masalah nyata.
  - **Menggembirakan (Joyful):** Didukung efek suara (SFX) realistis, musik pengantar riang, dan humor cerdas yang edukatif.

---

### II. NASKAH AUDIO LENGKAP (SKRIP REKAMAN)

**Karakter Suara:**
1. **Guru / Narator:** Hangat, tenang, berwibawa, dan membimbing.
2. **Rian (Murid Penasaran):** Kritis, aktif, gemar bertanya tentang fenomena di sekitarnya.
3. **Zahra (Murid Pengamat):** Cermat, teliti, senang mengaitkan data dengan fakta nyata.

---

**[00:00 - 00:20] INTRO & MINDFUL CHECK-IN**
- *(Musik Pengantar: Melodi akustik ceria dan menenangkan mengalun perlahan, lalu mengecil menjadi latar belakang)*
- **Narator:** "Halo sahabat pembelajar hebat! Tarik napas perlahan... hembuskan. Selamat datang di Audio Pembelajaran SMP. Pasang telinga kalian, siapkan imajinasi, karena hari ini kita akan menyingkap misteri di balik **${topicName}**."

**[00:20 - 01:15] FENOMENA PEMANTIK (HOOK MASALAH NYATA)**
- *(SFX: Suara langkah kaki di taman, kicau burung, desau angin)*
- **Rian:** "Zahra, coba lihat ke arah pohon mangga itu! Kemarin daunnya masih segar, tapi kenapa sekarang ada bagian yang layu dan ada serangga kecil bergerombol?"
- **Zahra:** "Wah, menarik banget Rian! Itu bukan sekadar kebetulan. Segala sesuatu di alam semesta punya karakteristik dan pola hubungan yang saling memengaruhi. Itulah yang sedang kita pelajari dalam topik ${topicName}!"
- **Rian:** "Tunggu, jadi ada konsep sains yang menjelaskan kenapa hal itu bisa terjadi?"

**[01:15 - 03:30] EKSPLORASI KONSEP INTI**
- *(Musik Latar: Tempo sedikit lebih ritmis dan bersemangat)*
- **Narator:** "Betul sekali, Rian! Di balik fenomena tersebut, ada tiga prinsip penting yang perlu kita pahami bersama:
  1. *Prinsip Pertama:* Setiap komponen memiliki sifat dan ciri khas unik yang membedakannya dari yang lain.
  2. *Prinsip Kedua:* Adanya interaksi dan keteraturan sistem yang menjaga keseimbangan.
  3. *Prinsip Ketiga:* Perubahan kecil pada satu unsur akan berdampak langsung pada keseluruhan ekosistem belajar."
- **Zahra:** "Ah, jadi kalau kita menggunakan cara berpikir saintifik, kita bisa menganalisis masalah itu langkah demi langkah ya, Pak?"
- **Narator:** "Tepat sekali, Zahra! Inilah kekuatan bernalar kritis. Kita tidak hanya melihat apa yang tampak di permukaan, tapi memahami akar penyebabnya."

**[03:30 - 04:45] TANTANGAN INVESTIGASI AUDITORI (SIMAK & TEMUKAN)**
- *(SFX: Ketukan lonceng lembut pengingat konsentrasi)*
- **Narator:** "Sekarang giliran kalian yang sedang mendengarkan di kelas! Dengarkan baik-baik pertanyaan investigasi ini:
  *Jika kalian menemukan situasi di mana prinsip ${topicName} tidak berjalan semestinya, apa satu tindakan konkret tercepat yang bisa kalian lakukan bersama teman sekelompok?*
  Catat jawaban spontan kalian di buku catatan."

**[04:45 - 05:30] REFLEKSI PENUTUP & KOMITMEN GEMBIRA**
- **Rian:** "Wah, ternyata sains itu benar-benar ada di sekeliling kita ya! Saya jadi makin penasaran mau coba membuktikannya langsung di LKPD."
- **Zahra:** "Sama, Rian! Belajar jadi terasa seru dan bermakna kalau kita tahu manfaat nyatanya."
- **Narator:** "Luar biasa! Teruslah bertanya, teruslah mengamati, dan jadilah pembelajar yang berkesadaran serta penuh sukacita. Sampai jumpa di episode berikutnya!"
- *(Musik Penutup: Mengalun meriah lalu memudar perlahan / fade out)*

---

### III. LEMBAR PANDUAN GURU & LEMBAR SIMAK SISWA
1. **Aktivitas Pra-Mendengarkan (1 Menit):** Minta murid menutup mata, duduk rileks, dan memfokuskan telinga pada rekaman audio.
2. **Pertanyaan Pasca-Mendengarkan:**
   - Apa pesan utama yang disampaikan oleh tokoh Zahra dan Rian?
   - Sebutkan 2 kata kunci baru yang kalian tangkap dari narasi audio tadi!
3. **Tindak Lanjut:** Gunakan inspirasi dialog audio untuk memicu debat mini atau investigasi di LKPD.`;

    return {
      id,
      kategori: 'Audio',
      jenisSpesifik: jenis,
      namaMedia,
      alatBahanAplikasi: tools,
      deskripsiRingkas: `Media audio naratif dialogis (podcast edukasi) berdurasi 5 menit yang melatih keterampilan mindful listening, memantik imajinasi, dan menanamkan pemahaman mendalam tentang materi ${topicName}.`,
      keselarasan: {
        materiPokok: topicName,
        tujuanPembelajaran: tpText,
        indikatorKetercapaian: kktpText,
        pengalamanBelajar: {
          tahap: 'Memahami',
          deskripsiPeran: 'Menghadirkan pemantik masalah kontekstual melalui percakapan autentik yang melatih daya dengar, konsentrasi hening, dan penalaran kritis.',
        },
        prinsipDeepLearning: {
          berkesadaran: 'Membangun kebiasaan menyimak penuh (mindful listening) tanpa distraksi visual.',
          bermakna: 'Menghubungkan teori sains dengan fenomena obrolan nyata di taman/lingkungan sekitar.',
          menggembirakan: 'Diselingi efek suara (SFX) hidup dan dinamika dialog yang akrab serta bersahabat.',
        },
      },
      naskahRancanganLengkap: markdownText,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (kategori === 'Audiovisual') {
    const jenis = jenisSpesifik || 'Video Pembelajaran Konseptual & Storyboard';
    const namaMedia = `Video Edukasi: Eksplorasi Visual ${topicName}`;
    const tools = 'YouTube Edukasi / Canva Video / CapCut / Proyektor Kelas';

    const markdownText = `# RANCANGAN MEDIA AUDIOVISUAL: STORYBOARD & VIDEO EDUKASI
**Mata Pelajaran:** ${mapel}  
**Kelas / Fase:** ${kelas} (Fase D SMP)  
**Topik Pembelajaran:** ${topicName}  
**Format Video:** Video Micro-Learning Konseptual & Demonstrasi  
**Target Durasi:** 6 – 8 Menit  
**Platform / Perangkat:** ${tools}  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** ${tpText}
- **Indikator Ketercapaian (KKTP):** ${kktpText}
- **Peran dalam Pengalaman Belajar:**
  - *Multi-Sensori (Dual Coding):* Menggabungkan visual gerak dan narasi auditori untuk mempercepat pemahaman materi yang kompleks.
  - *Aktivasi Demonstrasi:* Memperlihatkan prosedur eksperimen/studi kasus yang sulit diamati langsung di kelas.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Dilengkapi panduan pemantauan aktif (*viewing guide sheet*) agar murid tidak menonton secara pasif.
  - **Bermakna (Meaningful):** Menghubungkan teori buku dengan rekaman fenomena nyata di Indonesia.
  - **Menggembirakan (Joyful):** Visual sinematik, transisi dinamis, dan tantangan tebak cepat di tengah video.

---

### II. STORYBOARD LENGKAP (TABEL SCENE DEMI SCENE)

| Scene | Durasi | Tampilan Visual (Video & Animasi) | Audio Narasi & Efek Suara | Teks di Layar (On-Screen Callout) |
|---|---|---|---|---|
| **Scene 1** | 00:00 - 00:45 | Bumper animasi ceria. Kamera drone menyorot lingkungan alam/sekolah. Guru muncul menyapa dengan hangat di laboratorium terbuka. | *Musik upbeat ceria.*<br>"Halo saintis muda! Pernahkah kalian memperhatikan bagaimana alam semesta mengatur dirinya dengan sangat teratur?" | **MENYINGKAP ${topicName.toUpperCase()}**<br>*Eksplorasi Sains Bermakna* |
| **Scene 2** | 00:45 - 02:00 | Animasi gerak (motion graphic) memperlihatkan perbandingan benda/situasi nyata. Panah animasi menunjuk bagian-bagian krusial yang sedang dibandingkan. | *SFX pop-up lembut.*<br>"Mari kita amati dua kondisi ini. Mengapa yang satu dapat berfungsi optimal sementara yang lain terganggu? Ada 3 rahasia di baliknya..." | **FAKTA KUNCI #1**<br>Karakteristik & Hubungan Antar Unsur |
| **Scene 3** | 02:00 - 04:00 | Demonstrasi langsung guru/murid melakukan langkah uji praktikum sederhana atau simulasi interaktif. Pengambilan gambar close-up pada perubahan yang terjadi. | *SFX instrumen ilmiah.*<br>"Perhatikan baik-baik saat variabel ini diubah. Lihat perubahan reaksinya! Inilah bukti nyata prinsip ${topicName} bekerja." | **LANGKAH DEMONSTRASI**<br>1. Amati Bukti<br>2. Catat Perubahan<br>3. Analisis Pola |
| **Scene 4** | 04:00 - 05:30 | Layar terbagi dua (Split Screen): Sebelah kiri studi kasus di masyarakat, sebelah kanan solusi teknologi ramah lingkungan. | *Musik berwibawa & reflektif.*<br>"Pengetahuan ini bukan cuma teori buku, melainkan kunci untuk menyelesaikan masalah nyata di lingkungan kita." | **DAMPAK NYATA BAGI KEHIDUPAN**<br>*Solusi Berkelanjutan* |
| **Scene 5** | 05:30 - 07:00 | Pause interaktif 10 detik dengan timer jam pasir di sudut layar. Muncul pertanyaan pemantik bernalar kritis. | *SFX hitung mundur detak jam.*<br>"Sekarang, hentikan video sejenak. Diskusikan dengan teman di sebelahmu: Apa kesimpulan sementaramu?" | **TANTANGAN BERPIKIR KRITIS:**<br>Apa yang terjadi jika variabel utama diubah? |
| **Scene 6** | 07:00 - 07:30 | Guru merangkum 3 poin emas. Ajakan untuk melanjutkan penyelidikan di LKPD kelompok. Outro animasi dan logo sekolah. | *Musik penutup inspiratif crescendo.*<br>"Hebat sekali! Sekarang mari kita buktikan pemahaman kalian melalui lembar kerja kelompok. Semangat belajar!" | **SIAP BERAKSI!**<br>Buka LKPD Fase Mengaplikasi |

---

### III. LEMBAR PANDUAN AKTIVITAS 3 TAHAP (GURU & MURID)
1. **Tahap Pra-Menonton (1 Menit):** Guru membagikan lembar panduan tontonan singkat berisi 2 pertanyaan pemantik.
2. **Tahap Saat-Menonton (6 Menit):** Murid mencatat kata kunci dan mengamati demonstrasi pada menit ke-3. Guru menjeda (*pause*) video di menit ke-05:30 untuk diskusi kilat 1 menit.
3. **Tahap Pasca-Menonton (3 Menit):** Perwakilan 2 murid menyampaikan poin paling menarik yang mereka temukan dari video sebelum memulai investigasi kelompok.`;

    return {
      id,
      kategori: 'Audiovisual',
      jenisSpesifik: jenis,
      namaMedia,
      alatBahanAplikasi: tools,
      deskripsiRingkas: `Rancangan video micro-learning dan storyboard 6 scene terstruktur yang memadukan visual kontekstual, demonstrasi praktikum, dan jeda refleksi interaktif untuk materi ${topicName}.`,
      keselarasan: {
        materiPokok: topicName,
        tujuanPembelajaran: tpText,
        indikatorKetercapaian: kktpText,
        pengalamanBelajar: {
          tahap: 'Memahami',
          deskripsiPeran: 'Memvisualisasikan fenomena abstrak dan demonstrasi prosedural secara terperinci melalui integrasi visual gerak dan narasi suara.',
        },
        prinsipDeepLearning: {
          berkesadaran: 'Menggunakan scene terstruktur dan viewing guide sheet agar murid menyimak aktif dan penuh kesadaran.',
          bermakna: 'Menampilkan contoh kasus nyata di lapangan yang relevan dengan kehidupan anak bangsa.',
          menggembirakan: 'Format micro-learning dinamis dengan jeda kuis interaktif yang menantang dan memotivasi.',
        },
      },
      naskahRancanganLengkap: markdownText,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Fallback: Multimedia / Interaktif
  const jenis = jenisSpesifik || 'Kuis Gamifikasi & Lab Virtual Interaktif';
  const namaMedia = `Media Interaktif: Gamifikasi & Simulasi ${topicName}`;
  const tools = 'Quizizz / Wordwall / PhET Interactive Simulation / Padlet Interaktif';

  const markdownText = `# RANCANGAN MULTIMEDIA INTERAKTIF & GAMIFIKASI
**Mata Pelajaran:** ${mapel}  
**Kelas / Fase:** ${kelas} (Fase D SMP)  
**Topik Pembelajaran:** ${topicName}  
**Format Interaktif:** Gamifikasi Kuis HOTS & Panduan Lab Maya  
**Platform Rekomendasi:** ${tools}  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** ${tpText}
- **Indikator Ketercapaian (KKTP):** ${kktpText}
- **Peran dalam Pengalaman Belajar:**
  - *Tahap Mengaplikasi & Merefleksi:* Memberikan pengalaman belajar langsung (*hands-on minds-on*) di mana murid memanipulasi variabel dan langsung menerima umpan balik seketika (*instant formative feedback*).
  - *Kolaborasi Aktif:* Mendorong kerja tim yang suportif dan melatih regulasi diri dalam kompetisi yang sehat.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Umpan balik langsung pada setiap soal membantu murid menyadari kekeliruan konsep tanpa rasa takut salah.
  - **Bermakna (Meaningful):** Tantangan berbasis skenario misi nyata (*mission-based challenge*).
  - **Menggembirakan (Joyful):** Elemen poin, lencana prestasi (*badges*), batas waktu ramah, dan perayaan capaian tim.

---

### II. SKENARIO PERMAINAN & BUTIR MISI INTERAKTIF (QUIZIZZ / WORDWALL)

**Mekanisme Permainan:**
- Mode: Tim Kolaboratif (Setiap tim terdiri atas 3-4 murid yang berembuk sebelum memilih jawaban).
- Aturan: Skor dihitung berdasarkan ketepatan nalar dan argumentasi, bukan kecepatan semata.

#### DAFTAR BUTIR MISI INTERAKTIF (HOTS & BERMAKNA):

**Misi 1: Detektif Fenomena Awal**
- **Skenario Soal:** *"Di sebuah ekosistem kebun sekolah, murid menemukan organisme dengan ciri: tubuh berbuku-buku, bernapas dengan trakea, dan memiliki 3 pasang kaki. Berdasarkan prinsip ${topicName}, organisme ini termasuk dalam kelompok..."*
- **Pilihan Interaktif:**
  - A. Arachnida (Laba-laba)
  - B. Insecta (Serangga) [KUNCI BENAR]
  - C. Myriapoda (Kaki seribu)
  - D. Crustacea (Udang-udangan)
- **Umpan Balik Seketika (Instant Feedback):**
  - *Jika Benar:* "Hebat! 3 pasang kaki (6 kaki) adalah ciri khas utama kelas Insecta. Kalian jeli mengamati!"
  - *Jika Kurang Tepat:* "Ingat kembali: Arachnida memiliki 4 pasang kaki (8 kaki), sedangkan spesimen ini memiliki 3 pasang."

**Misi 2: Tantangan Sebab-Akibat (Analisis HOTS)**
- **Skenario Soal:** *"Jika salah satu komponen kunci dalam ${topicName} mengalami penurunan drastis akibat pencemaran, apa konsekuensi langsung yang paling mungkin terjadi pada rantai berikutnya?"*
- **Pilihan Interaktif:**
  - A. Seluruh sistem tetap stabil tanpa ada pengaruh apapun.
  - B. Terjadi ketidakseimbangan di mana populasi pemangsa menurun dan mangsa meledak. [KUNCI BENAR]
  - C. Ekosistem langsung musnah dalam 24 jam.
  - D. Semua komponen berubah menjadi produsen.
- **Umpan Balik Seketika:**
  - *Penjelasan Nalar:* "Keterhubungan ekologis bersifat saling bergantung (*interdependence*). Hilangnya satu unsur mengganggu keseimbangan populasi lainnya."

**Misi 3: Simulasi Variabel (Lab Maya / Manipulasi Konsep)**
- **Skenario Soal:** *"Kalian sedang menggunakan simulasi laboratorium virtual. Saat kalian menaikkan suhu atau konsentrasi ke level maksimal, grafik menunjukkan kurva mendatar. Mengapa demikian?"*
- **Pilihan Interaktif:**
  - A. Karena alat ukur rusak secara digital.
  - B. Telah tercapai titik jenuh/optimum sehingga reaksi tidak bertambah lagi. [KUNCI BENAR]
  - C. Materi tersebut habis menguap tanpa sisa.
  - D. Tidak ada hubungan antara variabel dan hasil.
- **Umpan Balik Seketika:**
  - *Penjelasan Nalar:* "Tepat sekali! Setiap sistem biologis/fisik memiliki batas optimum (*saturation point*)."

**Misi 4: Misi Solusi Nyata (Pemberian Solusi Ramah Lingkungan)**
- **Skenario Soal:** *"Sebagai agen perubahan lingkungan di sekolah, tindakan mana yang paling mencerminkan penerapan prinsip ${topicName} untuk menjaga keberlanjutan?"*
- **Pilihan Interaktif:**
  - A. Membuang sampah campuran ke saluran air agar cepat hanyut.
  - B. Membuat komposting daun dan memilah sampah organik secara disiplin. [KUNCI BENAR]
  - C. Membakar tumpukan sampah plastik di pojok lapangan sekolah.
  - D. Menutup seluruh area hijau dengan semen agar bersih.
- **Umpan Balik Seketika:**
  - *Penjelasan Nalar:* "Luar biasa! Komposting mengembalikan nutrisi ke siklus alam secara seimbang dan berkelanjutan."

---

### III. PANDUAN FASILITASI GURU
1. **Pelaksanaan di Kelas (15-20 Menit):** Tayangkan papan peringkat ramah (*friendly leaderboard*) di layar proyektor kelas.
2. **Fasilitasi Diskusi:** Saat ada soal dengan tingkat kesalahan >40%, jeda permainan sejenak dan minta tim yang menjawab benar menjelaskan logika berpikir mereka kepada kelas.
3. **Selebrasi Positif:** Berikan apresiasi kepada tim terkompak, tim dengan argumen terbaik, dan tim yang menunjukkan peningkatan paling pesat (*most improved*).`;

  return {
    id,
    kategori: 'Multimedia-Interaktif',
    jenisSpesifik: jenis,
    namaMedia,
    alatBahanAplikasi: tools,
    deskripsiRingkas: `Media interaktif gamifikasi dan skenario lab maya multi-variabel untuk materi ${topicName} yang memberikan umpan balik formatif instan serta menciptakan pengalaman belajar menggembirakan.`,
    keselarasan: {
      materiPokok: topicName,
      tujuanPembelajaran: tpText,
      indikatorKetercapaian: kktpText,
      pengalamanBelajar: {
        tahap: 'Mengaplikasi',
        deskripsiPeran: 'Memfasilitasi penerapan konsep dan uji hipotesis melalui simulasi interaktif, kuis bernalar HOTS, dan refleksi kolaboratif bersama rekan tim.',
      },
      prinsipDeepLearning: {
        berkesadaran: 'Murid menyadari letak kekuatan dan miskonsepsi mereka secara mandiri melalui umpan balik seketika.',
        bermakna: 'Soal dan misi dirancang berbasis skenario nyata di lingkungan sekolah dan alam sekitar.',
        menggembirakan: 'Dinamika gamifikasi kolaboratif yang menghilangkan rasa cemas dan merayakan proses belajar.',
      },
    },
    naskahRancanganLengkap: markdownText,
    createdAt: now,
    updatedAt: now,
  };
}

export async function generateMediaPembelajaranWithAI(params: GenerateMediaRequest): Promise<MediaPembelajaranItem> {
  const {
    mapel,
    kelas,
    topik,
    tujuanPembelajaran,
    indikatorKetercapaian,
    pengalamanBelajar,
    prinsipMendalam,
    kategori,
    jenisSpesifik,
    instruksiKhusus,
  } = params;

  const topicName = topik || 'Materi Pokok Pembelajaran';
  const tpText = tujuanPembelajaran || 'Peserta didik memahami konsep secara bermakna dan menerapkannya dalam memecahkan masalah nyata.';
  const kktpText = indikatorKetercapaian || 'Mengidentifikasi konsep kunci, menganalisis hubungan sebab-akibat, dan merumuskan solusi kontekstual.';

  const prompt = `Anda adalah seorang Ahli Teknologi Pendidikan & Kurikulum Merdeka yang berpengalaman dalam merancang Media Pembelajaran Berbasis Pembelajaran Mendalam (Deep Learning: Berkesadaran, Bermakna, Menggembirakan).

TUGAS UTAMA:
Rancanglah NASKAH LENGKAP MEDIA PEMBELAJARAN yang SANGAT SPESIFIK, MENDALAM, DAN SELARAS PENUH dengan:
- Mata Pelajaran: ${mapel}
- Kelas / Fase: ${kelas} (Fase D SMP)
- Topik / Materi Pokok: ${topicName}
- Tujuan Pembelajaran (TP): ${tpText}
- Indikator Ketercapaian (KKTP): ${kktpText}
- Alur Pengalaman Belajar:
  * Memahami: ${pengalamanBelajar?.memahami || `Membangun pemahaman mendalam tentang konsep esensial ${topicName}`}
  * Mengaplikasi: ${pengalamanBelajar?.mengaplikasi || `Menganalisis fenomena nyata dan menyelesaikan tantangan kasus terkait ${topicName}`}
  * Merefleksi: ${pengalamanBelajar?.merefleksi || `Menilai pemahaman diri, merefleksikan makna belajar, dan komitmen aksi nyata`}
- Tiga Pilar Prinsip Pembelajaran Mendalam:
  * Berkesadaran (Mindful): ${prinsipMendalam?.berkesadaran || 'Memusatkan perhatian sadar, hening pemantik, dan eksplorasi esensial'}
  * Bermakna (Meaningful): ${prinsipMendalam?.bermakna || 'Mengaitkan konsep secara nyata dengan fenomena kehidupan sehari-hari'}
  * Menggembirakan (Joyful): ${prinsipMendalam?.menggembirakan || 'Membangun suasana kolaboratif yang positif, menantang, dan menyenangkan'}

KATEGORI MEDIA PILIHAN: ${kategori.toUpperCase()}
JENIS SPESIFIK / FORMAT: ${jenisSpesifik || kategori}
${instruksiKhusus ? `INSTRUKSI KHUSUS GURU: ${instruksiKhusus}` : ''}

SYARAT MUTLAK KESELARASAN MATERI POKOK & TUJUAN PEMBELAJARAN:
1. KONTEN HARUS KONKRET & AUTENTIK: Seluruh isi naskah (isi slide, narasi dialog, adegan video, atau butir kuis) WAJIB membahas fakta ilmiah, istilah kunci, proses nyata, contoh kasus aktual, dan penerapan materi "${topicName}". DILARANG KERAS menggunakan teks umum/generik seperti "Definisi materi", "Contoh kasus A", "Komponen 1 2 3", dsb. Tuliskan materi nyata mata pelajaran ${mapel}!
2. SASARAN TP DI AWAL MEDIA: Cantumkan Tujuan Pembelajaran "${tpText}" secara eksplisit pada bagian pembuka media (pada Slide 1/2 PPT, percakapan awal Podcast, Scene 1 video storyboard, dan pengantar kuis interaktif).
3. ALUR 3 TAHAP:
   - Tahap Memahami: Pancing atensi berkesadaran dengan fenomena riil terkait ${topicName}, lalu bedah struktur konsep kuncinya.
   - Tahap Mengaplikasi: Hadirkan studi kasus/data investigasi yang menguji nalar kritis (HOTS) sesuai indikator "${kktpText}".
   - Tahap Merefleksi: Ajak siswa merumuskan kebermaknaan belajar dan aksi nyata di lingkungan sekitar.

PEDOMAN STRUKTUR BERDASARKAN KATEGORI:
1. JIKA MEDIA VISUAL (Slide PPT, Infografik, Mindmap):
   - Jika PPT: Tuliskan Slide 1 hingga Slide 6 lengkap dengan format "#### Slide X: [Judul Spesifik Materi ${topicName}]", Poin Utama (data/fakta riil), Visual Prompt (deskripsi visual grafis), dan Catatan Guru (naskah lisan guru yang membimbing).
   - Jika Infografik/Mindmap: Tuliskan tata letak hierarki visual, kuadran konsep, simbol, dan alur keterhubungan konsep materi.
2. JIKA MEDIA AUDIO (Podcast Edukasi Dialogis, Sandiwara Radio):
   - Tentukan karakter (Narator/Guru, Rian sebagai siswa aktif, Zahra sebagai siswi cermat).
   - Tuliskan skrip dialog hidup lengkap dengan penanda durasi [00:00 - 05:00], efek suara [SFX: ...], dan musik latar [Musik: ...]. Tokoh saling berdiskusi membedah konsep ${topicName} dan menjawab tantangan TP.
3. JIKA MEDIA AUDIOVISUAL (Video Micro-learning, Storyboard):
   - Buat tabel STORYBOARD LENGKAP dengan kolom: Scene #, Durasi, Tampilan Visual (animasi/video), Audio Narasi/Dialog, dan Teks di Layar (On-Screen Callout).
   - Pastikan adegan memvisualisasikan fenomena konkret materi ${topicName} dan prosedur penyelidikan.
4. JIKA MULTIMEDIA / INTERAKTIF (Kuis Gamifikasi HOTS, Lab Maya):
   - Susun minimal 4-5 butir misi/soal interaktif bertaraf HOTS lengkap dengan format "**Misi X: [Judul Skenario Kasus ${topicName}]**", stimulus kasus riil, 4 pilihan ganda (A, B, C, D) dengan penanda [KUNCI BENAR], serta Umpan Balik Instan Konstruktif (Instant Feedback).

ATURAN REGULASI:
- DILARANG mencantumkan nomor surat keputusan, nomor regulasi, pasal hukum, atau peraturan kementerian dalam naskah hasil akhir.
- Tuliskan langsung dalam format Markdown yang elegan, rapi, terstruktur, dan siap diputar di kelas atau dicetak.`;

  try {
    const res = await callServerAI(prompt);
    if (res && res.text && res.text.trim().length > 150) {
      const generatedMarkdown = res.text.trim();
      const jenis = jenisSpesifik || (kategori === 'Visual' ? 'Slide Presentasi (PPT)' : kategori === 'Audio' ? 'Podcast Edukasi' : kategori === 'Audiovisual' ? 'Video Pembelajaran' : 'Kuis Gamifikasi Interaktif');
      const id = 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      return {
        id,
        kategori,
        jenisSpesifik: jenis,
        namaMedia: `${jenis}: Eksplorasi ${topicName}`,
        alatBahanAplikasi: kategori === 'Visual' ? 'PowerPoint / Canva / Google Slides' : kategori === 'Audio' ? 'Perekam Suara / Audacity / Canva' : kategori === 'Audiovisual' ? 'Canva Video / CapCut / YouTube Edukasi' : 'Quizizz / Wordwall / PhET Interactive',
        deskripsiRingkas: `Media pembelajaran kategori ${kategori} (${jenis}) yang dirumuskan secara khusus oleh AI untuk mendukung pembelajaran mendalam topik ${topicName}.`,
        keselarasan: {
          materiPokok: topicName,
          tujuanPembelajaran: tpText,
          indikatorKetercapaian: kktpText,
          pengalamanBelajar: {
            tahap: kategori === 'Multimedia-Interaktif' ? 'Mengaplikasi' : 'Memahami',
            deskripsiPeran: `Memperkuat penguasaan konsep ${topicName} melalui representasi ${kategori.toLowerCase()} yang interaktif dan berkesadaran.`,
          },
          prinsipDeepLearning: {
            berkesadaran: 'Mengembangkan fokus dan rasa ingin tahu murid melalui penyajian materi yang terarah.',
            bermakna: 'Menghubungkan teori pembelajaran dengan persoalan nyata di kehidupan sehari-hari siswa.',
            menggembirakan: 'Format komunikatif dan interaktif yang membangkitkan antusiasme belajar bersama.',
          },
        },
        naskahRancanganLengkap: generatedMarkdown,
        createdAt: now,
        updatedAt: now,
      };
    }
  } catch (err) {
    console.warn('AI call for Media Pembelajaran failed, using curated fallback:', err);
  }

  return generateCuratedMediaPembelajaran(params);
}
