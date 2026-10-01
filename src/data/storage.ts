import {
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  PesertaDidik,
  RencanaAsesmenItem,
  NilaiSiswa,
  TindakLanjutData,
  RefleksiEvaluasiData,
  normalizeDimensiProfilName,
  MediaRecord,
} from '../types';
import {
  initialTeacherProfile,
  demoPerencanaanList,
  demoJurnalList,
  demoPesertaDidikList,
  demoRencanaAsesmenList,
  demoNilaiList,
  demoTindakLanjutList,
  demoRefleksiList,
  demoMediaLibraryList,
} from './mockData';

const STORAGE_KEYS = {
  PROFILE: 'gsa_profile_v1',
  PERENCANAAN: 'gsa_perencanaan_v1',
  JURNAL: 'gsa_jurnal_v1',
  SISWA: 'gsa_siswa_v1',
  ASESMEN: 'gsa_asesmen_v1',
  NILAI: 'gsa_nilai_v1',
  TINDAK_LANJUT: 'gsa_tindak_lanjut_v1',
  REFLEKSI: 'gsa_refleksi_v1',
  MEDIA_LIBRARY: 'gsa_media_library_v1',
  INITIALIZED: 'gsa_initialized_v1',
};

// Helper safely parse JSON
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Gagal membaca localStorage key [${key}]:`, err);
    return fallback;
  }
}

// Helper safely set JSON
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Gagal menyimpan localStorage key [${key}]:`, err);
  }
}

// Ensure initial data exists if first time opening
export function initializeStorageIfEmpty(): void {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    safeSet(STORAGE_KEYS.PROFILE, initialTeacherProfile);
    safeSet(STORAGE_KEYS.PERENCANAAN, demoPerencanaanList);
    safeSet(STORAGE_KEYS.JURNAL, demoJurnalList);
    safeSet(STORAGE_KEYS.SISWA, demoPesertaDidikList);
    safeSet(STORAGE_KEYS.ASESMEN, demoRencanaAsesmenList);
    safeSet(STORAGE_KEYS.NILAI, demoNilaiList);
    safeSet(STORAGE_KEYS.TINDAK_LANJUT, demoTindakLanjutList);
    safeSet(STORAGE_KEYS.REFLEKSI, demoRefleksiList);
    safeSet(STORAGE_KEYS.MEDIA_LIBRARY, demoMediaLibraryList);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } else if (!localStorage.getItem(STORAGE_KEYS.MEDIA_LIBRARY)) {
    safeSet(STORAGE_KEYS.MEDIA_LIBRARY, demoMediaLibraryList);
  }
}

// --- PROFILE ---
export function getProfile(): TeacherProfile {
  const loaded = safeGet<TeacherProfile>(STORAGE_KEYS.PROFILE, initialTeacherProfile);
  if (!loaded.kepalaSekolah || !loaded.kepalaSekolah.nama) {
    loaded.kepalaSekolah = {
      nama: loaded.kepalaSekolah?.nama || initialTeacherProfile.kepalaSekolah.nama,
      nip: loaded.kepalaSekolah?.nip || initialTeacherProfile.kepalaSekolah.nip,
    };
  }
  return loaded;
}

export function saveProfile(profile: TeacherProfile): void {
  safeSet(STORAGE_KEYS.PROFILE, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

// Helper to normalize and validate 8 Dimensi Profil Lulusan
function normalizePlanDimensi(plan: Perencanaan): Perencanaan {
  if (!plan || !plan.identifikasi) return plan;
  const currentDimensi = plan.identifikasi.dimensiProfilLulusan || [];
  const normalized = Array.from(
    new Set(
      currentDimensi
        .map((d) => normalizeDimensiProfilName(d))
        .filter(Boolean)
    )
  );
  return {
    ...plan,
    identifikasi: {
      ...plan.identifikasi,
      dimensiProfilLulusan: normalized,
    },
  };
}

// --- PERENCANAAN (Modul 1) ---
export function getPerencanaanList(): Perencanaan[] {
  const rawList = safeGet<Perencanaan[]>(STORAGE_KEYS.PERENCANAAN, demoPerencanaanList);
  return rawList.map((p) => normalizePlanDimensi(p));
}

export function savePerencanaan(item: Perencanaan): void {
  const normalizedItem = normalizePlanDimensi(item);
  const list = getPerencanaanList();
  const index = list.findIndex((p) => p.id === normalizedItem.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    list[index] = { ...normalizedItem, updatedAt: now };
  } else {
    list.unshift({ ...normalizedItem, createdAt: now, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.PERENCANAAN, list);
}

export function deletePerencanaan(id: string): void {
  const list = getPerencanaanList().filter((p) => p.id !== id);
  safeSet(STORAGE_KEYS.PERENCANAAN, list);
}

export function duplicatePerencanaan(id: string): Perencanaan | null {
  const list = getPerencanaanList();
  const source = list.find((p) => p.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const clone: Perencanaan = {
    ...source,
    id: 'plan-' + Date.now(),
    judul: `${source.judul} (Salinan)`,
    status: 'Draf',
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(clone);
  safeSet(STORAGE_KEYS.PERENCANAAN, list);
  return clone;
}

// --- LIBRARY MEDIA PEMBELAJARAN ---
export function getMediaLibrary(): MediaRecord[] {
  return safeGet<MediaRecord[]>(STORAGE_KEYS.MEDIA_LIBRARY, demoMediaLibraryList);
}

export function saveMediaRecord(item: MediaRecord): void {
  const list = getMediaLibrary();
  const index = list.findIndex((m) => m.id === item.id);
  const now = new Date().toISOString();
  const recordToSave = { ...item, updatedAt: now };

  if (index >= 0) {
    list[index] = recordToSave;
  } else {
    list.unshift({ ...recordToSave, createdAt: item.createdAt || now });
  }
  safeSet(STORAGE_KEYS.MEDIA_LIBRARY, list);

  // Synchronize to linked Perencanaan if rppId exists
  if (item.rppId) {
    try {
      const planList = getPerencanaanList();
      const planIndex = planList.findIndex((p) => p.id === item.rppId);
      if (planIndex >= 0) {
        const plan = planList[planIndex];
        const currentMediaList = plan.mediaPembelajaranList || [];
        const existingIdx = currentMediaList.findIndex((m) => m.id === item.id);
        const mappedMediaItem = {
          id: item.id,
          kategori: item.kategori === 'Interaktif' ? ('Multimedia-Interaktif' as const) : item.kategori,
          jenisSpesifik: item.jenisMedia,
          namaMedia: item.judul,
          alatBahanAplikasi: item.kontrolGuru?.gayaVisual || 'Canva / PPT / Media Studio',
          deskripsiRingkas: item.rancangan.tujuanPembelajaran,
          keselarasan: {
            materiPokok: item.materiPokok,
            tujuanPembelajaran: item.tujuanPembelajaran,
            indikatorKetercapaian: 'Peserta didik memahami konsep secara mendalam dan mengaplikasikannya.',
            pengalamanBelajar: {
              tahap: 'Memahami' as const,
              deskripsiPeran: item.rancangan.aktivitasInteraksi,
            },
            prinsipDeepLearning: {
              berkesadaran: item.analisisAI?.kebutuhanAudio || 'Memusatkan perhatian sadar pada materi.',
              bermakna: item.rancangan.visual || 'Menghubungkan konsep dengan konteks nyata.',
              menggembirakan: 'Interaksi aktif dan apresiasi kemajuan belajar.',
            },
          },
          naskahRancanganLengkap: item.produkMedia?.markdownLengkap || item.rancangan.narasi || '',
          slidesPPT: item.produkMedia?.slidesPPT,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };

        if (existingIdx >= 0) {
          currentMediaList[existingIdx] = mappedMediaItem;
        } else {
          currentMediaList.push(mappedMediaItem);
        }
        planList[planIndex] = {
          ...plan,
          mediaPembelajaranList: currentMediaList,
          updatedAt: now,
        };
        safeSet(STORAGE_KEYS.PERENCANAAN, planList);
      }
    } catch (e) {
      console.warn('Sync media to plan failed:', e);
    }
  }
}

export function deleteMediaRecord(id: string): void {
  const list = getMediaLibrary().filter((m) => m.id !== id);
  safeSet(STORAGE_KEYS.MEDIA_LIBRARY, list);
}

// --- JURNAL MENGAJAR (Modul 2) ---
export function getJurnalList(): JurnalMengajar[] {
  return safeGet<JurnalMengajar[]>(STORAGE_KEYS.JURNAL, demoJurnalList);
}

export function saveJurnal(item: JurnalMengajar): void {
  const list = getJurnalList();
  const index = list.findIndex((j) => j.id === item.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    list[index] = { ...item, updatedAt: now };
  } else {
    list.unshift({ ...item, createdAt: now, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.JURNAL, list);
}

export function deleteJurnal(id: string): void {
  const list = getJurnalList().filter((j) => j.id !== id);
  safeSet(STORAGE_KEYS.JURNAL, list);
}

export function duplicateJurnal(id: string): JurnalMengajar | null {
  const list = getJurnalList();
  const source = list.find((j) => j.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const clone: JurnalMengajar = {
    ...source,
    id: 'jurnal-' + Date.now(),
    tanggal: today,
    status: 'Draf',
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(clone);
  safeSet(STORAGE_KEYS.JURNAL, list);
  return clone;
}

// --- PESERTA DIDIK ---
export function getSiswaList(): PesertaDidik[] {
  return safeGet<PesertaDidik[]>(STORAGE_KEYS.SISWA, demoPesertaDidikList);
}

export function saveSiswa(item: PesertaDidik): void {
  const list = getSiswaList();
  const index = list.findIndex((s) => s.id === item.id);
  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }
  safeSet(STORAGE_KEYS.SISWA, list);
}

export function saveSiswaBatch(items: PesertaDidik[], replaceKelas?: string): void {
  let list = getSiswaList();
  if (replaceKelas) {
    list = list.filter((s) => s.kelas !== replaceKelas);
  }
  const map = new Map<string, PesertaDidik>();
  list.forEach((s) => map.set(s.id, s));
  items.forEach((item) => {
    map.set(item.id, item);
  });
  safeSet(STORAGE_KEYS.SISWA, Array.from(map.values()));
}

export function deleteSiswa(id: string): void {
  const list = getSiswaList().filter((s) => s.id !== id);
  safeSet(STORAGE_KEYS.SISWA, list);
}

export function deleteSiswaByKelas(kelas: string): void {
  const list = getSiswaList().filter((s) => s.kelas !== kelas);
  safeSet(STORAGE_KEYS.SISWA, list);
}

// --- RENCANA ASESMEN (Modul 3A) ---
export function getAsesmenList(): RencanaAsesmenItem[] {
  return safeGet<RencanaAsesmenItem[]>(STORAGE_KEYS.ASESMEN, demoRencanaAsesmenList);
}

export function saveAsesmen(item: RencanaAsesmenItem): void {
  const list = getAsesmenList();
  const index = list.findIndex((a) => a.id === item.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    list[index] = { ...item, updatedAt: now };
  } else {
    list.unshift({ ...item, createdAt: now, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.ASESMEN, list);
}

export function deleteAsesmen(id: string): void {
  const list = getAsesmenList().filter((a) => a.id !== id);
  safeSet(STORAGE_KEYS.ASESMEN, list);
  // juga hapus nilai terkait jika diinginkan
  const nilaiList = getNilaiList().filter((n) => n.asesmenId !== id);
  safeSet(STORAGE_KEYS.NILAI, nilaiList);
}

// --- INPUT NILAI (Modul 3B) ---
export function getNilaiList(): NilaiSiswa[] {
  return safeGet<NilaiSiswa[]>(STORAGE_KEYS.NILAI, demoNilaiList);
}

export function saveNilaiBatch(items: NilaiSiswa[]): void {
  const currentList = getNilaiList();
  const map = new Map<string, NilaiSiswa>();
  currentList.forEach((n) => map.set(n.id, n));
  items.forEach((item) => {
    map.set(item.id, { ...item, updatedAt: new Date().toISOString() });
  });
  safeSet(STORAGE_KEYS.NILAI, Array.from(map.values()));
}

export function saveSingleNilai(item: NilaiSiswa): void {
  const list = getNilaiList();
  const idx = list.findIndex((n) => n.id === item.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    list[idx] = { ...item, updatedAt: now };
  } else {
    list.push({ ...item, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.NILAI, list);
}

// --- TINDAK LANJUT (Modul 3D) ---
export function getTindakLanjutList(): TindakLanjutData[] {
  return safeGet<TindakLanjutData[]>(STORAGE_KEYS.TINDAK_LANJUT, demoTindakLanjutList);
}

export function saveTindakLanjut(item: TindakLanjutData): void {
  const list = getTindakLanjutList();
  const index = list.findIndex((t) => t.id === item.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    list[index] = { ...item, updatedAt: now };
  } else {
    list.unshift({ ...item, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.TINDAK_LANJUT, list);
}

export function deleteTindakLanjut(id: string): void {
  const list = getTindakLanjutList().filter((t) => t.id !== id);
  safeSet(STORAGE_KEYS.TINDAK_LANJUT, list);
}

// --- REFLEKSI PEMBELAJARAN (Modul 3E) ---
export function getRefleksiList(): RefleksiEvaluasiData[] {
  return safeGet<RefleksiEvaluasiData[]>(STORAGE_KEYS.REFLEKSI, demoRefleksiList);
}

export function saveRefleksi(item: RefleksiEvaluasiData): void {
  const list = getRefleksiList();
  const index = list.findIndex((r) => r.id === item.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    list[index] = { ...item, updatedAt: now };
  } else {
    list.unshift({ ...item, updatedAt: now });
  }
  safeSet(STORAGE_KEYS.REFLEKSI, list);
}

export function deleteRefleksi(id: string): void {
  const list = getRefleksiList().filter((r) => r.id !== id);
  safeSet(STORAGE_KEYS.REFLEKSI, list);
}

// --- BACKUP & RESET ---
export interface FullAppDataExport {
  version: string;
  exportedAt: string;
  profile: TeacherProfile;
  perencanaan: Perencanaan[];
  jurnal: JurnalMengajar[];
  siswa: PesertaDidik[];
  asesmen: RencanaAsesmenItem[];
  nilai: NilaiSiswa[];
  tindakLanjut: TindakLanjutData[];
  refleksi: RefleksiEvaluasiData[];
}

export function exportFullData(): string {
  const full: FullAppDataExport = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    perencanaan: getPerencanaanList(),
    jurnal: getJurnalList(),
    siswa: getSiswaList(),
    asesmen: getAsesmenList(),
    nilai: getNilaiList(),
    tindakLanjut: getTindakLanjutList(),
    refleksi: getRefleksiList(),
  };
  return JSON.stringify(full, null, 2);
}

export function importFullData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString) as Partial<FullAppDataExport>;
    if (data.profile) safeSet(STORAGE_KEYS.PROFILE, data.profile);
    if (Array.isArray(data.perencanaan)) safeSet(STORAGE_KEYS.PERENCANAAN, data.perencanaan);
    if (Array.isArray(data.jurnal)) safeSet(STORAGE_KEYS.JURNAL, data.jurnal);
    if (Array.isArray(data.siswa)) safeSet(STORAGE_KEYS.SISWA, data.siswa);
    if (Array.isArray(data.asesmen)) safeSet(STORAGE_KEYS.ASESMEN, data.asesmen);
    if (Array.isArray(data.nilai)) safeSet(STORAGE_KEYS.NILAI, data.nilai);
    if (Array.isArray(data.tindakLanjut)) safeSet(STORAGE_KEYS.TINDAK_LANJUT, data.tindakLanjut);
    if (Array.isArray(data.refleksi)) safeSet(STORAGE_KEYS.REFLEKSI, data.refleksi);
    return { success: true, message: 'Data administrasi berhasil dipulihkan dari cadangan.' };
  } catch (err: any) {
    return { success: false, message: 'Format file cadangan tidak valid: ' + err.message };
  }
}

// Reset to Fresh Empty state (clearing demo items)
export function resetToEmptyData(options?: { resetProfile?: boolean }): void {
  const prof = getProfile();
  if (options?.resetProfile) {
    safeSet(STORAGE_KEYS.PROFILE, {
      ...initialTeacherProfile,
      namaGuru: '',
      nip: '',
      namaSekolah: '',
      npsn: '',
      mataPelajaran: '',
      alamatSekolah: '',
      kelasList: ['VII-A'],
      kelasAktif: 'VII-A',
      kepalaSekolah: { nama: '', nip: '' },
    });
  } else {
    safeSet(STORAGE_KEYS.PROFILE, {
      ...prof,
      kelasList: prof.kelasList?.length ? prof.kelasList : ['VII-A', 'VII-B'],
      kelasAktif: prof.kelasAktif || prof.kelasList?.[0] || 'VII-A',
    });
  }
  safeSet(STORAGE_KEYS.PERENCANAAN, []);
  safeSet(STORAGE_KEYS.JURNAL, []);
  safeSet(STORAGE_KEYS.SISWA, []);
  safeSet(STORAGE_KEYS.ASESMEN, []);
  safeSet(STORAGE_KEYS.NILAI, []);
  safeSet(STORAGE_KEYS.TINDAK_LANJUT, []);
  safeSet(STORAGE_KEYS.REFLEKSI, []);
  safeSet(STORAGE_KEYS.MEDIA_LIBRARY, []);
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } catch (e) {
    console.error(e);
  }
}

// Reset to Default Demo
export function resetToDemoData(): void {
  safeSet(STORAGE_KEYS.PROFILE, initialTeacherProfile);
  safeSet(STORAGE_KEYS.PERENCANAAN, demoPerencanaanList);
  safeSet(STORAGE_KEYS.JURNAL, demoJurnalList);
  safeSet(STORAGE_KEYS.SISWA, demoPesertaDidikList);
  safeSet(STORAGE_KEYS.ASESMEN, demoRencanaAsesmenList);
  safeSet(STORAGE_KEYS.NILAI, demoNilaiList);
  safeSet(STORAGE_KEYS.TINDAK_LANJUT, demoTindakLanjutList);
  safeSet(STORAGE_KEYS.REFLEKSI, demoRefleksiList);
  safeSet(STORAGE_KEYS.MEDIA_LIBRARY, demoMediaLibraryList);
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } catch (e) {
    console.error(e);
  }
}

// Convenient export aliases
export const exportAllDataToJSON = exportFullData;
export function importDataFromJSON(jsonString: string): boolean {
  const res = importFullData(jsonString);
  return res.success;
}
export const resetToDefaultDemoData = resetToDemoData;
export const clearAllStorageData = resetToEmptyData;
