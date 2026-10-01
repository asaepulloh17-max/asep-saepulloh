import {
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  PesertaDidik,
  RencanaAsesmenItem,
  NilaiSiswa,
  TindakLanjutData,
  RefleksiEvaluasiData,
} from '../types';

export const SHEET_NAMES = {
  PROFIL: 'Profil_Guru',
  SISWA: 'Peserta_Didik',
  PERENCANAAN: 'Perencanaan_RPP',
  JURNAL: 'Jurnal_Mengajar',
  ASESMEN: 'Rencana_Asesmen',
  NILAI: 'Nilai_Asesmen',
  TINDAK_LANJUT: 'Tindak_Lanjut',
  REFLEKSI: 'Refleksi_Guru',
  PANDUAN: 'Panduan_AppSheet',
} as const;

export interface SyncDataPayload {
  profile: TeacherProfile;
  siswa: PesertaDidik[];
  perencanaan: Perencanaan[];
  jurnal: JurnalMengajar[];
  asesmen: RencanaAsesmenItem[];
  nilai: NilaiSiswa[];
  tindakLanjut: TindakLanjutData[];
  refleksi: RefleksiEvaluasiData[];
}

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  syncedAt: string;
  summary: {
    siswaCount: number;
    perencanaanCount: number;
    jurnalCount: number;
    asesmenCount: number;
    nilaiCount: number;
    tindakLanjutCount: number;
    refleksiCount: number;
  };
}

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'gsa_google_sheet_id_v1',
  SPREADSHEET_URL: 'gsa_google_sheet_url_v1',
  SPREADSHEET_TITLE: 'gsa_google_sheet_title_v1',
  LAST_SYNC: 'gsa_google_sheet_last_sync_v1',
};

export const getStoredSpreadsheetInfo = () => {
  return {
    id: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID) || '',
    url: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_URL) || '',
    title: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_TITLE) || '',
    lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || '',
  };
};

export const saveStoredSpreadsheetInfo = (id: string, url: string, title: string) => {
  localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
  localStorage.setItem(STORAGE_KEYS.SPREADSHEET_URL, url);
  localStorage.setItem(STORAGE_KEYS.SPREADSHEET_TITLE, title);
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

export const clearStoredSpreadsheetInfo = () => {
  localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_URL);
  localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_TITLE);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
};

/**
 * Format headers and rows for each table to be 100% AppSheet-friendly.
 */
function buildProfilValues(p: TeacherProfile): any[][] {
  const headers = [
    'ID',
    'Nama Guru',
    'NIP',
    'NUPTK',
    'Mata Pelajaran',
    'Nama Sekolah',
    'NPSN',
    'Alamat Sekolah',
    'Tahun Pelajaran',
    'Semester Aktif',
    'Fase',
    'Daftar Kelas',
    'Kelas Aktif',
    'KKTP Default',
    'Kepala Sekolah',
    'NIP Kepala Sekolah',
    'Terakhir Diperbarui',
  ];
  const row = [
    p.id || 'GURU_1',
    p.namaGuru || '',
    p.nip || '',
    p.nuptk || '',
    p.mataPelajaran || '',
    p.namaSekolah || '',
    p.npsn || '',
    p.alamatSekolah || '',
    p.tahunPelajaran || '',
    p.semesterAktif || 'Ganjil',
    p.fase || 'Fase D (SMP)',
    (p.kelasList || []).join(', '),
    p.kelasAktif || '',
    p.kktpDefault || 75,
    p.kepalaSekolah?.nama || '',
    p.kepalaSekolah?.nip || '',
    p.updatedAt || new Date().toISOString(),
  ];
  return [headers, row];
}

function buildSiswaValues(list: PesertaDidik[]): any[][] {
  const headers = ['ID', 'NIS', 'NISN', 'Nama Peserta Didik', 'Kelas', 'Jenis Kelamin'];
  const rows = list.map((s) => [
    s.id,
    s.nis || '',
    s.nisn || '',
    s.nama,
    s.kelas,
    s.jenisKelamin || 'L',
  ]);
  return [headers, ...rows];
}

function buildPerencanaanValues(list: Perencanaan[]): any[][] {
  const headers = [
    'ID',
    'Judul RPP / Modul',
    'Status',
    'Mata Pelajaran',
    'Kelas',
    'Semester',
    'Tahun Pelajaran',
    'Alokasi Waktu',
    'Topik Materi',
    'Capaian Pembelajaran',
    'Tujuan Pembelajaran',
    'Indikator Ketercapaian',
    'Model & Metode',
    'Kegiatan Pendahuluan',
    'Kegiatan Inti',
    'Kegiatan Penutup',
    'Teknik Asesmen',
    'Instrumen Asesmen',
    'Prinsip Mindful',
    'Prinsip Meaningful',
    'Prinsip Joyful',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((p) => [
    p.id,
    p.judul,
    p.status,
    p.identitas?.mataPelajaran || '',
    p.identitas?.kelas || '',
    p.identitas?.semester || 'Ganjil',
    p.identitas?.tahunPelajaran || '',
    p.identitas?.alokasiWaktu || '',
    p.identitas?.topikMateri || '',
    p.tujuanPembelajaran?.capaianPembelajaran || '',
    p.tujuanPembelajaran?.tujuanPembelajaran || '',
    p.tujuanPembelajaran?.indikatorKetercapaian || '',
    p.desainPembelajaran?.modelMetode || '',
    p.rencanaKegiatan?.pendahuluan || '',
    p.rencanaKegiatan?.kegiatanInti || '',
    p.rencanaKegiatan?.penutup || '',
    p.rencanaAsesmen?.teknikAsesmen || '',
    p.rencanaAsesmen?.instrumenAsesmen || '',
    p.prinsipPembelajaranMendalam?.berkesadaran || '',
    p.prinsipPembelajaranMendalam?.bermakna || '',
    p.prinsipPembelajaranMendalam?.menggembirakan || '',
    p.updatedAt || p.createdAt || '',
  ]);
  return [headers, ...rows];
}

function buildJurnalValues(list: JurnalMengajar[]): any[][] {
  const headers = [
    'ID',
    'Perencanaan ID',
    'Pertemuan Ke',
    'Tanggal',
    'Kelas',
    'Mata Pelajaran',
    'Jam Pelajaran',
    'Topik Materi',
    'Tujuan Pembelajaran',
    'Kegiatan Terlaksana',
    'Presensi Hadir',
    'Presensi Sakit',
    'Presensi Izin',
    'Presensi Alpa',
    'Catatan Siswa Absen',
    'Kendala / Hambatan',
    'Solusi / Tindak Lanjut',
    'Refleksi Guru',
    'Status Pelaksanaan',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((j) => {
    const p = j.presensi || j.kehadiran || { hadir: 0, sakit: 0, izin: 0, alpa: 0, siswaAbsen: [] };
    return [
      j.id,
      j.perencanaId || '',
      j.pertemuanKe || 1,
      j.tanggal || '',
      j.kelas || '',
      j.mataPelajaran || '',
      j.jamPelajaran || j.jamKe || '',
      j.topikMateri || '',
      j.tujuanPembelajaran || '',
      j.kegiatanTerlaksana || '',
      p.hadir || 0,
      p.sakit || 0,
      p.izin || 0,
      p.alpa || 0,
      (p.siswaAbsen || []).join(', '),
      j.kendala || j.catatanKendala || '',
      j.solusiTindakan || j.tindakLanjut || '',
      j.refleksiGuru || '',
      j.status || 'Terlaksana',
      j.updatedAt || j.createdAt || '',
    ];
  });
  return [headers, ...rows];
}

function buildAsesmenValues(list: RencanaAsesmenItem[]): any[][] {
  const headers = [
    'ID',
    'Perencanaan ID',
    'Judul Asesmen',
    'Mata Pelajaran',
    'Kelas',
    'Topik Materi',
    'Jenis Asesmen',
    'Bentuk Asesmen',
    'Teknik Asesmen',
    'KKTP Target',
    'Waktu Pelaksanaan',
    'Tujuan Pembelajaran',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((a) => [
    a.id,
    a.perencanaId || '',
    a.judulAsesmen,
    a.mataPelajaran || '',
    a.kelas || '',
    a.topikMateri || '',
    a.jenisAsesmen || 'Formatif',
    a.bentukAsesmen || 'Tes Tertulis',
    a.teknikAsesmen || '',
    a.kktpTarget || 75,
    a.waktuPelaksanaan || '',
    a.tujuanPembelajaran || '',
    a.updatedAt || a.createdAt || '',
  ]);
  return [headers, ...rows];
}

function buildNilaiValues(list: NilaiSiswa[]): any[][] {
  const headers = [
    'ID',
    'Asesmen ID',
    'Siswa ID',
    'Nama Siswa',
    'NISN',
    'Kelas',
    'Nilai Angka',
    'Status Ketercapaian',
    'Catatan Deskripsi Guru',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((n) => [
    n.id,
    n.asesmenId,
    n.siswaId,
    n.namaSiswa,
    n.nisn || '',
    n.kelas,
    n.nilaiAngka ?? n.nilai ?? 0,
    n.statusKetercapaian || (n.nilaiAngka >= 75 ? 'Tercapai' : 'Belum Tercapai'),
    n.catatanDeskripsi || n.catatanGuru || '',
    n.updatedAt || '',
  ]);
  return [headers, ...rows];
}

function buildTindakLanjutValues(list: TindakLanjutData[]): any[][] {
  const headers = [
    'ID',
    'Asesmen ID',
    'Kelas',
    'Topik Materi',
    'KKTP Target',
    'Daftar Siswa Remedial',
    'Materi Remedial',
    'Bentuk Kegiatan Remedial',
    'Jadwal Remedial',
    'Daftar Siswa Pengayaan',
    'Materi Pengayaan',
    'Bentuk Kegiatan Pengayaan',
    'Jadwal Pengayaan',
    'Catatan Hasil Evaluasi',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((t) => [
    t.id,
    t.asesmenId,
    t.kelas,
    t.topikMateri,
    t.kktpTarget,
    (t.programRemedial?.daftarSiswa || []).join(', '),
    t.programRemedial?.materiPengulangan || '',
    t.programRemedial?.bentukKegiatan || '',
    t.programRemedial?.jadwalPelaksanaan || '',
    (t.programPengayaan?.daftarSiswa || []).join(', '),
    t.programPengayaan?.materiPengayaan || '',
    t.programPengayaan?.bentukKegiatan || '',
    t.programPengayaan?.jadwalPelaksanaan || '',
    t.catatanHasil || '',
    t.updatedAt || '',
  ]);
  return [headers, ...rows];
}

function buildRefleksiValues(list: RefleksiEvaluasiData[]): any[][] {
  const headers = [
    'ID',
    'Asesmen ID',
    'Kelas',
    'Topik Materi',
    'Apa Yang Berjalan Efektif',
    'Apa Yang Belum Berhasil',
    'Respon Peserta Didik',
    'Rencana Tindakan Perbaikan',
    'Terakhir Diperbarui',
  ];
  const rows = list.map((r) => [
    r.id,
    r.asesmenId,
    r.kelas,
    r.topikMateri,
    r.apaYangBerjalanEfektif,
    r.apaYangBelumBerhasil,
    r.responPesertaDidik,
    r.rencanaPerbaikan,
    r.updatedAt || '',
  ]);
  return [headers, ...rows];
}

function buildPanduanAppSheetValues(): any[][] {
  return [
    ['PANDUAN INTEGRASI GOOGLE APPSHEET & GURU SMART ADMIN'],
    [''],
    ['1. CARA MEMBUAT APLIKASI DI GOOGLE APPSHEET:'],
    ['- Buka portal Google AppSheet di https://www.appsheet.com/start'],
    ['- Klik tombol "Create" -> pilih "App" -> pilih "Start with existing data"'],
    ['- Beri nama aplikasi (contoh: "Guru Smart SMP Mobile") dan pilih kategori "Education"'],
    ['- Pilih data source: Google Sheets, lalu pilih berkas spreadsheet ini ("Guru Smart Admin - Data Pembelajaran & AppSheet")'],
    ['- AppSheet akan otomatis mendeteksi sheet "Peserta_Didik" dan membuatkan antarmuka mobile/tablet secara instan!'],
    [''],
    ['2. MENAMBAHKAN TABEL LAINNYA DI APPSHEET:'],
    ['- Pada AppSheet Editor, klik menu "Data" -> klik "+ Add Table"'],
    ['- Tambahkan tabel-tabel berikut: Jurnal_Mengajar, Perencanaan_RPP, Rencana_Asesmen, Nilai_Asesmen, Tindak_Lanjut, Profil_Guru'],
    [''],
    ['3. RELASI ANTAR TABEL (REF COLUMNS):'],
    ['- Pada tabel "Nilai_Asesmen": Kolom "Siswa ID" ubah tipenya menjadi "Ref" dengan target tabel "Peserta_Didik"'],
    ['- Pada tabel "Nilai_Asesmen": Kolom "Asesmen ID" ubah tipenya menjadi "Ref" dengan target tabel "Rencana_Asesmen"'],
    ['- Pada tabel "Jurnal_Mengajar": Kolom "Perencanaan ID" ubah tipenya menjadi "Ref" dengan target tabel "Perencanaan_RPP"'],
    ['- Dengan relasi ini, Anda bisa melihat nilai & absensi langsung dari profil setiap siswa di HP Anda!'],
    [''],
    ['4. SINKRONISASI DUA ARAH:'],
    ['- Data yang Anda input atau perbarui lewat aplikasi Guru Smart Admin akan masuk ke spreadsheet ini saat Anda klik Sinkronkan.'],
    ['- Data yang diinput oleh guru/staf di lapangan lewat Google AppSheet juga tersimpan di sini dan bisa ditarik kembali ke Guru Smart Admin.'],
  ];
}

/**
 * Creates a new Google Spreadsheet with all required tabs.
 */
async function createNewSpreadsheet(accessToken: string, title?: string): Promise<{ id: string; url: string; title: string }> {
  const sheetTitle = title || `Guru Smart Admin - Data Pembelajaran & AppSheet (${new Date().toLocaleDateString('id-ID')})`;
  
  const allSheets = Object.values(SHEET_NAMES).map((name) => ({
    properties: {
      title: name,
      gridProperties: {
        frozenRowCount: name === SHEET_NAMES.PANDUAN ? 0 : 1,
      },
    },
  }));

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: allSheets,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat Google Spreadsheet baru (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || sheetTitle,
  };
}

/**
 * Checks an existing spreadsheet and adds any missing sheet tabs.
 */
async function ensureSheetsExist(accessToken: string, spreadsheetId: string): Promise<string> {
  const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!getRes.ok) {
    throw new Error(`Spreadsheet dengan ID ${spreadsheetId} tidak ditemukan atau Anda tidak memiliki hak akses.`);
  }

  const meta = await getRes.json();
  const existingSheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
  const requiredSheets = Object.values(SHEET_NAMES);
  const missingSheets = requiredSheets.filter((name) => !existingSheetTitles.includes(name));

  if (missingSheets.length > 0) {
    const addRequests = missingSheets.map((name) => ({
      addSheet: {
        properties: {
          title: name,
          gridProperties: {
            frozenRowCount: name === SHEET_NAMES.PANDUAN ? 0 : 1,
          },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: addRequests,
      }),
    });
  }

  return meta.properties?.title || 'Guru Smart Admin - Data Pembelajaran & AppSheet';
}

/**
 * Format headers with styling (indigo background, white bold text, freeze row).
 */
async function applyHeaderStyling(accessToken: string, spreadsheetId: string) {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return;
    const meta = await metaRes.json();

    const requests: any[] = [];
    (meta.sheets || []).forEach((s: any) => {
      const sheetId = s.properties?.sheetId;
      const sheetTitle = s.properties?.title;
      if (sheetTitle === SHEET_NAMES.PANDUAN) return;

      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.28, green: 0.35, blue: 0.85 }, // Indigo-600
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10,
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      });
      // Auto resize columns
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 25,
          },
        },
      });
    });

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  } catch (err) {
    console.warn('Gagal memberikan format warna header pada spreadsheet:', err);
  }
}

/**
 * Push all application data to Google Sheets.
 */
export async function syncAllDataToGoogleSheets(
  accessToken: string,
  data: SyncDataPayload,
  targetSpreadsheetId?: string,
): Promise<SyncResult> {
  let spreadsheetId = targetSpreadsheetId?.trim() || getStoredSpreadsheetInfo().id;
  let spreadsheetUrl = '';
  let spreadsheetTitle = '';

  if (!spreadsheetId) {
    const created = await createNewSpreadsheet(accessToken);
    spreadsheetId = created.id;
    spreadsheetUrl = created.url;
    spreadsheetTitle = created.title;
  } else {
    spreadsheetTitle = await ensureSheetsExist(accessToken, spreadsheetId);
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // Clear existing values in tabs to prevent row leftovers
  const clearRanges = Object.values(SHEET_NAMES).map((name) => `${name}!A1:Z2000`);
  for (const range of clearRanges) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      // Ignore clear errors on fresh tabs
    }
  }

  // Build values
  const profilValues = buildProfilValues(data.profile);
  const siswaValues = buildSiswaValues(data.siswa);
  const perencanaanValues = buildPerencanaanValues(data.perencanaan);
  const jurnalValues = buildJurnalValues(data.jurnal);
  const asesmenValues = buildAsesmenValues(data.asesmen);
  const nilaiValues = buildNilaiValues(data.nilai);
  const tindakLanjutValues = buildTindakLanjutValues(data.tindakLanjut);
  const refleksiValues = buildRefleksiValues(data.refleksi);
  const panduanValues = buildPanduanAppSheetValues();

  const batchData = [
    { range: `${SHEET_NAMES.PROFIL}!A1`, values: profilValues },
    { range: `${SHEET_NAMES.SISWA}!A1`, values: siswaValues },
    { range: `${SHEET_NAMES.PERENCANAAN}!A1`, values: perencanaanValues },
    { range: `${SHEET_NAMES.JURNAL}!A1`, values: jurnalValues },
    { range: `${SHEET_NAMES.ASESMEN}!A1`, values: asesmenValues },
    { range: `${SHEET_NAMES.NILAI}!A1`, values: nilaiValues },
    { range: `${SHEET_NAMES.TINDAK_LANJUT}!A1`, values: tindakLanjutValues },
    { range: `${SHEET_NAMES.REFLEKSI}!A1`, values: refleksiValues },
    { range: `${SHEET_NAMES.PANDUAN}!A1`, values: panduanValues },
  ];

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Gagal menulis data ke Google Sheets (${updateRes.status}): ${errText}`);
  }

  // Apply styling to headers
  await applyHeaderStyling(accessToken, spreadsheetId);

  // Persist spreadsheet metadata in storage
  saveStoredSpreadsheetInfo(spreadsheetId, spreadsheetUrl, spreadsheetTitle);

  return {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetTitle,
    syncedAt: new Date().toISOString(),
    summary: {
      siswaCount: data.siswa.length,
      perencanaanCount: data.perencanaan.length,
      jurnalCount: data.jurnal.length,
      asesmenCount: data.asesmen.length,
      nilaiCount: data.nilai.length,
      tindakLanjutCount: data.tindakLanjut.length,
      refleksiCount: data.refleksi.length,
    },
  };
}

/**
 * Fetch and import data from the Google Spreadsheet back into the app.
 */
export async function pullDataFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
): Promise<{
  profile?: Partial<TeacherProfile>;
  siswa?: PesertaDidik[];
  jurnal?: Partial<JurnalMengajar>[];
  nilai?: Partial<NilaiSiswa>[];
}> {
  const ranges = [
    `${SHEET_NAMES.PROFIL}!A1:Q5`,
    `${SHEET_NAMES.SISWA}!A1:F500`,
    `${SHEET_NAMES.JURNAL}!A1:T500`,
    `${SHEET_NAMES.NILAI}!A1:J1000`,
  ];

  const queryParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membaca data dari Google Sheets (${res.status}): ${errText}`);
  }

  const result = await res.json();
  const valueRanges: { range: string; values?: any[][] }[] = result.valueRanges || [];

  const getRows = (sheetName: string): any[][] => {
    const found = valueRanges.find((vr) => vr.range && vr.range.includes(sheetName));
    const all = found?.values || [];
    return all.length > 1 ? all.slice(1) : []; // skip header row
  };

  // 1. Profil
  const profilRows = getRows(SHEET_NAMES.PROFIL);
  let parsedProfile: Partial<TeacherProfile> | undefined;
  if (profilRows.length > 0) {
    const r = profilRows[0];
    parsedProfile = {
      namaGuru: r[1] || '',
      nip: r[2] || '',
      nuptk: r[3] || '',
      mataPelajaran: r[4] || '',
      namaSekolah: r[5] || '',
      npsn: r[6] || '',
      alamatSekolah: r[7] || '',
      tahunPelajaran: r[8] || '',
      semesterAktif: (r[9] === 'Genap' ? 'Genap' : 'Ganjil') as 'Ganjil' | 'Genap',
      fase: r[10] || '',
      kelasList: r[11] ? String(r[11]).split(',').map((k: string) => k.trim()) : undefined,
      kelasAktif: r[12] || '',
      kktpDefault: Number(r[13]) || 75,
      kepalaSekolah: {
        nama: r[14] || '',
        nip: r[15] || '',
      },
    };
  }

  // 2. Siswa
  const siswaRows = getRows(SHEET_NAMES.SISWA);
  const parsedSiswa: PesertaDidik[] = siswaRows.map((r, idx) => ({
    id: r[0] || `SISWA_${Date.now()}_${idx}`,
    nis: r[1] || '',
    nisn: r[2] || '',
    nama: r[3] || 'Nama Siswa',
    kelas: r[4] || 'VII-A',
    jenisKelamin: r[5] === 'P' ? 'P' : 'L',
  }));

  return {
    profile: parsedProfile,
    siswa: parsedSiswa.length > 0 ? parsedSiswa : undefined,
  };
}
