import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Upload,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  Copy,
  HelpCircle,
  X,
  ArrowRight,
  Compass,
  Check,
  Filter,
  FileText,
  Target,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  TeacherProfile,
  Perencanaan,
  EduGeniusMessage,
  EduGeniusSession,
  EduGeniusInteractiveOption,
  EduGeniusRPPContext,
} from '../types';
import {
  sendEduGeniusMessage,
  speakEduGeniusText,
} from '../services/eduGeniusService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';

// Sample educational diagrams for quick 1-click test
const SAMPLE_DIAGRAMS = [
  {
    title: 'Siklus Fotosintesis & Klorofil',
    caption: 'Diagram alir proses fotosintesis pada daun dengan input cahaya, air, dan karbon dioksida',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23f0fdf4" rx="16"/><text x="200" y="35" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23166534" text-anchor="middle">DIAGRAM PROSES FOTOSINTESIS</text><circle cx="80" cy="110" r="35" fill="%23fef08a" stroke="%23ca8a04" stroke-width="3"/><text x="80" y="115" font-size="11" font-weight="bold" fill="%23854d0e" text-anchor="middle">Cahaya + H2O</text><path d="M 125 110 L 175 110" stroke="%2316a34a" stroke-width="4"/><rect x="185" y="80" width="80" height="60" rx="8" fill="%23bbf7d0" stroke="%2315803d" stroke-width="3"/><text x="225" y="110" font-size="11" font-weight="bold" fill="%2314532d" text-anchor="middle">Kloroplas</text><text x="225" y="125" font-size="9" fill="%23166534" text-anchor="middle">(CO2 ditangkap)</text><path d="M 275 110 L 325 110" stroke="%2316a34a" stroke-width="4"/><circle cx="355" cy="110" r="35" fill="%23dbeafe" stroke="%232563eb" stroke-width="3"/><text x="355" y="105" font-size="11" font-weight="bold" fill="%231e40af" text-anchor="middle">Glukosa</text><text x="355" y="122" font-size="10" font-weight="bold" fill="%232563eb" text-anchor="middle">+ Oksigen (O2)</text><text x="200" y="210" font-size="10" fill="%2364748b" text-anchor="middle">Amati komponen input dan output pada diagram ini</text></svg>`,
  },
  {
    title: 'Rangkaian Listrik Seri vs Paralel',
    caption: 'Ilustrasi rangkaian listrik dasar dengan baterai, sakelar, dan dua lampu pijar',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23f8fafc" rx="16"/><text x="200" y="32" font-family="sans-serif" font-size="15" font-weight="bold" fill="%230f172a" text-anchor="middle">RANGKAIAN LISTRIK SERI</text><rect x="60" y="90" width="40" height="60" rx="4" fill="%23fef08a" stroke="%23eab308" stroke-width="2"/><text x="80" y="125" font-size="11" font-weight="bold" fill="%23a16207" text-anchor="middle">Baterai</text><line x1="80" y1="90" x2="80" y2="60" stroke="%23ef4444" stroke-width="3"/><line x1="80" y1="60" x2="320" y2="60" stroke="%23ef4444" stroke-width="3"/><circle cx="180" cy="60" r="16" fill="%23fde047" stroke="%23ca8a04" stroke-width="2"/><text x="180" y="64" font-size="10" font-weight="bold" fill="%23854d0e" text-anchor="middle">L1</text><circle cx="260" cy="60" r="16" fill="%23fde047" stroke="%23ca8a04" stroke-width="2"/><text x="260" y="64" font-size="10" font-weight="bold" fill="%23854d0e" text-anchor="middle">L2</text><line x1="320" y1="60" x2="320" y2="180" stroke="%233b82f6" stroke-width="3"/><line x1="320" y1="180" x2="80" y2="180" stroke="%233b82f6" stroke-width="3"/><line x1="80" y1="180" x2="80" y2="150" stroke="%233b82f6" stroke-width="3"/><text x="200" y="215" font-size="10" fill="%2364748b" text-anchor="middle">Bagaimana jika lampu L1 padam?</text></svg>`,
  },
  {
    title: 'Siklus Air & Hidrologi',
    caption: 'Diagram siklus hidrologi bumi: evaporasi, kondensasi awan, dan presipitasi hujan',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23f0f9ff" rx="16"/><text x="200" y="30" font-family="sans-serif" font-size="15" font-weight="bold" fill="%230369a1" text-anchor="middle">SIKLUS HIDROLOGI AIR</text><circle cx="60" cy="70" r="22" fill="%23fef08a" stroke="%23eab308" stroke-width="2"/><text x="60" y="74" font-size="8" font-weight="bold" fill="%23854d0e" text-anchor="middle">Matahari</text><path d="M 170 80 Q 200 60 230 80 Q 250 80 250 100 Q 240 115 210 115 Q 180 115 160 105 Z" fill="%2393c5fd" stroke="%233b82f6" stroke-width="2"/><text x="205" y="100" font-size="10" font-weight="bold" fill="%231e3a8a" text-anchor="middle">Kondensasi</text><rect x="0" y="180" width="400" height="60" fill="%2338bdf8"/><text x="200" y="210" font-size="12" font-weight="bold" fill="%23075985" text-anchor="middle">Laut / Danau (Evaporasi Air)</text><text x="200" y="150" font-size="10" fill="%230284c7" text-anchor="middle">Hujan (Presipitasi) ↓↓↓</text></svg>`,
  },
  {
    title: 'Jaring Makanan & Ekosistem',
    caption: 'Bagan rantai makanan: produsen hijau, konsumen tingkat 1, dan pengurai',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23fafaf9" rx="16"/><text x="200" y="32" font-family="sans-serif" font-size="15" font-weight="bold" fill="%2344403c" text-anchor="middle">JARING-JARING MAKANAN</text><rect x="40" y="90" width="80" height="50" rx="8" fill="%23bbf7d0" stroke="%2316a34a" stroke-width="2"/><text x="80" y="120" font-size="11" font-weight="bold" fill="%2314532d" text-anchor="middle">Produsen</text><path d="M 125 115 L 165 115" stroke="%2378716c" stroke-width="3"/><rect x="170" y="90" width="80" height="50" rx="8" fill="%23fed7aa" stroke="%23ea580c" stroke-width="2"/><text x="210" y="120" font-size="11" font-weight="bold" fill="%237c2d12" text-anchor="middle">Konsumen 1</text><path d="M 255 115 L 295 115" stroke="%2378716c" stroke-width="3"/><rect x="300" y="90" width="80" height="50" rx="8" fill="%23fecdd3" stroke="%23e11d48" stroke-width="2"/><text x="340" y="120" font-size="11" font-weight="bold" fill="%23881337" text-anchor="middle">Konsumen 2</text><text x="200" y="210" font-size="10" fill="%2378716c" text-anchor="middle">Bagaimana jika populasi konsumen 1 berkurang drastis?</text></svg>`,
  },
];

// Contextual Quick Inquiries
const QUICK_INQUIRIES = [
  { icon: '💡', label: 'Penerapan Sehari-hari', query: 'Berikan 2 contoh konkret penerapan materi ini dalam kehidupan nyata kita sehari-hari beserta penjelasannya.' },
  { icon: '🔍', label: 'Analogi Sederhana', query: 'Jelaskan konsep inti ini menggunakan analogi yang sangat mudah dipahami untuk siswa SMP.' },
  { icon: '⚠️', label: 'Miskonsepsi Umum', query: 'Apa miskonsepsi atau kesalahan pemahaman yang paling sering dialami siswa pada materi ini, dan bagaimana cara membedakannya?' },
  { icon: '🧩', label: 'Tantangan Masalah (HOTS)', query: 'Berikan satu studi kasus nyata pemecahan masalah (HOTS) yang menantang pemikiran kritis kami!' },
  { icon: '🌱', label: 'Refleksi Makna', query: 'Apa nilai kebermaknaan dan pesan mendalam yang bisa kita pelajari dari materi ini untuk kehidupan?' },
];

interface MediaPembelajaranViewProps {
  profile: TeacherProfile;
  perencanaanList?: Perencanaan[];
  initialSelectedRPPId?: string;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onNavigateToPerencanaan?: () => void;
}

export const MediaPembelajaranView: React.FC<MediaPembelajaranViewProps> = ({
  profile,
  perencanaanList = [],
  initialSelectedRPPId,
  onShowToast,
  onNavigateToPerencanaan,
}) => {
  // Class selection (defaults to profile.kelasAktif or 'VII-A')
  const [filterKelas, setFilterKelas] = useState<string>(profile.kelasAktif || 'VII-A');

  // Filter RPP list based on class if a specific class is selected
  const availableRPPsForClass = perencanaanList.filter((p) => {
    if (!filterKelas || filterKelas === 'Semua') return true;
    return p.identitas.kelas === filterKelas;
  });

  // Selected RPP ID state
  const [selectedRPPId, setSelectedRPPId] = useState<string>(() => {
    if (initialSelectedRPPId && perencanaanList.some((p) => p.id === initialSelectedRPPId)) {
      return initialSelectedRPPId;
    }
    const matched = perencanaanList.find((p) => p.identitas.kelas === (profile.kelasAktif || 'VII-A'));
    return matched ? matched.id : (perencanaanList[0]?.id || '');
  });

  // Current active RPP
  const activeRPP = perencanaanList.find((p) => p.id === selectedRPPId) || perencanaanList[0];

  // Topic and Level state
  const [topikMateri, setTopikMateri] = useState<string>(
    activeRPP?.identitas.topikMateri || 'Klasifikasi Materi dan Perubahannya'
  );
  const [selectedMapel, setSelectedMapel] = useState<string>(
    activeRPP?.identitas.mataPelajaran || profile.mataPelajaran || 'IPA'
  );
  const [selectedKelas, setSelectedKelas] = useState<string>(
    activeRPP?.identitas.kelas || profile.kelasAktif || 'VII-A'
  );
  const [difficultyLevel, setDifficultyLevel] = useState<'dasar' | 'menengah' | 'mahir'>('menengah');

  // Collapsible RPP Details Card
  const [isRPPCardExpanded, setIsRPPCardExpanded] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Input states
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    caption?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Audio Speech state
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const speechControllerRef = useRef<{ stop: () => void } | null>(null);

  // Copy feedback state
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Helper to construct RPP Context
  const getRPPContext = (rpp?: Perencanaan): EduGeniusRPPContext | undefined => {
    if (!rpp) return undefined;
    return {
      rppId: rpp.id,
      topikMateri: rpp.identitas.topikMateri,
      mataPelajaran: rpp.identitas.mataPelajaran,
      kelas: rpp.identitas.kelas,
      fase: rpp.identitas.fase,
      alokasiWaktu: rpp.identitas.alokasiWaktu,
      tujuanPembelajaran: rpp.tujuanPembelajaran?.tujuanPembelajaran || '',
      indikatorKetercapaian: rpp.tujuanPembelajaran?.indikatorKetercapaian || '',
      pemahamanBermakna: rpp.pemahamanBermakna || rpp.prinsipPembelajaranMendalam?.bermakna || '',
      pertanyaanPemantik: rpp.pertanyaanPemantik || rpp.lkpd?.faseMemahami?.pertanyaanEksplorasi || [],
      pengalamanBelajar: {
        memahami: rpp.pengalamanBelajar?.memahami,
        mengaplikasi: rpp.pengalamanBelajar?.mengaplikasi,
        merefleksi: rpp.pengalamanBelajar?.merefleksi,
      },
      rencanaAsesmen: {
        asesmenAwal: rpp.rencanaAsesmen?.asesmenAwal,
        asesmenProses: rpp.rencanaAsesmen?.asesmenProses,
        asesmenAkhir: rpp.rencanaAsesmen?.asesmenAkhir,
      },
      profilLulusan: rpp.identifikasi?.dimensiProfilLulusan || [],
    };
  };

  // Helper to build initial welcome message for selected RPP
  const buildInitialMessage = (rpp?: Perencanaan, kelasTarget?: string, lvl?: 'dasar' | 'menengah' | 'mahir'): EduGeniusMessage => {
    const activeLevel = lvl || difficultyLevel;
    const kelasDisplay = rpp?.identitas.kelas || kelasTarget || selectedKelas || 'VII';

    if (rpp) {
      const tp = rpp.tujuanPembelajaran?.tujuanPembelajaran || 'Memahami materi pokok secara mendalam dan berkesadaran';
      const pemantik = rpp.pertanyaanPemantik?.[0] || rpp.lkpd?.faseMemahami?.pertanyaanEksplorasi?.[0] || 'Mengapa materi ini sangat penting dalam kehidupan nyata kita?';
      const topik = rpp.identitas.topikMateri;

      return {
        id: 'welcome-rpp-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        audioIntonation: '(dengan nada ceria dan penuh semangat)',
        text: `Halo sahabat hebat **Kelas ${kelasDisplay}**! Saya **EduGenius**, teman belajar dan tutor sokratik interaktifmu hari ini! 🌟\n\nKita belajar berpedoman pada Modul Ajar **"${rpp.judul}"** (${rpp.identitas.mataPelajaran} • Pertemuan ke-${rpp.identitas.pertemuanKe || 1}).\n\n🎯 **Tujuan Pembelajaran yang Akan Kita Capai:**\n"${tp}"\n\n🔍 **Pertanyaan Pemantik dari Modul Ajar:**\n*"${pemantik}"*\n\nKamu bisa bertanya hal yang membuatmu penasaran, menguji pemahaman konsep, atau **mengunggah foto/diagram** tugas untuk kita bedah bersama!`,
        visualRecommendation: {
          title: `Peta Eksplorasi: ${topik}`,
          description: `Diagram visual alur Pembelajaran Mendalam untuk topik ${topik} di Kelas ${kelasDisplay}`,
          promptText: `Infografik edukatif diagram alir modern bersih tentang ${topik} untuk siswa SMP Kelas ${kelasDisplay} gaya flat vector beresolusi tinggi`,
        },
        interactiveElement: {
          type: 'scenarios',
          questionOrPrompt: 'Pilih langkah petualangan belajarmu hari ini:',
          options: [
            { id: '1', label: `1. Eksplorasi Fenomena Nyata & Analogi (Tahap Memahami)` },
            { id: '2', label: `2. Pecahkan Masalah & Kasus Aplikatif (Tahap Mengaplikasi)` },
            { id: '3', label: `3. Uji Pemahaman Lewat Kuis Pemantik (Tahap Merefleksi)` },
          ],
        },
        difficultyLevel: activeLevel,
      };
    }

    return {
      id: 'welcome-edugenius',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      audioIntonation: '(dengan nada ceria dan menyemangati)',
      text: `Halo sahabat hebat **Kelas ${kelasDisplay}**! Saya **EduGenius**, tutor sokratik interaktifmu hari ini! 🌟\n\nKita akan menjelajahi materi **${topikMateri}** bersama. Kamu bisa bertanya konsep yang membuatmu penasaran, atau **unggah foto/diagram** pelajaran yang ingin kita bedah bersama!\n\nMau mulai dari fenomena menarik apa hari ini?`,
      visualRecommendation: {
        title: 'Peta Eksplorasi Konsep',
        description: 'Bagan konsep interaktif bercabang dengan ikon visual ramah siswa',
        promptText: `Infografik peta konsep edukatif modern berwarna pastel cerah tentang ${topikMateri} untuk siswa SMP Kelas ${kelasDisplay}`,
      },
      interactiveElement: {
        type: 'scenarios',
        questionOrPrompt: 'Pilih langkah awal yang paling membuatmu penasaran:',
        options: [
          { id: '1', label: '1. Amati contoh nyata di sekitar kita dahulu' },
          { id: '2', label: '2. Bedah satu diagram fenomena dengan kuis tantangan' },
          { id: '3', label: '3. Langsung tanyakan bagian materi yang belum saya mengerti' },
        ],
      },
      difficultyLevel: activeLevel,
    };
  };

  // Messages in session
  const [messages, setMessages] = useState<EduGeniusMessage[]>(() => [
    buildInitialMessage(activeRPP, activeRPP?.identitas.kelas || profile.kelasAktif),
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
      }
    };
  }, []);

  // When initialSelectedRPPId or parent updates
  useEffect(() => {
    if (initialSelectedRPPId && initialSelectedRPPId !== selectedRPPId) {
      const plan = perencanaanList.find((p) => p.id === initialSelectedRPPId);
      if (plan) {
        handleApplyRPP(plan, true);
      }
    }
  }, [initialSelectedRPPId]);

  // Function to apply a new RPP and reset/sync conversation
  const handleApplyRPP = (plan: Perencanaan, isAuto = false) => {
    setSelectedRPPId(plan.id);
    setSelectedKelas(plan.identitas.kelas);
    setSelectedMapel(plan.identitas.mataPelajaran);
    setTopikMateri(plan.identitas.topikMateri);
    setFilterKelas(plan.identitas.kelas);

    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
    }
    setActiveSpeakingMsgId(null);

    const initialMsg = buildInitialMessage(plan, plan.identitas.kelas, difficultyLevel);
    setMessages([initialMsg]);

    if (!isAuto) {
      onShowToast(
        'success',
        `EduGenius disinkronkan dengan Modul Ajar: "${plan.identitas.topikMateri}" (Kelas ${plan.identitas.kelas})`
      );
    }
  };

  // Text-to-Speech handler
  const handleToggleSpeech = (msg: EduGeniusMessage) => {
    if (activeSpeakingMsgId === msg.id) {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
      }
      setActiveSpeakingMsgId(null);
      return;
    }

    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
    }

    setActiveSpeakingMsgId(msg.id);
    const controller = speakEduGeniusText(msg.text, {
      rate: speechSpeed,
      onEnd: () => setActiveSpeakingMsgId(null),
      onError: () => setActiveSpeakingMsgId(null),
    });
    speechControllerRef.current = controller;
  };

  // Web Speech API Voice Recognition
  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast('info', 'Peramban Anda belum mendukung input suara langsung. Silakan gunakan teks.');
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);
      onShowToast('info', 'Mendengarkan suara... Silakan berbicara dalam bahasa Indonesia.');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          onShowToast('success', 'Suara berhasil terekam!');
        }
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (e) {
      setIsListeningVoice(false);
    }
  };

  // Image Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('error', 'Harap pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('error', 'Ukuran gambar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage({
        data: result,
        mimeType: file.type,
        caption: file.name,
      });
      onShowToast('success', `Gambar "${file.name}" berhasil dimuat.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick diagram selection
  const handleSelectSampleDiagram = (sample: (typeof SAMPLE_DIAGRAMS)[0]) => {
    setSelectedImage({
      data: sample.dataUrl,
      mimeType: 'image/svg+xml',
      caption: sample.title,
    });
    setInputText(`Saya ingin membedah ${sample.title} untuk materi ${topikMateri} Kelas ${selectedKelas}.`);
    onShowToast('info', `Diagram "${sample.title}" siap dianalisis EduGenius.`);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !selectedImage) return;

    const userMsg: EduGeniusMessage = {
      id: 'usr_' + Date.now().toString(36),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      text: query || 'Menganalisis diagram terlampir...',
      image: selectedImage
        ? {
            url: selectedImage.data,
            mimeType: selectedImage.mimeType,
            caption: selectedImage.caption,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const rppContextData = getRPPContext(activeRPP);

      const sessionData: EduGeniusSession = {
        id: 'session-main-' + (activeRPP?.id || 'custom'),
        mapel: selectedMapel,
        kelas: selectedKelas,
        topik: topikMateri,
        level: difficultyLevel,
        rppContext: rppContextData,
        messages: [...messages, userMsg],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const aiReply = await sendEduGeniusMessage({
        session: sessionData,
        userText: query,
        userImage: imagePayload || undefined,
        difficultyLevel,
      });

      // Update difficulty level adaptively if EduGenius changed it
      if (aiReply.difficultyLevel && aiReply.difficultyLevel !== difficultyLevel) {
        setDifficultyLevel(aiReply.difficultyLevel);
      }

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      onShowToast('error', 'Gagal memproses pesan EduGenius.');
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive Quiz / Scenario selection handler
  const handleOptionSelect = (msgId: string, optionId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, selectedOptionId: optionId } : m))
    );
  };

  // Submit selected quiz answer to EduGenius
  const handleConfirmQuizAnswer = (
    option: EduGeniusInteractiveOption
  ) => {
    if (option.isCorrect) {
      onShowToast('success', 'Hebat! Jawabanmu tepat sekali! 🎉');
      handleSendMessage(`Jawaban saya: ${option.label}. Mengapa prinsip ini tepat sesuai Modul Ajar?`);
    } else {
      onShowToast('info', 'EduGenius memberikan petunjuk baru.');
      handleSendMessage(`Saya memilih: ${option.label}. Mohon berikan petunjuk tambahan agar saya lebih paham.`);
    }
  };

  // Copy AI Prompt
  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    onShowToast('success', 'Prompt gambar AI disalin ke clipboard!');
    setTimeout(() => setCopiedPromptId(null), 3000);
  };

  // Reset Session
  const handleResetSession = () => {
    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
    }
    setActiveSpeakingMsgId(null);
    setMessages([buildInitialMessage(activeRPP, selectedKelas, difficultyLevel)]);
    onShowToast('info', 'Sesi pembelajaran EduGenius disegarkan kembali sesuai RPP aktif.');
  };

  // Export Learning Session as PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    onShowToast('info', 'Sedang menyusun Notula Belajar Sokratik ke format PDF...');
    try {
      const filename = `Notula_EduGenius_${(activeRPP?.identitas.topikMateri || topikMateri).replace(/[^a-zA-Z0-9]/g, '_')}_Kelas_${selectedKelas}.pdf`;
      await downloadElementAsPDF('edugenius-session-printable', filename, {
        title: `Notula Belajar Sokratik EduGenius - ${activeRPP?.identitas.topikMateri || topikMateri}`,
      });
      onShowToast('success', 'Notula Belajar EduGenius berhasil diunduh!');
    } catch (e: any) {
      onShowToast('error', 'Gagal mengunduh berkas PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print Learning Session Directly
  const handlePrintSession = () => {
    printElementDirectly(
      'edugenius-session-printable',
      `Notula_EduGenius_${activeRPP?.identitas.topikMateri || topikMateri}_Kelas_${selectedKelas}`
    );
  };

  // List of all classes available in profile
  const classOptions = profile.kelasList && profile.kelasList.length > 0
    ? profile.kelasList
    : ['VII-A', 'VII-B', 'VIII-A', 'IX-A'];

  return (
    <div className="space-y-4" id="media-pembelajaran-container">
      {/* Top Banner & Context Controls */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 shadow-md shrink-0 ring-2 ring-amber-300/50">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  EduGenius • Tutor Sokratik Multimodal
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Tersinkron RPP / RPM
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Kelas {selectedKelas} • Fase D
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
                Pendamping belajar interaktif siswa yang terhubung langsung dengan dokumen RPP/RPM di aplikasi:
                menganalisis visual mendalam, bersuara alami (TTS), serta memandu ketercapaian Tujuan Pembelajaran secara bertahap.
              </p>
            </div>
          </div>

          {/* Quick Context & Level Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-indigo-800/40">
            {/* Level Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-semibold text-indigo-300">Level:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
                {(['dasar', 'menengah', 'mahir'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setDifficultyLevel(lvl);
                      onShowToast('info', `Tingkat tantangan diatur ke: ${lvl.toUpperCase()}`);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                      difficultyLevel === lvl
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Speed */}
            <div className="flex items-center space-x-1.5 border-l border-slate-700 pl-2">
              <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
              <select
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="text-[11px] bg-slate-800 text-slate-200 rounded px-1.5 py-1 border border-slate-700 focus:outline-hidden"
                title="Kecepatan Suara Text-to-Speech"
              >
                <option value="0.85">0.85x (Lambat)</option>
                <option value="1.0">1.0x (Normal)</option>
                <option value="1.15">1.15x (Cepat)</option>
              </select>
            </div>

            {/* Print & PDF Actions */}
            <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
              <button
                type="button"
                onClick={handlePrintSession}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                title="Cetak Sesi Sokratik Ini"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="p-1.5 text-indigo-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
                title="Unduh Notula Belajar Sokratik (PDF)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Session */}
            <button
              type="button"
              onClick={handleResetSession}
              className="p-1.5 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 ml-1"
              title="Segarkan Sesi EduGenius sesuai RPP Aktif"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Controls: Class Filter & RPP Selector */}
        <div className="mt-4 pt-3 border-t border-indigo-900/60 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Class Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>Pilih Kelas Sasaran:</span>
            </label>
            <select
              value={filterKelas}
              onChange={(e) => {
                const newKelas = e.target.value;
                setFilterKelas(newKelas);
                setSelectedKelas(newKelas === 'Semua' ? (profile.kelasAktif || 'VII-A') : newKelas);
                // If there's an RPP matching this class, select it
                const match = perencanaanList.find((p) => newKelas === 'Semua' || p.identitas.kelas === newKelas);
                if (match) {
                  handleApplyRPP(match);
                } else {
                  onShowToast('info', `Menyesuaikan gaya bahasa EduGenius untuk Kelas ${newKelas}`);
                }
              }}
              className="w-full bg-slate-900/90 text-white border border-indigo-700/70 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-hidden"
            >
              <option value="Semua">Semua Kelas</option>
              {classOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          {/* RPP Selector */}
          <div className="md:col-span-7">
            <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center space-x-1">
              <FileText className="w-3 h-3 text-amber-400" />
              <span>Modul Ajar / RPP Acuan yang Telah Dibuat:</span>
            </label>
            {perencanaanList.length > 0 ? (
              <select
                value={selectedRPPId}
                onChange={(e) => {
                  const plan = perencanaanList.find((p) => p.id === e.target.value);
                  if (plan) {
                    handleApplyRPP(plan);
                  }
                }}
                className="w-full bg-slate-900/90 text-amber-200 border border-indigo-700/70 rounded-lg px-2.5 py-2 text-xs font-medium focus:ring-1 focus:ring-amber-400 focus:outline-hidden"
              >
                {availableRPPsForClass.length > 0 ? (
                  availableRPPsForClass.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.identitas.kelas}] {p.identitas.topikMateri} • {p.identitas.mataPelajaran} (P.{p.identitas.pertemuanKe || 1})
                    </option>
                  ))
                ) : (
                  perencanaanList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.identitas.kelas}] {p.identitas.topikMateri} • {p.identitas.mataPelajaran} (P.{p.identitas.pertemuanKe || 1})
                    </option>
                  ))
                )}
              </select>
            ) : (
              <div className="text-[11px] text-amber-300/80 bg-slate-900/80 px-3 py-2 rounded-lg border border-amber-500/30">
                Belum ada RPP tersimpan. Menggunakan topik standar: {topikMateri}.
              </div>
            )}
          </div>

          {/* Action to Toggle Detail Card */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={() => setIsRPPCardExpanded(!isRPPCardExpanded)}
              className="w-full py-2 px-3 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors border border-indigo-600/50"
            >
              <span>Rincian RPP</span>
              {isRPPCardExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible RPP Details Card */}
        {isRPPCardExpanded && activeRPP && (
          <div className="mt-3 p-3.5 bg-slate-950/70 border border-indigo-800/80 rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900 pb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs">{activeRPP.judul}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 text-[10px] font-semibold border border-indigo-700">
                Alokasi Waktu: {activeRPP.identitas.alokasiWaktu || '2 x 40 Menit'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
                  Tujuan Pembelajaran (TP):
                </span>
                <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  {activeRPP.tujuanPembelajaran?.tujuanPembelajaran || '-'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
                  Pertanyaan Pemantik Modul:
                </span>
                <div className="text-[11px] text-amber-200/90 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                  {activeRPP.pertanyaanPemantik && activeRPP.pertanyaanPemantik.length > 0 ? (
                    activeRPP.pertanyaanPemantik.map((q: string, i: number) => (
                      <div key={i} className="flex items-start space-x-1">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{q}</span>
                      </div>
                    ))
                  ) : activeRPP.lkpd?.faseMemahami?.pertanyaanEksplorasi && activeRPP.lkpd.faseMemahami.pertanyaanEksplorasi.length > 0 ? (
                    activeRPP.lkpd.faseMemahami.pertanyaanEksplorasi.map((q: string, i: number) => (
                      <div key={i} className="flex items-start space-x-1">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{q}</span>
                      </div>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Deep Learning 3 Phase Preview */}
            <div className="pt-2 border-t border-indigo-900/60 flex flex-wrap items-center justify-between text-[11px] text-indigo-300">
              <div className="flex items-center space-x-3">
                <span>⚡ <strong>Memahami:</strong> Eksplorasi Konseptual</span>
                <span>•</span>
                <span>🛠️ <strong>Mengaplikasi:</strong> Investigasi Kasus</span>
                <span>•</span>
                <span>🌱 <strong>Merefleksi:</strong> Makna & Komitmen</span>
              </div>
              {onNavigateToPerencanaan && (
                <button
                  type="button"
                  onClick={onNavigateToPerencanaan}
                  className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1 underline text-[11px]"
                >
                  <span>Buka di Menu 1. Perencanaan</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat and Interactive Media Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream (Printable Area) */}
        <div id="edugenius-session-printable" className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/40">
          {/* Header visible when printing or exporting PDF */}
          <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900 text-center">
            <h1 className="text-base font-bold text-slate-900 uppercase">
              NOTULA PEMBELAJARAN SOKRATIK • EDUGENIUS AI TUTOR
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Modul Ajar: {activeRPP?.identitas.topikMateri || topikMateri} | Mata Pelajaran: {selectedMapel} | Kelas: {selectedKelas} | Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </p>
          </div>

          {messages.map((msg) => {
            const isEduGenius = msg.sender === 'assistant';
            const isPlayingThis = activeSpeakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-3xl ${
                  isEduGenius ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs ${
                    isEduGenius
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white ring-2 ring-indigo-200'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isEduGenius ? <Sparkles className="w-5 h-5 text-amber-300" /> : 'Siswa'}
                </div>

                {/* Message Bubble Container */}
                <div className={`space-y-2.5 max-w-full ${isEduGenius ? 'text-left' : 'text-right'}`}>
                  {/* Sender Name & Meta */}
                  <div
                    className={`flex items-center gap-2 text-[11px] text-slate-500 ${
                      isEduGenius ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span className="font-bold text-slate-800">
                      {isEduGenius ? 'EduGenius (Tutor Sokratik)' : `Siswa (${selectedKelas})`}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>

                    {msg.difficultyLevel && (
                      <span className="capitalize px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[10px]">
                        Level {msg.difficultyLevel}
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`p-4 rounded-2xl shadow-2xs text-xs sm:text-sm leading-relaxed transition-all ${
                      isEduGenius
                        ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                        : 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {/* User Uploaded Image Preview */}
                    {msg.image && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-indigo-200 bg-slate-900/5">
                        <img
                          src={msg.image.url}
                          alt={msg.image.caption || 'Gambar Siswa'}
                          className="w-full max-h-64 object-contain rounded-lg bg-white"
                        />
                        {msg.image.caption && (
                          <div className="p-2 text-[11px] text-slate-600 bg-slate-100 border-t border-slate-200">
                            📎 {msg.image.caption}
                          </div>
                        )}
                      </div>
                    )}

                    {/* EduGenius Audio Intonation Indicator */}
                    {msg.audioIntonation && (
                      <div className="mb-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium shadow-2xs">
                        <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{msg.audioIntonation}</span>
                      </div>
                    )}

                    {/* Text Body */}
                    <div className="whitespace-pre-line space-y-2">
                      {msg.text}
                    </div>

                    {/* Visual Recommendation Card */}
                    {msg.visualRecommendation && (
                      <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-slate-800">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center space-x-1.5 text-sky-800 font-bold text-xs">
                            <ImageIcon className="w-4 h-4 text-sky-600" />
                            <span>Rekomendasi Visual: {msg.visualRecommendation.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPrompt(
                                msg.visualRecommendation!.promptText,
                                msg.id + '-prompt'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 text-sky-700 text-[10px] font-bold border border-sky-300 flex items-center space-x-1 transition-colors shadow-2xs print:hidden"
                            title="Salin Prompt ke Generator Gambar (Imagen / Canva)"
                          >
                            {copiedPromptId === msg.id + '-prompt' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-600" />
                                <span>Salin Prompt AI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                          {msg.visualRecommendation.description}
                        </p>
                        <div className="bg-white/80 p-2 rounded-lg border border-sky-100 text-[10px] text-slate-500 font-mono select-all">
                          Prompt: &quot;{msg.visualRecommendation.promptText}&quot;
                        </div>
                      </div>
                    )}

                    {/* Interactive Socratic Elements (Quiz / Scenarios) */}
                    {msg.interactiveElement && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                          {msg.interactiveElement.type === 'quiz' ? (
                            <>
                              <HelpCircle className="w-4 h-4 text-amber-500" />
                              <span>Pertanyaan Pemantik (Uji Ketercapaian Tujuan Pembelajaran):</span>
                            </>
                          ) : (
                            <>
                              <Compass className="w-4 h-4 text-indigo-600" />
                              <span>Percabangan Skenario (Alur Pembelajaran Mendalam):</span>
                            </>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-700">
                          {msg.interactiveElement.questionOrPrompt}
                        </p>

                        {/* Options List */}
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {msg.interactiveElement.options.map((option) => {
                            const isSelected = msg.selectedOptionId === option.id;
                            const isQuiz = msg.interactiveElement?.type === 'quiz';

                            return (
                              <div key={option.id} className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOptionSelect(msg.id, option.id);
                                    if (!isQuiz) {
                                      // Direct scenario routing
                                      handleSendMessage(`Saya memilih langkah: ${option.label}`);
                                    }
                                  }}
                                  className={`w-full p-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-start space-x-2 border ${
                                    isSelected
                                      ? isQuiz
                                        ? option.isCorrect
                                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300'
                                          : 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300'
                                        : 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-300'
                                      : 'bg-white hover:bg-indigo-50/70 border-slate-200 text-slate-800 hover:border-indigo-300 shadow-2xs hover:scale-[1.01]'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                      isSelected
                                        ? isQuiz && option.isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {option.id}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{option.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                </button>

                                {/* Immediate Socratic Feedback for Quiz option */}
                                {isQuiz && isSelected && (
                                  <div
                                    className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start justify-between gap-2 animate-in fade-in duration-200 ${
                                      option.isCorrect
                                        ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                                        : 'bg-amber-100/80 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    <div className="flex items-start space-x-1.5">
                                      {option.isCorrect ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                      )}
                                      <div>
                                        <span className="font-bold">
                                          {option.isCorrect ? 'Jawaban Benar! 🎉' : 'Kurang tepat.'}
                                        </span>{' '}
                                        {option.explanation ? (
                                          <span>💡 {option.explanation}</span>
                                        ) : (
                                          <span>Perhatikan kembali hubungan sebab-akibat pada konsep materi ini.</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action to confirm and ask EduGenius */}
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmQuizAnswer(option)}
                                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-md font-bold text-[10px] shadow-2xs border border-slate-300 shrink-0"
                                    >
                                      Bahas Jawaban
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Audio TTS Toolbar on EduGenius responses */}
                    {isEduGenius && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 print:hidden">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSpeech(msg)}
                            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
                              isPlayingThis
                                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Dengarkan suara EduGenius (Text-to-Speech)"
                          >
                            {isPlayingThis ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                                <span>Hentikan Suara</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Dengarkan (TTS)</span>
                              </>
                            )}
                          </button>

                          {isPlayingThis && (
                            <span className="flex items-center space-x-0.5 text-amber-600 font-medium">
                              <span className="w-1 h-3 bg-amber-500 animate-pulse rounded"></span>
                              <span className="w-1 h-4 bg-amber-500 animate-pulse delay-75 rounded"></span>
                              <span className="w-1 h-2 bg-amber-500 animate-pulse delay-150 rounded"></span>
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400">
                          Sesuai RPP: {activeRPP?.identitas.topikMateri || topikMateri} (Kelas {selectedKelas})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Thinking Loader */}
          {isLoading && (
            <div className="flex items-start gap-3 max-w-xl mr-auto print:hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center space-x-2 text-xs text-slate-500">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-100"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-200"></span>
                </div>
                <span>EduGenius sedang menganalisis & merancang pertanyaan pemantik sesuai RPP...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Preview Bar before sending */}
        {selectedImage && (
          <div className="p-3 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={selectedImage.data}
                alt="Pratinjau Unggahan"
                className="w-12 h-12 rounded-lg object-contain bg-white border border-indigo-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-indigo-900 truncate">
                  {selectedImage.caption || 'Foto/Diagram yang diunggah'}
                </p>
                <p className="text-[11px] text-indigo-600">
                  EduGenius akan melakukan analisis visual & mendeteksi miskonsepsi sesuai TP RPP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors shrink-0"
              title="Batalkan Unggahan Gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contextual Quick Inquiries Bar */}
        <div className="px-4 py-2 bg-indigo-50/40 border-t border-indigo-100/70 flex items-center gap-1.5 overflow-x-auto text-[11px] print:hidden">
          <span className="font-bold text-indigo-900 shrink-0 flex items-center space-x-1 mr-1">
            <span>Pantik Diskusi:</span>
          </span>
          {QUICK_INQUIRIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.query)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-800 text-[10px] font-semibold transition-all shrink-0 shadow-2xs flex items-center space-x-1"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Sample Diagrams Bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex flex-wrap items-center gap-2 text-[11px] print:hidden">
          <span className="font-bold text-slate-600 flex items-center space-x-1 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Contoh Diagram Materi (1-Klik):</span>
          </span>
          {SAMPLE_DIAGRAMS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSampleDiagram(sample)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-[10px] font-semibold transition-colors flex items-center space-x-1 shadow-2xs"
            >
              <ImageIcon className="w-3 h-3 text-indigo-600" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>

        {/* Input Bar: Text, Upload, Voice, Send */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-end gap-2 print:hidden">
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200 shrink-0"
            title="Unggah Foto / Diagram Pelajaran"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-xl transition-colors border shrink-0 ${
              isListeningVoice
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-md'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200'
            }`}
            title={isListeningVoice ? 'Sedang mendengarkan... klik untuk selesai' : 'Gunakan Input Suara (Mikrofon)'}
          >
            {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder={`Tulis pertanyaan, jawaban kuis, atau ide penyelidikan untuk ${activeRPP?.identitas.topikMateri || topikMateri} (Kelas ${selectedKelas})...`}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
};
