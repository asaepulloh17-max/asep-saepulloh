import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  RencanaAsesmenItem,
  NilaiSiswa,
  PesertaDidik,
  TindakLanjutData,
  RefleksiEvaluasiData,
} from './types';
import {
  initializeStorageIfEmpty,
  getProfile,
  saveProfile,
  getPerencanaanList,
  savePerencanaan,
  deletePerencanaan,
  duplicatePerencanaan,
  getJurnalList,
  saveJurnal,
  deleteJurnal,
  getAsesmenList,
  saveAsesmen,
  deleteAsesmen,
  getNilaiList,
  saveNilaiBatch,
  getSiswaList,
  saveSiswa,
  saveSiswaBatch,
  deleteSiswa,
  getTindakLanjutList,
  saveTindakLanjut,
  getRefleksiList,
  saveRefleksi,
} from './data/storage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastNotification, ToastItem } from './components/ToastNotification';
import { AIAssistantModal } from './components/AIAssistantModal';
import { DashboardView } from './components/DashboardView';
import { ProfilView } from './components/ProfilView';
import { PerencanaanView } from './components/PerencanaanView';
import { PelaksanaanView } from './components/PelaksanaanView';
import { MediaPembelajaranView } from './components/MediaPembelajaranView';
import { EvaluasiView } from './components/EvaluasiView';
import { LaporanView } from './components/LaporanView';
import { PengaturanView } from './components/PengaturanView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState<boolean>(false);
  const [aiTopicContext, setAiTopicContext] = useState<string>('');
  const [selectedRPPForEduGenius, setSelectedRPPForEduGenius] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Application Data States
  const [profile, setProfileState] = useState<TeacherProfile>(getProfile());
  const [perencanaanList, setPerencanaanListState] = useState<Perencanaan[]>([]);
  const [jurnalList, setJurnalListState] = useState<JurnalMengajar[]>([]);
  const [asesmenList, setAsesmenListState] = useState<RencanaAsesmenItem[]>([]);
  const [nilaiList, setNilaiListState] = useState<NilaiSiswa[]>([]);
  const [siswaList, setSiswaListState] = useState<PesertaDidik[]>([]);
  const [tindakLanjutList, setTindakLanjutListState] = useState<TindakLanjutData[]>([]);
  const [refleksiList, setRefleksiListState] = useState<RefleksiEvaluasiData[]>([]);

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reload all states from LocalStorage
  const loadAllData = () => {
    initializeStorageIfEmpty();
    setProfileState(getProfile());
    setPerencanaanListState(getPerencanaanList());
    setJurnalListState(getJurnalList());
    setAsesmenListState(getAsesmenList());
    setNilaiListState(getNilaiList());
    setSiswaListState(getSiswaList());
    setTindakLanjutListState(getTindakLanjutList());
    setRefleksiListState(getRefleksiList());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Profile update handler
  const handleUpdateProfile = (updated: TeacherProfile) => {
    saveProfile(updated);
    setProfileState(updated);
  };

  // Perencanaan handlers
  const handleSavePerencanaan = (item: Perencanaan) => {
    savePerencanaan(item);
    setPerencanaanListState(getPerencanaanList());
  };

  const handleDeletePerencanaan = (id: string) => {
    deletePerencanaan(id);
    setPerencanaanListState(getPerencanaanList());
  };

  const handleDuplicatePerencanaan = (id: string) => {
    const dup = duplicatePerencanaan(id);
    if (dup) {
      setPerencanaanListState(getPerencanaanList());
      showToast('success', `Dokumen berhasil digandakan sebagai "${dup.judul}"`);
    }
  };

  // Jurnal handlers
  const handleSaveJurnal = (item: JurnalMengajar) => {
    saveJurnal(item);
    setJurnalListState(getJurnalList());
  };

  const handleDeleteJurnal = (id: string) => {
    deleteJurnal(id);
    setJurnalListState(getJurnalList());
  };

  // Evaluasi handlers
  const handleSaveAsesmen = (item: RencanaAsesmenItem) => {
    saveAsesmen(item);
    setAsesmenListState(getAsesmenList());
  };

  const handleDeleteAsesmen = (id: string) => {
    deleteAsesmen(id);
    setAsesmenListState(getAsesmenList());
  };

  const handleSaveNilaiBatch = (batch: NilaiSiswa[]) => {
    saveNilaiBatch(batch);
    setNilaiListState(getNilaiList());
  };

  const handleAddSiswa = (siswa: PesertaDidik) => {
    saveSiswa(siswa);
    setSiswaListState(getSiswaList());
  };

  const handleSaveSiswaBatch = (batch: PesertaDidik[], replaceKelas?: string) => {
    saveSiswaBatch(batch, replaceKelas);
    setSiswaListState(getSiswaList());
  };

  const handleDeleteSiswa = (id: string) => {
    deleteSiswa(id);
    setSiswaListState(getSiswaList());
  };

  const handleSaveTindakLanjut = (item: TindakLanjutData) => {
    saveTindakLanjut(item);
    setTindakLanjutListState(getTindakLanjutList());
  };

  const handleSaveRefleksi = (item: RefleksiEvaluasiData) => {
    saveRefleksi(item);
    setRefleksiListState(getRefleksiList());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row antialiased text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onOpenAI={() => {
          setAiTopicContext('');
          setIsAIOpen(true);
        }}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          activeTab={activeTab}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onToggleMobileMenu={() => setIsOpenMobile(true)}
          onOpenAI={() => {
            setAiTopicContext('');
            setIsAIOpen(true);
          }}
          onNavigateToProfile={() => setActiveTab('profil')}
          onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        />

        {/* View Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              perencanaanList={perencanaanList}
              jurnalList={jurnalList}
              asesmenList={asesmenList}
              nilaiList={nilaiList}
              siswaList={siswaList}
              onNavigate={setActiveTab}
              onOpenNewPerencanaan={() => setActiveTab('perencanaan')}
              onOpenNewJurnal={() => setActiveTab('pelaksanaan')}
              onOpenInputNilai={() => setActiveTab('evaluasi')}
              onOpenAI={() => {
                setAiTopicContext('');
                setIsAIOpen(true);
              }}
              onUpdateProfile={handleUpdateProfile}
              onAddSiswa={handleAddSiswa}
              onSaveSiswaBatch={handleSaveSiswaBatch}
              onDeleteSiswa={handleDeleteSiswa}
              onShowToast={showToast}
              onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilView
              profile={profile}
              onSaveProfile={handleUpdateProfile}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'perencanaan' && (
            <PerencanaanView
              perencanaanList={perencanaanList}
              profile={profile}
              onSavePerencanaan={handleSavePerencanaan}
              onDeletePerencanaan={handleDeletePerencanaan}
              onDuplicatePerencanaan={handleDuplicatePerencanaan}
              onOpenAIWithTopic={(topik) => {
                setAiTopicContext(topik);
                setIsAIOpen(true);
              }}
              onOpenEduGeniusWithRPP={(rppId) => {
                setSelectedRPPForEduGenius(rppId);
                setActiveTab('media-pembelajaran');
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'pelaksanaan' && (
            <PelaksanaanView
              jurnalList={jurnalList}
              profile={profile}
              siswaList={siswaList}
              perencanaanList={perencanaanList}
              selectedRPPForEduGenius={selectedRPPForEduGenius}
              onSaveJurnal={handleSaveJurnal}
              onDeleteJurnal={handleDeleteJurnal}
              onOpenAIWithTopic={(topik) => {
                setAiTopicContext(topik);
                setIsAIOpen(true);
              }}
              onNavigateToPerencanaan={() => setActiveTab('perencanaan')}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'media-pembelajaran' && (
            <MediaPembelajaranView
              profile={profile}
              perencanaanList={perencanaanList}
              initialSelectedRPPId={selectedRPPForEduGenius}
              onNavigateToPerencanaan={() => setActiveTab('perencanaan')}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'evaluasi' && (
            <EvaluasiView
              asesmenList={asesmenList}
              nilaiList={nilaiList}
              siswaList={siswaList}
              tindakLanjutList={tindakLanjutList}
              refleksiList={refleksiList}
              profile={profile}
              onSaveAsesmen={handleSaveAsesmen}
              onDeleteAsesmen={handleDeleteAsesmen}
              onSaveNilaiBatch={handleSaveNilaiBatch}
              onSaveTindakLanjut={handleSaveTindakLanjut}
              onSaveRefleksi={handleSaveRefleksi}
              onAddSiswa={handleAddSiswa}
              onOpenAIWithTopic={(topik) => {
                setAiTopicContext(topik);
                setIsAIOpen(true);
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              profile={profile}
              perencanaanList={perencanaanList}
              jurnalList={jurnalList}
              asesmenList={asesmenList}
              nilaiList={nilaiList}
              siswaList={siswaList}
              tindakLanjutList={tindakLanjutList}
              refleksiList={refleksiList}
              onShowToast={showToast}
              onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              onDataReload={loadAllData}
              onShowToast={showToast}
              onOpenGoogleSheetsModal={() => setIsGoogleSheetsOpen(true)}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto py-3 px-4 sm:px-8 border-t border-slate-200 bg-white/70 backdrop-blur-xs text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">GURU SMART SMP</span>
            <span>•</span>
            <span>Administrasi Pembelajaran Terpadu Kurikulum Merdeka</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Komunitas / Binaan:</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded text-[11px] tracking-wide">
              MKPS-SMP_GARUT
            </span>
          </div>
        </footer>
      </div>

      {/* Global AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        profile={profile}
        initialTopic={aiTopicContext}
        onShowToast={showToast}
      />

      {/* Google Sheets & AppSheet Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        onShowToast={showToast}
        onDataReload={loadAllData}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
