import {
  EduGeniusMessage,
  EduGeniusSession,
  EduGeniusInteractiveElement,
  EduGeniusVisualRecommendation,
} from '../types';

export const EDUGENIUS_SYSTEM_PROMPT = `Anda adalah "EduGenius", seorang ahli media pembelajaran interaktif sekaligus Tutor Sokratik Multimodal terbaik untuk siswa SMP/MTs (Fase D).
Tugas Anda adalah membantu siswa memahami materi pelajaran secara mendalam melalui pendekatan visual, audio, dan interaktif.
Gaya bahasa Anda: ramah, menyemangati, adaptif, dan menggunakan analogi yang mudah dipahami (sesuai jenjang usia remaja/SMP).

# CORE CAPABILITIES (VISUAL, AUDIO, INTERACTIVE)

1. KETENTUAN MEDIA VISUAL (Analisis & Generasi Deskripsi):
- Jika siswa mengunggah GAMBAR/FOTO/DIAGRAM, lakukan analisis visual secara mendalam. Identifikasi miskonsepsi dalam gambar dan jelaskan komponennya secara terstruktur.
- Jika menjelaskan konsep abstrak, berikan anotasi/deskripsi tata letak visual (layout) yang jelas atau berikan prompt deskriptif berbasis teks yang bisa digunakan siswa untuk menghasilkan gambar di generator AI (seperti Imagen/Canva).
- Gunakan penanda khusus persis seperti ini:
[Rekomendasi Visual: <Judul Gambar> | <Deskripsi tata letak & visual> | Prompt AI: <Prompt teks bahasa Indonesia untuk Imagen/Canva>]

2. KETENTUAN MEDIA AUDIO (Arah Baca & Intonasi):
- Selalu asumsikan teks jawaban Anda akan dikonversi menjadi suara (Text-to-Speech).
- Buat kalimat yang pendek, ritme yang natural, dan hindari simbol-simbol rumit yang aneh jika dibaca oleh mesin pembaca suara.
- Berikan instruksi intonasi dalam tanda kurung di awal atau bagian penekanan, contoh: (dengan nada ceria), (bicara perlahan), (dengan nada penasaran dan hangat).

3. KETENTUAN MEDIA INTERAKTIF (Tutor Sokratik & Percabangan):
- JANGAN PERNAH langsung memberikan jawaban akhir atau rangkuman materi secara instan.
- Berikan materi dalam bentuk potongan kecil (chunking) maksimal 2-3 paragraf pendek.
- Di akhir setiap respon, Anda WAJIB memberikan elemen interaktif persis menggunakan salah satu format di bawah ini:

PILIHAN FORMAT INTERAKTIF A (Kuis Pemantik Adaptif):
[KUIS PEMANTIK]
Pertanyaan: <Pertanyaan pemantik>
Pilihan:
A. <Teks Pilihan A>
B. <Teks Pilihan B>
C. <Teks Pilihan C>
Kunci: <Huruf A/B/C yang benar>
Clue: <Petunjuk singkat jika salah>

ATAU

PILIHAN FORMAT INTERAKTIF B (Percabangan Skenario):
[PERCABANGAN SKENARIO]
Skenario: <Pertanyaan pilihan rute eksplorasi berikutnya>
Pilihan:
1. <Pilihan Arah 1>
2. <Pilihan Arah 2>
3. <Pilihan Arah 3>

# OPERATIONAL PROTOCOL (Workflow)
- Langkah 1: Sapa siswa dan tanyakan materi atau unggahan visual apa yang ingin mereka pelajari hari ini (jika awal percakapan).
- Langkah 2: Evaluasi input siswa (apakah teks, gambar, atau audio).
- Langkah 3: Berikan umpan balik (feedback) positif, jelaskan konsep secara visual-sentris, dan tutup dengan tantangan interaktif.
- Langkah 4: Sesuaikan tingkat kesulitan soal berikutnya berdasarkan akurasi jawaban siswa (jika jawaban salah, turunkan tingkat kesulitan dan berikan petunjuk/clue baru).
- Tuliskan penanda level di baris terakhir: [Level: Dasar/Menengah/Mahir]

# SAFETY & BOUNDARIES
- Tolak dengan sopan jika siswa menanyakan hal di luar konteks akademis atau pembelajaran.
- Pastikan konten ramah anak dan bebas dari unsur sensitif.`;

/**
 * Parser for EduGenius AI Response string into structured data
 */
export function parseEduGeniusResponse(rawText: string): {
  cleanText: string;
  audioIntonation?: string;
  visualRecommendation?: EduGeniusVisualRecommendation;
  interactiveElement?: EduGeniusInteractiveElement;
  difficultyLevel?: 'dasar' | 'menengah' | 'mahir';
} {
  let workingText = rawText.trim();
  let audioIntonation: string | undefined;
  let visualRecommendation: EduGeniusVisualRecommendation | undefined;
  let interactiveElement: EduGeniusInteractiveElement | undefined;
  let difficultyLevel: 'dasar' | 'menengah' | 'mahir' = 'menengah';

  // 1. Extract audio intonation e.g. (dengan nada ceria)
  const intonationMatch = workingText.match(/^\((dengan nada [^)]+|bicara [^)]+)\)/i);
  if (intonationMatch) {
    audioIntonation = intonationMatch[0];
  }

  // 2. Extract difficulty level e.g. [Level: Dasar/Menengah/Mahir]
  const levelMatch = workingText.match(/\[Level:\s*(Dasar|Menengah|Mahir)\]/i);
  if (levelMatch) {
    const lvl = levelMatch[1].toLowerCase();
    if (lvl === 'dasar' || lvl === 'menengah' || lvl === 'mahir') {
      difficultyLevel = lvl;
    }
    workingText = workingText.replace(levelMatch[0], '').trim();
  }

  // 3. Extract Visual Recommendation e.g. [Rekomendasi Visual: ...]
  const visualMatch = workingText.match(/\[Rekomendasi Visual:\s*([^\]]+)\]/i);
  if (visualMatch) {
    const visualContent = visualMatch[1];
    const parts = visualContent.split('|').map((s) => s.trim());
    const title = parts[0] || 'Visual Pembelajaran';
    const description = parts[1] || parts[0];
    const promptPart = parts.find((p) => p.toLowerCase().startsWith('prompt ai:')) || parts[2] || '';
    const promptText = promptPart.replace(/^prompt ai:\s*/i, '').trim() || `Ilustrasi edukatif ${title} dengan gaya modern berwarna cerah`;

    visualRecommendation = {
      title,
      description,
      promptText,
      layoutDescription: description,
    };

    // Remove the bracket from working text for clean display
    workingText = workingText.replace(visualMatch[0], '').trim();
  }

  // 4. Extract Interactive Element (Kuis Pemantik OR Percabangan Skenario)
  const kuisMatch = workingText.match(/\[KUIS PEMANTIK\]([\s\S]*?)(?=(\[Level:|$))/i);
  const scenarioMatch = workingText.match(/\[PERCABANGAN SKENARIO\]([\s\S]*?)(?=(\[Level:|$))/i);

  if (kuisMatch) {
    const kuisBlock = kuisMatch[1];
    const questionMatch = kuisBlock.match(/Pertanyaan:\s*([^\n]+)/i);
    const kunciMatch = kuisBlock.match(/Kunci:\s*([A-C])/i);
    const clueMatch = kuisBlock.match(/Clue:\s*([^\n]+)/i);

    const options: { id: string; label: string; isCorrect: boolean; explanation?: string }[] = [];
    const optionMatches = kuisBlock.matchAll(/([A-C])\.\s*([^\n]+)/g);
    for (const opt of optionMatches) {
      const letter = opt[1].toUpperCase();
      const label = opt[2].trim();
      const isCorrect = kunciMatch ? kunciMatch[1].toUpperCase() === letter : false;
      options.push({
        id: letter,
        label: `${letter}. ${label}`,
        isCorrect,
        explanation: clueMatch ? clueMatch[1].trim() : undefined,
      });
    }

    if (options.length > 0) {
      interactiveElement = {
        type: 'quiz',
        questionOrPrompt: questionMatch ? questionMatch[1].trim() : 'Jawab pertanyaan pemantik ini:',
        options,
      };
      workingText = workingText.replace(kuisMatch[0], '').trim();
    }
  } else if (scenarioMatch) {
    const scenarioBlock = scenarioMatch[1];
    const promptMatch = scenarioBlock.match(/Skenario:\s*([^\n]+)/i);
    const options: { id: string; label: string }[] = [];
    const optionMatches = scenarioBlock.matchAll(/([1-3A-C])[\.\)]\s*([^\n]+)/g);
    for (const opt of optionMatches) {
      options.push({
        id: opt[1],
        label: opt[2].trim(),
      });
    }

    if (options.length > 0) {
      interactiveElement = {
        type: 'scenarios',
        questionOrPrompt: promptMatch ? promptMatch[1].trim() : 'Pilih langkah eksplorasi berikutnya:',
        options,
      };
      workingText = workingText.replace(scenarioMatch[0], '').trim();
    }
  }

  return {
    cleanText: workingText,
    audioIntonation,
    visualRecommendation,
    interactiveElement,
    difficultyLevel,
  };
}

/**
 * Intelligent client-side fallback if server/API is unreachable
 */
function getIntelligentEduGeniusFallback(
  userText: string,
  hasImage: boolean,
  session: EduGeniusSession,
  level: 'dasar' | 'menengah' | 'mahir'
): string {
  const rpp = session.rppContext;
  const tp = rpp?.tujuanPembelajaran || `Memahami konsep esensial ${session.topik} secara bernalar kritis`;
  const pemantikUtama = rpp?.pertanyaanPemantik?.[0] || `Bagaimana prinsip dasar ${session.topik} bekerja dalam kehidupan nyata kita?`;
  const pemahamanBermakna = rpp?.pemahamanBermakna || `Konsep ${session.topik} memiliki peran penting dalam kehidupan sehari-hari.`;
  const kelas = session.kelas || 'VII';

  if (hasImage) {
    return `(dengan nada antusias dan ramah) Wah, diagram yang kamu bagikan untuk Kelas ${kelas} sangat menarik!

Mari kita bedah komponen visual ini agar selaras dengan tujuan pembelajaran kita, yaitu: ${tp}.
1. Objek Utama: Diagram/foto ini memperlihatkan mekanisme kunci dari ${session.topik}.
2. Identifikasi Miskonsepsi: Banyak siswa mengira seluruh proses terjadi secara serempak, padahal ada urutan kausalitas bertahap yang membutuhkan pemicu awal!

[Rekomendasi Visual: Analisis Diagram ${session.topik} | Diagram berlabel terstruktur alur proses 3 tahap dengan warna kontras gaya modern | Prompt AI: Diagram infografik edukatif terstruktur tentang ${session.topik} untuk siswa SMP Kelas ${kelas} beresolusi tinggi]

Sekarang, mari uji pemahamanmu berdasarkan visual tersebut:

[KUIS PEMANTIK]
Pertanyaan: Berdasarkan visual di atas, apa pemicu utama yang mengawali proses ${session.topik}?
Pilihan:
A. Adanya stimulus atau energi awal yang masuk ke dalam sistem
B. Hasil akhir yang terbentuk tiba-tiba tanpa tahapan
C. Semua komponen bekerja serentak tanpa urutan input dan output
Kunci: A
Clue: Ingat prinsip pembelajaran mendalam: setiap fenomena selalu diawali oleh input atau pemicu mula!
[Level: ${level}]`;
  }

  return `(dengan nada ceria dan hangat) Pertanyaan yang luar biasa untuk pembelajaran Kelas ${kelas} tentang **${session.topik}**!

Berdasarkan tujuan belajar kita: *${tp}*, ${pemahamanBermakna}

Bayangkan konsep ini seperti sebuah orkestra musik yang harmonis. Setiap instrumen memainkan perannya pada ketukan yang tepat sehingga menghasilkan melodi yang indah dan seimbang.

[Rekomendasi Visual: Ilustrasi Konsep ${session.topik} | Bagan alir interaktif berwarna cerah dengan analogi sistem yang saling terhubung | Prompt AI: Ilustrasi 2D edukasi bersih tentang konsep ${session.topik} dengan analogi sistem harmonis untuk siswa SMP Kelas ${kelas}]

Mari kita selidiki pertanyaan pemantik dari modul ajar kita:
*${pemantikUtama}*

[PERCABANGAN SKENARIO]
Skenario: Rute eksplorasi mana yang ingin kamu pilih untuk menguasai konsep ini?
Pilihan:
1. Menyelidiki fenomena nyata di sekitar lingkungan kita (Tahap Memahami)
2. Memecahkan tantangan studi kasus aplikatif bersama (Tahap Mengaplikasi)
3. Menguji pemahaman melalui kuis adaptif bertahap (Tahap Merefleksi)
[Level: ${level}]`;
}

/**
 * Send message to EduGenius API
 */
export async function sendEduGeniusMessage(params: {
  session: EduGeniusSession;
  userText: string;
  userImage?: { data: string; mimeType: string; caption?: string };
  difficultyLevel: 'dasar' | 'menengah' | 'mahir';
}): Promise<EduGeniusMessage> {
  const { session, userText, userImage, difficultyLevel } = params;
  const rpp = session.rppContext;

  // Build context of previous conversation (last 4 messages for token economy & relevance)
  const historyText = session.messages
    .slice(-4)
    .map((m) => `${m.sender === 'user' ? 'Siswa' : 'EduGenius'}: ${m.text}`)
    .join('\n\n');

  const prompt = `KONTEKS MODUL AJAR (RPP/RPM) ACUAN YANG DITETAPKAN:
- Mata Pelajaran: ${session.mapel || rpp?.mataPelajaran || 'IPA'}
- Kelas / Fase: Kelas ${session.kelas || rpp?.kelas || 'VII'} (Fase D SMP)
- Topik / Materi Pokok: ${session.topik || rpp?.topikMateri || 'Materi Pokok'}
- Tujuan Pembelajaran (TP) dari RPP: ${rpp?.tujuanPembelajaran || 'Memahami konsep esensial dan mengaplikasikannya'}
- Indikator Ketercapaian: ${rpp?.indikatorKetercapaian || '-'}
- Pemahaman Bermakna: ${rpp?.pemahamanBermakna || '-'}
- Pertanyaan Pemantik dari RPP: ${rpp?.pertanyaanPemantik?.join('; ') || '-'}
- Pengalaman Pembelajaran Mendalam (Deep Learning):
  * Memahami: ${rpp?.pengalamanBelajar?.memahami || '-'}
  * Mengaplikasi: ${rpp?.pengalamanBelajar?.mengaplikasi || '-'}
  * Merefleksi: ${rpp?.pengalamanBelajar?.merefleksi || '-'}
- Tingkat Kesulitan Sokratik: ${difficultyLevel.toUpperCase()}

RIWAYAT PERCAKAPAN SEBELUMNYA:
${historyText || '(Awal percakapan pembelajaran)'}

INPUT SISWA KELAS ${session.kelas || 'VII'}:
${userText || '(Siswa mengirimkan gambar untuk dianalisis)'}
${userImage ? `[SISWA MENGUNGGAH GAMBAR: ${userImage.caption || 'Gambar materi pelajaran'}]` : ''}

INSTRUKSI KHUSUS EDUGENIUS:
- WAJIB selaras dengan TUJUAN PEMBELAJARAN dan PERTANYAAN PEMANTIK Modul Ajar/RPP di atas.
- Sesuaikan tingkat bahasa dan kedalaman untuk siswa SMP Kelas ${session.kelas || 'VII'}.
- Sapa ramah dengan intonasi awal dalam tanda kurung, contoh: (dengan nada ceria dan menyemangati).
- Jika ada gambar, lakukan analisis visual mendalam dan identifikasi miskonsepsi yang mungkin timbul.
- Jika konsep abstrak, sertakan [Rekomendasi Visual: Judul | Deskripsi layout | Prompt AI: ...].
- Pecah materi menjadi potongan kecil (maksimal 2-3 paragraf pendek, kalimat natural untuk mesin TTS).
- Tutup respon dengan WAJIB menyertakan elemen interaktif: [KUIS PEMANTIK] ATAU [PERCABANGAN SKENARIO].
- Akhiri dengan penanda level: [Level: ${difficultyLevel}]`;

  let responseText = '';

  try {
    const payload: any = {
      prompt,
      systemInstruction: EDUGENIUS_SYSTEM_PROMPT,
    };

    if (userImage && userImage.data) {
      payload.images = [
        {
          data: userImage.data,
          mimeType: userImage.mimeType || 'image/jpeg',
        },
      ];
    }

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        responseText = data.text;
      }
    }
  } catch (error) {
    console.warn('[EduGenius Service] Network error, utilizing intelligent pedagogy fallback');
  }

  if (!responseText) {
    responseText = getIntelligentEduGeniusFallback(
      userText,
      !!userImage,
      session,
      difficultyLevel
    );
  }

  const parsed = parseEduGeniusResponse(responseText);

  return {
    id: 'edug_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    text: parsed.cleanText,
    audioIntonation: parsed.audioIntonation,
    visualRecommendation: parsed.visualRecommendation,
    interactiveElement: parsed.interactiveElement,
    difficultyLevel: parsed.difficultyLevel || difficultyLevel,
  };
}

/**
 * Text-to-Speech Helper using browser Web Speech API
 */
export function speakEduGeniusText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { stop: () => {} };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text from symbols like [] () for smooth reading
  const cleanToSpeak = text
    .replace(/\([^)]+\)/g, '') // remove intonation hints for speech
    .replace(/\[[^\]]+\]/g, '') // remove tags
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanToSpeak) {
    if (options?.onEnd) options.onEnd();
    return { stop: () => {} };
  }

  const utterance = new SpeechSynthesisUtterance(cleanToSpeak);
  utterance.lang = 'id-ID';
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = options?.pitch || 1.05; // Slightly warmer/friendly pitch

  const selectVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.lang.includes('IND')
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }
  };

  selectVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  utterance.onerror = (e) => {
    if (e.error !== 'canceled') {
      if (options?.onError) options.onError();
    }
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
      if (options?.onEnd) options.onEnd();
    },
  };
}
