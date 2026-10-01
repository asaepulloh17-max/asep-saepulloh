import {
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  PesertaDidik,
  RencanaAsesmenItem,
  NilaiSiswa,
  TindakLanjutData,
  RefleksiEvaluasiData,
  MediaRecord,
} from '../types';

export const initialTeacherProfile: TeacherProfile = {
  id: 'prof-1',
  namaGuru: 'Asep Fajar Pratama, S.Pd., Gr.',
  nip: '19880512 201101 1 008',
  namaSekolah: 'SMP Negeri 1 Nusantara',
  npsn: '20104523',
  mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
  fase: 'Fase D (SMP/MTs)',
  kelasList: ['VII-A', 'VII-B', 'VII-C', 'VIII-A'],
  kelasAktif: 'VII-A',
  semesterAktif: 'Ganjil',
  tahunPelajaran: '2025/2026',
  alokasiWaktuDefault: '2 x 40 menit (1 Pertemuan)',
  kktpDefault: 75,
  alamatSekolah: 'Jl. Pendidikan Karakter Bangsa No. 45, Jakarta Selatan',
  kepalaSekolah: {
    nama: 'Drs. H. Mulyadi, M.Pd.',
    nip: '19690315 199412 1 002',
  },
  logoSekolahUrl: '',
  updatedAt: new Date().toISOString(),
};

export const demoPerencanaanList: Perencanaan[] = [
  {
    id: 'plan-demo-1',
    judul: 'Klasifikasi Makhluk Hidup & Keanekaragaman Hayati',
    status: 'Selesai',
    isDemo: true,
    identitas: {
      namaSekolah: 'SMP Negeri 1 Nusantara',
      mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
      fase: 'Fase D',
      kelas: 'VII-A',
      semester: 'Ganjil',
      tahunPelajaran: '2025/2026',
      alokasiWaktu: '2 JP (2 x 40 menit)',
      topikMateri: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
      pertemuanKe: 1,
    },
    identifikasi: {
      kesiapanAwal: 'Sebagian besar peserta didik telah dapat membedakan benda mati dan makhluk hidup secara kasat mata, namun belum memahami tingkatan organisasi kehidupan dan taksonomi sederhana.',
      karakteristikMateri: 'Konseptual berbasis observasi konkret di lingkungan sekolah, memerlukan keterampilan pengamatan mikroskopis/makroskopis dan penalaran deduktif.',
      kebutuhanBelajar: 'Kelompok visual difasilitasi kartu determinasi bergambar; kelompok kinestetik difasilitasi eksplorasi langsung ke taman sekolah.',
      dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'],
    },
    tujuanPembelajaran: {
      capaianPembelajaran: 'Peserta didik dapat mengidentifikasi sifat dan karakteristik zat, membedakan perubahan fisik dan kimia serta memisahkan campuran sederhana; mendeskripsikan atom dan senyawa serta mengklasifikasi makhluk hidup berdasarkan karakteristiknya.',
      tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen tumbuhan dan hewan sederhana melalui kunci determinasi sederhana dengan bernalar kritis.',
      lingkupMateri: 'Ciri-ciri kehidupan, kunci dikotomi, dan binomial nomenklatur.',
      indikatorKetercapaian: '1) Menyebutkan minimal 5 ciri makhluk hidup dengan tepat. 2) Menggunakan kunci determinasi format tabel sederhana untuk mengklasifikasikan 4 spesimen daun lokal.',
    },
    desainPembelajaran: {
      praktikPedagogis: 'Pembelajaran Berbasis Penemuan (Discovery Learning) & Eksplorasi Lingkungan Nyata.',
      kemitraanPembelajaran: 'Diskusi kelompok kolaboratif sebaya dan narasumber pengelola kebun sekolah.',
      lingkunganPembelajaran: 'Ruang kelas fleksibel dan Laboratorium Terbuka/Taman Botani Sekolah.',
      pemanfaatanDigital: 'Identifikasi spesimen menggunakan aplikasi ensiklopedia flora online dan kuis interaktif formatif.',
      modelMetode: 'Observasi terbimbing, diskusi kelompok, pemecahan masalah sederhana.',
      sumberBelajar: 'Buku IPA Kelas VII Kemendikbudristek, spesimen tumbuhan taman sekolah, LKPD observasi mandiri.',
    },
    kerangkaPembelajaran: {
      praktikPedagogis: 'Pembelajaran Berbasis Penemuan (Discovery Learning) & Eksplorasi Lingkungan Nyata.',
      kemitraanPembelajaran: 'Diskusi kelompok kolaboratif sebaya dan narasumber pengelola kebun sekolah.',
      lingkunganPembelajaran: 'Ruang kelas fleksibel dan Laboratorium Terbuka/Taman Botani Sekolah.',
      pemanfaatanDigital: 'Identifikasi spesimen menggunakan aplikasi ensiklopedia flora online dan kuis interaktif formatif.',
      modelMetode: 'Observasi terbimbing, diskusi kelompok, pemecahan masalah sederhana.',
      sumberBelajar: 'Buku IPA Kelas VII Kemendikbudristek, spesimen tumbuhan taman sekolah, LKPD observasi mandiri.',
    },
    pengalamanBelajar: {
      memahami: 'Peserta didik mengamati perbedaan tanaman paku, lumut, dan monokotil/dikotil serta mendiskusikan kriteria pembedanya secara bernalar kritis.',
      mengaplikasi: 'Peserta didik bekerja dalam tim mempraktikkan kunci determinasi sederhana pada sampel daun yang dikumpulkan dari pekarangan sekolah.',
      merefleksi: 'Peserta didik menyimpulkan peran keanekaragaman hayati bagi keseimbangan ekosistem dan mengaitkannya dengan tanggung jawab menjaga lingkungan hidup.',
    },
    prinsipPembelajaranMendalam: {
      berkesadaran: 'Mengawali pertemuan dengan latihan jeda bernapas sadar (mindful check-in) dan menyadari keindahan keteraturan ciptaan Tuhan di alam sekitar.',
      bermakna: 'Menghubungkan konsep klasifikasi dengan pemilihan tanaman obat keluarga (TOGA) yang ada di pekarangan rumah peserta didik.',
      menggembirakan: 'Game tebak kunci dikotomi "Detektif Hayati" secara interaktif berkelompok dengan kartu petunjuk berwarna.',
    },
    rencanaKegiatan: {
      durasiPendahuluan: '10 menit',
      pendahuluan: '1. Guru menyapa, berdoa bersama, dan presensi berkesadaran.\n2. Ice-breaking pemusatan fokus: mengamati dua foto (batu vs kecambah).\n3. Menyampaikan tujuan pembelajaran dan manfaat praktis materi dalam kehidupan.',
      durasiInti: '60 menit',
      kegiatanInti: '1. Memahami: Guru memandu eksplorasi karakteristik makhluk hidup lewat video singkat dan diskusi terarah (15 menit).\n2. Mengaplikasi: Siswa dibagi menjadi kelompok 4 orang, menerima LKPD "Detektif Hayati", lalu mengamati 3 spesimen daun di taman sekolah menggunakan kunci determinasi (35 menit).\n3. Guru berkeliling memberikan scaffolding bagi kelompok yang membutuhkan pendampingan.\n4. Perwakilan kelompok mempresentasikan temuan klasifikasinya (10 menit).',
      durasiPenutup: '10 menit',
      penutup: '1. Merefleksi: Guru dan siswa membuat simpulan bersama tentang prinsip klasifikasi.\n2. Siswa mengisi tiket keluar (exit ticket) 1 hal baru yang dipahami dan 1 pertanyaan yang masih belum terjawab.\n3. Doa penutup dan salam.',
    },
    rencanaAsesmen: {
      asesmenAwal: 'Tanya jawab diagnostik singkat: "Apa bedanya air sungai dengan jentik nyamuk yang berenang di dalamnya?"',
      asesmenProses: 'Observasi rubrik unjuk kerja saat menggunakan kunci determinasi dan lembar keaktifan diskusi kelompok.',
      asesmenAkhir: 'Kuis formatif akhir berupa 5 butir soal pilihan ganda beralasan dan 1 soal analisis kunci dikotomi.',
      teknikAsesmen: 'Observasi kinerja dan tes tertulis.',
      instrumenAsesmen: 'Rubrik penilaian kinerja dan lembar tes objektif.',
      kriteriaKetercapaian: 'Peserta didik tuntas jika mampu mengklasifikasikan minimal 3 dari 4 spesimen dengan urutan kunci determinasi yang benar (Skor minimal 75).',
    },
    lkpd: {
      id: 'lkpd-demo-1',
      perencanaId: 'plan-demo-1',
      judulLKPD: 'Lembar Kerja Peserta Didik (LKPD): Detektif Hayati & Kunci Determinasi',
      topikMateri: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
      alokasiWaktu: '2 JP (2 x 40 menit)',
      petunjukUmum: '1. Bentuk kelompok heterogen beranggotakan 4 orang dan bagi tugas: Ketua Peneliti, Pengamat Spesimen, Notulen Analisis, dan Juru Bicara.\n2. Berdoa sebelum memulai aktivitas dan patuhi keselamatan saat mengamati tanaman di taman sekolah.\n3. Diskusikan setiap langkah dengan santun, saling menghargai, dan gunakan penalaran kritis.',
      aktivitasMindfulAwal: 'Jeda Hening Sadar (Mindful Breathing): Duduk tegak rileks, pejamkan mata sejenak, hirup napas dalam 4 detik, rasakan udara sejuk masuk, hembuskan perlahan 4 detik. Sadari bahwa alam sekitar kita dipenuhi keajaiban keanekaragaman ciptaan Tuhan yang saling terhubung.',
      faseMemahami: {
        stimulusWacana: 'Di taman sekolah, terdapat ratusan jenis tumbuhan dengan bentuk daun, batang, dan bunga yang berbeda-beda. Suatu hari, petugas kebersihan sekolah menemukan beberapa jenis daun tanaman yang belum diketahui namanya dan berpotensi menjadi tanaman obat herbal atau sebaliknya beracun jika disentuh sembarangan. Mengapa para ahli biologi perlu mengelompokkan makhluk hidup? Bagaimana cara kita mengenali identitas suatu organisme tanpa harus menghafal ribuan nama latin?',
        pertanyaanEksplorasi: [
          'Berdasarkan wacana di atas, apa manfaat praktis dilakukannya klasifikasi makhluk hidup bagi manusia dan lingkungan sekitar?',
          'Karakteristik fisik apa saja dari tumbuhan yang paling mudah diamati secara kasat mata untuk membedakan satu jenis dengan jenis lainnya?',
          'Tuliskan hipotesis tim Anda tentang prinsip kerja kunci determinasi / dikotomi!'
        ]
      },
      faseMengaplikasi: {
        langkahKerja: [
          'Ambil 3 spesimen daun yang berbeda yang telah disediakan guru / diambil di taman sekolah (Spesimen A, B, dan C).',
          'Amati bentuk tulang daun (menyirip, menjari, sejajar, atau melengkung), tepi daun (rata atau bergerigi), serta jenis daun (tunggal atau majemuk).',
          'Cocokkan ciri-ciri spesimen dengan bagan kunci determinasi format 1a-1b, 2a-2b dst.',
          'Tuliskan nomor urut kunci determinasi dan tentukan taksonomi/famili tanaman tersebut pada Tabel Pengamatan.',
          'Diskusikan pertanyaan pemecahan masalah bersama anggota kelompok.'
        ],
        alatBahan: [
          '3 Spesimen daun (Mangga/Jambu, Pepaya/Singkong, Jagung/Rumput)',
          'Kaca pembesar (lup) dan penggaris',
          'Bagan Kunci Determinasi Sederhana',
          'LKPD dan alat tulis kelompok'
        ],
        tabelPengamatan: {
          judulTabel: 'Tabel 1. Lembar Investigasi Spesimen Daun dengan Kunci Determinasi Sederhana',
          kolom: ['No', 'Kode Spesimen', 'Ciri Morfologi (Bentuk & Tulang Daun)', 'Nomor Urutan Kunci Determinasi', 'Kesimpulan Nama Organisme'],
          barisPanduan: [
            'Spesimen A: Daun bertulang menyirip, helaian tunggal, tepi rata.',
            'Spesimen B: Daun bertulang menjari, helaian menjari 5-7 lekuk.',
            'Spesimen C: Daun bertulang sejajar, helaian memanjang seperti pita.'
          ]
        },
        tugasPemecahanMasalah: 'Tantangan Pemecahan Masalah (HOTS):\nJika di lingkungan tempat tinggal Anda terdapat spesies tumbuhan baru yang belum tercatat pada buku panduan lokal, rancanglah 1 cabang bagan kunci dikotomi baru (format 1a dan 1b) yang dapat digunakan oleh masyarakat awam untuk membedakan tumbuhan tersebut secara akurat!'
      },
      faseMerefleksi: {
        pertanyaanRefleksi: [
          'Konsep atau keterampilan baru apa yang paling menarik dan bermakna yang Anda kuasai setelah menjadi "Detektif Hayati" hari ini?',
          'Bagian mana dari kerja kelompok tadi yang paling seru dan menantang (joyful)?',
          'Bagaimana kontribusi Anda dalam menjaga kekompakan dan kelancaran kerja tim?'
        ],
        kesimpulanBersama: 'Rumuskan intisari kesimpulan kelompok mengenai prinsip dasar klasifikasi makhluk hidup menggunakan bahasa Anda sendiri!',
        rencanaAksiNyata: 'Saya berkomitmen untuk mendokumentasikan dan mengenali minimal 2 jenis tanaman bermanfaat di pekarangan rumah saya untuk menjaga kelestarian lingkungan.'
      },
      rubrikPenilaian: [
        {
          aspek: 'Pemahaman Konsep & Karakteristik Makhluk Hidup (Fase Memahami)',
          baruBerkembang: 'Menyebutkan ciri daun tanpa mengaitkan dengan konsep klasifikasi ilmiah.',
          layak: 'Menjelaskan konsep klasifikasi dasar dengan bantuan arahan guru.',
          cakap: 'Menjelaskan karakteristik dan prinsip klasifikasi secara runtut dan tepat.',
          mahir: 'Menganalisis hubungan antara karakteristik morfologi dengan adaptasi organisme secara kritis dan komprehensif.'
        },
        {
          aspek: 'Keterampilan Menelusuri Kunci Determinasi (Fase Mengaplikasi)',
          baruBerkembang: 'Masih keliru menelusuri nomor kunci determinasi (>2 kesalahan).',
          layak: 'Menelusuri kunci determinasi dengan 1 kekeliruan kecil pada spesimen.',
          cakap: 'Menelusuri kunci determinasi dengan akurat dan mengisi tabel secara sistematis.',
          mahir: 'Sangat terampil menelusuri kunci, data pengamatan sangat rinci, dan berhasil merancang bagan dikotomi baru secara kreatif.'
        },
        {
          aspek: 'Kolaborasi & Pembiasaan Berkesadaran (Mindful-Joyful)',
          baruBerkembang: 'Kurang fokus pada peran tim dan sering terdistraksi.',
          layak: 'Menjalankan peran dalam kelompok namun masih membutuhkan supervisi.',
          cakap: 'Bekerja sama aktif, saling mendengarkan, dan menjaga ketertiban eksplorasi.',
          mahir: 'Menunjukkan inisiatif tinggi, memotivasi rekan tim, empati, dan menikmati proses penyelidikan dengan antusias gembira.'
        },
        {
          aspek: 'Refleksi Diri & Komitmen Aksi Nyata (Fase Merefleksi)',
          baruBerkembang: 'Refleksi sangat singkat dan rencana aksi belum konkret.',
          layak: 'Menyampaikan refleksi umum tentang pengalaman belajar.',
          cakap: 'Merefleksikan proses belajar secara jujur dan merumuskan kesimpulan tepat.',
          mahir: 'Refleksi sangat mendalam, mengaitkan dengan rasa syukur atas alam, dan rencana aksi nyata terukur.'
        }
      ],
      catatanGuru: 'Peserta didik menunjukkan antusiasme tinggi saat eksplorasi taman. Lanjutkan penguatan penalaran deduktif pada pertemuan berikutnya.',
      updatedAt: '2025-08-05T10:30:00.000Z'
    },
    mediaPembelajaranList: [
      {
        id: 'med-demo-1',
        kategori: 'Visual',
        jenisSpesifik: 'Slide Presentasi (PPT)',
        namaMedia: 'Slide Interaktif: Menyingkap Pola Keanekaragaman Hayati',
        alatBahanAplikasi: 'Canva / PowerPoint / Proyektor Kelas',
        deskripsiRingkas: 'Slide presentasi terstruktur 6 tayangan yang memvisualisasikan kunci determinasi secara hierarkis dengan visual prompt dan catatan lisan guru.',
        keselarasan: {
          materiPokok: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
          tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen melalui kunci determinasi sederhana dengan bernalar kritis.',
          indikatorKetercapaian: 'Peserta didik mampu menyebutkan minimal 4 ciri morfologi kunci dan menentukan taksonomi spesimen menggunakan bagan dikotomi secara akurat.',
          pengalamanBelajar: {
            tahap: 'Memahami',
            deskripsiPeran: 'Membantu visualisasi konsep klasifikasi dari abstrak ke konkret dengan contoh visual spesimen nyata.',
          },
          prinsipDeepLearning: {
            berkesadaran: 'Desain minimalis dan bersih, menuntun fokus pandang murid pada ciri kunci tanpa beban kognitif berlebih.',
            bermakna: 'Menampilkan foto tanaman dan hewan yang ada di halaman sekolah sendiri.',
            menggembirakan: 'Diselingi tebak cepat visual dan diagram interaktif antarmurid.',
          },
        },
        naskahRancanganLengkap: `# RANCANGAN MEDIA VISUAL: SLIDE PRESENTASI (PPT)
**Mata Pelajaran:** Ilmu Pengetahuan Alam (IPA)  
**Kelas / Fase:** VII-A (Fase D SMP)  
**Topik Pembelajaran:** Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar  
**Aplikasi / Format Rekomendasi:** PowerPoint / Canva / Google Slides  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen melalui kunci determinasi sederhana dengan bernalar kritis.
- **Indikator Ketercapaian (KKTP):** Peserta didik mampu menyebutkan minimal 4 ciri morfologi kunci dan menentukan taksonomi spesimen menggunakan bagan dikotomi secara akurat.
- **Peran dalam Pengalaman Belajar:** Memberikan visualisasi konkret terhadap konsep abstrak sehingga mengurangi beban kognitif murid saat menganalisis spesimen di taman sekolah.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Tampilan visual bersih, kontras teratur, dan minim distraksi untuk memusatkan atensi murid.
  - **Bermakna (Meaningful):** Menggunakan foto daun mangga, pepaya, dan rumput dari lingkungan sekolah sendiri.
  - **Menggembirakan (Joyful):** Warna estetis, tipografi segar, dan kuis visual interaktif yang memicu rasa ingin tahu.

---

### II. RANCANGAN SLIDE BY SLIDE (PRESENTASI AKTIF)

**Slide 1: Judul & Pemantik Rasa Ingin Tahu**
- **Teks Judul:** Menyingkap Rahasia Ragam Hayati di Sekitar Kita
- **Sub-judul:** Menjadi Detektif Sains: Membaca Pola Alam dengan Kunci Determinasi
- **Visual Prompt:** Foto close-up daun dengan pola tulang daun unik dan tetesan embun pagi.
- **Catatan Guru:** "Anak-anak hebat, perhatikan daun di layar ini. Mengapa alam merancang bentuk tulang daun yang berbeda-beda? Hari ini kita akan menjadi detektif alam!"

**Slide 2: Pertanyaan Pemandu (Driving Question) & Tujuan**
- **Poin Utama:**
  - Bagaimana ilmuwan mengelompokkan jutaan spesies tanpa tertukar?
  - Bagaimana kunci determinasi sederhana membantu kita mengenali tanaman obat vs tanaman berbahaya?
- **Visual Prompt:** Diagram alur pohon klasifikasi dikotomi bercabang dua.
- **Catatan Guru:** "Tujuan kita bukan sekadar menghafal nama latin, melainkan memahami bagaimana keteraturan alam bekerja."

**Slide 3: Peta Konsep Inti (Morfologi Daun & Ciri Makhluk Hidup)**
- **Poin Utama:**
  - 4 Pola Tulang Daun: Menyirip, Menjari, Sejajar, Melengkung.
  - Tepi Daun: Rata vs Bergerigi.
- **Visual Prompt:** Bagan komparasi 4 daun berdampingan dengan label warna cerah.
- **Catatan Guru:** "Perhatikan pola garisnya. Hubungkan dengan spesimen nyata yang ada di meja praktikum kelompok kalian."

**Slide 4: Simulasi Cara Membaca Kunci Dikotomi 1a - 1b**
- **Poin Utama:**
  - 1a. Tumbuhan berpembuluh ... lanjut ke nomor 2
  - 1b. Tumbuhan tidak berpembuluh ... Lumut (Bryophyta)
- **Visual Prompt:** Tampilan animasi panah pilihan keputusan Ya/Tidak.
- **Catatan Guru:** "Ingat prinsipnya: selalu pilih salah satu ciri yang paling sesuai hingga berujung pada nama taksonnya."

**Slide 5: Panduan Misi Kelompok di LKPD**
- **Poin Utama:**
  - 15 Menit Investigasi Lapangan/Meja Praktikum.
  - Lengkapi Tabel 1 di LKPD bersama rekan tim.
- **Visual Prompt:** Kotak ceklis misi dan timer jam pasir.
- **Catatan Guru:** "Bekerjasamalah dengan rukun. Bagi peran siapa yang mengamati lup, mencatat, dan memvalidasi kunci."

**Slide 6: Refleksi & Apresiasi Teman**
- **Poin Utama:**
  - Apa temuan paling mengejutkan dari daun yang kalian teliti?
  - Tuliskan 1 kalimat apresiasi untuk rekan kelompokmu di tiket keluar.
- **Visual Prompt:** Ilustrasi tangan saling berjabatan dan tanaman yang tumbuh subur.
- **Catatan Guru:** "Tutup sesi dengan menarik napas hening 30 detik untuk mensyukuri keindahan ragam hayati Nusantara."`,
        createdAt: '2025-08-05T10:30:00.000Z',
        updatedAt: '2025-08-05T10:30:00.000Z',
      },
      {
        id: 'med-demo-2',
        kategori: 'Multimedia-Interaktif',
        jenisSpesifik: 'Kuis Gamifikasi (Quizizz/Wordwall)',
        namaMedia: 'Gamifikasi HOTS: Tantangan Detektif Taksonomi Cilik',
        alatBahanAplikasi: 'Quizizz / Wordwall / Gawai / Papan Tulis Interaktif',
        deskripsiRingkas: 'Media kuis interaktif gamifikasi dengan 4 misi HOTS berbasis skenario kebun sekolah dan umpan balik langsung seketika.',
        keselarasan: {
          materiPokok: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
          tujuanPembelajaran: 'Peserta didik mampu mengelompokkan spesimen melalui kunci determinasi sederhana dengan bernalar kritis.',
          indikatorKetercapaian: 'Menganalisis karakteristik spesimen dan menentukan taksonomi dengan skor minimal 75 pada kuis formatif.',
          pengalamanBelajar: {
            tahap: 'Mengaplikasi',
            deskripsiPeran: 'Menguji ketajaman analisa spesimen melalui tantangan gamifikasi berbasis tim.',
          },
          prinsipDeepLearning: {
            berkesadaran: 'Umpan balik langsung seketika melatih murid merefleksikan alur berpikir tanpa rasa cemas.',
            bermakna: 'Soal dirancang berbasis tanaman obat dan tanaman pangan lokal.',
            menggembirakan: 'Dinamika kolaborasi kelompok dan perayaan keberhasilan belajar bersama.',
          },
        },
        naskahRancanganLengkap: `# RANCANGAN MULTIMEDIA INTERAKTIF & GAMIFIKASI
**Mata Pelajaran:** Ilmu Pengetahuan Alam (IPA)  
**Kelas / Fase:** VII-A (Fase D SMP)  
**Topik Pembelajaran:** Karakteristik & Klasifikasi Makhluk Hidup  
**Format Interaktif:** Gamifikasi Kuis HOTS & Tantangan Detektif  
**Platform Rekomendasi:** Quizizz / Wordwall  

---

### I. PENYELARASAN KURIKULUM & PEMBELAJARAN MENDALAM
- **Tujuan Pembelajaran:** Peserta didik mampu mengelompokkan spesimen melalui kunci determinasi sederhana dengan bernalar kritis.
- **Indikator Ketercapaian (KKTP):** Mengidentifikasi ciri morfologi dan menyimpulkan taksonomi dengan benar.
- **Penerapan Prinsip Pembelajaran Mendalam:**
  - **Berkesadaran (Mindful):** Umpan balik formatif langsung melatih kesadaran metakognitif murid.
  - **Bermakna (Meaningful):** Kasus detektif tanaman obat herbal pekarangan rumah.
  - **Menggembirakan (Joyful):** Mode tim interaktif yang meriah, bebas stres, dan suportif.

---

### II. BUTIR MISI INTERAKTIF

**Misi 1: Menyelidiki Pola Tulang Daun**
- **Soal:** *"Murid menemukan daun berbentuk lonjong dengan susunan tulang daun mirip duri ikan yang tersusun teratur ke samping. Pola tulang daun ini adalah..."*
- **Pilihan:** A. Menjari | B. Menyirip [BENAR] | C. Sejajar | D. Melengkung
- **Umpan Balik Instan:** "Tepat sekali! Pola menyirip seperti duri ikan umumnya ditemukan pada tanaman dikotil seperti mangga dan jambu."

**Misi 2: Tantangan Kunci Dikotomi 1a vs 1b**
- **Soal:** *"Jika tanaman A memiliki bunga sejati dan biji berkeping dua, manakah langkah kunci determinasi berikutnya yang tepat?"*
- **Pilihan:** A. Kembali ke nomor 1a | B. Langsung ke kelompok Gymnospermae | C. Melanjutkan ke nomor cabang Dicotyledonae [BENAR] | D. Berhenti tanpa hasil
- **Umpan Balik Instan:** "Analisis kalian sangat tajam! Biji berkeping dua adalah penanda utama kelas Dicotyledonae."`,
        createdAt: '2025-08-05T10:30:00.000Z',
        updatedAt: '2025-08-05T10:30:00.000Z',
      }
    ],
    createdAt: '2025-08-01T08:00:00.000Z',
    updatedAt: '2025-08-05T10:30:00.000Z',
  },
  {
    id: 'plan-demo-2',
    judul: 'Zat dan Perubahannya: Wujud Zat & Model Partikel',
    status: 'Draf',
    isDemo: true,
    identitas: {
      namaSekolah: 'SMP Negeri 1 Nusantara',
      mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
      fase: 'Fase D',
      kelas: 'VII-A',
      semester: 'Ganjil',
      tahunPelajaran: '2025/2026',
      alokasiWaktu: '2 JP (2 x 40 menit)',
      topikMateri: 'Wujud Zat dan Teori Partikel Zat Padat, Cair, dan Gas',
      pertemuanKe: 2,
    },
    identifikasi: {
      kesiapanAwal: 'Siswa dapat menyebutkan contoh benda padat, cair, dan gas namun masih kesulitan menjelaskan mengapa volume gas dapat berubah sedangkan zat padat tetap.',
      karakteristikMateri: 'Memerlukan visualisasi mikroskopis molekul/partikel.',
      kebutuhanBelajar: 'Memerlukan simulasi visual digital interaktif (PhET) untuk memodelkan kerapatan partikel.',
      dimensiProfilLulusan: ['Penalaran Kritis', 'Kreativitas'],
    },
    tujuanPembelajaran: {
      capaianPembelajaran: 'Peserta didik mengidentifikasi sifat dan karakteristik zat, membedakan perubahan fisik dan kimia.',
      tujuanPembelajaran: 'Peserta didik dapat mendeskripsikan perbedaan keadaan partikel dalam zat padat, cair, dan gas melalui pemodelan fisik atau simulasi interaktif.',
      lingkupMateri: 'Sifat wujud zat, susunan dan gerak partikel, kerapatan partikel.',
      indikatorKetercapaian: 'Menjelaskan model partikel zat padat, cair, dan gas dengan gambar sketsa atau simulasi mandiri.',
    },
    desainPembelajaran: {
      praktikPedagogis: 'Inkuiri Terbimbing dengan simulasi PhET Colorado.',
      kemitraanPembelajaran: 'Kolaborasi teman sebaya dalam pasang-berbagi (Think-Pair-Share).',
      lingkunganPembelajaran: 'Laboratorium Komputer/Kelas dengan proyektor interaktif.',
      pemanfaatanDigital: 'Simulasi PhET States of Matter & Google Form respons cepat.',
      modelMetode: 'Demonstrasi, simulasi digital, dan peragaan peran partikel.',
      sumberBelajar: 'Buku Siswa IPA, platform simulasi PhET, jarum suntik tanpa jarum untuk demonstrasi kompresi udara vs air.',
    },
    kerangkaPembelajaran: {
      praktikPedagogis: 'Inkuiri Terbimbing dengan simulasi PhET Colorado.',
      kemitraanPembelajaran: 'Kolaborasi teman sebaya dalam pasang-berbagi (Think-Pair-Share).',
      lingkunganPembelajaran: 'Laboratorium Komputer/Kelas dengan proyektor interaktif.',
      pemanfaatanDigital: 'Simulasi PhET States of Matter & Google Form respons cepat.',
      modelMetode: 'Demonstrasi, simulasi digital, dan peragaan peran partikel.',
      sumberBelajar: 'Buku Siswa IPA, platform simulasi PhET, jarum suntik tanpa jarum untuk demonstrasi kompresi udara vs air.',
    },
    pengalamanBelajar: {
      memahami: 'Mengamati kompresibilitas udara vs air pada alat suntik plastik dan merumuskan hipotesis kerapatan partikel.',
      mengaplikasi: 'Mensimulasikan perubahan suhu dan melihat pergerakan partikel pada simulasi interaktif PhET.',
      merefleksi: 'Menghubungkan sifat partikel gas dengan fenomena penyebaran aroma wangi masakan di seluruh penjuru rumah.',
    },
    prinsipPembelajaranMendalam: {
      berkesadaran: 'Mengamati embusan napas hangat dan dingin untuk menyadari sifat partikel udara.',
      bermakna: 'Membahas mengapa tabung gas elpiji berisi cairan bertekanan tinggi yang menguap saat kran dibuka.',
      menggembirakan: 'Roleplay gerak partikel: siswa memperagakan diri sebagai partikel padat (bergandengan erat), cair (bergoyang longgar), dan gas (berlari bebas di karpet aula).',
    },
    rencanaKegiatan: {
      durasiPendahuluan: '10 menit',
      pendahuluan: 'Apersepsi membawa es batu yang mencair di cawan petri. Mengapa bentuknya berubah mengikuti wadah?',
      durasiInti: '60 menit',
      kegiatanInti: 'Siswa mencoba jarum suntik kosong vs berisi air, bermain peran partikel, dan mencatat perbandingan pada tabel sifat zat.',
      durasiPenutup: '10 menit',
      penutup: 'Kuis 3 menit cepat dan refleksi perasaaan belajar hari ini.',
    },
    rencanaAsesmen: {
      asesmenAwal: 'Pertanyaan pemantik tentang es batu dan uap air teko.',
      asesmenProses: 'Lembar ceklis observasi keterlibatan simulasi dan roleplay.',
      asesmenAkhir: 'Lembar kerja analisis partikel pada 3 kondisi termal berbeda.',
      teknikAsesmen: 'Tes tertulis dan observasi.',
      instrumenAsesmen: 'Rubrik pemahaman model partikel.',
      kriteriaKetercapaian: 'Mampu membedakan 3 susunan partikel zat dengan benar.',
    },
    createdAt: '2025-08-08T09:00:00.000Z',
    updatedAt: '2025-08-09T14:10:00.000Z',
  },
];

export const demoJurnalList: JurnalMengajar[] = [
  {
    id: 'jurnal-demo-1',
    perencanaId: 'plan-demo-1',
    pertemuanKe: 1,
    tanggal: '2025-08-12',
    kelas: 'VII-A',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    jamPelajaran: 'Jam 1 - 2 (07.30 - 08.50 WIB)',
    jamKe: '1 - 2',
    topikMateri: 'Klasifikasi Makhluk Hidup & Praktik Kunci Determinasi',
    tujuanPembelajaran: 'Peserta didik mampu mengklasifikasikan spesimen tumbuhan sekolah dengan kunci determinasi sederhana secara bernalar kritis.',
    kegiatanTerlaksana: 'Melaksanakan observasi di taman botani sekolah, mengumpulkan 3 sampel daun, dan mempraktikkan kunci determinasi berformat tabel dalam kelompok 4 siswa.',
    pengalamanBelajar: {
      memahami: true,
      mengaplikasi: true,
      merefleksi: true,
      catatan: 'Siswa sangat aktif saat mencocokkan pertulangan daun menyirip vs sejajar.',
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
      catatan: 'Mindful observation 3 menit di awal sangat menenangkan suasana belajar.',
    },
    prinsipTerlaksana: {
      berkesadaran: true,
      bermakna: true,
      menggembirakan: true,
    },
    kehadiran: {
      hadir: 30,
      sakit: 1,
      izin: 1,
      alpa: 0,
    },
    presensi: {
      hadir: 30,
      sakit: 1,
      izin: 1,
      alpa: 0,
    },
    catatanKendala: 'Dua kelompok membutuhkan waktu agak lama saat membaca istilah venasi daun (menjari vs melengkung).',
    kendala: 'Dua kelompok membutuhkan waktu agak lama saat membaca istilah venasi daun.',
    catatanKejadian: 'Pembelajaran di taman botani berlangsung dengan antusias.',
    tindakLanjut: 'Memberikan kartu bantuan visual bergambar bentuk daun pada pertemuan berikutnya sebelum tes formatif.',
    solusiTindakan: 'Memberikan kartu bantuan visual bergambar bentuk daun pada pertemuan berikutnya.',
    refleksiGuru: 'Alur kegiatan berjalan lancar dan menggembirakan. Pengalaman langsung mengamati daun nyata jauh lebih efektif dibanding hanya membaca buku teks.',
    statusKetercapaian: 'Tercapai',
    status: 'Terlaksana',
    isDemo: true,
    createdAt: '2025-08-12T09:30:00.000Z',
    updatedAt: '2025-08-12T09:30:00.000Z',
  },
  {
    id: 'jurnal-demo-2',
    perencanaId: 'plan-demo-2',
    pertemuanKe: 2,
    tanggal: '2025-08-19',
    kelas: 'VII-A',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    jamPelajaran: 'Jam 1 - 2 (07.30 - 08.50 WIB)',
    jamKe: '1 - 2',
    topikMateri: 'Wujud Zat dan Model Kerapatan Partikel',
    tujuanPembelajaran: 'Peserta didik dapat mendeskripsikan perbedaan partikel zat padat, cair, dan gas melalui simulasi.',
    kegiatanTerlaksana: 'Demonstrasi jarum suntik kompresibilitas udara dan air, dilanjutkan roleplay gerak partikel oleh siswa.',
    pengalamanBelajar: {
      memahami: true,
      mengaplikasi: true,
      merefleksi: false,
      catatan: 'Bagian refleksi akhir agak terburu-buru karena roleplay berlangsung seru.',
    },
    pengalamanTerlaksana: {
      memahami: true,
      mengaplikasi: true,
      merefleksi: false,
    },
    penerapanMendalam: {
      berkesadaran: true,
      bermakna: true,
      menggembirakan: true,
      catatan: 'Siswa tertawa gembira saat memperagakan diri sebagai molekul gas yang bertumbukan.',
    },
    prinsipTerlaksana: {
      berkesadaran: true,
      bermakna: true,
      menggembirakan: true,
    },
    kehadiran: {
      hadir: 32,
      sakit: 0,
      izin: 0,
      alpa: 0,
    },
    presensi: {
      hadir: 32,
      sakit: 0,
      izin: 0,
      alpa: 0,
    },
    catatanKendala: 'Waktu refleksi terpotong 5 menit karena antusiasme siswa yang tinggi saat roleplay.',
    kendala: 'Waktu refleksi terpotong 5 menit.',
    catatanKejadian: 'Simulasi gerak partikel berjalan sangat meriah.',
    tindakLanjut: 'Refleksi dilanjutkan pada awal pertemuan pekan depan sebagai apersepsi.',
    solusiTindakan: 'Refleksi dilanjutkan pada awal pertemuan pekan depan.',
    refleksiGuru: 'Manajemen waktu perlu diperketat pada sesi aktivitas motorik agar alur refleksi tetap tuntas.',
    statusKetercapaian: 'Sebagian Tercapai',
    status: 'Terlaksana',
    isDemo: true,
    createdAt: '2025-08-19T09:15:00.000Z',
    updatedAt: '2025-08-19T09:15:00.000Z',
  },
];

export const demoPesertaDidikList: PesertaDidik[] = [
  { id: 'sis-demo-1', nis: '240701', nisn: '0087612301', nama: 'Aditya Pratama Putra', kelas: 'VII-A', jenisKelamin: 'L', isDemo: true },
  { id: 'sis-demo-2', nis: '240702', nisn: '0087612302', nama: 'Aisyah Rahma Putri', kelas: 'VII-A', jenisKelamin: 'P', isDemo: true },
  { id: 'sis-demo-3', nis: '240703', nisn: '0087612303', nama: 'Bagas Satria Wijaya', kelas: 'VII-A', jenisKelamin: 'L', isDemo: true },
  { id: 'sis-demo-4', nis: '240704', nisn: '0087612304', nama: 'Cantika Dewi Lestari', kelas: 'VII-A', jenisKelamin: 'P', isDemo: true },
  { id: 'sis-demo-5', nis: '240705', nisn: '0087612305', nama: 'Dimas Anggara', kelas: 'VII-A', jenisKelamin: 'L', isDemo: true },
  { id: 'sis-demo-6', nis: '240706', nisn: '0087612306', nama: 'Farah Nabilah', kelas: 'VII-A', jenisKelamin: 'P', isDemo: true },
  { id: 'sis-demo-7', nis: '240707', nisn: '0087612307', nama: 'Gilang Ramadhan', kelas: 'VII-A', jenisKelamin: 'L', isDemo: true },
  { id: 'sis-demo-8', nis: '240708', nisn: '0087612308', nama: 'Hana Khairunnisa', kelas: 'VII-A', jenisKelamin: 'P', isDemo: true },
  { id: 'sis-demo-9', nis: '240709', nisn: '0087612309', nama: 'Irfan Hakim Maulana', kelas: 'VII-A', jenisKelamin: 'L', isDemo: true },
  { id: 'sis-demo-10', nis: '240710', nisn: '0087612310', nama: 'Jasmine Aurelia', kelas: 'VII-A', jenisKelamin: 'P', isDemo: true },
];

export const demoRencanaAsesmenList: RencanaAsesmenItem[] = [
  {
    id: 'ases-demo-1',
    perencanaId: 'plan-demo-1',
    judulAsesmen: 'Praktik Kunci Determinasi Daun',
    topikMateri: 'Klasifikasi Makhluk Hidup',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Mengklasifikasi spesimen tumbuhan menggunakan kunci determinasi sederhana',
    jenisAsesmen: 'Formatif',
    bentukAsesmen: 'Kinerja',
    teknikAsesmen: 'Kinerja/Praktik',
    instrumenAsesmen: 'Rubrik penilaian penggunaan kunci determinasi & ketepatan identifikasi spesimen',
    instrumen: 'Rubrik penilaian penggunaan kunci determinasi & ketepatan identifikasi spesimen',
    kriteriaKeberhasilan: 'Mampu membaca alur dikotomi dan mengidentifikasi minimal 3 dari 4 spesimen daun secara mandiri (KKTP 75)',
    kriteriaKetercapaian: {
      baruBerkembang: 'Menunjukkan pemahaman dasar kurang dari 60%.',
      layak: 'Memahami konsep dengan bimbingan (60-74%).',
      cakap: 'Menguasai materi dan mampu menerapkan secara mandiri (75-89%).',
      mahir: 'Mampu menganalisis, mencipta, dan menalar kritis (>90%).',
    },
    waktuPelaksanaan: 'Pekan ke-2 Agustus 2025',
    kktpTarget: 75,
    naskahAsesmen: `# NASKAH INSTRUMEN ASESMEN KINERJA & PRAKTIK
**Mata Pelajaran:** Ilmu Pengetahuan Alam (IPA)
**Kelas / Semester:** VII-A / Semester Ganjil
**Topik / Materi:** Klasifikasi Makhluk Hidup (Kunci Determinasi Daun)
**Tujuan Pembelajaran:** Mengklasifikasi spesimen tumbuhan menggunakan kunci determinasi sederhana
**Target KKTP:** 75

---

### A. PETUNJUK PELAKSANAAN BAGI PESERTA DIDIK
1. Bekerjalah dalam kelompok heterogen yang terdiri dari 4-5 orang.
2. Siapkan 4 spesimen daun segar yang telah disediakan di atas meja kerja.
3. Gunakan kaca pembesar (lup) untuk mengamati struktur pertulangan daun dan tepi daun secara teliti.
4. Cocokkan ciri-ciri daun dengan nomor pada bagan kunci determinasi dikotomi secara berurutan.
5. Catat nomor kunci yang dilewati dan tuliskan nama familia/ordo tumbuhan pada lembar observasi.

---

### B. ALAT DAN BAHAN
* 4 ragam spesimen daun (Mangga, Jagung, Pepaya, Singkong)
* Lup (kaca pembesar tangan)
* Lembar Kunci Determinasi Format Dikotomi
* Format Lembar Observasi Kinerja Siswa

---

### C. LANGKAH KERJA PRAKTIK
1. Amati bentuk helaian daun dan pola pertulangan daun spesimen A.
2. Mulailah dari nomor 1a atau 1b pada kunci determinasi.
3. Ikuti nomor petunjuk selanjutnya sampai menemukan nama kelompok tumbuhan yang tepat.
4. Ulangi prosedur yang sama untuk spesimen B, C, dan D.
5. Presentasikan hasil identifikasi kelompok dan diskusikan perbedaan adaptasi morfologinya.

---

### D. RUBRIK PENILAIAN FORMATIF KINERJA (4 LEVEL CAPAIAN)
| Aspek Kinerja | Baru Berkembang (<60) | Layak (60-74) | Cakap (75-89) [Target KKTP] | Mahir (90-100) |
|:--------------|:----------------------|:--------------|:----------------------------|:---------------|
| **Keterampilan Mengamati Morfologi** | Kesulitan membedakan pola pertulangan daun | Membedakan pertulangan daun dengan bimbingan | Mengidentifikasi bentuk dan pertulangan daun secara mandiri | Sangat teliti, mampu menjelaskan adaptasi morfologi daun |
| **Penggunaan Alur Kunci Determinasi** | Membaca kunci acak tanpa mengikuti nomor | Mengikuti alur dengan bantuan berkala guru | Mengikuti urutan alur dikotomi secara tepat dan runtut | Mampu menganalisis logika dikotomi dan memandu rekan |
| **Akurasi Hasil Identifikasi** | Kurang dari 2 spesimen teridentifikasi benar | 2 dari 4 spesimen teridentifikasi benar | Minimal 3 dari 4 spesimen teridentifikasi benar | Seluruh 4 spesimen teridentifikasi 100% tepat |`,
    isDemo: true,
    createdAt: '2025-08-05T11:00:00.000Z',
    updatedAt: '2025-08-05T11:00:00.000Z',
  },
  {
    id: 'ases-demo-2',
    perencanaId: 'plan-demo-2',
    judulAsesmen: 'Tes Pemahaman Model Partikel Zat',
    topikMateri: 'Wujud Zat dan Model Kerapatan Partikel',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Mendeskripsikan perbedaan sifat wujud zat berdasarkan model kerapatan partikel',
    jenisAsesmen: 'Sumatif',
    bentukAsesmen: 'Tes Tertulis',
    teknikAsesmen: 'Tes Tulis',
    instrumenAsesmen: 'Tes Pilihan Ganda Beralasan dan Soal Analisis Gambar Partikel',
    instrumen: 'Tes Pilihan Ganda Beralasan dan Soal Analisis Gambar Partikel',
    kriteriaKeberhasilan: 'Skor tes >= 75 dari skala 100',
    kriteriaKetercapaian: {
      baruBerkembang: 'Skor tes di bawah 60.',
      layak: 'Skor tes 60 - 74.',
      cakap: 'Skor tes 75 - 89.',
      mahir: 'Skor tes 90 - 100.',
    },
    waktuPelaksanaan: 'Pekan ke-4 Agustus 2025',
    kktpTarget: 75,
    naskahAsesmen: `# NASKAH INSTRUMEN TES TERTULIS
**Mata Pelajaran:** Ilmu Pengetahuan Alam (IPA)
**Kelas / Semester:** VII-A / Semester Ganjil
**Topik / Materi:** Wujud Zat dan Model Kerapatan Partikel
**Tujuan Pembelajaran:** Mendeskripsikan perbedaan sifat wujud zat berdasarkan model kerapatan partikel
**Target KKTP:** 75
**Alokasi Waktu:** 60 Menit

---

### A. PETUNJUK PENGERJAAN
1. Tuliskan nama dan nomor presensi pada lembar jawaban.
2. Bacalah wacana stimulus ilmiah dengan teliti.
3. Kerjakan setiap butir soal dengan mengutamakan penalaran kritis dan bukti konsep.

---

### B. BUTIR SOAL TES TERTULIS

**Stimulus Wacana:**
Ketika kita memasukkan sebongkah es batu ke dalam gelas berisi air hangat, es tersebut perlahan mencair menjadi air, dan jika dibiarkan mendidih akan berubah menjadi uap air. Perubahan wujud ini melibatkan penyerapan energi panas yang mempengaruhi susunan dan gerak partikel penyusun zat tersebut.

**Soal 1 (Pilihan Ganda Beralasan - Level C3):**
Mengapa zat padat (seperti es batu) memiliki bentuk yang tetap dan tidak mudah berubah bentuk saat dipindahkan ke wadah lain?
* A. Karena partikel zat padat berukuran jauh lebih besar daripada partikel zat cair
* B. Karena susunan partikel zat padat sangat rapat, teratur, dan gaya tarik antarpartikelnya sangat kuat
* C. Karena partikel zat padat tidak memiliki energi kinetik sama sekali
* D. Karena partikel zat padat dapat bergerak bebas saling melewati satu sama lain
* **Alasan Ilmiah Anda:** ....................................................................

**Soal 2 (Pilihan Ganda Beralasan - Level C4):**
Gas memiliki sifat dapat dimampatkan ke dalam tabung kecil (misalnya tabung elpiji). Hal ini dapat dijelaskan secara mikroskopis karena...
* A. Partikel gas memiliki massa yang jauh lebih ringan dibanding zat padat
* B. Partikel gas saling bertabrakan dan kehilangan volumenya
* C. Jarak antarpartikel gas sangat renggang sehingga ruang kosong antarpartikel dapat diperkecil
* D. Gaya tarik antarpartikel gas sangat kuat mengikat molekul
* **Alasan Ilmiah Anda:** ....................................................................

**Soal 3 (Uraian Analisis Partikel - Level C4 HOTS):**
Jelaskan perubahan apa yang terjadi pada (a) susunan partikel, (b) gaya tarik-menarik antarpartikel, dan (c) kebebasan gerak partikel ketika air berubah wujud menjadi uap air akibat pemanasan!
* **Ruang Jawaban:** ........................................................................

---

### C. KUNCI JAWABAN & PANDUAN PENSKORAN
* **Soal 1:** Kunci **B** (Pilihan tepat = 10 poin, alasan ilmiah logis = 10 poin). Total 20 poin.
* **Soal 2:** Kunci **C** (Pilihan tepat = 10 poin, alasan ilmiah logis = 10 poin). Total 20 poin.
* **Soal 3:** Uraian lengkap memuat 3 aspek: susunan renggang (10 poin), gaya tarik melemah (10 poin), gerak partikel sangat bebas dan cepat (10 poin). Total 30 poin.
* **Nilai Akhir:** (Skor Total / 70) x 100. Kategori tuntas bila Nilai >= 75.`,
    isDemo: true,
    createdAt: '2025-08-10T11:00:00.000Z',
    updatedAt: '2025-08-10T11:00:00.000Z',
  },
  {
    id: 'ases-demo-3',
    perencanaId: 'plan-demo-2',
    judulAsesmen: 'Kuis Formatif Perubahan Fisika & Kimia',
    topikMateri: 'Perubahan Wujud dan Kerapatan Partikel',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Menganalisis fenomena perubahan fisika dan kimia dalam kehidupan sehari-hari',
    jenisAsesmen: 'Formatif',
    bentukAsesmen: 'Tes Tertulis',
    teknikAsesmen: 'Tes Tertulis (10 Butir Soal)',
    instrumenAsesmen: 'Kuis Cepat HOTS & Lembar Observasi Partikel',
    instrumen: 'Kuis Cepat HOTS & Lembar Observasi Partikel',
    kriteriaKeberhasilan: 'Skor kuis >= 75 dari skala 100',
    kriteriaKetercapaian: {
      baruBerkembang: 'Skor tes di bawah 60.',
      layak: 'Skor tes 60 - 74.',
      cakap: 'Skor tes 75 - 89.',
      mahir: 'Skor tes 90 - 100.',
    },
    waktuPelaksanaan: 'Pekan ke-2 September 2025',
    kktpTarget: 75,
    isDemo: true,
    createdAt: '2025-09-02T08:00:00.000Z',
    updatedAt: '2025-09-02T08:00:00.000Z',
  },
  {
    id: 'ases-demo-4',
    perencanaId: 'plan-demo-1',
    judulAsesmen: 'Sumatif Tengah Semester (STS) IPA Fase D',
    topikMateri: 'Klasifikasi Makhluk Hidup & Wujud Zat',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Mengukur ketercapaian kompetensi tengah semester materi klasifikasi dan model partikel zat',
    jenisAsesmen: 'Sumatif',
    bentukAsesmen: 'Tes Tertulis',
    teknikAsesmen: 'Tes Tertulis (25 Butir Soal)',
    instrumenAsesmen: 'Naskah Soal STS Terstandar Kurikulum Merdeka',
    instrumen: 'Naskah Soal STS Terstandar Kurikulum Merdeka',
    kriteriaKeberhasilan: 'Skor tes >= 75 dari skala 100',
    kriteriaKetercapaian: {
      baruBerkembang: 'Skor tes di bawah 60.',
      layak: 'Skor tes 60 - 74.',
      cakap: 'Skor tes 75 - 89.',
      mahir: 'Skor tes 90 - 100.',
    },
    waktuPelaksanaan: 'Pekan ke-4 September 2025',
    kktpTarget: 75,
    isDemo: true,
    createdAt: '2025-09-20T08:00:00.000Z',
    updatedAt: '2025-09-20T08:00:00.000Z',
  },
  {
    id: 'ases-demo-5',
    perencanaId: 'plan-demo-2',
    judulAsesmen: 'Praktik Formatif Perpindahan Kalor & Suhu',
    topikMateri: 'Suhu, Kalor, dan Pemuaian',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Menyelidiki pengaruh kalor terhadap perubahan suhu dan wujud zat melalui eksperimen sederhana',
    jenisAsesmen: 'Formatif',
    bentukAsesmen: 'Kinerja',
    teknikAsesmen: 'Kinerja & Observasi Diskusi',
    instrumenAsesmen: 'Rubrik Penyelidikan Ilmiah dan Presentasi Data',
    instrumen: 'Rubrik Penyelidikan Ilmiah dan Presentasi Data',
    kriteriaKeberhasilan: 'Mampu menyajikan data konduksi, konveksi, dan radiasi secara tepat (KKTP 75)',
    kriteriaKetercapaian: {
      baruBerkembang: 'Skor kinerja di bawah 60.',
      layak: 'Skor kinerja 60 - 74.',
      cakap: 'Skor kinerja 75 - 89.',
      mahir: 'Skor kinerja 90 - 100.',
    },
    waktuPelaksanaan: 'Pekan ke-3 Oktober 2025',
    kktpTarget: 75,
    isDemo: true,
    createdAt: '2025-10-15T08:00:00.000Z',
    updatedAt: '2025-10-15T08:00:00.000Z',
  },
  {
    id: 'ases-demo-6',
    perencanaId: 'plan-demo-1',
    judulAsesmen: 'Sumatif Akhir Semester (SAS) IPA Ganjil',
    topikMateri: 'Capaian Pembelajaran IPA Terpadu Semester Ganjil',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: 'VII-A',
    tujuanPembelajaran: 'Mengukur pencapaian menyeluruh seluruh capaian pembelajaran IPA Semester Ganjil',
    jenisAsesmen: 'Sumatif',
    bentukAsesmen: 'Tes Tertulis',
    teknikAsesmen: 'Tes Tertulis (30 Butir Soal)',
    instrumenAsesmen: 'Naskah Asesmen Sumatif Akhir Semester Komprehensif',
    instrumen: 'Naskah Asesmen Sumatif Akhir Semester Komprehensif',
    kriteriaKeberhasilan: 'Skor SAS >= 75 dari skala 100',
    kriteriaKetercapaian: {
      baruBerkembang: 'Skor tes di bawah 60.',
      layak: 'Skor tes 60 - 74.',
      cakap: 'Skor tes 75 - 89.',
      mahir: 'Skor tes 90 - 100.',
    },
    waktuPelaksanaan: 'Pekan ke-1 Desember 2025',
    kktpTarget: 75,
    isDemo: true,
    createdAt: '2025-11-28T08:00:00.000Z',
    updatedAt: '2025-11-28T08:00:00.000Z',
  },
];

export const demoNilaiList: NilaiSiswa[] = [
  // Asesmen 1 (Formatif 1)
  { id: 'nil-demo-1', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 85, nilai: 85, catatanDeskripsi: 'Sangat cermat menggunakan kunci determinasi.', catatanGuru: 'Sangat cermat menggunakan kunci determinasi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-2', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 92, nilai: 92, catatanDeskripsi: 'Penjelasan sistematis dan kerja sama tim sangat baik.', catatanGuru: 'Penjelasan sistematis dan kerja sama tim sangat baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-3', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 68, nilai: 68, catatanDeskripsi: 'Masih ragu membedakan venasi daun menjari dan menyirip.', catatanGuru: 'Masih ragu membedakan venasi daun menjari dan menyirip.', statusKetercapaian: 'Belum Tercapai', statusTercapai: false, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-4', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 88, nilai: 88, catatanDeskripsi: 'Teliti dan tepat waktu dalam mengidentifikasi spesimen.', catatanGuru: 'Teliti dan tepat waktu dalam mengidentifikasi spesimen.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-5', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 65, nilai: 65, catatanDeskripsi: 'Perlu bimbingan langkah pembacaan tabel kunci determinasi nomor 2.', catatanGuru: 'Perlu bimbingan langkah pembacaan tabel kunci determinasi nomor 2.', statusKetercapaian: 'Belum Tercapai', statusTercapai: false, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-6', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 95, nilai: 95, catatanDeskripsi: 'Sempurna dalam analisis dan visualisasi sketsa daun.', catatanGuru: 'Sempurna dalam analisis dan visualisasi sketsa daun.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-7', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 78, nilai: 78, catatanDeskripsi: 'Tuntas dengan catatan perlu lebih fokus saat membaca cabang kunci.', catatanGuru: 'Tuntas dengan catatan perlu lebih fokus saat membaca cabang kunci.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-8', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 82, nilai: 82, catatanDeskripsi: 'Keterampilan observasi daun sangat teliti.', catatanGuru: 'Keterampilan observasi daun sangat teliti.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-9', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 70, nilai: 70, catatanDeskripsi: 'Mendekati tuntas, salah 1 langkah kunci identifikasi daun monokotil.', catatanGuru: 'Mendekati tuntas, salah 1 langkah kunci identifikasi daun monokotil.', statusKetercapaian: 'Belum Tercapai', statusTercapai: false, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },
  { id: 'nil-demo-10', asesmenId: 'ases-demo-1', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 90, nilai: 90, catatanDeskripsi: 'Mandiri dan mampu membantu rekan satu kelompoknya.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-14T10:00:00.000Z' },

  // Asesmen 2 (Sumatif 1: Model Partikel Zat)
  { id: 'nil-demo-201', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 86, nilai: 86, catatanDeskripsi: 'Penalaran model kerapatan partikel gas sangat baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-202', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 94, nilai: 94, catatanDeskripsi: 'Pemahaman komprehensif konsep termal wujud zat.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-203', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 72, nilai: 72, catatanDeskripsi: 'Perlu penguatan konsep perubahan wujud gas ke cair.', statusKetercapaian: 'Belum Tercapai', statusTercapai: false, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-204', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 89, nilai: 89, catatanDeskripsi: 'Menganalisis hubungan jarak antarpartikel dengan tepat.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-205', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 70, nilai: 70, catatanDeskripsi: 'Meningkat dari asesmen awal, perlu latihan soal HOTS.', statusKetercapaian: 'Belum Tercapai', statusTercapai: false, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-206', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 96, nilai: 96, catatanDeskripsi: 'Analisis mikroskopis dan makroskopis sangat mendalam.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-207', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 80, nilai: 80, catatanDeskripsi: 'Tuntas, pemahaman konsep gaya tarik antarpartikel baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-208', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 85, nilai: 85, catatanDeskripsi: 'Menguasai perbedaan zat padat, cair, dan gas.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-209', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 76, nilai: 76, catatanDeskripsi: 'Tuntas melampaui ambang batas KKTP 75.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },
  { id: 'nil-demo-210', asesmenId: 'ases-demo-2', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 91, nilai: 91, catatanDeskripsi: 'Sangat baik dalam menghubungkan teori partikel.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-08-28T10:00:00.000Z' },

  // Asesmen 3 (Formatif 2: Kuis Perubahan Fisika & Kimia)
  { id: 'nil-demo-301', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 88, nilai: 88, catatanDeskripsi: 'Menguasai indikator reaksi kimia.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-302', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 95, nilai: 95, catatanDeskripsi: 'Membedakan perubahan wujud dengan sempurna.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-303', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 78, nilai: 78, catatanDeskripsi: 'Progres sangat baik, tuntas di atas KKTP.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-304', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 90, nilai: 90, catatanDeskripsi: 'Penalaran kritis sangat tajam.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-305', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 75, nilai: 75, catatanDeskripsi: 'Mencapai target KKTP setelah pendampingan.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-306', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 98, nilai: 98, catatanDeskripsi: 'Istimewa dan konsisten di puncak pemahaman.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-307', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 82, nilai: 82, catatanDeskripsi: 'Aktif merespons kuis interaktif.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-308', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 86, nilai: 86, catatanDeskripsi: 'Dapat menjelaskan konsep pembentukan zat baru.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-309', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 80, nilai: 80, catatanDeskripsi: 'Peningkatan konsisten di materi kimia sederhana.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },
  { id: 'nil-demo-310', asesmenId: 'ases-demo-3', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 93, nilai: 93, catatanDeskripsi: 'Pemahaman konsep dan analisis sangat baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-05T10:00:00.000Z' },

  // Asesmen 4 (Sumatif 2: STS IPA)
  { id: 'nil-demo-401', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 89, nilai: 89, catatanDeskripsi: 'Hasil STS sangat memuaskan, capaian Cakap.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-402', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 96, nilai: 96, catatanDeskripsi: 'Kategori Mahir pada seluruh lingkup materi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-403', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 80, nilai: 80, catatanDeskripsi: 'Mencapai ketuntasan penuh pada evaluasi tengah semester.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-404', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 92, nilai: 92, catatanDeskripsi: 'Nilai stabil di kategori Mahir.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-405', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 78, nilai: 78, catatanDeskripsi: 'Berhasil tuntas pada STS setelah program tutorial sebaya.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-406', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 99, nilai: 99, catatanDeskripsi: 'Capaian nyaris sempurna pada seluruh soal penalaran.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-407', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 84, nilai: 84, catatanDeskripsi: 'Konsisten di atas kriteria ketuntasan.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-408', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 88, nilai: 88, catatanDeskripsi: 'Kemampuan analisis soal studi kasus sangat baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-409', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 82, nilai: 82, catatanDeskripsi: 'Capaian meningkat signifikan dari asesmen formatif 1.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },
  { id: 'nil-demo-410', asesmenId: 'ases-demo-4', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 94, nilai: 94, catatanDeskripsi: 'Pemahaman materi IPA terpadu sangat kuat.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-09-25T10:00:00.000Z' },

  // Asesmen 5 (Formatif 3: Praktik Perpindahan Kalor)
  { id: 'nil-demo-501', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 90, nilai: 90, catatanDeskripsi: 'Keterampilan merakit alat percobaan kalor sangat terampil.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-502', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 95, nilai: 95, catatanDeskripsi: 'Penyajian grafik konveksi air sangat akurat.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-503', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 82, nilai: 82, catatanDeskripsi: 'Aktif dalam percobaan kelompok.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-504', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 91, nilai: 91, catatanDeskripsi: 'Teliti membaca termometer digital.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-505', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 80, nilai: 80, catatanDeskripsi: 'Mampu menjelaskan konduksi dengan baik.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-506', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 97, nilai: 97, catatanDeskripsi: 'Sangat piawai mengomunikasikan hasil uji radiasi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-507', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 85, nilai: 85, catatanDeskripsi: 'Disiplin dan bertanggung jawab terhadap keselamatan kerja.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-508', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 89, nilai: 89, catatanDeskripsi: 'Pengamatan perubahan suhu berkala sangat rapi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-509', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 84, nilai: 84, catatanDeskripsi: 'Menguasai perbedaan laju konduksi bahan.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },
  { id: 'nil-demo-510', asesmenId: 'ases-demo-5', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 95, nilai: 95, catatanDeskripsi: 'Pemimpin diskusi kelompok yang empatik dan cekatan.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-10-18T10:00:00.000Z' },

  // Asesmen 6 (Sumatif 3: SAS Akhir Semester)
  { id: 'nil-demo-601', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-1', nisn: '0087612301', namaSiswa: 'Aditya Pratama Putra', kelas: 'VII-A', nilaiAngka: 91, nilai: 91, catatanDeskripsi: 'Capaian akhir semester kategori Mahir.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-602', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-2', nisn: '0087612302', namaSiswa: 'Aisyah Rahma Putri', kelas: 'VII-A', nilaiAngka: 97, nilai: 97, catatanDeskripsi: 'Lulus dengan predikat sangat memuaskan.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-603', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-3', nisn: '0087612303', namaSiswa: 'Bagas Satria Wijaya', kelas: 'VII-A', nilaiAngka: 84, nilai: 84, catatanDeskripsi: 'Kemajuan belajar sangat mengesankan, tuntas penuh.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-604', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-4', nisn: '0087612304', namaSiswa: 'Cantika Dewi Lestari', kelas: 'VII-A', nilaiAngka: 93, nilai: 93, catatanDeskripsi: 'Menguasai seluruh indikator kompetensi dasar.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-605', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-5', nisn: '0087612305', namaSiswa: 'Dimas Anggara', kelas: 'VII-A', nilaiAngka: 82, nilai: 82, catatanDeskripsi: 'Lulus tuntas di atas kriteria ketuntasan minimal.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-606', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-6', nisn: '0087612306', namaSiswa: 'Farah Nabilah', kelas: 'VII-A', nilaiAngka: 100, nilai: 100, catatanDeskripsi: 'Prestasi gemilang nilai sempurna 100.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-607', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-7', nisn: '0087612307', namaSiswa: 'Gilang Ramadhan', kelas: 'VII-A', nilaiAngka: 87, nilai: 87, catatanDeskripsi: 'Konsisten tuntas dan berkarakter pembelajar tangguh.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-608', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-8', nisn: '0087612308', namaSiswa: 'Hana Khairunnisa', kelas: 'VII-A', nilaiAngka: 90, nilai: 90, catatanDeskripsi: 'Menunjukkan daya nalar ilmiah yang sangat tinggi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-609', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-9', nisn: '0087612309', namaSiswa: 'Irfan Hakim Maulana', kelas: 'VII-A', nilaiAngka: 85, nilai: 85, catatanDeskripsi: 'Lulus dengan pencapaian Cakap pada seluruh materi.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
  { id: 'nil-demo-610', asesmenId: 'ases-demo-6', siswaId: 'sis-demo-10', nisn: '0087612310', namaSiswa: 'Jasmine Aurelia', kelas: 'VII-A', nilaiAngka: 96, nilai: 96, catatanDeskripsi: 'Sangat menguasai aplikasi konsep IPA dalam kehidupan nyata.', statusKetercapaian: 'Tercapai', statusTercapai: true, isDemo: true, updatedAt: '2025-12-05T10:00:00.000Z' },
];

export const demoTindakLanjutList: TindakLanjutData[] = [
  {
    id: 'tl-demo-1',
    asesmenId: 'ases-demo-1',
    topikMateri: 'Klasifikasi Makhluk Hidup & Praktik Kunci Determinasi',
    kelas: 'VII-A',
    kktpTarget: 75,
    programRemedial: {
      daftarSiswa: ['Bagas Satria Wijaya', 'Dimas Anggara', 'Irfan Hakim Maulana'],
      materiPengulangan: 'Langkah penelusuran tabel kunci determinasi dikotomi dan pembedaan venasi daun menjari vs menyirip.',
      bentukKegiatan: 'Bimbingan kelompok kecil dan tutor sebaya menggunakan kartu bergambar spesimen daun nyata.',
      jadwalPelaksanaan: 'Jumat, 15 Agustus 2025 (13.00 - 14.00 WIB)',
    },
    programPengayaan: {
      daftarSiswa: ['Aisyah Rahma Putri', 'Farah Nabilah', 'Jasmine Aurelia'],
      materiPengayaan: 'Pembuatan herbarium mini digital dan perancangan kunci determinasi interaktif untuk 6 jenis flora sekolah.',
      bentukKegiatan: 'Proyek eksplorasi mandiri dan pembuatan infografis klasifikasi.',
      jadwalPelaksanaan: 'Pekan ke-3 Agustus 2025',
    },
    catatanHasil: 'Setelah pendampingan remedial, 3 siswa berhasil tuntas dengan nilai rata-rata 78. Proyek pengayaan berjalan sangat kreatif.',
    updatedAt: '2025-08-16T10:00:00.000Z',
  },
];

export const demoRefleksiList: RefleksiEvaluasiData[] = [
  {
    id: 'ref-demo-1',
    asesmenId: 'ases-demo-1',
    topikMateri: 'Klasifikasi Makhluk Hidup & Praktik Kunci Determinasi',
    kelas: 'VII-A',
    apaYangBerjalanEfektif: 'Praktik langsung mengamati spesimen daun di taman sekolah membuat siswa memahami konsep klasifikasi dengan sangat cepat, antusias, dan bermakna.',
    apaYangBelumBerhasil: 'Dua siswa awalnya bingung membedakan pertulangan daun melengkung dan menjari karena ukuran daun yang terlalu kecil.',
    responPesertaDidik: 'Sangat positif, 95% peserta didik merasa gembira dan lebih percaya diri menyelesaikan rubrik identifikasi secara mandiri.',
    rencanaPerbaikan: 'Menyediakan kartu bantuan visual dengan kontras tinggi serta sampel daun berukuran lebih lebar pada sesi apersepsi pertemuan selanjutnya.',
    updatedAt: '2025-08-15T11:00:00.000Z',
  },
];

export const demoMediaLibraryList: MediaRecord[] = [
  {
    id: 'med-demo-1',
    guru: 'Asep Fajar Pratama, S.Pd., Gr.',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelasFase: 'Kelas VII-A (Fase D)',
    rppId: 'plan-demo-1',
    rppJudul: 'Klasifikasi Makhluk Hidup & Keanekaragaman Hayati',
    tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen tumbuhan dan hewan sederhana melalui kunci determinasi sederhana dengan bernalar kritis.',
    materiPokok: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
    subMateri: 'Ciri-Ciri Makhluk Hidup dan Kunci Determinasi Sederhana',
    alokasiWaktu: '2 JP (2 x 40 menit)',
    karakteristikPesertaDidik: 'Sebagian besar butuh visualisasi konkret spesimen dan scaffolding bertahap',
    modelMetode: 'Problem-Based Learning dengan inkuiri terbimbing',
    dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'],
    kategori: 'Visual',
    jenisMedia: 'Slide Presentasi (PPT) & Infografis',
    judul: 'Slide Interaktif & Infografis Kunci Determinasi Makhluk Hidup',
    versi: 'v1.0',
    status: 'Final',
    tanggal: '2025-08-14',
    kontrolGuru: {
      jenisMedia: 'Slide Presentasi (PPT)',
      kategori: 'Visual',
      gayaVisual: 'Ilustrasi Edukatif Kontras Bersih',
      tingkatKompleksitas: 'Menengah / Standar',
      durasi: '10-15 Menit Presentasi (6 Slide Inti)',
      bahasa: 'Bahasa Indonesia komunikatif & istilah saintifik ramah SMP',
      orientasiUkuran: 'Lanskap 16:9 (Proyektor Kelas)',
      sasaranPenggunaan: 'Klasikal dengan panduan interaktif',
      instruksiKhusus: 'Fokuskan pada perbandingan venasi daun dan 5 ciri mutlak makhluk hidup.',
    },
    analisisAI: {
      karakteristikMateri: 'Materi konseptual dan klasifikatorik berbasis observasi fisik spesimen hidup.',
      tingkatAbstraksi: 'Sedang',
      kebutuhanVisualisasi: 'Sangat tinggi untuk memperjelas morfologi spesimen, venasi daun, dan bagan dikotomi.',
      kebutuhanAudio: 'Sedang untuk petunjuk instruksi pengamatan.',
      kebutuhanDemonstrasi: 'Tinggi untuk langkah-langkah penggunaan kunci determinasi.',
      kebutuhanInteraktivitas: 'Tinggi melalui kuis cek pemahaman instan.',
      analisisBebanKognitif: 'Pecah istilah Latin menjadi penanda morfologi fisik yang langsung dikenali.',
      rekomendasiStrategi: 'Gunakan slide visual terstruktur dengan bagan alir dikotomis 2 pilihan yang jelas.',
    },
    rancangan: {
      judul: 'Rancangan Slide & Infografis: Menyingkap Rahasia Taksonomi Flora Sekolah',
      tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen melalui kunci determinasi sederhana.',
      materi: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
      subMateri: 'Kunci Determinasi Dikotomis',
      sasaranPesertaDidik: 'Siswa Kelas VII SMP Fase D dengan gaya belajar visual dan auditori.',
      strukturMedia: '1. Cover & TP → 2. Fenomena Pemantik → 3. 5 Ciri Kunci → 4. Bagan Alir Determinasi → 5. Tantangan LKPD → 6. Refleksi & Kesimpulan',
      urutanIsi: [
        'Slide 1: Salam, Judul Media & Tujuan Pembelajaran',
        'Slide 2: Stimulus Fenomena (Pohon Mangga vs Batu di Taman Sekolah)',
        'Slide 3: Pembedahan 5 Ciri Mutlak Makhluk Hidup',
        'Slide 4: Panduan Interaktif Kunci Determinasi Dikotomi',
        'Slide 5: Misi Praktik Mandiri Berbantuan LKPD',
        'Slide 6: Jeda Refleksi Berkesadaran & Penguatan Guru',
      ],
      visual: 'Palet warna alam (Emerald-Slate-Indigo), ikon flora/fauna minimalis, teks kontras tinggi, foto makro venasi daun.',
      narasi: 'Guru memandu dengan pertanyaan pemantik rasa ingin tahu dan memberikan apresiasi atas setiap respons nalar kritis siswa.',
      aktivitasInteraksi: 'Siswa membandingkan dua spesimen daun di meja kelompok lalu menentukan alur kunci determinasi bersama.',
      pertanyaanPemantik: [
        'Mengapa daun mangga dan daun jagung memiliki pola garis yang berbeda?',
        'Jika kalian menemukan organisme baru di pekarangan sekolah, apa langkah pertama kalian untuk mengidentifikasinya?',
      ],
      evaluasi: 'Kuis formatif 3 butir cepat di akhir presentasi untuk menguji identifikasi dikotomi.',
      durasi: '12 Menit',
    },
    produkMedia: {
      materiSiapGunakan: 'Slide Presentasi PowerPoint (PPTX) dan Dokumen Panduan Guru siap ajar.',
      desainVisual: 'Tata letak 6 slide modern dengan kartu komparasi visual dan bagan hierarki taksonomi.',
      promptGambar: [
        'Macro photography of green mango leaf showing reticulate venation against white clean background, educational textbook style, high detail.',
        'Parallel venation pattern on maize leaf botanical diagram, clear labeled lines, minimal clean vector art.',
      ],
      markdownLengkap: `# MEDIA VISUAL: SLIDE PRESENTASI & INFOGRAFIS KLASIFIKASI MAKHLUK HIDUP
**Mata Pelajaran:** Ilmu Pengetahuan Alam (IPA)  
**Kelas/Fase:** VII-A (Fase D SMP)  
**Topik:** Karakteristik & Klasifikasi Makhluk Hidup  

---

### I. PENYELARASAN TUJUAN PEMBELAJARAN
- **Tujuan Pembelajaran:** Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen tumbuhan dan hewan sederhana melalui kunci determinasi sederhana dengan bernalar kritis.
- **Dimensi Profil Lulusan:** Penalaran Kritis, Kolaborasi, Kemandirian.
- **Tahap Pembelajaran:** Memahami & Mengaplikasi.

---

### II. STRUKTUR SLIDE PRESENTASI LENGKAP

#### Slide 1: Gerbang Penjelajah Hayati
- **Visual:** Foto makro keanekaragaman flora dan fauna Indonesia dengan tipografi modern yang menginspirasi.
- **Poin Materi:** 
  * Selamat Datang di Dunia Klasifikasi Makhluk Hidup
  * Tujuan Pembelajaran: Mengungkap misteri pengelompokan makhluk hidup di sekitar kita
- **Catatan Guru:** "Selamat pagi para saintis muda! Hari ini kita akan menjadi detektif alam semesta untuk menyingkap bagaimana jutaan makhluk hidup saling terhubung."

#### Slide 2: Fenomena Nyata (Batu vs Pohon Mangga)
- **Visual:** Gambar berdampingan antara batu kali berlumut dan tunas pohon mangga yang sedang bertumbuh.
- **Poin Materi:**
  * Apakah keduanya sama-sama bernyawa?
  * Mengapa satu bertumbuh dan yang lain tidak berubah bentuk selama puluhan tahun?
- **Catatan Guru:** "Coba amati kedua objek ini. Apa bukti tak terbantahkan bahwa salah satunya adalah makhluk hidup?"

#### Slide 3: 5 Ciri Mutlak Makhluk Hidup
- **Visual:** Kartu 5 ikon interaktif: Bernapas, Bergerak, Membutuhkan Nutrisi, Tumbuh & Berkembang, Peka terhadap Rangsang.
- **Poin Materi:**
  * Eksplorasi karakteristik esensial secara logis dan ilmiah.
- **Catatan Guru:** "Kelima ciri ini bekerja serempak sebagai sistem kehidupan yang seimbang."

#### Slide 4: Kunci Determinasi Sederhana (Alur Dikotomi)
- **Visual:** Diagram pohon keputusan (Decision Tree) dengan cabang 1a/1b dan 2a/2b.
- **Poin Materi:**
  * 1a. Tumbuhan berpembuluh ...... (Lanjut ke nomor 2)
  * 1b. Tumbuhan tidak berpembuluh ...... Lumut (Bryophyta)
- **Catatan Guru:** "Kunci determinasi adalah kompas kita. Cukup jawab Ya atau Tidak berdasarkan bukti fisik yang kalian amati."

#### Slide 5: Investigasi Lapangan Kolaboratif
- **Visual:** Ilustrasi murid bekerja sama meneliti spesimen daun di atas meja laboratorium.
- **Poin Materi:**
  * Ambil 2 sampel daun dari taman sekolah.
  * Telusuri venasi daunnya bersama kelompok.
- **Catatan Guru:** "Gunakan keterampilan bernalar kritis dan saling berbagi peran dalam kelompok."

#### Slide 6: Refleksi & Komitmen Berkesadaran
- **Visual:** Ilustrasi bumi hijau lestari dengan kutipan bijak.
- **Poin Materi:**
  * Apa yang kita pelajari hari ini tentang kebesaran Sang Pencipta dan keteraturan alam?
  * Apa komitmen kita menjaga keanekaragaman hayati?
- **Catatan Guru:** "Mengetahui nama dan peran makhluk hidup adalah langkah awal untuk mencintai dan melestarikan lingkungan."`,
    },
    createdAt: '2025-08-14T08:00:00.000Z',
    updatedAt: '2025-08-14T08:30:00.000Z',
  },
  {
    id: 'med-demo-2',
    guru: 'Asep Fajar Pratama, S.Pd., Gr.',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelasFase: 'Kelas VII-A (Fase D)',
    rppId: 'plan-demo-1',
    rppJudul: 'Klasifikasi Makhluk Hidup & Keanekaragaman Hayati',
    tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi karakteristik makhluk hidup serta mengelompokkan spesimen tumbuhan dan hewan sederhana melalui kunci determinasi sederhana dengan bernalar kritis.',
    materiPokok: 'Karakteristik & Klasifikasi Makhluk Hidup di Lingkungan Sekitar',
    subMateri: 'Pengelompokan Hewan Avertebrata dan Vertebrata',
    alokasiWaktu: '2 JP (2 x 40 menit)',
    karakteristikPesertaDidik: 'Menyukai format audio bercerita dan audio-visual interaktif',
    modelMetode: 'Inkuiri Berbasis Cerita Fenomena',
    dimensiProfilLulusan: ['Penalaran Kritis', 'Komunikasi', 'Kewargaan'],
    kategori: 'Audio',
    jenisMedia: 'Podcast Edukasi Dialogis & Storytelling',
    judul: 'Podcast Sains: Petualangan Detektif Hayati di Kebun Sekolah',
    versi: 'v1.0',
    status: 'Final',
    tanggal: '2025-08-15',
    kontrolGuru: {
      jenisMedia: 'Podcast Edukasi',
      kategori: 'Audio',
      gayaVisual: 'Suara Alam & Musik Akustik Ceria',
      tingkatKompleksitas: 'Menengah / Standar',
      durasi: '5 Menit',
      bahasa: 'Bahasa Indonesia santai, edukatif, dan ramah remaja SMP',
      orientasiUkuran: 'Universal Audio MP3',
      sasaranPenggunaan: 'Mendengarkan individu / klasikal dengan jeda pemantik',
      instruksiKhusus: 'Sertakan efek suara (SFX) alam dan dialog antara dua murid kritis.',
    },
    analisisAI: {
      karakteristikMateri: 'Kaya akan contoh kasus dan analogi kontekstual.',
      tingkatAbstraksi: 'Rendah (Konkret)',
      kebutuhanVisualisasi: 'Sedang (dapat dilengkapi lembar simak)',
      kebutuhanAudio: 'Sangat Tinggi (melatih mindful listening)',
      kebutuhanDemonstrasi: 'Rendah',
      kebutuhanInteraktivitas: 'Sedang melalui pertanyaan di tengah narasi',
      analisisBebanKognitif: 'Alur cerita 2 tokoh memudahkan murid mengingat konsep tanpa jenuh.',
      rekomendasiStrategi: 'Format percakapan sahabat yang memecahkan teka-teki taksonomi serangga.',
    },
    rancangan: {
      judul: 'Naskah Podcast Edukasi: Jejak Kaki Misterius di Balik Dedaunan',
      tujuanPembelajaran: 'Peserta didik mampu menjelaskan prinsip pengelompokan makhluk hidup melalui analisis auditori fenomena nyata.',
      materi: 'Karakteristik & Klasifikasi Makhluk Hidup',
      sasaranPesertaDidik: 'Siswa SMP Kelas VII yang membutuhkan stimulasi auditori dan imajinasi.',
      strukturMedia: 'Intro Musik Menenangkan → Percakapan Masalah Nyata → Pembedahan Konsep Inti → Pertanyaan Simak Cepat → Outro Reflektif',
      urutanIsi: [
        '00:00 - 00:30: Musik pembuka ceria & salam narator santai',
        '00:30 - 01:45: Temuan serangga aneh di taman sekolah oleh Rian & Zahra',
        '01:45 - 03:30: Analisis ciri morfologi: jumlah kaki, segmen tubuh, dan sayap',
        '03:30 - 04:30: Tantangan bagi pendengar di kelas',
        '04:30 - 05:00: Kesimpulan dan musik penutup inspiratif',
      ],
      visual: 'Cover podcast bergambar kaca pembesar dan daun hijau.',
      narasi: 'Tokoh: Narator/Guru yang hangat, Rian (murid penasaran), dan Zahra (murid cermat).',
      aktivitasInteraksi: 'Murid menyimak dan mencatat 3 ciri serangga yang disebutkan dalam dialog.',
      pertanyaanPemantik: [
        'Mengapa serangga dengan 6 kaki dan laba-laba dengan 8 kaki dimasukkan ke kelas yang berbeda?',
      ],
      evaluasi: 'Lembar simak 2 butir pertanyaan di LKPD.',
      durasi: '5 Menit',
    },
    produkMedia: {
      naskahAudio: `[INTRO: Musik akustik riang mengalun 5 detik, lalu mengecil perlahan]
NARATOR: "Halo sahabat pembelajar hebat! Selamat datang di Podcast Sains Nusantara. Pernahkah kalian menatap kebun sekolah dan menyadari betapa ramainya kehidupan di sana? Pasang telinga kalian, karena petualangan detektif hayati dimulai sekarang!"

[SFX: Suara langkah kaki di jalan setapak, desau angin lembut]
RIAN: "Zahra, coba sini sebentar! Lihat makhluk kecil yang ada di balik daun melati ini!"
ZAHRA: "Wah, unik sekali Rian! Badannya beruas-ruas, warnanya hijau zamrud, dan... tunggu, coba hitung kakinya!"
RIAN: "Satu, dua, tiga di sebelah kiri... dan tiga di sebelah kanan! Totalnya ada enam kaki, Zahra!"
ZAHRA: "Enam kaki alias tiga pasang! Menurut materi yang baru kita pelajari, itu ciri utama kelas Insecta atau serangga!"

[SFX: Suara lonceng pemantik konsentrasi 'Ting!']
NARATOR: "Tepat sekali, Zahra! Pengelompokan makhluk hidup dimulai dari ketelitian mengamati ciri fisiknya. Tiga pasang kaki, tubuh terbagi menjadi kepala, dada, dan perut. Sekarang sahabat pendengar di kelas, bisakah kalian menyebutkan satu contoh serangga lain yang memiliki ciri serupa?"

[JEDA MUSIK: 3 detik untuk memberi ruang berpikir siswa]
RIAN: "Kupu-kupu, belalang, semut... semuanya serangga ya!"
ZAHRA: "Betul! Dan keteraturan ini membuktikan bahwa alam semesta diciptakan dengan harmoni yang luar biasa."

[OUTRO: Musik akustik penutup mengalun meriah]
NARATOR: "Luar biasa! Jadilah pembelajar yang berkesadaran, teruslah mengamati, dan cintai lingkungan sekitar kita. Sampai jumpa di episode detektif sains berikutnya!"`,
      materiSiapGunakan: 'Naskah audio lengkap siap rekam atau disuarakan langsung dengan sistem Text-to-Speech (TTS).',
      markdownLengkap: `# NASKAH REKAMAN PODCAST: DETEKTIF HAYATI
**Durasi:** 5 Menit  
**Karakter:** Narator, Rian, Zahra  
**Tujuan Pembelajaran:** Melatih mindful listening dan identifikasi ciri Insecta.`,
    },
    createdAt: '2025-08-15T09:00:00.000Z',
    updatedAt: '2025-08-15T09:40:00.000Z',
  },
];

