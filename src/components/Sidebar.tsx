import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  BookOpenCheck,
  Award,
  FileSpreadsheet,
  Settings,
  Sparkles,
  School,
  X,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, TeacherProfile } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: TeacherProfile;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenAI: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  isOpenMobile,
  setIsOpenMobile,
  onOpenAI,
  onOpenGoogleSheets,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profil', label: 'Profil Guru', icon: UserCheck },
    { id: 'perencanaan', label: '1. Perencanaan', icon: FileText },
    { id: 'pelaksanaan', label: '2. Pelaksanaan', icon: BookOpenCheck },
    { id: 'media-pembelajaran', label: 'Media Pembelajaran', icon: Sparkles, badge: 'EduGenius' },
    { id: 'evaluasi', label: '3. Evaluasi', icon: Award },
    { id: 'laporan', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-backdrop"
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out no-print ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                GURU SMART
                <span className="text-xs bg-indigo-500/30 text-indigo-300 font-semibold px-1.5 py-0.5 rounded">SMP</span>
              </div>
              <p className="text-xs text-slate-400">Admin Pembelajaran</p>
              <div className="mt-1">
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider text-indigo-300 bg-indigo-950/90 border border-indigo-700/60 px-2 py-0.5 rounded shadow-2xs">
                  MKPS-SMP_GARUT
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School & Active Class Badge */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 text-xs">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Sekolah</span>
            <span className="font-medium text-slate-200 truncate max-w-[130px]" title={profile.namaSekolah}>
              {profile.namaSekolah}
            </span>
          </div>
          <div className="text-slate-400 flex items-center justify-between mt-1">
            <span>Kelas Aktif</span>
            <span className="bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-semibold text-[11px]">
              {profile.kelasAktif || 'VII-A'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" id="sidebar-navigation">
          <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                </div>
              </button>
            );
          })}

          {/* Special AI Assistant Trigger */}
          <div className="pt-4 px-1 space-y-2">
            <button
              id="sidebar-ai-button"
              onClick={() => {
                onOpenAI();
                setIsOpenMobile(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-pink-500/30 text-indigo-200 border border-indigo-500/30 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Asisten Pendidikan</span>
            </button>

            {onOpenGoogleSheets && (
              <button
                id="sidebar-sheets-button"
                onClick={() => {
                  onOpenGoogleSheets();
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets & AppSheet</span>
              </button>
            )}
          </div>
        </nav>

        {/* Curriculum Footer Label */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-300">Kurikulum Merdeka SMP</p>
            <span className="text-[10px] font-bold text-indigo-400 tracking-wider">MKPS-SMP_GARUT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            Permendikdasmen 13/2025 • Kepmendikdasmen 126/P/2025 (Pembelajaran Mendalam)
          </p>
        </div>
      </aside>
    </>
  );
};
