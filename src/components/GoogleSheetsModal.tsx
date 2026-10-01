import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Layers,
  Database,
  Link as LinkIcon,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  Download,
  Upload,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getCurrentUser,
  getAccessToken,
} from '../services/googleAuthService';
import {
  syncAllDataToGoogleSheets,
  pullDataFromGoogleSheets,
  getStoredSpreadsheetInfo,
  saveStoredSpreadsheetInfo,
  clearStoredSpreadsheetInfo,
  SyncResult,
} from '../services/googleSheetsService';
import {
  getProfile,
  getSiswaList,
  getPerencanaanList,
  getJurnalList,
  getAsesmenList,
  getNilaiList,
  getTindakLanjutList,
  getRefleksiList,
  saveProfile,
  saveSiswaBatch,
} from '../data/storage';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onDataReload?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onDataReload,
}) => {
  const [user, setUser] = useState<any>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [storedInfo, setStoredInfo] = useState(getStoredSpreadsheetInfo());
  const [customSheetId, setCustomSheetId] = useState(storedInfo.id);
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [showConfirmPull, setShowConfirmPull] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'appsheet' | 'tables'>('appsheet');

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      },
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const info = getStoredSpreadsheetInfo();
      setStoredInfo(info);
      setCustomSheetId(info.id);
      getAccessToken().then((tok) => {
        if (tok) setAccessToken(tok);
      });
      setUser(getCurrentUser());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      onShowToast('success', `Berhasil terhubung dengan Google (${res.user.email})`);
    } catch (err: any) {
      console.error(err);
      onShowToast('error', `Gagal masuk dengan Google: ${err.message || 'Izin ditolak'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      onShowToast('info', 'Berhasil keluar dari akun Google.');
    } catch (err: any) {
      onShowToast('error', 'Gagal keluar: ' + err.message);
    }
  };

  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    setIsSyncing(true);

    try {
      let token = accessToken || (await getAccessToken());
      if (!token) {
        // Trigger login if token not in memory
        const loginRes = await googleSignIn();
        token = loginRes.accessToken;
        setUser(loginRes.user);
        setAccessToken(token);
      }

      const payload = {
        profile: getProfile(),
        siswa: getSiswaList(),
        perencanaan: getPerencanaanList(),
        jurnal: getJurnalList(),
        asesmen: getAsesmenList(),
        nilai: getNilaiList(),
        tindakLanjut: getTindakLanjutList(),
        refleksi: getRefleksiList(),
      };

      const result: SyncResult = await syncAllDataToGoogleSheets(
        token,
        payload,
        customSheetId || undefined,
      );

      setStoredInfo({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: result.spreadsheetTitle,
        lastSync: result.syncedAt,
      });

      onShowToast(
        'success',
        `Data berhasil disinkronkan ke Google Sheets! (${result.summary.siswaCount} siswa, ${result.summary.jurnalCount} jurnal, ${result.summary.nilaiCount} nilai)`,
      );
    } catch (err: any) {
      console.error('Sync error:', err);
      onShowToast('error', `Gagal sinkronisasi data: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecutePull = async () => {
    setShowConfirmPull(false);
    setIsPulling(true);

    try {
      let token = accessToken || (await getAccessToken());
      if (!token) {
        const loginRes = await googleSignIn();
        token = loginRes.accessToken;
        setUser(loginRes.user);
        setAccessToken(token);
      }

      if (!storedInfo.id && !customSheetId) {
        throw new Error('ID Spreadsheet belum ditentukan');
      }

      const pulled = await pullDataFromGoogleSheets(token, customSheetId || storedInfo.id);

      if (pulled.profile) {
        const currentProfile = getProfile();
        saveProfile({ ...currentProfile, ...pulled.profile });
      }

      if (pulled.siswa && pulled.siswa.length > 0) {
        saveSiswaBatch(pulled.siswa);
      }

      if (onDataReload) {
        onDataReload();
      }

      onShowToast(
        'success',
        `Data dari Google Sheets berhasil ditarik ke aplikasi Guru Smart Admin!`,
      );
    } catch (err: any) {
      console.error('Pull error:', err);
      onShowToast('error', `Gagal menarik data: ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const profile = getProfile();
  const siswaList = getSiswaList();
  const perencanaanList = getPerencanaanList();
  const jurnalList = getJurnalList();
  const nilaiList = getNilaiList();
  const asesmenList = getAsesmenList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                  Sinkronisasi Google Sheets & AppSheet
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Live Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan data otomatis di Google Spreadsheet untuk sumber basis data Google AppSheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Google Account Connection */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>1. Akun Google Terhubung</span>
              </div>
              {user && (
                <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terhubung</span>
                </span>
              )}
            </div>

            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-9 h-9 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-xs text-slate-900">
                      {user.displayName || 'Pengguna Google'}
                    </div>
                    <div className="text-[11px] text-slate-500">{user.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan Hubungan</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hubungkan akun Google Anda untuk mengizinkan aplikasi membuat dan memperbarui berkas spreadsheet administrasi di Google Drive Anda.
                </p>

                {/* Official Material Google Sign-in button */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isAuthenticating}
                  className="inline-flex items-center justify-center space-x-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-all hover:shadow-xs active:scale-[0.99] disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isAuthenticating ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Spreadsheet Status & Management */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>2. Berkas Google Spreadsheet</span>
              </div>
            </div>

            {storedInfo.id ? (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{storedInfo.title || 'Guru Smart Admin - Data Pembelajaran'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ID: {storedInfo.id}
                    </div>
                    {storedInfo.lastSync && (
                      <div className="text-[10px] text-emerald-600 mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Terakhir disinkronkan: {new Date(storedInfo.lastSync).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>

                  <a
                    href={storedInfo.url || `https://docs.google.com/spreadsheets/d/${storedInfo.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-emerald-200/80 shrink-0"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSync(true)}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConfirmPull(true)}
                    disabled={isPulling}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-60"
                  >
                    <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>Tarik Data dari Spreadsheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Lepas tautan spreadsheet ini? Berkas di Google Drive tidak akan dihapus.')) {
                        clearStoredSpreadsheetInfo();
                        setStoredInfo(getStoredSpreadsheetInfo());
                        setCustomSheetId('');
                      }
                    }}
                    className="px-2.5 py-2 text-slate-500 hover:text-rose-600 rounded-lg text-[11px]"
                  >
                    Ganti Spreadsheet
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Belum ada spreadsheet yang terhubung. Klik tombol di bawah untuk membuat berkas Google Spreadsheet baru secara otomatis dengan seluruh sheet tabel yang siap digunakan untuk AppSheet.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSync(true)}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Buat & Sinkronkan Spreadsheet Baru</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-700 font-medium">
                      Atau hubungkan ke ID Spreadsheet yang sudah ada
                    </summary>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        value={customSheetId}
                        onChange={(e) => setCustomSheetId(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customSheetId.trim()) {
                            saveStoredSpreadsheetInfo(
                              customSheetId.trim(),
                              `https://docs.google.com/spreadsheets/d/${customSheetId.trim()}/edit`,
                              'Google Spreadsheet Terhubung',
                            );
                            setStoredInfo(getStoredSpreadsheetInfo());
                            onShowToast('success', 'ID Spreadsheet berhasil disimpan');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
                      >
                        Simpan
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Google AppSheet Direct Guide */}
          <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>3. Panduan Membuat Aplikasi di Google AppSheet</span>
              </div>
              <a
                href="https://www.appsheet.com/start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:shadow-xs transition-all"
              >
                <span>Buka Google AppSheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-indigo-950 leading-relaxed">
              Setelah disinkronkan ke Google Sheets, spreadsheet Anda langsung memiliki struktur tabel yang rapi dan saling berelasi. Anda dapat mengubahnya menjadi aplikasi mobile (Android/iOS) atau desktop secara instan melalui <strong>Google AppSheet</strong> tanpa koding (No-Code):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
              <div className="bg-white p-3 rounded-lg border border-indigo-100/80 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mb-2">
                  1
                </div>
                <div className="font-bold text-slate-800 text-xs">Buka AppSheet</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Masuk ke <a href="https://www.appsheet.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">appsheet.com</a> dengan akun Google yang sama.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100/80 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mb-2">
                  2
                </div>
                <div className="font-bold text-slate-800 text-xs">Pilih Spreadsheet</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik <em>Create App &gt; Start with existing data</em> &gt; pilih berkas Google Sheet administrasi ini.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100/80 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mb-2">
                  3
                </div>
                <div className="font-bold text-slate-800 text-xs">Aplikasi Siap Digunakan!</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Input presensi, jurnal, & nilai langsung dari HP di kelas. Data otomatis masuk ke Google Sheet.
                </p>
              </div>
            </div>

            {/* AppSheet Table Structure details */}
            <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800">
                Struktur Sheet yang Otomatis Dibuat di Google Spreadsheet:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono text-slate-600 pt-1">
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">1. Profil_Guru</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">2. Peserta_Didik</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">3. Perencanaan_RPP</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">4. Jurnal_Mengajar</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">5. Rencana_Asesmen</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">6. Nilai_Asesmen</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">7. Tindak_Lanjut</span>
                <span className="p-1.5 bg-slate-50 border border-slate-200 rounded">8. Refleksi_Guru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Dikelola dengan aman via Google Workspace Sheets API
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Syncing (Mandatory user confirmation) */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Konfirmasi Sinkronisasi ke Google Sheets
                  </h4>
                  <p className="text-[11px] text-slate-500">Perbarui data di cloud Google Drive Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
              <p className="font-semibold text-emerald-900">
                Aplikasi akan menulis dan memperbarui data berikut ke Google Spreadsheet:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800">
                <li>
                  Profil Pengajar: <strong>{profile.namaGuru || 'Guru'}</strong> ({profile.mataPelajaran})
                </li>
                <li>
                  Daftar Peserta Didik: <strong>{siswaList.length} siswa</strong>
                </li>
                <li>
                  Modul Ajar / Perencanaan: <strong>{perencanaanList.length} dokumen</strong>
                </li>
                <li>
                  Jurnal Mengajar & Presensi: <strong>{jurnalList.length} pertemuan KBM</strong>
                </li>
                <li>
                  Rencana Asesmen: <strong>{asesmenList.length} asesmen</strong>
                </li>
                <li>
                  Nilai Peserta Didik: <strong>{nilaiList.length} rekaman nilai</strong>
                </li>
                <li>Tindak Lanjut & Refleksi Evaluasi Guru</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">
              Operasi ini akan memperbarui baris-baris pada lembar spreadsheet yang terhubung. Lanjutkan proses sinkronisasi?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ya, Sinkronkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Pulling data from Google Sheets */}
      {showConfirmPull && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Tarik Data dari Google Sheets?
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Perbarui data aplikasi dari perubahan di spreadsheet atau AppSheet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPull(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan membaca lembar spreadsheet Google Anda dan memperbarui data profil serta daftar siswa di aplikasi ini dengan data terbaru yang ada di spreadsheet.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmPull(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePull}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tarik Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
