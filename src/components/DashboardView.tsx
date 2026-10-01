import React from 'react';
import {
  FileText,
  BookOpenCheck,
  Award,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  School,
  Users,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  ActiveTab,
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  RencanaAsesmenItem,
  NilaiSiswa,
  PesertaDidik,
} from '../types';
import { DashboardSiswaSection } from './DashboardSiswaSection';

interface DashboardViewProps {
  profile: TeacherProfile;
  perencanaanList: Perencanaan[];
  jurnalList: JurnalMengajar[];
  asesmenList: RencanaAsesmenItem[];
  nilaiList: NilaiSiswa[];
  siswaList: PesertaDidik[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewPerencanaan: () => void;
  onOpenNewJurnal: () => void;
  onOpenInputNilai: () => void;
  onOpenAI: () => void;
  onUpdateProfile: (updatedProfile: TeacherProfile) => void;
  onAddSiswa: (siswa: PesertaDidik) => void;
  onSaveSiswaBatch: (items: PesertaDidik[], replaceKelas?: string) => void;
  onDeleteSiswa: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenGoogleSheets?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  perencanaanList,
  jurnalList,
  asesmenList,
  nilaiList,
  siswaList,
  onNavigate,
  onOpenNewPerencanaan,
  onOpenNewJurnal,
  onOpenInputNilai,
  onOpenAI,
  onUpdateProfile,
  onAddSiswa,
  onSaveSiswaBatch,
  onDeleteSiswa,
  onShowToast,
  onOpenGoogleSheets,
}) => {
  const currentClass = profile.kelasAktif || 'VII-A';
  const plansForClass = perencanaanList.filter((p) => !p.identitas.kelas || p.identitas.kelas === currentClass);
  const journalsForClass = jurnalList.filter((j) => !j.kelas || j.kelas === currentClass);
  const assessmentsForClass = asesmenList.filter((a) => !a.kelas || a.kelas === currentClass);
  const studentsForClass = siswaList.filter((s) => !s.kelas || s.kelas === currentClass);

  // Status kelengkapan indikator sederhana
  const completedPlans = plansForClass.filter((p) => p.status === 'Selesai').length;
  const draftPlans = plansForClass.filter((p) => p.status === 'Draf').length;

  const hasPlans = plansForClass.length > 0;
  const hasJournals = journalsForClass.length > 0;
  const hasAssessments = assessmentsForClass.length > 0;
  const hasGrades = nilaiList.length > 0;

  // Simple progress calculation (0 to 100%)
  let progressPoints = 0;
  if (hasPlans) progressPoints += 25;
  if (completedPlans > 0) progressPoints += 15;
  if (hasJournals) progressPoints += 30;
  if (hasAssessments && hasGrades) progressPoints += 30;

  // Recent activities list
  const recentItems = [
    ...perencanaanList.map((p) => ({
      type: 'Perencanaan',
      title: p.judul,
      kelas: p.identitas.kelas,
      time: p.updatedAt,
      isDemo: p.isDemo,
      status: p.status,
      onClick: () => onNavigate('perencanaan'),
    })),
    ...jurnalList.map((j) => ({
      type: 'Jurnal Mengajar',
      title: j.topikMateri || 'Pertemuan Pembelajaran',
      kelas: j.kelas,
      time: j.updatedAt,
      isDemo: j.isDemo,
      status: j.status,
      onClick: () => onNavigate('pelaksanaan'),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <School className="w-3.5 h-3.5" />
              <span>{profile.namaSekolah || 'SMP Negeri'}</span>
              <span>•</span>
              <span>{profile.fase}</span>
              <span>•</span>
              <span className="font-bold text-amber-300">MKPS-SMP_GARUT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {profile.namaGuru || 'Bapak/Ibu Guru'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola administrasi pembelajaran secara terpadu: Perencanaan, Pelaksanaan (Jurnal), dan Evaluasi berbasis prinsip Pembelajaran Mendalam yang berkesadaran, bermakna, dan menggembirakan.
            </p>
          </div>

          {/* Quick AI Trigger */}
          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={onOpenAI}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center space-x-2 shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Buka AI Asisten</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Mata Pelajaran:</span>
            <span className="font-semibold text-slate-200 truncate block">{profile.mataPelajaran}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tahun Pelajaran:</span>
            <span className="font-semibold text-slate-200">{profile.tahunPelajaran} (Sem. {profile.semesterAktif})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Fokus Kelas:</span>
            <span className="font-semibold text-indigo-300">{currentClass}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Kepala Sekolah:</span>
            <span className="font-semibold text-sky-300 truncate block" title={profile.kepalaSekolah?.nama}>
              {profile.kepalaSekolah?.nama || 'Kepala Sekolah'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Ambang KKTP Default:</span>
            <span className="font-semibold text-emerald-400">{profile.kktpDefault}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Aksi Cepat Administrasi
          </h3>
          <span className="text-xs text-slate-400">Pintasan praktis guru</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            id="quick-btn-perencanaan"
            onClick={onOpenNewPerencanaan}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Perencanaan</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Modul Ajar / RPP</span>
          </button>

          <button
            id="quick-btn-jurnal"
            onClick={onOpenNewJurnal}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Jurnal KBM</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Catat Tatap Muka</span>
          </button>

          <button
            id="quick-btn-nilai"
            onClick={onOpenInputNilai}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Input Nilai</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Formatif & Sumatif</span>
          </button>

          <button
            id="quick-btn-siswa-import"
            onClick={() => {
              const el = document.getElementById('dashboard-siswa-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-indigo-950">Kelas & Siswa</span>
            <span className="text-[10px] text-indigo-700 font-medium mt-0.5">Impor Excel & Word</span>
          </button>

          <button
            id="quick-btn-laporan"
            onClick={() => onNavigate('laporan')}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Laporan</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Cetak & Dokumen</span>
          </button>

          <button
            id="quick-btn-google-sheets"
            onClick={onOpenGoogleSheets || (() => onNavigate('pengaturan'))}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center group col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-950">Google Sheets</span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5">Sinkron & AppSheet</span>
          </button>
        </div>
      </div>

      {/* Metrics & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Statistics Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Perencanaan</span>
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{perencanaanList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                <span className="text-emerald-600 font-semibold">{completedPlans} Selesai</span>
                <span>•</span>
                <span className="text-amber-600">{draftPlans} Draf</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Jurnal Mengajar</span>
                <BookOpenCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{jurnalList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {journalsForClass.length} tercatat di {currentClass}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Rencana Asesmen</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{asesmenList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {nilaiList.length} nilai peserta didik
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Peserta Didik</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{siswaList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {studentsForClass.length} siswa di {currentClass}
              </div>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Aktivitas Administrasi Terbaru</span>
              </h3>
              <span className="text-[11px] text-slate-400">Diurutkan berdasarkan waktu pembaruan</span>
            </div>

            {recentItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada aktivitas tercatat. Mulai dengan membuat perencanaan baru.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.onClick}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.title}
                          </span>
                          {item.isDemo && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <span>{item.type}</span>
                          <span>•</span>
                          <span>Kelas {item.kelas || '-'}</span>
                          <span>•</span>
                          <span>Status: {item.status}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Administration Readiness Checklist (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kesiapan Administrasi ({currentClass})</span>
            </h3>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1 font-medium">
                <span className="text-slate-600">Progres Siklus Pembelajaran</span>
                <span className="text-indigo-600 font-bold">{progressPoints}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPoints}%` }}
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                {hasPlans ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">1. Perencanaan Pembelajaran</div>
                  <div className="text-[11px] text-slate-500">
                    {hasPlans
                      ? `${plansForClass.length} dokumen tersimpan (${completedPlans} tuntas)`
                      : 'Belum ada perencanaan untuk kelas ini'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                {hasJournals ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">2. Jurnal Pelaksanaan Tatap Muka</div>
                  <div className="text-[11px] text-slate-500">
                    {hasJournals
                      ? `${journalsForClass.length} pertemuan terlaksana tercatat`
                      : 'Belum ada catatan jurnal mengajar'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                {hasAssessments && hasGrades ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">3. Evaluasi & Asesmen Nilai</div>
                  <div className="text-[11px] text-slate-500">
                    {hasAssessments
                      ? `${assessmentsForClass.length} instrumen asesmen terkonfigurasi`
                      : 'Belum ada rencana asesmen atau nilai'}
                  </div>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-semibold block text-slate-800 mb-0.5">Rujukan Regulasi Terkini:</span>
                Mendukung implementasi <strong>Permendikdasmen No 13 Tahun 2025</strong> dan <strong>Kepmendikdasmen No 126/P/2025</strong> mengenai Pembelajaran Mendalam (Mindful, Meaningful, Joyful).
              </div>
              <span className="shrink-0 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] self-start sm:self-auto">
                MKPS-SMP_GARUT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Input Nama Kelas & Nama Siswa (Impor Excel & MS Word) */}
      <DashboardSiswaSection
        profile={profile}
        siswaList={siswaList}
        onUpdateProfile={onUpdateProfile}
        onAddSiswa={onAddSiswa}
        onSaveSiswaBatch={onSaveSiswaBatch}
        onDeleteSiswa={onDeleteSiswa}
        onShowToast={onShowToast}
      />
    </div>
  );
};
