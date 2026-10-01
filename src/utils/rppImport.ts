import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import { Perencanaan, TeacherProfile, normalizeDimensiProfilName } from '../types';
import { getRegulatoryHierarchy } from '../services/aiService';

// Initialize PDF.js worker using Vite bundle URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Extract raw text from MS Word (.docx) file
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

/**
 * Extract raw text from PDF (.pdf) file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageStrings = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .filter((s: string) => s.trim().length > 0);

    fullText += `\n--- Halaman ${pageNum} ---\n` + pageStrings.join(' ') + '\n';
  }

  return fullText.trim();
}

/**
 * Intelligent Rule-Based Parser to convert raw RPP / RPM / Modul Ajar text into a structured Perencanaan
 * according to Permendikdasmen No 13/2025 and Kepmendikdasmen No 126/P/2025
 */
export function parseRppTextToPerencanaan(rawText: string, profile: TeacherProfile): Perencanaan {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. EXTRACT IDENTITAS
  // Topik / Materi Pokok
  let topikMateri = '';
  const topicMatch = text.match(/(?:topik|materi\s*pokok|tema|judul\s*modul|materi\s*pembelajaran)[\s:=]+([^\n\r,.;]{3,80})/i);
  if (topicMatch && topicMatch[1]) {
    topikMateri = topicMatch[1].trim();
  } else {
    // Look at first few lines for potential title
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      if (
        !line.match(/modul\s*ajar|rpp|rencana|kurikulum|kementerian|dinas|sekolah/i) &&
        line.length > 5 &&
        line.length < 80
      ) {
        topikMateri = line;
        break;
      }
    }
  }
  if (!topikMateri) {
    topikMateri = profile.mataPelajaran ? `Materi ${profile.mataPelajaran}` : 'Materi Pembelajaran Mendalam';
  }

  // Mata Pelajaran
  let mataPelajaran = profile.mataPelajaran || '';
  const mapelMatch = text.match(/(?:mata\s*pelajaran|mapel)[\s:=]+([^\n\r,.;]{3,50})/i);
  if (mapelMatch && mapelMatch[1]) {
    mataPelajaran = mapelMatch[1].trim();
  }

  // Kelas
  let kelas = profile.kelasAktif || 'VII-A';
  const kelasMatch = text.match(/(?:kelas(?:\/semester)?|rombel)[\s:=]+([^\n\r,.;]{1,15})/i);
  if (kelasMatch && kelasMatch[1]) {
    const rawKelas = kelasMatch[1].trim();
    if (rawKelas.match(/vii|viii|ix|x|xi|xii|7|8|9|10|11|12/i)) {
      kelas = rawKelas.toUpperCase();
    }
  }

  // Fase
  let fase = profile.fase || 'Fase D';
  const faseMatch = text.match(/fase[\s:=]+([A-F])/i);
  if (faseMatch && faseMatch[1]) {
    fase = `Fase ${faseMatch[1].toUpperCase()}`;
  } else if (kelas.includes('VII') || kelas.includes('VIII') || kelas.includes('IX') || kelas.includes('7') || kelas.includes('8') || kelas.includes('9')) {
    fase = 'Fase D';
  }

  // Alokasi Waktu
  let alokasiWaktu = profile.alokasiWaktuDefault || '2 x 40 menit';
  const alokasiMatch = text.match(/(?:alokasi\s*waktu|durasi)[\s:=]+([^\n\r.;]{3,40})/i);
  if (alokasiMatch && alokasiMatch[1]) {
    alokasiWaktu = alokasiMatch[1].trim();
  }

  // Semester
  let semester: 'Ganjil' | 'Genap' = profile.semesterAktif || 'Ganjil';
  if (text.match(/semester[\s:=]*(?:2|ii|genap)/i)) {
    semester = 'Genap';
  } else if (text.match(/semester[\s:=]*(?:1|i|ganjil)/i)) {
    semester = 'Ganjil';
  }

  // Tahun Pelajaran
  let tahunPelajaran = profile.tahunPelajaran || '2025/2026';
  const tpMatch = text.match(/(?:tahun\s*(?:pelajaran|ajaran)|tp)[\s:=]+([0-9]{4}\/[0-9]{4})/i);
  if (tpMatch && tpMatch[1]) {
    tahunPelajaran = tpMatch[1].trim();
  }

  // 2. EXTRACT CAPAIAN & TUJUAN PEMBELAJARAN
  let capaianPembelajaran = '';
  const cpMatch = text.match(/(?:capaian\s*pembelajaran|cp)[\s:=]+([\s\S]*?)(?=(?:tujuan\s*pembelajaran|tp|indikator|materi|profil|kegiatan|alokasi|$))/i);
  if (cpMatch && cpMatch[1]) {
    capaianPembelajaran = cpMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 500);
  }
  if (!capaianPembelajaran) {
    capaianPembelajaran = `Peserta didik mampu memahami konsep esensial ${topikMateri}, melakukan penyelidikan terarah, dan mengaitkan konsep tersebut dengan fenomena nyata secara bernalar kritis dan mandiri.`;
  }

  let tujuanPembelajaran = '';
  const tpTextMatch = text.match(/(?:tujuan\s*pembelajaran|tp)[\s:=]+([\s\S]*?)(?=(?:indikator|kriteria|profil|materi|kegiatan|langkah|media|asesmen|$))/i);
  if (tpTextMatch && tpTextMatch[1]) {
    tujuanPembelajaran = tpTextMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 600);
  }
  if (!tujuanPembelajaran) {
    tujuanPembelajaran = `1. Melalui eksplorasi stimulus fenomena kontekstual, peserta didik mampu mengidentifikasi karakteristik utama ${topikMateri} dengan tepat.\n2. Melalui kegiatan investigasi kelompok dan diskusi terbimbing, peserta didik mampu menganalisis permasalahan terkait ${topikMateri} secara gotong royong.\n3. Melalui refleksi mendalam, peserta didik mampu menyimpulkan solusi dan komitmen penerapan konsep ${topikMateri} dalam kehidupan sehari-hari.`;
  }

  let indikatorKetercapaian = '';
  const iktpMatch = text.match(/(?:indikator\s*(?:ketercapaian|pencapaian)|iktp|kktp)[\s:=]+([\s\S]*?)(?=(?:profil|materi|kegiatan|langkah|media|asesmen|$))/i);
  if (iktpMatch && iktpMatch[1]) {
    indikatorKetercapaian = iktpMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 400);
  }
  if (!indikatorKetercapaian) {
    indikatorKetercapaian = `Peserta didik mencapai ketuntasan jika mampu menjelaskan konsep ${topikMateri} secara runtut, aktif bekerja sama dalam kelompok, dan mencapai nilai minimal KKTP ${profile.kktpDefault || 75}.`;
  }

  // 3. EXTRACT IDENTIFIKASI & DIMENSI PROFIL LULUSAN (8 Dimensi Profil Lulusan)
  const detectedDimensi: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('iman') || lowerText.includes('takwa') || lowerText.includes('akhlak')) {
    detectedDimensi.push('Keimanan dan Ketakwaan');
  }
  if (lowerText.includes('warga') || lowerText.includes('kebinekaan') || lowerText.includes('tanah air')) {
    detectedDimensi.push('Kewargaan');
  }
  if (lowerText.includes('nalar') || lowerText.includes('kritis') || lowerText.includes('logis')) {
    detectedDimensi.push('Penalaran Kritis');
  }
  if (lowerText.includes('kreatif') || lowerText.includes('kreativitas') || lowerText.includes('inovasi') || lowerText.includes('orisinal')) {
    detectedDimensi.push('Kreativitas');
  }
  if (lowerText.includes('kolaborasi') || lowerText.includes('gotong royong') || lowerText.includes('kerja sama')) {
    detectedDimensi.push('Kolaborasi');
  }
  if (lowerText.includes('mandiri') || lowerText.includes('kemandirian') || lowerText.includes('inisiatif')) {
    detectedDimensi.push('Kemandirian');
  }
  if (lowerText.includes('sehat') || lowerText.includes('kesehatan') || lowerText.includes('kebugaran') || lowerText.includes('well-being')) {
    detectedDimensi.push('Kesehatan');
  }
  if (lowerText.includes('komunikasi') || lowerText.includes('lisan') || lowerText.includes('bicara') || lowerText.includes('presentasi')) {
    detectedDimensi.push('Komunikasi');
  }

  const dimensiProfilLulusan =
    detectedDimensi.length > 0 ? detectedDimensi : ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'];

  let kesiapanAwal = '';
  const kesiapanMatch = text.match(/(?:kesiapan\s*(?:awal|belajar)|kemampuan\s*awal)[\s:=]+([\s\S]*?)(?=(?:karakteristik|kebutuhan|profil|tujuan|desain|$))/i);
  if (kesiapanMatch && kesiapanMatch[1]) {
    kesiapanAwal = kesiapanMatch[1].trim().substring(0, 350);
  } else {
    kesiapanAwal = `Sebagian besar peserta didik telah memiliki pengalaman empiris terkait fenomena ${topikMateri}, namun membutuhkan bimbingan terstruktur dalam mengonstruksi pemahaman konsep ilmiah.`;
  }

  let karakteristikMateri = '';
  const materiMatch = text.match(/(?:karakteristik\s*materi|sifat\s*materi)[\s:=]+([\s\S]*?)(?=(?:kebutuhan|kesiapan|profil|tujuan|$))/i);
  if (materiMatch && materiMatch[1]) {
    karakteristikMateri = materiMatch[1].trim().substring(0, 350);
  } else {
    karakteristikMateri = `Materi ${topikMateri} bersifat konseptual dan aplikatif yang menuntut kegiatan observasi langsung, penalaran logis, serta pemecahan masalah nyata.`;
  }

  let kebutuhanBelajar = '';
  const kebutuhanMatch = text.match(/(?:kebutuhan\s*belajar|diferensiasi)[\s:=]+([\s\S]*?)(?=(?:profil|tujuan|desain|kegiatan|$))/i);
  if (kebutuhanMatch && kebutuhanMatch[1]) {
    kebutuhanBelajar = kebutuhanMatch[1].trim().substring(0, 350);
  } else {
    kebutuhanBelajar = `Pemberian scaffolding bertahap dengan lembar panduan visual bagi kelompok yang memerlukan bantuan, serta tantangan analisis komparatif bagi kelompok mandiri.`;
  }

  // 4. EXTRACT DESAIN PEMBELAJARAN
  let modelMetode = 'Problem-Based Learning (PBL) dengan Inkuiri Terbimbing, Diskusi Kelompok, dan Presentasi';
  const modelMatch = text.match(/(?:model(?:\s*dan\s*metode)?\s*pembelajaran|metode\s*pembelajaran)[\s:=]+([^\n\r;.]{5,150})/i);
  if (modelMatch && modelMatch[1]) {
    modelMetode = modelMatch[1].trim();
  }

  let sumberBelajar = `Buku Teks ${mataPelajaran} SMP Kelas ${kelas}, Lembar Kerja Peserta Didik (LKPD) Kontekstual, dan Objek Lingkungan Sekitar`;
  const sumberMatch = text.match(/(?:sumber\s*belajar|media\s*dan\s*sumber)[\s:=]+([^\n\r;.]{5,200})/i);
  if (sumberMatch && sumberMatch[1]) {
    sumberBelajar = sumberMatch[1].trim();
  }

  // 5. EXTRACT LANGKAH KEGIATAN KBM
  let pendahuluan = '';
  const pendMatch = text.match(/(?:kegiatan\s*pendahuluan|pendahuluan|awal\s*pembelajaran)[\s:=]+([\s\S]*?)(?=(?:kegiatan\s*inti|inti|penutup|$))/i);
  if (pendMatch && pendMatch[1]) {
    pendahuluan = pendMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 600);
  }
  if (!pendahuluan) {
    pendahuluan = `1. Guru membuka pembelajaran dengan salam, doa bersama, dan presensi.\n2. Melakukan jeda hening / latihan bernapas berkesadaran (mindful check-in) untuk memusatkan perhatian.\n3. Memberikan apersepsi dan mengajukan pertanyaan pemantik kontekstual terkait materi ${topikMateri}.\n4. Menyampaikan tujuan pembelajaran, alur kegiatan, dan kriteria asesmen yang akan dicapai.`;
  }

  let kegiatanInti = '';
  const intiMatch = text.match(/(?:kegiatan\s*inti|inti\s*pembelajaran)[\s:=]+([\s\S]*?)(?=(?:kegiatan\s*penutup|penutup|asesmen|penilaian|$))/i);
  if (intiMatch && intiMatch[1]) {
    kegiatanInti = intiMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 1000);
  }
  if (!kegiatanInti) {
    kegiatanInti = `Tahap 1 (Orientasi Masalah): Peserta didik mengamati fenomena stimulus terkait ${topikMateri} dan merumuskan hipotesis awal.\nTahap 2 (Organisasi Belajar): Peserta didik dibagi ke dalam kelompok heterogen dan menerima LKPD penyelidikan.\nTahap 3 (Penyelidikan Terbimbing): Guru membimbing kelompok mengumpulkan bukti, mengolah data, dan mendiskusikan pemecahan masalah.\nTahap 4 (Pengembangan & Presentasi): Masing-masing kelompok mempresentasikan hasil temuan mereka dan mendapatkan tanggapan apresiatif dari kelompok lain.\nTahap 5 (Analisis & Evaluasi): Guru bersama peserta didik menarik simpulan konsep esensial materi.`;
  }

  let penutup = '';
  const penutupMatch = text.match(/(?:kegiatan\s*penutup|penutup|akhir\s*pembelajaran)[\s:=]+([\s\S]*?)(?=(?:asesmen|penilaian|lampiran|$))/i);
  if (penutupMatch && penutupMatch[1]) {
    penutup = penutupMatch[1].replace(/\n{2,}/g, '\n').trim().substring(0, 600);
  }
  if (!penutup) {
    penutup = `1. Guru bersama peserta didik merangkum poin-poin utama materi ${topikMateri}.\n2. Peserta didik melakukan refleksi terbimbing mengenai kebermaknaan pembelajaran dan perasaan belajar hari ini.\n3. Guru memberikan umpan balik formatif dan apresiasi terhadap partisipasi seluruh siswa.\n4. Menginformasikan rencana tindak lanjut untuk pertemuan berikutnya, kemudian menutup KBM dengan doa bersama.`;
  }

  // 6. EXTRACT PENGALAMAN PEMBELAJARAN MENDALAM
  let memahami = '';
  const memMatch = text.match(/(?:memahami|inquiry|mengamati)[\s:=]+([\s\S]*?)(?=(?:mengaplikasi|merefleksi|kegiatan|$))/i);
  if (memMatch && memMatch[1]) {
    memahami = memMatch[1].trim().substring(0, 400);
  } else {
    memahami = `Peserta didik mengamati stimulus fenomena kontekstual tentang ${topikMateri}, mengajukan pertanyaan kritis, dan menelaah informasi esensial secara kolaboratif.`;
  }

  let mengaplikasi = '';
  const aplMatch = text.match(/(?:mengaplikasi|menerapkan|aplikasi)[\s:=]+([\s\S]*?)(?=(?:merefleksi|refleksi|kegiatan|$))/i);
  if (aplMatch && aplMatch[1]) {
    mengaplikasi = aplMatch[1].trim().substring(0, 400);
  } else {
    mengaplikasi = `Peserta didik melakukan investigasi kelompok, menguji hipotesis dengan LKPD kontekstual, dan memecahkan studi kasus nyata terkait ${topikMateri}.`;
  }

  let merefleksi = '';
  const refMatch = text.match(/(?:merefleksi|refleksi|evaluasi\s*diri)[\s:=]+([\s\S]*?)(?=(?:prinsip|kegiatan|penutup|$))/i);
  if (refMatch && refMatch[1]) {
    merefleksi = refMatch[1].trim().substring(0, 400);
  } else {
    merefleksi = `Peserta didik mengevaluasi proses penyelidikan yang telah dilaksanakan, mengidentifikasi wawasan baru yang diperoleh, dan merumuskan komitmen tindakan nyata.`;
  }

  // 7. EXTRACT PRINSIP PEMBELAJARAN MENDALAM (3 PILAR)
  const berkesadaran = `Melatih fokus, kehadiran utuh, dan regulasi emosi melalui pembiasaan hening sejenak serta kesadaran tujuan sebelum mengeksplorasi ${topikMateri}.`;
  const bermakna = `Mengaitkan konsep ${topikMateri} langsung dengan persoalan nyata di lingkungan peserta didik sehingga materi memiliki nilai guna fungsional.`;
  const menggembirakan = `Menciptakan iklim kelas yang aman, apresiatif, interaktif dengan gamifikasi edukatif, serta perayaan keberhasilan capaian belajar bersama.`;

  // 8. EXTRACT RENCANA ASESMEN
  let asesmenAwal = 'Pertanyaan pemantik diagnostik non-tes dan kuis apersepsi singkat';
  let asesmenProses = 'Observasi rubrik unjuk kerja diskusi kelompok dan penilaian kinerja LKPD';
  let asesmenAkhir = `Tes tertulis pemahaman konsep esensial ${topikMateri} dan penilaian portofolio produk hasil belajar`;

  const asesmenMatch = text.match(/(?:asesmen|penilaian)[\s:=]+([\s\S]*?)(?=(?:lampiran|pengayaan|remedial|$))/i);
  if (asesmenMatch && asesmenMatch[1]) {
    const rawAsesmen = asesmenMatch[1];
    if (rawAsesmen.toLowerCase().includes('diagnostik') || rawAsesmen.toLowerCase().includes('awal')) {
      const matchAwal = rawAsesmen.match(/(?:awal|diagnostik)[\s:=]+([^\n\r.;]{5,150})/i);
      if (matchAwal && matchAwal[1]) asesmenAwal = matchAwal[1].trim();
    }
    if (rawAsesmen.toLowerCase().includes('formatif') || rawAsesmen.toLowerCase().includes('proses')) {
      const matchProses = rawAsesmen.match(/(?:proses|formatif)[\s:=]+([^\n\r.;]{5,150})/i);
      if (matchProses && matchProses[1]) asesmenProses = matchProses[1].trim();
    }
    if (rawAsesmen.toLowerCase().includes('sumatif') || rawAsesmen.toLowerCase().includes('akhir')) {
      const matchAkhir = rawAsesmen.match(/(?:akhir|sumatif)[\s:=]+([^\n\r.;]{5,150})/i);
      if (matchAkhir && matchAkhir[1]) asesmenAkhir = matchAkhir[1].trim();
    }
  }

  const judul = `Modul Ajar Pembelajaran Mendalam: ${topikMateri}`;

  return {
    id: 'plan-imported-' + Date.now(),
    judul,
    status: 'Siap Ajar',
    identitas: {
      namaSekolah: profile.namaSekolah || 'Satuan Pendidikan',
      mataPelajaran,
      fase,
      kelas,
      semester,
      tahunPelajaran,
      alokasiWaktu,
      topikMateri,
      pertemuanKe: 1,
    },
    identifikasi: {
      kesiapanAwal,
      karakteristikMateri,
      kebutuhanBelajar,
      dimensiProfilLulusan,
    },
    tujuanPembelajaran: {
      capaianPembelajaran,
      tujuanPembelajaran,
      indikatorKetercapaian,
      lingkupMateri: topikMateri,
    },
    desainPembelajaran: {
      praktikPedagogis: modelMetode,
      kemitraanPembelajaran: 'Kolaborasi kelompok heterogen, tutor sebaya empatik, dan dialog apresiatif guru-murid',
      lingkunganPembelajaran: 'Ruang kelas kondusif, laboratorium mini sains, dan lingkungan terbuka sekolah',
      pemanfaatanDigital: 'Media presentasi proyektor, tayangan video fenomena, serta lembar LKPD terdigitalisasi',
      modelMetode,
      sumberBelajar,
    },
    pengalamanBelajar: {
      memahami,
      mengaplikasi,
      merefleksi,
    },
    prinsipPembelajaranMendalam: {
      berkesadaran,
      bermakna,
      menggembirakan,
    },
    rencanaKegiatan: {
      pendahuluan,
      durasiPendahuluan: '10 menit',
      kegiatanInti,
      durasiInti: '60 menit',
      penutup,
      durasiPenutup: '10 menit',
    },
    rencanaAsesmen: {
      asesmenAwal,
      asesmenProses,
      asesmenAkhir,
      teknikAsesmen: 'Observasi kinerja, tes tertulis pilihan ganda/uraian, dan penilaian produk hasil karya',
      instrumenAsesmen: 'Rubrik penilaian unjuk kerja LKPD dan kisi-kisi soal evaluasi',
      kriteriaKetercapaian: `Peserta didik mencapai KKTP jika memperoleh skor minimal ${profile.kktpDefault || 75} pada asesmen proses dan akhir.`,
    },
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Enhance parsed Perencanaan using Gemini AI via server API endpoint
 * Refines the raw extracted draft into a compliant Permendikdasmen No 13/2025 Deep Learning document
 */
export async function enhanceImportedRPPWithAI(
  rawText: string,
  parsedPlan: Perencanaan,
  profile: TeacherProfile
): Promise<Perencanaan> {
  const currentMapel = parsedPlan.identitas.mataPelajaran || profile.mataPelajaran;
  const reg = getRegulatoryHierarchy(currentMapel);

  const prompt = `Anda adalah pakar kurikulum dan perancang Modul Ajar Pembelajaran Mendalam (Deep Learning).
${reg.promptGuidance}

Tugas Anda adalah menelaah teks dokumen RPP/RPM/Modul Ajar berikut, lalu menyempurnakan struktur perencanaannya ke dalam format JSON yang tepat sesuai hierarki regulasi nasional di atas.

Identitas Konteks Guru:
- Sekolah: ${profile.namaSekolah}
- Mata Pelajaran: ${currentMapel}
- Kelas: ${parsedPlan.identitas.kelas}
- Fase: ${parsedPlan.identitas.fase}
- Topik/Materi: ${parsedPlan.identitas.topikMateri}

TEKS DOKUMEN RPP / RPM SUMBER (Hasil ekstraksi berkas Word/PDF):
"""
${rawText.substring(0, 4000)}
"""

Kembalikan HANYA format JSON murni (tanpa teks pembuka/penutup) dengan struktur berikut:
{
  "judul": "...",
  "topikMateri": "...",
  "alokasiWaktu": "...",
  "kesiapanAwal": "...",
  "karakteristikMateri": "...",
  "kebutuhanBelajar": "...",
  "dimensiProfilLulusan": ["Penalaran Kritis", "Kolaborasi", "Kemandirian"],
  "capaianPembelajaran": "...",
  "tujuanPembelajaran": "...",
  "indikatorKetercapaian": "...",
  "praktikPedagogis": "...",
  "kemitraanPembelajaran": "...",
  "lingkunganPembelajaran": "...",
  "pemanfaatanDigital": "...",
  "modelMetode": "...",
  "sumberBelajar": "...",
  "memahami": "...",
  "mengaplikasi": "...",
  "merefleksi": "...",
  "berkesadaran": "...",
  "bermakna": "...",
  "menggembirakan": "...",
  "pendahuluan": "...",
  "durasiPendahuluan": "10 menit",
  "kegiatanInti": "...",
  "durasiInti": "60 menit",
  "penutup": "...",
  "durasiPenutup": "10 menit",
  "asesmenAwal": "...",
  "asesmenProses": "...",
  "asesmenAkhir": "...",
  "teknikAsesmen": "...",
  "instrumenAsesmen": "...",
  "kriteriaKetercapaian": "..."
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
          ...parsedPlan,
          judul: parsed.judul || parsedPlan.judul,
          identitas: {
            ...parsedPlan.identitas,
            topikMateri: parsed.topikMateri || parsedPlan.identitas.topikMateri,
            alokasiWaktu: parsed.alokasiWaktu || parsedPlan.identitas.alokasiWaktu,
          },
          identifikasi: {
            kesiapanAwal: parsed.kesiapanAwal || parsedPlan.identifikasi.kesiapanAwal,
            karakteristikMateri: parsed.karakteristikMateri || parsedPlan.identifikasi.karakteristikMateri,
            kebutuhanBelajar: parsed.kebutuhanBelajar || parsedPlan.identifikasi.kebutuhanBelajar,
            dimensiProfilLulusan: Array.isArray(parsed.dimensiProfilLulusan)
              ? Array.from(new Set(parsed.dimensiProfilLulusan.map((d: string) => normalizeDimensiProfilName(d)).filter(Boolean)))
              : parsedPlan.identifikasi.dimensiProfilLulusan,
          },
          tujuanPembelajaran: {
            capaianPembelajaran: parsed.capaianPembelajaran || parsedPlan.tujuanPembelajaran.capaianPembelajaran,
            tujuanPembelajaran: parsed.tujuanPembelajaran || parsedPlan.tujuanPembelajaran.tujuanPembelajaran,
            indikatorKetercapaian: parsed.indikatorKetercapaian || parsedPlan.tujuanPembelajaran.indikatorKetercapaian,
            lingkupMateri: parsed.topikMateri || parsedPlan.tujuanPembelajaran.lingkupMateri,
          },
          desainPembelajaran: {
            praktikPedagogis: parsed.praktikPedagogis || parsedPlan.desainPembelajaran.praktikPedagogis,
            kemitraanPembelajaran: parsed.kemitraanPembelajaran || parsedPlan.desainPembelajaran.kemitraanPembelajaran,
            lingkunganPembelajaran: parsed.lingkunganPembelajaran || parsedPlan.desainPembelajaran.lingkunganPembelajaran,
            pemanfaatanDigital: parsed.pemanfaatanDigital || parsedPlan.desainPembelajaran.pemanfaatanDigital,
            modelMetode: parsed.modelMetode || parsedPlan.desainPembelajaran.modelMetode,
            sumberBelajar: parsed.sumberBelajar || parsedPlan.desainPembelajaran.sumberBelajar,
          },
          pengalamanBelajar: {
            memahami: parsed.memahami || parsedPlan.pengalamanBelajar.memahami,
            mengaplikasi: parsed.mengaplikasi || parsedPlan.pengalamanBelajar.mengaplikasi,
            merefleksi: parsed.merefleksi || parsedPlan.pengalamanBelajar.merefleksi,
          },
          prinsipPembelajaranMendalam: {
            berkesadaran: parsed.berkesadaran || parsedPlan.prinsipPembelajaranMendalam.berkesadaran,
            bermakna: parsed.bermakna || parsedPlan.prinsipPembelajaranMendalam.bermakna,
            menggembirakan: parsed.menggembirakan || parsedPlan.prinsipPembelajaranMendalam.menggembirakan,
          },
          rencanaKegiatan: {
            pendahuluan: parsed.pendahuluan || parsedPlan.rencanaKegiatan.pendahuluan,
            durasiPendahuluan: parsed.durasiPendahuluan || parsedPlan.rencanaKegiatan.durasiPendahuluan,
            kegiatanInti: parsed.kegiatanInti || parsedPlan.rencanaKegiatan.kegiatanInti,
            durasiInti: parsed.durasiInti || parsedPlan.rencanaKegiatan.durasiInti,
            penutup: parsed.penutup || parsedPlan.rencanaKegiatan.penutup,
            durasiPenutup: parsed.durasiPenutup || parsedPlan.rencanaKegiatan.durasiPenutup,
          },
          rencanaAsesmen: {
            asesmenAwal: parsed.asesmenAwal || parsedPlan.rencanaAsesmen.asesmenAwal,
            asesmenProses: parsed.asesmenProses || parsedPlan.rencanaAsesmen.asesmenProses,
            asesmenAkhir: parsed.asesmenAkhir || parsedPlan.rencanaAsesmen.asesmenAkhir,
            teknikAsesmen: parsed.teknikAsesmen || parsedPlan.rencanaAsesmen.teknikAsesmen,
            instrumenAsesmen: parsed.instrumenAsesmen || parsedPlan.rencanaAsesmen.instrumenAsesmen,
            kriteriaKetercapaian: parsed.kriteriaKetercapaian || parsedPlan.rencanaAsesmen.kriteriaKetercapaian,
          },
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('AI enhancement fallback to heuristic parsed plan:', err);
  }

  return parsedPlan;
}
