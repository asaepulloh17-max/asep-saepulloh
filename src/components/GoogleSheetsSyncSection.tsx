import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Download,
  LogOut,
  Database,
  ArrowRight,
  Info,
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

interface GoogleSheetsSyncSectionProps {
  onDataReload?: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenModal?: () => void;
}

export const GoogleSheetsSyncSection: React.FC<GoogleSheetsSyncSectionProps> = ({
  onDataReload,
  onShowToast,
  onOpenModal,
}) => {
  const [user, setUser] = useState<any>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [storedInfo, setStoredInfo] = useState(getStoredSpreadsheetInfo());
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [showConfirmPull, setShowConfirmPull] = useState(false);

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
    setStoredInfo(getStoredSpreadsheetInfo());
    setUser(getCurrentUser());
    getAccessToken().then((t) => {
      if (t) setAccessToken(t);
    });
  }, []);

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
        storedInfo.id || undefined,
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

      if (!storedInfo.id) {
        throw new Error('ID Spreadsheet belum ditentukan');
      }

      const pulled = await pullDataFromGoogleSheets(token, storedInfo.id);

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
        `Data terbaru dari Google Sheets berhasil dimuat ke aplikasi!`,
      );
    } catch (err: any) {
      console.error('Pull error:', err);
      onShowToast('error', `Gagal menarik data: ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const siswaCount = getSiswaList().length;
  const jurnalCount = getJurnalList().length;
  const rppCount = getPerencanaanList().length;
  const nilaiCount = getNilaiList().length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Penyimpanan Cloud: Google Sheets & AppSheet
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Terintegrasi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan administrasi ini ke Google Spreadsheet agar tersimpan di Google Drive & menjadi basis data Google AppSheet
            </p>
          </div>
        </div>

        {onOpenModal && (
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 font-semibold self-start sm:self-auto transition-colors"
          >
            Kelola Lengkap
          </button>
        )}
      </div>

      {/* Main Grid: Auth & Spreadsheet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Google Auth */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status Akun Google</span>
            </div>
            {user ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Terhubung</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                Belum Terhubung
              </span>
            )}
          </div>

          {user ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-xs text-slate-800">{user.displayName || 'Guru'}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-[200px]">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Putuskan sambungan Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Masuk dengan akun Google untuk mengaktifkan sinkronisasi otomatis ke Google Drive.
              </p>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="w-full inline-flex items-center justify-center space-x-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-all disabled:opacity-60"
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

        {/* Right: Spreadsheet Info & Actions */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Spreadsheet Administrasi</span>
            </div>
            {storedInfo.id && (
              <a
                href={storedInfo.url || `https://docs.google.com/spreadsheets/d/${storedInfo.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>Buka di Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {storedInfo.id ? (
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="font-semibold text-slate-800 truncate">
                  {storedInfo.title || 'Guru Smart Admin - Data Pembelajaran'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                  ID: {storedInfo.id}
                </div>
                {storedInfo.lastSync && (
                  <div className="text-[10px] text-emerald-600 mt-1 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Disinkronkan: {new Date(storedInfo.lastSync).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSync(true)}
                  disabled={isSyncing}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmPull(true)}
                  disabled={isPulling}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors disabled:opacity-60"
                  title="Tarik data dari spreadsheet ke aplikasi"
                >
                  <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Tarik Data</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Belum ada spreadsheet. Klik tombol di bawah untuk membuat berkas spreadsheet baru di Google Drive Anda.
              </p>
              <button
                type="button"
                onClick={() => setShowConfirmSync(true)}
                disabled={isSyncing}
                className="w-full px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Membuat...' : 'Buat Spreadsheet Otomatis'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AppSheet Feature Callout */}
      <div className="p-4 rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-indigo-50/40 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5">
              <span>Jadikan Aplikasi Mobile di Google AppSheet</span>
              <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                No-Code
              </span>
            </div>
            <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
              Spreadsheet yang dihasilkan memiliki 8 tabel berelasi (Siswa, Jurnal, RPP, Asesmen, Nilai). Hubungkan ke AppSheet untuk mencatat presensi & nilai dari smartphone saat mengajar di kelas.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="https://www.appsheet.com/start"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <span>Buka Google AppSheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Konfirmasi Sinkronisasi Google Sheets
                </h4>
                <p className="text-[11px] text-slate-500">Perbarui lembar data di Google Drive Anda</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">Data yang akan ditulis ke Google Sheets:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                <li>Profil Guru & Satuan Pendidikan</li>
                <li>{siswaCount} Peserta Didik</li>
                <li>{rppCount} Modul Ajar / RPP</li>
                <li>{jurnalCount} Pertemuan Jurnal Mengajar & Presensi</li>
                <li>{nilaiCount} Nilai Asesmen Pembelajaran</li>
                <li>Program Remedial & Pengayaan (Tindak Lanjut)</li>
              </ul>
            </div>

            <p className="text-xs text-slate-600">
              Operasi ini akan memperbarui baris spreadsheet. Lanjutkan?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ya, Sinkronkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmPull && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Tarik Data dari Google Sheets?
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sinkronisasi perubahan yang dilakukan lewat AppSheet atau Google Sheets
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Aplikasi akan membaca berkas spreadsheet Google dan memperbarui data profil serta peserta didik di aplikasi Guru Smart Admin ini.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmPull(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePull}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
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
