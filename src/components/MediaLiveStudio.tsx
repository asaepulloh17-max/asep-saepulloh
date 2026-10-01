import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  Share2,
  Tv,
  Music,
  Headphones,
  Gamepad2,
  Video,
  Image as ImageIcon,
  Palette,
  BookOpen,
  HelpCircle,
  Eye,
  Check,
  Award,
  Target,
} from 'lucide-react';
import { MediaPembelajaranItem, KategoriMediaPembelajaran } from '../types';

interface MediaLiveStudioProps {
  media: MediaPembelajaranItem;
  mapel: string;
  kelas: string;
  topik: string;
  tujuanPembelajaran?: string;
  indikatorKetercapaian?: string;
  pengalamanBelajar?: { memahami?: string; mengaplikasi?: string; merefleksi?: string };
  prinsipMendalam?: { berkesadaran?: string; bermakna?: string; menggembirakan?: string };
  onBackToScript: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

// Sound effects generator using Web Audio API
function playBeep(type: 'correct' | 'wrong' | 'complete' | 'click') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'correct') {
      // 3 ascending notes: C5 (523), E5 (659), G5 (784)
      [523, 659, 784].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.16);
      });
    } else if (type === 'wrong') {
      // Low dual-tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'complete') {
      // Victory arpeggio: C5, E5, G5, C6
      [523, 659, 784, 1046].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    }
  } catch {
    // AudioContext not permitted or supported
  }
}

// Structured data extractors from markdown
function parseSlidesFromMarkdown(md: string, topic: string, tp?: string, kktp?: string) {
  const slides = [];
  const slideRegex = /####\s+Slide\s+(\d+)[:\s]+([^\n]+)([\s\S]*?)(?=(?:####\s+Slide|\n###\s+|$))/gi;
  let match;

  while ((match = slideRegex.exec(md)) !== null) {
    const num = parseInt(match[1], 10);
    const title = match[2].trim();
    const content = match[3];

    // Extract bullet points
    const points: string[] = [];
    const pointMatches = content.match(/[-*]\s+([^\n]+)/g);
    if (pointMatches) {
      pointMatches.forEach((p) => points.push(p.replace(/^[-*]\s+/, '').trim()));
    }

    // Extract visual prompt
    const visualMatch = content.match(/Visual\s*(?:Prompt|Desain)?:\s*([^\n]+)/i);
    const visualPrompt = visualMatch ? visualMatch[1].trim() : `Ilustrasi konsep kontekstual ${topic} berorientasi pemahaman mendalam.`;

    // Extract teacher notes
    const noteMatch = content.match(/Catatan\s*Guru:\s*([^\n]+(?:\n[^\n#]+)*)/i);
    const teacherNotes = noteMatch ? noteMatch[1].trim() : `Fasilitasi siswa untuk mengamati fenomena ${topic} dan mengemukakan pemikiran awal secara berkesadaran.`;

    slides.push({
      num,
      title,
      points: points.length > 0 ? points : [
        `Memahami konsep esensial materi ${topic}`,
        `Menghubungkan fenomena nyata dengan pencapaian TP`,
        `Mendiskusikan pembuktian bukti bersama rekan tim`,
      ],
      visualPrompt,
      teacherNotes,
    });
  }

  if (slides.length === 0) {
    // Curated rich fallback slides strictly tailored to topic and TP
    return [
      {
        num: 1,
        title: `Eksplorasi Konseptual: ${topic}`,
        points: [
          `🎯 Sasaran Belajar (TP): ${tp || 'Memahami konsep kunci dan menerapkannya dalam penyelidikan nyata'}`,
          `💡 Konsep Esensial: Meneliti karakteristik, struktur, dan keteraturan ${topic}`,
          `🤝 Pengalaman Belajar: Penyelidikan kolaboratif berkesadaran dan reflektif`,
        ],
        visualPrompt: `Desain minimalis berfokus pada visual fenomena autentik ${topic} di kehidupan nyata siswa dengan tipografi yang kuat.`,
        teacherNotes: `Selamat pagi anak-anak hebat! Hari ini kita akan menjelajahi ${topic}. Sasaran capaian kita adalah: "${tp || 'memahami konsep secara mendalam dan kontekstual'}". Mari awali dengan hening sejenak, perhatikan gambar di layar, dan temukan apa yang menarik perhatian kalian.`,
      },
      {
        num: 2,
        title: `Pertanyaan Pemandu & Target KKTP: ${topic}`,
        points: [
          `📊 Indikator Target (KKTP): ${kktp || 'Menganalisis fenomena dan merumuskan argumen bukti nyata'}`,
          `❓ Pertanyaan Pemandu: Mengapa fenomena ${topic} ini terjadi dan apa dampaknya bagi kita?`,
          `🔍 Kaitan Autentik: Menghubungkan pengamatan di lingkungan sekitar dengan konsep materi`,
        ],
        visualPrompt: `Foto perbandingan dua kondisi riil terkait ${topic} yang saling bertolak belakang untuk merangsang nalar kritis murid.`,
        teacherNotes: `Amati perbedaan pada kasus nyata ini. Hubungkan dengan apa yang kita ketahui tentang ${topic}. Mengapa hal ini bisa terjadi di sekitar kita?`,
      },
      {
        num: 3,
        title: `Pilar Konsep & Struktur Inti ${topic}`,
        points: [
          `Karakteristik kunci dan prinsip dasar pembentuk ${topic}`,
          `Hubungan sebab-akibat antar komponen yang saling memengaruhi`,
          `Mengidentifikasi pola keteraturan saintifik secara objektif`,
        ],
        visualPrompt: `Diagram visual interaktif dengan 3 pilar konsep yang saling menopang dilengkapi ikon grafis berwarna harmonis.`,
        teacherNotes: `Konsep ini bukan untuk dihafal mati, melainkan dipahami alur keterhubungannya. Perhatikan bagaimana perubahan satu bagian mempengaruhi keseimbangan materi ${topic}.`,
      },
      {
        num: 4,
        title: `Investigasi Terbimbing & Analisis Kasus ${topic}`,
        points: [
          `Mengolah data spesimen / studi kasus bersama rekan kelompok`,
          `Menguji hipotesis melalui lembar kerja dan bukti empiris`,
          `Menemukan benang merah penyelesaian masalah berdasarkan data`,
        ],
        visualPrompt: `Infografik alur langkah investigasi ilmiah dari data mentah menuju penarikan kesimpulan berbasis bukti.`,
        teacherNotes: `Bekerjalah dengan saling menghargai secara mindful. Diskusikan bukti data apa yang paling kuat mendukung analisis kelompok kalian.`,
      },
      {
        num: 5,
        title: `Aksi Nyata & Kolaborasi Solusi Berkelanjutan`,
        points: [
          `Merumuskan ide solusi konkret menerapkan prinsip ${topic}`,
          `Membagikan karya dan gagasan kepada kelas melalui presentasi singkat`,
          `Menerima umpan balik apresiatif dan saling memperkuat pemahaman`,
        ],
        visualPrompt: `Ilustrasi kolaboratif siswa bergotong royong menciptakan karya kreatif yang bermanfaat bagi lingkungan sekolah.`,
        teacherNotes: `Setiap ide kalian berharga! Tuliskan aksi nyata paling konkret yang dapat kita lakukan bersama untuk mempraktikkan konsep ${topic}.`,
      },
      {
        num: 6,
        title: `Refleksi Berkesadaran & Komitmen Belajar`,
        points: [
          `Apa pemahaman paling bermakna dari ${topic} yang mengubah caraku berpikir?`,
          `Kekuatan apa yang berhasil aku kembangkan selama proses belajar hari ini?`,
          `Satu komitmen nyata yang akan aku lakukan di kehidupan sehari-hari`,
        ],
        visualPrompt: `Cermin refleksi dengan kartu komitmen berkesadaran yang menumbuhkan rasa syukur dan tujuan belajar mendalam.`,
        teacherNotes: `Mari hening sejenak. Renungkan satu hal paling bermakna yang kalian pelajari dari ${topic} hari ini. Tuliskan dalam tiket keluar kalian.`,
      },
    ];
  }

  return slides;
}

function parsePodcastDialogue(md: string, topic: string, tp?: string) {
  const dialogueLines: { speaker: string; text: string; role: 'host' | 'guru' }[] = [];
  const lines = md.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const hostMatch = trimmed.match(/^\*?\*?(?:Host|Siswa|Rian|Andi)\*?\*?:\s*(.+)$/i);
    const guruMatch = trimmed.match(/^\*?\*?(?:Guru|Pakar|Ibu|Bapak|Narasumber|Narator)\*?\*?:\s*(.+)$/i);

    if (hostMatch) {
      dialogueLines.push({ speaker: 'Rian (Siswa/Host)', text: hostMatch[1].replace(/\[.*?\]/g, '').trim(), role: 'host' });
    } else if (guruMatch) {
      dialogueLines.push({ speaker: 'Ibu Guru (Narasumber)', text: guruMatch[1].replace(/\[.*?\]/g, '').trim(), role: 'guru' });
    }
  }

  if (dialogueLines.length === 0) {
    return [
      {
        speaker: 'Rian (Siswa/Host)',
        text: `Halo teman-teman pembelajar hebat! Selamat datang di Ruang Podcast Edukasi. Hari ini kita kedatangan Ibu Guru untuk membahas topik seru tentang "${topic}"!`,
        role: 'host' as const,
      },
      {
        speaker: 'Ibu Guru (Narasumber)',
        text: `Halo Rian dan halo anak-anak hebat di seluruh kelas! Senang sekali bisa mendampingi kalian. Hari ini sasaran belajar utama kita adalah: "${tp || 'memahami konsep secara mendalam dan menerapkannya dalam memecahkan masalah nyata'}". Topik ${topic} ini sangat dekat dengan keseharian kita lho!`,
        role: 'guru' as const,
      },
      {
        speaker: 'Rian (Siswa/Host)',
        text: `Iya Bu, kemarin saya sempat berpikir, mengapa ya konsep ${topic} ini sangat penting untuk kita selidiki secara mendalam, bukan sekadar menghafal rumus atau definisinya?`,
        role: 'host' as const,
      },
      {
        speaker: 'Ibu Guru (Narasumber)',
        text: `Pertanyaan cerdas, Rian! Ketika kita belajar dengan kesadaran penuh dan menemukan maknanya, kita dapat menghubungkan fenomena nyata dengan solusi konkret. Kita mengamati data, menguji hipotesis, dan membuktikannya bersama kelompok.`,
        role: 'guru' as const,
      },
      {
        speaker: 'Rian (Siswa/Host)',
        text: `Wah, berarti di lembar kerja investigasi nanti kita diajak untuk menjadi saintis muda yang aktif ya, Bu?`,
        role: 'host' as const,
      },
      {
        speaker: 'Ibu Guru (Narasumber)',
        text: `Tepat sekali! Belajar mendalam itu bermakna, berkesadaran, dan menggembirakan. Mari kita mulai eksplorasi berpikir kritis ini bersama-sama!`,
        role: 'guru' as const,
      },
    ];
  }

  return dialogueLines;
}

function parseVideoScenes(md: string, topic: string, tp?: string) {
  const scenes = [];
  const sceneRegex = /(?:###\s+Scene\s+(\d+)|Scene\s+(\d+)[:\s]+)([^\n]+)?([\s\S]*?)(?=(?:###\s+Scene|Scene\s+\d+|$))/gi;
  let match;

  while ((match = sceneRegex.exec(md)) !== null) {
    const num = parseInt(match[1] || match[2], 10);
    const title = (match[3] || `Adegan ${num}`).trim();
    const content = match[4];

    const visualMatch = content.match(/Visual(?:\s*Scene)?:\s*([^\n]+)/i);
    const narasiMatch = content.match(/(?:Audio|Narasi|Suara):\s*([^\n]+(?:\n[^\n#]+)*)/i);
    const teksMatch = content.match(/Teks\s*(?:di\s*Layar|Layar)?:\s*([^\n]+)/i);

    scenes.push({
      num,
      title,
      visual: visualMatch ? visualMatch[1].trim() : `Visualisasi sinematik konsep ${topic} yang memikat atensi siswa.`,
      narasi: narasiMatch ? narasiMatch[1].trim() : `Halo sahabat pembelajar, perhatikan bagaimana fenomena ${topic} ini terjadi di alam sekitar kita.`,
      teksLayar: teksMatch ? teksMatch[1].trim() : `FOKUS PEMAHAMAN: ${topic}`,
    });
  }

  if (scenes.length === 0) {
    return [
      {
        num: 1,
        title: `Hook Fenomena & Sasaran Capaian Belajar`,
        visual: `Footage resolusi tinggi memperlihatkan fenomena autentik ${topic} di alam nyata dengan teks grafis animasi.`,
        narasi: `Halo saintis muda! Hari ini kita akan menjelajahi materi ${topic}. Sasaran capaian kita adalah: ${tp || 'memahami konsep esensial dan menerapkannya dalam penyelidikan nyata'}.`,
        teksLayar: `TOPIK: ${topic.toUpperCase()} | TARGET: ${tp ? (tp.length > 55 ? tp.slice(0, 55) + '...' : tp) : 'PEMAHAMAN BERMAKNA'}`,
      },
      {
        num: 2,
        title: `Pertanyaan Pemantik Berkesadaran`,
        visual: `Tampilan grafis pertanyaan melayang dengan latar gerak lambat objek kontekstual terkait materi ${topic}.`,
        narasi: `Apa sebenarnya penyebab di balik fenomena ini? Dan bagaimana keteraturan konsep ${topic} menjelaskannya secara logis?`,
        teksLayar: `MENGAPA FENOMENA ${topic.toUpperCase()} BISA TERJADI?`,
      },
      {
        num: 3,
        title: `Eksplorasi Struktur & Konsep Kunci`,
        visual: `Diagram animasi interaktif yang membedah struktur internal konsep ${topic} menjadi komponen yang mudah dipahami.`,
        narasi: `Mari kita bedah struktur intinya. Setiap komponen memiliki peran esensial yang saling terhubung erat.`,
        teksLayar: `STRUKTUR & POLA KETERATURAN ${topic.toUpperCase()}`,
      },
      {
        num: 4,
        title: `Studi Kasus & Demonstrasi Bukti`,
        visual: `Simulasi grafik perbandingan saat parameter diubah, memperlihatkan reaksi sistem materi ${topic} secara nyata.`,
        narasi: `Lihat apa yang terjadi saat kondisinya berubah. Inilah bukti empiris nyata bahwa konsep ${topic} bekerja sesuai kaidah alam.`,
        teksLayar: `ANALISIS BUKTI & DATA EMPIRIS`,
      },
      {
        num: 5,
        title: `Tantangan Investigasi Terbimbing`,
        visual: `Siswa SMP sedang bekerja sama dalam kelas mendiskusikan lembar kerja investigasi materi ${topic}.`,
        narasi: `Sekarang giliran kalian bersama kelompok untuk menyelidiki studi kasus pada lembar kerja dan membuktikan analisis kalian!`,
        teksLayar: `WAKTUNYA BERAKSI & BERKOLABORASI`,
      },
      {
        num: 6,
        title: `Refleksi & Pesan Kebermaknaan Hidup`,
        visual: `Pemandangan alam yang harmonis dengan kutipan inspiratif tentang kepedulian terhadap lingkungan sekitar.`,
        narasi: `Pengetahuan tentang ${topic} ini sungguh bermakna saat kita terapkan untuk menjaga kelestarian dan kebaikan lingkungan kita bersama.`,
        teksLayar: `BELAJAR BERMAKNA UNTUK KEHIDUPAN NYATA`,
      },
    ];
  }

  return scenes;
}

function parseInteractiveQuestions(md: string, topic: string, tp?: string, kktp?: string) {
  const questions: {
    id: string;
    pertanyaan: string;
    pilihan: string[];
    kunciJawaban: number;
    pembahasan: string;
    tipeHOTS: string;
  }[] = [];

  const missionRegex = /(?:\*\*Misi\s+(\d+)[:\s]+|\bSoal\s+(\d+)[:\s]+)([^\n]+)?([\s\S]*?)(?=(?:\*\*Misi|\bSoal\s+\d+|$))/gi;
  let match;

  while ((match = missionRegex.exec(md)) !== null) {
    const num = match[1] || match[2];
    const rawContent = match[4];

    // Extract Question
    const qMatch = rawContent.match(/(?:Skenario\s*Soal|Pertanyaan):\s*\*?"?([^\n"]+)"?\*?/i);
    const questionText = qMatch ? qMatch[1].trim() : `Pertanyaan Misi ${num} terkait penerapan konsep ${topic}.`;

    // Extract options
    const options: string[] = [];
    let correctIdx = 1; // default to B
    const optMatches = rawContent.match(/[-*]\s*([A-D])\.\s*([^\n]+)/gi);
    if (optMatches) {
      optMatches.forEach((optStr, idx) => {
        const clean = optStr.replace(/^[-*]\s*[A-D]\.\s*/i, '').trim();
        if (clean.includes('[KUNCI BENAR]') || clean.includes('(Benar)')) {
          correctIdx = idx;
        }
        options.push(clean.replace(/\[KUNCI BENAR\]/i, '').replace(/\(Benar\)/i, '').trim());
      });
    }

    // Extract explanation
    const expMatch = rawContent.match(/(?:Penjelasan\s*Nalar|Umpan\s*Balik|Pembahasan):\s*\*?"?([^\n"]+)"?\*?/i);
    const explanation = expMatch
      ? expMatch[1].trim()
      : `Konsep ini menuntut penalaran kritis terhadap hubungan sebab-akibat materi ${topic} secara terstruktur.`;

    if (options.length >= 2) {
      questions.push({
        id: `q-${num}-${Date.now()}`,
        pertanyaan: questionText,
        pilihan: options,
        kunciJawaban: correctIdx,
        pembahasan: explanation,
        tipeHOTS: num === '1' ? 'Identifikasi Kritis' : num === '2' ? 'Analisis Kausalitas' : 'Solusi Berkelanjutan',
      });
    }
  }

  if (questions.length === 0) {
    return [
      {
        id: 'q-1',
        pertanyaan: `Berdasarkan fenomena kontekstual materi "${topic}", manakah karakteristik mendasar yang paling tepat membedakannya dari materi lain?`,
        pilihan: [
          'Terjadi secara spontan tanpa aturan saintifik yang jelas',
          'Memiliki pola keteraturan dan prinsip hubungan sebab-akibat yang teruji nyata',
          'Tidak memiliki pengaruh langsung terhadap aktivitas kehidupan sehari-hari',
          'Hanya berlaku pada kondisi eksperimen buatan yang terisolasi',
        ],
        kunciJawaban: 1,
        pembahasan: `Konsep ${topic} memiliki keterhubungan autentik dengan dunia nyata dan hukum alam yang dapat diuji secara empiris.`,
        tipeHOTS: 'Pemahaman Konseptual (C2)',
      },
      {
        id: 'q-2',
        pertanyaan: `Untuk mewujudkan sasaran belajar: "${tp || 'Menerapkan konsep dalam analisis masalah'}", langkah investigasi manakah yang paling valid saat menguji hipotesis ${topic}?`,
        pilihan: [
          'Langsung menarik kesimpulan hanya berdasarkan perkiraan awal',
          'Membandingkan data pengamatan dengan kelompok kontrol secara teliti dan objektif',
          'Mengubah seluruh variabel percobaan secara bersamaan dalam satu waktu',
          'Mengabaikan data yang tidak sesuai dengan dugaan pribadi',
        ],
        kunciJawaban: 1,
        pembahasan: 'Metode ilmiah dalam pembelajaran mendalam menuntut perbandingan objektif antara variabel uji dan kontrol berbasis bukti.',
        tipeHOTS: 'Aplikasi Investigasi (C3)',
      },
      {
        id: 'q-3',
        pertanyaan: `Jika salah satu variabel kunci dalam sistem ${topic} mengalami gangguan, bagaimana dampak yang paling logis menurut nalar kritis kalian?`,
        pilihan: [
          'Sistem langsung berhenti berfungsi total tanpa ada respons adaptasi',
          'Komponen lain akan merespons dan beradaptasi untuk menyeimbangkan kembali sistem',
          'Tidak akan terjadi perubahan apapun karena sistem bersifat kaku',
          'Semua variabel akan berubah menjadi bentuk yang sama persis',
        ],
        kunciJawaban: 1,
        pembahasan: 'Sistem alamiah bekerja secara dinamis dan saling mempengaruhi (interdependensi). Gangguan memicu penyesuaian keseimbangan.',
        tipeHOTS: 'Analisis Kausalitas (C4)',
      },
      {
        id: 'q-4',
        pertanyaan: `Terkait indikator ketercapaian: "${kktp || 'Merumuskan solusi kontekstual'}", tindakan konkret apa yang paling tepat membuktikan pemahaman bermakna kalian tentang ${topic}?`,
        pilihan: [
          'Menyimpan pengetahuan untuk diri sendiri tanpa mau berbagi',
          'Merancang aksi nyata sederhana berbasis data yang bermanfaat bagi sekolah dan lingkungan',
          'Menunggu instruksi tanpa inisiatif melakukan observasi mandiri',
          'Menghafal definisinya saja tanpa mengaplikasikannya di kehidupan nyata',
        ],
        kunciJawaban: 1,
        pembahasan: 'Pembelajaran mendalam bermuara pada komitmen aksi nyata yang berkesadaran dan solutif bagi sesama dan lingkungan.',
        tipeHOTS: 'Evaluasi & Aksi HOTS (C5)',
      },
    ];
  }

  return questions;
}

export const MediaLiveStudio: React.FC<MediaLiveStudioProps> = ({
  media,
  mapel,
  kelas,
  topik,
  tujuanPembelajaran,
  indikatorKetercapaian,
  pengalamanBelajar,
  prinsipMendalam,
  onBackToScript,
  onShowToast,
}) => {
  // Determine studio mode from category and specific type
  const [activeMode, setActiveMode] = useState<KategoriMediaPembelajaran>(media.kategori);

  // 1. SLIDE PRESENTATION STATE
  const slides = parseSlidesFromMarkdown(media.naskahRancanganLengkap || '', topik, tujuanPembelajaran, indikatorKetercapaian);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideTheme, setSlideTheme] = useState<'indigo' | 'emerald' | 'sunset' | 'dark'>('indigo');
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(false);
  const [isSlideAutoPlaying, setIsSlideAutoPlaying] = useState<boolean>(false);

  // 2. PODCAST / AUDIO PLAYER STATE
  const dialogueLines = parsePodcastDialogue(media.naskahRancanganLengkap || '', topik, tujuanPembelajaran);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const isSpeechSpeakingRef = useRef<boolean>(false);

  // 3. VIDEO SCENE PLAYER STATE
  const videoScenes = parseVideoScenes(media.naskahRancanganLengkap || '', topik, tujuanPembelajaran);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // 4. INTERACTIVE QUIZ GAME STATE
  const quizQuestions = parseInteractiveQuestions(media.naskahRancanganLengkap || '', topik, tujuanPembelajaran, indikatorKetercapaian);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [quizTimer, setQuizTimer] = useState<number>(20);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Slide Auto-play effect
  useEffect(() => {
    let timer: any;
    if (isSlideAutoPlaying) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isSlideAutoPlaying, slides.length]);

  // Speech Synthesis for Audio Studio
  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsVideoPlaying(false);
    isSpeechSpeakingRef.current = false;
  };

  const speakText = (text: string, role: 'host' | 'guru', onComplete?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onShowToast('info', 'Browser Anda tidak mendukung pemutaran suara Web Speech.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = speechRate;
    // Differentiate character voice pitch
    utterance.pitch = role === 'host' ? speechPitch * 1.15 : speechPitch * 0.92;

    // Pick Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID'));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => {
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      isSpeechSpeakingRef.current = false;
    };

    isSpeechSpeakingRef.current = true;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleAudioPlay = () => {
    if (isPlayingAudio) {
      stopSpeech();
    } else {
      setIsPlayingAudio(true);
      playPodcastFromLine(activeDialogueIndex);
    }
  };

  const playPodcastFromLine = (lineIdx: number) => {
    if (lineIdx >= dialogueLines.length) {
      setIsPlayingAudio(false);
      setActiveDialogueIndex(0);
      playBeep('complete');
      return;
    }

    setActiveDialogueIndex(lineIdx);
    const line = dialogueLines[lineIdx];
    speakText(line.text, line.role, () => {
      playPodcastFromLine(lineIdx + 1);
    });
  };

  // Video scene player speak sync
  const handlePlayVideoScene = (sceneIdx: number) => {
    setCurrentSceneIndex(sceneIdx);
    setIsVideoPlaying(true);
    const scene = videoScenes[sceneIdx];
    speakText(scene.narasi, 'guru', () => {
      if (sceneIdx < videoScenes.length - 1) {
        setTimeout(() => handlePlayVideoScene(sceneIdx + 1), 1000);
      } else {
        setIsVideoPlaying(false);
        playBeep('complete');
      }
    });
  };

  // Quiz Timer effect
  useEffect(() => {
    let interval: any;
    if (activeMode === 'Multimedia-Interaktif' && !isAnswerSubmitted && !isQuizFinished && !isTimerPaused) {
      interval = setInterval(() => {
        setQuizTimer((prev) => {
          if (prev <= 1) {
            // Time out: automatically reveal answer
            handleAnswerSelect(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMode, isAnswerSubmitted, isQuizFinished, isTimerPaused]);

  // Quiz Answer Submit
  const handleAnswerSelect = (optionIdx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optionIdx);
    setIsAnswerSubmitted(true);

    const currentQ = quizQuestions[quizIndex];
    const isCorrect = optionIdx === currentQ.kunciJawaban;

    if (isCorrect) {
      playBeep('correct');
      const earnedScore = 200 + quizStreak * 50;
      setQuizScore((prev) => prev + earnedScore);
      setQuizStreak((prev) => prev + 1);
    } else {
      playBeep('wrong');
      setQuizStreak(0);
    }
  };

  const handleNextQuiz = () => {
    playBeep('click');
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setQuizTimer(20);
    } else {
      setIsQuizFinished(true);
      playBeep('complete');
    }
  };

  const handleRestartQuiz = () => {
    playBeep('click');
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTimer(20);
    setIsQuizFinished(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-full min-h-[640px]'
      }`}
    >
      {/* Studio Header Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              {activeMode === 'Visual' && <ImageIcon className="w-4 h-4" />}
              {activeMode === 'Audio' && <Headphones className="w-4 h-4" />}
              {activeMode === 'Audiovisual' && <Video className="w-4 h-4" />}
              {activeMode === 'Multimedia-Interaktif' && <Gamepad2 className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{media.jenisSpesifik}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Live Media Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {mapel} • {kelas} • {topik}
              </p>
            </div>
          </div>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 space-x-1">
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setActiveMode('Visual');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeMode === 'Visual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. Visual (PPT)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setActiveMode('Audio');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeMode === 'Audio' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. Audio (Podcast)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setActiveMode('Audiovisual');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeMode === 'Audiovisual' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Video (Micro)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setActiveMode('Multimedia-Interaktif');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeMode === 'Multimedia-Interaktif' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4. Kuis Gamifikasi</span>
          </button>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Proyektor / Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onBackToScript}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Naskah</span>
          </button>
        </div>
      </div>

      {/* Target & Alignment Context Bar */}
      {(topik || tujuanPembelajaran) && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0 flex items-center space-x-1">
              <Target className="w-3.5 h-3.5" />
              <span>Target TP</span>
            </span>
            <span className="text-slate-200 font-medium truncate" title={tujuanPembelajaran}>
              {tujuanPembelajaran || `Memahami konsep kunci materi ${topik}`}
            </span>
          </div>
          {indikatorKetercapaian && (
            <div className="hidden md:flex items-center space-x-2 shrink-0 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] truncate max-w-sm" title={indikatorKetercapaian}>
                <strong>KKTP:</strong> {indikatorKetercapaian}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Studio Interactive Stage */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col justify-center">
        {/* ======================================================== */}
        {/* 1. VISUAL ENGINE: INTERACTIVE SLIDE PRESENTATION PLAYER */}
        {/* ======================================================== */}
        {activeMode === 'Visual' && (
          <div className="max-w-4xl w-full mx-auto flex flex-col space-y-4">
            {/* 16:9 Slide Canvas */}
            <div
              className={`aspect-video w-full rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500 border ${
                slideTheme === 'indigo'
                  ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-700/50'
                  : slideTheme === 'emerald'
                  ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900 text-white border-emerald-700/50'
                  : slideTheme === 'sunset'
                  ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-rose-950 text-white border-amber-700/50'
                  : 'bg-gradient-to-br from-slate-950 via-zinc-900 to-black text-white border-slate-700/50'
              }`}
            >
              {/* Background ambient decorative shapes */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

              {/* Slide Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-300 border border-white/15">
                    Slide {currentSlideIndex + 1} dari {slides.length}
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    {mapel} • {kelas} • {topik}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kurikulum Merdeka • Pembelajaran Mendalam</span>
                </div>
              </div>

              {/* Slide Body */}
              <div className="my-auto py-4 relative z-10">
                {currentSlideIndex === 0 && (
                  <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5 backdrop-blur-xs">
                    <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Tujuan Pembelajaran:</span>
                      <p className="mt-0.5 text-[11px] text-amber-100/90 leading-relaxed font-medium">
                        {tujuanPembelajaran || media.keselarasan?.tujuanPembelajaran || `Memahami esensi materi ${topik} secara mendalam dan bermakna.`}
                      </p>
                    </div>
                  </div>
                )}

                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-5">
                  {slides[currentSlideIndex].title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Bullet points */}
                  <div className="md:col-span-7 space-y-3">
                    {slides[currentSlideIndex].points.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors"
                      >
                        <span className="mt-0.5 p-1 rounded-md bg-indigo-500/30 text-indigo-300">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">{p}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visual prompt card */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between text-xs space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                      <ImageIcon className="w-4 h-4" />
                      <span>Rancangan Visual Prompt Slide:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic leading-relaxed">
                      "{slides[currentSlideIndex].visualPrompt}"
                    </p>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Fokus Kognitif: Memahami</span>
                      <span>16:9 HD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <p className="font-semibold text-slate-300">{topik}</p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-amber-300" />
                    <span>{showSpeakerNotes ? 'Tutup Catatan' : 'Catatan Guru'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Teacher Speaker Notes */}
            {showSpeakerNotes && (
              <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-2 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Naskah Narasi Ucapan Lisan Guru (Slide {currentSlideIndex + 1}):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakText(slides[currentSlideIndex].teacherNotes, 'guru', () =>
                        onShowToast('info', 'Selesai membaca catatan lisan slide.')
                      )
                    }
                    className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold flex items-center space-x-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Bacakan (AI)</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed bg-black/30 p-3 rounded-lg border border-slate-800">
                  {slides[currentSlideIndex].teacherNotes}
                </p>
              </div>
            )}

            {/* Slide Navigation & Theme Controller */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    playBeep('click');
                    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentSlideIndex === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg font-bold flex items-center space-x-1 border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBeep('click');
                    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
                  }}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSlideAutoPlaying(!isSlideAutoPlaying)}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 border transition-all ${
                    isSlideAutoPlaying
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isSlideAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSlideAutoPlaying ? 'Jeda Otomatis' : 'Putar Otomatis'}</span>
                </button>
              </div>

              {/* Theme Picker */}
              <div className="flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[11px]">Tema:</span>
                {(['indigo', 'emerald', 'sunset', 'dark'] as const).map((thm) => (
                  <button
                    key={thm}
                    type="button"
                    onClick={() => setSlideTheme(thm)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      thm === 'indigo'
                        ? 'bg-indigo-600'
                        : thm === 'emerald'
                        ? 'bg-emerald-600'
                        : thm === 'sunset'
                        ? 'bg-amber-600'
                        : 'bg-slate-800'
                    } ${slideTheme === thm ? 'border-white scale-110 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    title={`Tema ${thm}`}
                  />
                ))}
              </div>

              {/* Slide thumbnails dots */}
              <div className="flex items-center space-x-1.5">
                {slides.map((_, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      playBeep('click');
                      setCurrentSlideIndex(sIdx);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      currentSlideIndex === sIdx ? 'w-6 bg-indigo-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Lompat ke slide ${sIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. AUDIO ENGINE: PODCAST & SPEECH SYNTHESIS STUDIO */}
        {/* ======================================================== */}
        {activeMode === 'Audio' && (
          <div className="max-w-3xl w-full mx-auto flex flex-col space-y-4">
            {/* Audio Alignment Pill */}
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-amber-300 min-w-0">
                <Target className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="font-semibold truncate">Target Podcast: {tujuanPembelajaran || `Menjelajahi esensi materi ${topik}`}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">{mapel} • {kelas}</span>
            </div>

            {/* Audio Master Player Bar */}
            <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleToggleAudioPlay}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 scale-105 ring-4 ring-amber-500/20'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Podcast Edukasi Dialogis AI</span>
                    {isPlayingAudio && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        <span>● Mengudara</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Karakter: <strong>Rian (Host/Siswa)</strong> & <strong>Ibu Guru (Mentor)</strong>
                  </p>
                </div>
              </div>

              {/* Sound Equalizer Waves (Animated CSS) */}
              <div className="flex items-center space-x-1 h-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className={`w-1 bg-amber-400 rounded-full transition-all duration-200 ${
                      isPlayingAudio ? 'animate-pulse' : 'h-2 opacity-30'
                    }`}
                    style={{
                      height: isPlayingAudio ? `${Math.max(8, (i * 9) % 32)}px` : '6px',
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Audio Speed Controller */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Kecepatan:</span>
                {[0.8, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeechRate(spd)}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      speechRate === spd
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Dialogue Bubbles Script */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-h-[420px] overflow-y-auto space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Skrip Dialog Berbicara (Klik balon dialog mana saja untuk mulai mendengarkan dari sana):
              </p>

              {dialogueLines.map((line, idx) => {
                const isHost = line.role === 'host';
                const isActive = isPlayingAudio && activeDialogueIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      stopSpeech();
                      setIsPlayingAudio(true);
                      playPodcastFromLine(idx);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : isHost
                        ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                        : 'bg-slate-850/80 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        isHost ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-slate-950'
                      }`}
                    >
                      {isHost ? 'H' : 'G'}
                    </div>

                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isHost ? 'text-indigo-300' : 'text-amber-300'}`}>
                          {line.speaker}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-amber-300 font-bold flex items-center space-x-1 animate-pulse">
                            <Volume2 className="w-3 h-3" />
                            <span>Sedang Berbicara</span>
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 leading-relaxed font-normal">{line.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. AUDIOVISUAL ENGINE: VIDEO SCENE & STORYBOARD SIMULATOR */}
        {/* ======================================================== */}
        {activeMode === 'Audiovisual' && (
          <div className="max-w-4xl w-full mx-auto flex flex-col space-y-4">
            {/* Video Alignment Pill */}
            <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-rose-300 min-w-0">
                <Target className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-semibold truncate">Target Video: {tujuanPembelajaran || `Visualisasi esensial materi ${topik}`}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">{mapel} • {kelas}</span>
            </div>

            {/* Video Canvas (16:9 cinema ratio) */}
            <div className="aspect-video w-full rounded-2xl bg-black border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-8">
              {/* Top Video Overlay Info */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                    Adegan {videoScenes[currentSceneIndex].num} / {videoScenes.length}
                  </span>
                  <span className="text-xs text-white font-bold tracking-wide">
                    {videoScenes[currentSceneIndex].title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Video Edukasi Kurikulum Merdeka</span>
              </div>

              {/* Visual Scene Simulation Graphic */}
              <div className="my-auto py-6 px-4 bg-slate-900/60 rounded-xl border border-white/10 backdrop-blur-xs flex flex-col items-center justify-center text-center space-y-3 relative z-10">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-xl">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                    Tampilan Visual Adegan:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed">
                    "{videoScenes[currentSceneIndex].visual}"
                  </p>
                </div>
              </div>

              {/* Bottom Subtitle / Captions Bar */}
              <div className="p-3 bg-black/80 rounded-xl border border-white/10 text-center relative z-10">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  [Teks di Layar: {videoScenes[currentSceneIndex].teksLayar}]
                </span>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  "{videoScenes[currentSceneIndex].narasi}"
                </p>
              </div>

              {/* Bottom Scrubber Timeline Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                <div
                  className="h-full bg-rose-600 transition-all duration-300"
                  style={{
                    width: `${((currentSceneIndex + 1) / videoScenes.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Video Controller & Scene selector */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isVideoPlaying) {
                      stopSpeech();
                    } else {
                      handlePlayVideoScene(currentSceneIndex);
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isVideoPlaying ? 'Jeda Narasi Video' : 'Putar Video & Narasi AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopSpeech();
                    setCurrentSceneIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentSceneIndex === 0}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeech();
                    setCurrentSceneIndex((prev) => Math.min(videoScenes.length - 1, prev + 1));
                  }}
                  disabled={currentSceneIndex === videoScenes.length - 1}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scene Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                {videoScenes.map((sc, scIdx) => (
                  <button
                    key={scIdx}
                    type="button"
                    onClick={() => {
                      stopSpeech();
                      setCurrentSceneIndex(scIdx);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                      currentSceneIndex === scIdx
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Scene {sc.num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. MULTIMEDIA ENGINE: PLAYABLE QUIZIZZ / WORDWALL GAME */}
        {/* ======================================================== */}
        {activeMode === 'Multimedia-Interaktif' && (
          <div className="max-w-2xl w-full mx-auto flex flex-col space-y-4">
            {/* Quiz Alignment Pill */}
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-emerald-300 min-w-0">
                <Target className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold truncate">Target Pengujian: {tujuanPembelajaran || `Evaluasi HOTS materi ${topik}`}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">{mapel} • {kelas}</span>
            </div>

            {!isQuizFinished ? (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
                {/* Game HUD Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-white text-sm">
                      Soal {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {quizQuestions[quizIndex].tipeHOTS}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Streak Multiplier */}
                    {quizStreak > 1 && (
                      <span className="flex items-center space-x-1 text-amber-400 font-extrabold text-xs animate-bounce">
                        <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Combo x{quizStreak}!</span>
                      </span>
                    )}

                    {/* Score */}
                    <div className="flex items-center space-x-1.5 text-white font-extrabold">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>{quizScore} Pts</span>
                    </div>

                    {/* Timer countdown bar */}
                    <div
                      className={`flex items-center space-x-1 font-bold text-xs px-2 py-0.5 rounded ${
                        quizTimer <= 5 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{quizTimer}s</span>
                    </div>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="py-2">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {quizQuestions[quizIndex].pertanyaan}
                  </h3>
                </div>

                {/* 4 Interactive Option Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {quizQuestions[quizIndex].pilihan.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrect = oIdx === quizQuestions[quizIndex].kunciJawaban;

                    let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-600/80 text-white border-rose-400 font-bold';
                      } else {
                        btnStyle = 'bg-slate-850 opacity-40 border-slate-800 text-slate-400';
                      }
                    }

                    // Colorful badge letter
                    const letters = ['A', 'B', 'C', 'D'];
                    const letterColors = [
                      'bg-rose-500/30 text-rose-300 border-rose-500/40',
                      'bg-blue-500/30 text-blue-300 border-blue-500/40',
                      'bg-amber-500/30 text-amber-300 border-amber-500/40',
                      'bg-emerald-500/30 text-emerald-300 border-emerald-500/40',
                    ];

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleAnswerSelect(oIdx)}
                        disabled={isAnswerSubmitted}
                        className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${letterColors[oIdx % 4]}`}
                        >
                          {letters[oIdx]}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback & Next Question */}
                {isAnswerSubmitted && (
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-700 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold text-xs">
                        {selectedOption === quizQuestions[quizIndex].kunciJawaban ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400">Hebat, Jawaban Tepat! (+200 Pts)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-400" />
                            <span className="text-rose-400">Belum Tepat, Pelajari Konsepnya:</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleNextQuiz}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-md"
                      >
                        <span>{quizIndex < quizQuestions.length - 1 ? 'Soal Berikutnya' : 'Lihat Hasil Akhir'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-slate-800">
                      <strong>Umpan Balik Mendalam:</strong> {quizQuestions[quizIndex].pembahasan}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz Finished Scorecard */
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl">
                  <Award className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Misi Selesai • Pembelajaran Mendalam
                  </span>
                  <h3 className="text-2xl font-black text-white">Luar Biasa, Eksplorasi Tuntas!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Kalian telah membuktikan pemahaman konsep {topik} dengan bernalar kritis dan berkesadaran.
                  </p>
                </div>

                {/* Score badge */}
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto py-2">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Skor</p>
                    <p className="text-xl font-extrabold text-amber-400">{quizScore} Pts</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tingkat Capaian</p>
                    <p className="text-xl font-extrabold text-emerald-400">
                      {quizScore >= 800 ? 'Mahir' : quizScore >= 500 ? 'Cakap' : 'Layak'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRestartQuiz}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mainkan Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onShowToast('success', 'Soal kuis siap diekspor ke Quizizz / Wordwall!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor ke Quizizz/Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
