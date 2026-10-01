import React, { useEffect, useState } from 'react';
import { Menu, Sparkles, User, Calendar, BookMarked, FileSpreadsheet } from 'lucide-react';
import { ActiveTab, TeacherProfile } from '../types';
import { getStoredSpreadsheetInfo } from '../services/googleSheetsService';
import { getCurrentUser, subscribeAuthState } from '../services/googleAuthService';

interface TopbarProps {
  activeTab: ActiveTab;
  profile: TeacherProfile;
  onUpdateProfile: (p: TeacherProfile) => void;
  onToggleMobileMenu: () => void;
  onOpenAI: () => void;
  onNavigateToProfile: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  profile,
  onUpdateProfile,
  onToggleMobileMenu,
  onOpenAI,
  onNavigateToProfile,
  onOpenGoogleSheets,
}) => {
  const [hasGoogleAuth, setHasGoogleAuth] = useState(!!getCurrentUser());
  const [spreadsheetId, setSpreadsheetId] = useState(getStoredSpreadsheetInfo().id);

  useEffect(() => {
    const unsub = subscribeAuthState((u) => {
      setHasGoogleAuth(!!u);
      setSpreadsheetId(getStoredSpreadsheetInfo().id);
    });
    return unsub;
  }, []);
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Dashboard Administrasi', desc: 'Ringkasan aktivitas dan progres pembelajaran SMP' };
      case 'profil':
        return { title: 'Profil Guru & Sekolah', desc: 'Identitas pengajar, mata pelajaran, dan data satuan pendidikan' };
      case 'perencanaan':
        return { title: 'Modul 1 — Perencanaan Pembelajaran', desc: 'Penyusunan rencana pembelajaran berbasis pemahaman mendalam' };
      case 'pelaksanaan':
        return { title: 'Modul 2 — Jurnal Mengajar', desc: 'Catatan pelaksanaan tatap muka, refleksi guru, dan presensi kelas' };
      case 'evaluasi':
        return { title: 'Modul 3 — Evaluasi Pembelajaran', desc: 'Rencana asesmen, input nilai, analisis hasil, tindak lanjut, & refleksi' };
      case 'laporan':
        return { title: 'Laporan & Ekspor Dokumen', desc: 'Cetak dan ekspor administrasi terstruktur siap audit/telaah' };
      case 'pengaturan':
        return { title: 'Pengaturan & Cadangan Data', desc: 'Manajemen penyimpanan lokal, ekspor/impor JSON, dan regulasi' };
      default:
        return { title: 'Guru Smart Admin', desc: 'Administrasi Pembelajaran SMP' };
    }
  };

  const { title, desc } = getTabTitle();

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    onUpdateProfile({
      ...profile,
      kelasAktif: newClass,
    });
  };

  return (
    <header
      id="app-topbar"
      className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between no-print"
    >
      {/* Left: Mobile hamburger + Titles */}
      <div className="flex items-center space-x-3">
        <button
          id="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded shadow-2xs">
              MKPS-SMP_GARUT
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {desc}
          </p>
        </div>
      </div>

      {/* Right: Quick actions & user info */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Class selector */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
          <span className="text-slate-500 px-2 font-medium hidden sm:inline">Kelas:</span>
          <select
            id="topbar-kelas-selector"
            value={profile.kelasAktif || (profile.kelasList[0] ?? 'VII-A')}
            onChange={handleClassChange}
            className="bg-white text-slate-800 font-semibold px-2 py-1 rounded shadow-2xs border-0 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {profile.kelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Semester & TP badge */}
        <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Sem. {profile.semesterAktif}</span>
          <span className="text-slate-300">•</span>
          <span>{profile.tahunPelajaran}</span>
        </div>

        {/* Google Sheets & AppSheet Button */}
        {onOpenGoogleSheets && (
          <button
            id="topbar-sheets-button"
            type="button"
            onClick={onOpenGoogleSheets}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs ${
              hasGoogleAuth && spreadsheetId
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Sinkronisasi Google Sheets & AppSheet"
          >
            <FileSpreadsheet
              className={`w-3.5 h-3.5 ${
                hasGoogleAuth && spreadsheetId ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span className="hidden sm:inline">Sheets / AppSheet</span>
            {hasGoogleAuth && spreadsheetId && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        )}

        {/* AI Assistant Button */}
        <button
          id="topbar-ai-button"
          onClick={onOpenAI}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
          title="Buka AI Asisten Pembelajaran"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="hidden sm:inline">AI Asisten</span>
        </button>

        {/* Teacher profile quick card */}
        <button
          id="topbar-profile-button"
          onClick={onNavigateToProfile}
          className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
          title="Klik untuk ubah data profil guru"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            {profile.namaGuru ? profile.namaGuru.charAt(0) : 'G'}
          </div>
          <div className="hidden xl:block text-xs leading-tight">
            <div className="font-semibold text-slate-800 truncate max-w-[130px]">
              {profile.namaGuru}
            </div>
            <div className="text-slate-500 text-[10px] truncate max-w-[130px]">
              {profile.mataPelajaran}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
