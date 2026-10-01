import React, { useState } from 'react';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Layers,
  CheckCircle2,
  School,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { PesertaDidik, TeacherProfile } from '../types';
import { ImportSiswaModal } from './ImportSiswaModal';
import { SiswaFormModal } from './SiswaFormModal';
import { downloadStudentTemplateExcel } from '../utils/studentImport';

interface DashboardSiswaSectionProps {
  profile: TeacherProfile;
  siswaList: PesertaDidik[];
  onUpdateProfile: (updatedProfile: TeacherProfile) => void;
  onAddSiswa: (siswa: PesertaDidik) => void;
  onSaveSiswaBatch: (items: PesertaDidik[], replaceKelas?: string) => void;
  onDeleteSiswa: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const DashboardSiswaSection: React.FC<DashboardSiswaSectionProps> = ({
  profile,
  siswaList,
  onUpdateProfile,
  onAddSiswa,
  onSaveSiswaBatch,
  onDeleteSiswa,
  onShowToast,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(profile.kelasAktif || 'VII-A');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSiswaFormOpen, setIsSiswaFormOpen] = useState<boolean>(false);
  const [editingSiswa, setEditingSiswa] = useState<PesertaDidik | null>(null);

  // New Class Input state
  const [newClassInput, setNewClassInput] = useState<string>('');
  const [isAddingClass, setIsAddingClass] = useState<boolean>(false);

  // Student Delete Confirmation state
  const [studentToDelete, setStudentToDelete] = useState<PesertaDidik | null>(null);

  const kelasList = profile.kelasList || ['VII-A'];

  // Filter students based on selected class and search query
  const filteredStudents = siswaList.filter((s) => {
    const matchClass = selectedClassFilter === 'SEMUA' || s.kelas === selectedClassFilter;
    const matchSearch =
      !searchQuery.trim() ||
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.includes(searchQuery)) ||
      (s.nisn && s.nisn.includes(searchQuery));
    return matchClass && matchSearch;
  });

  // Calculate statistics
  const currentClassStudents = siswaList.filter((s) =>
    selectedClassFilter === 'SEMUA' ? true : s.kelas === selectedClassFilter
  );
  const countL = currentClassStudents.filter((s) => s.jenisKelamin === 'L').length;
  const countP = currentClassStudents.filter((s) => s.jenisKelamin === 'P').length;

  // Add new class handler
  const handleAddNewClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanClass = newClassInput.trim().toUpperCase();
    if (!cleanClass) return;

    if (kelasList.includes(cleanClass)) {
      onShowToast('info', `Kelas ${cleanClass} sudah ada dalam daftar.`);
      setNewClassInput('');
      setIsAddingClass(false);
      return;
    }

    const updatedKelasList = [...kelasList, cleanClass];
    onUpdateProfile({
      ...profile,
      kelasList: updatedKelasList,
      kelasAktif: cleanClass,
    });
    setSelectedClassFilter(cleanClass);
    setNewClassInput('');
    setIsAddingClass(false);
    onShowToast('success', `Kelas baru "${cleanClass}" berhasil ditambahkan.`);
  };

  // Set active class handler
  const handleSetActiveClass = (kelas: string) => {
    if (kelas !== 'SEMUA') {
      onUpdateProfile({
        ...profile,
        kelasAktif: kelas,
      });
    }
    setSelectedClassFilter(kelas);
  };

  // Remove class handler
  const handleRemoveClass = (kelasToRemove: string) => {
    const studentsInClass = siswaList.filter((s) => s.kelas === kelasToRemove);
    if (studentsInClass.length > 0) {
      onShowToast(
        'error',
        `Tidak dapat menghapus Kelas ${kelasToRemove} karena masih memiliki ${studentsInClass.length} peserta didik. Hapus atau pindahkan siswa terlebih dahulu.`
      );
      return;
    }

    if (kelasList.length <= 1) {
      onShowToast('error', 'Minimal harus ada 1 kelas yang terdaftar.');
      return;
    }

    const updated = kelasList.filter((k) => k !== kelasToRemove);
    const nextActive = profile.kelasAktif === kelasToRemove ? updated[0] : profile.kelasAktif;

    onUpdateProfile({
      ...profile,
      kelasList: updated,
      kelasAktif: nextActive,
    });

    if (selectedClassFilter === kelasToRemove) {
      setSelectedClassFilter(nextActive);
    }
    onShowToast('info', `Kelas ${kelasToRemove} berhasil dihapus.`);
  };

  // Save student (add or update)
  const handleSaveSiswa = (siswa: PesertaDidik) => {
    onAddSiswa(siswa);
    onShowToast(
      'success',
      editingSiswa ? `Data peserta didik "${siswa.nama}" diperbarui` : `Peserta didik "${siswa.nama}" berhasil ditambahkan`
    );
    setEditingSiswa(null);
  };

  // Delete student confirm
  const handleConfirmDeleteSiswa = () => {
    if (!studentToDelete) return;
    onDeleteSiswa(studentToDelete.id);
    onShowToast('info', `Peserta didik "${studentToDelete.nama}" telah dihapus.`);
    setStudentToDelete(null);
  };

  // Batch import success handler
  const handleImportSuccess = (
    importedStudents: PesertaDidik[],
    replaceKelas?: string,
    newClasses?: string[]
  ) => {
    // If new classes were detected, update profile
    if (newClasses && newClasses.length > 0) {
      const mergedClasses = Array.from(new Set([...kelasList, ...newClasses]));
      onUpdateProfile({
        ...profile,
        kelasList: mergedClasses,
        kelasAktif: importedStudents[0]?.kelas || profile.kelasAktif,
      });
    }

    // Save batch students
    onSaveSiswaBatch(importedStudents, replaceKelas);

    // Switch view to imported class
    if (importedStudents.length > 0 && importedStudents[0].kelas) {
      setSelectedClassFilter(importedStudents[0].kelas);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="dashboard-siswa-section">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Input Nama Kelas & Peserta Didik
            </h3>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              Rombel & Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Kelola nama kelas yang diampu, daftarkan siswa secara manual, atau <strong>impor cepat dari data yang tersimpan di Excel (.xlsx/.csv) dan MS Word (.docx)</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingSiswa(null);
              setIsSiswaFormOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Tambah Siswa Manual</span>
          </button>

          <button
            type="button"
            id="btn-import-excel-word"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel & MS Word</span>
          </button>

          <button
            type="button"
            onClick={() => downloadStudentTemplateExcel(selectedClassFilter !== 'SEMUA' ? selectedClassFilter : 'VII-A')}
            title="Unduh format tabel contoh Excel"
            className="px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center space-x-1 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Format Template</span>
          </button>
        </div>
      </div>

      {/* Kelas Navigation Strip & Quick Add */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto py-1 max-w-full">
          <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pilih Kelas:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedClassFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shrink-0 ${
              selectedClassFilter === 'SEMUA'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua Kelas ({siswaList.length})
          </button>

          {kelasList.map((k) => {
            const count = siswaList.filter((s) => s.kelas === k).length;
            const isFilterActive = selectedClassFilter === k;
            const isMainFocus = profile.kelasAktif === k;

            return (
              <div
                key={k}
                className={`inline-flex items-center rounded-lg border text-xs font-semibold transition-all shrink-0 ${
                  isFilterActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSetActiveClass(k)}
                  className="px-2.5 py-1.5 flex items-center space-x-1.5"
                >
                  <span>{k}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isFilterActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                  {isMainFocus && (
                    <span
                      title="Kelas Utama Guru"
                      className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                        isFilterActive ? 'bg-amber-400 text-slate-900' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      Utama
                    </span>
                  )}
                </button>

                {count === 0 && kelasList.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveClass(k);
                    }}
                    title={`Hapus kelas kosong ${k}`}
                    className={`px-1.5 py-1.5 transition-colors ${
                      isFilterActive ? 'hover:text-rose-200 text-white/70' : 'hover:text-rose-600 text-slate-400'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Inline Add Class Button */}
          {!isAddingClass ? (
            <button
              type="button"
              onClick={() => setIsAddingClass(true)}
              className="px-2.5 py-1.5 bg-white border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Kelas Baru</span>
            </button>
          ) : (
            <form onSubmit={handleAddNewClass} className="inline-flex items-center space-x-1.5 shrink-0 bg-white p-1 rounded-lg border border-indigo-400 shadow-2xs">
              <input
                type="text"
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                placeholder="Mis: VII-D"
                className="w-24 text-xs px-2 py-0.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden uppercase"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsAddingClass(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Class summary badge */}
        <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
          <span>
            Total: <strong>{currentClassStudents.length} Siswa</strong>
          </span>
          <span>•</span>
          <span className="text-sky-700 font-medium">L: {countL}</span>
          <span>•</span>
          <span className="text-rose-700 font-medium">P: {countP}</span>
        </div>
      </div>

      {/* Search and Table Control Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa berdasarkan nama atau NISN..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center space-x-2">
          <span>Menampilkan <strong>{filteredStudents.length}</strong> peserta didik</span>
        </div>
      </div>

      {/* Student List Table */}
      <div className="overflow-x-auto">
        {filteredStudents.length === 0 ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {searchQuery
                  ? 'Tidak ada siswa yang sesuai dengan pencarian'
                  : `Belum ada data peserta didik untuk ${selectedClassFilter === 'SEMUA' ? 'semua kelas' : `Kelas ${selectedClassFilter}`}`}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Periksa kembali kata kunci pencarian Anda.'
                  : 'Tambahkan data peserta didik sekarang secara manual atau unggah berkas Excel/MS Word yang sudah disiapkan sekolah.'}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSiswa(null);
                  setIsSiswaFormOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Excel & Word</span>
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Nama Lengkap Siswa</th>
                <th className="py-2.5 px-4 w-32">NIS / NISN</th>
                <th className="py-2.5 px-4 w-20 text-center">JK</th>
                <th className="py-2.5 px-4 w-24">Kelas</th>
                <th className="py-2.5 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((siswa, idx) => (
                <tr key={siswa.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-2 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-4 font-semibold text-slate-800">
                    {siswa.nama}
                    {siswa.isDemo && (
                      <span className="ml-2 px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">
                    {siswa.nisn || siswa.nis || '-'}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        siswa.jenisKelamin === 'L'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : siswa.jenisKelamin === 'P'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {siswa.jenisKelamin === 'L' ? 'L (Laki)' : siswa.jenisKelamin === 'P' ? 'P (Perempuan)' : '-'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                      {siswa.kelas}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="inline-flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSiswa(siswa);
                          setIsSiswaFormOpen(true);
                        }}
                        title="Edit data siswa"
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentToDelete(siswa)}
                        title="Hapus siswa"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Student Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Peserta Didik?</h4>
                <p className="text-[11px] text-slate-500">Konfirmasi penghapusan data</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus data peserta didik <strong>"{studentToDelete.nama}"</strong> dari Kelas {studentToDelete.kelas}?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSiswa}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportSiswaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        kelasList={kelasList}
        currentClass={selectedClassFilter !== 'SEMUA' ? selectedClassFilter : profile.kelasAktif || 'VII-A'}
        onImportSuccess={handleImportSuccess}
        onShowToast={onShowToast}
      />

      {/* Manual Student Add/Edit Modal */}
      <SiswaFormModal
        isOpen={isSiswaFormOpen}
        onClose={() => {
          setIsSiswaFormOpen(false);
          setEditingSiswa(null);
        }}
        kelasList={kelasList}
        currentClass={selectedClassFilter !== 'SEMUA' ? selectedClassFilter : profile.kelasAktif || 'VII-A'}
        initialData={editingSiswa}
        onSave={handleSaveSiswa}
      />
    </div>
  );
};
