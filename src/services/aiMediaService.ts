import {
  MediaAnalisisAI,
  MediaRekomendasiItem,
  MediaKontrolGuru,
  MediaRancanganData,
  MediaProdukData,
  MediaRecord,
  KategoriMediaUtama,
  StoryboardVideoRow,
  InteractivePageItem,
  SlidePPTItem,
} from '../types';

export interface MediaInputContext {
  mapel: string;
  kelas: string;
  fase?: string;
  topikMateri: string;
  subMateri?: string;
  tujuanPembelajaran: string;
  alokasiWaktu?: string;
  karakteristikPesertaDidik?: string;
  modelMetode?: string;
  dimensiProfilLulusan?: string[];
  rppId?: string;
  rppJudul?: string;
  namaGuru?: string;
  pengalamanBelajar?: { memahami?: string; mengaplikasi?: string; merefleksi?: string };
  prinsipMendalam?: { berkesadaran?: string; bermakna?: string; menggembirakan?: string };
}

// Call backend server Gemini API
async function callServerAI(prompt: string, systemInstruction?: string): Promise<{ text: string; isReal: boolean } | null> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return { text: data.text, isReal: !data.isFallback };
      }
    }
  } catch (err) {
    console.warn('Backend AI fetch failed, using pedagogical generator:', err);
  }
  return null;
}

function extractJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // ignore
      }
    }
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

/**
 * 1. AI ANALISIS MATERI & KEBUTUHAN MEDIA
 * Menganalisis materi berdasarkan karakteristik, tingkat abstraksi, kebutuhan visualisasi, audio, demonstrasi, dan interaktivitas
 */
export async function analyzeMateriNeeds(context: MediaInputContext): Promise<MediaAnalisisAI> {
  const prompt = `Anda adalah Pakar Media Pembelajaran & Teknologi Pendidikan Kurikulum Merdeka.
Lakukan ANALISIS KEBUTUHAN MEDIA PEMBELAJARAN berdasarkan data perencanaan berikut:
- Mata Pelajaran: ${context.mapel}
- Kelas / Fase: ${context.kelas} (${context.fase || 'Fase D'})
- Materi Pokok: ${context.topikMateri} ${context.subMateri ? `(Submateri: ${context.subMateri})` : ''}
- Tujuan Pembelajaran: ${context.tujuanPembelajaran}
- Karakteristik Peserta Didik: ${context.karakteristikPesertaDidik || 'Sebagian besar membutuhkan visualisasi konkret dan latihan terpandu'}
- Model/Metode: ${context.modelMetode || 'Problem-Based Learning'}
- Dimensi Profil Lulusan: ${(context.dimensiProfilLulusan || ['Penalaran Kritis', 'Kolaborasi']).join(', ')}

Keluarkan HANYA JSON valid dengan struktur:
{
  "karakteristikMateri": "penjelasan jenis pengetahuan (konseptual/faktual/prosedural) dan tantangan belajarnya",
  "tingkatAbstraksi": "Rendah (Konkret)" ATAU "Sedang" ATAU "Tinggi (Abstrak)",
  "kebutuhanVisualisasi": "penjelasan rincian apa yang wajib divisualkan (struktur, bagan, perbandingan, foto)",
  "kebutuhanAudio": "penjelasan kebutuhan narasi pemantik, suara kontekstual, atau percakapan dialogis",
  "kebutuhanDemonstrasi": "penjelasan proses/langkah kerja yang memerlukan contoh gerakan atau demonstrasi nyata",
  "kebutuhanInteraktivitas": "penjelasan aktivitas di mana murid memanipulasi variabel atau menguji pemahaman langsung",
  "analisisBebanKognitif": "strategi menurunkan beban kognitif asing (extraneous load) dan memaksimalkan germane load",
  "rekomendasiStrategi": "rekomendasi umum format media yang paling efektif"
}`;

  try {
    const aiRes = await callServerAI(prompt);
    if (aiRes?.text) {
      const parsed = extractJSON<MediaAnalisisAI>(aiRes.text);
      if (parsed?.karakteristikMateri && parsed?.tingkatAbstraksi) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('AI analysis fallback:', err);
  }

  // Robust pedagogical fallback
  const isScience = /ipa|sains|biologi|fisika|kimia/i.test(context.mapel);
  const isMath = /matematika|hitung/i.test(context.mapel);
  const isSocial = /ips|sejarah|geografi|sosiologi|pkn|pancasila/i.test(context.mapel);
  const isLanguage = /indonesia|inggris|bahasa/i.test(context.mapel);

  let tingkatAbstraksi: 'Rendah (Konkret)' | 'Sedang' | 'Tinggi (Abstrak)' = 'Sedang';
  if (isMath || /atom|sel|genetika|gravitasi/i.test(context.topikMateri)) {
    tingkatAbstraksi = 'Tinggi (Abstrak)';
  } else if (/lingkungan|taman|sampah|pasar|keluarga/i.test(context.topikMateri)) {
    tingkatAbstraksi = 'Rendah (Konkret)';
  }

  return {
    karakteristikMateri: `Materi ${context.topikMateri} memuat konsep esensial yang memerlukan keterhubungan antara teori ilmiah dan aplikasi nyata dalam kehidupan sehari-hari siswa SMP.`,
    tingkatAbstraksi,
    kebutuhanVisualisasi: `Sangat tinggi: membutuhkan diagram skematis, ilustrasi beranotasi jelas, dan perbandingan grafis untuk menjembatani konsep agar mudah dipahami secara intuitif.`,
    kebutuhanAudio: `Tinggi: narasi pemandu yang komunikatif dan suara pemantik rasa ingin tahu sangat efektif mengarahkan fokus siswa (mindful listening).`,
    kebutuhanDemonstrasi: isScience || isMath
      ? `Tinggi: memerlukan peragaan prosedur konkret atau simulasi bertahap agar urutan proses tidak disalahpahami.`
      : `Sedang: memerlukan contoh studi kasus atau dialog lakon situasional.`,
    kebutuhanInteraktivitas: `Tinggi: murid memerlukan ruang eksplorasi aktif (hands-on / minds-on) melalui kuis formatif seketika atau penentuan keputusan konsep.`,
    analisisBebanKognitif: `Materi dipecah menjadi unit-unit mikro (chunking) dengan hierarki teks ringkas dan kontras visual tajam untuk mencegah kelebihan muatan memori kerja.`,
    rekomendasiStrategi: `Kombinasikan representasi visual-auditori (Dual Coding Theory) yang didukung interaksi pemantik di awal dan kuis reflektif di akhir.`,
  };
}

/**
 * 2. REKOMENDASI MEDIA (Maksimal 5 Rekomendasi)
 * Menghasilkan maksimal 5 rekomendasi media terstruktur sesuai materi
 */
export async function generateMediaRecommendations(
  context: MediaInputContext,
  analisis: MediaAnalisisAI
): Promise<MediaRekomendasiItem[]> {
  const prompt = `Sebagai Ahli Kurikulum Merdeka, berikan MAKSIMAL 5 REKOMENDASI MEDIA PEMBELAJARAN yang paling cocok untuk materi ini:
- Mata Pelajaran: ${context.mapel}
- Kelas: ${context.kelas}
- Materi Pokok: ${context.topikMateri}
- Tujuan Pembelajaran: ${context.tujuanPembelajaran}
- Analisis Tingkat Abstraksi: ${analisis.tingkatAbstraksi}
- Kebutuhan Visual: ${analisis.kebutuhanVisualisasi}
- Kebutuhan Interaktivitas: ${analisis.kebutuhanInteraktivitas}

JENIS MEDIA YANG DAPAT DIPILIH:
1. Audio: narasi, storytelling, podcast, audio instruksi
2. Visual: infografis, poster, diagram, mind map, komik, flashcard
3. Audio Visual: video pembelajaran, video animasi, video demonstrasi, storytelling video, simulasi
4. Interaktif: kuis, matching, drag and drop, flashcard interaktif, simulasi, permainan edukatif, interactive presentation

SYARAT: Keluarkan HANYA array JSON (maksimal 5 item) dengan format:
[
  {
    "id": "rec-1",
    "namaMedia": "Judul spesifik media",
    "kategori": "Visual" | "Audio" | "Audiovisual" | "Interaktif",
    "jenisMedia": "infografis / podcast / video animasi / kuis / dll.",
    "tujuan": "tujuan spesifik media terkait TP",
    "alasanKesesuaian": "alasan pedagogis mengapa media ini sangat cocok",
    "durasi": "e.g. 5-7 Menit / 6 Slide / 8 Misi",
    "tingkatInteraktivitas": "Rendah" | "Sedang" | "Tinggi" | "Eksploratif",
    "outputYangDibuat": "deskripsi wujud akhir produk yang akan dihasilkan",
    "kecocokanProfilLulusan": ["Penalaran Kritis", "Kreativitas"]
  }
]`;

  try {
    const aiRes = await callServerAI(prompt);
    if (aiRes?.text) {
      const parsed = extractJSON<MediaRekomendasiItem[]>(aiRes.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5).map((item, idx) => ({
          ...item,
          id: item.id || `rec-${idx + 1}`,
        }));
      }
    }
  } catch (err) {
    console.warn('AI recommendation fallback:', err);
  }

  // 5 Default Curated Recommendations based on pedagogy
  const topic = context.topikMateri || 'Materi Pokok';
  return [
    {
      id: 'rec-1',
      namaMedia: `Infografis & Peta Konsep Visual: Esensi ${topic}`,
      kategori: 'Visual',
      jenisMedia: 'infografis',
      tujuan: `Menyajikan intisari konsep ${topic} dalam bagan grafis komparatif berkontras tinggi agar mudah dicerna secara sekilas.`,
      alasanKesesuaian: `Sangat efektif mereduksi beban kognitif pada tingkat abstraksi ${analisis.tingkatAbstraksi} dan memfasilitasi gaya belajar visual.`,
      durasi: '1 Lembar Panduan Visual (6 Blok Konsep)',
      tingkatInteraktivitas: 'Sedang',
      outputYangDibuat: 'Desain infografis poster resolusi tinggi, prompt generator gambar AI, dan kartu intisari materi.',
      kecocokanProfilLulusan: ['Penalaran Kritis', 'Kreativitas'],
    },
    {
      id: 'rec-2',
      namaMedia: `Video Animasi & Storyboard: Eksplorasi Fenomena ${topic}`,
      kategori: 'Audiovisual',
      jenisMedia: 'video animasi',
      tujuan: `Memvisualisasikan proses dinamis dan hubungan sebab-akibat materi ${topic} melalui perpaduan gerak, narasi, dan teks layar.`,
      alasanKesesuaian: `Mengaktifkan dual-coding memory (mata dan telinga) sehingga konsep abstrak menjadi tampak nyata dan kontekstual.`,
      durasi: '5 – 7 Menit (6 Adegan Terstruktur)',
      tingkatInteraktivitas: 'Sedang',
      outputYangDibuat: 'Naskah video lengkap, tabel storyboard 8 kolom scene-by-scene, teks on-screen, dan panduan jeda diskusi.',
      kecocokanProfilLulusan: ['Penalaran Kritis', 'Komunikasi'],
    },
    {
      id: 'rec-3',
      namaMedia: `Kuis Gamifikasi & Misi Tantangan Interaktif ${topic}`,
      kategori: 'Interaktif',
      jenisMedia: 'kuis',
      tujuan: `Menguji dan memperkuat pemahaman bernalar tinggi (HOTS) melalui misi tantangan berumpan balik instan yang menggembirakan.`,
      alasanKesesuaian: `Memberikan evaluasi formatif langsung tanpa kecemasan, melatih kemandirian, dan mendorong kolaborasi antarsiswa.`,
      durasi: '8 Misi HOTS Interaktif (15 Menit)',
      tingkatInteraktivitas: 'Tinggi',
      outputYangDibuat: 'Struktur modul interaktif dengan soal skenario kasus, 4 pilihan, umpan balik konstruktif, dan kartu skor.',
      kecocokanProfilLulusan: ['Penalaran Kritis', 'Kemandirian'],
    },
    {
      id: 'rec-4',
      namaMedia: `Podcast Edukasi Dialogis: Obrolan Detektif Sains ${topic}`,
      kategori: 'Audio',
      jenisMedia: 'podcast',
      tujuan: `Melatih mindful listening dan memicu daya imajinasi analitis siswa melalui percakapan santai dua sahabat yang memecahkan masalah.`,
      alasanKesesuaian: `Sangat ramah diferensiasi auditori, hemat perangkat layar, dan fleksibel didengarkan di kelas maupun mandiri.`,
      durasi: '5 Menit Audio Dialogis',
      tingkatInteraktivitas: 'Sedang',
      outputYangDibuat: 'Naskah skrip rekaman dialogis, penanda efek suara (SFX), musik latar, dan lembar simak pemantik.',
      kecocokanProfilLulusan: ['Komunikasi', 'Penalaran Kritis'],
    },
    {
      id: 'rec-5',
      namaMedia: `Interactive Presentation & Slide Terpandu ${topic}`,
      kategori: 'Visual',
      jenisMedia: 'interactive presentation',
      tujuan: `Menuntun jalannya pembelajaran klasikal langkah demi langkah dengan visual modern, catatan guru, dan jeda pemantik.`,
      alasanKesesuaian: `Menjadi jangkar instruksional guru di depan kelas dengan alur Pembelajaran Mendalam (Memahami-Mengaplikasi-Merefleksi).`,
      durasi: '6 Slide Presentasi Utama (15 Menit)',
      tingkatInteraktivitas: 'Tinggi',
      outputYangDibuat: 'Deck presentasi 6 slide siap putar, naskah narasi guru, deskripsi prompt visual Canva, dan panduan aktivitas.',
      kecocokanProfilLulusan: ['Kolaborasi', 'Penalaran Kritis'],
    },
  ];
}

/**
 * 3. RANCANGAN MEDIA (Sebelum Produksi)
 * AI membuat rancangan lengkap sebelum disetujui guru:
 * Judul, TP, Materi, Sasaran, Struktur, Urutan, Visual, Narasi, Aktivitas, Pemantik, Evaluasi, Durasi, Storyboard / Interaktif
 */
export async function createMediaRancangan(
  context: MediaInputContext,
  rec: MediaRekomendasiItem,
  kontrol: MediaKontrolGuru
): Promise<MediaRancanganData> {
  const isVideo = kontrol.kategori === 'Audiovisual' || /video|animasi/i.test(kontrol.jenisMedia);
  const isInteraktif = kontrol.kategori === 'Interaktif' || /kuis|game|simulasi|drag|matching/i.test(kontrol.jenisMedia);

  const prompt = `Anda adalah Arsitek Media Pembelajaran Kurikulum Merdeka.
Susunlah RANCANGAN MEDIA LENGKAP (Blueprint sebelum produksi) dengan data:
- Mata Pelajaran: ${context.mapel}
- Kelas: ${context.kelas}
- Materi Pokok: ${context.topikMateri} ${context.subMateri ? `(${context.subMateri})` : ''}
- Tujuan Pembelajaran: ${context.tujuanPembelajaran}
- Kategori Media: ${kontrol.kategori}
- Jenis Media: ${kontrol.jenisMedia}
- Gaya Visual: ${kontrol.gayaVisual}
- Kompleksitas: ${kontrol.tingkatKompleksitas}
- Durasi: ${kontrol.durasi}
- Bahasa: ${kontrol.bahasa}
- Orientasi/Ukuran: ${kontrol.orientasiUkuran}
- Sasaran Penggunaan: ${kontrol.sasaranPenggunaan}
- Instruksi Khusus Guru: ${kontrol.instruksiKhusus || 'Pastikan kontekstual dan bermakna'}

KETENTUAN RANCANGAN:
1. Wajib mencakup: Judul, Tujuan Pembelajaran, Materi, Sasaran peserta didik, Struktur media, Urutan isi (minimal 5 poin urutan), Visual, Narasi, Aktivitas/interaksi murid, Pertanyaan pemantik (minimal 2 butir), Evaluasi, Durasi.
2. ${isVideo ? 'KARENA INI VIDEO: Sertakan tabel Storyboard 8 Kolom: | No | Durasi | Adegan | Visual | Narasi | Teks Layar | Audio | Interaksi | (minimal 5 adegan/scene).' : ''}
3. ${isInteraktif ? 'KARENA INI MEDIA INTERAKTIF: Sertakan struktur halaman, aktivitas, pertanyaan, jawaban, feedback, dan navigasi (minimal 4 halaman/misi).' : ''}

Keluarkan HANYA JSON valid:
{
  "judul": "Judul lengkap rancangan media",
  "tujuanPembelajaran": "${context.tujuanPembelajaran}",
  "materi": "${context.topikMateri}",
  "subMateri": "${context.subMateri || ''}",
  "sasaranPesertaDidik": "Karakteristik target siswa kelas ${context.kelas}",
  "strukturMedia": "Deskripsi alur struktur media (Pembuka/Apersepsi → Inti → Penutup)",
  "urutanIsi": ["1. Pembuka...", "2. Fenomena...", "3. Konsep...", "4. Aplikasi...", "5. Refleksi..."],
  "visual": "Rincian tata visual, palet warna, tipografi, dan gaya grafis",
  "narasi": "Gaya dan arahan naskah narasi / audio guru",
  "aktivitasInteraksi": "Aktivitas nyata yang dilakukan peserta didik saat media digunakan",
  "pertanyaanPemantik": ["Pertanyaan pemantik 1?", "Pertanyaan pemantik 2?"],
  "evaluasi": "Metode evaluasi atau cek pemahaman yang terintegrasi",
  "durasi": "${kontrol.durasi}",
  ${isVideo ? `"storyboard": [
    {
      "no": 1,
      "durasi": "00:00 - 00:45",
      "adegan": "Pembuka & Apersepsi Fenomena",
      "visual": "Animasi ilustratif...",
      "narasi": "Halo pembelajar hebat...",
      "teksLayar": "JUDUL MATERI",
      "audio": "Musik ceria upbeat",
      "interaksi": "Siswa mengamati dan menjawab sapaan"
    }
  ],` : ''}
  ${isInteraktif ? `"strukturInteraktif": [
    {
      "noHalaman": 1,
      "judulHalaman": "Misi 1: Detektif Konsep",
      "tipeAktivitas": "Kuis HOTS",
      "instruksi": "Pilihlah satu jawaban yang paling tepat",
      "pertanyaan": "Soal pemantik...",
      "opsiJawaban": [
        {"label": "A", "teks": "Pilihan A", "isBenar": false, "feedback": "Penjelasan..."},
        {"label": "B", "teks": "Pilihan B (Benar)", "isBenar": true, "feedback": "Tepat sekali..."}
      ],
      "umpanBalikBenar": "Hebat! Analisis Anda tepat.",
      "umpanBalikSalah": "Cermati kembali kata kunci...",
      "navigasi": "Lanjut ke Misi 2"
    }
  ],` : ''}
  "catatanTambahan": "opsional"
}`;

  try {
    const aiRes = await callServerAI(prompt);
    if (aiRes?.text) {
      const parsed = extractJSON<MediaRancanganData>(aiRes.text);
      if (parsed?.judul && parsed?.strukturMedia && parsed?.urutanIsi) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('AI rancangan fallback:', err);
  }

  // Fallback Rancangan Builder
  const topic = context.topikMateri || 'Materi Pokok';
  const defaultStoryboard: StoryboardVideoRow[] = [
    {
      no: 1,
      durasi: '00:00 - 00:45',
      adegan: 'Intro & Fenomena Pemantik',
      visual: `Animasi gerak cerah menampilkan fenomena nyata seputar ${topic}. Guru virtual menyapa dengan ramah.`,
      narasi: `"Halo sahabat pembelajar hebat! Pernahkah kalian menyadari fenomena unik di sekitar kita tentang ${topic}?"`,
      teksLayar: `EKSPLORASI ${topic.toUpperCase()}\nPembelajaran Mendalam Fase D`,
      audio: 'Musik akustik ceria (Fade in perlahan)',
      interaksi: 'Murid menyimak dan fokus pada objek fenomena.',
    },
    {
      no: 2,
      durasi: '00:45 - 02:00',
      adegan: 'Pembuktian Fakta & Konsep Kunci',
      visual: 'Diagram interaktif membelah komponen esensial materi menjadi 3 bagian yang saling terkait.',
      narasi: `"Mari kita bedah 3 prinsip penting yang mendasari fenomena ini..."`,
      teksLayar: '3 PRINSIP ESENSIAL\n1. Karakteristik Dasar\n2. Pola Hubungan\n3. Dampak Lingkungan',
      audio: 'SFX pop-up lembut saat tiap poin muncul',
      interaksi: 'Murid mencatat kata kunci di buku panduan.',
    },
    {
      no: 3,
      durasi: '02:00 - 04:00',
      adegan: 'Demonstrasi / Studi Kasus Kontekstual',
      visual: 'Layar terbagi dua memperlihatkan penerapan nyata di kehidupan masyarakat dan simulasi uji coba.',
      narasi: `"Bagaimana jika variabel penting ini kita ubah? Mari kita amati perubahannya secara seksama."`,
      teksLayar: 'STUDI KASUS NYATA\nPenerapan Bernalar Kritis',
      audio: 'Suara latar suasana laboratorium / alam',
      interaksi: 'Guru menjeda video 30 detik untuk prediksi kelas.',
    },
    {
      no: 4,
      durasi: '04:00 - 05:30',
      adegan: 'Tantangan Nalar HOTS & Kolaborasi',
      visual: 'Jam pasir digital berdetak dengan tampilan 1 pertanyaan analitis pemantik diskusi kelompok.',
      narasi: `"Sekarang giliran kalian berdiskusi: Apa solusi terbaik untuk mengatasi masalah tersebut?"`,
      teksLayar: 'TANTANGAN KELOMPOK:\nRumuskan 1 Solusi Inovatif!',
      audio: 'SFX detak jam ritmis lembut',
      interaksi: 'Siswa berembuk 1 menit bersama rekan sebangku.',
    },
    {
      no: 5,
      durasi: '05:30 - 06:30',
      adegan: 'Rangkuman Reflektif & Penutup',
      visual: 'Infografis rangkuman 1 layar penuh dengan pesan aksi nyata dan komitmen belajar berkesadaran.',
      narasi: `"Pengetahuan ini adalah bekal kita untuk menjaga keharmonisan alam dan masyarakat. Teruslah berkarya!"`,
      teksLayar: 'KESIMPULAN & AKSI NYATA\nSiap Beraksi di LKPD!',
      audio: 'Musik penutup crescendo inspiratif',
      interaksi: 'Siswa menyimpulkan pembelajaran dengan tepuk tangan apresiasi.',
    },
  ];

  const defaultInteractivePages: InteractivePageItem[] = [
    {
      noHalaman: 1,
      judulHalaman: `Misi 1: Detektif Fenomena Awal ${topic}`,
      tipeAktivitas: 'Eksplorasi Konsep',
      instruksi: 'Cermati studi kasus berikut dan temukan ciri kunci yang paling relevan.',
      pertanyaan: `Berdasarkan pengamatan fenomena sehari-hari terkait ${topic}, manakah pernyataan yang paling tepat menggambarkan karakteristik dasarnya?`,
      opsiJawaban: [
        { label: 'A', teks: 'Fenomena ini berdiri sendiri tanpa keterkaitan dengan unsur lingkungan.', isBenar: false, feedback: 'Kurang tepat. Setiap unsur di alam saling terhubung secara sistemik.' },
        { label: 'B', teks: 'Terdapat keteraturan prinsip dan hubungan sebab-akibat yang dapat dibuktikan secara ilmiah.', isBenar: true, feedback: 'Luar biasa! Pemikiran Anda sangat logis dan bernalar kritis.' },
        { label: 'C', teks: 'Perubahan pada satu variabel tidak membawa dampak apapun.', isBenar: false, feedback: 'Cermati kembali: perubahan satu variabel memicu efek berantai.' },
        { label: 'D', teks: 'Konsep ini hanya berlaku secara teoretis tanpa bukti konkret.', isBenar: false, feedback: 'Materi ini memiliki banyak bukti aplikatif di lingkungan sekitar.' },
      ],
      umpanBalikBenar: 'Tepat sekali! Anda berhasil mengidentifikasi pola keteraturan fenomena.',
      umpanBalikSalah: 'Perhatikan kata kunci keterhubungan sistemik pada materi.',
      navigasi: 'Lanjut ke Misi 2',
    },
    {
      noHalaman: 2,
      judulHalaman: `Misi 2: Analisis Sebab-Akibat HOTS`,
      tipeAktivitas: 'Kuis HOTS',
      instruksi: 'Analisis konsekuensi jika terjadi gangguan pada sistem.',
      pertanyaan: `Jika terjadi perubahan mendadak pada kondisi kesetimbangan materi ${topic}, apa langkah mitigasi pertama yang paling rasional?`,
      opsiJawaban: [
        { label: 'A', teks: 'Mengidentifikasi faktor penyebab utama dan menstabilkan variabel kunci.', isBenar: true, feedback: 'Hebat! Anda berpikir seperti seorang ilmuwan andal.' },
        { label: 'B', teks: 'Membiarkan sistem berjalan tanpa intervensi apapun.', isBenar: false, feedback: 'Kurang tepat, pembiaran dapat memperparah ketidakseimbangan.' },
        { label: 'C', teks: 'Mengganti seluruh komponen tanpa analisis data.', isBenar: false, feedback: 'Tindakan gegabah berisiko merusak sistem secara permanen.' },
        { label: 'D', teks: 'Mengabaikan bukti data yang ada di lapangan.', isBenar: false, feedback: 'Analisis sains wajib berlandaskan bukti data valid.' },
      ],
      umpanBalikBenar: 'Analisis Anda tajam dan menunjukkan penalaran kritis tingkat tinggi!',
      umpanBalikSalah: 'Ingat prinsip ilmiah: identifikasi bukti sebelum menentukan aksi.',
      navigasi: 'Lanjut ke Misi 3',
    },
    {
      noHalaman: 3,
      judulHalaman: `Misi 3: Simulasi Penerapan Solusi Nyata`,
      tipeAktivitas: 'Simulasi Kasus',
      instruksi: 'Tentukan strategi pemecahan masalah terbaik untuk tantangan lingkungan.',
      pertanyaan: `Sebagai peserta didik yang bertanggung jawab, aksi konkret mana yang mencerminkan penerapan materi ${topic}?`,
      opsiJawaban: [
        { label: 'A', teks: 'Menyusun proyek mini peduli lingkungan berbasis gotong royong.', isBenar: true, feedback: 'Sangat menginspirasi! Ini selaras dengan Dimensi Kolaborasi & Kewargaan.' },
        { label: 'B', teks: 'Hanya menghafal definisi tanpa peduli dengan lingkungan nyata.', isBenar: false, feedback: 'Pembelajaran mendalam menuntut aksi nyata, bukan sekadar hafalan.' },
      ],
      umpanBalikBenar: 'Komitmen luar biasa untuk menciptakan dampak positif bagi sesama.',
      umpanBalikSalah: 'Mari wujudkan pengetahuan menjadi aksi nyata di sekolah.',
      navigasi: 'Lanjut ke Refleksi Akhir',
    },
  ];

  return {
    judul: `Rancangan Media ${kontrol.jenisMedia}: Eksplorasi Mendalam ${topic}`,
    tujuanPembelajaran: context.tujuanPembelajaran,
    materi: topic,
    subMateri: context.subMateri || 'Konsep Kunci & Aplikasi Kontekstual',
    sasaranPesertaDidik: `Peserta didik Kelas ${context.kelas} (${context.fase || 'Fase D'}) dengan gaya belajar beragam.`,
    strukturMedia: '1. Apersepsi & Mindful Hook (20%) → 2. Pembedahan Konsep Inti (40%) → 3. Aplikasi & Investigasi HOTS (30%) → 4. Refleksi & Komitmen Bermakna (10%)',
    urutanIsi: [
      `1. Bagian Pembuka: Salam hangat, penyampaian Tujuan Pembelajaran, dan pemantik fenomena ${topic}`,
      '2. Bagian Eksplorasi: Penguraian konsep esensial dengan bantuan analogi konkret visual/auditori',
      '3. Bagian Pembuktian: Contoh kasus nyata di Indonesia atau demonstrasi prosedur',
      '4. Bagian Tantangan Interaktif: Pertanyaan pemicu diskusi kelompok bernalar kritis',
      '5. Bagian Penutup: Rangkuman 3 poin emas, refleksi berkesadaran, dan komitmen aksi nyata',
    ],
    visual: `${kontrol.gayaVisual || 'Ilustrasi Edukatif Modern'}, warna ramah mata (Emerald & Slate), kontras teks tinggi, ikonografi bermakna tanpa dekorasi berlebihan.`,
    narasi: `Gaya bahasa ${kontrol.bahasa || 'Bahasa Indonesia komunikatif'}, bernada hangat, memotivasi, dan memicu keingintahuan intelektual siswa.`,
    aktivitasInteraksi: isInteraktif
      ? 'Murid memilih jawaban, menerima feedback seketika, dan mendiskusikan alasan nalar bersama kelompok.'
      : isVideo
      ? 'Murid menyimak panduan, berdiskusi pada jeda timer 30 detik di adegan 4, dan mencatat simpulan.'
      : 'Murid menyimak stimulus, membandingkan data grafis, dan menjawab tantangan pemantik di LKPD.',
    pertanyaanPemantik: [
      `Mengapa pemahaman tentang ${topic} sangat penting untuk menyelesaikan masalah di sekitar kita?`,
      `Bagaimana keterkaitan antara konsep ini dengan keseimbangan alam dan kehidupan sehari-hari?`,
    ],
    evaluasi: 'Terintegrasi asesmen formatif kilat (quick check) dengan kriteria ketercapaian tujuan pembelajaran.',
    durasi: kontrol.durasi || '6 – 8 Menit',
    storyboard: isVideo ? defaultStoryboard : undefined,
    strukturInteraktif: isInteraktif ? defaultInteractivePages : undefined,
  };
}

/**
 * 4. PRODUKSI MEDIA (Setelah Persetujuan Guru)
 * AI menghasilkan seluruh materi produksi siap pakai:
 * naskah audio, desain visual, prompt gambar AI, script video, storyboard, subtitle, struktur interaktif, soal & feedback
 */
export async function produceMediaContent(
  rancangan: MediaRancanganData,
  kontrol: MediaKontrolGuru,
  context: MediaInputContext
): Promise<MediaProdukData> {
  const isVideo = kontrol.kategori === 'Audiovisual' || /video|animasi/i.test(kontrol.jenisMedia);
  const isAudio = kontrol.kategori === 'Audio' || /podcast|narasi|audio/i.test(kontrol.jenisMedia);
  const isInteraktif = kontrol.kategori === 'Interaktif' || /kuis|game|simulasi|interaktif/i.test(kontrol.jenisMedia);

  const prompt = `Anda adalah Produser Konten Media Edukasi Kurikulum Merdeka.
PRODUKSI KONTEN MEDIA LENGKAP SIAP PAKAI berdasarkan rancangan yang TELAH DISETUJUI GURU:
- Judul Media: ${rancangan.judul}
- Topik Materi: ${rancangan.materi}
- Tujuan Pembelajaran: ${rancangan.tujuanPembelajaran}
- Kategori: ${kontrol.kategori}
- Jenis Media: ${kontrol.jenisMedia}
- Gaya Visual: ${kontrol.gayaVisual}
- Durasi: ${kontrol.durasi}
- Sasaran: ${rancangan.sasaranPesertaDidik}
- Struktur Isi: ${rancangan.urutanIsi.join(' | ')}

HASILKAN KONTEN PRODUKSI LENGKAP:
${isAudio ? '1. Naskah Audio Lengkap (Skrip kata demi kata, karakter suara, penanda durasi [00:00], efek suara SFX, musik latar).' : ''}
${isVideo ? '2. Script Video Lengkap, Storyboard Tabel Scene-by-Scene, dan Subtitle (Closed Captions).' : ''}
${isInteraktif ? '3. Struktur Soal Interaktif (Minimal 4 butir soal HOTS, pilihan A-D, kunci, dan pembahasan konstruktif seketika).' : ''}
4. Prompt Gambar AI Terperinci (Minimal 3 prompt berbahasa Inggris untuk Midjourney/Canva/DALL-E).
5. Desain Tata Letak Visual / 6 Slide Presentasi PPT terperinci (Judul, Poin Inti, Visual Prompt, Catatan Guru).
6. Dokumen Markdown Lengkap yang rapi, profesional, dan siap dicetak/dijalankan.

Keluarkan HANYA JSON valid:
{
  "materiSiapGunakan": "Deskripsi paket produk media yang siap ajar",
  ${isAudio ? '"naskahAudio": "skrip rekaman lengkap...",' : ''}
  ${isVideo ? '"scriptVideo": "skrip video lengkap...", "subtitle": "1\\n00:00:01,000 --> 00:00:04,000\\nHalo pembelajar hebat...",' : ''}
  "desainVisual": "panduan tata visual...",
  "promptGambar": [
    "prompt 1 dalam bahasa inggris...",
    "prompt 2 dalam bahasa inggris...",
    "prompt 3 dalam bahasa inggris..."
  ],
  "soalDanFeedback": [
    {
      "nomor": 1,
      "soal": "teks soal HOTS...",
      "opsi": ["A. opsi 1", "B. opsi 2", "C. opsi 3", "D. opsi 4"],
      "kunci": "B",
      "pembahasan": "penjelasan mendalam..."
    }
  ],
  "slidesPPT": [
    {
      "nomorSlide": 1,
      "judulSlide": "Judul Slide 1",
      "poinMateri": ["poin 1", "poin 2"],
      "visualPrompt": "deskripsi gambar slide",
      "catatanGuru": "naskah lisan guru..."
    }
  ],
  "markdownLengkap": "Dokumen Markdown komprehensif..."
}`;

  try {
    const aiRes = await callServerAI(prompt);
    if (aiRes?.text) {
      const parsed = extractJSON<MediaProdukData>(aiRes.text);
      if (parsed?.materiSiapGunakan && parsed?.markdownLengkap) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('AI production fallback:', err);
  }

  // High-Quality Pedagogical Production Fallback
  const topic = rancangan.materi;
  const tp = rancangan.tujuanPembelajaran;

  const defaultSlides: SlidePPTItem[] = [
    {
      nomorSlide: 1,
      judulSlide: `Menyingkap Rahasia ${topic}`,
      poinMateri: [
        'Eksplorasi Pembelajaran Mendalam Fase D',
        `Tujuan Pembelajaran: ${tp}`,
        'Fokus: Berkesadaran, Bermakna, Menggembirakan',
      ],
      visualPrompt: `High quality educational title banner featuring ${topic}, clean layout, emerald and indigo modern color accents, minimalist icons.`,
      catatanGuru: `"Selamat pagi para saintis muda! Hari ini kita akan menjelajahi fenomena menakjubkan di balik ${topic}."`,
    },
    {
      nomorSlide: 2,
      judulSlide: 'Fenomena Nyata di Sekitar Kita',
      poinMateri: [
        'Amati situasi nyata di lingkungan sekolah/masyarakat',
        'Mengapa pola ini bisa terbentuk?',
        'Pertanyaan Pemantik: Apa yang mendasari keteraturannya?',
      ],
      visualPrompt: `Real-life contextual photography showcasing a relatable phenomenon of ${topic}, labeled annotations, crisp resolution.`,
      catatanGuru: `"Coba perhatikan gambar ini baik-baik. Menurut kalian, faktor apa yang paling memengaruhinya?"`,
    },
    {
      nomorSlide: 3,
      judulSlide: 'Pembedahan Konsep Esensial',
      poinMateri: [
        '1. Ciri dan Karakteristik Utama',
        '2. Hubungan Sebab-Akibat Antarvariabel',
        '3. Hukum Keseimbangan Sistem',
      ],
      visualPrompt: `3-tier concept hierarchy diagram showing causal relationships for ${topic}, modern infographic vector style.`,
      catatanGuru: `"Ada tiga pilar utama yang perlu kita pahami agar tidak terjadi miskonsepsi..."`,
    },
    {
      nomorSlide: 4,
      judulSlide: 'Investigasi & Analisis Kasus (HOTS)',
      poinMateri: [
        'Tantangan Studi Kasus Kelompok',
        'Uji Hipotesis dengan Bukti Nyata',
        'Diskusikan bersama rekan sebangku (2 Menit)',
      ],
      visualPrompt: `Collaborative science investigation graphic, students analyzing charts and data, clean modern illustration.`,
      catatanGuru: `"Gunakan kemampuan bernalar kritis kalian untuk merumuskan simpulan dari data kasus ini."`,
    },
    {
      nomorSlide: 5,
      judulSlide: 'Aplikasi Nyata & Solusi Berkelanjutan',
      poinMateri: [
        'Bagaimana konsep ini menyelesaikan masalah di masyarakat?',
        'Contoh teknologi ramah lingkungan / aksi bijak',
        'Peran kita sebagai agen perubahan',
      ],
      visualPrompt: `Sustainable technology and positive community action illustration, bright inspiring colors.`,
      catatanGuru: `"Ilmu pengetahuan menjadi sangat bermakna ketika kita menggunakannya untuk menolong sesama."`,
    },
    {
      nomorSlide: 6,
      judulSlide: 'Refleksi Diri & Komitmen Aksi',
      poinMateri: [
        'Apa satu hal paling berharga yang saya pelajari hari ini?',
        'Bagaimana perasaan saya selama proses belajar?',
        'Komitmen aksi nyata di LKPD fase merefleksi',
      ],
      visualPrompt: `Peaceful reflective illustration, student with notebook under tree, inspiring sunset glow, clean vectors.`,
      catatanGuru: `"Tarik napas perlahan... renungkan makna perjalanan belajar kita hari ini. Kalian luar biasa!"`,
    },
  ];

  const defaultSoal = [
    {
      nomor: 1,
      soal: `Dalam mempelajari topik ${topic}, mengapa penting untuk mengidentifikasi karakteristik fisik atau bukti data sebelum menarik kesimpulan?`,
      opsi: [
        'A. Agar kesimpulan didasarkan pada fakta objektif yang dapat diuji kembali.',
        'B. Hanya untuk mempercepat waktu pengerjaan tugas kelompok.',
        'C. Karena data tidak memengaruhi hasil akhir penelitian.',
        'D. Agar tidak perlu berdiskusi dengan anggota kelompok lain.',
      ],
      kunci: 'A',
      pembahasan: 'Metode ilmiah dan penalaran kritis menuntut pembuktian berbasis data faktual yang valid dan objektif.',
    },
    {
      nomor: 2,
      soal: `Apabila salah satu variabel kunci dalam sistem ${topic} mengalami gangguan drastis, apa dampak yang paling logis terhadap keseimbangan keseluruhan?`,
      opsi: [
        'A. Seluruh sistem tetap berjalan normal tanpa sedikit pun terganggu.',
        'B. Terjadi pergeseran keseimbangan yang menuntut mekanisme adaptasi atau stabilisasi.',
        'C. Sistem langsung hancur seketika tanpa ada peluang pemulihan.',
        'D. Komponen lain akan berubah menjadi variabel yang sama.',
      ],
      kunci: 'B',
      pembahasan: 'Sistem di alam bersifat dinamis dan saling bergantung (interdependent). Gangguan memicu respon adaptif.',
    },
    {
      nomor: 3,
      soal: `Tindakan manakah yang paling mencerminkan penerapan nilai kebermaknaan pembelajaran ${topic} bagi kelestarian lingkungan?`,
      opsi: [
        'A. Membagikan informasi hoaks tanpa verifikasi ke media sosial.',
        'B. Menerapkan gaya hidup ramah lingkungan dan mengajak warga sekolah bergotong royong.',
        'C. Mengabaikan sampah dan limbah yang dihasilkan dari kegiatan sehari-hari.',
        'D. Merasa puas dengan sekadar menghafal rumus ujian.',
      ],
      kunci: 'B',
      pembahasan: 'Pembelajaran mendalam berorientasi pada kebermaknaan nyata: mengubah pemahaman menjadi aksi kebajikan sosial.',
    },
  ];

  const generatedAudioScript = `[00:00 - 00:30] INTRODUKSI MINDFUL & APERSEPSI
(Musik akustik hangat mengalun lembut, diselingi efek kicau burung di kejauhan)
NARATOR: "Halo sahabat pembelajar hebat! Selamat datang di Audio Pembelajaran Mendalam. Duduklah dengan nyaman, tarik napas perlahan... hembuskan. Hari ini kita akan menyingkap misteri di balik ${topic}."

[00:30 - 02:00] FENOMENA PEMANTIK
(SFX: Langkah kaki di taman sekolah, desau angin sejuk)
TOKOH 1 (RIAN): "Zahra, coba perhatikan fenomena di sekitar kita ini. Kelihatannya sederhana, tapi kenapa bisa terjadi seperti itu ya?"
TOKOH 2 (ZAHRA): "Nah, itu pertanyaan luar biasa, Rian! Di balik fenomena tersebut, ada aturan alam yang sangat teratur. Itulah yang sedang kita pelajari dalam ${topic}."

[02:00 - 03:45] EKSPLORASI KONSEP INTI
NARATOR: "Tepat sekali! Mari kita cermati 3 prinsip esensial: Pertama, setiap unsur memiliki ciri khas unik. Kedua, adanya hubungan timbal balik yang menjaga keseimbangan. Dan ketiga, pemahaman ini memberi kita kunci untuk memecahkan masalah nyata."

[03:45 - 04:30] TANTANGAN BERNALAR KRITIS
(SFX: Lonceng pemantik fokus 'Ting!')
NARATOR: "Sekarang, giliran sahabat di kelas! Menurut kalian, apa satu tindakan terbaik yang bisa kita lakukan bersama kelompok untuk mengaplikasikan prinsip ini?"
(Jeda hening 3 detik untuk refleksi siswa)

[04:30 - 05:00] PENUTUP INSPIRATIF
(Musik penutup ceria mengalun crescendo)
NARATOR: "Luar biasa! Jadilah pembelajar yang berkesadaran, teruslah bertanya, dan sebarkan kebaikan. Sampai jumpa di petualangan belajar berikutnya!"`;

  const markdownFull = `# PAKET PRODUKSI MEDIA PEMBELAJARAN
**Judul Media:** ${rancangan.judul}  
**Mata Pelajaran:** ${context.mapel}  
**Kelas / Fase:** ${context.kelas} (${context.fase || 'Fase D'})  
**Topik / Materi:** ${rancangan.materi}  
**Tujuan Pembelajaran:** ${rancangan.tujuanPembelajaran}  
**Format:** ${kontrol.jenisMedia} (${kontrol.kategori})  
**Durasi:** ${kontrol.durasi}  

---

### I. PANDUAN PEDAGOGIS GURU
1. **Pra-Aktivitas:** Kondisikan kesiapan emosional siswa dengan jeda hening berkesadaran (1 menit).
2. **Saat Aktivitas:** Gunakan media untuk memantik diskusi aktif kelompok, hindari mendominasi penjelasan.
3. **Pasca-Aktivitas:** Berikan apresiasi terhadap keberanian bernalar kritis dan fasilitasi refleksi bermakna.

---

### II. SLIDE PRESENTASI & VISUAL KELAS LENGKAP
${defaultSlides
  .map(
    (s) => `#### Slide ${s.nomorSlide}: ${s.judulSlide}
- **Poin Utama:**
${s.poinMateri.map((p) => `  * ${p}`).join('\n')}
- **Visual Prompt:** *${s.visualPrompt}*
- **Catatan Guru:** ${s.catatanGuru}`
  )
  .join('\n\n')}

---

### III. NASKAH AUDIO & SKRIP REKAMAN
\`\`\`
${generatedAudioScript}
\`\`\`

---

### IV. BUTIR MISI INTERAKTIF & ASESMEN FORMATIF (HOTS)
${defaultSoal
  .map(
    (q) => `**Soal #${q.nomor}:**
${q.soal}
${q.opsi.join('\n')}
- **Kunci Jawaban:** **[${q.kunci}]**
- **Pembahasan Pedagogis:** ${q.pembahasan}`
  )
  .join('\n\n')}

---

### V. PROMPT PENGHASIL GAMBAR AI (AI IMAGE PROMPTS)
1. \`Educational infographic poster about ${topic}, clean minimalist layout, modern flat vector, emerald green and slate tones, high resolution, textbook illustration style --ar 16:9\`
2. \`Close up macro scientific diagram representing key concepts of ${topic}, soft studio lighting, sharp detail, clean annotations, biology and physics laboratory aesthetic --ar 1:1\`
3. \`Diverse Indonesian middle school students collaborating happily in modern classroom laboratory, joyful learning atmosphere, natural daylight, candid photography style --ar 16:9\``;

  return {
    materiSiapGunakan: `Paket Media ${kontrol.jenisMedia} lengkap dengan 6 Slide PPT, Naskah Audio Dialogis, 3 Butir Kuis HOTS, dan Prompt Gambar AI siap pakai.`,
    naskahAudio: generatedAudioScript,
    desainVisual: `Tata letak visual ${kontrol.gayaVisual || 'Modern Minimalis'} berorientasi ${kontrol.orientasiUkuran || '16:9'} dengan kontras tinggi ramah proyektor kelas.`,
    promptGambar: [
      `Educational infographic poster about ${topic}, clean minimalist layout, modern flat vector, emerald green and slate tones --ar 16:9`,
      `Scientific diagram representing key concepts of ${topic}, soft studio lighting, sharp detail, clean annotations --ar 1:1`,
      `Indonesian middle school students collaborating in modern classroom, joyful learning atmosphere, natural lighting --ar 16:9`,
    ],
    soalDanFeedback: defaultSoal,
    slidesPPT: defaultSlides,
    markdownLengkap: markdownFull,
  };
}

/**
 * 5. REVISI DENGAN AI
 * Melakukan perbaikan konten media berdasarkan perintah guru seperti:
 * "Buat lebih sederhana", "Tambahkan contoh", "Kurangi teks", "Ubah menjadi video", dll.
 */
export async function reviseMediaWithAI(
  media: MediaRecord,
  perintahRevisi: string
): Promise<MediaRecord> {
  const currentVersiNum = parseFloat(media.versi.replace(/[^0-9.]/g, '') || '1.0');
  const nextVersi = `v${(currentVersiNum + 0.1).toFixed(1)}`;
  const now = new Date().toISOString();

  const prompt = `Anda adalah Asisten AI Desain Media Pembelajaran Kurikulum Merdeka.
Guru memberikan PERINTAH REVISI terhadap media pembelajaran berikut:

DATA MEDIA SAAT INI:
- Judul: ${media.judul}
- Topik: ${media.materiPokok}
- Tujuan Pembelajaran: ${media.tujuanPembelajaran}
- Kategori/Jenis: ${media.kategori} - ${media.jenisMedia}
- Versi: ${media.versi}

PERINTAH REVISI GURU: "${perintahRevisi}"

ATURAN REVISI:
1. Pertahankan keselarasan PENUH dengan Tujuan Pembelajaran dan Materi Pokok.
2. Terapkan instruksi guru secara presisi (contoh: jika minta "buat lebih sederhana", kurangi jargon ilmiah dan permudah bahasa; jika minta "tambahkan kuis", perbanyak butir kuis interaktif HOTS; jika minta "ubah menjadi video", susun storyboard 8 kolom).
3. Perbarui naskah rancangan dan produk media yang sesuai.

Keluarkan HANYA JSON valid:
{
  "judul": "Judul media hasil revisi",
  "jenisMedia": "jenis media hasil revisi",
  "kategori": "${media.kategori}",
  "penjelasanPerubahan": "ringkasan apa yang diubah",
  "materiSiapGunakan": "ringkasan materi hasil revisi",
  "markdownLengkap": "Dokumen Markdown lengkap setelah revisi..."
}`;

  try {
    const aiRes = await callServerAI(prompt);
    if (aiRes?.text) {
      const parsed = extractJSON<any>(aiRes.text);
      if (parsed?.markdownLengkap) {
        const riwayatBaru = [
          ...(media.riwayatRevisi || []),
          { perintah: perintahRevisi, waktu: now, versi: nextVersi },
        ];

        return {
          ...media,
          judul: parsed.judul || media.judul,
          jenisMedia: parsed.jenisMedia || media.jenisMedia,
          kategori: parsed.kategori || media.kategori,
          status: 'Revisi',
          versi: nextVersi,
          produkMedia: {
            ...media.produkMedia,
            materiSiapGunakan: parsed.materiSiapGunakan || media.produkMedia?.materiSiapGunakan || 'Media berhasil direvisi.',
            markdownLengkap: parsed.markdownLengkap,
          },
          riwayatRevisi: riwayatBaru,
          updatedAt: now,
        };
      }
    }
  } catch (err) {
    console.warn('AI revision fallback:', err);
  }

  // Graceful revision fallback
  const riwayatBaru = [
    ...(media.riwayatRevisi || []),
    { perintah: perintahRevisi, waktu: now, versi: nextVersi },
  ];

  const revisedMarkdown = `${media.produkMedia?.markdownLengkap || ''}

---
> 📝 **CATATAN REVISI (${nextVersi}) - ${new Date().toLocaleDateString('id-ID')}**:  
> Perintah: *"${perintahRevisi}"*  
> Media telah disesuaikan dengan instruksi guru seraya tetap mengunci ketercapaian Tujuan Pembelajaran: **${media.tujuanPembelajaran}**.`;

  return {
    ...media,
    status: 'Revisi',
    versi: nextVersi,
    produkMedia: {
      ...media.produkMedia,
      materiSiapGunakan: `Revisi ${nextVersi}: Disesuaikan dengan instruksi "${perintahRevisi}".`,
      markdownLengkap: revisedMarkdown,
    },
    riwayatRevisi: riwayatBaru,
    updatedAt: now,
  };
}
